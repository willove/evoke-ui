<template>
  <div :class="['ev-slider', `is-${size}`, { 'is-disabled': disabled }]">
    <input
      v-bind="$attrs"
      class="ev-slider__input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="value"
      :disabled="disabled"
      :style="{ '--ev-slider-fill': fill }"
      @input="onInput"
    />
  </div>
</template>

<script setup>
/**
 * EvSlider — 滑块
 * 原生 range 之上的受控封装：键盘方向键可调（无障碍免费），导轨已走过部分着主色。
 * 受控（v-model）与非受控（不传 modelValue，配 default-value 定初值）双模式。
 */
import { computed } from 'vue'
import { useUncontrolled } from '../../composables/useUncontrolled'

defineOptions({ inheritAttrs: false, name: 'EvSlider' })

const props = defineProps({
  /** 当前值（v-model） */
  modelValue: { type: Number, default: 0 },
  /** 非受控模式的初始值（未绑定 v-model 时生效） */
  defaultValue: { type: Number, default: undefined },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const { value, set } = useUncontrolled(props, { defaultValue: props.defaultValue })

// 导轨填充比例：驱动「已走过」部分着主色（渐变断点在 CSS 里读这个变量）
const fill = computed(() => {
  const range = props.max - props.min
  if (!(range > 0)) return '0%'
  const current = Math.min(Math.max(value.value, props.min), props.max)
  return `${((current - props.min) / range) * 100}%`
})

function onInput(e) {
  if (props.disabled) return
  const next = Number(e.target.value)
  emit('update:modelValue', set(next))
  emit('change', next)
}
</script>

<style src="./style.css"></style>
