<template>
  <eb-skeleton-item variant="image" :class="{ 'is-animated': animated }" />
</template>

<script setup>
/**
 * EbSkeletonImage — 图片骨架占位
 */
import EbSkeletonItem from './item.vue'

defineProps({
  animated: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
