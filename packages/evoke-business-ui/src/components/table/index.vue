<template>
  <div
    ref="rootRef"
    class="eb-table eb-table"
    :class="[
      sizeClass,
      {
        'eb-table--border': border,
        'eb-table--striped': stripe,
        'eb-table--enable-row-hover': true,
        'eb-table--enable-row-transition': true,
      },
    ]"
    :style="tableStyle"
  >
    <div class="eb-table__inner-wrapper">
      <!-- 列挂载区（EbTableColumn 自身渲染 null，仅触发注册） -->
      <div class="eb-table__column-slot" style="display: none">
        <slot />
      </div>
      <!-- 表头 -->
      <div class="eb-table__header-wrapper">
        <table class="eb-table__header" :style="{ width: bodyWidth }">
          <colgroup>
            <col
              v-for="col in renderColumns"
              :key="col.uid"
              :style="colStyle(col)"
            />
          </colgroup>
          <thead>
            <tr>
              <th
                v-for="(col, i) in renderColumns"
                :key="col.uid"
                class="eb-table__cell"
                :class="[headerCellClass(col), fixedClass(col)]"
                :style="fixedStyle(col, i)"
                @click="handleHeaderClick(col, $event)"
              >
                <div class="cell" :class="[`is-${col.headerAlign || col.align}`, col.labelClassName]">
                  <!-- selection 列：全选 -->
                  <template v-if="col.type === 'selection'">
                    <eb-checkbox
                      :model-value="isAllSelected"
                      :indeterminate="isIndeterminate"
                      :disabled="data.length === 0"
                      @change="toggleAllSelection"
                    />
                  </template>
                  <!-- expand 列：占位 -->
                  <template v-else-if="col.type === 'expand'" />
                  <!-- 默认 -->
                  <template v-else>
                    <vnodes
                      v-if="col.slots?.header"
                      :vnodes="renderHeader(col, i)"
                    />
                    <template v-else>{{ col.label }}</template>
                    <!-- 排序指示 -->
                    <span
                      v-if="col.sortable"
                      class="eb-table__sort-wrapper"
                      @click.stop="handleSortClick(col)"
                    >
                      <span class="sort-caret ascending" :class="{ active: sortState.prop === col.prop && sortState.order === 'ascending' }" />
                      <span class="sort-caret descending" :class="{ active: sortState.prop === col.prop && sortState.order === 'descending' }" />
                    </span>
                    <!-- 列筛选 -->
                    <span
                      v-if="col.filters && col.filters.length"
                      class="eb-table__column-filter-trigger"
                      :class="{ 'is-open': openFilterKey === col.id }"
                      @click.stop="toggleFilter(col, $event)"
                    >
                      <eb-icon name="filter" :size="12" />
                    </span>
                  </template>
                </div>
              </th>
            </tr>
          </thead>
        </table>
      </div>

      <!-- 表体 -->
      <div
        ref="bodyWrapperRef"
        class="eb-table__body-wrapper"
        :style="bodyWrapperStyle"
        @scroll="onBodyScroll"
      >
        <table class="eb-table__body" :style="{ width: bodyWidth }">
          <colgroup>
            <col
              v-for="col in renderColumns"
              :key="col.uid"
              :style="colStyle(col)"
            />
          </colgroup>
          <tbody>
            <!-- 虚拟滚动：上下占位行撑开总高，只渲染可视窗口行（含 buffer） -->
            <tr v-if="spacerTop > 0" class="eb-table__virtual-spacer" aria-hidden="true">
              <td :colspan="renderColumns.length" :style="{ height: spacerTop + 'px', padding: 0, border: 'none' }" />
            </tr>
            <template v-for="{ row, index: rowIndex } in virtualRows" :key="rowKeyOf(row, rowIndex)">
              <tr
                class="eb-table__row"
                :class="[
                  { 'eb-table__row--striped': stripe && rowIndex % 2 === 1 },
                  { 'current-row': currentRow === row },
                  { 'hover-row': hoverRowIndex === rowIndex },
                  { 'eb-table__row--level': false },
                ]"
                :data-row-index="rowIndex"
                :tabindex="keyboardRowIndex === rowIndex ? 0 : -1"
                @click="handleRowClick(row, rowIndex, $event)"
                @dblclick="emit('row-dblclick', row, rowIndex, $event)"
                @contextmenu="emit('row-contextmenu', row, rowIndex, $event)"
                @keydown="handleRowKeydown(row, rowIndex, $event)"
                @focusin="keyboardRowIndex = rowIndex"
                @mouseenter="hoverRowIndex = rowIndex"
                @mouseleave="hoverRowIndex = -1"
              >
                <td
                  v-for="(col, i) in renderColumns"
                  :key="col.uid"
                  class="eb-table__cell"
                  :class="[cellClass(col), fixedClass(col)]"
                  :style="fixedStyle(col, i)"
                  @click="emit('cell-click', row, colProp(col), row?.[colProp(col)], $event)"
                >
                  <div
                    class="cell"
                    :class="[`is-${col.align}`, col.className, { 'is-ellipsis': col.showOverflowTooltip }]"
                    :title="col.showOverflowTooltip ? textOf(col, row, rowIndex) : undefined"
                  >
                    <!-- selection -->
                    <template v-if="col.type === 'selection'">
                      <eb-checkbox
                        :model-value="isSelected(row)"
                        :disabled="col.selectable ? !col.selectable(row, rowIndex) : false"
                        @change="toggleRowSelection(row, $event, rowIndex)"
                      />
                    </template>
                    <!-- expand -->
                    <template v-else-if="col.type === 'expand'">
                      <span
                        class="eb-table__expand-icon"
                        :class="{ 'eb-table__expand-icon--expanded': expandedRows.has(row) }"
                        @click.stop="toggleRowExpansion(row)"
                      >
                        <eb-icon name="arrow-right" :size="12" />
                      </span>
                    </template>
                    <!-- index -->
                    <template v-else-if="col.type === 'index'">
                      {{ indexText(col, rowIndex) }}
                    </template>
                    <!-- 默认数据列 -->
                    <template v-else>
                      <template v-if="i === firstNormalColIndex && rowHasChildren(row)">
                        <span class="eb-table__indent" :style="indentStyle(rowLevel(row))" />
                        <span
                          class="eb-table__expand-icon"
                          :class="{ 'eb-table__expand-icon--expanded': rowExpanded(row) }"
                          @click.stop="toggleTreeExpand(row)"
                        >
                          <eb-icon name="arrow-right" :size="12" />
                        </span>
                      </template>
                      <template v-else-if="i === firstNormalColIndex && rowLevel(row) > 0">
                        <span class="eb-table__indent" :style="indentStyle(rowLevel(row) * 18 + 14)" />
                      </template>
                      <template v-if="col.editable && !col.slots?.default">
                        <input
                          v-if="isEditing(rowIndex, col)"
                          v-model="editDraft"
                          class="eb-table__edit-input"
                          @keydown.enter.stop.prevent="commitEdit(rowIndex, col)"
                          @keydown.esc.stop.prevent="cancelEdit"
                          @blur="commitEdit(rowIndex, col)"
                          @click.stop
                        />
                        <span
                          v-else
                          class="eb-table__editable-text"
                          :title="col.showOverflowTooltip ? textOf(col, row, rowIndex) : undefined"
                          @click.stop="startEdit(rowIndex, col)"
                        >{{ textOf(col, row, rowIndex) }}</span>
                      </template>
                      <template v-else>
                        <vnodes v-if="col.slots?.default" :vnodes="renderCell(col, row, rowIndex)" />
                        <template v-else>{{ textOf(col, row, rowIndex) }}</template>
                      </template>
                    </template>
                  </div>
                </td>
              </tr>
              <!-- 展开行 -->
              <tr
                v-if="hasExpandColumn && expandedRows.has(row)"
                class="eb-table__row eb-table__expanded-row"
              >
                <td class="eb-table__cell" :colspan="renderColumns.length">
                  <div class="cell">
                    <vnodes :vnodes="renderExpand(row, rowIndex)" />
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="spacerBottom > 0" class="eb-table__virtual-spacer" aria-hidden="true">
              <td :colspan="renderColumns.length" :style="{ height: spacerBottom + 'px', padding: 0, border: 'none' }" />
            </tr>
          </tbody>
        </table>
        <!-- 空态 -->
        <div v-if="displayData.length === 0" class="eb-table__empty-block">
          <span class="eb-table__empty-text">
            <slot name="empty">{{ emptyText || t('table.emptyText') }}</slot>
          </span>
        </div>
      </div>
    </div>

    <!-- 列筛选浮层（Teleport + useFloating） -->
    <Teleport to="body">
      <div
        v-if="openFilterColumn"
        ref="filterPanelRef"
        class="eb-table__filter eb-table__filter"
        :style="filterPanelStyle"
      >
        <div class="eb-table__filter-list">
          <div
            v-for="f in openFilterColumn.filters"
            :key="f.value"
            class="eb-table__filter-list-item"
            @click="toggleFilterValue(openFilterColumn, f.value)"
          >
            <eb-checkbox
              :label="f.value"
              :model-value="(filterValues[openFilterColumn.id] || []).includes(f.value)"
            >
              {{ f.text }}
            </eb-checkbox>
          </div>
        </div>
        <div class="eb-table__filter-bottom">
          <eb-button size="small" @click="resetFilter(openFilterColumn)">重置</eb-button>
          <eb-button size="small" type="primary" @click="applyFilter(openFilterColumn)">筛选</eb-button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EbTable — 表格
 * 列注册模式（EbTableColumn）；colgroup 定宽；固定列 position:sticky；
 * selection/sort/filter/expand + TableInstance 全套方法
 */
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, toRef, useSlots, watch } from 'vue'
import EbIcon from '../icon/index.vue'
import EbCheckbox from '../checkbox/index.vue'
import EbButton from '../button/index.vue'
import { useFloating } from '../../composables/useFloating'
import { provideTableContext } from './table-context'
import { useLocale } from '../../composables/useLocale'
import { useFormItem } from '../../composables/useFormItem'
import { useClickOutside } from '../../composables/useClickOutside'
import { on } from '../../utils/events'

