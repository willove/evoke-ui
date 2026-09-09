<template>
  <div
    ref="rootRef"
    :class="['ew-select', `is-${size}`, { 'is-bare': bare, 'is-open': open, 'is-disabled': disabled, 'is-error': error }]"
    @keydown.esc.stop="close"
  >
    <button
      type="button"
      class="ew-select__trigger"
      :disabled="disabled"
      :aria-haspopup="`listbox`"
      :aria-expanded="open"
      @click="toggle"
    >
      <EwIcon v-if="selectedIcon" :name="selectedIcon" :size="iconSize" class="ew-select__icon" />
      <span class="ew-select__label" :class="{ 'is-placeholder': !selectedLabel }">
        {{ selectedLabel || placeholder }}
      </span>
      <EwIcon name="chevron-down" :size="caretSize" class="ew-select__caret" :class="{ 'is-open': open }" />
    </button>

    <Transition name="ew-select-drop">
      <ul v-if="open" class="ew-select__menu" role="listbox">
        <li
          v-for="opt in options"
          :key="opt.value"
          role="option"
          :aria-selected="opt.value === current"
          :class="['ew-select__option', { 'is-selected': opt.value === modelValue, 'is-disabled': opt.disabled }]"
          @click="pick(opt)"
        >
          <EwIcon v-if="opt.icon" :name="opt.icon" :size="14" class="ew-select__option-icon" />
          <span class="ew-select__option-label">{{ opt.label }}</span>
          <EwIcon v-if="opt.value === current" name="check" :size="14" class="ew-select__option-check" />
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
/**
 * EwSelect — 下拉选择（自定义菜单，替代原生 select 的生硬外观）
 * bare 模式去边框，用于嵌入搜索栏等复合控件；点击外部自动收起，Esc 关闭
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import EwIcon from '../icon/index.vue'
import { useUncontrolled } from '../../composables/useUncontrolled'

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
})

const emit = defineEmits(['update:modelValue', 'change', 'visible-change'])
const open = ref(false)
const rootRef = ref(null)

const { value: current, set } = useUncontrolled(props, { defaultValue: props.defaultValue })

const iconSize = computed(() => (props.size === 'small' ? 13 : props.size === 'large' ? 17 : 15))
const caretSize = computed(() => (props.size === 'small' ? 13 : 15))

const selected = computed(() => props.options.find((o) => o.value === current.value))
const selectedLabel = computed(() => selected.value?.label || '')
const selectedIcon = computed(() => selected.value?.icon || '')

function onDocClick(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) close()
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function close() {
  open.value = false
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
