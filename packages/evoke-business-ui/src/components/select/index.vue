<template>
  <div
    v-bind="$attrs"
    class="ev-select"
    :class="[{ 'is-disabled': isDisabled, 'is-multiple': multiple, 'is-filterable': filterable, 'is-focus': isFocused }, sizeClass]"
    @click="handleClick"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <div
      ref="referenceRef"
      class="ev-select__wrapper"
      :class="{ 'is-hovering': hovering && !isDisabled, 'is-focused': isFocused, 'is-disabled': isDisabled }"
    >
      <span v-if="multiple && selectedTags.length" class="ev-select__selection">
        <span
          v-for="tag in collapsedTags"
          :key="String(tag.value)"
          class="ev-tag ev-tag--info ev-tag--light ev-select__tag"
        >
          <span class="ev-tag__content">{{ tag.label }}</span>
          <ev-icon
            v-if="!isDisabled && !tagDisabled"
            class="ev-tag__close"
            name="close"
            @click.stop="removeTag(tag.value)"
          />
        </span>
        <span v-if="overflowCount > 0" class="ev-select__tags-collapse-item">
          + {{ overflowCount }}
        </span>
      </span>
      <span
        v-else-if="hasSelection"
        v-show="!(filterable && isFocused)"
        class="ev-select__selected-item ev-select__placeholder"
      >
        <span class="ev-select__selected-item-text">{{ selectedLabel }}</span>
      </span>
      <span
        v-else
        class="ev-select__placeholder"
        :class="{ 'is-transparent': filterable && isFocused }"
      >{{ placeholder || t('select.placeholder') }}</span>

      <input
        v-if="filterable"
        ref="inputRef"
        class="ev-select__input"
        :value="query"
        :disabled="isDisabled"
        placeholder=""
        @input="handleQueryInput"
        @keydown="handleKeydown"
        @focus="isFocused = true"
        @blur="handleBlur"
      />

      <span class="ev-select__suffix">
        <ev-icon
          v-if="clearable && hasSelection && !isDisabled && !multiple"
          class="ev-select__caret ev-select__clear"
          name="circle-close"
          @click.stop="handleClear"
        />
        <ev-icon
          class="ev-select__caret"
          :class="{ 'is-reverse': dropdownVisible }"
          name="arrow-down"
        />
      </span>
    </div>

    <Teleport to="body">
      <Transition name="ev-select-dropdown">
        <div
          v-if="popperMounted"
          v-show="dropdownVisible && !isMobilePlatform"
          ref="floatingRef"
          class="ev-select__popper ev-popper ev-select__dropdown ev-select__dropdown"
          :style="dropdownStyle"
        >
          <div class="ev-select-dropdown">
            <div v-if="loading" class="ev-select-dropdown__loading">{{ t('select.loading') }}</div>
            <template v-else>
              <div v-if="filterable && !remote && query && filteredOptions.length === 0" class="ev-select-dropdown__empty">
                {{ t('select.noMatch') }}
              </div>
              <div v-else-if="allOptions.length === 0" class="ev-select-dropdown__empty">
                {{ t('select.noData') }}
              </div>
              <div
                ref="dropdownListRef"
                class="ev-select-dropdown__list"
                style="overflow: auto; max-height: 274px"
                @keydown="handleKeydown"
              >
                <slot />
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
    <!-- 未展开过前，选项寄存在隐藏容器内保持注册：
         关闭状态下选中项也能显示 option label 而非原始 value -->
    <div v-if="!popperMounted" class="ev-select__options-holder" aria-hidden="true">
      <slot />
    </div>

    <!-- 移动端（platform=mobile）：底部弹出选择面板 -->
    <Teleport to="body">
      <Transition name="ev-select-sheet">
        <div
          v-if="dropdownVisible && isMobilePlatform"
          class="ev-select__sheet-mask"
          :style="{ zIndex: zIndex }"
          @click="closeDropdown"
        >
          <div class="ev-select__sheet" @click.stop>
            <div class="ev-select__sheet-head">
              <span class="ev-select__sheet-title">{{ props.placeholder || t('select.placeholder') }}</span>
              <ev-icon name="close" @click="closeDropdown" />
            </div>
            <div class="ev-select__sheet-list">
              <slot />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EvSelect — 选择器
 * 子组件注册模式（EvOption onMounted 注册）；键盘导航（↑↓ Enter Esc）；
 * filterable/remote/multiple/collapse-tags/allow-create/clearable
 */
