<template>
  <component :is="tag" class="ev-header ev-header" :style="{ height }">
    <slot />
  </component>
</template>

<script setup>
/**
 * EvHeader — 顶栏
 */
defineOptions({ name: 'EvHeader' })

defineProps({
  height: { type: String, default: '60px' },
  tag: { type: String, default: 'header' },
})
</script>

<style src="../container/style.css"></style>
