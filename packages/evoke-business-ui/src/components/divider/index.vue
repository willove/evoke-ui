<template>
  <div
    class="ev-divider ev-divider"
    :class="[`ev-divider--${direction}`, lineClass]"
    role="separator"
  >
    <div
      v-if="direction === 'horizontal' && hasContent"
      class="ev-divider__text"
      :class="[`is-${contentPosition}`]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * EvDivider — 分割线
 */
import { computed, useSlots } from 'vue'

const props = defineProps({
  direction: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
  borderStyle: {
    type: String,
    default: 'solid',
    validator: (v) => ['solid', 'dashed', 'dotted', 'double', 'none'].includes(v),
  },
  contentPosition: {
    type: String,
    default: 'center',
    validator: (v) => ['left', 'center', 'right'].includes(v),
  },
})

const slots = useSlots()
const hasContent = computed(() => !!slots.default)

const lineClass = computed(() => `ev-divider--${props.borderStyle}`)
</script>

<style src="./style.css"></style>
