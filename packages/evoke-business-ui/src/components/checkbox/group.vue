<template>
  <div
    class="eb-checkbox-group eb-checkbox-group"
    :class="sizeClass"
    role="group"
    :aria-disabled="isDisabled"
  >
    <slot />
  </div>
</template>

<script setup>
/**
 * EbCheckboxGroup — 多选组
 * provide checkboxGroupContextKey，子 Checkbox inject 共享 modelValue（数组）
 */
import { computed, provide, toRef } from 'vue'
import { checkboxGroupContextKey } from '../radio/group-context'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  size: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  fill: { type: String, default: undefined },
  textColor: { type: String, default: undefined },
  /** 可选数量上限 */
  max: { type: Number, default: undefined },
  /** 可选数量下限 */
  min: { type: Number, default: undefined },
})

const emit = defineEmits(['update:modelValue', 'change'])

const isDisabled = computed(() => props.disabled)

const sizeClass = computed(() => {
  if (props.size === 'large') return 'eb-checkbox-group--large'
  if (props.size === 'small') return 'eb-checkbox-group--small'
  return ''
})

provide(
  checkboxGroupContextKey,
  {
    modelValue: toRef(props, 'modelValue'),
    size: toRef(props, 'size'),
    disabled: toRef(props, 'disabled'),
    fill: toRef(props, 'fill'),
    textColor: toRef(props, 'textColor'),
    max: toRef(props, 'max'),
    min: toRef(props, 'min'),
    change: (value) => {
      emit('update:modelValue', value)
      emit('change', value)
    },
  }
)
</script>

<style src="./group.css"></style>
