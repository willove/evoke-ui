<template>
  <div>
    <!-- fixed 模式下的占位，避免标签栏脱离文档流后遮挡内容尾部 -->
    <div v-if="fixed && placeholder" class="ev-tabbar__placeholder" :style="{ height: `${barHeight}px` }" />
    <div
      ref="barRef"
      :class="['ev-tabbar', { 'is-fixed': fixed, 'is-border': border, 'is-safe': safeAreaInsetBottom, 'is-glass': glass === true, 'no-glass': glass === false }]"
      :style="glassVars"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * EvTabbar — 底部标签栏（配 EvTabbarItem 使用）
 * 移动端一级导航：固定吸底的页签入口，页内内容切换由业务持有（v-model）。
 * fixed 模式脱离文档流吸底并适配安全区，默认渲染等高占位防止遮挡内容。
 */
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue'

defineOptions({ name: 'EvTabbar' })

import { useGlassVars } from '../../composables/useGlassVars'
const props = defineProps({
  /** 当前激活项的 name（未设置 name 时为索引） */
  modelValue: { type: [String, Number], default: '' },
  /** 吸底固定；false 时作为普通块级标签栏内联使用 */
  fixed: { type: Boolean, default: true },
  /** fixed 时渲染等高占位 */
  placeholder: { type: Boolean, default: true },
  border: { type: Boolean, default: true },
  /** 适配全面屏底部安全区 */
  safeAreaInsetBottom: { type: Boolean, default: true },
  /** 磨砂玻璃标签栏：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
  /** 磨砂饱和度（倍数），内联覆盖 --ev-glass-saturate；缺省跟随令牌 */
  saturate: { type: [Number, String], default: undefined },
  /** 磨砂底色浓度（%），内联覆盖 --ev-glass-bg；缺省跟随令牌 */
  tint: { type: [Number, String], default: undefined },
})

const emit = defineEmits(['update:modelValue', 'change'])

const barRef = ref(null)
const barHeight = ref(50)
let resizeObserver = null

const current = computed(() => props.modelValue)

const glassVars = useGlassVars(props)

const items = ref([])

function registerItem() {
  items.value.push(items.value.length)
  return items.value.length - 1
}

function setActive(value) {
  if (value === props.modelValue) return
  emit('update:modelValue', value)
  emit('change', value)
}

provide('ewTabbar', {
  current,
  setActive,
  registerItem,
  safeAreaInsetBottom: computed(() => props.safeAreaInsetBottom),
})

function measure() {
  const el = barRef.value
  if (el) barHeight.value = el.offsetHeight || 50
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && barRef.value) {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(barRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style src="./style.css"></style>
