<template>
  <div ref="rootRef" :class="['ev-statistic', `is-${align}`]">
    <div class="ev-statistic__value">
      <!-- 定宽占位：以最终值的宽度撑住容器，滚动过程中布局零位移（防左右抖动） -->
      <span v-if="animated && sizerText" class="ev-statistic__sizer" aria-hidden="true">{{ sizerText }}</span>
      <span class="ev-statistic__num"><slot name="value">{{ shown }}</slot></span>
    </div>
    <div v-if="label || $slots.label" class="ev-statistic__label">
      <slot name="label">{{ label }}</slot>
    </div>
  </div>
</template>

<script setup>
/**
 * EvStatistic — 数据指标（GitHub Star 数 / 下载量等社会证明位）
 * animated 开启后：数值在进入视口时从 0 缓动滚动到目标值
 * （自动解析「前缀 + 数字 + 后缀」：¥120.5 / 99.99% / 1,200+；无法解析的纯文案直接显示）
 */
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { onInView } from '../../composables/useInView'

const props = defineProps({
  value: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  align: {
    type: String,
    default: 'left',
    validator: (v) => ['left', 'center'].includes(v),
  },
  /** 数值四舍五入到指定小数位（仅数字时生效） */
  precision: { type: Number, default: undefined },
  /** 进入视口时数字从 0 滚动到目标值 */
  animated: { type: Boolean, default: false },
  /** 滚动时长 ms */
  duration: { type: Number, default: 1600 },
})

const rootRef = ref(null)
const animatedText = ref('')
let cleanup = null
// 滚动代次号：value 变更时自增使进行中的 tick 失效（rAF 与定时器兜底统一处理）
let runId = 0

const parts = computed(() => {
  const raw = String(props.value ?? '')
  const m = raw.match(/^(\D*?)([\d,]*\.?[\d]+)(.*)$/)
  if (!m) return null
  const num = Number(m[2].replace(/,/g, ''))
  if (!Number.isFinite(num)) return null
  const decimals = props.precision != null ? props.precision : (m[2].split('.')[1] || '').length
  const useGrouping = m[2].includes(',')
  return { prefix: m[1], num, suffix: m[3], decimals, useGrouping }
})

const displayValue = computed(() => {
  const n = Number(props.value)
  if (props.value === '' || !Number.isFinite(n)) return props.value
  return props.precision != null ? n.toFixed(props.precision) : String(props.value)
})

const shown = computed(() => animatedText.value || displayValue.value)

// 占位宽度以最终值计；自定义 value 插槽时内容不可知，不启用占位
const slots = useSlots()
const sizerText = computed(() => {
  if (!props.animated || !parts.value || slots.value) return ''
  const p = parts.value
  return p.prefix + format(p.num, p.decimals, p.useGrouping) + p.suffix
})

function format(num, decimals, useGrouping) {
  return useGrouping
    ? num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : num.toFixed(decimals)
}

function start() {
  const p = parts.value
  if (!p) return
  const run = ++runId
  const raf = typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : (cb) => setTimeout(() => cb(performance.now()), 16)
  const startAt = performance.now()
  // easeOutExpo：起步迅猛、收尾徐缓，比 cubic 系更有"仪表盘感"
  const eased = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
  const tick = (now) => {
    if (run !== runId) return
    const t = Math.min(1, (now - startAt) / props.duration)
    if (t < 1) {
      animatedText.value = p.prefix + format(p.num * eased(t), p.decimals, p.useGrouping) + p.suffix
      raf(tick)
    } else {
      animatedText.value = p.prefix + format(p.num, p.decimals, p.useGrouping) + p.suffix
    }
  }
  raf(tick)
}

// value 动态更新：终止进行中的滚动并清掉终帧，让 displayValue 接管新值
watch(
  () => props.value,
  () => {
    runId += 1
    animatedText.value = ''
  },
)

onMounted(() => {
  if (!props.animated || !parts.value) return
  cleanup = onInView(rootRef.value, () => start(), () => start())
})

onBeforeUnmount(() => cleanup?.())
</script>

<style src="./style.css"></style>
