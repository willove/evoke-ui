<template>
  <section :class="['ev-section', `is-${align}`, { 'is-glass': glass === true, 'no-glass': glass === false }]" :style="[sectionStyle, glassVars]">
    <div v-if="eyebrow || $slots.eyebrow" class="ev-section__eyebrow">
      <slot name="eyebrow">{{ eyebrow }}</slot>
    </div>
    <h2 v-if="title || $slots.title" class="ev-section__title">
      <slot name="title">{{ title }}</slot>
    </h2>
    <p v-if="description || $slots.description" class="ev-section__description">
      <slot name="description">{{ description }}</slot>
    </p>
    <div v-if="$slots.default" class="ev-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
/**
 * EvSection — 内容区块（眉题 + 大标题 + 描述 + 内容）
 * eyebrow 为 remixdesign「WORK」式字距拉开的大写小标
 */
import { computed } from 'vue'

const props = defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
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

// 组件级磨砂强度：内联覆盖 --ev-glass-blur，缺省不产出内联样式（跟随令牌）
const glassVars = computed(() => {
  if (props.blur === undefined || props.blur === null || props.blur === '') return undefined
  return { '--ev-glass-blur': typeof props.blur === 'number' ? `${props.blur}px` : props.blur }
})
</script>

<style src="./style.css"></style>
