<template>
  <div class="ew-avatar-group">
    <EwAvatar
      v-for="(item, i) in shown"
      :key="item.src || item.name || i"
      v-bind="item"
      :style="{ zIndex: shown.length - i }"
    />
    <slot />
    <span v-if="overflow > 0" class="ew-avatar-group__more" :style="moreStyle">+{{ overflow }}</span>
  </div>
</template>

<script setup>
/**
 * EwAvatarGroup — 头像组（层叠 + 溢出折叠为 +N）
 * items：[{ src?, name?, icon?, alt? }]；max 限制直接展示数量
 * 默认插槽可追加自定义头像（置于折叠计数之前）
 */
import { computed } from 'vue'
import EwAvatar from './index.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  max: { type: Number, default: 0 },
})

const shown = computed(() => (props.max > 0 ? props.items.slice(0, props.max) : props.items))
const overflow = computed(() =>
  props.max > 0 ? Math.max(0, props.items.length - props.max) : 0
)

const moreStyle = computed(() => {
  const sizeMap = { small: 28, default: 40, large: 56 }
  return { width: `${sizeMap.default}px`, height: `${sizeMap.default}px` }
})
</script>

<style src="./group.css"></style>
