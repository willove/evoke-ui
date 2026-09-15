<template>
  <div class="ev-ai-prompt-box">
    <!-- 模型选择 pill（输入台上方居中） -->
    <div v-if="models.length" ref="modelBarRef" class="ev-ai-prompt-box__model-bar">
      <button
        type="button"
        class="ev-ai-prompt-box__model-pill"
        aria-haspopup="menu"
        :aria-expanded="modelMenuOpen"
        :disabled="disabled"
        @click="modelMenuOpen = !modelMenuOpen"
      >
        <span class="ev-ai-prompt-box__model-label">{{ currentModel?.label || model || '模型' }}</span>
        <ev-icon name="chevron-down" :size="12" :class="{ 'is-open': modelMenuOpen }" />
      </button>
      <Transition name="ev-ai-prompt-box-menu">
        <ul v-if="modelMenuOpen" class="ev-ai-prompt-box__model-menu" role="menu" aria-label="选择模型">
          <li v-for="m in models" :key="m.key" role="none">
            <button
              type="button"
              class="ev-ai-prompt-box__model-item"
              :class="{ 'is-active': m.key === model }"
              role="menuitemradio"
              :aria-checked="m.key === model"
              @click="pickModel(m)"
            >
              <span>{{ m.label }}</span>
              <ev-icon v-if="m.key === model" name="check" :size="14" />
            </button>
          </li>
        </ul>
      </Transition>
    </div>

    <!-- 输入台：focus 时渐变描边点亮 -->
    <div
      class="ev-ai-prompt-box__board"
      :class="{ 'is-focus': focused, 'is-disabled': disabled }"
      @click="focusInput"
    >
      <div v-if="activeSceneObj || attachments.length" class="ev-ai-prompt-box__chips-row">
        <span v-if="activeSceneObj" class="ev-ai-prompt-box__scene-tag">
          <ev-icon v-if="activeSceneObj.icon" :name="activeSceneObj.icon" :size="12" />
          <span>{{ activeSceneObj.label }}</span>
          <ev-icon
            class="ev-ai-prompt-box__tag-close"
            name="close"
            :size="12"
            @click.stop="clearScene"
          />
        </span>
        <span
          v-for="file in attachments"
          :key="file.__id"
          class="ev-ai-prompt-box__scene-tag ev-ai-prompt-box__scene-tag--file"
        >
          <span>{{ file.name }}</span>
          <ev-icon
            v-if="!disabled"
            class="ev-ai-prompt-box__tag-close"
            name="close"
            :size="12"
            @click.stop="removeAttachment(file)"
          />
        </span>
      </div>

      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="ev-ai-prompt-box__textarea"
        :placeholder="placeholder"
        :disabled="disabled"
        rows="2"
        @keydown="handleKeydown"
        @focus="focused = true"
        @blur="focused = false"
        @input="autoResize"
      />

      <div class="ev-ai-prompt-box__toolbar">
        <div class="ev-ai-prompt-box__toolbar-left">
          <template v-if="allowAttachments">
            <button
              type="button"
              class="ev-ai-prompt-box__tool-btn"
              aria-label="添加附件"
              :disabled="disabled || attachments.length >= maxAttachments"
              @click.stop="triggerFileUpload"
            >
              <ev-icon name="plus" :size="16" />
            </button>
            <input
              ref="fileInputRef"
              type="file"
              class="ev-ai-prompt-box__file-input"
              :multiple="maxAttachments > 1"
              @change="handleFileSelect"
            />
          </template>
          <button
            v-for="cap in capabilities"
            :key="cap.key"
            type="button"
            class="ev-ai-prompt-box__tool-btn ev-ai-prompt-box__capability"
            :class="{ 'is-active': activeCapabilities.includes(cap.key) }"
            :aria-pressed="activeCapabilities.includes(cap.key)"
            :disabled="disabled"
            @click.stop="toggleCapability(cap)"
          >
            <ev-icon v-if="cap.icon" :name="cap.icon" :size="14" />
            <span>{{ cap.label }}</span>
          </button>
          <button
            v-if="showSettings"
            type="button"
            class="ev-ai-prompt-box__tool-btn"
            aria-label="设置"
            :disabled="disabled"
            @click.stop="emit('settings-click')"
          >
            <span class="ev-ai-prompt-box__settings-glyph" aria-hidden="true">
              <i /><i /><i />
            </span>
          </button>
          <slot name="toolbar-extra" />
        </div>
        <div class="ev-ai-prompt-box__toolbar-right">
          <span v-if="showWordCount && maxLength" class="ev-ai-prompt-box__word-count">
            {{ inputText.length }}/{{ maxLength }}
          </span>
          <button
            v-if="quota != null"
            type="button"
            class="ev-ai-prompt-box__quota"
            @click.stop="emit('quota-click')"
          >
            <ev-icon name="wallet" :size="14" />
            <span>{{ quotaLabel }}</span>
          </button>
          <button
            type="button"
            class="ev-ai-prompt-box__send"
            :class="{ 'is-stop': isStopping }"
            :aria-label="isStopping ? '停止生成' : '发送'"
            :disabled="disabled || (!isStopping && !canSend)"
            @click.stop="onSendClick"
          >
            <ev-icon v-if="!isStopping" name="arrow-up" :size="16" />
            <span v-else class="ev-ai-prompt-box__stop-square" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <!-- 场景 chips 行 -->
    <div v-if="scenes.length" class="ev-ai-prompt-box__scenes" role="group" aria-label="场景">
      <button
        v-for="sc in scenes"
        :key="sc.key"
        type="button"
        class="ev-ai-prompt-box__scene-chip"
        :class="{ 'is-active': sc.key === scene }"
        :aria-pressed="sc.key === scene"
        :disabled="disabled"
        @click="pickScene(sc)"
      >
        <ev-icon v-if="sc.icon" :name="sc.icon" :size="14" />
        <span>{{ sc.label }}</span>
      </button>
      <slot name="scenes-append" />
    </div>
  </div>
