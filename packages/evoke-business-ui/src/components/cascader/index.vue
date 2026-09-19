<template>
  <div
    class="eb-cascader eb-cascader"
    :class="[sizeClass, { 'is-disabled': isDisabled, 'eb-ripple-off': ripple === false }]"
  >
    <div
      ref="referenceRef"
      class="eb-input__wrapper"
      :class="{ 'is-focus': dropdownVisible, 'is-disabled': isDisabled, 'is-hovering': hovering }"
      @click="handleWrapperClick"
      @mouseenter="hovering = true"
      @mouseleave="hovering = false"
    >
      <!-- multiple 标签 -->
      <span v-if="multiple && checkedTags.length" class="eb-cascader__tags">
        <span
          v-for="tag in collapsedTags"
          :key="tag.key"
          class="eb-tag eb-tag--info eb-tag--light eb-cascader__tag"
        >
          <span class="eb-tag__content">{{ tag.label }}</span>
          <eb-icon
            v-if="!isDisabled"
            class="eb-tag__close"
            name="close"
            @click.stop="removeTag(tag.path)"
          />
        </span>
        <span v-if="overflowCount > 0" class="eb-select__tags-collapse-item">
          + {{ overflowCount }}
        </span>
      </span>
      <span v-else-if="hasSelection && !inputActive" class="eb-cascader__label">{{ selectedLabel }}</span>
      <span v-else-if="!inputActive" class="eb-cascader__placeholder">{{ placeholder || t('select.placeholder') }}</span>

      <input
        ref="inputRef"
        class="eb-input__inner eb-cascader__input"
        :value="query"
        :placeholder="inputPlaceholder"
        :readonly="!filterable || isDisabled"
        :disabled="isDisabled"
        @input="handleQueryInput"
        @focus="handleFocus"
      />

      <span class="eb-cascader__suffix">
        <eb-icon
          v-if="clearable && hasSelection && !isDisabled"
          class="eb-cascader__clear"
          name="circle-close"
          @click.stop="handleClear"
        />
        <eb-icon
          class="eb-cascader__arrow"
          :class="{ 'is-reverse': dropdownVisible }"
          name="arrow-down"
        />
      </span>
    </div>

    <Teleport to="body">
      <Transition name="eb-picker-dropdown">
        <div
          v-if="dropdownVisible"
          ref="floatingRef"
          class="eb-cascader__dropdown eb-popper eb-cascader__dropdown"
          :style="popperStyle"
        >
          <!-- 过滤建议 -->
          <div v-if="filterActive" class="eb-cascader__suggestion-panel">
            <div
              v-for="item in suggestions"
              :key="item.key"
              class="eb-cascader__suggestion-item"
              :class="{ 'is-checked': isPathChecked(item.path) }"
              @click="handleSuggestionClick(item)"
            >
              {{ item.text }}
            </div>
            <div v-if="suggestions.length === 0" class="eb-cascader__suggestion-item is-empty">
              {{ t('select.noMatch') }}
            </div>
          </div>
          <!-- 多级菜单 -->
          <div v-else class="eb-cascader-panel">
            <div v-for="(menu, mi) in menus" :key="mi" class="eb-cascader-menu">
              <div class="eb-cascader-menu__wrap">
                <ul class="eb-cascader-menu__list">
                  <li
                    v-for="node in menu"
                    :key="String(node.value)"
                    class="eb-cascader-node"
                    :class="{
                      'is-active': activePath.includes(node.value),
                      'in-active-path': activePath.includes(node.value),
                      'is-disabled': node.disabled,
                      'is-selectable': isNodeSelectable(node),
                    }"
                    @click="handleNodeClick(node)"
                    @mouseenter="handleNodeHover(node)"
                  >
                    <eb-checkbox
                      v-if="multiple"
                      class="eb-cascader-node__checkbox"
                      :model-value="isNodeChecked(node)"
                      :indeterminate="isNodeIndeterminate(node)"
                      :disabled="node.disabled"
                      @click.stop
                      @change="handleNodeCheck(node)"
                    />
                    <span class="eb-cascader-node__label">{{ node.label }}</span>
                    <span v-if="!node.isLeaf || isLazyPending(node)" class="eb-cascader-node__postfix">
                      <eb-icon name="arrow-right" :size="12" />
                    </span>
                  </li>
                  <!-- lazy：待加载节点的子列为空，loading 期间展示加载态占位 -->
                  <li v-if="menu.length === 0 && isLoadingColumn(mi)" class="eb-cascader-node is-loading-node">
                    <eb-icon name="loading" :size="14" class="is-rotating" />
                    <span class="eb-cascader-node__label">{{ t('select.loading') }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EbCascader — 级联选择器（.eb-cascader / .eb-cascader-panel / .eb-cascader-node 结构类）
 * 多级菜单浮层；emitPath（值=路径 or 叶值）；check-strictly 任意层级可选；
 * multiple 复选（父子级联勾选叶路径）；filterable 路径建议
 */
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch } from 'vue'
import EbIcon from '../icon/index.vue'
import EbCheckbox from '../checkbox/index.vue'
import {
  normalizeOptions, walkNodes, findByValue, pathToNodes,
  nodeToPath, nodeToLabels, leafPathsOf, filterNodes, arrayEqual,
} from './utils'
import { useFloating } from '../../composables/useFloating'
import { useZIndex } from '../../composables/useZIndex'
import { useClickOutside } from '../../composables/useClickOutside'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EbCascader', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Array, String, Number], default: null },
  options: { type: Array, default: () => [] },
  /** 字段/行为映射 { value, label, children, disabled, checkStrictly, emitPath } */
  props: { type: Object, default: () => ({}) },
  multiple: { type: Boolean, default: false },
  size: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  filterable: { type: Boolean, default: false },
  filterMethod: { type: Function, default: null },
  separator: { type: String, default: ' / ' },
  showAllLevels: { type: Boolean, default: true },
  collapseTags: { type: Boolean, default: false },
  maxCollapseTags: { type: Number, default: 1 },
  /** 展开触发方式 click / hover */
  expandTrigger: { type: String, default: '' },
  /** 懒加载开关（配合 load-data） */
  lazy: { type: Boolean, default: false },
  /** 懒加载函数 (option) => Promise，resolve 后子级并入该节点（可返回子级数组或在 option.children 就地写入） */
  loadData: { type: Function, default: null },
  /** 激活涟漪动效开关（聚焦时实体色影向外扩展）；Form 上可批量关闭，全局见 setRipple */
  ripple: { type: Boolean, default: true },
})