import { computed, nextTick, onBeforeUnmount, provide, ref, toRef, watch, useAttrs } from 'vue'
import EvIcon from '../icon/index.vue'
import { useFloating } from '../../composables/useFloating'
import { useZIndex } from '../../composables/useZIndex'
import { useClickOutside } from '../../composables/useClickOutside'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'
import { useLocale } from '../../composables/useLocale'
import { usePlatform } from '../../composables/usePlatform'
import { provideSelectContext } from './select-context'
import { on as onEvent } from '../../utils/events'

defineOptions({ name: 'EvSelect', inheritAttrs: false })

// 容器环境：mobile 下渲染底部弹出选择面板（而非浮动下拉）
const { isMobile: isMobilePlatform } = usePlatform()

const props = defineProps({
  modelValue: { type: [String, Number, Boolean, Array], default: '' },
  multiple: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: '' },
  clearable: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  filterable: { type: Boolean, default: false },
  filterMethod: { type: Function, default: null },
  remote: { type: Boolean, default: false },
  remoteMethod: { type: Function, default: null },
  loading: { type: Boolean, default: false },
  allowCreate: { type: Boolean, default: false },
  collapseTags: { type: Boolean, default: false },
  /** collapse-tags 时最多显示 tag 数 */
  maxCollapseTags: { type: Number, default: 1 },
  /** v2 兼容：collapseTags 数量语义 */
  collapseTagsTooltip: { type: Boolean, default: false },
  name: { type: String, default: undefined },
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'clear',
  'visible-change',
  'remove-tag',
  'filter-change',
  'blur',
  'focus',
])

const attrs = useAttrs()
const { t } = useLocale()

const referenceRef = ref(null)
const floatingRef = ref(null)
const inputRef = ref(null)
const dropdownListRef = ref(null)

const dropdownVisible = ref(false)
const isFocused = ref(false)
const hovering = ref(false)
const query = ref('')
const hoveringOption = ref(null)
/** 子组件注册的 Option 描述符 [{ value, label, disabled, el, group }] */
const optionItems = ref([])
/** allow-create 的临时选项 */
const createdOption = ref(null)

const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: toRef(props, 'size'),
  disabled: toRef(props, 'disabled'),
})
const isDisabled = computed(() => formDisabled.value || props.disabled)

const { zIndex, next: nextZIndex } = useZIndex()
const { x, y, update, show: activateFloating, hide: deactivateFloating } = useFloating({
  reference: referenceRef,
  floating: floatingRef,
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  shift: true,
  autoUpdate: true,
})

const dropdownStyle = computed(() => ({
  position: 'fixed',
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
  minWidth: `${referenceRef.value?.offsetWidth ?? 0}px`,
}))

// ─── 全部选项（注册 + allow-create 虚拟项） ───
const allOptions = computed(() => {
  const list = [...optionItems.value]
  if (createdOption.value && !list.some((o) => o.value === createdOption.value.value)) {
    list.unshift(createdOption.value)
  }
  return list
})

const filteredOptions = computed(() => {
  if (!props.filterable || props.remote || !query.value) return allOptions.value
  if (props.filterMethod) {
    return allOptions.value.filter((o) => props.filterMethod(query.value, o))
  }
  const q = query.value.toLowerCase()
  return allOptions.value.filter((o) => String(o.label).toLowerCase().includes(q))
})

