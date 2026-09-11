<template>
  <button
    ref="btnRef"
    :class="[
      'ev-icon-button',
      `ev-icon-button--${size}`,
      `is-${variant}`,
      { 'is-round': round, 'is-disabled': disabled },
    ]"
    :type="nativeType"
    :disabled="disabled"
    :aria-label="ariaLabel || icon"
    @click="handleClick"
  >
    <EvIcon :name="icon" :size="iconSize" />
    <slot />
  </button>
</template>

<script setup>
/**
 * EvIconButton — 图标按钮（官网头部动作：主题切换 / GitHub / 下载等）
 * remixicon 头部语言：方圆角小按钮，round 转正圆
 */
import { ref, computed } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  /** 图标名（kebab-case） */
  icon: { type: String, required: true },
  variant: {
    type: String,
    default: 'ghost',
    validator: (v) => ['ghost', 'soft', 'outline', 'primary', 'dark'].includes(v),
  },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
  /** 正圆形态 */
  round: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  /** 无障碍标签，缺省取 icon 名 */
  ariaLabel: { type: String, default: '' },
  nativeType: { type: String, default: 'button' },
})

const emit = defineEmits(['click'])
const btnRef = ref(null)

const iconSize = computed(() => (props.size === 'small' ? 14 : props.size === 'large' ? 20 : 16))

function handleClick(e) {
  if (props.disabled) {
    e.preventDefault()
    return
  }
  emit('click', e)
}

defineExpose({
  ref: btnRef,
  focus: (...args) => btnRef.value?.focus?.(...args),
  blur: (...args) => btnRef.value?.blur?.(...args),
})
</script>

<style src="./style.css"></style>
