<template>
  <div
    class="eb-progress eb-progress"
    :class="[`eb-progress--${type}`, { 'is-text-inside': textInside }]"
    role="progressbar"
    :aria-valuenow="percentage"
    :aria-valuemin="0"
    :aria-valuemax="100"
  >
    <div v-if="type === 'line'" class="eb-progress-bar">
      <div
        class="eb-progress-bar__outer"
        :style="{ height: `${strokeWidth ?? 6}px` }"
      >
        <div
          class="eb-progress-bar__inner"
          :class="statusClass"
          :style="barStyle"
        >
          <span v-if="textInside && showText && percentage >= 12" class="eb-progress-bar__innerText">
            {{ percentage }}%
          </span>
        </div>
      </div>
    </div>
    <div v-else class="eb-progress-circle" :style="{ height: `${circleSize}px`, width: `${circleSize}px` }">
      <svg viewBox="0 0 100 100">
        <circle
          class="eb-progress-circle__track"
          cx="50"
          cy="50"
          :r="trackR"
          fill="none"
          :stroke-width="relativeStroke"
          :style="{ strokeDasharray: trackDasharray, strokeDashoffset: trackOffset }"
        />
        <circle
          class="eb-progress-circle__path"
          :class="statusClass"
          cx="50"
          cy="50"
          :r="trackR"
          fill="none"
          :stroke-width="relativeStroke"
          :style="{ strokeDasharray: trackDasharray, strokeDashoffset: pathOffset, stroke: resolvedColor }"
        />
      </svg>
    </div>
    <div v-if="showText && !textInside" class="eb-progress__text" :class="statusClass">
      <slot name="text" :percentage="percentage">
        <span>{{ textContent }}</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
/**
 * EbProgress — 进度条（line / circle / dashboard 三种形态）
 */
import { computed } from 'vue'

defineOptions({ name: 'EbProgress' })

const props = defineProps({
  percentage: {
    type: Number,
    default: 0,
    validator: (v) => v >= 0 && v <= 100,
  },
  type: {
    type: String,
    default: 'line',
    validator: (v) => ['line', 'circle', 'dashboard'].includes(v),
  },
  strokeWidth: { type: Number, default: undefined },
  status: {
    type: String,
    default: '',
    validator: (v) => ['success', 'exception', 'warning', ''].includes(v),
  },
  showText: { type: Boolean, default: true },
  textInside: { type: Boolean, default: false },
  /** circle 直径 */
  width: { type: Number, default: 126 },
  color: { type: [String, Function], default: undefined },
  duration: { type: Number, default: 0.3 },
})

const clampedPercentage = computed(() => Math.max(0, Math.min(100, props.percentage)))

const statusClass = computed(() =>
  props.status ? `is-${props.status}` : ''
)

const textContent = computed(() => `${clampedPercentage.value}%`)

const resolvedColor = computed(() => {
  if (props.color) {
    if (typeof props.color === 'function') return props.color(clampedPercentage.value)
    return props.color
  }
  if (props.status === 'success') return 'var(--eb-color-success)'
  if (props.status === 'exception') return 'var(--eb-color-danger)'
  if (props.status === 'warning') return 'var(--eb-color-warning)'
  return 'var(--eb-color-primary)'
})

const barStyle = computed(() => ({
  width: `${clampedPercentage.value}%`,
  background: resolvedColor.value,
  transition: `width ${props.duration}s ease`,
}))

// ─── circle/dashboard ───
const circleSize = computed(() => props.width)
const relativeStroke = computed(() =>
  ((props.strokeWidth ?? 6) / props.width) * 100
)

const trackR = computed(() => (props.type === 'dashboard' ? 45 : 50 - relativeStroke.value / 2 - 1))

const perimeter = computed(() => 2 * Math.PI * trackR.value)

const trackDasharray = computed(() => `${perimeter.value}px, ${perimeter.value}px`)
const trackOffset = computed(() => (props.type === 'dashboard' ? perimeter.value * 0.75 : 0))

const pathOffset = computed(() => {
  const progress = clampedPercentage.value / 100
  // stroke-dashoffset 仅接受单值：多值声明非法，浏览器会整条丢弃（圆环恒满）
  if (props.type === 'dashboard') {
    const arc = perimeter.value * 0.75
    return `${arc - arc * progress}px`
  }
  return `${perimeter.value * (1 - progress)}px`
})
</script>

<style src="./style.css"></style>
