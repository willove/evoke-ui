<template>
  <eb-popper
    :placement="placement"
    :trigger="trigger"
    :disabled="disabled"
    :show-after="showAfter"
    :hide-after="hideAfter"
    :show-arrow="true"
    popper-class="eb-popover eb-popover"
    :virtual-triggering="virtualTriggering"
    :virtual-ref="virtualRef"
    :offset="12"
  >
    <template #trigger>
      <slot />
    </template>
    <div class="eb-popover__title" v-if="title || $slots.title">
      <slot name="title">{{ title }}</slot>
    </div>
    <div class="eb-popover__content">
      <slot name="content">{{ content }}</slot>
    </div>
  </eb-popper>
</template>

<script setup>
/**
 * EbPopover — 气泡卡片（.eb-popover / .eb-popover__title 结构类）
 */
import EbPopper from '../popper/index.vue'

defineOptions({ name: 'EbPopover' })

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
