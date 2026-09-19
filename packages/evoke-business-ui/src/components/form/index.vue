<template>
  <form
    class="eb-form eb-form"
    :class="[`eb-form--label-${labelPosition}`, { 'eb-form--inline': inline, 'eb-form--ripple-off': ripple === false }]"
    @submit.prevent="handleSubmit"
  >
    <slot />
  </form>
</template>

<script setup>
/**
 * EbForm — 表单（async-validator 校验集成）
 * FormInstance 兼容：validate / validateField / resetFields / clearValidate / scrollToField
 * 事件：finish / finish-failed（原生 submit 校验闭环）、values-change（字段值变化）
 */
import { computed, provide, ref, toRef, watch } from 'vue'
import { formContextKey } from '../../composables/useFormItem'

defineOptions({ name: 'EbForm' })

const emit = defineEmits(['finish', 'finish-failed', 'values-change'])

const props = defineProps({
  /** 表单数据对象 */
  model: { type: Object, default: () => ({}) },
  /** 校验规则（async-validator 格式） */
  rules: { type: Object, default: () => ({}) },
  labelPosition: {
    type: String,
    default: 'right',
    validator: (v) => ['left', 'right', 'top'].includes(v),
  },
  labelWidth: { type: [String, Number], default: '' },
  inline: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: '' },
  showMessage: { type: Boolean, default: true },
  inlineMessage: { type: Boolean, default: false },
  statusIcon: { type: Boolean, default: false },
  scrollToError: { type: Boolean, default: false },
  hideRequiredAsterisk: { type: Boolean, default: false },
  validateOnRuleChange: { type: Boolean, default: true },
  /** 批量关闭表单内所有输入类组件的激活涟漪动效（全局开关见 setRipple） */
  ripple: { type: Boolean, default: true },
})

// 注册的字段（EbFormItem onMounted 注册）
const fields = ref([])

function addField(field) {
  if (field && field.prop) {
    fields.value.push(field)
  }
}

function removeField(field) {
  if (field?.prop) {
    fields.value = fields.value.filter((f) => f !== field)
  }
}

/**
 * 校验全部字段
 * @returns {Promise<boolean>} 全部通过 resolve(true)；有失败 reject(invalidFields)
 */
function validate(callback) {
  if (!(props.model && typeof props.model === 'object')) {
    console.warn('[EbForm] model 必须是对象')
    return Promise.resolve(false)
  }
  const promise = new Promise((resolve, reject) => {
    const invalidFields = {}
    const tasks = fields.value.map((field) =>
      field
        .validate('')
        .catch((err) => {
          Object.assign(invalidFields, err)
        })
    )
    Promise.all(tasks).then(() => {
      if (Object.keys(invalidFields).length === 0) {
        resolve(true)
        callback?.(true)
      } else {
        // scrollToError：第一个校验失败的 field 滚入视野
        if (props.scrollToError) {
          const firstProp = Object.keys(invalidFields)[0]
          fields.value.find((f) => f.prop === firstProp)?.scrollErrorIntoView?.()
        }
        reject(invalidFields)
        callback?.(false, invalidFields)
      }
    })
  })
  return promise
}

/**
 * 校验指定字段
 * @param {string|string[]} propsList 字段 prop
 */
function validateField(propsList, callback) {
  const list = Array.isArray(propsList) ? propsList : [propsList]
  const target = fields.value.filter((f) => list.includes(f.prop))
  const promise = new Promise((resolve, reject) => {
    const invalidFields = {}
    Promise.all(
      target.map((field) =>
        field.validate('').catch((err) => {
          Object.assign(invalidFields, err)
        })
      )
    ).then(() => {
      if (Object.keys(invalidFields).length === 0) {
        resolve(true)
        callback?.(true)
      } else {
        reject(invalidFields)
        callback?.(false, invalidFields)
      }
    })
  })
  return promise
}

/** 重置全部字段为初始值并清除校验 */
function resetFields() {
  if (!props.model) return
  fields.value.forEach((field) => field.resetField())
}

/** 清除全部校验状态 */
function clearValidate(propsList) {
  if (propsList === undefined) {
    fields.value.forEach((field) => field.clearValidate())
    return
  }
  const list = Array.isArray(propsList) ? propsList : [propsList]
  fields.value
    .filter((f) => list.includes(f.prop))
    .forEach((field) => field.clearValidate())
}

/** 滚动到指定字段（scrollIntoView 守卫式） */
function scrollToField(prop) {
  const field = fields.value.find((f) => f.prop === prop)
  field?.scrollToField?.()
}

/**
 * 原生 submit 收口：回车 / type=submit 按钮统一先跑 validate
 * 通过 emit finish（负载为 model 副本），失败 emit finish-failed（{ values, errors }）
 */
async function handleSubmit() {
  let invalidFields = null
  const ok = await validate().catch((errors) => {
    invalidFields = errors
    return false
  })
  if (ok) {
    emit('finish', { ...props.model })
  } else {
    emit('finish-failed', { values: { ...props.model }, errors: invalidFields ?? {} })
  }
}

/** 值变化上报收口（FormItem 的 change 校验链路调用） */
function handleValuesChange(changedValues, allValues) {
  emit('values-change', changedValues, allValues)
}

provide(
  formContextKey,
  {
    model: toRef(props, 'model'),
    rules: toRef(props, 'rules'),
    labelWidth: toRef(props, 'labelWidth'),
    labelPosition: toRef(props, 'labelPosition'),
    inline: toRef(props, 'inline'),
    size: toRef(props, 'size'),
    disabled: toRef(props, 'disabled'),
    showMessage: toRef(props, 'showMessage'),
    inlineMessage: toRef(props, 'inlineMessage'),
    statusIcon: toRef(props, 'statusIcon'),
    hideRequiredAsterisk: toRef(props, 'hideRequiredAsterisk'),
    addField,
    removeField,
    validate,
    validateField,
    resetFields,
    clearValidate,
    scrollToField,
    valuesChange: handleValuesChange,
  }
)

// rules 变化时重新校验
watch(
  () => props.rules,
  () => {
    if (props.validateOnRuleChange) {
      validate().catch(() => {})
    }
  },
  { deep: true }
)

defineExpose({
  validate,
  validateField,
  resetFields,
  clearValidate,
  scrollToField,
  fields,
})
</script>

<style src="./style.css"></style>
