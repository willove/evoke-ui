<template>
  <div class="eb-cascader-panel eb-cascader-panel" :class="{ 'is-bordered': border }">
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
            <span v-if="!node.isLeaf" class="eb-cascader-node__postfix">
              <eb-icon name="arrow-right" :size="12" />
            </span>
          </li>
        </ul>
      </div>
    </div>
    <div v-if="menus.every((m) => m.length === 0)" class="eb-cascader-panel__empty">暂无数据</div>
  </div>
</template>

<script setup>
/**
 * EbCascaderPanel — 级联面板
 * EbCascader 内嵌面板的独立版：无触发器，直接渲染多级菜单。
 * single/multiple + checkStrictly + emitPath；expose getCheckedNodes/clearChecked
 */
import { computed, ref } from 'vue'
import EbIcon from '../icon/index.vue'
import EbCheckbox from '../checkbox/index.vue'
import {
  normalizeOptions, pathToNodes, nodeToPath,
  leafPathsOf, arrayEqual,
} from '../cascader/utils'

defineOptions({ name: 'EbCascaderPanel' })

const props = defineProps({
  modelValue: { type: [Array, String, Number], default: undefined },
  options: { type: Array, default: () => [] },
  /** 字段映射配置：{value,label,children,disabled,emitPath,checkStrictly,multiple,expandTrigger} */
  props: { type: Object, default: () => ({}) },
  border: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'change', 'expand-change', 'close'])

const config = computed(() => ({
  value: 'value',
  label: 'label',
  children: 'children',
  disabled: 'disabled',
  ...props.props,
}))
const multiple = computed(() => !!props.props?.multiple)
const checkStrictly = computed(() => !!props.props?.checkStrictly)
const emitPath = computed(() => props.props?.emitPath !== false)
const expandOnHover = computed(() => props.props?.expandTrigger === 'hover')

const tree = computed(() => normalizeOptions(props.options, config.value))

const activePath = ref([])
const menus = computed(() => {
  const list = [tree.value]
  for (const key of activePath.value) {
    const level = list[list.length - 1]
    const hit = level.find((n) => n.value === key)
    if (!hit || !hit.children.length) break
    list.push(hit.children)
  }
  return list
})

function outOfPath(path) {
  return emitPath.value ? path : path[path.length - 1]
}

function isNodeSelectable(node) {
  return node.isLeaf || checkStrictly.value
}

// ─── 展开/选择 ───
function expandNode(node) {
  activePath.value = nodeToPath(node)
  emit('expand-change', activePath.value)
}

function handleNodeClick(node) {
  if (node.disabled) return
  if (expandOnHover.value) return
  if (!node.isLeaf) {
    expandNode(node)
    if (!checkStrictly.value && !multiple.value) return
  }
  if (!isNodeSelectable(node)) return
  selectNode(node)
}

function handleNodeHover(node) {
  if (!expandOnHover.value || node.disabled || node.isLeaf) return
  expandNode(node)
}

function selectNode(node) {
  const path = nodeToPath(node)
  if (multiple.value) {
    handleNodeCheck(node)
    return
  }
  activePath.value = path
  emit('update:modelValue', outOfPath(path))
  emit('change', outOfPath(path))
  // checkStrictly 单选保持面板打开
  if (!checkStrictly.value) emit('close')
}

// ─── 多选勾选 ───
function collectCheckedPaths() {
  return multiple.value && Array.isArray(props.modelValue)
    ? props.modelValue.map((item) => (Array.isArray(item) ? item : [item]))
    : []
}

function isNodeChecked(node) {
  if (checkStrictly.value) {
    const path = nodeToPath(node)
    return collectCheckedPaths().some((p) => arrayEqual(p, path))
  }
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
      next = checked.filter((c) => !leaves.some((lp) => arrayEqual(c, lp)))
    } else {
      const set = new Map(checked.map((p) => [p.join('/'), p]))
      leaves.forEach((lp) => set.set(lp.join('/'), lp))
      next = [...set.values()]
    }
  }
  const out = next.map((p) => outOfPath(p))
  emit('update:modelValue', out)
  emit('change', out)
}

// ─── 实例方法 ───
function getCheckedNodes(leafOnly = false) {
  const checked = collectCheckedPaths()
  const nodes = []
  for (const path of checked) {
    const chain = pathToNodes(tree.value, path)
    const node = chain[chain.length - 1]
    if (!node) continue
    if (leafOnly && !node.isLeaf) continue
    nodes.push({
      value: node.value,
      label: node.label,
      isLeaf: node.isLeaf,
      disabled: node.disabled,
      path,
      data: node.data,
    })
  }
  return nodes
}

function clearChecked() {
  emit('update:modelValue', multiple.value ? [] : undefined)
  emit('change', multiple.value ? [] : undefined)
}

defineExpose({ getCheckedNodes, clearChecked, /** 当前展开路径 */ activePath })
</script>

<style src="./style.css"></style>
<style src="../cascader/style.css"></style>
