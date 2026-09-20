<template>
  <div
    class="eb-select eb-tree-select eb-select eb-tree-select"
    :class="[sizeClass, { 'is-disabled': isDisabled, 'is-multiple': multiple, 'is-filterable': filterable, 'eb-ripple-off': ripple === false }]"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <div
      ref="referenceRef"
      class="eb-select__wrapper"
      :class="{ 'is-hovering': hovering && !isDisabled, 'is-focused': isFocused, 'is-disabled': isDisabled }"
      role="combobox"
      :tabindex="isDisabled ? -1 : 0"
      :aria-expanded="dropdownVisible"
      aria-haspopup="tree"
      :aria-disabled="isDisabled || undefined"
      @click="handleClick"
      @keydown="handleTriggerKeydown"
    >
      <!-- multiple 标签 -->
      <span v-if="multiple && selectedTags.length" class="eb-select__selection">
        <span
          v-for="tag in collapsedTags"
          :key="String(tag.value)"
          class="eb-tag eb-tag--info eb-tag--light eb-select__tag"
        >
          <span class="eb-tag__content">{{ tag.label }}</span>
          <eb-icon
            v-if="!isDisabled"
            class="eb-tag__close"
            name="close"
            @click.stop="removeTag(tag.value)"
          />
        </span>
        <span v-if="overflowCount > 0" class="eb-select__tags-collapse-item">
          + {{ overflowCount }}
        </span>
      </span>
      <!-- single 选中 label -->
      <span
        v-else-if="hasSelection"
        v-show="!(filterable && isFocused)"
        class="eb-select__selected-item eb-select__placeholder"
      >
        <span class="eb-select__selected-item-text">{{ selectedLabel }}</span>
      </span>
      <span
        v-else
        v-show="!(filterable && isFocused)"
        class="eb-select__placeholder"
      >{{ placeholder || t('select.placeholder') }}</span>

      <!-- filterable 输入 -->
      <input
        v-if="filterable"
        ref="inputRef"
        class="eb-select__input"
        :value="query"
        :disabled="isDisabled"
        :placeholder="hasSelection && !isFocused ? selectedLabel : (placeholder || t('select.placeholder'))"
        @input="handleQueryInput"
        @focus="isFocused = true"
      />

      <span class="eb-select__suffix">
        <eb-icon
          v-if="clearable && hasSelection && !isDisabled"
          class="eb-select__caret eb-select__clear"
          name="circle-close"
          @click.stop="handleClear"
        />
        <eb-icon
          class="eb-select__caret"
          :class="{ 'is-reverse': dropdownVisible }"
          name="arrow-down"
        />
      </span>
    </div>

    <Teleport to="body">
      <Transition name="eb-select-dropdown">
        <div
          v-if="dropdownVisible"
          ref="floatingRef"
          class="eb-select__popper eb-popper eb-select__dropdown eb-select__dropdown eb-tree-select__popper eb-tree-select__popper"
          :style="dropdownStyle"
        >
          <div class="eb-tree-select__content">
            <eb-tree
              ref="treeRef"
              :data="data"
              :props="treeFieldMap"
              :node-key="treeNodeKey"
              :show-checkbox="showCheckbox"
              :check-strictly="checkStrictly"
              :default-expand-all="defaultExpandAll"
              :default-expanded-keys="expandedKeysResolved"
              :expand-on-click-node="treeExpandOnClickNode"
              :check-on-click-node="checkOnClickNode"
              :highlight-current="true"
              :current-node-key="currentNodeKeyResolved"
              :filter-node-method="handleFilterNode"
              :accordion="accordion"
              :indent="indent"
              :lazy="lazy"
              :load="load"
              :empty-text="emptyText"
              @node-click="handleNodeClick"
              @check="handleTreeCheck"
              @node-expand="(d, n) => emit('node-expand', d, n)"
            >
              <template #default="{ node, data: nodeData }">
                <slot :node="node" :data="nodeData">{{ node.label }}</slot>
              </template>
            </eb-tree>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EbTreeSelect — 树形选择器（Select 触发器 + 弹层内嵌 EbTree）
 * 单选：无复选时点击叶子（或 check-strictly 任意节点）选中；
 *       带复选时勾选语义取首个叶子 key（级联）
 * 多选：默认复选级联，modelValue 存叶子 key（父子联动由树侧级联呈现）；
 *       check-strictly 时存全部勾选 key
 * filterable：输入过滤树（filter-method 自定义 (query, data) => bool）
 * label-in-value：绑定值形如 { value, label }；触发器支持键盘展开（Enter/Space/↓）
 */
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch } from 'vue'
import EbIcon from '../icon/index.vue'
import EbTree from '../tree/index.vue'
import { useFloating } from '../../composables/useFloating'
import { useZIndex } from '../../composables/useZIndex'
import { useClickOutside } from '../../composables/useClickOutside'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EbTreeSelect', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number, Boolean, Array, Object], default: undefined },
  data: { type: Array, default: () => [] },
  /** 字段映射 { value, label, children, disabled, isLeaf } */
  props: { type: Object, default: () => ({}) },
  nodeKey: { type: String, default: '' },
  multiple: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: '' },
  clearable: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  filterable: { type: Boolean, default: false },
  /** 自定义过滤 (query, data) => boolean */
  filterMethod: { type: Function, default: null },
  collapseTags: { type: Boolean, default: false },
  maxCollapseTags: { type: Number, default: 1 },
  collapseTagsTooltip: { type: Boolean, default: false },
  showCheckbox: { type: Boolean, default: false },
  checkStrictly: { type: Boolean, default: false },
  /** 复选回传值归约策略：child 只存叶子 key / parent 只存子级全选中的最上层父 key / all 全存勾选 key */
  checkedStrategy: { type: String, default: 'child' },
  /** 绑定值形如 { value, label }（multiple 为对象数组）；与 checked-strategy 组合时 label 取归约后 key 的文案 */
  labelInValue: { type: Boolean, default: false },
  defaultExpandAll: { type: Boolean, default: false },
  defaultExpandedKeys: { type: Array, default: () => [] },
  expandOnClickNode: { type: Boolean, default: true },
  checkOnClickNode: { type: Boolean, default: false },
  accordion: { type: Boolean, default: false },
  indent: { type: Number, default: 16 },
  emptyText: { type: String, default: '' },
  lazy: { type: Boolean, default: false },
  load: { type: Function, default: null },
  /** 激活涟漪动效开关（聚焦时实体色影向外扩展）；Form 上可批量关闭，全局见 setRipple */
  ripple: { type: Boolean, default: true },
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'clear',
  'remove-tag',
  'visible-change',
  'node-click',
  'check',
  'node-expand',
  'blur',
  'focus',
])

