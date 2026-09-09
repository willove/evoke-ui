<template>
  <div
    class="ev-slider ev-slider"
    :class="{ 'is-vertical': vertical, 'ev-slider--with-input': showInput && !range && !vertical }"
    :aria-label="label || ariaLabel || undefined"
  >
    <!-- 数值输入（仅水平单值模式） -->
    <ev-input-number
      v-if="showInput && !range && !vertical"
      class="ev-slider__input"
      :model-value="firstValue"
      :step="step"
      :min="min"
      :max="max"
      :disabled="disabled"
      :controls="showInputControls"
      :size="inputSize === 'default' ? 'default' : inputSize"
      @change="commitSingle"
    />

    <div
      ref="runwayRef"
      class="ev-slider__runway"
      :class="{ 'show-input': showInput && !range && !vertical, 'is-disabled': disabled }"
      :style="runwayStyle"
      @mousedown="handleRunwayMousedown"
    >
      <div class="ev-slider__bar" :style="barStyle" />
      <!-- 步进挡点 -->
      <template v-if="showStops">
        <div
          v-for="stop in stops"
          :key="stop"
          class="ev-slider__stop"
          :style="stopStyle(stop)"
        />
      </template>
      <!-- marks -->
      <div v-if="hasMarks" class="ev-slider__marks">
        <div
          v-for="(mk, key) in marksList"
          :key="key"
          class="ev-slider__mark"
          :style="markPositionStyle(mk.value)"
        >
          <span class="ev-slider__mark-text" :style="mk.style">{{ mk.label }}</span>
        </div>
      </div>
      <!-- 拖拽手柄 -->
      <div
        v-for="(btn, bi) in thumbValues"
        :key="bi"
        class="ev-slider__button-wrapper"
        :class="{ 'is-dragging': draggingIndex === bi, hovering: hoveringIndex === bi }"
        :style="thumbStyle(bi)"
        role="slider"
        :aria-valuenow="btn"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-orientation="vertical ? 'vertical' : 'horizontal'"
        :tabindex="disabled ? -1 : 0"
        @mousedown="startDrag(bi, $event)"
        @mouseenter="hoveringIndex = bi"
        @mouseleave="hoveringIndex = -1"
        @focus="activeIndex = bi"
        @keydown="handleKeydown(bi, $event)"
      >
        <div v-if="tooltipVisibleFor(bi)" class="ev-slider__tooltip">
          <span class="ev-slider__tooltip-text">{{ formatTooltipValue(btn) }}</span>
        </div>
        <div class="ev-slider__button" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EvSlider — 滑块
 * 单值/区间双手柄、垂直模式、步进吸附、marks/show-stops、format-tooltip、show-input
 * 拖拽用 window 级 pointer 监听（事件上下文内挂载，Electron 安全）
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import EvInputNumber from '../input-number/index.vue'

