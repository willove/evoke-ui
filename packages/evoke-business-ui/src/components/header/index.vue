<template>
  <component :is="tag" class="eb-header eb-header" :style="{ height }">
    <slot />
  </component>
</template>

<script setup>
/**
 * EbHeader — 顶栏
 */
defineOptions({ name: 'EbHeader' })

defineProps({
  height: { type: String, default: '60px' },
  tag: { type: String, default: 'header' },
})
</script>

<style src="../container/style.css"></style>
