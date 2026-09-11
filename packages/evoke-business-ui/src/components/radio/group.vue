<template>
  <div
    class="eb-radio-group eb-radio-group"
    :class="sizeClass"
    role="radiogroup"
    :aria-disabled="isDisabled"
  >
    <slot />
  </div>
</template>

<script setup>
/**
 * EbRadioGroup — 单选组
 * provide radioGroupContextKey，子 Radio/Button inject 共享 modelValue
 */
import { computed, provide, toRef } from 'vue'
import { radioGroupContextKey } from './group-context'

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: '' },
  size: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  /** 文字颜色（border 模式激活态） */
  textColor: { type: String, default: '#ffffff' },
  /** 填充色（border/button 模式激活态） */
  fill: { type: String, default: '#175DFF' },
})

const emit = defineEmits(['update:modelValue', 'change'])

const sizeClass = computed(() => {
  if (props.size === 'large') return 'eb-radio-group--large'
  if (props.size === 'small') return 'eb-radio-group--small'
  return ''
})

const isDisabled = computed(() => props.disabled)

provide(
  radioGroupContextKey,
  {
    modelValue: toRef(props, 'modelValue'),
    size: toRef(props, 'size'),
    disabled: toRef(props, 'disabled'),
    name: toRef(props, 'name'),
    textColor: toRef(props, 'textColor'),
    fill: toRef(props, 'fill'),
    change: (value) => {
      emit('update:modelValue', value)
      emit('change', value)
    },
  }
)

defineExpose({
  /** 组内所有 Radio 实例（扩展位） */
})
</script>

<style src="./group.css"></style>
