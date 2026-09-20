<template>
  <div
    class="eb-descriptions eb-descriptions"
    :class="[`eb-descriptions--${size}`, { 'is-bordered': border }]"
  >
    <div v-if="title || $slots.title || extra || $slots.extra" class="eb-descriptions__header">
      <div class="eb-descriptions__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="eb-descriptions__extra">
        <slot name="extra">{{ extra }}</slot>
      </div>
    </div>
    <div class="eb-descriptions__body">
      <table class="eb-descriptions__table" :class="{ 'is-bordered': border }">
        <template v-if="direction === 'vertical'">
          <tbody class="eb-descriptions__body-label">
            <tr class="eb-descriptions__row">
              <th
                v-for="cell in cells"
                :key="cell.key"
                class="eb-descriptions__cell eb-descriptions__label"
                :class="cell.labelClass"
                :colspan="cell.labelColspan"
                :style="cell.labelStyle"
                :align="cell.labelAlign"
              >
                <component :is="CellSlotRenderer" :vnode="cell.item" kind="label" />
                <span v-if="colon" class="eb-descriptions__colon">:</span>
              </th>
            </tr>
          </tbody>
          <tbody class="eb-descriptions__body-content">
            <tr class="eb-descriptions__row">
              <td
                v-for="cell in cells"
                :key="cell.key"
                class="eb-descriptions__cell eb-descriptions__content"
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
          <tr v-for="(row, ri) in rows" :key="ri" class="eb-descriptions__row">
            <template v-for="cell in row" :key="cell.key">
              <th
                class="eb-descriptions__cell eb-descriptions__label"
                :class="[cell.labelClass, { 'is-bordered-label': border }]"
                :colspan="cell.labelColspan"
                :style="cell.labelStyle"
                :align="cell.labelAlign"
              >
                <component :is="CellSlotRenderer" :vnode="cell.item" kind="label" />
                <span v-if="colon" class="eb-descriptions__colon">:</span>
              </th>
              <td
                class="eb-descriptions__cell eb-descriptions__content"
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
 * EbDescriptions — 描述列表
 * 列网格：每个 item 占 2*span 列（label 1 列 + content 2*span-1 列），
 * 横向按 column 分行、末行不满由最后格补齐；纵向 label/content 两个 tbody；
 * column 支持响应式对象（matchMedia 断点感知，SSR 安全）；colon / 容器级样式可配
 */
import { computed, defineComponent, useSlots, Fragment, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import EbDescriptionsItem from './item.vue'
import { inBrowser } from '../../utils/dom'

const props = defineProps({
  border: { type: Boolean, default: false },
  /** 列数：数字固定档，或 { xs, sm, md, lg } 响应式对象（由小到大命中） */
  column: { type: [Number, Object], default: 3 },
  /** 标签后显示冒号（antd 默认 true，此处默认 false 保持既有视觉） */
  colon: { type: Boolean, default: false },
  /** 容器级标签单元格样式，item 同名 prop 可覆盖 */
  labelStyle: { type: Object, default: undefined },
  /** 容器级内容单元格样式，item 同名 prop 可覆盖 */
  contentStyle: { type: Object, default: undefined },
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
      if (n.type === EbDescriptionsItem) flat.push(n)
    }
  }
  walk(slots.default?.())
  return flat
}

// ─── 响应式列数：column 对象形态按 matchMedia 断点解析 ───
// min-width 由小到大排列，取命中的最大档；全不命中回退最小已声明档
const COLUMN_BREAKPOINTS = [
  ['xs', 0],
  ['sm', 576],
  ['md', 768],
  ['lg', 992],
]

const isResponsiveColumn = computed(() => typeof props.column === 'object' && props.column !== null)

const mediaTick = ref(0)
let mediaQueries = []

const responsiveColumn = computed(() => {
  if (!isResponsiveColumn.value) return null
  mediaTick.value // 依赖断点变化信号
  const obj = props.column
  const declared = COLUMN_BREAKPOINTS.map(([key]) => key).filter((key) => obj[key] != null)
  if (!declared.length) return null
  let value = obj[declared[0]]
  for (const [key] of COLUMN_BREAKPOINTS) {
    if (obj[key] == null) continue
    const entry = mediaQueries.find((m) => m.key === key)
    if (entry?.mq.matches) value = obj[key]
  }
  return value
})

function teardownMedia() {
  for (const { mq, handler } of mediaQueries) {
    if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', handler)
    else if (typeof mq.removeListener === 'function') mq.removeListener(handler)
  }
  mediaQueries = []
}

function setupMedia() {
  teardownMedia()
  // SSR / 非浏览器环境守卫：保持最小档渲染
  if (!isResponsiveColumn.value || !inBrowser() || typeof window.matchMedia !== 'function') return
  for (const [key, width] of COLUMN_BREAKPOINTS) {
    if (props.column[key] == null) continue
    const mq = window.matchMedia(`(min-width: ${width}px)`)
    const handler = () => {
      mediaTick.value++
    }
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handler)
    else if (typeof mq.addListener === 'function') mq.addListener(handler)
    mediaQueries.push({ key, mq, handler })
  }
  mediaTick.value++ // 挂载后按真实视口重算
}

watch(
  () => props.column,
  () => {
    if (isResponsiveColumn.value) setupMedia()
    else teardownMedia()
  },
)
onMounted(setupMedia)
onBeforeUnmount(teardownMedia)

const colCount = computed(() => {
  const raw = isResponsiveColumn.value ? responsiveColumn.value : props.column
  return Math.max(1, Math.floor(Number(raw ?? 1)))
})

function isStyleObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function buildCell(item, index) {
  const p = item.props ?? {}
  const span = Math.max(1, Number(readProp(p, 'span', 'span') ?? 1))
  const width = readProp(p, 'width', 'width')
  const minWidth = readProp(p, 'minWidth', 'min-width')
  const align = readProp(p, 'align', 'align') ?? 'left'
  const labelAlign = readProp(p, 'labelAlign', 'label-align') || align
  const className = readProp(p, 'className', 'class-name') ?? ''
  const labelClassName = readProp(p, 'labelClassName', 'label-class-name') ?? ''
  // item 级样式覆盖容器级；width / minWidth 为既有 px 契约，最后合并保持优先
  const itemLabelStyle = readProp(p, 'labelStyle', 'label-style')
  const itemContentStyle = readProp(p, 'contentStyle', 'content-style')
  return {
    key: index,
    item,
    span: Math.min(span, colCount.value),
    class: className,
    labelClass: labelClassName,
    style: {
      ...(isStyleObject(props.contentStyle) ? props.contentStyle : {}),
      ...(isStyleObject(itemContentStyle) ? itemContentStyle : {}),
      ...(width ? { width: `${Number(width)}px` } : {}),
    },
    labelStyle: {
      ...(isStyleObject(props.labelStyle) ? props.labelStyle : {}),
      ...(isStyleObject(itemLabelStyle) ? itemLabelStyle : {}),
      ...(minWidth ? { minWidth: `${Number(minWidth)}px` } : {}),
    },
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
