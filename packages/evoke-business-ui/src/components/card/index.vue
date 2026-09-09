<template>
  <div class="ev-card ev-card" :class="[`is-${shadow}-shadow`, { 'is-hoverable': hoverable }]">
    <div v-if="$slots.header || header" class="ev-card__header">
      <slot name="header">{{ header }}</slot>
    </div>
    <div class="ev-card__body" :style="bodyStyleNormalized">
      <slot />
    </div>
    <div v-if="$slots.footer" class="ev-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
/**
 * EvCard — 卡片
 * Props：header / shadow（默认 never）/ bodyStyle；悬浮浮起动效可经 hoverable 关闭
 */
import { computed } from 'vue'

const props = defineProps({
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