const emit = defineEmits([
  'update:modelValue', 'change', 'expand-change', 'visible-change',
  'remove-tag', 'blur', 'focus', 'clear',
])

const { t } = useLocale()

const config = computed(() => ({
  value: props.props?.value || 'value',
  label: props.props?.label || 'label',
  children: props.props?.children || 'children',
  disabled: props.props?.disabled || 'disabled',
}))

const checkStrictly = computed(() => !!props.props?.checkStrictly)
const emitPath = computed(() => props.props?.emitPath !== false)
const expandOnHover = computed(() =>
  props.expandTrigger === 'hover' || props.props?.expandTrigger === 'hover'
)

const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: toRef(props, 'size'),
  disabled: toRef(props, 'disabled'),
})
const isDisabled = computed(() => formDisabled.value || props.disabled)
const sizeClass = computed(() => {
  const s = props.size || formSize.value
  if (s === 'large') return 'eb-cascader--large'
  if (s === 'small') return 'eb-cascader--small'
  return ''
})

// ─── 选项树 ───
// lazy：懒加载并入的子级（原始 data 对象 → 子级数据），不改写宿主 options
const loadedChildren = new Map()
/** 懒加载完成信号：resolve 后重建节点树 */
const lazyTick = ref(0)

const tree = computed(() => {
  lazyTick.value
  const nodes = normalizeOptions(props.options, config.value)
  if (loadedChildren.size) {
    const merge = (list) => {
      for (const n of list) {
        if (loadedChildren.has(n.data) && n.children.length === 0) {
          n.children = normalizeOptions(loadedChildren.get(n.data), config.value, n)
          n.isLeaf = n.children.length === 0
        }
        merge(n.children)
      }
    }
    merge(nodes)
  }
  return nodes
})

