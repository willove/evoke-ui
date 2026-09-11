<template>
  <div class="eb-card eb-card" :class="[`is-${shadow}-shadow`, { 'is-hoverable': hoverable, 'is-glass': glass === true, 'no-glass': glass === false }]">
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
 * Props：header / shadow（默认 never）/ bodyStyle；悬浮浮起动效可经 hoverable 关闭
 */
import { computed } from 'vue'

const props = defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（EbConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  header: { type: String, default: '' },
  shadow: {
    type: String,
    default: 'never',
    validator: (v) => ['always', 'hover', 'never'].includes(v),
  },
  bodyStyle: { type: [Object, String], default: () => ({}) },
  /** 悬浮时是否执行浮起动画（上移 / 描边 / 阴影）；false 时完全静态 */
  hoverable: { type: Boolean, default: true },
})

// bodyStyle 支持对象与字符串两种入参
const bodyStyleNormalized = computed(() =>
  typeof props.bodyStyle === 'string' ? props.bodyStyle : props.bodyStyle ?? {},
)
</script>

<style src="./style.css"></style>
