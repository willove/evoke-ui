<template>
  <div class="ev-page-header">
    <div class="ev-page-header__main">
      <h2>{{ title }}</h2>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="ev-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
/**
 * EvPageHeader — 页头
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<style src="./style.css"></style>
