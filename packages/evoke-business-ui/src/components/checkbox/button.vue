<template>
  <label
    class="ev-checkbox-button ev-checkbox-button"
    :class="[sizeClass, { 'is-checked': isChecked, 'is-disabled': isDisabled }]"
    role="checkbox"
    :aria-checked="isChecked"
    :aria-disabled="isDisabled"
  >
    <input
      ref="checkboxRef"
      type="checkbox"
      class="ev-checkbox-button__original-checkbox"
      :value="label"
      :name="name"
      :checked="isChecked"
      :disabled="isDisabled"
      tabindex="-1"
      @change="handleChange"
    />
    <span class="ev-checkbox-button__inner">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup>
/**
 * EvCheckboxButton — 按钮风格多选
 * group 内 inject 共享 modelValue（数组）
 */
import { computed, ref } from 'vue'
import { useCheckboxGroup } from '../radio/group-context'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'

defineOptions({ name: 'EvCheckboxButton' })

const props = defineProps({
  modelValue: { type: [Boolean, Array], default: undefined },
  label: { type: [String, Number, Boolean], default: undefined },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: '' },
  checked: { type: Boolean, default: undefined },
  name: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue', 'change'])

const checkboxRef = ref(null)
const group = useCheckboxGroup()
const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: computed(() => props.size),
  disabled: computed(() => props.disabled),
})

const groupValue = computed(() => group?.modelValue?.value ?? [])

const isDisabled = computed(
  () => group?.disabled?.value || formDisabled.value || props.disabled
)

const isChecked = computed(() => {
  if (group) return groupValue.value.includes(props.label)
  if (Array.isArray(props.modelValue)) return props.modelValue.includes(props.label)
  if (props.modelValue === undefined) return !!props.checked
  return !!props.modelValue
})

const sizeClass = computed(() => {
  const s = props.size || group?.size?.value || formSize.value
  if (s === 'large') return 'ev-checkbox-button--large'
  if (s === 'small') return 'ev-checkbox-button--small'
  return ''
})

function handleChange() {
  if (isDisabled.value) return
  let next
  if (group) {
    const list = [...groupValue.value]
    const idx = list.indexOf(props.label)
    if (idx >= 0) {
      list.splice(idx, 1)
    } else {
      list.push(props.label)
    }
    next = list
    group.change(next)
  } else {
    if (Array.isArray(props.modelValue)) {
      const list = [...props.modelValue]
      const idx = list.indexOf(props.label)
      if (idx >= 0) {
        list.splice(idx, 1)
      } else {
        list.push(props.label)
      }
      next = list
    } else {
      next = !isChecked.value
    }
    emit('update:modelValue', next)
    emit('change', next)
  }
  triggerFormValidate(formItem, 'change')
}

defineExpose({
  focus: () => checkboxRef.value?.focus?.(),
  blur: () => checkboxRef.value?.blur?.(),
  ref: checkboxRef,
})
</script>

<style src="./button.css"></style>
