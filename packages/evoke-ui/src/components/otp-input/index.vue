<template>
  <div
    class="ev-otp-input"
    :class="[sizeClass, { 'is-disabled': disabled, 'is-error': error }]"
    role="group"
    aria-label="验证码输入"
  >
    <input
      v-for="(ch, i) in chars"
      :key="i"
      :ref="(el) => setBoxRef(el, i)"
      class="ev-otp-input__box"
      type="text"
      :inputmode="type === 'number' ? 'numeric' : 'text'"
      :pattern="type === 'number' ? '[0-9]*' : undefined"
      :value="displayOf(i)"
      :disabled="disabled"
      :autocomplete="i === 0 && type === 'number' ? 'one-time-code' : 'off'"
      :aria-label="`验证码第 ${i + 1} 位`"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste(i, $event)"
    />
  </div>
</template>

<script setup>
/**
 * EvOtpInput — 验证码输入框（方框式 OTP）
 * N 个方框逐位输入，自动前进/后退；粘贴整段验证码自动分配到各位（含 iOS
 * one-time-code 自动填充经 input 事件进来的多字符）；type=number 只收数字、
 * type=text 收字母数字；masked 掩码显示。
 * 值语义：v-model 为各框字符按序拼接（未填框为空不占位）。
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'

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
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
  disabled: { type: Boolean, default: false },
  /** 错误态（红色边框） */
  error: { type: Boolean, default: false },
  /** 挂载后自动聚焦首个框 */
  autofocus: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change', 'complete'])

const chars = ref(emptyChars())
const boxRefs = ref([])

function setBoxRef(el, i) {
  boxRefs.value[i] = el
}

function emptyChars(len = props.length) {
  return Array.from({ length: len }, () => '')
}

const sizeClass = computed(() => {
  if (props.size === 'small') return 'ev-otp-input--small'
  if (props.size === 'large') return 'ev-otp-input--large'
  return ''
})

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
  if (props.disabled) {
    e.target.value = displayOf(i)
    return
  }
  const filtered = sanitize(e.target.value)
  if (!filtered) {
    e.target.value = displayOf(i)
    return
  }
  if (filtered.length > 1) {
    // 已填框内追加单字符（新值为「旧值+新字符」）：覆写当前框并前进；
    // 只有新增 ≥2 位（粘贴 / iOS 自动填充进空框）才整段分配
    if (filtered.length === 2 && chars.value[i] && filtered.startsWith(chars.value[i])) {
      const list = [...chars.value]
      list[i] = filtered[1]
      chars.value = list
      commit()
      if (i < props.length - 1) focus(i + 1)
      nextTick(syncBoxValues)
      return
    }
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
  if (props.disabled) return
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
  if (props.disabled) return
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
  const incoming = sanitize(props.modelValue).slice(0, props.length)
  if (incoming) {
    const list = emptyChars()
    incoming.split('').forEach((ch, i) => {
      list[i] = ch
    })
    chars.value = list
  }
  if (props.autofocus && !props.disabled) focus(0)
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
