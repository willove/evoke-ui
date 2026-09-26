<template>
  <div class="eb-ai-prompt-box">
    <!-- 模型选择 pill（输入台上方居中） -->
    <div v-if="models.length" ref="modelBarRef" class="eb-ai-prompt-box__model-bar">
      <button
        type="button"
        class="eb-ai-prompt-box__model-pill"
        aria-haspopup="menu"
        :aria-expanded="modelMenuOpen"
        :disabled="disabled"
        @click="modelMenuOpen = !modelMenuOpen"
      >
        <eb-icon :name="currentModel?.icon || 'magic'" :size="14" />
        <span class="eb-ai-prompt-box__model-label">{{ currentModel?.label || model || modelFallbackLabel }}</span>
        <eb-icon name="swap" :size="12" />
      </button>
      <Transition name="eb-ai-prompt-box-menu">
        <ul v-if="modelMenuOpen" class="eb-ai-prompt-box__model-menu" role="menu" :aria-label="modelMenuLabel">
          <li v-for="m in models" :key="m.key" role="none">
            <button
              type="button"
              class="eb-ai-prompt-box__model-item"
              :class="{ 'is-active': m.key === model }"
              role="menuitemradio"
              :aria-checked="m.key === model"
              @click="pickModel(m)"
            >
              <eb-icon v-if="m.icon" :name="m.icon" :size="14" />
              <span>{{ m.label }}</span>
              <eb-icon v-if="m.key === model" name="check" :size="14" />
            </button>
          </li>
        </ul>
      </Transition>
    </div>

    <!-- 输入台 -->
    <div
      class="eb-ai-prompt-box__board"
      :class="{ 'is-focus': focused, 'is-disabled': disabled, 'is-dragover': dragOver }"
      @click="focusInput"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragEnter"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div v-if="dragOver" class="eb-ai-prompt-box__drop-hint" aria-hidden="true">{{ dropLabel }}</div>
      <!-- 台内顶部：场景 tag + 附件 -->
      <div v-if="activeSceneObj || attachments.length" class="eb-ai-prompt-box__chips-row">
        <span v-if="activeSceneObj" class="eb-tag eb-tag--primary eb-tag--light eb-ai-prompt-box__scene-tag">
          <eb-icon v-if="activeSceneObj.icon" :name="activeSceneObj.icon" :size="12" />
          <span>{{ activeSceneObj.label }}</span>
          <eb-icon
            class="eb-ai-prompt-box__scene-tag-close"
            name="close"
            :size="12"
            @click.stop="clearScene"
          />
        </span>
        <span
          v-for="file in attachments"
          :key="file.__id"
          class="eb-tag eb-tag--info eb-tag--light eb-ai-prompt-box__file-tag"
          :class="{ 'is-error': file.status === 'error' }"
          :title="file.status === 'error' ? (file.error || failedLabel) : undefined"
        >
          <eb-icon :name="file.status === 'error' ? 'warning-filled' : 'attachment'" :size="12" />
          <span>{{ file.name }}</span>
          <span v-if="file.status === 'uploading'" class="eb-ai-prompt-box__file-state">{{ file.progress ?? 0 }}%</span>
          <span v-else-if="file.status === 'error'" class="eb-ai-prompt-box__file-state eb-ai-prompt-box__file-state--error">{{ file.error || failedLabel }}</span>
          <eb-icon
            v-if="!disabled"
            class="eb-ai-prompt-box__scene-tag-close"
            name="close"
            :size="12"
            @click.stop="removeAttachment(file)"
          />
        </span>
      </div>

      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="eb-ai-prompt-box__textarea"
        :placeholder="placeholderText"
        :disabled="disabled"
        :maxlength="maxLength"
        rows="2"
        :aria-label="placeholderText"
        @keydown="handleKeydown"
        @focus="focused = true"
        @blur="focused = false"
        @input="autoResize"
        @paste="onPaste"
      />

      <!-- 底部工具行 -->
      <div class="eb-ai-prompt-box__toolbar">
        <div class="eb-ai-prompt-box__toolbar-left">
          <template v-if="allowAttachments">
            <button
              type="button"
              class="eb-ai-prompt-box__tool-btn"
              :aria-label="attachLabel"
              :disabled="disabled || attachments.length >= maxAttachments"
              @click.stop="triggerFileUpload"
            >
              <eb-icon name="plus" :size="16" />
            </button>
            <input
              ref="fileInputRef"
              type="file"
              class="eb-ai-prompt-box__file-input"
              :multiple="maxAttachments > 1"
              :accept="accept || undefined"
              @change="handleFileSelect"
            />
          </template>
          <button
            v-for="cap in capabilities"
            :key="cap.key"
            type="button"
            class="eb-ai-prompt-box__tool-btn eb-ai-prompt-box__capability"
            :class="{ 'is-active': activeCapabilities.includes(cap.key) }"
            :aria-pressed="activeCapabilities.includes(cap.key)"
            :disabled="disabled"
            @click.stop="toggleCapability(cap)"
          >
            <eb-icon v-if="cap.icon" :name="cap.icon" :size="14" />
            <span>{{ cap.label }}</span>
          </button>
          <button
            v-if="showSettings"
            type="button"
            class="eb-ai-prompt-box__tool-btn"
            :aria-label="settingsLabel"
            :disabled="disabled"
            @click.stop="emit('settings-click')"
          >
            <eb-icon name="filter" :size="14" />
          </button>
          <slot name="toolbar-extra" />
        </div>
        <div class="eb-ai-prompt-box__toolbar-right">
          <span v-if="showWordCount && maxLength" class="eb-ai-prompt-box__word-count">
            {{ inputText.length }}/{{ maxLength }}
          </span>
          <button
            v-if="quota != null"
            type="button"
            class="eb-ai-prompt-box__quota"
            @click.stop="emit('quota-click')"
          >
            <eb-icon name="wallet" :size="14" />
            <span>{{ quotaLabel }}</span>
          </button>
          <button
            type="button"
            class="eb-ai-prompt-box__send"
            :class="{ 'is-stop': isStopping }"
            :aria-label="isStopping ? stopLabel : sendLabel"
            :disabled="disabled || (!isStopping && !canSend)"
            @click.stop="onSendClick"
          >
            <eb-icon :name="isStopping ? 'stop' : 'arrow-up'" :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- 场景 chips 行（台外下方） -->
    <div v-if="scenes.length" class="eb-ai-prompt-box__scenes" role="group" :aria-label="scenesLabel">
      <button
        v-for="sc in scenes"
        :key="sc.key"
        type="button"
        class="eb-ai-prompt-box__scene-chip"
        :class="{ 'is-active': sc.key === scene }"
        :aria-pressed="sc.key === scene"
        :disabled="disabled"
        @click="pickScene(sc)"
      >
        <eb-icon v-if="sc.icon" :name="sc.icon" :size="14" />
        <span>{{ sc.label }}</span>
      </button>
      <slot name="scenes-append" />
    </div>
  </div>
