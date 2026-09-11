<script setup>
/**
 * EbTableColumn — 列定义（onMounted 向 EbTable 注册，自身不渲染）
 * 注册的是普通快照对象（非 getter）——父级 render 不得直接依赖子组件响应式 props
 * （inline 数组 prop 每次渲染新引用会导致父 render effect 无限递归），故用 watch 同步。
 * type：selection / expand / index / 默认数据列
 * 作用域插槽：default({ row, $index, column }) / header({ column, $index })
 */
import { onBeforeUnmount, onMounted, useSlots, watch } from 'vue'
import { useTableContext } from './table-context'

defineOptions({ name: 'EbTableColumn' })

const props = defineProps({
  type: {
    type: String,
    default: undefined,
    validator: (v) => ['selection', 'expand', 'index'].includes(v),
  },
  prop: { type: String, default: '' },
  label: { type: String, default: '' },
  width: { type: [String, Number], default: undefined },
  minWidth: { type: [String, Number], default: undefined },
  fixed: { type: [Boolean, String], default: false },
  sortable: { type: [Boolean, String], default: false },
  sortMethod: { type: Function, default: null },
  sortBy: { type: [String, Array, Function], default: undefined },
  sortOrders: { type: Array, default: () => ['ascending', 'descending', null] },
  filters: { type: Array, default: () => [] },
  filterMethod: { type: Function, default: null },
  filterMultiple: { type: Boolean, default: true },
  columnKey: { type: String, default: undefined },
  align: {
    type: String,
    default: 'left',
    validator: (v) => ['left', 'center', 'right'].includes(v),
  },
  headerAlign: { type: String, default: undefined },
  showOverflowTooltip: { type: [Boolean, Object], default: false },
  formatter: { type: Function, default: null },
  className: { type: String, default: '' },
  labelClassName: { type: String, default: '' },
  selectable: { type: Function, default: null },
  index: { type: [Number, Function], default: undefined },
})

const ctx = useTableContext()
const slots = useSlots()

/**
 * 列快照 — 普通对象（非 reactive）
 * 关键：Table 的 render 直接读取快照属性。若快照为响应式且值来自子组件 props
 * （如 inline 数组每次渲染都是新引用），会形成「父 render → 子 props 更新 →
 * watch 写回快照 → 父 render」的无限递归。普通对象让父 render 不追踪这些属性，
 * 响应性仅保留在 columns 注册表（增删列）层面。
 */
const column = {
  uid: '',
  type: props.type,
  prop: props.prop,
  label: props.label,
  width: props.width,
  minWidth: props.minWidth,
  fixed: props.fixed,
  sortable: props.sortable,
  sortMethod: props.sortMethod,
  sortBy: props.sortBy,
  sortOrders: props.sortOrders,
  filters: props.filters,
  filterMethod: props.filterMethod,
  filterMultiple: props.filterMultiple,
  columnKey: props.columnKey,
  align: props.align,
  headerAlign: props.headerAlign,
  showOverflowTooltip: props.showOverflowTooltip,
  formatter: props.formatter,
  className: props.className,
  labelClassName: props.labelClassName,
  selectable: props.selectable,
  index: props.index,
  get id() {
    return this.columnKey || this.prop || this.type || this.label
  },
  get slots() {
    return slots
  },
}

// props → 快照单向同步（Table render 不追踪子 props）
watch(
  () => [
    props.type, props.prop, props.label, props.width, props.minWidth, props.fixed,
    props.sortable, props.sortMethod, props.sortBy, props.sortOrders, props.filters,
    props.filterMethod, props.filterMultiple, props.columnKey, props.align,
    props.headerAlign, props.showOverflowTooltip, props.formatter, props.className,
    props.labelClassName, props.selectable, props.index,
  ],
  () => {
    Object.assign(column, {
      type: props.type,
      prop: props.prop,
      label: props.label,
      width: props.width,
      minWidth: props.minWidth,
      fixed: props.fixed,
      sortable: props.sortable,
      sortMethod: props.sortMethod,
      sortBy: props.sortBy,
      sortOrders: props.sortOrders,
      filters: props.filters,
      filterMethod: props.filterMethod,
      filterMultiple: props.filterMultiple,
      columnKey: props.columnKey,
      align: props.align,
      headerAlign: props.headerAlign,
      showOverflowTooltip: props.showOverflowTooltip,
      formatter: props.formatter,
      className: props.className,
      labelClassName: props.labelClassName,
      selectable: props.selectable,
      index: props.index,
    })
  }
)

onMounted(() => {
  ctx?.registerColumn?.(column)
})

onBeforeUnmount(() => {
  ctx?.unregisterColumn?.(column)
})
</script>

<template>
  <!-- 列组件不产出 DOM（插槽由 Table 经 scope 调用） -->
</template>
