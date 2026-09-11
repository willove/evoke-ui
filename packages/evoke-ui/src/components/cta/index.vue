<template>
  <section :class="['ev-cta', { 'is-tinted': tinted }]">
    <EvContainer :width="container" class="ev-cta__inner">
      <h2 class="ev-cta__title">
        <slot name="title">{{ title }}</slot>
      </h2>
      <p v-if="description || $slots.description" class="ev-cta__description">
        <slot name="description">{{ description }}</slot>
      </p>
      <div v-if="$slots.actions" class="ev-cta__actions">
        <slot name="actions" />
      </div>
      <div v-if="$slots.default" class="ev-cta__body">
        <slot />
      </div>
    </EvContainer>
  </section>
</template>

<script setup>
/**
 * EvCta — 行动召唤区（官网转化收尾）
 */
import EvContainer from '../container/index.vue'

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
