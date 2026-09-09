<template>
  <div class="ev-empty-state" :class="[`ev-empty-state--${size}`, `ev-empty-state--tone-${tone}`]" role="status">
    <div class="ev-empty-state__icon">
      <slot name="icon">
        <ev-icon v-if="icon" :name="icon" :size="iconSize" />
      </slot>
    </div>
    <div class="ev-empty-state__body">
      <div class="ev-empty-state__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="description || $slots.description" class="ev-empty-state__description">
        <slot name="description">{{ description }}</slot>
      </div>
      <div v-if="$slots.actions" class="ev-empty-state__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EvEmptyState — 统一空态
 * default 纵向页面级 / compact 横向紧凑；tone 决定图标底色语义
 */
import { computed } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  icon: { type: String, default: 'box' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'compact'].includes(v),
  },
  tone: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'primary', 'success', 'warning', 'danger'].includes(v),
  },
})

const iconSize = computed(() => (props.size === 'compact' ? 16 : 22))
</script>

<style src="./style.css"></style>
