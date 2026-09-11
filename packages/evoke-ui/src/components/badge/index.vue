<template>
  <sup :class="['ev-badge', { 'is-dot': dot }]" :style="badgeStyle">
    <slot v-if="!dot">{{ displayValue }}</slot>
  </sup>
</template>

<script setup>
/**
 * EvBadge — 计数徽标（remixicon 版本红点 / 分类计数语言）
 * 独立使用或配合相对定位父级悬挂；dot 模式仅显示圆点
 */
import { computed } from 'vue'

const props = defineProps({
  /** 计数值（超过 max 显示 max+） */
  value: { type: [String, Number], default: '' },
  max: { type: Number, default: 99 },
  /** 圆点模式 */
  dot: { type: Boolean, default: false },
  /** 自定义底色 */
  color: { type: String, default: undefined },
})

const displayValue = computed(() => {
  if (props.dot) return ''
  const n = Number(props.value)
  if (Number.isFinite(n) && props.max && n > props.max) return `${props.max}+`
  return props.value
})

const badgeStyle = computed(() => (props.color ? { backgroundColor: props.color } : {}))
</script>

<style src="./style.css"></style>
