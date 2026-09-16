<template>
  <div
    class="eb-otp-input"
    :class="[sizeClass, { 'is-disabled': isDisabled, 'is-error': isError }]"
    role="group"
    :aria-label="t('otp.groupLabel')"
  >
    <input
      v-for="(ch, i) in chars"
      :key="i"
      :ref="(el) => setBoxRef(el, i)"
      class="eb-otp-input__box"
      type="text"
      :inputmode="type === 'number' ? 'numeric' : 'text'"
      :pattern="type === 'number' ? '[0-9]*' : undefined"
      :value="displayOf(i)"
      :disabled="isDisabled"
      :autocomplete="i === 0 && type === 'number' ? 'one-time-code' : 'off'"
      :aria-label="boxLabel(i)"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste(i, $event)"
      @focus="focusedIndex = i"
      @blur="focusedIndex = -1"
    />
  </div>
</template>

<script setup>
/**
 * EbOtpInput — 验证码输入框（方框式 OTP）
 * N 个方框逐位输入，自动前进/后退；粘贴整段验证码自动分配到各位（含 iOS
 * one-time-code 自动填充经 input 事件进来的多字符）；type=number 只收数字、
 * type=text 收字母数字；masked 掩码显示；接入 Form 表单契约（size/disabled
 * 继承 + change 触发校验）。
 * 值语义：v-model 为各框字符按序拼接（未填框为空不占位）。
 */
import { computed, nextTick, onMounted, ref, toRef, watch } from 'vue'
import { triggerFormValidate, useFormItem, useSizeProp } from '../../composables/useFormItem'
import { useLocale } from '../../composables/useLocale'

const MASK_CHAR = '●'

