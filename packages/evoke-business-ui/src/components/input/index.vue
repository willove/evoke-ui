<template>
  <div
    v-if="type === 'textarea'"
    class="ev-textarea ev-textarea"
    :class="[{ 'is-disabled': isDisabled, 'is-exceed': isExceed, 'is-focus': isFocused }, sizeClass, attrs.class]"
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

  <div
    v-else
    class="ev-input ev-input"
    :class="[
      sizeClass,
      attrs.class,
      {
        'is-disabled': isDisabled,
        'is-clearable': clearable && !isDisabled,
        'is-exceed': isExceed,
        'is-error': hasError,
        'is-shake': isShaking,
      },
    ]"
    :style="attrs.style"
  >
    <div
      class="ev-input__wrapper"
      :class="{ 'is-focus': isFocused, 'is-disabled': isDisabled, 'is-error': hasError }"
    >
      <span v-if="prefixVisible" class="ev-input__prefix">
        <ev-icon v-if="prefixIconName" :name="prefixIconName" />
        <component :is="prefixIcon" v-else-if="prefixIcon" />
        <slot name="prefix" />
      </span>
      <input
        ref="inputRef"
        class="ev-input__inner"
        v-bind="inputAttrs"
        :type="computedType"
        :value="innerValue"
        :placeholder="placeholder"
        :disabled="isDisabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :name="name"
        :autocomplete="autocomplete"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @change="handleChange"
        @keydown="handleKeydown"
      />
      <span v-if="suffixVisible" class="ev-input__suffix">
        <span v-if="wordLimitVisible" class="ev-input__count" :class="{ 'is-exceed': isExceed }">
          {{ textLength }} / {{ maxlength }}
        </span>
        <slot name="suffix" />
        <ev-icon
          v-if="showClear"
          class="ev-input__clear"
          name="circle-close"
          @click.stop="handleClear"
          @mousedown.prevent
        />
        <ev-icon
          v-if="showPasswordIcon"
          class="ev-input__password"
          :name="passwordVisible ? 'hide' : 'view'"
          @click.stop="togglePassword"
          @mousedown.prevent
        />
        <ev-icon v-if="suffixIconName" :name="suffixIconName" />
        <component :is="suffixIcon" v-else-if="suffixIcon" />
      </span>
    </div>
    <div v-if="error || help" class="ev-input-hint" :class="{ 'is-error': !!error }">
      <span v-if="error" class="hint-error">{{ error }}</span>
      <span v-else class="hint-help">{{ help }}</span>
    </div>
  </div>
</template>

<script setup>
/**
 * EvInput — 输入框
 * 扩展能力：error / help 提示、shake 抖动提醒、clearable 默认开启
 * 表单集成：inject formItemContext，blur/change 时触发校验（validate-event 控制）
 */
import { ref, computed, useAttrs, useSlots, watch, nextTick } from 'vue'
import EvIcon from '../icon/index.vue'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'

defineOptions({ inheritAttrs: false, name: 'EvInput' })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  size: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  /** 清空按钮（默认开启） */
  clearable: { type: Boolean, default: true },
  showPassword: { type: Boolean, default: false },
  prefixIcon: { type: [Object, String], default: undefined },
  suffixIcon: { type: [Object, String], default: undefined },
  maxlength: { type: Number, default: undefined },
  showWordLimit: { type: Boolean, default: false },
  rows: { type: Number, default: 2 },
  autosize: { type: [Boolean, Object], default: false },
  error: { type: String, default: '' },
  help: { type: String, default: '' },
  name: { type: String, default: undefined },
  autocomplete: { type: String, default: 'off' },
  /** 表单校验触发开关 */
  validateEvent: { type: Boolean, default: true },
})

const emit = defineEmits([
  'update:modelValue',
  'blur',
  'focus',
  'change',
  'clear',
  'input',
  'keydown',
])

const attrs = useAttrs()
const slots = useSlots()
const inputRef = ref(null)
const textareaRef = ref(null)
const isFocused = ref(false)
const passwordVisible = ref(false)
const isShaking = ref(false)
const hasError = ref(false)

// 抖动动画时长，与 CSS .is-shake animation duration 对齐
const SHAKE_DURATION_MS = 400

// class/style 留在根节点，其余 attrs 透传给 input/textarea
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
  if (s === 'large') return 'ev-input--large'
  if (s === 'small') return 'ev-input--small'
  return ''
})

const innerValue = computed(() =>
  props.modelValue === null || props.modelValue === undefined ? '' : props.modelValue
)

const computedType = computed(() => {
  if (props.showPassword) return passwordVisible.value ? 'text' : 'password'
  return props.type
})

const textLength = computed(() => String(innerValue.value).length)
const wordLimitVisible = computed(() => !!(props.showWordLimit && props.maxlength))
const isExceed = computed(() =>
  props.maxlength ? textLength.value > props.maxlength : false
)

const prefixVisible = computed(() => !!(props.prefixIcon || slots.prefix))
const suffixVisible = computed(
  () => !!(props.suffixIcon || props.showPassword || props.clearable || wordLimitVisible.value || slots.suffix)
)

const prefixIconName = computed(() =>
  typeof props.prefixIcon === 'string' ? props.prefixIcon : null
)
const suffixIconName = computed(() =>
  typeof props.suffixIcon === 'string' ? props.suffixIcon : null
)

const showClear = computed(
  () => props.clearable && !isDisabled.value && !props.readonly && !!innerValue.value
)
const showPasswordIcon = computed(() => props.showPassword && !isDisabled.value && !!innerValue.value)

const isDisabled = computed(() => formDisabled.value || props.disabled)

watch(
  () => props.error,
  (newError, oldError) => {
    hasError.value = !!newError
    if (newError && newError !== oldError) {
      isShaking.value = true
      setTimeout(() => {
        isShaking.value = false
      }, SHAKE_DURATION_MS)
    }
  }
)

function handleInput(e) {
  const value = e.target.value
  emit('input', value)
  emit('update:modelValue', value)
  if (hasError.value) hasError.value = false
  if (props.validateEvent) triggerFormValidate(formItem, 'change')
}

function handleBlur(e) {
  isFocused.value = false
  emit('blur', e)
  if (props.validateEvent) triggerFormValidate(formItem, 'blur')
}

function handleFocus(e) {
  isFocused.value = true
  emit('focus', e)
}

function handleChange(e) {
  emit('change', e.target.value)
}

function handleKeydown(e) {
  emit('keydown', e)
}

function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
  emit('input', '')
  if (props.validateEvent) triggerFormValidate(formItem, 'change')
  nextTick(() => inputRef.value?.focus?.())
}

function togglePassword() {
  passwordVisible.value = !passwordVisible.value
  nextTick(() => inputRef.value?.focus?.())
}

// autosize：textarea 高度自适应
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
  focus: (...args) => (inputRef.value ?? textareaRef.value)?.focus?.(...args),
  blur: (...args) => (inputRef.value ?? textareaRef.value)?.blur?.(...args),
  select: (...args) => (inputRef.value ?? textareaRef.value)?.select?.(...args),
  ref: inputRef,
})
</script>

<style src="./style.css"></style>
