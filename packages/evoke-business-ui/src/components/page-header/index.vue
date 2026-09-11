<template>
  <div class="eb-page-header">
    <div class="eb-page-header__main">
      <h2>{{ title }}</h2>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="eb-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
/**
 * EbPageHeader — 页头
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<style src="./style.css"></style>
