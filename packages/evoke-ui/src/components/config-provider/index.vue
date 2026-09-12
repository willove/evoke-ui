<template>
  <div v-if="!global" class="ev-config-provider" :style="scopedStyle">
    <slot />
  </div>
  <slot v-else />
</template>

<script setup>
/**
 * EvConfigProvider — 主题配置提供者
 *
 * props 变化时把对应的 --ev-* 令牌写入 :root（global，默认）或包裹元素，
 * 全库组件经令牌取值，主题即时生效；淡色阶（light-3…9/dark-2）由主色自动生成。
 *
 * props：primary(hex) / radius('sharp'|'soft'|'default'|'round') /
 *        space('compact'|'default'|'loose') / container('narrow'|'default'|'wide'|'full')
 */
import { computed, watch, onUnmounted } from 'vue'
import { resolveThemeVars } from '../../presets'

const props = defineProps({
  /** 主色（hex），淡色阶自动生成 */
  primary: { type: String, default: '' },
  /** 图表系列色板（≤8 色数组），写入 --ev-color-series-1..8（evoke-charts 按槽读取） */
  series: { type: Array, default: () => [] },
  radius: {
    type: String,
    default: 'default',
    validator: (v) => ['sharp', 'soft', 'default', 'round'].includes(v),
  },
  space: {
    type: String,
    default: 'default',
    validator: (v) => ['compact', 'default', 'loose'].includes(v),
  },
  container: {
    type: String,
    default: 'default',
    validator: (v) => ['narrow', 'default', 'wide', 'full'].includes(v),
  },
  /** 写入 :root 全局生效；false 时写入包裹元素（局部换肤） */
  global: { type: Boolean, default: true },
  /** 全局磨砂：开启后容器类组件（card/section/footer/navbar…）默认玻璃质感，组件级 glass prop 可单独覆盖 */
  glass: { type: Boolean, default: false },
})

const scopedStyle = computed(() => {
  if (props.global) return undefined
  return Object.fromEntries(
    Object.entries(resolveThemeVars({
      primary: props.primary,
      series: props.series,
      radius: props.radius,
      space: props.space,
      container: props.container,
    }))
  )
})

watch(
  () => [props.primary, props.series, props.radius, props.space, props.container, props.global],
  () => {
    if (typeof document === 'undefined' || !props.global) return
    const style = document.documentElement.style
    const vars = resolveThemeVars(props)
    for (const [name, value] of Object.entries(vars)) style.setProperty(name, value)
  },
  { immediate: true }
)

// 全局磨砂开关：写在 documentElement 上，弹层（Teleport 到 body）同样命中；
// 卸载时还原，避免局部演示污染站点其余页面
watch(
  () => props.glass,
  (on) => {
    if (typeof document === 'undefined') return
    if (on) document.documentElement.setAttribute('data-ev-glass', 'on')
    else document.documentElement.removeAttribute('data-ev-glass')
  },
  { immediate: true }
)

onUnmounted(() => {
  if (typeof document === 'undefined') return
  document.documentElement.removeAttribute('data-ev-glass')
})
</script>

<style src="./style.css"></style>
