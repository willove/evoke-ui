<template>
  <div
    ref="rootRef"
    class="eb-form-item eb-form-item"
    :class="[
      formItemSize ? `eb-form-item--${formItemSize}` : '',
      {
        'is-error': validateState === 'error',
        'is-success': validateState === 'success',
        'is-required': isRequired,
        'is-no-asterisk': form?.hideRequiredAsterisk?.value,
        'is-inline': form?.inline?.value,
      },
    ]"
    role="group"
    :aria-labelledby="labelId"
  >
    <label
      v-if="label || $slots.label"
      :id="labelId"
      :for="prop || undefined"
      class="eb-form-item__label"
      :style="labelStyle"
    >
      <slot name="label">{{ label }}</slot>
    </label>
    <div class="eb-form-item__content" :style="contentStyle">
      <slot />
      <Transition name="eb-form-item-fade">
        <div
          v-if="shouldShowError"
          class="eb-form-item__error"
          :class="{ 'eb-form-item__error--inline': isInlineMessage }"
        >
          {{ validateMessage }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
/**
 * EbFormItem — 表单项（async-validator 校验，trigger 支持 blur / change）
 * EbInput 等输入组件经 useFormItem inject 本组件触发 blur/change 校验
 */
import { computed, inject, onBeforeUnmount, onMounted, provide, ref, useSlots, watch } from 'vue'
import asyncValidator from 'async-validator'
import { formContextKey, formItemContextKey } from '../../composables/useFormItem'

defineOptions({ name: 'EbFormItem' })

const props = defineProps({
  /** 字段路径（model 的 key） */
  prop: { type: String, default: '' },
  label: { type: String, default: '' },
  labelWidth: { type: [String, Number], default: '' },
  labelPosition: {
    type: String,
    default: undefined,
    validator: (v) => ['left', 'right', 'top'].includes(v),
  },
  required: { type: Boolean, default: undefined },
  /** 覆盖 form 的该字段规则 */
  rules: { type: [Object, Array], default: undefined },
  /** 手动错误信息（覆盖校验结果） */
  error: { type: String, default: '' },
  showMessage: { type: Boolean, default: undefined },
  inlineMessage: { type: Boolean, default: undefined },
  size: { type: String, default: '' },
})

const slots = useSlots()
const form = inject(formContextKey, null)

const validateState = ref('')
const validateMessage = ref('')
let initialValue = undefined
let uid = 0

const labelId = `eb-form-item-${Math.random().toString(36).slice(2, 9)}`

// ─── label 宽度/位置 ───
const normalizedLabelPosition = computed(() => {
  if (props.labelPosition) return props.labelPosition
  return form?.labelPosition?.value ?? 'right'
})

const resolvedLabelWidth = computed(() => props.labelWidth || form?.labelWidth?.value || '')

const labelStyle = computed(() => {
  if (normalizedLabelPosition.value === 'top') return {}
  const w = resolvedLabelWidth.value
  if (!w) return {}
  const width = typeof w === 'number' ? `${w}px` : w
  return { width, flexBasis: width, justifyContent: normalizedLabelPosition.value === 'right' ? 'flex-end' : 'flex-start' }
})

// 无 label 的表单项（常用于放置操作按钮）：保留标签列宽度，使内容与输入框列对齐
const contentStyle = computed(() => {
  if (normalizedLabelPosition.value === 'top') return {}
  if (props.label || slots.label) return {}
  const w = props.labelWidth || form?.labelWidth?.value || ''
  if (!w) return {}
  return { marginLeft: typeof w === 'number' ? `${w}px` : w }
})

// ─── 尺寸/禁用 向下注入 ───
const formItemSize = computed(() => props.size || form?.size?.value || '')

provide(
  formItemContextKey,
  {
    size: computed(() => formItemSize.value),
    disabled: computed(() => !!form?.disabled?.value),
    validate: (trigger) => {
      // 值变化收口：change 触发时 model 已写入新值，向上上报一次
      if (trigger === 'change') reportValuesChange()
      return validate(trigger)
    },
  }
)

/** 上报值变化（form 收口后 emit values-change） */
function reportValuesChange() {
  const model = form?.model?.value
  if (!props.prop || !model || typeof model !== 'object') return
  form?.valuesChange?.({ [props.prop]: fieldValue.value }, { ...model })
}

// ─── 规则收集 ───
const normalizedRules = computed(() => {
  const raw = props.rules ?? form?.rules?.value?.[props.prop]
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
})

const isRequired = computed(() => {
  if (props.required !== undefined) return props.required
  return normalizedRules.value.some(
    (rule) => rule && rule.required
  )
})

// ─── 值读写（form.model[prop]） ───
const fieldValue = computed(() => {
  if (!props.prop) return undefined
  const model = form?.model?.value
  if (!model) return undefined
  // 支持 a.b.c 路径
  return props.prop.split('.').reduce((obj, key) => obj?.[key], model)
})

function setFieldValue(value) {
  if (!props.prop || !form?.model?.value) return
  const path = props.prop.split('.')
  const model = form.model.value
  let obj = model
  for (let i = 0; i < path.length - 1; i++) {
    if (obj[path[i]] === undefined) obj[path[i]] = {}
    obj = obj[path[i]]
  }
  obj[path[path.length - 1]] = value
}

// ─── 校验 ───
/**
 * @param {string|''} trigger 'blur' | 'change' | ''（空为不过滤）
 * @returns {Promise<boolean>} 成功 resolve(true)；失败 reject({ [prop]: messages })
 */
function validate(trigger) {
  if (!props.prop) return Promise.resolve(true)
  const rules = filterRules(trigger)
  if (!rules.length) {
    validateState.value = ''
    validateMessage.value = ''
    return Promise.resolve(true)
  }
  validateState.value = 'validating'
  const descriptor = { [props.prop]: rules }
  const validator = new asyncValidator(descriptor)
  const source = { [props.prop]: fieldValue.value }
  return new Promise((resolve, reject) => {
    validator.validate(source, { firstFields: true }, (errors) => {
      if (errors) {
        validateState.value = 'error'
        validateMessage.value = errors[0]?.message ?? ''
        reject({ [props.prop]: validateMessage.value })
      } else {
        validateState.value = 'success'
        validateMessage.value = ''
        resolve(true)
      }
    }).catch(() => {
      /* 回调风格已处理，这里吞掉未捕获 promise */
    })
  })
}

function filterRules(trigger) {
  const rules = normalizedRules.value
  if (trigger === '' || !trigger) return rules
  return rules.filter((rule) => {
    if (!rule.trigger) return true
    const t = Array.isArray(rule.trigger) ? rule.trigger : [rule.trigger]
    return t.includes(trigger)
  })
}

/** 重置为初始值并清除校验 */
function resetField() {
  validateState.value = ''
  validateMessage.value = ''
  if (form?.model?.value && props.prop) {
    setFieldValue(initialValue)
  }
}

/** 清除校验状态 */
function clearValidate() {
  validateState.value = ''
  validateMessage.value = ''
}

function scrollToField() {
  const el = document.querySelector(`#${labelId}`)?.parentElement
  el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
}

const rootRef = ref(null)

/** scrollToError 用：失败项滚入视野（nearest + smooth） */
function scrollErrorIntoView() {
  rootRef.value?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
}

// ─── 手动 error prop ───
watch(
  () => props.error,
  (val) => {
    if (val) {
      validateState.value = 'error'
      validateMessage.value = val
    } else if (validateMessage.value === '') {
      validateState.value = ''
    }
  },
  { immediate: true }
)

const shouldShowError = computed(() => {
  const showMessage = props.showMessage ?? form?.showMessage?.value ?? true
  return showMessage && validateState.value === 'error' && !!validateMessage.value
})

const isInlineMessage = computed(
  () => props.inlineMessage ?? form?.inlineMessage?.value ?? false
)

// ─── 注册/注销 ───
onMounted(() => {
  if (props.prop) {
    initialValue = fieldValue.value
    form?.addField?.(exposed)
  }
})

onBeforeUnmount(() => {
  form?.removeField?.(exposed)
})

const exposed = {
  get prop() {
    return props.prop
  },
  validate,
  resetField,
  clearValidate,
  scrollToField,
  scrollErrorIntoView,
  validateState,
  validateMessage,
}

defineExpose({
  validate,
  resetField,
  clearValidate,
  scrollToField,
  scrollErrorIntoView,
  validateState,
  validateMessage,
})
</script>

<style src="./item.css"></style>
