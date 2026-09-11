<template>
  <div class="eb-empty-state" :class="[`eb-empty-state--${size}`, `eb-empty-state--tone-${tone}`]" role="status">
    <div class="eb-empty-state__icon">
      <slot name="icon">
        <eb-icon v-if="icon" :name="icon" :size="iconSize" />
      </slot>
    </div>
    <div class="eb-empty-state__body">
      <div class="eb-empty-state__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="description || $slots.description" class="eb-empty-state__description">
        <slot name="description">{{ description }}</slot>
      </div>
      <div v-if="$slots.actions" class="eb-empty-state__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbEmptyState — 统一空态
 * default 纵向页面级 / compact 横向紧凑；tone 决定图标底色语义
 */
import { computed } from 'vue'
import EbIcon from '../icon/index.vue'

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
