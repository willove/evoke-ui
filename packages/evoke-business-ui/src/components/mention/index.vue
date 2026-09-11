<template>
  <div class="eb-mention eb-mention" :class="{ 'is-disabled': disabled }">
    <textarea
      ref="textareaRef"
      class="eb-mention__inner"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      @input="onInput"
      @keydown="onKeydown"
      @blur="onBlur"
    />
    <div
      v-if="panelVisible && filteredOptions.length"
      class="eb-mention__panel"
      :style="panelStyle"
      role="listbox"
    >
      <div
        v-for="(opt, i) in filteredOptions"
        :key="i"
        class="eb-mention__option"
        :class="{ 'is-highlight': i === highlightIndex }"
        role="option"
        :aria-selected="i === highlightIndex"
        @mousedown.prevent="select(opt)"
        @mouseenter="highlightIndex = i"
      >
        {{ typeof opt === 'string' ? opt : opt.value }}
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbMention — @提及输入框
 * 输入 prefix（默认 @）触发候选面板（镜像 div 测量光标坐标定位）；
 * ↑↓ 选择、Enter 确认、Esc 关闭；选中后以 `prefix + value + split` 回填
 */
import { computed, ref } from 'vue'
import { inBrowser } from '../../utils/dom'

defineOptions({ name: 'EbMention' })

const props = defineProps({
  modelValue: { type: String, default: '' },
  /** 候选：string[] 或 { value }[] */
  options: { type: Array, default: () => [] },
  /** 触发前缀 */
  prefix: { type: String, default: '@' },
  /** 选中后的分隔符 */
  split: { type: String, default: ' ' },
  placeholder: { type: String, default: '' },
  rows: { type: Number, default: 3 },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'search', 'select'])

const textareaRef = ref(null)
const panelVisible = ref(false)
const highlightIndex = ref(0)
const caretPos = ref({ x: 0, y: 0 })
let triggerStart = -1

const filteredOptions = computed(() => {
  const q = activeQuery.value.toLowerCase()
  return props.options.filter((opt) => {
    const v = String(typeof opt === 'string' ? opt : opt.value)
    return !q || v.toLowerCase().includes(q)
  })
})

const activeQuery = ref('')

const panelStyle = computed(() => ({
  left: `${caretPos.value.x}px`,
  top: `${caretPos.value.y}px`,
}))

/** 镜像 div 测量光标在 textarea 内的像素坐标 */
function measureCaret(pos) {
  const ta = textareaRef.value
  if (!ta || !inBrowser()) return { x: 0, y: 0 }
  const div = document.createElement('div')
  const style = getComputedStyle(ta)
  for (const key of [
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderWidth', 'boxSizing', 'width', 'whiteSpace', 'wordWrap',
  ]) {
    div.style[key] = style[key]
  }
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  div.style.wordWrap = 'break-word'
  div.textContent = ta.value.substring(0, pos)
  const span = document.createElement('span')
  span.textContent = ta.value.substring(pos) || '.'
  div.appendChild(span)
  document.body.appendChild(div)
  const point = { x: span.offsetLeft - ta.scrollLeft, y: span.offsetTop - ta.scrollTop }
  document.body.removeChild(div)
  return point
}

function detectTrigger() {
  const ta = textareaRef.value
  if (!ta) return false
  const pos = ta.selectionStart
  const before = ta.value.substring(0, pos)
  const idx = before.lastIndexOf(props.prefix)
  if (idx === -1) return false
  // 前缀必须是行首或前面是空白，中间不允许出现空白
  const prevChar = idx > 0 ? before[idx - 1] : '\n'
  const query = before.substring(idx + props.prefix.length)
  if (!/[\s\n]/.test(prevChar) && idx !== 0) return false
  if (/[\s\n]/.test(query)) return false
  activeQuery.value = query
  triggerStart = idx
  caretPos.value = measureCaret(idx + props.prefix.length)
  emit('search', query, props.prefix)
  return true
}

function onInput(e) {
  const value = e.target.value
  emit('update:modelValue', value)
  const hit = detectTrigger()
  panelVisible.value = hit
  if (hit) highlightIndex.value = 0
}

function onKeydown(e) {
  if (!panelVisible.value || !filteredOptions.value.length) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIndex.value = (highlightIndex.value + 1) % filteredOptions.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value =
      (highlightIndex.value - 1 + filteredOptions.value.length) % filteredOptions.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    select(filteredOptions.value[highlightIndex.value])
  } else if (e.key === 'Escape') {
    panelVisible.value = false
  }
}

function select(opt) {
  const ta = textareaRef.value
  if (!ta || triggerStart < 0) return
  const value = typeof opt === 'string' ? opt : opt.value
  const pos = ta.selectionStart
  const next =
    props.modelValue.substring(0, triggerStart) +
    props.prefix + value + props.split +
    props.modelValue.substring(pos)
  emit('update:modelValue', next)
  emit('select', opt)
  panelVisible.value = false
  triggerStart = -1
  requestAnimationFrame(() => {
    ta.focus()
    ta.setSelectionRange(next.length, next.length)
  })
}

function onBlur() {
  // 延迟关闭，给选项 mousedown 留时间
  setTimeout(() => {
    panelVisible.value = false
  }, 120)
}

defineExpose({
  /** 外部主动触发一次触发检测 */
  refresh: detectTrigger,
})
</script>

<style src="./style.css"></style>