// ─── 菜单栈（activePath 驱动） ───
const activePath = ref([])
const menus = computed(() => {
  const list = [tree.value]
  let level = tree.value
  for (const key of activePath.value) {
    const hit = level.find((n) => n.value === key)
    if (!hit || (hit.isLeaf && !isLazyPending(hit))) break
    level = hit.children
    list.push(level)
  }
  return list
})

// ─── 懒加载 ───
/** lazy 待加载节点：leaf 标记为 false 且无 children */
function isLazyPending(node) {
  return !!props.lazy
    && typeof props.loadData === 'function'
    && node.children.length === 0
    && node.data?.leaf === false
    && !loadedChildren.has(node.data)
}

const loadingSet = ref(new Set())

/** 第 mi 列（mi > 0）对应的父节点是否加载中 */
function isLoadingColumn(mi) {
  if (mi <= 0) return false
  return loadingSet.value.has(activePath.value.slice(0, mi).join('/'))
}

/** 展开待加载节点：触发 load-data，期间该列展示加载态 */
async function ensureChildrenLoaded(node) {
  if (!isLazyPending(node)) return
  const pathKey = nodeToPath(node).join('/')
  if (loadingSet.value.has(pathKey)) return
  loadingSet.value = new Set([...loadingSet.value, pathKey])
  try {
    const resolved = await props.loadData(node.data)
    // 宿主未在 option.children 就地写入时，resolve 返回的子级数组兜底并入
    if (Array.isArray(resolved)) loadedChildren.set(node.data, resolved)
  } finally {
    loadingSet.value = new Set([...loadingSet.value].filter((k) => k !== pathKey))
    lazyTick.value += 1
  }
}

// ─── 值解析 ───
/** 单选：modelValue → { node, path } */
const selected = computed(() => {
  if (props.multiple || props.modelValue == null) return null
  return findByValue(tree.value, props.modelValue, Array.isArray(props.modelValue) ? props.modelValue : null)
})

const selectedNodes = computed(() => (selected.value ? [selected.value.node] : []))

/** 多选：modelValue（路径数组）→ 节点数组 */
const checkedNodes = computed(() => {
  if (!props.multiple || !Array.isArray(props.modelValue)) return []
  const out = []
  for (const item of props.modelValue) {
    const path = Array.isArray(item) ? item : [item]
    const nodes = pathToNodes(tree.value, path)
    if (nodes) out.push(nodes[nodes.length - 1])
  }
  return out
})

const hasSelection = computed(() =>
  props.multiple ? checkedNodes.value.length > 0 : !!selected.value
)

function labelOfNode(node) {
  const labels = nodeToLabels(node)
  return props.showAllLevels ? labels.join(props.separator) : labels[labels.length - 1]
}

const selectedLabel = computed(() =>
  selected.value ? labelOfNode(selected.value.node) : ''
)

const checkedTags = computed(() =>
  checkedNodes.value.map((n) => ({ key: nodeToPath(n).join('/'), label: labelOfNode(n), path: nodeToPath(n) }))
)

const collapsedTags = computed(() => {
  if (!props.collapseTags) return checkedTags.value
  return checkedTags.value.slice(0, props.maxCollapseTags)
})

const overflowCount = computed(() => {
  if (!props.collapseTags) return 0
  return Math.max(0, checkedTags.value.length - props.maxCollapseTags)
})

// 选中值 → activePath 回放（声明移至 dropdownVisible 之后）

// ─── 弹层 ───
const referenceRef = ref(null)
const floatingRef = ref(null)
const inputRef = ref(null)
const dropdownVisible = ref(false)
const isFocused = ref(false)
const hovering = ref(false)
const query = ref('')