</template>

<script setup>
/**
 * EbAiPromptBox — AI 输入台
 * 场景 chips + 模型 pill + 能力开关 + 额度 + 发送/停止的聚合输入台；
 * 不内置任何请求：send 只交出完整上下文，transport 由使用方注入
 * （流式回写可配合 useChatEngine）。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import EbIcon from "@wil-works/evoke-business-ui/icon"
import { useClickOutside } from "@wil-works/evoke-business-ui"
import { validateAttachment, filesFromDataTransfer } from '../../utils/files'
import { isImeComposing } from "@wil-works/evoke-business-ui"
import { useChatLabels } from '../chatbot/labels'

defineOptions({ name: 'EbAiPromptBox' })

const labels = useChatLabels()

const props = defineProps({
  /** 输入文本 */
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: void 0 },
  disabled: { type: Boolean, default: false },
  /** 请求进行中（配合 stoppable 显示停止钮） */
  loading: { type: Boolean, default: false },
  /** 生成中是否允许继续投递（交给引擎入队等下一轮）；关掉则生成中拦下 */ 
  queueable: { type: Boolean, default: false },
  /** 场景定义 [{ key, label, icon? }] */
  scenes: { type: Array, default: () => [] },
  /** 当前场景 key（v-model:scene） */
  scene: { type: String, default: '' },
  /** 能力开关定义 [{ key, label, icon? }]（深度思考 / 联网搜索等词汇表由使用方定） */
  capabilities: { type: Array, default: () => [] },
  /** 激活的能力 key 集合（update:activeCapabilities） */
  activeCapabilities: { type: Array, default: () => [] },
  /** 模型注册表 [{ key, label, icon? }]；非空时输入台上方显示模型 pill */
  models: { type: Array, default: () => [] },
  /** 当前模型 key（v-model:model） */
  model: { type: String, default: '' },
  /** 额度展示：'剩余免费额度：100%' 或 { label, percent }；null 不渲染 */
  quota: { type: [String, Object], default: null },
  /** 设置按钮（emit settings-click） */
  showSettings: { type: Boolean, default: false },
  allowAttachments: { type: Boolean, default: true },
  maxAttachments: { type: Number, default: 5 },
  /** 附件类型白名单（.ext / mime/* / mime/type，逗号分隔）；拖拽与粘贴同样按它校验 */
  accept: { type: String, default: '' },
  /** 单个附件字节上限，0 为不限 */
  maxFileSize: { type: Number, default: 0 },
  /** 允许拖拽与粘贴投递 */
  allowDrop: { type: Boolean, default: true },
  /** 文本长度上限；未传不限制（绑定 textarea maxlength，字数统计同源） */
  maxLength: { type: Number, default: undefined },
  showWordCount: { type: Boolean, default: false },
  maxRows: { type: Number, default: 8 },
  sendOnEnter: { type: Boolean, default: true },
  /** loading 时发送钮切换为停止钮（emit stop；AbortController 由 transport 自持） */
  stoppable: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'update:scene',
  'update:activeCapabilities',
  'update:model',
  'send',
  'stop',
  'scene-change',
  'capability-change',
  'model-change',
  'quota-click',
  'settings-click',
  'attachment-add',
  'attachment-reject',
])

