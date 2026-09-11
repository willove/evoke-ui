<template>
  <component :is="tag" class="eb-main eb-main">
    <slot />
  </component>
</template>

<script setup>
/**
 * EbMain — 主内容区
 */
defineProps({
  tag: { type: String, default: 'main' },
})
</script>

<style src="../container/style.css"></style>
