<template>
  <div
    class="eb-rate eb-rate"
    :class="[sizeClass, { 'is-disabled': disabled, 'is-readonly': readonly }]"
    role="slider"
    :aria-valuenow="modelValue"
    :aria-valuetext="ariaText"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label"
    :tabindex="interactive ? 0 : undefined"
    @keydown="handleKeydown"
    @mouseleave="hoverValue = -1"
  >
    <span
      v-for="i in max"
      :key="i"
      class="eb-rate__item"
      @mousemove="handleMousemove(i, $event)"
      @click="handleClick(i)"
    >
      <i class="eb-rate__icon" :style="{ color: voidColor }">
        <eb-icon :name="voidIcon" :size="iconSize" />
      </i>
      <i
        v-if="isFilled(i)"
        class="eb-rate__icon eb-rate__icon--active"
        :class="{ 'eb-rate__icon--half': isHalf(i) }"
        :style="{ color: currentColor }"
      >
        <eb-icon :name="icon" :size="iconSize" />
      </i>
    </span>
    <span
      v-if="showText || showScore"
      class="eb-rate__text"
      :style="{ color: textColor }"
    >{{ displayText }}</span>
  </div>
</template>

<script setup>
/**
 * EbRate — 评分
 * 半星叠加渲染；颜色按 low/high 阈值三档取色（数组或 {阈值: 色} 对象）
 */
import { ref, computed } from 'vue'
import EbIcon from '../icon/index.vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  max: { type: Number, default: 5 },
  lowThreshold: { type: Number, default: 2 },
  highThreshold: { type: Number, default: 4 },
  colors: { type: [Array, Object], default: () => ['#F7BA2A', '#F7BA2A', '#F7BA2A'] },
  voidColor: { type: String, default: '#C6D1DE' },
  disabledColor: { type: String, default: '#C9CDD4' },
  icon: { type: String, default: 'star-filled' },
  voidIcon: { type: String, default: 'star-filled' },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  allowHalf: { type: Boolean, default: false },
  size: { type: String, default: 'default' },
  showText: { type: Boolean, default: false },
  showScore: { type: Boolean, default: false },
  textColor: { type: String, default: '#1F2D3D' },
  texts: { type: Array, default: () => ['Extremely bad', 'Bad', 'Normal', 'Good', 'Extremely good'] },
  scoreTemplate: { type: String, default: '{value}' },
  label: { type: String, default: 'rating' },
  clearable: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const hoverValue = ref(-1)

const interactive = computed(() => !props.disabled && !props.readonly)

// 展示值：hover 优先（预览），否则受控值
const displayValue = computed(() => {
  const v = hoverValue.value === -1 ? props.modelValue : hoverValue.value
  return Math.min(Math.max(v, 0), props.max)
})

const iconSize = computed(() => (props.size === 'large' ? 24 : props.size === 'small' ? 14 : 18))
const sizeClass = computed(() => (props.size === 'default' ? '' : `eb-rate--${props.size}`))

function isFilled(i) {
  return displayValue.value >= i || (props.allowHalf && displayValue.value >= i - 0.5)
}
function isHalf(i) {
  return props.allowHalf && displayValue.value === i - 0.5
}

// 阈值取色：数组按 [low, high, more] 三档；对象按 {阈值: 色} 升序取命中的最高档
const currentColor = computed(() => {
  const colors = props.colors
  const value = displayValue.value
  const disabledColor = props.disabled ? props.disabledColor : undefined
  if (Array.isArray(colors)) {
    const idx = value <= props.lowThreshold ? 0 : value <= props.highThreshold ? 1 : 2
    return disabledColor ?? colors[idx] ?? colors[colors.length - 1]
  }
  if (colors && typeof colors === 'object') {
    const thresholds = Object.keys(colors)
      .map(Number)
      .sort((a, b) => a - b)
      .filter((t) => value <= t)
    return disabledColor ?? colors[thresholds[0] ?? Object.keys(colors).length] ?? props.voidColor
  }
  return disabledColor ?? props.voidColor
})

// 半星判定：光标落在星宽左半 → 0.5
function handleMousemove(i, e) {
  if (!interactive.value) return
  if (!props.allowHalf) {
    hoverValue.value = i
    return
  }
  const target = e.currentTarget
  const rect = target.getBoundingClientRect()
  hoverValue.value = e.clientX - rect.left <= rect.width / 2 ? i - 0.5 : i
}

function handleClick(i) {
  if (!interactive.value) return
  let value = hoverValue.value === -1 ? i : hoverValue.value
  // 同值再点清零
  if (props.clearable && value === props.modelValue) value = 0
  commit(value)
}

function commit(value) {
  emit('update:modelValue', value)
  emit('change', value)
}

function handleKeydown(e) {
  if (!interactive.value) return
  const step = props.allowHalf ? 0.5 : 1
  let next = null
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(props.modelValue + step, props.max)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(props.modelValue - step, 0)
  if (next !== null) {
    e.preventDefault()
    commit(next)
  }
}

const displayText = computed(() => {
  if (props.showScore) return props.scoreTemplate.replace(/\{value\}/, String(props.modelValue))
  return props.texts[Math.ceil(displayValue.value) - 1] ?? ''
})

const ariaText = computed(() => (props.showText || props.showScore ? displayText.value : undefined))
</script>

<style src="./style.css"></style>
