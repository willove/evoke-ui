<template>
  <button
    :class="['ev-switch', `is-${size}`, { 'is-on': checked, 'is-disabled': disabled }]"
    role="switch"
    :aria-checked="checked"
    :disabled="disabled"
    @click="toggle"
  >
    <span class="ev-switch__knob" />
  </button>
</template>

<script setup>
/**
 * EvSwitch — 开关
 * 受控（v-model）与非受控（不传 modelValue，配 default-value 定初值）双模式
 */
import { useUncontrolled } from '../../composables/useUncontrolled'

const props = defineProps({
  /** 当前状态（v-model） */
  modelValue: { type: Boolean, default: false },
  /** 非受控模式的初始状态 */
  defaultValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const { value: checked, set } = useUncontrolled(props, { defaultValue: props.defaultValue })

function toggle() {
  if (props.disabled) return
  const next = !checked.value
  emit('update:modelValue', set(next))
  emit('change', next)
}
</script>

<style src="./style.css"></style>
