<template>
  <div :class="['ev-search-box', `ev-search-box--${size}`, { 'is-remote-open': panelOpen }]">
    <!-- 分类下拉（EvSelect bare 嵌入形态） -->
    <div v-if="categories.length" class="ev-search-box__category">
      <EvSelect
        bare
        :model-value="categoryProxy || (normalizedCategories[0] && normalizedCategories[0].value)"
        :options="normalizedCategories"
        :aria-label="`分类筛选（${ariaLabel || placeholder}）`"
        @update:model-value="onCategoryChange"
      />
    </div>

    <EvIcon name="search" :size="iconSize" class="ev-search-box__magnifier" />

    <input
      ref="inputRef"
      v-bind="$attrs"
      class="ev-search-box__input"
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="ariaLabel || placeholder"
      role="combobox"
      :aria-expanded="panelOpen"
      aria-autocomplete="list"
      @input="onInput"
      @focus="inputFocused = true"
      @blur="onInputBlur"
      @keydown.down.prevent="moveActive(1)"
      @keydown.up.prevent="moveActive(-1)"
      @keydown.enter.prevent="chooseActive"
      @keydown.esc.prevent="closePanel"
    />

    <div v-if="$slots.suffix" class="ev-search-box__suffix">
      <slot name="suffix" />
    </div>

    <!-- 远程搜索结果（select 下拉形态） -->
    <ul v-if="panelOpen" class="ev-search-box__dropdown" role="listbox">
      <li v-if="remoteLoading" class="ev-search-box__option is-state">
        <EvIcon name="search" :size="14" /> 搜索中…
      </li>
      <template v-else>
        <li v-for="(option, i) in remoteResults" :key="i" role="option" :aria-selected="i === activeIndex">
          <button
            type="button"
            class="ev-search-box__option"
            :class="{ 'is-active': i === activeIndex }"
            @mousedown.prevent="choose(option)"
            @mouseenter="activeIndex = i"
          >
            <span class="ev-search-box__option-title">{{ option.title }}</span>
            <span v-if="option.description" class="ev-search-box__option-desc">{{ option.description }}</span>
          </button>
        </li>
        <li v-if="!remoteResults.length" class="ev-search-box__option is-state">无匹配结果</li>
      </template>
    </ul>
  </div>
</template>

<script setup>
/**
 * EvSearchBox — 大搜索框（签名组件：分类下拉 + 搜索输入 + 后缀动作位）
 * v-model（搜索词） + v-model:category（分类值）；分类下拉为 EvSelect bare 嵌入
 * 圆润 xl 圆角 + 藏青软阴影，穿透 attrs 到原生 input
 *
 * 远程搜索：传入 remote（async keyword => [{ title, description?, … }]）后，
 * 输入经 debounce 防抖调用，结果以 select 下拉形态呈现；
 * ↑↓ 选择、Enter 确认、Esc 关闭；选中派发 select 事件并回填搜索词。
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import EvIcon from '../icon/index.vue'
import EvSelect from '../select/index.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  /** 搜索词（v-model） */
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search' },
  /** 分类项（字符串或 { label, value }）；空数组隐藏分类位 */
  categories: { type: Array, default: () => [] },
  /** 当前分类（v-model:category） */
  category: { type: String, default: '' },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'large'].includes(v),
  },
  /** 无障碍标签（缺省取 placeholder） */
  ariaLabel: { type: String, default: '' },
  /** 远程搜索函数：async (keyword) => [{ title, description?, … }]；传入后启用结果下拉 */
  remote: { type: Function, default: null },
  /** 远程搜索防抖（ms） */
  debounce: { type: Number, default: 300 },
})

const emit = defineEmits(['update:modelValue', 'update:category', 'search', 'select'])

const iconSize = computed(() => (props.size === 'large' ? 20 : 18))

const normalizedCategories = computed(() =>
  props.categories.map((c) =>
    typeof c === 'string' ? { label: c, value: c } : { label: c.label, value: c.value ?? c.label }
  )
)

const categoryProxy = computed({
  get: () => props.category,
  set: (v) => emit('update:category', v),
})

function onInput(e) {
  emit('update:modelValue', e.target.value)
  emit('search', e.target.value)
  if (props.remote) scheduleRemote(e.target.value)
}

function onCategoryChange(v) {
  categoryProxy.value = v
  emit('search', props.modelValue)
}

// ─── 远程搜索 ───
const inputRef = ref(null)
const inputFocused = ref(false)
const remoteLoading = ref(false)
const remoteResults = ref([])
const activeIndex = ref(-1)
let debounceTimer = null
let requestSeq = 0

const panelOpen = computed(() =>
  !!props.remote && inputFocused.value && (remoteLoading.value || remoteResults.value.length > 0)
)

function scheduleRemote(keyword) {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!keyword) {
    remoteLoading.value = false
    remoteResults.value = []
    activeIndex.value = -1
    return
  }
  remoteLoading.value = true
  debounceTimer = setTimeout(() => runRemote(keyword), props.debounce)
}

async function runRemote(keyword) {
  const seq = ++requestSeq
  try {
    const results = (await props.remote(keyword)) || []
    // 只认最后一次请求的结果（快速输入时的过期响应直接丢弃）
    if (seq !== requestSeq) return
    remoteResults.value = results
    remoteLoading.value = false
    activeIndex.value = results.length ? 0 : -1
  } catch {
    if (seq !== requestSeq) return
    remoteResults.value = []
    remoteLoading.value = false
  }
}

function moveActive(dir) {
  if (!panelOpen.value || !remoteResults.value.length) return
  const total = remoteResults.value.length
  activeIndex.value = ((activeIndex.value + dir) % total + total) % total
}

function chooseActive() {
  if (panelOpen.value && remoteResults.value[activeIndex.value]) {
    choose(remoteResults.value[activeIndex.value])
  }
}

function choose(option) {
  emit('select', option)
  emit('update:modelValue', option.title ?? '')
  closePanel()
  inputRef.value?.blur?.()
}

function closePanel() {
  inputFocused.value = false
  remoteLoading.value = false
  remoteResults.value = []
  activeIndex.value = -1
}

function onInputBlur() {
  // 延迟到 mousedown 选中逻辑之后再收起面板
  setTimeout(() => {
    inputFocused.value = false
  }, 120)
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style src="./style.css"></style>