const { t } = useLocale()
const referenceRef = ref(null)
const floatingRef = ref(null)
const inputRef = ref(null)
const treeRef = ref(null)

const dropdownVisible = ref(false)
const isFocused = ref(false)
const hovering = ref(false)
const query = ref('')

const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: toRef(props, 'size'),
  disabled: toRef(props, 'disabled'),
})
const isDisabled = computed(() => formDisabled.value || props.disabled)

const { zIndex, next: nextZIndex } = useZIndex()
const { x, y, update, show: startFloating, hide: stopFloating } = useFloating({
  reference: referenceRef,
  floating: floatingRef,
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  shift: true,
  autoUpdate: true,
  onReferenceEscape: () => closeDropdown(),
})

const dropdownStyle = computed(() => ({
  position: 'fixed',
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
  minWidth: `${referenceRef.value?.offsetWidth ?? 0}px`,
}))

// ─── 字段映射 ───
const propsMap = computed(() => ({
  value: props.props?.value || props.nodeKey || 'value',
  label: props.props?.label || 'label',
  children: props.props?.children || 'children',
  disabled: props.props?.disabled || 'disabled',
  isLeaf: props.props?.isLeaf || 'isLeaf',
}))
const treeNodeKey = computed(() => propsMap.value.value)
const treeFieldMap = computed(() => ({
  children: propsMap.value.children,
  label: propsMap.value.label,
  disabled: propsMap.value.disabled,
  isLeaf: propsMap.value.isLeaf,
}))
const treeExpandOnClickNode = computed(() => !props.checkStrictly && props.expandOnClickNode)

