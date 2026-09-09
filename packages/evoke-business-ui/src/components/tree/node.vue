<template>
  <div
    class="ev-tree-node ev-tree-node"
    :class="{
      'is-expanded': isExpanded,
      'is-current': isCurrent,
      'is-focusable': !node.disabled,
      'is-checked': !node.disabled && isChecked,
      'is-disabled': !!node.disabled,
    }"
    role="treeitem"
    tabindex="-1"
    :aria-expanded="node.expandable ? isExpanded : undefined"
    :aria-disabled="node.disabled"
    :aria-checked="showCheckbox ? ariaChecked : undefined"
    :data-key="node.key"
    @click.stop="handleClick"
    @contextmenu="handleContextmenu"
  >
    <div
      class="ev-tree-node__content"
      :style="{ paddingLeft: `${(node.level - 1) * indent}px` }"
    >
      <span
        class="ev-tree-node__expand-icon"
        :class="{ 'is-leaf': node.isLeaf, expanded: !node.isLeaf && isExpanded }"
        @click.stop="handleIconClick"
      >
        <ev-icon v-if="!node.isLeaf" name="caret-right" :size="12" />
      </span>
      <ev-checkbox
        v-if="showCheckbox"
        :model-value="isChecked"
        :indeterminate="isIndeterminate"
        :disabled="!!node.disabled"
        class="ev-tree-node__checkbox"
        @click.stop
        @change="handleCheck"
      />
      <span v-if="isLoading" class="ev-tree-node__loading-icon is-loading">
        <ev-icon name="loading" :size="14" class="is-loading" />
      </span>
      <span class="ev-tree-node__label">
        <slot :node="node" :data="node.raw">{{ node.label }}</slot>
      </span>
    </div>
    <div
      v-if="hasVisibleChildren"
      v-show="childrenVisible"
      class="ev-tree-node__children"
      role="group"
      :aria-expanded="isExpanded"
      @click.stop
    >
      <ev-tree-node
        v-for="item in visibleChildren"
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
        :filter-mode="filterMode"
        @toggle="$emit('toggle', $event)"
        @check="$emit('check', $event)"
        @node-click="$emit('node-click', $event)"
        @node-contextmenu="(e, n) => $emit('node-contextmenu', e, n)"
      >
        <template #default="{ node, data }">
          <slot :node="node" :data="data">{{ node.label }}</slot>
        </template>
      </ev-tree-node>
    </div>
  </div>
</template>

<script setup>
/**
 * EvTreeNode — 树节点（递归渲染，）
 * 展开箭头 caret-right 旋转 / 复选级联状态由父级 Set 注入
 */
import { computed } from 'vue'
import EvTreeNode from './node.vue'
import EvCheckbox from '../checkbox/index.vue'
import EvIcon from '../icon/index.vue'

defineOptions({ name: 'EvTreeNode' })

const props = defineProps({
  /** 内部节点模型 */
  node: { type: Object, required: true },
  /** 可见子树 [{ node, visibleChildren }] */
  visibleChildren: { type: Array, default: () => [] },
  expandedSet: { type: Object, required: true },
  checkedSet: { type: Object, required: true },
  halfSet: { type: Object, required: true },
  loadingSet: { type: Object, default: () => new Set() },
  showCheckbox: { type: Boolean, default: false },
  expandOnClickNode: { type: Boolean, default: true },
  checkOnClickNode: { type: Boolean, default: false },
  currentKey: { type: [String, Number], default: undefined },
  indent: { type: Number, default: 16 },
  filterMode: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'check', 'node-click', 'node-contextmenu'])

const isExpanded = computed(() => props.expandedSet.has(props.node.key))
const isChecked = computed(() => props.checkedSet.has(props.node.key))
const isIndeterminate = computed(() => props.halfSet.has(props.node.key))
const isLoading = computed(() => props.loadingSet.has(props.node.key))
const isCurrent = computed(() =>
  props.currentKey !== undefined && props.currentKey !== null && props.currentKey === props.node.key
)
const hasVisibleChildren = computed(() => props.visibleChildren.length > 0)
/** 过滤模式：命中的子树直接展开展示 */
const childrenVisible = computed(() => (props.filterMode ? true : isExpanded.value))
const ariaChecked = computed(() => {
  if (isIndeterminate.value) return 'mixed'
  return isChecked.value
})

function handleIconClick() {
  if (props.node.isLeaf) return
  emit('toggle', props.node)
}

function handleClick() {
  if (props.expandOnClickNode && !props.node.isLeaf) {
    emit('toggle', props.node)
  }
  if (props.checkOnClickNode && props.showCheckbox && !props.node.disabled) {
    emit('check', props.node)
  }
  emit('node-click', props.node)
}

function handleCheck() {
  if (props.node.disabled) return
  emit('check', props.node)
}

function handleContextmenu(e) {
  emit('node-contextmenu', e, props.node)
}
</script>
