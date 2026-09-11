<template>
  <div :class="['ev-field', { 'is-error': !!error }]">
    <label v-if="label || $slots.label" class="ev-field__label">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="ev-field__required" aria-hidden="true">*</span>
    </label>
    <div class="ev-field__control"><slot /></div>
    <span v-if="error" class="ev-field__error">{{ error }}</span>
    <span v-else-if="hint || $slots.hint" class="ev-field__hint"><slot name="hint">{{ hint }}</slot></span>
  </div>
</template>

<script setup>
/**
 * EvField — 表单字段包装（标签 + 控件 + 错误/提示）
 * 与 EvInput / EvTextarea / EvSelect 组合出前台提交表单；error 传非空字符串即错误态
 */
defineProps({
  label: { type: String, default: '' },
  /** 错误提示（非空即错误态） */
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
