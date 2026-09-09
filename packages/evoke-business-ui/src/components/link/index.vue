<template>
  <a
    class="ev-link ev-link"
    :class="[
      `ev-link--${typeClass}`,
      { 'is-disabled': disabled, 'is-underline': underlined, 'is-underline-hover': underline === 'hover' },
    ]"
    :href="disabled || !href ? undefined : href"
    :target="disabled || !href ? undefined : target"
    :aria-disabled="disabled || undefined"
    @click="handleClick"
  >
    <ev-icon v-if="icon" :name="icon" :size="14" style="margin-right: 4px;" />
    <span class="ev-link__inner"><slot /></span>
  </a>
</template>

<script setup>
/**
 * EvLink — 文字链接
 * underline 入参兼容布尔与字符串两种写法，布尔一律映射为 always / never
 */
import { computed } from 'vue'
import EvIcon from '../icon/index.vue'

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
