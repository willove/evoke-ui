<template>
  <ev-skeleton-item variant="image" :class="{ 'is-animated': animated }" />
</template>

<script setup>
/**
 * EvSkeletonImage — 图片骨架占位
 */
import EvSkeletonItem from './item.vue'

defineProps({
  animated: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
