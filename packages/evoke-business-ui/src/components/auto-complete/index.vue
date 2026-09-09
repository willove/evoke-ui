<template>
  <ev-popper
    :visible="panelVisible && suggestions.length > 0"
    trigger="manual"
    placement="bottom-start"
    match-width
    :offset="6"
    popper-class="ev-autocomplete__popper"
    @hide="panelVisible = false"
  >
    <template #trigger>
      <ev-input
        v-model="inputValue"
        v-bind="filterInputProps"
        role="combobox"
        :aria-expanded="panelVisible"
        :aria-autocomplete="'list'"
        :aria-controls="panelId"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.enter.prevent="onEnter"
        @keydown.esc="hidePanel"
      />
    </template>

    <ul :id="panelId" class="ev-autocomplete__menu" role="listbox">
      <li
        v-for="(item, i) in suggestions"
        :key="i"
        class="ev-autocomplete__option"
        :class="{ 'is-highlight': i === highlightIndex }"
        role="option"
        :aria-selected="i === highlightIndex"
        @mouseenter="highlightIndex = i"
        @mousedown.prevent="select(item, i)"
      >
        <slot name="option" :item="item">{{ item.value ?? item }}</slot>
      </li>
    </ul>
  </ev-popper>
</template>

<script setup>
/**
 * EvAutoComplete — 输入联想
 *
 * 数据源二选一：
 * - suggestions：静态候选数组（string 或 { value, ...payload }）
 * - fetch-suggestions：(query, cb) => void，异步返回候选（内部防抖）
 *
 * 键盘：↑↓ 移动高亮、Enter 选中、Esc 关闭；选中后可被 select 拦截（返回 false 不回填）
 */
import { computed, ref, useAttrs, watch } from 'vue'
import EvInput from '../input/index.vue'
import EvPopper from '../popper/index.vue'

defineOptions({ name: 'EvAutoComplete', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  /** 静态候选：string[] 或 { value }[] */
  suggestions: { type: Array, default: undefined },
  /** 异步联想：(query, cb) => void */
  fetchSuggestions: { type: Function, default: undefined },
  /** 静态候选的前缀过滤开关（fetch 模式忽略，过滤归服务端） */
  filterable: { type: Boolean, default: true },
  /** 输入防抖（ms） */
  debounce: { type: Number, default: 200 },
  /** 联想触发最小字符数 */
  minlength: { type: Number, default: 0 },
  /** 选中后是否回填输入框 */
  valueOnSelect: { type: Boolean, default: true },
  /** 透传给内部 EvInput 的原生属性（placeholder / clearable / size / disabled 等） */
  inputProps: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue', 'select', 'suggest', 'clear'])

// 未声明的 attrs（placeholder / size / disabled / clearable…）透传给内部输入框
const restAttrs = useAttrs()
const filterInputProps = computed(() => ({ ...restAttrs, ...props.inputProps }))
const panelId = `ev-autocomplete-${Math.random().toString(36).slice(2, 8)}`

const inputValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const panelVisible = ref(false)
const highlightIndex = ref(-1)
const suggestions = ref([])
let debounceTimer = null
let fetchSeq = 0

function normalize(list) {
  return (list || []).map((it) => (typeof it === 'string' ? { value: it } : it))
}

function runFilter(query) {
  if (props.fetchSuggestions) {
    const seq = ++fetchSeq
    props.fetchSuggestions(query, (list) => {
      if (seq !== fetchSeq) return // 过期响应丢弃
      suggestions.value = normalize(list)
      if (suggestions.value.length) {
        panelVisible.value = true
        highlightIndex.value = -1
      } else {
        panelVisible.value = false
      }
    })
    return
  }
  let list = normalize(props.suggestions)
  if (props.filterable && query) {
    const q = String(query).toLowerCase()
    list = list.filter((it) => String(it.value ?? '').toLowerCase().includes(q))
  }
  suggestions.value = list
  panelVisible.value = list.length > 0
  highlightIndex.value = -1
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

function onEnter() {
  if (panelVisible.value && highlightIndex.value >= 0) {
    select(suggestions.value[highlightIndex.value], highlightIndex.value)
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
