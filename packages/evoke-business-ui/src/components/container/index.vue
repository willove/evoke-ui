<template>
  <component :is="tag" class="ev-container ev-container" :class="{ 'is-vertical': isVertical }">
    <slot />
  </component>
</template>

<script setup>
/**
 * EvContainer — 布局容器
 * direction 缺省时自动检测：子级含 Header/Footer → vertical，否则 horizontal
 */
import { computed, useSlots, Fragment, Comment, Text } from 'vue'

const props = defineProps({
  direction: {
    type: String,
    default: '',
    validator: (v) => ['', 'horizontal', 'vertical'].includes(v),
  },
  tag: { type: String, default: 'section' },
})

const slots = useSlots()

function hasChild(names) {
  let found = false
  const walk = (nodes) => {
    for (const n of nodes ?? []) {
      if (!n || n.type === Comment || n.type === Text) continue
      if (n.type === Fragment) {
        walk(n.children)
        continue
      }
      if (names.includes(n.type?.name)) found = true
    }
  }
  walk(slots.default?.())
  return found
}

const isVertical = computed(() => {
  if (props.direction === 'vertical') return true
  if (props.direction === 'horizontal') return false
  return hasChild(['EvHeader', 'EvFooter'])
})
</script>

<style src="./style.css"></style>
