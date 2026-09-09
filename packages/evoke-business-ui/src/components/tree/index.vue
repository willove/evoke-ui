<template>
  <div
    class="ev-tree ev-tree"
    :class="{ 'ev-tree--highlight-current': highlightCurrent }"
    role="tree"
  >
    <ev-tree-node
      v-for="item in visibleRoots"
      :key="item.node.key"
      :node="item.node"
      :visible-children="item.visibleChildren"
      :expanded-set="expandedSet"
      :checked-set="checkedSet"
      :half-set="halfSet"
      :loading-set="loadingSet"
      :show-checkbox="showCheckbox"
      :expand-on-click-node="expandOnClickNode"
      :check-on-click-node="checkOnClickNode"
      :current-key="currentKey"
      :indent="indent"
      :filter-mode="filterActive"
      @toggle="handleToggle"
      @check="handleCheck"
      @node-click="handleNodeClick"
      @node-contextmenu="(e, node) => emit('node-contextmenu', e, node.raw, node)"
    >
      <template #default="{ node, data }">
        <slot :node="node" :data="data">{{ node.label }}</slot>
      </template>
    </ev-tree-node>
    <div v-if="visibleRoots.length === 0" class="ev-tree__empty-block">
      <span class="ev-tree__empty-text">{{ emptyText || t('tree.emptyText') }}</span>
    </div>
  </div>
</template>

<script setup>
/**
 * EvTree — 树形控件（.ev-tree / .ev-tree-node 双层类名）
 * 复选级联（check-strictly 关闭联动）/ filter-node-method / lazy load
 * expose：getNode/setCheckedKeys/getCheckedKeys/getCheckedNodes/getHalfCheckedKeys/
 *         getHalfCheckedNodes/setChecked/filter/setCurrentKey/getCurrentKey/getCurrentNode
 */
import { computed, onMounted, ref, watch } from 'vue'
import EvTreeNode from './node.vue'
import {
  buildNodes, cascadeCheck, descendantsOf, filterNodes,
} from './tree-model'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EvTree' })

const props = defineProps({
  data: { type: Array, default: () => [] },
  /** 字段映射 { children, label, disabled, isLeaf } */
  props: { type: Object, default: () => ({}) },
  nodeKey: { type: String, default: undefined },
  showCheckbox: { type: Boolean, default: false },
  checkStrictly: { type: Boolean, default: false },
  defaultExpandAll: { type: Boolean, default: false },
  defaultExpandedKeys: { type: Array, default: () => [] },
  defaultCheckedKeys: { type: Array, default: () => [] },
  expandOnClickNode: { type: Boolean, default: true },
  checkOnClickNode: { type: Boolean, default: false },
  highlightCurrent: { type: Boolean, default: false },
  currentNodeKey: { type: [String, Number], default: undefined },
  filterNodeMethod: { type: Function, default: null },
  accordion: { type: Boolean, default: false },
  indent: { type: Number, default: 16 },
  emptyText: { type: String, default: '' },
  /** lazy 模式（配合 load） */
  lazy: { type: Boolean, default: false },
  load: { type: Function, default: null },
})

const emit = defineEmits([
  'node-click',
  'node-expand',
  'node-collapse',
  'check-change',
  'check',
  'current-change',
  'node-contextmenu',
])

const { t } = useLocale()

const fieldMap = computed(() => ({
  children: props.props?.children || 'children',
  label: props.props?.label || 'label',
  disabled: props.props?.disabled || 'disabled',
  isLeaf: props.props?.isLeaf || 'isLeaf',
}))

// ─── 节点模型 ───
const roots = ref([])
const nodeMap = new Map()
let autoId = 0

function assignKeys(list) {
  for (const n of list) {
    if (props.nodeKey) {
      n.key = n.raw?.[props.nodeKey]
    } else {
      n.key = `__node_${autoId++}`
    }
    assignKeys(n.childNodes)
  }
}

function registerMap(list) {
  for (const n of list) {
    nodeMap.set(n.key, n)
    registerMap(n.childNodes)
  }
}