/** 函数式渲染组件：渲染作用域插槽产出的 vnode（数组或单节点） */
const Vnodes = defineComponent({
  name: 'EbTableVnodes',
  props: { vnodes: { type: [Object, Array], default: null } },
  setup(props) {
    return () => props.vnodes
  },
})

defineOptions({ name: 'EbTable' })

const props = defineProps({
  data: { type: Array, default: () => [] },
  height: { type: [String, Number], default: undefined },
  maxHeight: { type: [String, Number], default: undefined },
  border: { type: Boolean, default: false },
  stripe: { type: Boolean, default: false },
  size: { type: String, default: '' },
  fit: { type: Boolean, default: true },
  showHeader: { type: Boolean, default: true },
  highlightCurrentRow: { type: Boolean, default: false },
  rowKey: { type: [String, Function], default: undefined },
  defaultExpandAll: { type: Boolean, default: false },
  expandRowKeys: { type: Array, default: () => [] },
  defaultSort: { type: Object, default: () => ({ prop: '', order: '' }) },
  selectOnIndeterminate: { type: Boolean, default: true },
  emptyText: { type: String, default: '' },
  treeProps: { type: Object, default: () => ({ children: 'children' }) },
  /** 表尾合计（简化：函数返回行数组） */
  summaryMethod: { type: Function, default: null },
  showSummary: { type: Boolean, default: false },
  /** 虚拟滚动：万级行只渲染可视窗口（需配合 height / maxHeight 形成滚动视口） */
  virtual: { type: Boolean, default: false },
  /** 虚拟模式行高（px），需与实际行高一致；随 size 变化时须显式对齐 */
  rowHeight: { type: Number, default: 48 },
})