</template>

<script setup>
/**
 * EvAiPromptBox — AI 输入台（官网/产品站首屏入口形态）
 * 场景 chips + 模型 pill + 能力开关 + 额度 + 发送/停止；设计向组件，
 * 不含会话流：send 交出完整上下文（{ text, scene, capabilities, model, attachments }），
 * 模型调用与会话编排由使用方承接。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EvIcon from '../icon/index.vue'

defineOptions({ name: 'EvAiPromptBox' })

const props = defineProps({
  /** 输入文本 */
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '今天你想创造什么？' },
  disabled: { type: Boolean, default: false },
  /** 请求进行中（配合 stoppable 显示停止钮） */
  loading: { type: Boolean, default: false },
  /** 场景定义 [{ key, label, icon? }] */
  scenes: { type: Array, default: () => [] },
  /** 当前场景 key（v-model:scene） */
  scene: { type: String, default: '' },
  /** 能力开关定义 [{ key, label, icon? }]（图标名需在 evoke-ui 图标集内） */
  capabilities: { type: Array, default: () => [] },
  /** 激活的能力 key 集合（update:activeCapabilities） */
  activeCapabilities: { type: Array, default: () => [] },
  /** 模型注册表 [{ key, label }]；非空时输入台上方显示模型 pill */
  models: { type: Array, default: () => [] },
  /** 当前模型 key（v-model:model） */
  model: { type: String, default: '' },
  /** 额度展示：'剩余免费额度：100%' 或 { label, percent }；null 不渲染 */
  quota: { type: [String, Object], default: null },
  /** 设置按钮（emit settings-click） */
  showSettings: { type: Boolean, default: false },
  allowAttachments: { type: Boolean, default: true },
  maxAttachments: { type: Number, default: 5 },
  maxLength: { type: Number, default: 2000 },
  showWordCount: { type: Boolean, default: false },
  maxRows: { type: Number, default: 8 },
  sendOnEnter: { type: Boolean, default: true },
  /** loading 时发送钮切换为停止钮（emit stop；AbortController 由使用方自持） */
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
const quotaLabel = computed(() =>
  typeof props.quota === 'string' ? props.quota : props.quota?.label ?? ''
)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== inputText.value) {
      inputText.value = val
      queueMicrotask(autoResize)
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

// ─── 模型菜单（轻量外点关闭） ───
const currentModel = computed(() => props.models.find((m) => m.key === props.model) || null)

function pickModel(m) {
  modelMenuOpen.value = false
  if (m.key === props.model) return
  emit('update:model', m.key)
  emit('model-change', m.key)
}

function onDocPointerDown(e) {
  if (modelBarRef.value && !modelBarRef.value.contains(e.target)) {
    modelMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', onDocPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocPointerDown))

// ─── 附件 ───
let attachSeq = 0

function triggerFileUpload() {
  fileInputRef.value?.click?.()
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files || [])
  for (const file of files) {
    if (attachments.value.length >= props.maxAttachments) break
    attachments.value.push({ __id: ++attachSeq, file, name: file.name })
  }
  e.target.value = ''
}

function removeAttachment(item) {
  attachments.value = attachments.value.filter((a) => a !== item)
}

// ─── 输入与发送 ───
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
  if (e.key === 'Escape' && modelMenuOpen.value) {
    e.preventDefault()
    modelMenuOpen.value = false
    return
  }
  if (e.key === 'Enter' && !e.shiftKey && props.sendOnEnter) {
    e.preventDefault()
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
  if (props.disabled || props.loading || !canSend.value) return
  emit('send', {
    text: inputText.value.trim(),
    scene: props.scene,
    capabilities: [...props.activeCapabilities],
    model: props.model,
    attachments: attachments.value.map((a) => a.file),
  })
  inputText.value = ''
  attachments.value = []
  queueMicrotask(autoResize)
}

defineExpose({
  focus: focusInput,
  clear: () => {
    inputText.value = ''
    attachments.value = []
    queueMicrotask(autoResize)
  },
})
</script>

<style src="./style.css"></style>
