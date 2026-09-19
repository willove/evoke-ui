<template>
  <div
    ref="rootRef"
    :class="['ev-select', `is-${size}`, { 'is-bare': bare, 'is-open': open, 'is-top': placement === 'top', 'is-disabled': disabled, 'is-error': error, 'is-glass': glass === true, 'no-glass': glass === false }]"
    :style="glassVars"
    @keydown.esc.stop="close"
  >
    <button
      type="button"
      class="ev-select__trigger"
      :disabled="disabled"
      :aria-haspopup="`listbox`"
      :aria-expanded="open"
      :aria-activedescendant="highlightIndex >= 0 ? optionId(highlightIndex) : undefined"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <EvIcon v-if="selectedIcon" :name="selectedIcon" :size="iconSize" class="ev-select__icon" />
      <span class="ev-select__label" :class="{ 'is-placeholder': !selectedLabel }">
        {{ selectedLabel || placeholder }}
      </span>
      <EvIcon name="chevron-down" :size="caretSize" class="ev-select__caret" :class="{ 'is-open': open }" />
    </button>

    <Transition name="ev-select-drop">
      <ul v-if="open" class="ev-select__menu" role="listbox">
        <li
          v-for="(opt, idx) in options"
          :key="opt.value"
          :id="optionId(idx)"
          role="option"
          :aria-selected="opt.value === current"
          :class="['ev-select__option', { 'is-selected': opt.value === modelValue, 'is-active': idx === highlightIndex, 'is-disabled': opt.disabled }]"
          @click="pick(opt)"
        >
          <EvIcon v-if="opt.icon" :name="opt.icon" :size="14" class="ev-select__option-icon" />
          <span class="ev-select__option-label">{{ opt.label }}</span>
          <EvIcon v-if="opt.value === current" name="check" :size="14" class="ev-select__option-check" />
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
/**
 * EvSelect — 下拉选择（自定义菜单，替代原生 select 的生硬外观）
 * bare 模式去边框，用于嵌入搜索栏等复合控件；点击外部自动收起，Esc 关闭
 */
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import EvIcon from '../icon/index.vue'
import { useUncontrolled } from '../../composables/useUncontrolled'

import { useGlassVars } from '../../composables/useGlassVars'
const props = defineProps({
  /** 当前值（v-model） */
  modelValue: { type: [String, Number], default: '' },
  /** 非受控模式的初始值 */
  defaultValue: { type: [String, Number], default: undefined },
  /** [{ label, value, icon?, disabled? }] */
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  /** 嵌入形态：去边框与最小宽度 */
  bare: { type: Boolean, default: false },
  /** 菜单展开方向 */
  placement: {
    type: String,
    default: 'bottom',
    validator: (v) => ['bottom', 'top'].includes(v),
  },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
  /** 下拉面板磨砂：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
  /** 磨砂饱和度（倍数），内联覆盖 --ev-glass-saturate；缺省跟随令牌 */
  saturate: { type: [Number, String], default: undefined },
  /** 磨砂底色浓度（%），内联覆盖 --ev-glass-bg；缺省跟随令牌 */
  tint: { type: [Number, String], default: undefined },
})

const emit = defineEmits(['update:modelValue', 'change', 'visible-change'])
const open = ref(false)
const rootRef = ref(null)
/** 键盘高亮项下标，-1 为无高亮；复用 hover 观感的 is-active 样式 */
const highlightIndex = ref(-1)
/** 选项 id 前缀：aria-activedescendant 需指向菜单内唯一 id */
const idPrefix = useId()

const optionId = (idx) => `${idPrefix}-opt-${idx}`

const { value: current, set } = useUncontrolled(props, { defaultValue: props.defaultValue })

const iconSize = computed(() => (props.size === 'small' ? 13 : props.size === 'large' ? 17 : 15))
const caretSize = computed(() => (props.size === 'small' ? 13 : 15))

const selected = computed(() => props.options.find((o) => o.value === current.value))
const selectedLabel = computed(() => selected.value?.label || '')
const selectedIcon = computed(() => selected.value?.icon || '')

const glassVars = useGlassVars(props)

function onDocClick(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) close()
}

function toggle() {
  if (props.disabled) return
  if (open.value) {
    open.value = false
    highlightIndex.value = -1
  } else {
    openMenu()
  }
}

/** 打开菜单：高亮落在当前选中项，无选中则从 -1 起由方向键步入 */
function openMenu() {
  highlightIndex.value = props.options.findIndex((o) => o.value === current.value)
  open.value = true
}

function close() {
  open.value = false
  highlightIndex.value = -1
}

/** 键盘导航：关→ArrowDown/Enter 打开；开→上下/Home/End 移动高亮（循环），Enter/Space 选中 */
function onTriggerKeydown(e) {
  if (props.disabled) return
  const total = props.options.length
  if (!open.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      openMenu()
    }
    return
  }
  if (total === 0) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIndex.value = (highlightIndex.value + 1) % total
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value = highlightIndex.value <= 0 ? total - 1 : highlightIndex.value - 1
  } else if (e.key === 'Home') {
    e.preventDefault()
    highlightIndex.value = 0
  } else if (e.key === 'End') {
    e.preventDefault()
    highlightIndex.value = total - 1
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const opt = props.options[highlightIndex.value]
    if (opt) pick(opt)
  }
}

function pick(opt) {
  if (opt.disabled) return
  emit('update:modelValue', set(opt.value))
  emit('change', opt.value)
  close()
}

watch(open, (v) => {
  emit('visible-change', v)
  if (typeof document !== 'undefined') {
    if (v) document.addEventListener('click', onDocClick)
    else document.removeEventListener('click', onDocClick)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('click', onDocClick)
})
</script>

<style src="./style.css"></style>