const emit = defineEmits([
  'select',
  'select-all',
  'selection-change',
  'cell-click',
  'row-click',
  'row-dblclick',
  'row-contextmenu',
  'sort-change',
  'filter-change',
  'expand-change',
  'current-change',
  'header-click',
  /** 行内编辑提交：{ row, prop, value, oldValue, $index } */
  'cell-change',
])

const slots = useSlots()
const { t } = useLocale()
const { size: formSize } = useFormItem({ size: toRef(props, 'size') })

const rootRef = ref(null)
const columns = ref([])
const uidSeed = { n: 0 }

// ─── 列注册 ───
function registerColumn(col) {
  if (!columns.value.includes(col)) {
    // id 加唯一 uid（同 prop 多列场景）
    col.uid = `${col.id || 'col'}-${++uidSeed.n}`
    columns.value.push(col)
  }
}

function unregisterColumn(col) {
  columns.value = columns.value.filter((c) => c !== col)
}

provideTableContext({
  registerColumn,
  unregisterColumn,
})

const renderColumns = computed(() => columns.value)
// 树形缩进/箭头挂在第一个业务列上
const firstNormalColIndex = computed(() => {
  const special = new Set(['selection', 'expand', 'index'])
  return renderColumns.value.findIndex((c) => !special.has(c.type))
})