const props = defineProps({
  modelValue: { type: [Number, Array], default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  range: { type: Boolean, default: false },
  vertical: { type: Boolean, default: false },
  height: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  showTooltip: { type: Boolean, default: true },
  formatTooltip: { type: Function, default: undefined },
  showInput: { type: Boolean, default: false },
  showInputControls: { type: Boolean, default: true },
  inputSize: { type: String, default: 'small' },
  showStops: { type: Boolean, default: false },
  marks: { type: Object, default: null },
  label: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  debounce: { type: Number, default: 300 },
})

const emit = defineEmits(['update:modelValue', 'input', 'change'])

const runwayRef = ref(null)
const draggingIndex = ref(-1)
const hoveringIndex = ref(-1)
const activeIndex = ref(0)

// 内部受控值（range 时 [first, second]）
const firstValue = ref(props.range ? (props.modelValue?.[0] ?? props.min) : (props.modelValue ?? props.min))
const secondValue = ref(props.range ? (props.modelValue?.[1] ?? props.max) : props.max)

watch(
  () => props.modelValue,
  (val) => {
    if (draggingIndex.value !== -1) return // 拖拽中不受控回写
    if (props.range) {
      firstValue.value = val?.[0] ?? props.min
      secondValue.value = val?.[1] ?? props.max
    } else {
      firstValue.value = val ?? props.min
    }
  },
)

const thumbValues = computed(() => (props.range ? [firstValue.value, secondValue.value] : [firstValue.value]))

// ─── 位置计算 ───
function percentOf(value) {
  const span = props.max - props.min
  if (span <= 0) return 0
  return ((value - props.min) / span) * 100
}

const barStyle = computed(() => {
  if (props.range) {
    const start = percentOf(firstValue.value)
    const end = percentOf(secondValue.value)
    return props.vertical
      ? { bottom: `${start}%`, height: `${end - start}%` }
      : { left: `${start}%`, width: `${end - start}%` }
  }
  return props.vertical
    ? { bottom: '0%', height: `${percentOf(firstValue.value)}%` }
    : { left: '0%', width: `${percentOf(firstValue.value)}%` }
})

function thumbStyle(index) {
  const p = percentOf(thumbValues.value[index])
  return props.vertical ? { bottom: `${p}%` } : { left: `${p}%` }
}

const runwayStyle = computed(() => (props.vertical && props.height ? { height: props.height } : {}))

function stopStyle(stop) {
  const p = percentOf(stop)
  return props.vertical ? { bottom: `${p}%` } : { left: `${p}%` }
}

// 步进挡点（不含首尾）
const stops = computed(() => {
  if (props.step <= 0) return []
  const list = []
  for (let v = props.min + props.step; v < props.max; v += props.step) list.push(v)
  return list
})

const hasMarks = computed(() => !!props.marks && Object.keys(props.marks).length > 0)
const marksList = computed(() =>
  Object.entries(props.marks ?? {}).map(([key, val]) => ({
    value: Number(key),
    label: typeof val === 'object' ? (val.label ?? key) : val,
    style: typeof val === 'object' ? val.style : undefined,
  })),
)
function markPositionStyle(value) {
  const p = percentOf(value)
  return props.vertical ? { bottom: `${p}%` } : { left: `${p}%` }
}

// ─── 值换算与提交 ───
function snap(value) {
  const snapped = Math.round((value - props.min) / props.step) * props.step + props.min
  const fixed = Number(snapped.toFixed(6))
  return Math.min(props.max, Math.max(props.min, fixed))
}

function eventToValue(e) {
  const rect = runwayRef.value?.getBoundingClientRect()
  if (!rect) return null
  let percent
  if (props.vertical) {
    percent = (rect.bottom - e.clientY) / (rect.height || 1)
  } else {
    percent = (e.clientX - rect.left) / (rect.width || 1)
  }
  return snap(props.min + Math.min(1, Math.max(0, percent)) * (props.max - props.min))
}

function setThumb(index, value) {
  if (props.range) {
    // 区间模式：两手柄互相不越过
    if (index === 0) firstValue.value = Math.min(value, secondValue.value)
    else secondValue.value = Math.max(value, firstValue.value)
  } else {
    firstValue.value = value
  }
}

function commit() {
  const next = props.range
    ? [firstValue.value, secondValue.value]
    : firstValue.value
  emit('update:modelValue', next)
  emit('change', next)
}

function emitInput() {
  emit('input', props.range ? [firstValue.value, secondValue.value] : firstValue.value)
}

// ─── 交互 ───
function handleRunwayMousedown(e) {
  if (props.disabled || e.button !== 0) return
  const value = eventToValue(e)
  if (value === null) return
  // 点击轨道：无 range 时单手柄；range 时选最近手柄
  let index = 0
  if (props.range) {
    const d0 = Math.abs(value - firstValue.value)
    const d1 = Math.abs(value - secondValue.value)
    index = d0 <= d1 ? 0 : 1
  }
  setThumb(index, value)
  activeIndex.value = index
  commit()
  emitInput()
  startDrag(index, e)
}

let onMove = null
let onUp = null

function startDrag(index, e) {
  if (props.disabled) return
  // 阻断冒泡到 runway 的点击落点逻辑（手柄拖拽不是轨道点击）
  e.stopPropagation()
  draggingIndex.value = index
  activeIndex.value = index
  e.preventDefault()

  onMove = (ev) => {
    const value = eventToValue(ev)
    if (value === null) return
    setThumb(draggingIndex.value, value)
    emitInput()
  }
  onUp = () => {
    commit()
    draggingIndex.value = -1
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    onMove = onUp = null
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
onBeforeUnmount(() => {
  onMove && window.removeEventListener('mousemove', onMove)
  onUp && window.removeEventListener('mouseup', onUp)
})

function handleKeydown(index, e) {
  if (props.disabled) return
  let delta = 0
  const big = (props.max - props.min) / 10
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      delta = props.step
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      delta = -props.step
      break
    case 'PageUp':
      delta = big
      break
    case 'PageDown':
      delta = -big
      break
    case 'Home':
      setThumb(index, props.min)
      commit()
      emitInput()
      e.preventDefault()
      return
    case 'End':
      setThumb(index, props.max)
      commit()
      emitInput()
      e.preventDefault()
      return
    default:
      return
  }
  e.preventDefault()
  setThumb(index, snap(thumbValues.value[index] + delta))
  commit()
  emitInput()
}

function commitSingle(val) {
  if (val === undefined || val === null) return
  setThumb(0, snap(Number(val)))
  commit()
  emitInput()
}

// tooltip：拖拽/悬停时显示
function tooltipVisibleFor(index) {
  if (!props.showTooltip) return false
  return draggingIndex.value === index || hoveringIndex.value === index
}
function formatTooltipValue(value) {
  return props.formatTooltip ? props.formatTooltip(value) : String(value)
}

// 实例方法：focus / blur 聚焦激活手柄
function focus() {
  runwayRef.value
    ?.querySelectorAll('.ev-slider__button-wrapper')
    ?.[activeIndex.value]?.focus?.()
}
function blur() {
  runwayRef.value
    ?.querySelectorAll('.ev-slider__button-wrapper')
    ?.[activeIndex.value]?.blur?.()
}

defineExpose({ focus, blur })
</script>

<style src="./style.css"></style>