// ─── 选中态 ───
const selectedValues = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }
  const v = props.modelValue
  return v === undefined || v === null || v === '' ? [] : [v]
})

const hasSelection = computed(() => selectedValues.value.length > 0)

const selectedLabel = computed(() => {
  const first = selectedValues.value[0]
  const opt = allOptions.value.find((o) => o.value === first)
  return opt ? opt.label : String(first ?? '')
})

const selectedTags = computed(() =>
  selectedValues.value.map((v) => {
    const opt = allOptions.value.find((o) => o.value === v)
    return { value: v, label: opt ? opt.label : String(v) }
  })
)

const collapsedTags = computed(() => {
  if (!props.collapseTags) return selectedTags.value
  return selectedTags.value.slice(0, props.maxCollapseTags)
})

const overflowCount = computed(() => {
  if (!props.collapseTags) return 0
  return Math.max(0, selectedTags.value.length - props.maxCollapseTags)
})

const sizeClass = computed(() => {
  const s = props.size || formSize.value
  if (s === 'large') return 'ev-select--large'
  if (s === 'small') return 'ev-select--small'
  return ''
})

const tagDisabled = computed(() => false)

// ─── Option 注册（子组件调用） ───
function registerOption(item) {
  if (!optionItems.value.some((o) => o.value === item.value)) {
    optionItems.value.push(item)
  }
}

function unregisterOption(item) {
  optionItems.value = optionItems.value.filter((o) => o !== item)
}

provideSelectContext({
  selectedValues,
  multiple: toRef(props, 'multiple'),
  disabled: toRef(props, 'disabled'),
  hoveringOption,
  selectOption: (option) => handleOptionClick(option),
  registerOption,
  unregisterOption,
  filteredOptions,
})

// ─── 下拉开关 ───
/** 首次展开后才挂载浮层 DOM；此前选项寄存在隐藏容器中保持注册 */
const popperMounted = ref(false)

async function openDropdown() {
  if (isDisabled.value || dropdownVisible.value) return
  nextZIndex()
  popperMounted.value = true
  await nextTick()
  dropdownVisible.value = true
  emit('visible-change', true)
  // 移动端为底部弹层，无需浮层定位与输入聚焦
  if (isMobilePlatform.value) return
  await nextTick()
  // activateFloating 内部 update + 启动 autoUpdate（页面滚动时浮层跟随）
  await activateFloating()
  await nextTick()
  if (props.filterable) {
    inputRef.value?.focus?.()
  }
}

function closeDropdown() {
  if (!dropdownVisible.value) return
  dropdownVisible.value = false
  deactivateFloating()
  emit('visible-change', false)
  query.value = ''
  if (props.allowCreate) createdOption.value = null
  isFocused.value = false
  emit('blur')
}

function toggleDropdown() {
  dropdownVisible.value ? closeDropdown() : openDropdown()
}

function handleClick() {
  if (isDisabled.value) return
  toggleDropdown()
}

// 点击外部关闭
const { stop: stopClickOutside } = useClickOutside(
  [referenceRef, floatingRef],
  () => closeDropdown(),
  true
)
onBeforeUnmount(stopClickOutside)

// ─── 选择逻辑 ───
function emitValue(next) {
  emit('update:modelValue', next)
  emit('change', next)
  triggerFormValidate(formItem, 'change')
}

function handleOptionClick(option) {
  if (option.disabled) return
  if (props.multiple) {
    const list = [...selectedValues.value]
    const idx = list.indexOf(option.value)
    if (idx >= 0) {
      list.splice(idx, 1)
      emit('remove-tag', option.value)
    } else {
      list.push(option.value)
    }
    emitValue(list)
    if (props.filterable) {
      query.value = ''
    }
    // multiple 保持下拉打开
  } else {
    emitValue(option.value)
    closeDropdown()
  }
}

