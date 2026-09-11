<template>
  <component :is="as" :class="['ev-container', `is-${width}`]">
    <slot />
  </component>
</template>

<script setup>
/**
 * EvContainer — 内容容器（官网栅格基座）
 * width：default 1152 / narrow 920 / wide 1360 / full 通栏（受 --ev-container-width 令牌约束，可全局调整）
 */
const props = defineProps({
  width: {
    type: String,
    default: 'default',
    validator: (v) => ['narrow', 'default', 'wide', 'full'].includes(v),
  },
  as: { type: String, default: 'div' },
})

defineOptions({ name: 'EvContainer' })
</script>

<style src="./style.css"></style>
