<template>
  <span
    class="eb-avatar eb-avatar"
    :class="[`eb-avatar--${resolvedShape}`, sizeClass, { 'is-loaded': loaded, 'is-error': errored }]"
    :style="avatarStyle"
  >
    <img
      v-if="src && !errored"
      :src="src"
      :alt="alt"
      :srcset="srcSet"
      @error="handleError"
      @load="handleLoad"
    />
    <slot v-else>{{ fallbackText }}</slot>
  </span>
</template>

<script setup>
/**
 * EbAvatar — 头像
 * 加载失败回退插槽/首字符；size 数字或三档
 */
import { computed, inject, ref } from 'vue'

defineOptions({ name: 'EbAvatar' })

const props = defineProps({
  size: {
    type: [Number, String],
    default: 'default',
    validator: (v) => ['small', 'default', 'large', ''].includes(v) || typeof v === 'number',
  },
  src: { type: String, default: '' },
  srcSet: { type: String, default: '' },
  alt: { type: String, default: '' },
  shape: {
    type: String,
    default: 'circle',
    validator: (v) => ['circle', 'square'].includes(v),
  },
  icon: { type: String, default: '' },
})

const group = inject('evAvatarGroup', null)

const loaded = ref(false)
const errored = ref(false)

/** 组内继承：未显式指定时沿用 AvatarGroup 的 size/shape */
const resolvedSize = computed(() => {
  if (props.size !== 'default') return props.size
  return group?.size?.value ?? 'default'
})
const resolvedShape = computed(() => group?.shape?.value ?? props.shape)

const sizeClass = computed(() => {
  if (typeof resolvedSize.value === 'number') return ''
  if (resolvedSize.value === 'small') return 'eb-avatar--small'
  if (resolvedSize.value === 'large') return 'eb-avatar--large'
  return ''
})

const avatarStyle = computed(() => {
  if (typeof resolvedSize.value === 'number') {
    return {
      width: `${resolvedSize.value}px`,
      height: `${resolvedSize.value}px`,
      lineHeight: `${resolvedSize.value}px`,
    }
  }
  return undefined
})

const fallbackText = computed(() => '')

function handleError() {
  errored.value = true
}

function handleLoad() {
  loaded.value = true
}
</script>

<style src="./style.css"></style>