const hasExpandColumn = computed(() => columns.value.some((c) => c.type === 'expand'))
const hasSelectionColumn = computed(() => columns.value.some((c) => c.type === 'selection'))

// ─── 尺寸/布局 ───
const sizeClass = computed(() => {
  const s = props.size || formSize.value
  if (s === 'large') return 'eb-table--large'
  if (s === 'small') return 'eb-table--small'
  return ''
})

const tableStyle = computed(() => {
  const style = {}
  if (props.height !== undefined) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  if (props.maxHeight !== undefined) {
    style.maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
  }
  return style
})

const bodyWrapperStyle = computed(() => {
  const style = {}
  if (props.height !== undefined) {
    style.height = '100%'
    style.overflowY = 'auto'
  } else if (props.maxHeight !== undefined) {
    style.maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
    style.overflowY = 'auto'
  }
  return style
})

// 特殊功能列的默认窄宽（checkbox / 展开箭头 / 序号），用户显式 width 优先
const SPECIAL_COL_WIDTH = { selection: 48, expand: 48, index: 64 }

// 无单位数字字符串补 px（width="44" 这类写法是非法 CSS，会把列压成 0 宽）
const toCssWidth = (w) =>
  typeof w === 'number' || (typeof w === 'string' && /^\d+(\.\d+)?$/.test(w)) ? `${w}px` : w

function colStyle(col) {
  const style = {}
  if (col.width === undefined && col.minWidth === undefined && SPECIAL_COL_WIDTH[col.type]) {
    col = { ...col, width: SPECIAL_COL_WIDTH[col.type] }
  }
  if (col.width !== undefined) {
    style.width = toCssWidth(col.width)
    style.minWidth = style.width
  } else if (col.minWidth !== undefined) {
    style.minWidth = toCssWidth(col.minWidth)
    style.width = props.fit ? 'auto' : undefined
  } else {
    style.width = 'auto'
  }
  return style
}

const bodyWidth = computed(() => '100%')

const headerAlignOf = (col) => col.headerAlign || col.align
const colProp = (col) => col.prop

function headerCellClass(col) {
  return [
    `is-${headerAlignOf(col)}`,
    { 'is-sortable': col.sortable },
  ]
}

function cellClass(col) {
  return [`is-${col.align}`]
}

// ─── 固定列（sticky 偏移计算） ───
function fixedClass(col) {
  if (col.fixed === true || col.fixed === 'left') return 'eb-table-fixed-column--left'
  if (col.fixed === 'right') return 'eb-table-fixed-column--right'
  return ''
}

const stickyOffsets = computed(() => {
  const list = renderColumns.value
  const left = []
  const right = []
  let accLeft = 0
  let accRight = 0
  for (let i = 0; i < list.length; i++) {
    const col = list[i]
    if (col.fixed === true || col.fixed === 'left') {
      left[i] = accLeft
      accLeft += widthOf(col)
    }
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const col = list[i]
    if (col.fixed === 'right') {
      right[i] = accRight
      accRight += widthOf(col)
    }
  }
  return { left, right }
})

function widthOf(col) {
  if (typeof col.width === 'number') return col.width
  if (typeof col.width === 'string' && col.width.endsWith('px')) return Number.parseFloat(col.width)
  return 0
}

function fixedStyle(col, index) {
  const style = {}
  if (col.fixed === true || col.fixed === 'left') {
    style.position = 'sticky'
    style.left = `${stickyOffsets.value.left[index] ?? 0}px`
    style.zIndex = 2
  } else if (col.fixed === 'right') {
    style.position = 'sticky'
    style.right = `${stickyOffsets.value.right[index] ?? 0}px`
    style.zIndex = 2
  }
  return style
}

// ─── 行 key ───
function rowKeyOf(row, index) {
  if (typeof props.rowKey === 'function') return props.rowKey(row)
  if (typeof props.rowKey === 'string' && props.rowKey) return row?.[props.rowKey]
  return index
}

// ─── 单元格渲染 ───
function textOf(col, row, rowIndex) {
  if (col.formatter) return col.formatter(row, col, row?.[col.prop], rowIndex)
  const v = row?.[col.prop]
  return v === null || v === undefined ? '' : String(v)
}

function renderCell(col, row, rowIndex) {
  return col.slots?.default?.({ row, $index: rowIndex, column: col })
}