const filterActive = computed(() => props.filterable && query.value !== '')
/**
 * 搜索输入接管触发器行：filterable 且面板打开（输入聚焦）时，
 * 占位/已选文案整体让位，输入框占满整行，光标与占位文本起点一致
 */
const inputActive = computed(() => props.filterable && dropdownVisible.value)
/** 原生输入框占位：展开时显示提示文案；关闭且有选中时显示选中路径 */
const inputPlaceholder = computed(() => {
  if (inputActive.value) return props.placeholder || t('select.placeholder')
  if (hasSelection.value && !dropdownVisible.value) return selectedLabel.value
  return ''
})
/** 有过滤关键字时，占位/已选文案让位给过滤输入框；清空关键字后恢复 */

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

const popperStyle = computed(() => ({
  position: 'fixed',
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
  minWidth: `${referenceRef.value?.offsetWidth ?? 0}px`,
}))

// 选中值 → activePath 回放（打开前/清空后重置）
watch(selectedNodes, (nodes) => {
  if (props.multiple) return
  if (nodes[0]) {
    if (!activePath.value.length) activePath.value = nodeToPath(nodes[0])
  } else if (!dropdownVisible.value) {
    activePath.value = []
  }
}, { immediate: true })

async function openDropdown() {
  if (isDisabled.value || dropdownVisible.value) return
  nextZIndex()
  dropdownVisible.value = true
  emit('visible-change', true)
  await nextTick()
  // show() 内部 update + 启动 autoUpdate：页面滚动/resize 时弹层持续跟随
  await startFloating()
  if (props.filterable) inputRef.value?.focus?.()
}

function closeDropdown() {
  if (!dropdownVisible.value) return
  dropdownVisible.value = false
  stopFloating()
  emit('visible-change', false)
  query.value = ''
  isFocused.value = false
  emit('blur')
}

function handleWrapperClick() {
  if (isDisabled.value) return
  dropdownVisible.value ? closeDropdown() : openDropdown()
}

const { stop: stopClickOutside } = useClickOutside(
  [referenceRef, floatingRef],
  () => closeDropdown(),
  true
)
onBeforeUnmount(stopClickOutside)

function handleFocus() {
  isFocused.value = true
  emit('focus')
}

// ─── 过滤 ───
const suggestions = computed(() => {
  if (!filterActive.value) return []
  return filterNodes(tree.value, query.value, props.filterMethod).map((n) => ({
    key: nodeToPath(n).join('/'),
    node: n,
    path: nodeToPath(n),
    text: nodeToLabels(n).join(props.separator),
  }))
})

function handleQueryInput(e) {
  query.value = e.target.value
  if (!dropdownVisible.value) openDropdown()
}

// ─── 选择 ───
function emitValue(next) {
  emit('update:modelValue', next)
  emit('change', next)
  triggerFormValidate(formItem, 'change')
}

function outOfPath(path) {
  return emitPath.value ? path : path[path.length - 1]
}

function isNodeSelectable(node) {
  return (node.isLeaf && !isLazyPending(node)) || checkStrictly.value
}

function handleNodeClick(node) {
  if (node.disabled) return
  // 待加载节点：点击仅展开并触发加载，不参与选择
  if (isLazyPending(node)) {
    expandNode(node)
    return
  }
  // hover 模式：仅不可选节点（需 hover 展开的父级）跳过点击，可选节点继续走选择
  if (expandOnHover.value && !isNodeSelectable(node)) return
  if (!node.isLeaf) {
    expandNode(node)
    if (!checkStrictly.value && !props.multiple) return
  }
  if (!isNodeSelectable(node)) return
  selectNode(node)
}

function handleNodeHover(node) {
  if (!expandOnHover.value || node.disabled || node.isLeaf) return
  expandNode(node)
}

async function expandNode(node) {
  const path = nodeToPath(node)
  activePath.value = path
  emit('expand-change', path.slice(0, -1))
  await ensureChildrenLoaded(node)
}

