<template>
  <span
    class="eb-tag eb-tag"
    :class="[
      `eb-tag--${type}`,
      `eb-tag--${effect}`,
      sizeClass,
      {
        'is-round': round,
        'is-hit': hit,
        'is-closable': closable,
        'is-disable-transitions': disableTransitions,
      },
    ]"
    :style="tagStyle"
    @click="emit('click', $event)"
  >
    <span class="eb-tag__content">
      <slot />
    </span>
    <eb-icon
      v-if="closable"
      class="eb-tag__close"
      name="close"
      @click.stop="handleClose"
    />
  </span>
</template>

<script setup>
/**
 * EbTag — 标签
 * 默认值：size='small'、effect='plain'、disable-transitions=true
 */
import { computed } from 'vue'
import EbIcon from '../icon/index.vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['primary', 'success', 'info', 'warning', 'danger'].includes(v),
  },
  size: {
    type: String,
    default: 'small',
    validator: (v) => ['small', 'default', 'large', ''].includes(v),
  },
  effect: {
    type: String,
    default: 'plain',
    validator: (v) => ['dark', 'light', 'plain'].includes(v),
  },
  round: { type: Boolean, default: false },
  closable: { type: Boolean, default: false },
  disableTransitions: { type: Boolean, default: true },
  hit: { type: Boolean, default: false },
  color: { type: String, default: undefined },
})

const emit = defineEmits(['close', 'click'])

const sizeClass = computed(() => {
  if (props.size === 'large') return 'eb-tag--large'
  if (props.size === 'default') return ''
  return 'eb-tag--small'
})

const tagStyle = computed(() =>
  props.color
    ? {
        backgroundColor: props.effect === 'plain' ? 'transparent' : props.color,
        borderColor: props.color,
        color: props.effect === 'plain' ? props.color : '#fff',
      }
    : undefined
)

function handleClose(e) {
  emit('close', e)
}
</script>

<style src="./style.css"></style>
