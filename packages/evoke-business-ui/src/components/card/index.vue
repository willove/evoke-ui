<template>
  <div class="eb-card eb-card" :class="[`is-${shadow}-shadow`, { 'is-hoverable': hoverable, 'is-glass': glass === true, 'no-glass': glass === false }]" :style="glassVars">
    <div v-if="$slots.header || header" class="eb-card__header">
      <slot name="header">{{ header }}</slot>
    </div>
    <div class="eb-card__body" :style="bodyStyleNormalized">
      <slot />
    </div>
    <div v-if="$slots.footer" class="eb-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
/**
 * EbCard — 卡片
 * Props：header / shadow（默认 never）/ bodyStyle；悬浮反馈可经 hoverable 关闭；磨砂可经 glass / blur 调节
 */
import { computed } from 'vue'

const props = defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（EbConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂模糊半径（px）：内联覆盖 --eb-glass-blur 令牌，仅磨砂生效时应用；缺省跟随令牌（14px） */
  blur: { type: [Number, String], default: undefined },
  header: { type: String, default: '' },
  shadow: {
    type: String,
    default: 'never',
    validator: (v) => ['always', 'hover', 'never'].includes(v),
  },
  bodyStyle: { type: [Object, String], default: () => ({}) },
  /** 悬浮时是否应用交互反馈（边框微深 + 阴影）；false 时完全静态 */
  hoverable: { type: Boolean, default: true },
})

// bodyStyle 支持对象与字符串两种入参
const bodyStyleNormalized = computed(() =>
  typeof props.bodyStyle === 'string' ? props.bodyStyle : props.bodyStyle ?? {},
)

// 组件级磨砂强度：内联覆盖 --eb-glass-blur，缺省不产出内联样式（跟随令牌）
const glassVars = computed(() => {
  if (props.blur === undefined || props.blur === null || props.blur === '') return undefined
  return { '--eb-glass-blur': typeof props.blur === 'number' ? `${props.blur}px` : props.blur }
})
</script>

<style src="./style.css"></style>