function selectNode(node) {
  const path = nodeToPath(node)
  if (props.multiple) {
    // 多选点击节点：切换勾选
    handleNodeCheck(node)
    return
  }
  activePath.value = path
  emitValue(outOfPath(path))
  // checkStrictly 单选保持面板打开
  if (!checkStrictly.value) closeDropdown()
}

/** 多选：节点勾选状态 */
function collectCheckedPaths() {
  return (props.multiple && Array.isArray(props.modelValue))
    ? props.modelValue.map((item) => (Array.isArray(item) ? item : [item]))
    : []
}

function isNodeChecked(node) {
  if (checkStrictly.value) {
    const path = nodeToPath(node)
    return collectCheckedPaths().some((p) => arrayEqual(p, path))
  }
  // 级联：自身或全部后代叶路径被勾选 → checked
  const path = nodeToPath(node)
  if (node.isLeaf) {
    return collectCheckedPaths().some((p) => arrayEqual(p, path))
  }
  const leaves = leafPathsOf(node)
  if (!leaves.length) return false
  return leaves.every((lp) => collectCheckedPaths().some((p) => arrayEqual(p, lp)))
}

function isNodeIndeterminate(node) {
  if (checkStrictly.value || node.isLeaf) return false
  const leaves = leafPathsOf(node)
  if (!leaves.length) return false
  const some = leaves.some((lp) => collectCheckedPaths().some((p) => arrayEqual(p, lp)))
  const every = leaves.every((lp) => collectCheckedPaths().some((p) => arrayEqual(p, lp)))
  return some && !every
}

function isPathChecked(path) {
  return collectCheckedPaths().some((p) => arrayEqual(p, path))
}

function handleNodeCheck(node) {
  if (node.disabled) return
  const path = nodeToPath(node)
  const checked = collectCheckedPaths()
  const contains = (p) => checked.some((c) => arrayEqual(c, p))
  let next
  if (checkStrictly.value) {
    next = contains(path)
      ? checked.filter((c) => !arrayEqual(c, path))
      : [...checked, path]
  } else {
    const leaves = node.isLeaf ? [path] : leafPathsOf(node)
    const allChecked = leaves.every((lp) => contains(lp))
    if (allChecked) {
      // 取消：移除这些叶路径（并清理其父级严格路径残留）
      next = checked.filter((c) => !leaves.some((lp) => arrayEqual(c, lp)))
    } else {
      // 勾选：合并叶路径（去重）
      const set = new Map(checked.map((p) => [p.join('/'), p]))
      leaves.forEach((lp) => set.set(lp.join('/'), lp))
      next = [...set.values()]
    }
  }
  emitValue(next.map((p) => outOfPath(p)))
}

function handleSuggestionClick(item) {
  const node = item.node
  if (node.disabled) return
  if (props.multiple) {
    handleNodeCheck(node)
  } else {
    activePath.value = item.path
    emitValue(outOfPath(item.path))
    closeDropdown()
  }
}

function removeTag(path) {
  const checked = collectCheckedPaths().filter((p) => !arrayEqual(p, path))
  emitValue(checked.map((p) => outOfPath(p)))
  emit('remove-tag', path)
}

function handleClear() {
  emitValue(props.multiple ? [] : null)
  emit('clear')
  closeDropdown()
}

// ─── expose ───
function getCheckedNodes(leafOnly) {
  const paths = collectCheckedPaths()
  const nodes = paths
    .map((p) => pathToNodes(tree.value, p)?.[p.length - 1])
    .filter(Boolean)
  return (leafOnly ? nodes.filter((n) => n.isLeaf) : nodes).map((n) => n.data)
}

function focus() {
  inputRef.value?.focus?.()
  openDropdown()
}

function blur() {
  closeDropdown()
}

defineExpose({
  focus,
  blur,
  getCheckedNodes,
  /** 面板激活路径 */
  getActivePath: () => [...activePath.value],
  toggleDropDownVisible: (val) => {
    if (val) openDropdown()
    else closeDropdown()
  },
})
</script>

<style src="./style.css"></style>
