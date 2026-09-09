<template>
  <div class="ev-section-card">
    <div v-if="title || $slots.header || $slots.extra" class="ev-section-card__header">
      <div class="ev-section-card__header-left">
        <h3 v-if="title">{{ title }}</h3>
        <slot name="header" />
      </div>
      <div v-if="$slots.extra" class="ev-section-card__extra">
        <slot name="extra" />
      </div>
    </div>
    <div class="ev-section-card__body" :class="{ 'ev-section-card__body--no-padding': !padding }">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * EvSectionCard — 区块卡片
 */
defineProps({
  title: { type: String, default: '' },
  padding: { type: Boolean, default: true },
})
</script>

<style src="./style.css"></style>
