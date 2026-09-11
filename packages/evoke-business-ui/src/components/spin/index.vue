<template>
  <Teleport v-if="fullscreen" to="body">
    <Transition name="eb-spin-fade">
      <div v-if="visible" class="eb-spin eb-spin--fullscreen">
        <div class="eb-spin__overlay" />
        <div class="eb-spin__content">
          <div :class="spinnerClasses" :style="spinnerStyle">
            <slot name="indicator">
              <div class="eb-spin__dot-container">
                <span v-for="i in 4" :key="i" class="eb-spin__dot" />
              </div>
            </slot>
          </div>
          <div v-if="description || slots.description" class="eb-spin__description">
            <slot name="description">{{ description }}</slot>
          </div>
          <div v-if="percent !== undefined && percent !== null" class="eb-spin__progress">
            <div class="eb-spin__progress-bar">
              <div class="eb-spin__progress-inner" :style="{ width: progressWidth }" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div v-else-if="hasSlotContent" class="eb-spin-wrapper eb-spin-wrapper--nested">
    <Transition name="eb-spin-fade">
      <div v-if="spinning && visible" class="eb-spin eb-spin--nested">
        <div class="eb-spin__overlay" />
        <div class="eb-spin__content">
          <div :class="spinnerClasses" :style="spinnerStyle">
            <slot name="indicator">
              <div class="eb-spin__dot-container">
                <span v-for="i in 4" :key="i" class="eb-spin__dot" />
              </div>
            </slot>
          </div>
          <div v-if="description || slots.description" class="eb-spin__description">
            <slot name="description">{{ description }}</slot>
          </div>
          <div v-if="percent !== undefined && percent !== null" class="eb-spin__progress">
            <div class="eb-spin__progress-bar">
              <div class="eb-spin__progress-inner" :style="{ width: progressWidth }" />
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 内容区域 -->
    <div :class="['eb-spin__container', { 'eb-spin__container--blur': spinning && visible }]">
      <slot />
    </div>
  </div>

  <div v-else class="eb-spin eb-spin--standalone">
    <div :class="spinnerClasses" :style="spinnerStyle">
      <slot name="indicator">
        <div class="eb-spin__dot-container">
          <span v-for="i in 4" :key="i" class="eb-spin__dot" />
        </div>
      </slot>
    </div>
    <div v-if="description || slots.description" class="eb-spin__description">
      <slot name="description">{{ description }}</slot>
    </div>
    <div v-if="percent !== undefined && percent !== null" class="eb-spin__progress">
      <div class="eb-spin__progress-bar">
        <div class="eb-spin__progress-inner" :style="{ width: progressWidth }" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbSpin — 加载指示器
 * 三种模式：fullscreen / 包裹模式 / 独立使用
 */
import { computed, ref, watch, onMounted, onBeforeUnmount, useSlots } from 'vue'

defineOptions({ name: 'EbSpin' })

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
  'eb-spin__spinner',
  `eb-spin__spinner--${props.size}`,
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
