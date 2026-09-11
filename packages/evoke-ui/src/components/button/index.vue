<template>
  <component
    :is="href ? 'a' : 'button'"
    ref="btnRef"
    :class="[
      'ev-button',
      `ev-button--${sizeClass}`,
      `is-${variant}`,
      {
        'is-pill': pill,
        'is-block': block,
        'is-disabled': disabled || loading,
        'is-loading': loading,
        'is-icon-only': iconOnly,
      },
    ]"
    :type="href ? undefined : nativeType"
    :href="href || undefined"
    :target="href ? target || undefined : undefined"
    :rel="href ? rel || (target === '_blank' ? 'noopener' : undefined) : undefined"
    :disabled="href ? undefined : disabled || loading"
    :aria-disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="ev-button__loading">
      <EvIcon name="loading" :size="iconSize" class="is-rotating" />
    </span>
    <EvIcon v-else-if="icon" :name="icon" :size="iconSize" class="ev-button__icon" />
    <span v-if="$slots.default" class="ev-button__content"><slot /></span>
    <EvIcon
      v-if="iconRight && !loading"
      :name="iconRight"
      :size="iconSize"
      class="ev-button__icon ev-button__icon--right"
    />
  </component>
</template>

<script setup>
/**
 * EvButton — 按钮（官网 CTA 语言）
 * variant：primary 蓝色实心 / dark 墨色实心（launchos 黑胶囊 CTA）/
 *          soft 柔和底（remixicon 头部下载钮）/ outline / ghost
 * 默认 radius-lg 圆润矩形，pill 转全圆胶囊
 * href 传入时渲染为 <a>（站内/外链跳转），target="_blank" 自动补 noopener
 */
import { ref, computed, useSlots } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  /** 视觉变体 */
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'dark', 'soft', 'outline', 'ghost'].includes(v),
  },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
  /** 全圆胶囊形态（launchos CTA 语言） */
  pill: { type: Boolean, default: false },
  /** 块级铺满 */
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  /** 左侧图标名（kebab-case） */
  icon: { type: String, default: undefined },
  /** 右侧图标名（如 arrow-right 引导跳转） */
  iconRight: { type: String, default: undefined },
  nativeType: {
    type: String,
    default: 'button',
    validator: (v) => ['button', 'submit', 'reset'].includes(v),
  },
  /** 链接地址：传入时按钮渲染为 <a>，站内/外链跳转直接可用 */
  href: { type: String, default: undefined },
  /** 链接打开方式（href 存在时生效） */
  target: { type: String, default: undefined },
  /** rel 属性（href + target="_blank" 时默认 noopener） */
  rel: { type: String, default: undefined },
})

const emit = defineEmits(['click'])
const slots = useSlots()
const btnRef = ref(null)

// 仅图标无文本时自动方/圆形态
const iconOnly = computed(() => !slots.default && (!!props.icon || !!props.loading))

const sizeClass = computed(() => (props.size === 'default' ? 'md' : props.size))

const iconSize = computed(() => (props.size === 'small' ? 14 : props.size === 'large' ? 18 : 16))

function handleClick(e) {
  if (props.disabled || props.loading) {
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
