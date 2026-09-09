<template>
  <component
    :is="tag"
    class="ev-row ev-row"
    :class="[`is-justify-${justify}`, `is-align-${align}`]"
    :style="rowStyle"
  >
    <slot />
  </component>
</template>

<script setup>
/**
 * EvRow — 栅格行
 * gutter 通过 provide 下发给 EvCol；负 margin 补偿列内边距
 */
import { computed, provide, toRef } from 'vue'

const props = defineProps({
  gutter: { type: Number, default: 0 },
  justify: {
    type: String,
    default: 'start',
    validator: (v) => ['start', 'end', 'center', 'space-around', 'space-between', 'space-evenly'].includes(v),
  },
  align: {
    type: String,
    default: 'top',
    validator: (v) => ['top', 'middle', 'bottom'].includes(v),
  },
  tag: { type: String, default: 'div' },
})

provide('rowGutter', toRef(props, 'gutter'))

const rowStyle = computed(() => {
  if (!props.gutter) return {}
  return { marginLeft: `-${props.gutter / 2}px`, marginRight: `-${props.gutter / 2}px` }
})
</script>

<style src="./style.css"></style>