function rebuild() {
  autoId = 0
  nodeMap.clear()
  roots.value = buildNodes(props.data, fieldMap.value, null, 1, { lazy: props.lazy })
  assignKeys(roots.value)
  registerMap(roots.value)

  // 展开初始化
  const expanded = new Set()
  if (props.defaultExpandAll) {
    const walk = (list) => list.forEach((n) => {
      if (!n.isLeaf) expanded.add(n.key)
      walk(n.childNodes)
    })
    walk(roots.value)
  } else if (props.defaultExpandedKeys?.length) {
    props.defaultExpandedKeys.forEach((k) => expanded.add(k))
  }
  expandedSet.value = expanded

  // 勾选初始化
  if (props.defaultCheckedKeys?.length) {
    const keys = new Set(props.defaultCheckedKeys)
    if (!props.checkStrictly) {
      // 非严格模式：勾选节点自动级联全部后代
      props.defaultCheckedKeys.forEach((k) => {
        const n = nodeMap.get(k)
        if (n) descendantsOf(n).forEach((d) => keys.add(d.key))
      })
    }
    rawCheckedKeys.value = keys
  }
}

const expandedSet = ref(new Set())
const rawCheckedKeys = ref(new Set(props.defaultCheckedKeys || []))
const loadingSet = ref(new Set())
const currentKey = ref(props.currentNodeKey)
const filterValue = ref('')

// ─── 勾选状态（级联计算） ───
const checkState = computed(() =>
  cascadeCheck(roots.value, rawCheckedKeys.value, props.checkStrictly)
)
const checkedSet = computed(() => checkState.value.checked)
const halfSet = computed(() => checkState.value.half)

// ─── 过滤 ───
const filterActive = computed(() => filterValue.value !== '' && !!props.filterNodeMethod)

const visibleRoots = computed(() => {
  if (!filterActive.value) {
    return roots.value.map((n) => ({ node: n, visibleChildren: collectAll(n) }))
  }
  return filterNodes(roots.value, (_label, data) =>
    props.filterNodeMethod(filterValue.value, data)
  )
})

function collectAll(node) {
  return node.childNodes.map((c) => ({ node: c, visibleChildren: collectAll(c) }))
}

// ─── lazy 加载 ───
function setLoading(key, val) {
  const next = new Set(loadingSet.value)
  if (val) next.add(key)
  else next.delete(key)
  loadingSet.value = next
}

/** 向节点追加子级（parent 为 null 时追加到根级） */
function appendChildren(parent, childrenData) {
  const children = Array.isArray(childrenData) ? childrenData : []
  const newNodes = buildNodes(
    children, fieldMap.value, parent, parent ? parent.level + 1 : 1, { lazy: props.lazy }
  )
  assignKeys(newNodes)
  registerMap(newNodes)
  if (parent) {
    parent.childNodes = [...parent.childNodes, ...newNodes]
    parent.loaded = true
    if (parent.childNodes.length === 0) {
      parent.isLeaf = true
      parent.expandable = false
      const expanded = new Set(expandedSet.value)
      expanded.delete(parent.key)
      expandedSet.value = expanded
    } else {
      parent.isLeaf = false
      parent.expandable = true
    }
  } else if (newNodes.length) {
    roots.value = [...roots.value, ...newNodes]
  }
}

async function loadNodeChildren(node) {
  if (!props.load || loadingSet.value.has(node.key)) return
  setLoading(node.key, true)
  try {
    const children = await new Promise((resolve) => {
      props.load(node, (data) => resolve(data))
    })
    appendChildren(node, children)
  } finally {
    setLoading(node.key, false)
  }
}

/** lazy 模式的模型根级虚拟节点（level 0，data 为空） */
function virtualRoot() {
  return {
    key: '__root__',
    level: 0,
    data: null,
    raw: null,
    label: '',
    childNodes: roots.value,
    isLeaf: false,
    expandable: true,
    loaded: false,
    disabled: false,
  }
}

// ─── 交互 ───
function handleToggle(node) {
  const wasExpanded = expandedSet.value.has(node.key)
  const expanded = new Set(expandedSet.value)
  if (!wasExpanded) {
    if (props.accordion && node.level === 1) {
      // 手风琴：同级只展开一个
      for (const other of roots.value) {
        if (other.key !== node.key) expanded.delete(other.key)
      }
    }
    expanded.add(node.key)
    expandedSet.value = expanded
    emit('node-expand', node.raw, node)
    if (props.lazy && props.load && !node.loaded) {
      loadNodeChildren(node)
    }
  } else {
    expanded.delete(node.key)
    expandedSet.value = expanded
    emit('node-collapse', node.raw, node)
  }
}

