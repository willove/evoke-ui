<template>
  <div
    class="ev-skeleton__item"
    :class="[`ev-skeleton__${variant}`, 'ev-skeleton-item']"
  >
    <svg
      v-if="variant === 'image'"
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      class="ev-skeleton__image"
      aria-hidden="true"
    >
      <path
        d="M64 896h896V256H64v640zm0-768h896v192H64V128z"
        fill="currentColor"
      />
    </svg>
  </div>
</template>

<script setup>
/**
 * EvSkeletonItem — 骨架屏占位单元
 */
defineProps({
  variant: {
    type: String,
    default: 'text',
    validator: (v) =>
      ['p', 'text', 'circle', 'rect', 'image', 'button', 'avatar', 'caption', 'h1', 'h3', 'h5'].includes(v),
  },
})
</script>

<style src="./style.css"></style>
