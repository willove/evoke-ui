<template>
  <span :class="['ev-tag', `ev-tag--${size}`, `is-${tone}`, `is-${variant}`]">
    <EvIcon v-if="icon" :name="icon" :size="iconSize" class="ev-tag__icon" />
    <slot />
    <button
      v-if="closable"
      type="button"
      class="ev-tag__close"
      aria-label="close"
      @click.stop="emit('close')"
    >
      <EvIcon name="close" :size="iconSize - 2" />
    </button>
  </span>
</template>

<script setup>
/**
 * EvTag — 胶囊标签（remixdesign「Open Source」/ remixicon「v4.9.1」/ launchos「SAVE 50%」语言）
 * tone：neutral/primary/success/warning/danger/lime（限量促销黄绿）/orange
 * variant：soft 淡底 / solid 实底 / outline 描边
 */
import { computed } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  tone: {
    type: String,
    default: 'neutral',
    validator: (v) =>
      ['neutral', 'primary', 'success', 'warning', 'danger', 'info', 'lime', 'orange'].includes(v),
  },
  variant: {
    type: String,
    default: 'soft',
    validator: (v) => ['soft', 'solid', 'outline'].includes(v),
  },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
  icon: { type: String, default: undefined },
  closable: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const iconSize = computed(() => (props.size === 'small' ? 12 : 14))
</script>

<style src="./style.css"></style>
