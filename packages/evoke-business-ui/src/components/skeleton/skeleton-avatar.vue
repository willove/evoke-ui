<template>
  <eb-skeleton-item variant="avatar" :class="{ 'is-animated': animated }" />
</template>

<script setup>
/**
 * EbSkeletonAvatar — 头像骨架占位
 */
import EbSkeletonItem from './item.vue'

defineProps({
  animated: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
