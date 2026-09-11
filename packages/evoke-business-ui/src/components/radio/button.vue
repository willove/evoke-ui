<template>
  <label
    class="eb-radio-button eb-radio-button"
    :class="[sizeClass, { 'is-active': isChecked, 'is-disabled': isDisabled }]"
    role="radio"
    :aria-checked="isChecked"
    :aria-disabled="isDisabled"
  >
    <input
      ref="radioRef"
      type="radio"
      class="eb-radio-button__original-radio"
      :value="label"
      :name="radioName"
      :checked="isChecked"
      :disabled="isDisabled"
      tabindex="-1"
      @change="handleChange"
    />
    <span class="eb-radio-button__inner">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup>
/**
 * EbRadioButton — 按钮风格单选
 * group 内 inject 共享 modelValue
 */
import { computed, ref } from 'vue'
import { useRadioGroup } from './group-context'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'

defineOptions({ name: 'EbRadioButton' })

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: '' },
  label: { type: [String, Number, Boolean], default: '' },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: '' },
  name: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue', 'change'])

const radioRef = ref(null)
const group = useRadioGroup()
const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: computed(() => props.size),
  disabled: computed(() => props.disabled),
})

const actualValue = computed(() => group?.modelValue?.value ?? props.modelValue)
const isChecked = computed(() => actualValue.value === props.label)
const isDisabled = computed(
  () => group?.disabled?.value || formDisabled.value || props.disabled
)
const radioName = computed(() => props.name ?? group?.name?.value)

const sizeClass = computed(() => {
  const s = props.size || group?.size?.value || formSize.value
  if (s === 'large') return 'eb-radio-button--large'
  if (s === 'small') return 'eb-radio-button--small'
  return ''
})

function handleChange() {
  if (isDisabled.value) return
  if (group && group.modelValue.value !== props.label) {
    group.change(props.label)
  } else if (!group && props.modelValue !== props.label) {
    emit('update:modelValue', props.label)
    emit('change', props.label)
  }
  triggerFormValidate(formItem, 'change')
}

defineExpose({
  focus: () => radioRef.value?.focus?.(),
  blur: () => radioRef.value?.blur?.(),
  ref: radioRef,
})
</script>

<style src="./button.css"></style>
