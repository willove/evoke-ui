<template>
  <span class="eb-avatar-group eb-avatar-group">
    <slot />
  </span>
</template>

<script setup>
/**
 * EbAvatarGroup — 头像组（叠放头像，统一向子 Avatar 注入 size / shape）
 */
import { provide, toRef } from 'vue'

defineOptions({ name: 'EbAvatarGroup' })

const props = defineProps({
  size: {
    type: [Number, String],
    default: 'default',
    validator: (v) => ['small', 'default', 'large', ''].includes(v) || typeof v === 'number',
  },
  shape: {
    type: String,
    default: 'circle',
    validator: (v) => ['circle', 'square'].includes(v),
  },
})

provide('evAvatarGroup', {
  size: toRef(props, 'size'),
  shape: toRef(props, 'shape'),
})
</script>
