<template>
  <div :class="['ev-slider', `is-${size}`, { 'is-disabled': disabled }]">
    <input
      v-bind="$attrs"
      class="ev-slider__input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="snapped"
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

// 步长格点对齐：宿主传入的值可能不在 min + k·step 格点上（如 min=30、step=5 的 72），
// 原生圆钮会被浏览器就近吸附显示（70），填充比例必须与可见圆钮同值——
// 否则刷新后（初始值非格点）会出现「填充冒出圆钮」的错位
const snapped = computed(() => {
  const { min, step } = props
  if (!(step > 0)) return value.value
  const onLattice = min + Math.round((value.value - min) / step) * step
  const decimals = (String(step).split('.')[1] || '').length
  return Math.min(Math.max(Number(onLattice.toFixed(decimals)), props.min), props.max)
})

// 导轨填充比例：驱动「已走过」部分着主色（渐变断点在 CSS 里读这个变量）
const fill = computed(() => {
  const range = props.max - props.min
  if (!(range > 0)) return '0%'
  const current = Math.min(Math.max(snapped.value, props.min), props.max)
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
