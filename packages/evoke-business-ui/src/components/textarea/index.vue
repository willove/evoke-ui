<template>
  <div
    class="ev-textarea ev-textarea"
    :class="[{ 'is-disabled': isDisabled, 'is-exceed': isExceed }, sizeClass, attrs.class]"
    :style="attrs.style"
  >
    <textarea
      ref="textareaRef"
      class="ev-textarea__inner"
      v-bind="inputAttrs"
      :value="innerValue"
      :placeholder="placeholder"
      :disabled="isDisabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :rows="rows"
      :name="name"
      :autocomplete="autocomplete"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
      @change="handleChange"
    />
    <span
      v-if="wordLimitVisible"
      class="ev-input__count"
      :class="{ 'is-exceed': isExceed }"
    >{{ textLength }} / {{ maxlength }}</span>
    <div v-if="error || help" class="ev-input-hint" :class="{ 'is-error': !!error }">
      <span v-if="error" class="hint-error">{{ error }}</span>
      <span v-else class="hint-help">{{ help }}</span>
    </div>
  </div>
</template>

<script setup>
/**
 * EvTextarea — 多行文本框
 * 支持 autosize（boolean | { minRows, maxRows }）、error/help 提示
 */
import { ref, computed, useAttrs, watch, nextTick } from 'vue'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'

defineOptions({ inheritAttrs: false, name: 'EvTextarea' })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  size: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  maxlength: { type: Number, default: undefined },
  showWordLimit: { type: Boolean, default: false },
  rows: { type: Number, default: 3 },
  autosize: { type: [Boolean, Object], default: false },
  error: { type: String, default: '' },
  help: { type: String, default: '' },
  name: { type: String, default: undefined },
  autocomplete: { type: String, default: 'off' },
  validateEvent: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'change', 'input', 'clear'])

const attrs = useAttrs()
const textareaRef = ref(null)

const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})

const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: computed(() => props.size),
  disabled: computed(() => props.disabled),
})

const sizeClass = computed(() => {
  const s = formSize.value
  if (s === 'large') return 'ev-textarea--large'
  if (s === 'small') return 'ev-textarea--small'
  return ''
})

const innerValue = computed(() =>
  props.modelValue === null || props.modelValue === undefined ? '' : props.modelValue
)
const textLength = computed(() => String(innerValue.value).length)
const wordLimitVisible = computed(() => !!(props.showWordLimit && props.maxlength))
const isExceed = computed(() => (props.maxlength ? textLength.value > props.maxlength : false))
const isDisabled = computed(() => formDisabled.value || props.disabled)

function handleInput(e) {
  emit('input', e.target.value)
  emit('update:modelValue', e.target.value)
  if (props.validateEvent) triggerFormValidate(formItem, 'change')
}

function handleBlur(e) {
  emit('blur', e)
  if (props.validateEvent) triggerFormValidate(formItem, 'blur')
}

function handleFocus(e) {
  emit('focus', e)
}

function handleChange(e) {
  emit('change', e.target.value)
}

// autosize 高度自适应
async function resizeTextarea() {
  const el = textareaRef.value
  if (!el || !props.autosize) return
  await nextTick()
  el.style.height = 'auto'
  let height = el.scrollHeight
  if (typeof props.autosize === 'object') {
    const { minRows, maxRows } = props.autosize
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 22
    const minH = minRows ? minRows * lineHeight : 0
    const maxH = maxRows ? maxRows * lineHeight : Infinity
    height = Math.min(Math.max(height, minH), maxH)
  }
  el.style.height = `${height}px`
}

watch(() => props.modelValue, resizeTextarea)

defineExpose({
  focus: (...args) => textareaRef.value?.focus?.(...args),
  blur: (...args) => textareaRef.value?.blur?.(...args),
  select: (...args) => textareaRef.value?.select?.(...args),
  ref: textareaRef,
})
</script>

<style src="../input/style.css"></style>
