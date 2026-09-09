<template>
  <ev-skeleton-item variant="button" :class="{ 'is-animated': animated }" />
</template>

<script setup>
/**
 * EvSkeletonButton — 按钮骨架占位
 */
import EvSkeletonItem from './item.vue'

defineProps({
  animated: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
