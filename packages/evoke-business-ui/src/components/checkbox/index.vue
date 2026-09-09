<template>
  <label
    class="ev-checkbox ev-checkbox"
    :class="[
      sizeClass,
      {
        'is-checked': isChecked,
        'is-disabled': isDisabled,
        'is-indeterminate': indeterminate,
        'is-bordered': border,
      },
    ]"
    role="checkbox"
    :aria-checked="indeterminate ? 'mixed' : isChecked"
    :aria-disabled="isDisabled"
  >
    <span
      class="ev-checkbox__input"
      :class="{
        'is-checked': isChecked,
        'is-disabled': isDisabled,
        'is-indeterminate': indeterminate,
      }"
    >
      <span class="ev-checkbox__inner" />
      <input
        ref="checkboxRef"
        type="checkbox"
        class="ev-checkbox__original"
        :value="label"
        :name="name"
        :checked="isChecked"
        :indeterminate="indeterminate"
        :disabled="isDisabled"
        tabindex="-1"
        @change="handleChange"
      />
    </span>
    <span v-if="hasLabel" class="ev-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup>
/**
 * EvCheckbox — 多选框
 * 值语义：group 内操作数组；独立支持 boolean / true-label / false-label / array
 */
import { computed, ref, useSlots } from 'vue'
import { useCheckboxGroup } from '../radio/group-context'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'

defineOptions({ name: 'EvCheckbox' })

const props = defineProps({
  modelValue: { type: [Boolean, Array, String, Number], default: undefined },
  /** 选项值（group 内）；无插槽时兼作文本 */
  label: { type: [String, Number, Boolean], default: undefined },
  disabled: { type: Boolean, default: false },
  border: { type: Boolean, default: false },
  size: { type: String, default: '' },
  indeterminate: { type: Boolean, default: false },
  /** 选中值别名 */
  trueLabel: { type: [String, Number], default: undefined },
  /** 未选中值别名 */
  falseLabel: { type: [String, Number], default: undefined },
  checked: { type: Boolean, default: undefined },
  name: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue', 'change'])

const slots = useSlots()
const checkboxRef = ref(null)
const group = useCheckboxGroup()
const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: computed(() => props.size),
  disabled: computed(() => props.disabled),
})

const hasLabel = computed(() => props.label !== undefined || !!slots.default)

const isGroup = computed(() => !!group)
const groupValue = computed(() => group?.modelValue?.value ?? [])

const isLimitDisabled = computed(() => {
  if (!group) return false
  const len = groupValue.value.length
  if (group.max?.value !== undefined && len >= group.max.value && !isChecked.value) return true
  if (group.min?.value !== undefined && len <= group.min.value && isChecked.value) return true
  return false
})

const isDisabled = computed(
  () =>
    group?.disabled?.value ||
    formDisabled.value ||
    props.disabled ||
    isLimitDisabled.value
)

const isChecked = computed(() => {
  if (isGroup.value) {
    return groupValue.value.includes(props.label)
  }
  if (props.trueLabel !== undefined) {
    return props.modelValue === props.trueLabel
  }
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.label)
  }
  if (props.modelValue === undefined) return !!props.checked
  return !!props.modelValue
})

const sizeClass = computed(() => {
  const s = props.size || group?.size?.value || formSize.value
  if (s === 'large') return 'ev-checkbox--large'
  if (s === 'small') return 'ev-checkbox--small'
  return ''
})

function computeNextValue() {
  if (isGroup.value) {
    const list = [...groupValue.value]
    const idx = list.indexOf(props.label)
    if (idx >= 0) {
      list.splice(idx, 1)
    } else {
      list.push(props.label)
    }
    return list
  }
  if (props.trueLabel !== undefined) {
    return isChecked.value ? props.falseLabel : props.trueLabel
  }
  if (Array.isArray(props.modelValue)) {
    const list = [...props.modelValue]
    const idx = list.indexOf(props.label)
    if (idx >= 0) {
      list.splice(idx, 1)
    } else {
      list.push(props.label)
    }
    return list
  }
  if (props.modelValue === undefined) return !props.checked
  return !props.modelValue
}

function handleChange() {
  if (isDisabled.value) return
  const next = computeNextValue()
  if (isGroup.value) {
    group.change(next)
  } else {
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

<style src="./style.css"></style>
