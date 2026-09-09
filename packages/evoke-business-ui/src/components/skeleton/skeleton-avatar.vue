<template>
  <ev-skeleton-item variant="avatar" :class="{ 'is-animated': animated }" />
</template>

<script setup>
/**
 * EvSkeletonAvatar — 头像骨架占位
 */
import EvSkeletonItem from './item.vue'

defineProps({
  animated: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
