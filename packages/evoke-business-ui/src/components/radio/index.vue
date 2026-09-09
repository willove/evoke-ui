<template>
  <label
    class="ev-radio ev-radio"
    :class="[
      sizeClass,
      {
        'is-checked': isChecked,
        'is-disabled': isDisabled,
        'is-bordered': border,
      },
    ]"
    role="radio"
    :aria-checked="isChecked"
    :aria-disabled="isDisabled"
  >
    <span class="ev-radio__input" :class="{ 'is-checked': isChecked, 'is-disabled': isDisabled }">
      <span class="ev-radio__inner" :style="checkedStyle" />
      <input
        ref="radioRef"
        type="radio"
        class="ev-radio__original"
        :value="label"
        :name="radioName"
        :checked="isChecked"
        :disabled="isDisabled"
        tabindex="-1"
        @change="handleChange"
      />
    </span>
    <span class="ev-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup>
/**
 * EvRadio — 单选框
 * group 内 inject 共享 modelValue；label 即选项值
 */
import { computed, ref } from 'vue'
import { useRadioGroup } from './group-context'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'

defineOptions({ name: 'EvRadio' })

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: '' },
  /** 选项值；无插槽内容时兼作文本显示 */
  label: { type: [String, Number, Boolean], default: '' },
  disabled: { type: Boolean, default: false },
  border: { type: Boolean, default: false },
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

const isGroup = computed(() => !!group)
const groupValue = computed(() => group?.modelValue?.value)

const actualValue = computed(() =>
  isGroup.value ? groupValue.value : props.modelValue
)
const isChecked = computed(() => actualValue.value === props.label)

const isDisabled = computed(() =>
  group?.disabled?.value || formDisabled.value || props.disabled
)

const radioName = computed(() => props.name ?? group?.name?.value)

const sizeClass = computed(() => {
  const s = props.size || group?.size?.value || formSize.value
  if (s === 'large') return 'ev-radio--large'
  if (s === 'small') return 'ev-radio--small'
  return ''
})

// border 模式激活态边框色
const checkedStyle = computed(() => {
  if (!isChecked.value || !props.border) return undefined
  return { borderColor: group?.fill?.value ?? 'var(--ev-color-primary)' }
})

function handleChange() {
  if (isDisabled.value) return
  if (isGroup.value) {
    if (groupValue.value !== props.label) group.change(props.label)
  } else if (props.modelValue !== props.label) {
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

<style src="./style.css"></style>
