<template>
  <ev-skeleton-item variant="text" :class="{ 'is-animated': animated }" />
</template>

<script setup>
/**
 * EvSkeletonInput — 输入框骨架占位
 */
import EvSkeletonItem from './item.vue'

defineProps({
  animated: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
