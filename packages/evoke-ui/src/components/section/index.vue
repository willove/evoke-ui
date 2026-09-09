<template>
  <section :class="['ew-section', `is-${align}`]" :style="sectionStyle">
    <div v-if="eyebrow || $slots.eyebrow" class="ew-section__eyebrow">
      <slot name="eyebrow">{{ eyebrow }}</slot>
    </div>
    <h2 v-if="title || $slots.title" class="ew-section__title">
      <slot name="title">{{ title }}</slot>
    </h2>
    <p v-if="description || $slots.description" class="ew-section__description">
      <slot name="description">{{ description }}</slot>
    </p>
    <div v-if="$slots.default" class="ew-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
/**
 * EwSection — 内容区块（眉题 + 大标题 + 描述 + 内容）
 * eyebrow 为 remixdesign「WORK」式字距拉开的大写小标
 */
import { computed } from 'vue'

const props = defineProps({
  /** 眉题（自动大写字距拉开） */
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  align: {
    type: String,
    default: 'left',
    validator: (v) => ['left', 'center'].includes(v),
  },
  /** 底部留白（px），用于区块间距节奏 */
  gap: { type: [String, Number], default: undefined },
})

const sectionStyle = computed(() => {
  if (props.gap == null || props.gap === '') return undefined
  const gap = typeof props.gap === 'number' ? `${props.gap}px` : props.gap
  return { marginBottom: gap }
})
</script>

<style src="./style.css"></style>