const props = defineProps({
  /** 当前值（v-model）：各框字符按序拼接 */
  modelValue: { type: String, default: '' },
  /** 方框数量 */
  length: {
    type: Number,
    default: 6,
    validator: (v) => v >= 1 && v <= 10,
  },
  /** number 只收数字（移动端唤起数字键盘 + 首框 one-time-code）；text 收字母数字 */
  type: {
    type: String,
    default: 'number',
    validator: (v) => ['number', 'text'].includes(v),
  },
  /** 掩码显示（已填位显示 ●） */
  masked: { type: Boolean, default: false },
  size: useSizeProp,
  disabled: { type: Boolean, default: false },
  /** 错误态（红色边框），Form 校验失败也可由外部控制 */
  status: { type: String, default: '' },
  /** 挂载后自动聚焦首个空框 */
  autofocus: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change', 'complete'])

const { formItem } = useFormItem({
  size: toRef(props, 'size'),
  disabled: toRef(props, 'disabled'),
})

const { t } = useLocale()

const isDisabled = computed(() => props.disabled)
const isError = computed(() => props.status === 'error')

const sizeClass = computed(() => {
  const s = props.size || 'default'
  if (s === 'small') return 'eb-otp-input--small'
  if (s === 'large') return 'eb-otp-input--large'
  return ''
})

// ─── 框内字符状态 ───
function emptyChars(len = props.length) {
  return Array.from({ length: len }, () => '')
}
const chars = ref(emptyChars())
const focusedIndex = ref(-1)
const boxRefs = ref([])

function setBoxRef(el, i) {
  boxRefs.value[i] = el
}

/** 按类型过滤合法字符 */
function sanitize(text) {
  const source = String(text ?? '')
  const matched = props.type === 'number' ? source.match(/[0-9]/g) : source.match(/[0-9a-zA-Z]/g)
  return matched ? matched.join('') : ''
}

function displayOf(i) {
  const ch = chars.value[i]
  if (!ch) return ''
  return props.masked ? MASK_CHAR : ch
}

function boxLabel(i) {
  return String(t('otp.charLabel')).replace('{index}', String(i + 1))
}

function syncBoxValues() {
  boxRefs.value.forEach((el, i) => {
    if (el && el.value !== displayOf(i)) el.value = displayOf(i)
  })
}

function commit() {
  const value = chars.value.join('')
  if (value !== props.modelValue) {
    emit('update:modelValue', value)
    emit('change', value)
    triggerFormValidate(formItem, 'change')
  }
  if (chars.value.length && chars.value.every((c) => c !== '')) {
    emit('complete', value)
  }
}

function focus(index = 0) {
  const el = boxRefs.value[Math.max(0, Math.min(index, props.length - 1))]
  el?.focus?.()
}

/** 从 start 位起逐位分配整段字符，焦点落到最后填充的下一位 */
function distribute(start, text) {
  const list = [...chars.value]
  let k = 0
  for (; k < text.length && start + k < props.length; k++) {
    list[start + k] = text[k]
  }
  chars.value = list
  commit()
  focus(start + text.length)
  nextTick(syncBoxValues)
}

function onInput(i, e) {
  if (isDisabled.value) {
    e.target.value = displayOf(i)
    return
  }
  const filtered = sanitize(e.target.value)
  if (!filtered) {
    // 输入了非法字符：回写原值
    e.target.value = displayOf(i)
    return
  }
  if (filtered.length > 1) {
    // 自动填充 / 非标准路径进来的多字符，从当前位起分配
    distribute(i, filtered)
    return
  }
  const list = [...chars.value]
  list[i] = filtered
  chars.value = list
  commit()
  if (i < props.length - 1) focus(i + 1)
  nextTick(syncBoxValues)
}

function onKeydown(i, e) {
  if (isDisabled.value) return
  if (e.key === 'Backspace') {
    e.preventDefault()
    const list = [...chars.value]
    if (list[i]) {
      list[i] = ''
      chars.value = list
      commit()
    } else if (i > 0) {
      list[i - 1] = ''
      chars.value = list
      commit()
      focus(i - 1)
    }
    nextTick(syncBoxValues)
  } else if (e.key === 'ArrowLeft' && i > 0) {
    e.preventDefault()
    focus(i - 1)
  } else if (e.key === 'ArrowRight' && i < props.length - 1) {
    e.preventDefault()
    focus(i + 1)
  } else if (e.key === 'Home') {
    e.preventDefault()
    focus(0)
  } else if (e.key === 'End') {
    e.preventDefault()
    focus(props.length - 1)
  }
}

function onPaste(i, e) {
  if (isDisabled.value) return
  const text = e.clipboardData?.getData?.('text') ?? ''
  if (!text) return
  e.preventDefault()
  const filtered = sanitize(text)
  if (filtered) distribute(i, filtered)
}

// 外部值回显：与内部拼接不一致才重排（天然回显守卫）
watch(
  () => props.modelValue,
  (value) => {
    const incoming = sanitize(value).slice(0, props.length)
    if (incoming !== chars.value.join('')) {
      const list = emptyChars()
      incoming.split('').forEach((ch, i) => {
        list[i] = ch
      })
      chars.value = list
      nextTick(syncBoxValues)
    }
  },
)

// 框数变化：保留前缀重排
watch(
  () => props.length,
  () => {
    const list = emptyChars()
    chars.value.slice(0, props.length).forEach((ch, i) => {
      list[i] = ch
    })
    chars.value = list
    nextTick(syncBoxValues)
  },
)

onMounted(() => {
  // 初始值回显
  const incoming = sanitize(props.modelValue).slice(0, props.length)
  if (incoming) {
    const list = emptyChars()
    incoming.split('').forEach((ch, i) => {
      list[i] = ch
    })
    chars.value = list
  }
  if (props.autofocus && !isDisabled.value) focus(0)
})

function blur() {
  boxRefs.value.forEach((el) => el?.blur?.())
}

function clear() {
  chars.value = emptyChars()
  commit()
  nextTick(syncBoxValues)
}

defineExpose({ focus, blur, clear })
</script>

<style src="./style.css"></style>
