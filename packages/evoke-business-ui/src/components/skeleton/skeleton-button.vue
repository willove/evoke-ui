<template>
  <eb-skeleton-item variant="button" :class="{ 'is-animated': animated }" />
</template>

<script setup>
/**
 * EbSkeletonButton — 按钮骨架占位
 */
import EbSkeletonItem from './item.vue'

defineProps({
  animated: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
