<template>
  <ev-popper
    :placement="placement"
    :trigger="trigger"
    :disabled="disabled"
    :show-after="showAfter"
    :hide-after="hideAfter"
    :show-arrow="true"
    popper-class="ev-popover ev-popover"
    :virtual-triggering="virtualTriggering"
    :virtual-ref="virtualRef"
    :offset="12"
  >
    <template #trigger>
      <slot />
    </template>
    <div class="ev-popover__title" v-if="title || $slots.title">
      <slot name="title">{{ title }}</slot>
    </div>
    <div class="ev-popover__content">
      <slot name="content">{{ content }}</slot>
    </div>
  </ev-popper>
</template>

<script setup>
/**
 * EvPopover — 气泡卡片（.ev-popover / .ev-popover__title 结构类）
 */
import EvPopper from '../popper/index.vue'

defineOptions({ name: 'EvPopover' })

defineProps({
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  placement: {
    type: String,
    default: 'bottom',
    validator: (v) =>
      [
        'top', 'bottom', 'left', 'right',
        'top-start', 'top-end', 'bottom-start', 'bottom-end',
        'left-start', 'left-end', 'right-start', 'right-end',
      ].includes(v),
  },
  width: { type: [String, Number], default: undefined },
  trigger: {
    type: String,
    default: 'click',
    validator: (v) => ['hover', 'click', 'focus', 'contextmenu'].includes(v),
  },
  disabled: { type: Boolean, default: false },
  showAfter: { type: Number, default: 0 },
  hideAfter: { type: Number, default: 200 },
  virtualTriggering: { type: Boolean, default: false },
  virtualRef: { type: Object, default: null },
})
</script>

<style src="./style.css"></style>
