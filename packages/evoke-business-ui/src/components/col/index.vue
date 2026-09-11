<template>
  <component
    :is="tag"
    class="eb-col"
    :class="classes"
    :style="colStyle"
  >
    <slot />
  </component>
</template>

<script setup>
/**
 * EbCol — 栅格列
 * span/offset/push/pull + xs~xl 响应式（数字或 {span,offset,push,pull} 对象）
 */
import { computed, inject } from 'vue'

const props = defineProps({
  span: { type: Number, default: 24 },
  offset: { type: Number, default: 0 },
  push: { type: Number, default: 0 },
  pull: { type: Number, default: 0 },
  xs: { type: [Number, Object], default: undefined },
  sm: { type: [Number, Object], default: undefined },
  md: { type: [Number, Object], default: undefined },
  lg: { type: [Number, Object], default: undefined },
  xl: { type: [Number, Object], default: undefined },
  tag: { type: String, default: 'div' },
})

const gutter = inject('rowGutter', { value: 0 })

const classes = computed(() => {
  const list = []
  const sizeKeys = ['xs', 'sm', 'md', 'lg', 'xl']
  const addBreakpoint = (prefix, val) => {
    if (val == null) return
    if (typeof val === 'number') {
      list.push(`eb-col-${prefix}-${val}`)
    } else if (typeof val === 'object') {
      if (val.span != null) list.push(`eb-col-${prefix}-${val.span}`)
      if (val.offset != null) list.push(`eb-col-${prefix}-offset-${val.offset}`)
      if (val.push != null) list.push(`eb-col-${prefix}-push-${val.push}`)
      if (val.pull != null) list.push(`eb-col-${prefix}-pull-${val.pull}`)
    }
  }
  list.push(`eb-col-${props.span}`)
  if (props.offset) list.push(`eb-col-offset-${props.offset}`)
  if (props.push) list.push(`eb-col-push-${props.push}`)
  if (props.pull) list.push(`eb-col-pull-${props.pull}`)
  for (const key of sizeKeys) addBreakpoint(key, props[key])
  return list
})

const colStyle = computed(() => {
  const g = gutter?.value ?? 0
  if (!g) return {}
  return { paddingLeft: `${g / 2}px`, paddingRight: `${g / 2}px` }
})
</script>

<style src="../row/style.css"></style>
