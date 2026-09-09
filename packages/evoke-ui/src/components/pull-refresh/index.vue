<template>
  <div ref="rootRef" class="ew-pull-refresh">
    <div class="ew-pull-refresh__track" :style="trackStyle">
      <div class="ew-pull-refresh__head" :style="{ height: `${headHeight}px`, top: `${-headHeight - 1}px` }">
        <slot name="head" :status="status" :distance="distance">
          <div :class="['ew-pull-refresh__text', `is-${status}`]">
            <span v-if="status === 'loading'" class="ew-pull-refresh__spinner" />
            <span>{{ statusText }}</span>
          </div>
        </slot>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * EwPullRefresh — 下拉刷新
 * 触屏下拉手势：顶部下拉 → 释放触发 refresh（v-model 同步 loading 态 → 置 false 收尾）。
 * 滚动容器不在顶部时不拦截手势；超出触发距离后阻尼跟手。
 * 状态机：normal → pulling（未到阈值）→ loosing（释放即刷新）→ loading → success → normal
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getScrollParent, getScrollTop } from '../../utils/scroll'

defineOptions({ name: 'EwPullRefresh' })

const props = defineProps({
  /** 刷新中状态（v-model）：置 true 进入 loading，加载完成置 false 自动展示成功态后收回 */
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  /** 触发刷新的下拉距离（px），同时是头部高度 */
  headHeight: { type: Number, default: 50 },
  /** 成功态停留时长（ms），0 表示直接收回 */
  successDuration: { type: Number, default: 500 },
  animationDuration: { type: Number, default: 300 },
  pullingText: { type: String, default: '下拉刷新' },
  loosingText: { type: String, default: '释放刷新' },
  loadingText: { type: String, default: '加载中…' },
  successText: { type: String, default: '刷新成功' },
})

const emit = defineEmits(['update:modelValue', 'refresh', 'change'])

const rootRef = ref(null)
const distance = ref(0)
const localStatus = ref('normal') // normal | pulling | loosing | success
const touching = ref(false)

const status = computed(() => (props.modelValue ? 'loading' : localStatus.value))

const statusText = computed(
  () =>
    ({
      normal: props.pullingText,
      pulling: props.pullingText,
      loosing: props.loosingText,
      loading: props.loadingText,
      success: props.successText,
    })[status.value] ?? ''
)

const trackStyle = computed(() => ({
  transition: touching.value
    ? 'none'
    : `transform ${props.animationDuration}ms var(--ew-ease-smooth)`,
  transform: `translate3d(0, ${distance.value}px, 0)`,
}))

watch(status, (val, old) => {
  emit('change', val, old)
})

watch(
  () => props.modelValue,
  (val, old) => {
    if (!val && old) {
      // 刷新结束：短暂展示成功态后收回
      localStatus.value = 'success'
      distance.value = props.headHeight
      if (props.successDuration > 0) {
        setTimeout(() => {
          localStatus.value = 'normal'
          distance.value = 0
        }, props.successDuration)
      } else {
        localStatus.value = 'normal'
        distance.value = 0
      }
    }
  }
)

// ─── 触摸/鼠标手势（move 需非 passive 才能 preventDefault 阻断浏览器下拉） ───
let startY = 0
let allowPull = false

function getTouch(e) {
  return (
    e.touches?.[0] ??
    e.changedTouches?.[0] ??
    // 鼠标事件兜底：文档站/桌面浏览器可用鼠标拖动体验下拉
    (e.clientY != null ? { clientY: e.clientY } : undefined)
  )
}

function onTouchStart(e) {
  if (props.disabled || props.modelValue) return
  const t = getTouch(e)
  if (!t) return
  startY = t.clientY
  allowPull = getScrollTop(getScrollParent(rootRef.value)) <= 0
}

function onTouchMove(e) {
  if (props.disabled || props.modelValue || !allowPull) return
  const t = getTouch(e)
  if (!t) return
  const deltaY = t.clientY - startY
  if (deltaY <= 0) {
    distance.value = 0
    localStatus.value = 'normal'
    return
  }
  e.preventDefault()
  touching.value = true
  // 过阈值后 1/3 阻尼跟手，形成「越拉越紧」的手感
  distance.value =
    deltaY <= props.headHeight
      ? deltaY
      : props.headHeight + (deltaY - props.headHeight) / 3
  localStatus.value = distance.value < props.headHeight ? 'pulling' : 'loosing'
}

function onTouchEnd() {
  if (!allowPull) return
  allowPull = false
  touching.value = false
  if (localStatus.value === 'loosing') {
    distance.value = props.headHeight
    emit('update:modelValue', true)
    emit('refresh')
  } else {
    distance.value = 0
    localStatus.value = 'normal'
  }
}

// ─── 鼠标拖动（桌面/文档演示）：按住内容区下拉等同触摸 ───
function onMouseDown(e) {
  if (e.button !== 0) return
  onTouchStart(e)
  if (!allowPull) return
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
function onMouseMove(e) {
  onTouchMove(e)
}
function onMouseUp() {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  onTouchEnd()
}

onMounted(() => {
  const el = rootRef.value
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
  el.addEventListener('touchend', onTouchEnd, { passive: true })
  el.addEventListener('touchcancel', onTouchEnd, { passive: true })
  el.addEventListener('mousedown', onMouseDown)
})

onBeforeUnmount(() => {
  const el = rootRef.value
  el?.removeEventListener('touchstart', onTouchStart)
  el?.removeEventListener('touchmove', onTouchMove)
  el?.removeEventListener('touchend', onTouchEnd)
  el?.removeEventListener('touchcancel', onTouchEnd)
  el?.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

defineExpose({
  /** 当前状态 */
  status,
  /** 当前下拉距离 */
  distance,
})
</script>

<style src="./style.css"></style>
