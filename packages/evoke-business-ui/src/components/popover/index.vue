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
    <div class="eb-popover__body" :style="bodyStyle">
      <div class="eb-popover__title" v-if="title || $slots.title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="eb-popover__content">
        <slot name="content">{{ content }}</slot>
      </div>
    </div>
  </eb-popper>
</template>

<script setup>
/**
 * EbPopover — 气泡卡片（.eb-popover / .eb-popover__title 结构类）
 */
import { computed } from 'vue'
import EbPopper from '../popper/index.vue'

defineOptions({ name: 'EbPopover' })

const props = defineProps({
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

/** width 落到内容容器：数字/纯数字字符串补 px（width="280" 是文档用法），其余原样（如 "50%"） */
const bodyStyle = computed(() => {
  if (props.width === undefined) return undefined
  const numeric = typeof props.width === 'number' ||
    (typeof props.width === 'string' && /^\d+(\.\d+)?$/.test(props.width))
  return { width: numeric ? `${props.width}px` : props.width }
})
</script>

<style src="./style.css"></style>
