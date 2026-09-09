<template>
  <component :is="tag" class="ev-aside ev-aside" :style="{ width }">
    <slot />
  </component>
</template>

<script setup>
/**
 * EvAside — 侧边栏
 */
defineProps({
  width: { type: String, default: '300px' },
  tag: { type: String, default: 'aside' },
})
</script>

<style src="../container/style.css"></style>