function valueOf(data) {
  return data?.[propsMap.value.value]
}
function labelOf(data) {
  return data?.[propsMap.value.label]
}

// ─── modelValue 工具 ───
function toValidArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}
function arrayEqual(a, b) {
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}
/** 从外部值提取原始 key：兼容基础值与 label-in-value 的 { value, label } 对象 */
function rawValueOf(v) {
  return v && typeof v === 'object' ? v.value : v
}

// ─── 选中态 ───
const selectedValues = computed(() => toValidArray(props.modelValue).map(rawValueOf))

function labelOfKey(key) {
  const found = findDataByKey(key)
  if (found !== undefined) return String(labelOf(found))
  const node = treeRef.value?.getNode?.(key)
  if (node) return String(node.label)
  // label-in-value 回显兼容：数据中查不到时回退到外部对象自带的 label
  if (props.labelInValue) {
    const source = props.multiple
      ? toValidArray(props.modelValue).find((m) => rawValueOf(m) === key)
      : props.modelValue
    const inbound = source && typeof source === 'object' ? source.label : undefined
    if (inbound !== undefined && inbound !== null && inbound !== '') return String(inbound)
  }
  return String(key)
}

function findDataByKey(key) {
  let found
  const walk = (list) => {
    for (const item of list) {
      if (valueOf(item) === key) {
        found = item
        return true
      }
      const children = item?.[propsMap.value.children]
      if (Array.isArray(children) && walk(children)) return true
    }
    return false
  }
  walk(props.data || [])
  return found
}

const hasSelection = computed(() => {
  if (props.multiple) return selectedValues.value.length > 0
  const v = rawValueOf(props.modelValue)
  return v !== undefined && v !== null && v !== ''
})

const selectedLabel = computed(() => {
  if (props.multiple) return ''
  const v = rawValueOf(props.modelValue)
  if (v === undefined || v === null || v === '') return ''
  return labelOfKey(v)
})

const selectedTags = computed(() =>
  selectedValues.value.map((v) => ({ value: v, label: labelOfKey(v) }))
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
  if (s === 'large') return 'eb-select--large'
  if (s === 'small') return 'eb-select--small'
  return ''
})

// ─── 展开定位：默认展开 + 选中值祖先链 ───
const expandedKeysResolved = computed(() => {
  const base = [...(props.defaultExpandedKeys || [])]
  for (const key of selectedValues.value) {
    ancestorsOfKey(key).forEach((k) => base.push(k))
  }
  return base
})

function ancestorsOfKey(key) {
  const ancestors = []
  const walk = (list, path) => {
    for (const item of list) {
      if (valueOf(item) === key) {
        ancestors.push(...path)
        return true
      }
      const children = item?.[propsMap.value.children]
      if (Array.isArray(children) && walk(children, [...path, valueOf(item)])) return true
    }
    return false
  }
  walk(props.data || [], [])
  return ancestors
}

const currentNodeKeyResolved = computed(() =>
  props.multiple || props.showCheckbox ? undefined : rawValueOf(props.modelValue)
)

// ─── 值更新 ───
/** label-in-value 组包：原始 key 包成 { value, label }（label 取归约后 key 的文案） */
function wrapValue(key) {
  return { value: key, label: labelOfKey(key) }
}

/** 按 label-in-value 形态组包；undefined / null 空值保持原样 */
function packValue(next) {
  if (!props.labelInValue || next === undefined || next === null) return next
  return Array.isArray(next) ? next.map(wrapValue) : wrapValue(next)
}

function updateValue(next) {
  const prev = props.multiple ? selectedValues.value : rawValueOf(props.modelValue)
  const nextRaw = props.multiple ? toValidArray(next) : next
  const changed = props.multiple ? !arrayEqual(prev, nextRaw) : prev !== nextRaw
  emit('update:modelValue', packValue(next))
  if (changed) {
    emit('change', packValue(next))
    triggerFormValidate(formItem, 'change')
  }
}

