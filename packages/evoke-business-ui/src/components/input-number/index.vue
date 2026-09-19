<template>
  <div
    class="eb-input-number eb-input-number"
    :class="[
      sizeClass,
      {
        'is-disabled': isDisabled,
        'is-controls-right': controlsPosition === 'right',
        'is-without-controls': !controls,
        'is-with-addon': addonBeforeVisible || addonAfterVisible,
        'eb-ripple-off': ripple === false,
      },
    ]"
  >
    <!-- 框外前缀块：插槽优先于 prop -->
    <span v-if="addonBeforeVisible" class="eb-input-number__addon">
      <slot name="addon-before">{{ addonBefore }}</slot>
    </span>
    <!-- 默认模式：[-][输入框][+] 三个 flex 兄弟节点，输入框描边即左右分隔线 -->
    <span
      v-if="controls && controlsPosition !== 'right'"
      class="eb-input-number__decrease"
      :class="{ 'is-disabled': minDisabled }"
      role="button"
      :aria-disabled="minDisabled"
      @click="handleDecrease"
    >
      <eb-icon :name="decreaseIcon" />
    </span>
    <div class="eb-input__wrapper">
      <input
        ref="inputRef"
        class="eb-input__inner"
        :type="inputType"
        :inputmode="inputType === 'text' ? 'decimal' : undefined"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="isDisabled"
        :readonly="readonly"
        :name="name"
        :step="step"
        @input="handleInput"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown.up.prevent="handleIncrease"
        @keydown.down.prevent="handleDecrease"
      />
    </div>
    <span
      v-if="controls && controlsPosition !== 'right'"
      class="eb-input-number__increase"
      :class="{ 'is-disabled': maxDisabled }"
      role="button"
      :aria-disabled="maxDisabled"
      @click="handleIncrease"
    >
      <eb-icon :name="increaseIcon" />
    </span>
    <!-- controls-position="right"：按钮绝对定位覆盖在输入框右侧上下两格 -->
    <template v-if="controls && controlsPosition === 'right'">
      <span
        class="eb-input-number__increase"
        :class="{ 'is-disabled': maxDisabled }"
        role="button"
        :aria-disabled="maxDisabled"
        @click="handleIncrease"
      >
        <eb-icon :name="increaseIcon" />
      </span>
      <span
        class="eb-input-number__decrease"
        :class="{ 'is-disabled': minDisabled }"
        role="button"
        :aria-disabled="minDisabled"
        @click="handleDecrease"
      >
        <eb-icon :name="decreaseIcon" />
      </span>
    </template>
    <!-- 框外后缀块：插槽优先于 prop -->
    <span v-if="addonAfterVisible" class="eb-input-number__addon">
      <slot name="addon-after">{{ addonAfter }}</slot>
    </span>
  </div>
</template>

<script setup>
/**
 * EbInputNumber — 计数器
 * min/max clamp、precision 格式化、step 步进、step-strictly、value-on-clear；
 * formatter/parser 控制展示与反解（focus 显原始值、blur 显格式化值）；
 * addon-before/after 框外前后缀块（插槽与 prop 二选一）
 */
import { computed, ref, useSlots } from 'vue'
import EbIcon from '../icon/index.vue'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'

defineOptions({ name: 'EbInputNumber' })

const props = defineProps({
  modelValue: { type: Number, default: undefined },
  min: { type: Number, default: -Infinity },
  max: { type: Number, default: Infinity },
  step: { type: Number, default: 1 },
  stepStrictly: { type: Boolean, default: false },
  precision: { type: Number, default: undefined },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  controls: { type: Boolean, default: true },
  /** 控制按钮位置：default 两侧 | right 右上右下 */
  controlsPosition: { type: String, default: '' },
  valueOnClear: { type: [Number, null], default: null },
  size: { type: String, default: '' },
  name: { type: String, default: undefined },
  /** 激活涟漪动效开关（聚焦时实体色影向外扩展）；Form 上可批量关闭，全局见 setRipple */
  ripple: { type: Boolean, default: true },
  /** 展示格式化（如千分位），传入后输入框切换为文本输入 */
  formatter: { type: Function, default: undefined },
  /** 把输入文本解析回数值；缺省时去千分位逗号后解析 */
  parser: { type: Function, default: undefined },
  /** 框外前缀块文案（与 addon-before 插槽二选一，插槽优先） */
  addonBefore: { type: String, default: '' },
  /** 框外后缀块文案（与 addon-after 插槽二选一，插槽优先） */
  addonAfter: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'change', 'blur', 'focus'])

