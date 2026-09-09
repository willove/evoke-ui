<template>
  <div :class="['ew-field', { 'is-error': !!error }]">
    <label v-if="label || $slots.label" class="ew-field__label">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="ew-field__required" aria-hidden="true">*</span>
    </label>
    <div class="ew-field__control"><slot /></div>
    <span v-if="error" class="ew-field__error">{{ error }}</span>
    <span v-else-if="hint || $slots.hint" class="ew-field__hint"><slot name="hint">{{ hint }}</slot></span>
  </div>
</template>

<script setup>
/**
 * EwField — 表单字段包装（标签 + 控件 + 错误/提示）
 * 与 EwInput / EwTextarea / EwSelect 组合出前台提交表单；error 传非空字符串即错误态
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
