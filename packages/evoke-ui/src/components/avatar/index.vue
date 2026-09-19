<template>
  <span :class="['ev-avatar', `is-${shape}`, `is-${sizeClass}`]" :style="sizeStyle">
    <img v-if="src && !imgFailed" :src="src" :alt="alt || name" class="ev-avatar__img" @error="imgFailed = true" />
    <EvIcon v-else-if="icon" :name="icon" :size="iconSize" />
    <span v-else class="ev-avatar__fallback">{{ initials }}</span>
  </span>
</template>

<script setup>
/**
 * EvAvatar — 头像（用户/团队/评价位）
 * src 图片缺失或加载失败时回退到 name 首字符
 */
import { computed, ref, watch } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  src: { type: String, default: '' },
  /** 姓名（无图时取首字符；两词取首字母） */
  name: { type: String, default: '' },
  icon: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: [String, Number], default: 'default' },
  shape: {
    type: String,
    default: 'circle',
    validator: (v) => ['circle', 'square'].includes(v),
  },
})

const imgFailed = ref(false)
watch(() => props.src, () => (imgFailed.value = false))

const sizeClass = computed(() =>
  ['small', 'default', 'large'].includes(props.size) ? props.size : 'custom'
)

const sizeStyle = computed(() =>
  sizeClass.value === 'custom' ? { width: `${props.size}px`, height: `${props.size}px` } : undefined
)

const iconSize = computed(() => {
  if (sizeClass.value !== 'custom') return 16
  return Math.max(12, Math.round(Number(props.size) * 0.45))
})

const initials = computed(() => {
  const parts = String(props.name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2)
})
</script>

<style src="./style.css"></style>
