<template>
  <div :class="['ev-textarea', { 'is-disabled': disabled, 'is-error': error }]">
    <textarea
      v-bind="filteredAttrs"
      class="ev-textarea__inner"
      :value="modelValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      @input="onInput"
    />
    <span v-if="maxlength" class="ev-textarea__count">{{ count }} / {{ maxlength }}</span>
  </div>
</template>

<script setup>
/**
 * EvTextarea — 多行文本（留言/评论正文）
 * rows 控制高度，maxlength 显示字数计数；穿透 attrs 到原生 textarea
 */
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false, name: 'EvTextarea' })

const props = defineProps({
  /** 当前值（v-model） */
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  rows: { type: Number, default: 4 },
  /** 最大字数（传入后显示计数） */
  maxlength: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'input'])
const attrs = useAttrs()

const filteredAttrs = computed(() => {
  const { class: _, style: __, ...rest } = attrs
  return rest
})

const count = computed(() => String(props.modelValue || '').length)

function onInput(e) {
  emit('update:modelValue', e.target.value)
  emit('input', e)
}
</script>

<style src="./style.css"></style>