function renderHeader(col, index) {
  return col.slots?.header?.({ column: col, $index: index })
}

const expandColumn = computed(() => columns.value.find((c) => c.type === 'expand'))

function renderExpand(row, rowIndex) {
  return expandColumn.value?.slots?.default?.({ row, $index: rowIndex })
}

function indexText(col, rowIndex) {
  if (typeof col.index === 'function') return col.index(rowIndex)
  if (typeof col.index === 'number') return col.index + rowIndex + 1
  return rowIndex + 1
}

// ─── 排序 ───
const sortState = reactive({
  prop: props.defaultSort?.prop || '',
  order: props.defaultSort?.order || '',
})

function handleSortClick(col) {
  const orders = col.sortOrders?.length ? col.sortOrders : ['ascending', 'descending', null]
  const currentIdx = sortState.prop === col.prop ? orders.indexOf(sortState.order) : -1
  const nextOrder = orders[(currentIdx + 1) % orders.length] ?? null
  applySort(col.prop, nextOrder)
}

function applySort(prop, order) {
  sortState.prop = order ? prop : ''
  sortState.order = order || ''
  const col = columns.value.find((c) => c.prop === prop)
  emit('sort-change', {
    prop,
    order: order || null,
    column: col,
  })
}

/** 实例方法：sort(prop, order) */
function sort(prop, order) {
  applySort(prop, order)
}

/** 实例方法：clearSort() */
function clearSort() {
  sortState.prop = ''
  sortState.order = ''
}

function handleHeaderClick(col, e) {
  emit('header-click', col, e)
}

const sortedData = computed(() => {
  if (!sortState.prop || !sortState.order) return props.data
  const col = columns.value.find((c) => c.prop === sortState.prop)
  const dir = sortState.order === 'ascending' ? 1 : -1
  const getVal = (row) => {
    if (col?.sortBy) {
      if (typeof col.sortBy === 'function') return col.sortBy(row)
      if (typeof col.sortBy === 'string') return row?.[col.sortBy]
      return col.sortBy.map((k) => row?.[k])
    }
    return row?.[sortState.prop]
  }
  return [...props.data].sort((a, b) => {
    if (col?.sortMethod) return col.sortMethod(a, b) * (sortState.order === 'ascending' ? 1 : -1)
    const va = getVal(a)
    const vb = getVal(b)
    if (va === vb) return 0
    if (va === undefined || va === null) return 1
    if (vb === undefined || vb === null) return -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb), 'zh-Hans-CN', { numeric: true }) * dir
  })
})

// ─── 筛选 ───
const filterValues = reactive({})
const appliedFilters = reactive({})
const openFilterKey = ref('')
const filterAnchorEl = ref(null)
const filterPanelRef = ref(null)
const openFilterColumn = computed(() =>
  openFilterKey.value ? columns.value.find((c) => c.id === openFilterKey.value) || null : null
)

const { x: filterX, y: filterY, update: updateFilterPos } = useFloating({
  reference: filterAnchorEl,
  floating: filterPanelRef,
  placement: 'bottom-start',
  offset: 4,
  autoUpdate: false,
})

const filterPanelStyle = computed(() => ({
  position: 'fixed',
  left: `${filterX.value}px`,
  top: `${filterY.value}px`,
  zIndex: 2100,
}))

/** 打开/关闭筛选面板（以触发元素为锚点） */
async function toggleFilter(col, e) {
  if (openFilterKey.value === col.id) {
    closeFilterPanel()
    return
  }
  filterAnchorEl.value = e?.currentTarget || null
  openFilterKey.value = col.id
  await nextTick()
  await updateFilterPos()
}

function toggleFilterValue(col, value) {
  const list = filterValues[col.id] ? [...filterValues[col.id]] : []
  if (col.filterMultiple === false) {
    filterValues[col.id] = [value]
    return
  }
  const idx = list.indexOf(value)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(value)
  }
  filterValues[col.id] = list
}

function applyFilter(col) {
  appliedFilters[col.id] = [...(filterValues[col.id] || [])]
  closeFilterPanel()
  emitFilterChange()
}

function resetFilter(col) {
  filterValues[col.id] = []
  appliedFilters[col.id] = []
  closeFilterPanel()
  emitFilterChange()
}

function closeFilterPanel() {
  openFilterKey.value = ''
  filterAnchorEl.value = null
}