function removeTag(value) {
  const list = selectedValues.value.filter((v) => v !== value)
  emitValue(list)
  emit('remove-tag', value)
}

function handleClear() {
  emitValue(props.multiple ? [] : '')
  emit('clear')
  closeDropdown()
}

// ─── filterable/remote ───
function handleQueryInput(e) {
  query.value = e.target.value
  if (props.allowCreate && query.value) {
    createdOption.value = { value: query.value, label: query.value, disabled: false, created: true }
  } else {
    createdOption.value = null
  }
  if (props.remote && props.remoteMethod) {
    props.remoteMethod(query.value)
  }
  emit('filter-change', query.value)
  if (!dropdownVisible.value) openDropdown()
}

function handleBlur() {
  if (props.multiple && props.filterable) return
  // blur 由 closeDropdown 处理
}

// ─── 键盘导航 ───
const keyboardIndex = ref(-1)

function visibleOptionList() {
  return filteredOptions.value.filter((o) => !o.disabled)
}

function handleKeydown(e) {
  if (isDisabled.value) return
  const list = visibleOptionList()
  switch (e.key) {
    case 'Enter': {
      e.preventDefault()
      if (!dropdownVisible.value) {
        openDropdown()
        return
      }
      // allow-create 且无 hover 项 → 创建
      if (props.allowCreate && query.value && keyboardIndex.value < 0) {
        handleOptionClick({ value: query.value, label: query.value })
        return
      }
      const target = list[keyboardIndex.value] ?? hoveringOption.value
      if (target) handleOptionClick(target)
      break
    }
    case 'Escape':
      e.preventDefault()
      closeDropdown()
      break
    case 'ArrowDown':
      e.preventDefault()
      if (!dropdownVisible.value) {
        openDropdown()
        return
      }
      keyboardIndex.value = (keyboardIndex.value + 1) % Math.max(list.length, 1)
      hoveringOption.value = list[keyboardIndex.value] ?? null
      scrollToHovering()
      break
    case 'ArrowUp':
      e.preventDefault()
      if (!dropdownVisible.value) return
      keyboardIndex.value =
        keyboardIndex.value <= 0 ? list.length - 1 : keyboardIndex.value - 1
      hoveringOption.value = list[keyboardIndex.value] ?? null
      scrollToHovering()
      break
    case 'Delete':
    case 'Backspace':
      if (props.multiple && selectedValues.value.length && !query.value) {
        const list2 = [...selectedValues.value]
        list2.pop()
        emitValue(list2)
      }
      break
    default:
      break
  }
}

function scrollToHovering() {
  nextTick(() => {
    const listEl = dropdownListRef.value
    if (!listEl) return
    const active = listEl.querySelector('.ev-select-dropdown__item.is-hovering')
    active?.scrollIntoView?.({ block: 'nearest' })
  })
}

watch(dropdownVisible, (val) => {
  if (val) {
    keyboardIndex.value = -1
    hoveringOption.value = null
    // 定位当前选中项
    if (!props.multiple && hasSelection.value) {
      const idx = visibleOptionList().findIndex((o) => o.value === selectedValues.value[0])
      if (idx >= 0) keyboardIndex.value = idx
    }
  }
})

// 全局键盘（下拉打开时）
let offKeydown = null
watch(
  dropdownVisible,
  (val) => {
    if (val && !offKeydown) {
      offKeydown = onEvent(document, 'keydown', handleKeydown)
    } else if (!val && offKeydown) {
      offKeydown()
      offKeydown = null
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  offKeydown?.()
  offKeydown = null
})

defineExpose({
  focus: () => (props.filterable ? inputRef.value?.focus?.() : openDropdown()),
  blur: closeDropdown,
  toggleDropdown,
  clearSelection: handleClear,
  /** 手动刷新下拉定位 */
  updateDropdown: update,
})
</script>

<style src="./style.css"></style>
