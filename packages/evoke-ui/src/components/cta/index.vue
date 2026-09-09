<template>
  <section :class="['ew-cta', { 'is-tinted': tinted }]">
    <EwContainer :width="container" class="ew-cta__inner">
      <h2 class="ew-cta__title">
        <slot name="title">{{ title }}</slot>
      </h2>
      <p v-if="description || $slots.description" class="ew-cta__description">
        <slot name="description">{{ description }}</slot>
      </p>
      <div v-if="$slots.actions" class="ew-cta__actions">
        <slot name="actions" />
      </div>
      <div v-if="$slots.default" class="ew-cta__body">
        <slot />
      </div>
    </EwContainer>
  </section>
</template>

<script setup>
/**
 * EwCta — 行动召唤区（官网转化收尾）
 */
import EwContainer from '../container/index.vue'

defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  tinted: { type: Boolean, default: true },
  container: {
    type: String,
    default: 'narrow',
    validator: (v) => ['narrow', 'default', 'wide', 'full'].includes(v),
  },
})
</script>

<style src="./style.css"></style>