// 点击锚点/面板之外关闭（面板内勾选不受影响）；面板打开期间 Esc 关闭
const { stop: stopFilterClickOutside } = useClickOutside(
  [filterAnchorEl, filterPanelRef],
  () => closeFilterPanel(),
  true
)
onBeforeUnmount(stopFilterClickOutside)

let offFilterKeydown = null
watch(openFilterKey, (key) => {
  if (key && !offFilterKeydown) {
    offFilterKeydown = on(document, 'keydown', (e) => {
      if (e.key === 'Escape') closeFilterPanel()
    })
  } else if (!key && offFilterKeydown) {
    offFilterKeydown()
    offFilterKeydown = null
  }
})
onBeforeUnmount(() => {
  offFilterKeydown?.()
  offFilterKeydown = null
})

function emitFilterChange() {
  const active = {}
  for (const [key, values] of Object.entries(appliedFilters)) {
    if (values?.length) active[key] = values
  }
  emit('filter-change', active)
}

const filteredData = computed(() => {
  let list = sortedData.value
  for (const col of columns.value) {
    const values = appliedFilters[col.id]
    if (!values?.length || !col.filterMethod) continue
    list = list.filter((row) => values.some((v) => col.filterMethod(v, row, col)))
  }
  return list
})

/** 实例方法：clearFilter(columnKey?) */
function clearFilter(columnKeys) {
  const keys = columnKeys === undefined ? Object.keys(appliedFilters) : [].concat(columnKeys)
  keys.forEach((k) => {
    const col = columns.value.find((c) => c.id === k || c.columnKey === k || c.prop === k)
    const id = col ? col.id : k
    filterValues[id] = []
    appliedFilters[id] = []
  })
  emitFilterChange()
}

// ─── 展开行 ───
const expandedRows = ref(new Set())

function initExpanded() {
  const set = new Set()
  if (props.defaultExpandAll) {
    props.data.forEach((row) => set.add(row))
  } else if (props.expandRowKeys?.length && props.rowKey) {
    props.data.forEach((row) => {
      const key = rowKeyOf(row)
      if (props.expandRowKeys.includes(key)) set.add(row)
    })
  }
  expandedRows.value = set
}
initExpanded()

function toggleRowExpansion(row, expanded) {
  const set = new Set(expandedRows.value)
  const next = expanded === undefined ? !set.has(row) : expanded
  if (next) {
    set.add(row)
  } else {
    set.delete(row)
  }
  expandedRows.value = set
  emit('expand-change', row, [...set].filter((r) => r === row).length > 0 ? [...set] : set)
}

// ─── 多选 ───
const selection = ref([])
const hoverRowIndex = ref(-1)

function isSelected(row) {
  return selection.value.includes(row)
}

function toggleRowSelection(row, selected, rowIndex) {
  const selectableCol = columns.value.find((c) => c.type === 'selection')
  if (selectableCol?.selectable && !selectableCol.selectable(row, rowIndex)) return
  const next = selected === undefined || typeof selected === 'object' ? !isSelected(row) : selected
  if (next && !selection.value.includes(row)) {
    selection.value = [...selection.value, row]
  } else if (!next) {
    selection.value = selection.value.filter((r) => r !== row)
  }
  emit('select', selection.value, row)
  emit('selection-change', selection.value)
}

const isAllSelected = computed(() => {
  if (!displayData.value.length) return false
  return displayData.value.every((row, i) => {
    const col = columns.value.find((c) => c.type === 'selection')
    if (col?.selectable && !col.selectable(row, i)) return true
    return selection.value.includes(row)
  })
})

const isIndeterminate = computed(() => {
  if (!displayData.value.length) return false
  const selectableRows = displayData.value.filter((row, i) => {
    const col = columns.value.find((c) => c.type === 'selection')
    return !col?.selectable || col.selectable(row, i)
  })
  const selectedCount = selectableRows.filter((row) => selection.value.includes(row)).length
  return selectedCount > 0 && selectedCount < selectableRows.length
})

function toggleAllSelection() {
  if (isAllSelected.value) {
    // 取消全部
    const dataRows = new Set(displayData.value)
    selection.value = selection.value.filter((r) => !dataRows.has(r))
  } else {
    // 选中全部可选行
    const set = new Set(selection.value)
    displayData.value.forEach((row, i) => {
      const col = columns.value.find((c) => c.type === 'selection')
      if (!col?.selectable || col.selectable(row, i)) set.add(row)
    })
    selection.value = [...set]
  }
  emit('select-all', selection.value)
  emit('selection-change', selection.value)
}

