<template>
  <Teleport to="body">
    <template v-if="active && currentTargetRect">
      <!-- 聚光高亮：挖洞靠超大 box-shadow 外扩遮罩 -->
      <div class="eb-tour__mask" :style="maskStyle" @click.self="onMaskClick" />
      <div class="eb-tour__card" :style="cardStyle" role="dialog" aria-modal="true">
        <div class="eb-tour__header">
          <span class="eb-tour__title">
            <slot name="title" :step="currentStep" :index="current">{{ currentStep.title }}</slot>
          </span>
          <button class="eb-tour__close" type="button" aria-label="关闭引导" @click="skip">
            <eb-icon name="close" :size="14" />
          </button>
        </div>
        <div class="eb-tour__body">
          <slot :step="currentStep" :index="current">{{ currentStep.description }}</slot>
        </div>
        <div class="eb-tour__footer">
          <span class="eb-tour__indicator">{{ current + 1 }} / {{ steps.length }}</span>
          <div class="eb-tour__actions">
            <eb-button v-if="current > 0" size="small" @click="prev">上一步</eb-button>
            <eb-button v-if="current < steps.length - 1" size="small" type="primary" @click="next">
              下一步
            </eb-button>
            <eb-button v-else size="small" type="primary" @click="finish">完成</eb-button>
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>

<script setup>
/**
 * EbTour — 新手引导
 *
 * v-model 当前步骤索引（-1 表示未开启 / 已关闭）；
 * steps: [{ target: selector|Element, title, description, placement? }]
 * 聚光遮罩 = 高亮框超大 box-shadow；滚动/resize 自动跟随重算
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { inBrowser } from '../../utils/dom'
import EbIcon from '../icon/index.vue'
import EbButton from '../button/index.vue'

defineOptions({ name: 'EbTour' })

const props = defineProps({
  /** 步骤定义 */
  steps: { type: Array, default: () => [] },
  /** 当前步骤（v-model），-1 关闭 */
  modelValue: { type: Number, default: -1 },
  /** 高亮框四周留白 */
  gap: { type: Number, default: 8 },
  /** 遮罩颜色 */
  maskColor: { type: String, default: 'rgba(0, 0, 0, 0.5)' },
  /** 点击遮罩跳过引导 */
  closeOnMask: { type: Boolean, default: false },
  zIndex: { type: Number, default: 3000 },
  /** 键盘：Esc 跳过、←→ 步进 */
  keyboard: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'change', 'finish', 'skip'])

const current = computed(() => props.modelValue)
const active = computed(() => current.value >= 0 && current.value < props.steps.length)
const currentStep = computed(() => props.steps[current.value] || {})

const currentTargetRect = ref(null)

function resolveEl(step) {
  if (!step?.target || !inBrowser()) return null
  if (typeof step.target === 'string') return document.querySelector(step.target)
  return step.target instanceof Element ? step.target : null
}

function measure() {
  if (!active.value) {
    currentTargetRect.value = null
    return
  }
  const el = resolveEl(currentStep.value)
  if (!el) {
    currentTargetRect.value = null
    return
  }
  el.scrollIntoView({ block: 'center', behavior: 'instant' })
  const r = el.getBoundingClientRect()
  currentTargetRect.value = { top: r.top, left: r.left, width: r.width, height: r.height }
}

watch(
  () => [props.modelValue, props.steps],
  () => {
    measure()
    if (active.value) emit('change', current.value)
  },
  { immediate: true, deep: false },
)

const maskStyle = computed(() => {
  const r = currentTargetRect.value
  if (!r) return { display: 'none' }
  return {
    zIndex: props.zIndex,
    boxShadow: `0 0 0 9999px ${props.maskColor}`,
    top: `${r.top - props.gap}px`,
    left: `${r.left - props.gap}px`,
    width: `${r.width + props.gap * 2}px`,
    height: `${r.height + props.gap * 2}px`,
  }
})

const cardStyle = computed(() => {
  const r = currentTargetRect.value
  const cardW = 320
  const cardGap = 12
  if (!r) return { display: 'none' }
  const vw = window.innerWidth
  const vh = window.innerHeight
  // 默认在目标下方，下方空间不足则放上方
  const below = r.top + r.height + cardGap
  const above = r.top - cardGap
  const top = below + 180 <= vh ? below : Math.max(12, above - 180)
  let left = r.left
  if (left + cardW > vw - 12) left = vw - cardW - 12
  if (left < 12) left = 12
  return { zIndex: props.zIndex, top: `${top}px`, left: `${left}px`, width: `${cardW}px` }
})

function show(index) {
  emit('update:modelValue', index)
}
function next() {
  if (current.value < props.steps.length - 1) show(current.value + 1)
  else finish()
}
function prev() {
  if (current.value > 0) show(current.value - 1)
}
function finish() {
  emit('finish')
  show(-1)
}
function skip() {
  emit('skip')
  show(-1)
}
function onMaskClick() {
  if (props.closeOnMask) skip()
}

function onKeydown(e) {
  if (!active.value || !props.keyboard) return
  if (e.key === 'Escape') skip()
  else if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}

let rafId = 0
function scheduleMeasure() {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(measure)
}

onMounted(() => {
  if (!inBrowser()) return
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', scheduleMeasure, { passive: true })
  window.addEventListener('scroll', scheduleMeasure, { passive: true, capture: true })
})
onBeforeUnmount(() => {
  if (!inBrowser()) return
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', scheduleMeasure)
  window.removeEventListener('scroll', scheduleMeasure, { capture: true })
  cancelAnimationFrame(rafId)
})

defineExpose({ next, prev, skip, finish })
</script>

<style src="./style.css"></style>