const textareaRef = ref(null)
const fileInputRef = ref(null)
const modelBarRef = ref(null)
const focused = ref(false)
const inputText = ref(props.modelValue)
const attachments = ref([])
const modelMenuOpen = ref(false)

const isStopping = computed(() => props.loading && props.stoppable)
const canSend = computed(() => inputText.value.trim().length > 0 || attachments.value.length > 0)

// 文案取语言包（认 EbConfigProvider 的 locale）；带参可传的几条宿主优先
const placeholderText = computed(() => props.placeholder ?? labels.promptBox.placeholder)
const attachLabel = computed(() => labels.sender.attach)
const settingsLabel = computed(() => labels.promptBox.settings)
const sendLabel = computed(() => labels.sender.send)
const stopLabel = computed(() => labels.sender.stop)
const scenesLabel = computed(() => labels.promptBox.scenes)
const modelMenuLabel = computed(() => labels.promptBox.modelMenu)
const modelFallbackLabel = computed(() => labels.promptBox.model)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== inputText.value) {
      inputText.value = val
      nextTick(autoResize)
    }
  }
)

watch(inputText, (val) => {
  emit('update:modelValue', val)
})

// ─── 场景 ───
const activeSceneObj = computed(() => props.scenes.find((s) => s.key === props.scene) || null)

function pickScene(sc) {
  const next = sc.key === props.scene ? '' : sc.key
  emit('update:scene', next)
  emit('scene-change', next)
}

function clearScene() {
  emit('update:scene', '')
  emit('scene-change', '')
}

// ─── 能力开关 ───
function toggleCapability(cap) {
  const next = props.activeCapabilities.includes(cap.key)
    ? props.activeCapabilities.filter((k) => k !== cap.key)
    : [...props.activeCapabilities, cap.key]
  emit('update:activeCapabilities', next)
  emit('capability-change', next, cap.key)
}

// ─── 模型 ───
const currentModel = computed(() => props.models.find((m) => m.key === props.model) || null)

function pickModel(m) {
  modelMenuOpen.value = false
  if (m.key === props.model) return
  emit('update:model', m.key)
  emit('model-change', m.key)
}

