<template>
  <div v-if="!global" class="ew-config-provider" :style="scopedStyle">
    <slot />
  </div>
  <slot v-else />
</template>

<script setup>
/**
 * EwConfigProvider — 主题配置提供者
 *
 * props 变化时把对应的 --ew-* 令牌写入 :root（global，默认）或包裹元素，
 * 全库组件经令牌取值，主题即时生效；淡色阶（light-3…9/dark-2）由主色自动生成。
 *
 * props：primary(hex) / radius('sharp'|'soft'|'default'|'round') /
 *        space('compact'|'default'|'loose') / container('narrow'|'default'|'wide'|'full')
 */
import { computed, watch } from 'vue'
import { resolveThemeVars } from '../../presets'

const props = defineProps({
  /** 主色（hex），淡色阶自动生成 */
  primary: { type: String, default: '' },
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
})

const scopedStyle = computed(() => {
  if (props.global) return undefined
  return Object.fromEntries(
    Object.entries(resolveThemeVars({
      primary: props.primary,
      radius: props.radius,
      space: props.space,
      container: props.container,
    }))
  )
})

watch(
  () => [props.primary, props.radius, props.space, props.container, props.global],
  () => {
    if (typeof document === 'undefined' || !props.global) return
    const style = document.documentElement.style
    const vars = resolveThemeVars(props)
    for (const [name, value] of Object.entries(vars)) style.setProperty(name, value)
  },
  { immediate: true }
)
</script>

<style src="./style.css"></style>
