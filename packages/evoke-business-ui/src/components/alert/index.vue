<template>
  <transition name="ev-alert-fade">
    <div
      v-if="visible"
      class="ev-alert ev-alert"
      :class="[`ev-alert--${effect}`, `ev-alert--${typeClass}`, { 'is-center': center }]"
      role="alert"
    >
      <div v-if="showIcon || $slots.icon" class="ev-alert__icon">
        <slot name="icon">
          <ev-icon :name="iconName" :size="16" />
        </slot>
      </div>
      <div class="ev-alert__content">
        <span v-if="title && !$slots.title" class="ev-alert__title">{{ title }}</span>
        <span v-else-if="$slots.title" class="ev-alert__title"><slot name="title" /></span>
        <p v-if="$slots.default || description" class="ev-alert__description">
          <slot>{{ description }}</slot>
        </p>
      </div>
      <button
        v-if="closable"
        type="button"
        class="ev-alert__close-btn"
        aria-label="Close"
        @click="handleClose"
      >
        <slot name="close"><ev-icon name="close" :size="14" /></slot>
      </button>
    </div>
  </transition>
</template>

<script setup>
/**
 * EvAlert — 警告提示
 */
import { ref, computed } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  title: { type: String, default: '' },
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['primary', 'success', 'warning', 'info', 'error'].includes(v),
  },
  closable: { type: Boolean, default: true },
  showIcon: { type: Boolean, default: false },
  center: { type: Boolean, default: false },
  effect: {
    type: String,
    default: 'light',
    validator: (v) => ['light', 'dark'].includes(v),
  },
  description: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const visible = ref(true)

// primary 复用 info 图标；error → circle-close-filled
const iconName = computed(() => {
  const map = {
    success: 'circle-check-filled',
    warning: 'warning-filled',
    info: 'info-filled',
    error: 'circle-close-filled',
    primary: 'info-filled',
  }
  return map[props.type] ?? 'info-filled'
})

const typeClass = computed(() => (props.type === 'error' ? 'error' : props.type === 'primary' ? 'info' : props.type))

function handleClose(e) {
  visible.value = false
  emit('close', e)
}
</script>

<style src="./style.css"></style>
