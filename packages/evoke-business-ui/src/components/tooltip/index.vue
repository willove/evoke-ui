<template>
  <ev-popper
    ref="popperRef"
    :placement="placement"
    :trigger="trigger"
    :disabled="disabled"
    :show-after="showAfter"
    :hide-after="hideAfter"
    :show-arrow="true"
    :popper-class="['ev-tooltip__popper', `is-${effect}`, 'ev-tooltip']"
    :virtual-triggering="virtualTriggering"
    :virtual-ref="virtualRef"
    :offset="effect === 'dark' ? 8 : 8"
  >
    <template #trigger>
      <slot />
    </template>
    <slot name="content">{{ content }}</slot>
  </ev-popper>
</template>

<script setup>
/**
 * EvTooltip — 文字提示（.ev-tooltip__popper 结构类）
 */
import { ref } from 'vue'
import EvPopper from '../popper/index.vue'

defineOptions({ name: 'EvTooltip' })

const props = defineProps({
  content: { type: String, default: '' },
  placement: {
    type: String,
    default: 'top',
    validator: (v) =>
      [
        'top', 'bottom', 'left', 'right',
        'top-start', 'top-end', 'bottom-start', 'bottom-end',
        'left-start', 'left-end', 'right-start', 'right-end',
      ].includes(v),
  },
  disabled: { type: Boolean, default: false },
  effect: {
    type: String,
    default: 'dark',
    validator: (v) => ['dark', 'light'].includes(v),
  },
  showAfter: { type: Number, default: 0 },
  hideAfter: { type: Number, default: 200 },
  trigger: {
    type: String,
    default: 'hover',
    validator: (v) => ['hover', 'click', 'focus', 'contextmenu'].includes(v),
  },
  /** 虚拟触发 */
  virtualTriggering: { type: Boolean, default: false },
  virtualRef: { type: Object, default: null },
})

const popperRef = ref(null)

defineExpose({
  show: (...args) => popperRef.value?.show,
  hide: () => popperRef.value?.close?.(),
  update: () => popperRef.value?.update?.(),
})
</script>

<style src="./style.css"></style>
