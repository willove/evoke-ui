<template>
  <div
    class="ev-descriptions ev-descriptions"
    :class="[`ev-descriptions--${size}`, { 'is-bordered': border }]"
  >
    <div v-if="title || $slots.title || extra || $slots.extra" class="ev-descriptions__header">
      <div class="ev-descriptions__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="ev-descriptions__extra">
        <slot name="extra">{{ extra }}</slot>
      </div>
    </div>
    <div class="ev-descriptions__body">
      <table class="ev-descriptions__table" :class="{ 'is-bordered': border }">
        <template v-if="direction === 'vertical'">
          <tbody class="ev-descriptions__body-label">
            <tr class="ev-descriptions__row">
              <th
                v-for="cell in cells"
                :key="cell.key"
                class="ev-descriptions__cell ev-descriptions__label"
                :class="cell.labelClass"
                :colspan="cell.labelColspan"
                :style="cell.labelStyle"
                :align="cell.labelAlign"
              >
                <component :is="CellSlotRenderer" :vnode="cell.item" kind="label" />
              </th>
            </tr>
          </tbody>
          <tbody class="ev-descriptions__body-content">
            <tr class="ev-descriptions__row">
              <td
                v-for="cell in cells"
                :key="cell.key"
                class="ev-descriptions__cell ev-descriptions__content"
                :class="cell.class"
                :colspan="cell.contentColspan"
                :style="cell.style"
                :align="cell.align"
              >
                <component :is="CellSlotRenderer" :vnode="cell.item" kind="content" />
              </td>
            </tr>
          </tbody>
        </template>
        <tbody v-else>
          <tr v-for="(row, ri) in rows" :key="ri" class="ev-descriptions__row">
            <template v-for="cell in row" :key="cell.key">
              <th
                class="ev-descriptions__cell ev-descriptions__label"
                :class="[cell.labelClass, { 'is-bordered-label': border }]"
                :colspan="cell.labelColspan"
                :style="cell.labelStyle"
                :align="cell.labelAlign"
              >
                <component :is="CellSlotRenderer" :vnode="cell.item" kind="label" />
              </th>
              <td
                class="ev-descriptions__cell ev-descriptions__content"
                :class="cell.class"
                :colspan="cell.contentColspan"
                :style="cell.style"
                :align="cell.align"
              >
                <component :is="CellSlotRenderer" :vnode="cell.item" kind="content" />
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
/**
 * EvDescriptions — 描述列表
 * 列网格：每个 item 占 2*span 列（label 1 列 + content 2*span-1 列），
 * 横向按 column 分行、末行不满由最后格补齐；纵向 label/content 两个 tbody
 */
import { computed, defineComponent, useSlots, Fragment } from 'vue'
import EvDescriptionsItem from './item.vue'

const props = defineProps({
  border: { type: Boolean, default: false },
  column: { type: Number, default: 3 },
  direction: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
  size: { type: String, default: 'default' },
  title: { type: String, default: '' },
  extra: { type: String, default: '' },
})

const slots = useSlots()

// 渲染 item 内 label / content 插槽内容的函数式小件
const CellSlotRenderer = defineComponent({
  props: { vnode: { type: Object, required: true }, kind: { type: String, required: true } },
  setup(cellProps) {
    return () => {
      const vnode = cellProps.vnode
      if (cellProps.kind === 'label') {
        if (typeof vnode.children?.label === 'function') return vnode.children.label()
        return vnode.props?.label ?? ''
      }
      if (typeof vnode.children?.default === 'function') return vnode.children.default()
      return typeof vnode.children === 'string' ? vnode.children : ''
    }
  },
})

// vnode.props 原始 key 可能保留 kebab-case（编译器不归一化）
function readProp(itemProps, camel, kebab) {
  return itemProps?.[camel] ?? itemProps?.[kebab]
}

function collectItems() {
  const flat = []
  const walk = (nodes) => {
    for (const n of nodes ?? []) {
      if (!n || typeof n !== 'object') continue
      if (Array.isArray(n)) { walk(n); continue }
      if (n.type === Fragment && Array.isArray(n.children)) { walk(n.children); continue }
      if (n.type === EvDescriptionsItem) flat.push(n)
    }
  }
  walk(slots.default?.())
  return flat
}

const colCount = computed(() => Math.max(1, Math.floor(props.column)))

function buildCell(item, index) {
  const p = item.props ?? {}
  const span = Math.max(1, Number(readProp(p, 'span', 'span') ?? 1))
  const width = readProp(p, 'width', 'width')
  const minWidth = readProp(p, 'minWidth', 'min-width')
  const align = readProp(p, 'align', 'align') ?? 'left'
  const labelAlign = readProp(p, 'labelAlign', 'label-align') || align
  const className = readProp(p, 'className', 'class-name') ?? ''
  const labelClassName = readProp(p, 'labelClassName', 'label-class-name') ?? ''
  return {
    key: index,
    item,
    span: Math.min(span, colCount.value),
    class: className,
    labelClass: labelClassName,
    style: width ? { width: `${Number(width)}px` } : undefined,
    labelStyle: minWidth ? { minWidth: `${Number(minWidth)}px` } : undefined,
    align,
    labelAlign,
    labelColspan: 1,
    contentColspan: 2 * Math.min(span, colCount.value) - 1,
  }
}

const cells = computed(() => collectItems().map(buildCell))

const rows = computed(() => {
  const out = []
  let row = []
  let used = 0
  for (const cell of cells.value) {
    // span 收敛到当前行剩余列数
    const span = Math.min(cell.span, colCount.value - used)
    const c = { ...cell, span, contentColspan: 2 * span - 1 }
    used += span
    row.push(c)
    if (used >= colCount.value) {
      out.push(row)
      row = []
      used = 0
    }
  }
  if (row.length) {
    // 末行不满列时由最后一格补满
    const remain = colCount.value - used
    const last = row[row.length - 1]
    last.contentColspan = 2 * last.span - 1 + 2 * remain
    out.push(row)
  }
  return out
})
</script>

<style src="./style.css"></style>
