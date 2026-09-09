<template>
  <div class="ev-credits-progress" :class="'ev-credits-progress--' + size">
    <div v-if="refreshDate" class="ev-credits-progress__header">
      <span class="ev-credits-progress__header-label">{{ refreshLabel || '套餐内 Credits' }}将于 <strong>{{ refreshDate }}</strong> 刷新</span>
    </div>
    <div
      ref="fenceRef"
      class="ev-credits-progress__fence"
      :class="{ 'ev-credits-progress__fence--over': isOver }"
      :style="fenceStyle"
    >
      <span
        v-for="i in barCount"
        :key="i"
        class="ev-credits-progress__bar"
        :class="{ 'ev-credits-progress__bar--filled': i <= filledBars }"
      />
    </div>
    <div class="ev-credits-progress__footer">
      <span class="ev-credits-progress__used">
        <strong>{{ formatNum(used) }}</strong>
        <span class="ev-credits-progress__total">/ {{ formatNum(total) }}</span>
        <span class="ev-credits-progress__pct">{{ percent }}%</span>
      </span>
      <span class="ev-credits-progress__remain">
        剩余 <strong :class="{ 'ev-credits-progress__remain--warn': remainPercent < 20 }">{{ formatNum(remaining) }}</strong>
      </span>
    </div>
  </div>
</template>

<script setup>
/**
 * EvCreditsProgress — 额度条形进度
 * 栅格细条墙（按容器宽度自适应根数）+ 刷新日期头 + 用量/剩余脚注；超额转红
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  used: { type: Number, required: true },
  total: { type: Number, required: true },
  refreshDate: { type: String, default: '' },
  refreshLabel: { type: String, default: '套餐内 Credits' },
  maxBars: { type: Number, default: 200 },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
  gap: { type: Number, default: 1.5 },
  barWidth: { type: Number, default: 3 },
  barHeight: { type: Number, default: 0 },
  filledColor: { type: String, default: '' },
  emptyColor: { type: String, default: '' },
})

const fenceRef = ref(null)
const containerWidth = ref(0)
let ro = null

const barCount = computed(() => {
  if (containerWidth.value <= 0) return 0
  const count = Math.floor((containerWidth.value + props.gap) / (props.barWidth + props.gap))
  return Math.max(1, Math.min(count, props.maxBars))
})

const filledBars = computed(() => {
  if (props.total <= 0) return 0
  return Math.round((props.used / props.total) * barCount.value)
})

const percent = computed(() => {
  if (props.total <= 0) return 0
  return Math.round((props.used / props.total) * 100)
})

const remaining = computed(() => Math.max(0, props.total - props.used))
const remainPercent = computed(() => (props.total <= 0 ? 100 : (remaining.value / props.total) * 100))
const isOver = computed(() => props.used > props.total)

function formatNum(n) {
  return n.toLocaleString()
}

const fenceStyle = computed(() => {
  const style = {
    '--bar-gap': `${props.gap}px`,
    '--bar-filled': props.filledColor || 'var(--ev-color-primary)',
    '--bar-empty': props.emptyColor || 'var(--ev-border-color-lighter)',
  }
  if (barCount.value > 0) {
    style['grid-template-columns'] = `repeat(${barCount.value}, 1fr)`
  }
  if (props.barHeight) {
    style.height = `${props.barHeight}px`
  }
  return style
})

onMounted(() => {
  if (fenceRef.value) {
    containerWidth.value = fenceRef.value.clientWidth
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          containerWidth.value = entry.contentRect.width
        }
      })
      ro.observe(fenceRef.value)
    }
  }
})
onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})
</script>

<style src="./style.css"></style>
