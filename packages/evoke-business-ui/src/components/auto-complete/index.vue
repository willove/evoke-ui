<template>
  <eb-popper
    :visible="panelVisible"
    trigger="manual"
    placement="bottom-start"
    match-width
    :offset="6"
    popper-class="eb-autocomplete__popper"
    @hide="panelVisible = false"
  >
    <template #trigger>
      <eb-input
        v-model="inputValue"
        v-bind="filterInputProps"
        :ripple="ripple"
        role="combobox"
        :aria-expanded="panelVisible"
        :aria-autocomplete="'list'"
        :aria-controls="panelId"
        :aria-activedescendant="highlightIndex >= 0 ? `${panelId}-option-${highlightIndex}` : undefined"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
    </template>

    <ul :id="panelId" class="eb-autocomplete__menu" role="listbox">
      <li
        v-for="(item, i) in suggestions"
        :id="`${panelId}-option-${i}`"
        :key="i"
        class="eb-autocomplete__option"
        :class="{ 'is-highlight': i === highlightIndex }"
        role="option"
        :aria-selected="i === highlightIndex"
        @mouseenter="highlightIndex = i"
        @mousedown.prevent="select(item, i)"
      >
        <slot name="option" :item="item">{{ item.label ?? (item.value ?? item) }}</slot>
      </li>
      <!-- 有输入且无结果：空态行（文案走语言包 select.noMatch） -->
      <li v-if="showEmpty" class="eb-autocomplete__empty">{{ emptyText }}</li>
    </ul>
  </eb-popper>
</template>

<script setup>
/**
 * EbAutoComplete — 输入联想
 *
 * 数据源二选一：
 * - suggestions：静态候选数组（string / number 或 { value, label? }，显示 label 回退 value）
 * - fetch-suggestions：(query, cb) => void，异步返回候选（内部防抖）
 *
 * 键盘：↑↓ 移动高亮、Enter 选中、Esc 关闭；选中后可被 select 拦截（返回 false 不回填）；
 * default-active-first-option 结果更新自动高亮第一条；空态文案走语言包 select.noMatch
 */
import { computed, ref, useAttrs, watch, onBeforeUnmount } from 'vue'
import EbInput from '../input/index.vue'
import EbPopper from '../popper/index.vue'
import { useLocale } from '../../composables/useLocale'
import { isImeComposing } from '../../utils/events'

defineOptions({ name: 'EbAutoComplete', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  /** 静态候选：string / number 或 { value, label? } 对象 */
  suggestions: { type: Array, default: undefined },
  /** 异步联想：(query, cb) => void */
  fetchSuggestions: { type: Function, default: undefined },
  /** 静态候选的前缀过滤开关（fetch 模式忽略，过滤归服务端） */
  filterable: { type: Boolean, default: true },
  /** 输入防抖（ms） */
  debounce: { type: Number, default: 200 },
  /** 联想触发最小字符数 */
  minlength: { type: Number, default: 0 },
  /** 结果更新后自动高亮第一条（antd 默认 true，此处默认 false 保持既有行为） */
  defaultActiveFirstOption: { type: Boolean, default: false },
  /** 选中后是否回填输入框 */
  valueOnSelect: { type: Boolean, default: true },
  /** 透传给内部 EbInput 的原生属性（placeholder / clearable / size / disabled 等） */
  inputProps: { type: Object, default: () => ({}) },
  /** 激活涟漪动效开关（作用于内部输入框）；Form 上可批量关闭，全局见 setRipple */
  ripple: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'select', 'suggest', 'clear'])

const { t } = useLocale()
const emptyText = computed(() => t('select.noMatch'))

// 未声明的 attrs（placeholder / size / disabled / clearable…）透传给内部输入框
const restAttrs = useAttrs()
const filterInputProps = computed(() => ({ ...restAttrs, ...props.inputProps }))
const panelId = `eb-autocomplete-${Math.random().toString(36).slice(2, 8)}`

const inputValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const panelVisible = ref(false)
const highlightIndex = ref(-1)
const suggestions = ref([])
let debounceTimer = null
let fetchSeq = 0

// 有输入且结果为空 → 空态行
const showEmpty = computed(() => panelVisible.value && suggestions.value.length === 0)

function normalize(list) {
  return (list || []).map((it) => (typeof it === 'string' || typeof it === 'number' ? { value: it } : it))
}

// 结果落地：有结果或仍有输入则展示面板；可按需自动高亮第一条
function applyResult(query, list) {
  suggestions.value = normalize(list)
  const hasResults = suggestions.value.length > 0
  panelVisible.value = hasResults || String(query ?? '').length > 0
  highlightIndex.value = hasResults && props.defaultActiveFirstOption ? 0 : -1
}

function runFilter(query) {
  if (props.fetchSuggestions) {
    const seq = ++fetchSeq
    props.fetchSuggestions(query, (list) => {
      if (seq !== fetchSeq) return // 过期响应丢弃
      applyResult(query, list)
    })
    return
  }
  let list = normalize(props.suggestions)
  if (props.filterable && query) {
    const q = String(query).toLowerCase()
    list = list.filter((it) => String(it.value ?? '').toLowerCase().includes(q))
  }
  applyResult(query, list)
}

function schedule(query) {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (query.length < props.minlength) {
    panelVisible.value = false
    return
  }
  if (props.debounce > 0) {
    debounceTimer = setTimeout(() => runFilter(query), props.debounce)
  } else {
    runFilter(query)
  }
}

// 卸载清防抖定时器，避免回调触达已卸载实例
onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
})

function onInput(e) {
  schedule(typeof e === 'string' ? e : e?.target?.value ?? '')
}

function onFocus() {
  if (props.minlength === 0) runFilter(inputValue.value || '')
}

function onBlur() {
  // 延迟关闭，给选项 mousedown 留出窗口
  setTimeout(() => {
    if (!panelVisible.value) return
    panelVisible.value = false
  }, 150)
}

function hidePanel() {
  panelVisible.value = false
}

function moveHighlight(delta) {
  if (!suggestions.value.length) return
  const len = suggestions.value.length
  highlightIndex.value = (highlightIndex.value + delta + len) % len
}

// 单一 keydown 入口：组字期间的按键全部交还输入法（.enter.prevent 会吃掉候选词上屏）
function onKeydown(e) {
  if (isImeComposing(e)) return
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveHighlight(-1)
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveHighlight(1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (panelVisible.value && highlightIndex.value >= 0) {
      select(suggestions.value[highlightIndex.value], highlightIndex.value)
    }
  } else if (e.key === 'Escape') {
    hidePanel()
  }
}

function select(item, index) {
  const value = item?.value ?? item
  emit('select', item, index)
  panelVisible.value = false
  if (props.valueOnSelect && value != null) {
    emit('update:modelValue', value)
  }
}

watch(
  () => props.modelValue,
  () => {
    if (!props.modelValue) emit('clear')
  },
)

defineExpose({
  /** 主动触发一次联想 */
  suggest: () => runFilter(inputValue.value || ''),
  close: hidePanel,
})
</script>

<style src="./style.css"></style>