const inputRef = ref(null)
const userInput = ref(null)
const slots = useSlots()

const hasFormatter = computed(() => typeof props.formatter === 'function')
const hasParser = computed(() => typeof props.parser === 'function')

/** 有 formatter/parser 时原生 number 会拦下逗号等格式字符，切换为文本输入 */
const inputType = computed(() => (hasFormatter.value || hasParser.value ? 'text' : 'number'))

const addonBeforeVisible = computed(() => !!props.addonBefore || !!slots['addon-before'])
const addonAfterVisible = computed(() => !!props.addonAfter || !!slots['addon-after'])

const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: computed(() => props.size),
  disabled: computed(() => props.disabled),
})

const isDisabled = computed(() => formDisabled.value || props.disabled)

const sizeClass = computed(() => {
  const s = props.size || formSize.value
  if (s === 'large') return 'eb-input-number--large'
  if (s === 'small') return 'eb-input-number--small'
  return ''
})

const minDisabled = computed(
  () => props.modelValue !== undefined && props.modelValue - props.step < props.min
)
const maxDisabled = computed(
  () => props.modelValue !== undefined && props.modelValue + props.step > props.max
)

// 控制按钮统一用 minus / plus 语义图标（箭头/尖角号不符合数字增减的心智模型）
const decreaseIcon = computed(() => 'minus')
const increaseIcon = computed(() => 'plus')

const displayValue = computed(() => {
  if (userInput.value !== null) return userInput.value
  if (props.modelValue === undefined || props.modelValue === null) return ''
  if (hasFormatter.value) return props.formatter(Number(props.modelValue))
  return toPrecision(props.modelValue)
})

function toPrecision(value) {
  if (props.precision === undefined) return String(value)
  return Number(value).toFixed(props.precision)
}

function clamp(value) {
  if (Number.isNaN(value)) return props.modelValue
  let v = value
  if (props.stepStrictly) {
    v = Math.round(v / props.step) * props.step
  }
  if (props.precision !== undefined) {
    v = Number(Number(v).toFixed(props.precision))
  }
  if (v > props.max) v = props.max
  if (v < props.min) v = props.min
  return v
}

function commit(value) {
  const next = clamp(value)
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
    emit('change', next)
    triggerFormValidate(formItem, 'change')
  }
  userInput.value = null
}

/** 步进基准值：modelValue 缺省时取 min（min 为 -Infinity 时取 0） */
function baseValue() {
  if (props.modelValue !== undefined && props.modelValue !== null) return props.modelValue
  return props.min > -Infinity ? props.min : 0
}

function handleIncrease() {
  if (isDisabled.value || props.readonly) return
  commit(baseValue() + props.step)
}

function handleDecrease() {
  if (isDisabled.value || props.readonly) return
  commit(baseValue() - props.step)
}

function handleInput(e) {
  userInput.value = e.target.value
}

/** 输入文本解析回数值：优先 parser，缺省去千分位逗号 */
function parseInput(raw) {
  const text = String(raw)
  if (hasParser.value) return Number(props.parser(text))
  return Number.parseFloat(text.replace(/,/g, ''))
}

function handleChange(e) {
  const raw = e.target.value
  if (raw === '') {
    userInput.value = null
    if (props.valueOnClear !== null) {
      emit('update:modelValue', props.valueOnClear)
      emit('change', props.valueOnClear)
    }
    return
  }
  const parsed = parseInput(raw)
  if (!Number.isNaN(parsed)) {
    commit(parsed)
  } else {
    userInput.value = null
  }
}

function handleBlur(e) {
  // 丢弃未提交的编辑态，回显格式化值（change 已在 blur 前完成提交）
  if (userInput.value !== null) userInput.value = null
  emit('blur', e)
  triggerFormValidate(formItem, 'blur')
}

function handleFocus(e) {
  // formatter 无 parser 时聚焦显原始数值串，便于编辑（antd 同款行为）
  if (hasFormatter.value && !hasParser.value && props.modelValue !== undefined && props.modelValue !== null) {
    userInput.value = toPrecision(props.modelValue)
  }
  emit('focus', e)
}

defineExpose({
  focus: (...args) => inputRef.value?.focus?.(...args),
  blur: (...args) => inputRef.value?.blur?.(...args),
  ref: inputRef,
})
</script>

<style src="./style.css"></style>
