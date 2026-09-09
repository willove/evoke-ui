<template>
  <component :is="tag" class="ev-main ev-main">
    <slot />
  </component>
</template>

<script setup>
/**
 * EvMain — 主内容区
 */
defineProps({
  tag: { type: String, default: 'main' },
})
</script>

<style src="../container/style.css"></style>
