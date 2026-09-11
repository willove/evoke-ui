<template>
  <div
    class="eb-switch eb-switch"
    :class="[
      sizeClass,
      {
        'is-checked': isChecked,
        'is-disabled': isDisabled,
        'is-loading': loading,
      },
    ]"
    role="switch"
    :aria-checked="isChecked"
    :aria-disabled="isDisabled"
    @click.prevent="handleToggle"
  >
    <input
      ref="inputRef"
      type="checkbox"
      class="eb-switch__input"
      :name="name"
      :checked="isChecked"
      :disabled="isDisabled"
      tabindex="-1"
      @change="handleToggle"
      @keydown.enter.prevent="handleToggle"
    />
    <!-- 非 inline：文案在开关外侧两侧，core 内只保留圆点 -->
    <span v-if="!inlinePrompt && inactiveText" class="eb-switch__label">{{ inactiveText }}</span>
    <span class="eb-switch__core" :style="coreStyle">
      <span class="eb-switch__action">
        <eb-icon v-if="loading" name="loading" class="is-rotating" :size="12" />
      </span>
      <span v-if="inlinePrompt && (activeText || inactiveText)" class="eb-switch__inner">
        <span class="eb-switch__inner-left">{{ inactiveText }}</span>
        <span class="eb-switch__inner-right">{{ activeText }}</span>
      </span>
    </span>
    <span v-if="!inlinePrompt && activeText" class="eb-switch__label eb-switch__label--active">{{ activeText }}</span>
  </div>
</template>

<script setup>
/**
 * EbSwitch — 开关
 * 兼容 active-value/inactive-value/active-text/inactive-text/inline-prompt
 */
import { computed, ref } from 'vue'
import EbIcon from '../icon/index.vue'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'

defineOptions({ name: 'EbSwitch' })

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large', ''].includes(v),
  },
  activeText: { type: String, default: '' },
  inactiveText: { type: String, default: '' },
  activeValue: { type: [String, Number, Boolean], default: true },
  inactiveValue: { type: [String, Number, Boolean], default: false },
  inlinePrompt: { type: Boolean, default: false },
  /** 宽度（px） */
  width: { type: [String, Number], default: undefined },
  name: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue', 'change'])

const inputRef = ref(null)
const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: computed(() => props.size),
  disabled: computed(() => props.disabled),
})

const isChecked = computed(() => props.modelValue === props.activeValue)
const isDisabled = computed(() => formDisabled.value || props.disabled)

const sizeClass = computed(() => {
  const s = props.size || formSize.value
  if (s === 'large') return 'eb-switch--large'
  if (s === 'small') return 'eb-switch--small'
  return ''
})

const coreStyle = computed(() => {
  const w = props.width === undefined ? undefined : (typeof props.width === 'number' ? `${props.width}px` : props.width)
  if (!w) return undefined
  // 同步暴露变量供 action 位移的 translateX(calc(...)) 消费
  return { width: w, '--eb-switch-core-width': w }
})

function handleToggle() {
  if (isDisabled.value || props.loading) return
  const next = isChecked.value ? props.inactiveValue : props.activeValue
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
    emit('change', next)
    triggerFormValidate(formItem, 'change')
  }
}

defineExpose({
  focus: () => inputRef.value?.focus?.(),
  blur: () => inputRef.value?.blur?.(),
  ref: inputRef,
})
</script>

<style src="./style.css"></style>