/** 非严格多选：modelValue 只存叶子 key（级联由树侧呈现） */
function leafCheckedKeys() {
  const tree = treeRef.value
  if (!tree) return []
  return tree.getCheckedKeys().filter((k) => {
    const node = tree.getNode(k)
    return node && (!node.childNodes || node.childNodes.length === 0)
  })
}

/**
 * checked-strategy 归约：基于树级联后的全选 key 集合回传
 * child → 只存叶子 key；parent → 只存「子级全选中」的最上层父 key（不再下探）；all → 全存
 */
function reduceCheckedKeys() {
  const tree = treeRef.value
  if (!tree) return []
  const checked = new Set(tree.getCheckedKeys())
  if (props.checkedStrategy === 'all') return [...checked]
  if (props.checkedStrategy === 'parent') {
    const out = []
    const walk = (list) => {
      for (const item of list) {
        const key = valueOf(item)
        if (checked.has(key)) {
          out.push(key)
          continue
        }
        const children = item?.[propsMap.value.children]
        if (Array.isArray(children)) walk(children)
      }
    }
    walk(props.data || [])
    return out
  }
  return leafCheckedKeys()
}

// ─── modelValue → 树同步 ───
watch(
  [() => props.modelValue, dropdownVisible],
  () => {
    if (!props.showCheckbox) return
  nextTick(() => {
    const tree = treeRef.value
    if (!tree) return
    const keys = toValidArray(props.modelValue).map(rawValueOf)
    if (!arrayEqual(tree.getCheckedKeys(), keys)) {
      tree.setCheckedKeys(keys)
    }
  })
  },
  { immediate: true, deep: true }
)

// ─── 下拉开关 ───
async function openDropdown() {
  if (isDisabled.value || dropdownVisible.value) return
  nextZIndex()
  dropdownVisible.value = true
  emit('visible-change', true)
  await nextTick()
  // show() 内部 update + 启动 autoUpdate：页面滚动/resize 时弹层持续跟随
  await startFloating()
  await nextTick()
  if (props.filterable) inputRef.value?.focus?.()
  emit('focus')
}

function closeDropdown() {
  if (!dropdownVisible.value) return
  dropdownVisible.value = false
  stopFloating()
  emit('visible-change', false)
  query.value = ''
  treeRef.value?.filter?.('')
  isFocused.value = false
  emit('blur')
}

function handleClick() {
  if (isDisabled.value) return
  dropdownVisible.value ? closeDropdown() : openDropdown()
}

// 关闭态触发器键盘：Enter/Space/ArrowDown 打开下拉（Space 防滚屏、Enter 防表单提交）；
// filter 输入框的 keydown 冒泡上来时交给其自身逻辑，不触发打开
function handleTriggerKeydown(e) {
  if (e.target !== e.currentTarget) return
  if (isDisabled.value || dropdownVisible.value) return
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
    e.preventDefault()
    openDropdown()
  }
}

const { stop: stopClickOutside } = useClickOutside(
  [referenceRef, floatingRef],
  () => closeDropdown(),
  true
)
onBeforeUnmount(stopClickOutside)

// ─── 树交互 ───
function handleNodeClick(data, node) {
  emit('node-click', data, node)
  if (props.showCheckbox && props.checkOnClickNode) return
  if (props.showCheckbox) return
  if (!(props.checkStrictly || node?.isLeaf)) return
  if (data?.[propsMap.value.disabled]) return
  const key = valueOf(data)
  if (props.multiple) {
    // 以归一化原始 key 做 toggle（label-in-value 下 modelValue 是对象数组）
    const list = [...selectedValues.value]
    const idx = list.indexOf(key)
    if (idx >= 0) {
      list.splice(idx, 1)
      emit('remove-tag', key)
    } else {
      list.push(key)
    }
    updateValue(list)
  } else {
    updateValue(key)
    closeDropdown()
  }
}

