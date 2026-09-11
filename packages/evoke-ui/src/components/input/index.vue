<template>
  <div :class="['ev-input', `is-${size}`, { 'is-disabled': disabled, 'is-error': error }]">
    <EvIcon v-if="icon" :name="icon" :size="iconSize" class="ev-input__prefix" />
    <input
      v-bind="filteredAttrs"
      class="ev-input__inner"
      :value="modelValue"
      :type="type"
      :disabled="disabled"
      :placeholder="placeholder"
      @input="onInput"
    />
    <button
      v-if="clearable && modelValue && !disabled"
      type="button"
      class="ev-input__clear"
      aria-label="清空"
      @click="clear"
    >
      <EvIcon name="close" :size="12" />
    </button>
    <div v-if="$slots.suffix" class="ev-input__suffix"><slot name="suffix" /></div>
  </div>
</template>

<script setup>
/**
 * EvInput — 文本输入（留言/评论/订阅等前台提交场景的基础件）
 * prefix 图标、可清空、错误态、三档尺寸；穿透 attrs 到原生 input
 */
import { computed, ref, useAttrs } from 'vue'
import EvIcon from '../icon/index.vue'

defineOptions({ inheritAttrs: false, name: 'EvInput' })

const props = defineProps({
  /** 当前值（v-model） */
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  /** 前缀图标名 */
  icon: { type: String, default: '' },
  /** 展示清空按钮 */
  clearable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
})

const emit = defineEmits(['update:modelValue', 'input', 'clear'])
const attrs = useAttrs()
const focused = ref(false)

const iconSize = computed(() => (props.size === 'small' ? 13 : props.size === 'large' ? 17 : 15))

// class/style 由外层容器承载，其余 attrs（maxlength 等）透传给原生 input
const filteredAttrs = computed(() => {
  const { class: _, style: __, ...rest } = attrs
  return rest
})

function onInput(e) {
  emit('update:modelValue', e.target.value)
  emit('input', e)
}

function clear() {
  emit('update:modelValue', '')
  emit('clear')
}

defineExpose({ focused })
</script>

<style src="./style.css"></style>