function clearSelection() {
  selection.value = []
  emit('selection-change', selection.value)
}

// ─── 当前行 ───
const currentRow = ref(null)

function handleRowClick(row, index, e) {
  if (props.highlightCurrentRow) {
    const prev = currentRow.value
    currentRow.value = row
    if (prev !== row) emit('current-change', row, prev)
  }
  emit('row-click', row, index, e)
}

/** 实例方法：setCurrentRow(row) */
function setCurrentRow(row) {
  const prev = currentRow.value
  currentRow.value = row
  if (prev !== row) emit('current-change', row, prev)
}

// ─── 最终渲染数据 ───
// ─── 树形数据：children 字段扁平化渲染（level 缩进 + 展开箭头） ───
const treeChildrenField = computed(() => props.treeProps?.children ?? 'children')
const expandedTreeKeys = ref(new Set())
const treeLevelMap = ref(new Map())
const treeNodeKeyMap = ref(new Map())
let treeInitDone = false

const displayData = computed(() => {
  const field = treeChildrenField.value
  const list = filteredData.value
  const hasTree = list.some((r) => Array.isArray(r?.[field]) && r[field].length > 0)
  if (!hasTree) {
    treeLevelMap.value = new Map()
    return list
  }

  const levels = new Map()
  const nodeKeys = new Map()
  const out = []
  const expandInit = props.defaultExpandAll && !treeInitDone
  const walk = (rows, base, level) => rows.forEach((r, i) => {
    const key = `${base}${i}`
    nodeKeys.set(r, key)
    levels.set(r, level)
    out.push(r)
    const kids = Array.isArray(r?.[field]) ? r[field] : []
    if (kids.length) {
      if (expandInit && !expandedTreeKeys.value.has(key)) expandedTreeKeys.value.add(key)
      if (expandedTreeKeys.value.has(key)) walk(kids, `${key}-`, level + 1)
    }
  })
  walk(list, '', 0)
  treeLevelMap.value = levels
  treeNodeKeyMap.value = nodeKeys
  treeInitDone = true
  return out
})

// ─── 行级键盘导航：roving tabindex，↑↓/Home/End 移动焦点，Enter/Space 等价点击 ───
// （置于 displayData 声明之后：watch source 立即求值，不能落在其 TDZ 前）
const keyboardRowIndex = ref(0)

watch(
  () => displayData.value.length,
  (n) => {
    if (keyboardRowIndex.value > n - 1) keyboardRowIndex.value = 0
  }
)

function focusRowByIndex(index) {
  keyboardRowIndex.value = index
  // 虚拟模式：目标行可能不在窗口内，先把滚动位置对齐到目标行
  if (props.virtual && bodyWrapperRef.value) {
    const el = bodyWrapperRef.value
    const top = index * props.rowHeight
    const viewH = el.clientHeight || bodyViewportH.value
    if (viewH > 0) {
      if (top < el.scrollTop) el.scrollTop = top
      else if (top + props.rowHeight > el.scrollTop + viewH) el.scrollTop = top + props.rowHeight - viewH
    }
  }
  nextTick(() => {
    rootRef.value?.querySelector(`tr[data-row-index="${index}"]`)?.focus?.()
  })
}

function handleRowKeydown(row, index, e) {
  const total = displayData.value.length
  let target = null
  if (e.key === 'ArrowDown') target = Math.min(index + 1, total - 1)
  else if (e.key === 'ArrowUp') target = Math.max(index - 1, 0)
  else if (e.key === 'Home') target = total ? 0 : null
  else if (e.key === 'End') target = total ? total - 1 : null
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleRowClick(row, index, e)
    return
  } else {
    return
  }
  if (target === null || target === index) return
  e.preventDefault()
  focusRowByIndex(target)
}

const treeKeyOf = (row) => treeNodeKeyMap.value.get(row)
const rowLevel = (row) => treeLevelMap.value.get(row) ?? 0
const rowHasChildren = (row) => {
  const kids = row?.[treeChildrenField.value]
  return Array.isArray(kids) && kids.length > 0
}
const rowExpanded = (row) => expandedTreeKeys.value.has(treeKeyOf(row))
function toggleTreeExpand(row) {
  const key = treeKeyOf(row)
  const set = new Set(expandedTreeKeys.value)
  const willExpand = !set.has(key)
  set.has(key) ? set.delete(key) : set.add(key)
  expandedTreeKeys.value = set
  emit('expand-change', row, willExpand)
}
const indentStyle = (level) => ({ width: `${level * 18}px`, display: 'inline-block' })