const { stop: stopModelOutside } = useClickOutside([modelBarRef], () => {
  modelMenuOpen.value = false
}, true)
onBeforeUnmount(stopModelOutside)

// ─── 附件 ───
let attachSeq = 0
const dragOver = ref(false)
let dragDepth = 0
const dropLabel = computed(() => labels.sender.dropHint)
const failedLabel = computed(() => labels.attachments.failed)

function triggerFileUpload() {
  fileInputRef.value?.click?.()
}
function onDragEnter() {
  if (!props.allowDrop || props.disabled) return
  dragDepth += 1
  dragOver.value = true
}
function onDragLeave() {
  if (!props.allowDrop) return
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragOver.value = false
}
function onDrop(e) {
  dragDepth = 0
  dragOver.value = false
  if (!props.allowDrop || props.disabled) return
  addFiles(e.dataTransfer?.files)
}
function onPaste(e) {
  if (!props.allowDrop || props.disabled) return
  const files = filesFromDataTransfer(e.clipboardData)
  // 有文件才拦默认行为，纯文本粘贴照常进输入框
  if (files.length) {
    e.preventDefault()
    addFiles(files)
  }
}
/** 三条投递路径（选文件 / 拖拽 / 粘贴）共用一套校验，宿主自己发请求 */
function addFiles(files) {
  if (!files?.length) return
  for (const file of Array.from(files)) {
    if (attachments.value.length >= props.maxAttachments) {
      emit('attachment-reject', file, 'limit')
      continue
    }
    const reason = validateAttachment(file, { accept: props.accept, maxFileSize: props.maxFileSize })
    if (reason) {
      emit('attachment-reject', file, reason)
      continue
    }
    attachments.value.push({ __id: ++attachSeq, file, name: file.name, size: file.size, status: 'ready' })
    // 交出数组里的响应式代理而非闭包中的原始对象：宿主回写 status / progress
    // 必须能驱动 chip 更新，给原始对象等于这条 API 静默失效
    emit('attachment-add', file, attachments.value[attachments.value.length - 1])
  }
}
function handleFileSelect(e) {
  addFiles(e.target.files)
  e.target.value = ''
}

function removeAttachment(item) {
  attachments.value = attachments.value.filter((a) => a !== item)
}

// ─── 输入与发送 ───
const quotaLabel = computed(() =>
  typeof props.quota === 'string' ? props.quota : props.quota?.label ?? ''
)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  const lineHeight = 22
  const paddingY = 8
  const minH = lineHeight * 2 + paddingY
  const maxH = props.maxRows * lineHeight + paddingY
  el.style.height = 'auto'
  const h = Math.min(Math.max(el.scrollHeight, minH), maxH)
  el.style.height = `${h}px`
  el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden'
}

function focusInput() {
  if (props.disabled) return
  textareaRef.value?.focus?.()
}

function handleKeydown(e) {
  // 输入法组字中的 Enter / Esc 属于候选词操作，不是发送或关闭菜单
  if (isImeComposing(e)) return
  if (e.key === 'Escape' && modelMenuOpen.value) {
    e.preventDefault()
    modelMenuOpen.value = false
    return
  }
  if (e.key === 'Enter' && !e.shiftKey && props.sendOnEnter) {
    e.preventDefault()
    // 生成中：可排队时照常发出（引擎会入队），否则既不并发投递也不触中断
    if (props.loading && !props.queueable) return
    doSend()
  }
}

function onSendClick() {
  if (isStopping.value) {
    emit('stop')
    return
  }
  doSend()
}

function doSend() {
  if (props.disabled || !canSend.value) return
  if (props.loading && !props.queueable) return
  emit('send', {
    text: inputText.value.trim(),
    scene: props.scene,
    capabilities: [...props.activeCapabilities],
    model: props.model,
    attachments: attachments.value.map((a) => a.file),
  })
  inputText.value = ''
  attachments.value = []
  nextTick(autoResize)
}

defineExpose({
  focus: focusInput,
  /** 供编排层在发送后清空输入（Console 内部已处理，独立使用一般不需要） */
  clear: () => {
    inputText.value = ''
    attachments.value = []
    nextTick(autoResize)
  },
})
</script>

<style src="./style.css"></style>