function handleTreeCheck(data) {
  if (!props.showCheckbox) return
  const tree = treeRef.value
  if (!tree) return
  const key = valueOf(data)
  if (props.checkStrictly) {
    const checkedKeys = tree.getCheckedKeys()
    if (props.multiple) {
      updateValue(checkedKeys)
    } else {
      updateValue(checkedKeys.includes(key) ? key : undefined)
    }
  } else if (props.multiple) {
    updateValue(reduceCheckedKeys())
  } else {
    // 单选 + 复选：勾选父级 → 取首个可用叶子 key
    const firstLeaf = findFirstLeaf(data)
    const firstLeafKey = firstLeaf !== undefined ? valueOf(firstLeaf) : undefined
    const currentRaw = rawValueOf(props.modelValue)
    const hasCheckedChild = currentRaw != null
      && ancestorsOfKey(currentRaw).includes(key)
    updateValue(
      firstLeafKey === currentRaw || hasCheckedChild ? undefined : firstLeafKey
    )
  }
  // 同步树勾选态（cascade 重算后按 modelValue 重置，避免半选残留）
  nextTick(() => {
    const t = treeRef.value
    if (!t) return
    t.setCheckedKeys(toValidArray(props.modelValue).map(rawValueOf))
    emit('check', data, {
      checkedKeys: t.getCheckedKeys(),
      checkedNodes: t.getCheckedNodes(),
      halfCheckedKeys: t.getHalfCheckedKeys(),
      halfCheckedNodes: t.getHalfCheckedNodes(),
    })
  })
}

/** 数据树中找首个非禁用叶子 */
function findFirstLeaf(data) {
  const children = data?.[propsMap.value.children]
  if (Array.isArray(children) && children.length > 0) {
    for (const child of children) {
      const found = findFirstLeaf(child)
      if (found !== undefined) return found
    }
    return undefined
  }
  return data?.[propsMap.value.disabled] ? undefined : data
}

function removeTag(value) {
  // 以归一化原始 key 过滤：label-in-value 下 modelValue 是对象数组，不能直接比对
  const list = selectedValues.value.filter((v) => v !== value)
  updateValue(list)
  emit('remove-tag', value)
}

function handleClear() {
  updateValue(props.multiple ? [] : undefined)
  emit('clear')
  closeDropdown()
}

// ─── 过滤 ───
function handleFilterNode(value, data) {
  if (props.filterMethod) return !!props.filterMethod(value, data)
  if (!value) return true
  return String(labelOf(data) ?? '').toLowerCase().includes(String(value).toLowerCase())
}

function handleQueryInput(e) {
  query.value = e.target.value
  treeRef.value?.filter?.(query.value)
  if (!dropdownVisible.value) openDropdown()
}

// ─── expose（顶层命名函数，确保 setupState/暴露代理可见） ───
function focus() {
  if (props.filterable) inputRef.value?.focus?.()
  else openDropdown()
}

function filter(value) {
  return treeRef.value?.filter?.(value)
}

function getNode(key) {
  return treeRef.value?.getNode?.(key)
}

function getCheckedKeys(leafOnly) {
  return treeRef.value?.getCheckedKeys?.(leafOnly)
}

function getCheckedNodes(leafOnly) {
  return treeRef.value?.getCheckedNodes?.(leafOnly)
}

function setCheckedKeys(keys) {
  return treeRef.value?.setCheckedKeys?.(keys)
}

function setChecked(key, checked) {
  return treeRef.value?.setChecked?.(key, checked)
}

function getHalfCheckedKeys() {
  return treeRef.value?.getHalfCheckedKeys?.()
}

function getHalfCheckedNodes() {
  return treeRef.value?.getHalfCheckedNodes?.()
}

function setCurrentKey(key) {
  return treeRef.value?.setCurrentKey?.(key)
}

function getCurrentKey() {
  return treeRef.value?.getCurrentKey?.()
}

function getCurrentNode() {
  return treeRef.value?.getCurrentNode?.()
}

defineExpose({
  focus,
  blur: closeDropdown,
  treeRef,
  filter,
  getNode,
  getCheckedKeys,
  getCheckedNodes,
  setCheckedKeys,
  setChecked,
  getHalfCheckedKeys,
  getHalfCheckedNodes,
  setCurrentKey,
  getCurrentKey,
  getCurrentNode,
})
</script>

<style src="./style.css"></style>