function handleCheck(node) {
  if (node.disabled) return
  const isChecked = checkedSet.value.has(node.key)
  const keys = new Set(rawCheckedKeys.value)
  if (props.checkStrictly) {
    if (isChecked) keys.delete(node.key)
    else keys.add(node.key)
  } else {
    const affected = [node.key, ...descendantsOf(node).map((d) => d.key)]
    if (isChecked) affected.forEach((k) => keys.delete(k))
    else affected.forEach((k) => keys.add(k))
  }
  rawCheckedKeys.value = keys
  const checkedNow = !isChecked
  emit('check', node.raw, {
    checkedKeys: getCheckedKeys(),
    checkedNodes: getCheckedNodes(),
    halfCheckedKeys: getHalfCheckedKeys(),
    halfCheckedNodes: getHalfCheckedNodes(),
  })
  emit('check-change', node.raw, checkedNow)
}

function handleNodeClick(node) {
  if (props.highlightCurrent) {
    const prev = currentKey.value
    currentKey.value = node.key
    if (prev !== node.key) {
      emit('current-change', node.raw, node)
    }
  }
  emit('node-click', node.raw, node)
}

// ─── 数据同步 ───
watch(() => props.data, rebuild, { immediate: true })

onMounted(() => {
  // lazy 模式且未提供初始数据：加载根级
  if (props.lazy && props.load && (!props.data || props.data.length === 0)) {
    const root = virtualRoot()
    setLoading(root.key, true)
    Promise.resolve(
      new Promise((resolve) => {
        props.load(root, (data) => resolve(data))
      })
    )
      .then((children) => {
        appendChildren(null, children)
      })
      .finally(() => {
        setLoading(root.key, false)
      })
  }
})

// ─── expose API ───
function getNode(keyOrNode) {
  if (keyOrNode === undefined || keyOrNode === null) return null
  const key = typeof keyOrNode === 'object' ? keyOrNode[props.nodeKey] : keyOrNode
  return nodeMap.get(key) ?? null
}

function getNodesByKeys(keys) {
  return keys.map((k) => nodeMap.get(k)?.raw).filter(Boolean)
}

function setCheckedKeys(keys) {
  const keySet = new Set(keys || [])
  // 非严格模式：设置父级 key 时向下级联勾选
  if (!props.checkStrictly) {
    for (const k of [...keySet]) {
      const n = nodeMap.get(k)
      if (n) descendantsOf(n).forEach((d) => keySet.add(d.key))
    }
  }
  rawCheckedKeys.value = keySet
}

function getCheckedKeys(leafOnly = false) {
  if (!leafOnly) return [...checkedSet.value]
  return [...checkedSet.value].filter((k) => nodeMap.get(k)?.isLeaf)
}

function getCheckedNodes(leafOnly = false) {
  return getNodesByKeys(getCheckedKeys(leafOnly))
}

function getHalfCheckedKeys() {
  return [...halfSet.value]
}

function getHalfCheckedNodes() {
  return getNodesByKeys(getHalfCheckedKeys())
}

function setChecked(keyOrNode, checked) {
  const key = typeof keyOrNode === 'object' ? keyOrNode[props.nodeKey] : keyOrNode
  const node = nodeMap.get(key)
  if (!node) return
  const keys = new Set(rawCheckedKeys.value)
  if (props.checkStrictly) {
    if (checked) keys.add(node.key)
    else keys.delete(node.key)
  } else {
    const affected = [node.key, ...descendantsOf(node).map((d) => d.key)]
    if (checked) affected.forEach((k) => keys.add(k))
    else affected.forEach((k) => keys.delete(k))
  }
  rawCheckedKeys.value = keys
}

function filter(value) {
  filterValue.value = value
}

function setCurrentKey(key) {
  currentKey.value = key
  if (props.highlightCurrent && key != null) {
    const n = nodeMap.get(key)
    if (n) emit('current-change', n.raw, n)
  }
}

function getCurrentKey() {
  return currentKey.value ?? null
}

function getCurrentNode() {
  if (currentKey.value == null) return null
  return getNode(currentKey.value)
}

defineExpose({
  getNode,
  setCheckedKeys,
  getCheckedKeys,
  getCheckedNodes,
  getHalfCheckedKeys,
  getHalfCheckedNodes,
  setChecked,
  filter,
  setCurrentKey,
  getCurrentKey,
  getCurrentNode,
})
</script>

<style src="./style.css"></style>
