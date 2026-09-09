<template>
  <div class="ev-badge ev-badge">
    <slot />
    <sup
      v-if="showBadge"
      class="ev-badge__content"
      :class="[
        `ev-badge__content--${type}`,
        {
          'is-fixed': fixed,
          'is-dot': isDot,
        },
      ]"
    >
      <template v-if="!isDot">{{ content }}</template>
    </sup>
  </div>
</template>

<script setup>
/**
 * EvBadge — 徽标
 */
import { computed } from 'vue'

defineOptions({ name: 'EvBadge' })

const props = defineProps({
  value: { type: [String, Number], default: '' },
  max: { type: Number, default: undefined },
  isDot: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  type: {
    type: String,
    default: 'danger',
    validator: (v) => ['primary', 'success', 'warning', 'info', 'danger'].includes(v),
  },
  /** 是否独立使用（不包裹子元素，fixed=false） */
  standalone: { type: Boolean, default: undefined },
})

const fixed = computed(() => !props.standalone)

const content = computed(() => {
  if (props.isDot) return ''
  if (typeof props.value === 'number' && props.max !== undefined && props.value > props.max) {
    return `${props.max}+`
  }
  return String(props.value)
})

const showBadge = computed(
  () =>
    !props.hidden &&
    (props.isDot || (props.value !== '' && props.value !== undefined && props.value !== null))
)
</script>

<style src="./style.css"></style>
