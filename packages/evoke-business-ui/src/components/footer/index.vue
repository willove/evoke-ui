<template>
  <component :is="tag" class="eb-footer eb-footer" :style="{ height }">
    <slot />
  </component>
</template>

<script setup>
/**
 * EbFooter — 底栏
 */
defineOptions({ name: 'EbFooter' })

defineProps({
  height: { type: String, default: '60px' },
  tag: { type: String, default: 'footer' },
})
</script>

<style src="../container/style.css"></style>
