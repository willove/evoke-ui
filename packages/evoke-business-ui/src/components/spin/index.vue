<template>
  <Teleport v-if="fullscreen" to="body">
    <Transition name="ev-spin-fade">
      <div v-if="visible" class="ev-spin ev-spin--fullscreen">
        <div class="ev-spin__overlay" />
        <div class="ev-spin__content">
          <div :class="spinnerClasses" :style="spinnerStyle">
            <slot name="indicator">
              <div class="ev-spin__dot-container">
                <span v-for="i in 4" :key="i" class="ev-spin__dot" />
              </div>
            </slot>
          </div>
          <div v-if="description || slots.description" class="ev-spin__description">
            <slot name="description">{{ description }}</slot>
          </div>
          <div v-if="percent !== undefined && percent !== null" class="ev-spin__progress">
            <div class="ev-spin__progress-bar">
              <div class="ev-spin__progress-inner" :style="{ width: progressWidth }" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div v-else-if="hasSlotContent" class="ev-spin-wrapper ev-spin-wrapper--nested">
    <Transition name="ev-spin-fade">
      <div v-if="spinning && visible" class="ev-spin ev-spin--nested">
        <div class="ev-spin__overlay" />
        <div class="ev-spin__content">
          <div :class="spinnerClasses" :style="spinnerStyle">
            <slot name="indicator">
              <div class="ev-spin__dot-container">
                <span v-for="i in 4" :key="i" class="ev-spin__dot" />
              </div>
            </slot>
          </div>
          <div v-if="description || slots.description" class="ev-spin__description">
            <slot name="description">{{ description }}</slot>
          </div>
          <div v-if="percent !== undefined && percent !== null" class="ev-spin__progress">
            <div class="ev-spin__progress-bar">
              <div class="ev-spin__progress-inner" :style="{ width: progressWidth }" />
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 内容区域 -->
    <div :class="['ev-spin__container', { 'ev-spin__container--blur': spinning && visible }]">
      <slot />
    </div>
  </div>

  <div v-else class="ev-spin ev-spin--standalone">
    <div :class="spinnerClasses" :style="spinnerStyle">
      <slot name="indicator">
        <div class="ev-spin__dot-container">
          <span v-for="i in 4" :key="i" class="ev-spin__dot" />
        </div>
      </slot>
    </div>
    <div v-if="description || slots.description" class="ev-spin__description">
      <slot name="description">{{ description }}</slot>
    </div>
    <div v-if="percent !== undefined && percent !== null" class="ev-spin__progress">
      <div class="ev-spin__progress-bar">
        <div class="ev-spin__progress-inner" :style="{ width: progressWidth }" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EvSpin — 加载指示器
 * 三种模式：fullscreen / 包裹模式 / 独立使用
 */
import { computed, ref, watch, onMounted, onBeforeUnmount, useSlots } from 'vue'

defineOptions({ name: 'EvSpin' })

const props = defineProps({
  /** 是否为加载中状态 */
  spinning: { type: Boolean, default: true },
  /** 组件大小 */
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
  /** 延迟显示加载效果的时间（防止闪烁） */
  delay: { type: Number, default: 0 },
  /** 自定义描述文案 */
  description: { type: String, default: '' },
  /** 全屏模式 */
  fullscreen: { type: Boolean, default: false },
  /** 展示进度 */
  percent: { type: [Number, String], default: undefined },
})

const slots = useSlots()
const hasSlotContent = computed(() => !!slots.default)
const visible = ref(!props.delay || !props.spinning ? props.spinning : false)
let delayTimer = null

watch(
  () => props.spinning,
  (val) => {
    if (delayTimer) {
      clearTimeout(delayTimer)
      delayTimer = null
    }
    if (val && props.delay > 0) {
      delayTimer = setTimeout(() => {
        visible.value = true
      }, props.delay)
    } else {
      visible.value = val
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.spinning && props.delay > 0) {
    visible.value = false
    delayTimer = setTimeout(() => {
      visible.value = true
    }, props.delay)
  }
})

onBeforeUnmount(() => {
  if (delayTimer) clearTimeout(delayTimer)
})

const spinnerClasses = computed(() => [
  'ev-spin__spinner',
  `ev-spin__spinner--${props.size}`,
])

const spinnerStyle = computed(() => {
  const sizeMap = { small: 20, default: 32, large: 44 }
  const s = sizeMap[props.size] || sizeMap.default
  return { '--spin-size': `${s}px` }
})

const progressWidth = computed(() => {
  if (props.percent === 'auto') return '95%'
  if (typeof props.percent === 'number') return `${Math.min(100, Math.max(0, props.percent))}%`
  return '0%'
})
</script>

<style src="./style.css"></style>
