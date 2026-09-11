<template>
  <eb-skeleton-item variant="text" :class="{ 'is-animated': animated }" />
</template>

<script setup>
/**
 * EbSkeletonInput — 输入框骨架占位
 */
import EbSkeletonItem from './item.vue'

defineProps({
  animated: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
