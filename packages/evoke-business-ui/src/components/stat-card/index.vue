<template>
  <div class="eb-stat-card">
    <div v-if="icon || $slots.icon" class="eb-stat-card__icon" :class="'eb-stat-card__icon--' + type">
      <slot name="icon">
        <eb-icon :name="icon" :size="20" />
      </slot>
    </div>
    <div class="eb-stat-card__info">
      <div class="eb-stat-card__label">
        <slot name="label">{{ label }}</slot>
      </div>
      <div class="eb-stat-card__value">
        <slot name="value">
          <span class="eb-stat-card__value-inner">{{ displayValue }}</span>
          <span v-if="suffix" class="eb-stat-card__suffix">{{ suffix }}</span>
        </slot>
      </div>
      <div
        v-if="trend != null || $slots.trend"
        class="eb-stat-card__trend"
        :class="trend > 0 ? 'eb-stat-card__trend--up' : 'eb-stat-card__trend--down'"
      >
        <slot name="trend" :trend="trend">
          <eb-icon :name="trend > 0 ? 'top' : 'bottom'" :size="12" />
          {{ Math.abs(trend) }}%
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbStatCard — 指标卡
 * countUp 数值滚动动画（easeOutExpo，rAF 在生命周期/事件内启动）；icon/label/value/trend 插槽
 */
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import EbIcon from '../icon/index.vue'

const props = defineProps({
  label: { type: String, default: '' },
  value: { type: [String, Number], default: undefined },
  icon: { type: String, default: '' },
  type: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'success', 'warning', 'danger', 'info'].includes(v),
  },
  trend: { type: Number, default: undefined },
  countUp: { type: Boolean, default: true },
  countDuration: { type: Number, default: 800 },
  suffix: { type: String, default: '' },
})

const displayValue = ref(props.value ?? 0)
let rafId = null

// 数值滚动动画：从 0 到目标值（easeOutExpo）
function animateCountUp(target, duration) {
  const startTime = performance.now()
  const isDecimal = target % 1 !== 0
  const decimals = isDecimal ? target.toString().split('.')[1]?.length || 0 : 0

  if (rafId !== null) cancelAnimationFrame(rafId)

  function tick(now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    const current = target * eased

    displayValue.value = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString()

    if (progress < 1) {
      rafId = requestAnimationFrame(tick)
    } else {
      displayValue.value = isDecimal ? target : target.toLocaleString()
      rafId = null
    }
  }

  rafId = requestAnimationFrame(tick)
}

watch(
  () => props.value,
  (newVal) => {
    if (newVal == null) {
      displayValue.value = 0
      return
    }
    const num = typeof newVal === 'number' ? newVal : parseFloat(newVal)
    if (isNaN(num)) {
      displayValue.value = newVal
      return
    }
    if (props.countUp) {
      animateCountUp(num, props.countDuration)
    } else {
      displayValue.value = typeof newVal === 'number' ? newVal.toLocaleString() : newVal
    }
  },
)

onMounted(() => {
  if (props.value != null && props.countUp) {
    nextTick(() => {
      const num = typeof props.value === 'number' ? props.value : parseFloat(props.value)
      if (!isNaN(num)) {
        displayValue.value = 0
        animateCountUp(num, props.countDuration)
      }
    })
  }
})
onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<style src="./style.css"></style>
