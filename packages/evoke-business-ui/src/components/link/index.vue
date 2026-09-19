<template>
  <a
    class="eb-link eb-link"
    :class="[
      `eb-link--${typeClass}`,
      { 'is-disabled': disabled, 'is-underline': underlined, 'is-underline-hover': underline === 'hover' },
    ]"
    :href="disabled || !href ? undefined : href"
    :target="disabled || !href ? undefined : target"
    :rel="!disabled && href && target === '_blank' ? 'noopener noreferrer' : undefined"
    :aria-disabled="disabled || undefined"
    @click="handleClick"
  >
    <eb-icon v-if="icon" :name="icon" :size="14" style="margin-right: 4px;" />
    <span class="eb-link__inner"><slot /></span>
  </a>
</template>

<script setup>
/**
 * EbLink — 文字链接
 * underline 入参兼容布尔与字符串两种写法，布尔一律映射为 always / never
 */
import { computed } from 'vue'
import EbIcon from '../icon/index.vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (v) => ['primary', 'success', 'warning', 'info', 'danger', 'error', 'default'].includes(v),
  },
  underline: { type: [Boolean, String], default: 'always' },
  disabled: { type: Boolean, default: false },
  href: { type: String, default: '' },
  target: { type: String, default: '' },
  icon: { type: String, default: '' },
})

const emit = defineEmits(['click'])

const typeClass = computed(() => (props.type === 'error' ? 'danger' : props.type))

const underlined = computed(() => {
  if (props.underline === true) return true
  if (props.underline === false || props.underline === 'never') return false
  if (props.underline === 'hover') return false // hover 态由 css :hover 控制
  return true
})

function handleClick(e) {
  if (props.disabled) {
    e.preventDefault()
    return
  }
  emit('click', e)
}
</script>

<style src="./style.css"></style>
