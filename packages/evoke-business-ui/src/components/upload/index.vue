<template>
  <div class="ev-upload ev-upload">
    <!-- 触发区（隐藏 input 覆盖其上：绝对定位 + opacity 0） -->
    <div
      ref="triggerRef"
      class="ev-upload__trigger"
      :class="{
        'ev-upload--text': !drag && listType !== 'picture-card',
        'ev-upload--picture-card': !drag && listType === 'picture-card',
        'is-disabled': disabled,
      }"
      tabindex="0"
      role="button"
      :aria-disabled="disabled || undefined"
      @click="handleClick"
      @keydown.enter="handleClick"
      @dragover.prevent="dragActive = true"
      @dragleave.prevent="dragActive = false"
      @drop.prevent="handleDrop"
    >
      <template v-if="drag">
        <div class="ev-upload-dragger" :class="{ 'is-dragover': dragActive }">
          <slot name="trigger">
            <ev-icon name="upload-filled" :size="40" />
            <div class="ev-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </slot>
        </div>
      </template>
      <template v-else>
        <slot name="trigger">
          <ev-icon v-if="listType === 'picture-card'" name="plus" :size="16" color="var(--ev-text-color-secondary)" />
          <template v-else>选择文件</template>
        </slot>
      </template>
      <input
        ref="inputRef"
        type="file"
        class="ev-upload__input"
        :name="name"
        :multiple="multiple"
        :accept="accept"
        :disabled="disabled || undefined"
        @change="handleInputChange"
      >
    </div>

    <!-- 文件列表 -->
    <ul v-if="showFileList && fileList.length" class="ev-upload-list" :class="`ev-upload-list--${listType}`">
      <li
        v-for="file in fileList"
        :key="file.uid"
        class="ev-upload-list__item"
        :class="[`is-${file.status}`, listType === 'picture-card' ? 'ev-upload-list__item--card' : '']"
      >
        <div class="ev-upload-list__item-info">
          <ev-icon :name="file.status === 'success' ? 'document-checked' : 'document'" :size="14" />
          <a
            class="ev-upload-list__item-name"
            href="javascript:;"
            @click="emit('preview', file)"
          >{{ file.name }}</a>
          <button
            type="button"
            class="ev-upload-list__item-close"
            aria-label="移除文件"
            @click="handleRemove(file)"
          >
            <ev-icon name="close" :size="12" />
          </button>
        </div>
        <div v-if="file.status === 'uploading'" class="ev-upload-list__item-progress">
          <div class="ev-upload-list__item-progress-inner" :style="{ width: `${file.percentage ?? 0}%` }" />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
/**
 * EvUpload — 文件上传
 * 隐藏 input 绝对定位 opacity:0 覆盖触发区；XHR 直传 action（FormData: name 字段）；
 * limit 超限发 exceed；autoUpload=false 时用 expose.submit 手动提交
 */
import { ref, computed, toRef } from 'vue'
import EvIcon from '../icon/index.vue'
import { useFormItem } from '../../composables/useFormItem'

const props = defineProps({
  action: { type: String, default: '' },
  headers: { type: Object, default: () => ({}) },
  data: { type: Object, default: () => ({}) },
  name: { type: String, default: 'file' },
  multiple: { type: Boolean, default: false },
  limit: { type: Number, default: undefined },
  disabled: { type: Boolean, default: false },
  drag: { type: Boolean, default: false },
  autoUpload: { type: Boolean, default: true },
  listType: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'picture', 'picture-card'].includes(v),
  },
  showFileList: { type: Boolean, default: true },
  accept: { type: String, default: '' },
  fileList: { type: Array, default: undefined },
  beforeUpload: { type: Function, default: undefined },
})

const emit = defineEmits([
  'update:fileList',
  'change',
  'remove',
  'success',
  'error',
  'exceed',
  'preview',
])

const { disabled: formDisabled } = useFormItem({ disabled: toRef(props, 'disabled') })
const isDisabled = computed(() => formDisabled.value || props.disabled)

const inputRef = ref(null)
const triggerRef = ref(null)
const dragActive = ref(false)

let uidSeed = 0

// 内部维护列表；受控 fileList prop 优先
const innerFiles = ref(props.fileList ? [...props.fileList] : [])
const fileList = computed(() => props.fileList ?? innerFiles.value)

function syncFileList(next) {
  innerFiles.value = next
  emit('update:fileList', next)
}

function handleClick() {
  if (isDisabled.value) return
  inputRef.value?.click()
}

function handleDrop(e) {
  if (isDisabled.value) return
  dragActive.value = false
  if (props.drag) {
    handleFiles(e.dataTransfer?.files)
  }
}

function handleInputChange(e) {
  handleFiles(e.target.files)
  // 允许重复选择同一文件
  e.target.value = ''
}

function handleFiles(rawFiles) {
  if (isDisabled.value || !rawFiles?.length) return
  let files = Array.from(rawFiles)
  if (props.limit !== undefined && fileList.value.length + files.length > props.limit) {
    emit('exceed', files, fileList.value)
    return
  }
  for (const raw of files) {
    const file = {
      uid: ++uidSeed,
      name: raw.name,
      size: raw.size,
      status: 'ready',
      percentage: 0,
      raw,
    }
    const next = [...fileList.value, file]
    syncFileList(next)
    emitChange(file, next)
    if (props.autoUpload) uploadFile(file)
  }
}

async function uploadFile(file) {
  if (props.beforeUpload) {
    let result
    try {
      result = await props.beforeUpload(file.raw)
    } catch {
      result = false
    }
    if (result === false) return
  }
  file.status = 'uploading'
  file.percentage = 0
  emitChange(file, fileList.value)

  const xhr = new XMLHttpRequest()
  const formData = new FormData()
  formData.append(props.name, file.raw)
  for (const [k, v] of Object.entries(props.data ?? {})) {
    formData.append(k, v)
  }

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      file.percentage = Math.round((e.loaded / e.total) * 100)
    }
  }
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      file.status = 'success'
      file.response = xhr.response
      emit('success', xhr.response, file, fileList.value)
    } else {
      file.status = 'fail'
      emit('error', new Error(`HTTP ${xhr.status}`), file, fileList.value)
    }
    emitChange(file, fileList.value)
  }
  xhr.onerror = () => {
    file.status = 'fail'
    emit('error', new Error('network error'), file, fileList.value)
    emitChange(file, fileList.value)
  }
  xhr.open('POST', props.action, true)
  for (const [k, v] of Object.entries(props.headers ?? {})) {
    xhr.setRequestHeader(k, v)
  }
  xhr.send(formData)
  file._xhr = xhr
}

function emitChange(file, list) {
  emit('change', file, list)
}

function handleRemove(file) {
  const next = fileList.value.filter((f) => f.uid !== file.uid)
  syncFileList(next)
  emit('remove', file, next)
}

// ─── 实例方法 ───
function submit() {
  for (const f of fileList.value) {
    if (f.status === 'ready') uploadFile(f)
  }
}
function clearFiles() {
  syncFileList([])
}
function abort(file) {
  if (file?._xhr) file._xhr.abort()
}

defineExpose({ submit, clearFiles, abort, handleRemove })
</script>

<style src="./style.css"></style>