// ─── 虚拟滚动（占位行方案：单一 table 结构 / colgroup / sticky 列全保留） ───
const bodyWrapperRef = ref(null)
const bodyScrollTop = ref(0)
const bodyViewportH = ref(0)

const VIRTUAL_BUFFER = 5

const virtualRange = computed(() => {
  const total = displayData.value.length
  if (!props.virtual || !bodyViewportH.value) return { start: 0, end: total - 1 }
  let start = Math.floor(bodyScrollTop.value / props.rowHeight) - VIRTUAL_BUFFER
  start = Math.max(0, start)
  const visible = Math.ceil(bodyViewportH.value / props.rowHeight)
  let end = start + visible + VIRTUAL_BUFFER * 2
  if (end > total - 1) end = total - 1
  return { start, end }
})

const virtualRows = computed(() => {
  const list = displayData.value
  if (!props.virtual) return list.map((row, index) => ({ row, index }))
  const { start, end } = virtualRange.value
  const out = []
  for (let i = start; i <= end; i++) out.push({ row: list[i], index: i })
  return out
})

const spacerTop = computed(() =>
  props.virtual ? virtualRange.value.start * props.rowHeight : 0
)

const spacerBottom = computed(() => {
  if (!props.virtual) return 0
  return Math.max(0, (displayData.value.length - 1 - virtualRange.value.end) * props.rowHeight)
})

function measureViewport() {
  const el = bodyWrapperRef.value
  if (el) bodyViewportH.value = el.clientHeight
}

const RO = typeof ResizeObserver !== 'undefined' ? ResizeObserver : null
let bodyRo = null

onMounted(() => {
  measureViewport()
  if (props.virtual && props.height === undefined && props.maxHeight === undefined) {
    console.warn('[EbTable] virtual 需要设置 height 或 maxHeight 才能形成滚动视口')
  }
  if (RO && bodyWrapperRef.value) {
    bodyRo = new RO(() => measureViewport())
    bodyRo.observe(bodyWrapperRef.value)
  }
})

onBeforeUnmount(() => {
  bodyRo?.disconnect()
  bodyRo = null
})

watch(
  () => [props.height, props.maxHeight, props.virtual],
  () => nextTick(measureViewport)
)

// ─── 行内编辑 ───
/** 当前编辑单元格 { index, prop }；同一时刻至多一个 */
const editingCell = ref(null)
const editDraft = ref('')

const isEditing = (index, col) =>
  editingCell.value?.index === index && editingCell.value?.prop === col.prop

function startEdit(index, col) {
  if (editingCell.value) commitEdit(editingCell.value.index, { prop: editingCell.value.prop })
  const row = displayData.value[index]
  editingCell.value = { index, prop: col.prop }
  editDraft.value = row?.[col.prop] ?? ''
  nextTick(() => {
    rootRef.value?.querySelector('.eb-table__edit-input')?.focus?.()
  })
}

function commitEdit(index, col) {
  if (!editingCell.value) return
  const row = displayData.value[index]
  const prop = col.prop
  const oldValue = row?.[prop]
  const value = editDraft.value
  editingCell.value = null
  editDraft.value = ''
  if (row == null || String(oldValue ?? '') === String(value)) return
  row[prop] = value
  emit('cell-change', { row, prop, value, oldValue, $index: index })
}

function cancelEdit() {
  editingCell.value = null
  editDraft.value = ''
}

// ─── 滚动同步 ───
function onBodyScroll(e) {
  bodyScrollTop.value = e.target.scrollTop
  // 无布局环境（SSR/测试）首次滚动时补测视口高度
  measureViewport()
}

/** 实例方法：doLayout()（sticky 布局自适应，保留 API 兼容） */
function doLayout() {
  return nextTick()
}

defineExpose({
  sort,
  clearSort,
  toggleRowSelection,
  toggleAllSelection,
  clearSelection,
  clearFilter,
  doLayout,
  toggleRowExpansion,
  setCurrentRow,
  /** 扩展：当前选中 */
  getSelection: () => selection.value,
  ref: rootRef,
})
</script>

<style src="./style.css"></style>
