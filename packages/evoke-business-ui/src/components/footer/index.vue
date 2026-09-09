<template>
  <component :is="tag" class="ev-footer ev-footer" :style="{ height }">
    <slot />
  </component>
</template>

<script setup>
/**
 * EvFooter — 底栏
 */
defineOptions({ name: 'EvFooter' })

defineProps({
  height: { type: String, default: '60px' },
  tag: { type: String, default: 'footer' },
})
</script>

<style src="../container/style.css"></style>
