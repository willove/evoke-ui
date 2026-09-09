<template>
  <component :is="as" :class="['ew-container', `is-${width}`]">
    <slot />
  </component>
</template>

<script setup>
/**
 * EwContainer — 内容容器（官网栅格基座）
 * width：default 1152 / narrow 920 / wide 1360 / full 通栏（受 --ew-container-width 令牌约束，可全局调整）
 */
const props = defineProps({
  width: {
    type: String,
    default: 'default',
    validator: (v) => ['narrow', 'default', 'wide', 'full'].includes(v),
  },
  as: { type: String, default: 'div' },
})

defineOptions({ name: 'EwContainer' })
</script>

<style src="./style.css"></style>
