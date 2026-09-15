<template>
  <div class="eb-table-page" :class="{ 'is-fit': fit }">
    <!-- 页头区：标题 / 描述 / 右侧动作 -->
    <div v-if="title || description || $slots.header || $slots.extra" class="eb-table-page__header">
      <div class="eb-table-page__header-main">
        <slot name="header">
          <h3 class="eb-table-page__title">{{ title }}</h3>
          <p v-if="description" class="eb-table-page__description">{{ description }}</p>
        </slot>
      </div>
      <div v-if="$slots.extra" class="eb-table-page__header-extra">
        <slot name="extra" />
      </div>
    </div>

    <!-- 查询区：fields 内建 EbSearchFilter，或 search 插槽自定义表单 -->
    <eb-search-filter
      v-if="fields.length && !$slots.search"
      v-model="searchModel"
      class="eb-table-page__search"
      :fields="fields"
      :columns="searchColumns"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    />
    <div v-else-if="$slots.search" class="eb-table-page__search">
      <slot name="search" v-bind="searchContext" />
    </div>

    <!-- 表格区：EbDataTable（工具栏 + 表格 + 分页），fit 时撑满剩余空间 -->
    <eb-data-table
      ref="dataTableRef"
      class="eb-table-page__table"
      fit
      :data="data"
      :columns="columns"
      :loading="loading"
      :selectable="selectable"
      :show-index="showIndex"
      :show-total="showTotal"
      :total="total"
      :page="pagination.page"
      :page-size="pagination.pageSize"
      :page-sizes="pageSizes"
      :show-pagination="hasPagination"
      :operations-label="operationsLabel"
      :operations-width="operationsWidth"
      :operations-fixed="operationsFixed"
      :table-attrs="tableAttrs"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @filter-change="handleFilterChange"
      @row-click="(e) => emit('row-click', e)"
      @cell-click="(e) => emit('cell-click', e)"
      @cell-change="(e) => emit('cell-change', e)"
    >
      <template v-if="$slots.toolbar" #toolbar><slot name="toolbar" v-bind="toolbarContext" /></template>
      <template v-if="$slots.operations" #operations="scope"><slot name="operations" v-bind="scope" /></template>
      <template v-if="$slots.empty" #empty><slot name="empty" /></template>
      <!-- 列自定义单元格等具名插槽原样透传给 EbDataTable -->
      <template v-for="name in forwardedSlots" :key="name" #[name]="scope">
        <slot :name="name" v-bind="scope ?? {}" />
      </template>
    </eb-data-table>
  </div>
</template>

<script setup>
/**
 * EbTablePage — 数据表格页封装（业务组件）
 *
 * 页面级四区结构：页头（title/description/extra）→ 查询区（fields 内建
 * EbSearchFilter 或 search 插槽）→ 工具栏（toolbar 插槽）→ 表格 + 分页。
 *
 * 数据代理：request 交给内部 useTable（分页 + 筛选 + 请求状态 + 竞态保护）；
 * - 翻页 / 改页容量 → 自动以新分页参数重查
 * - 查询（search）→ 合并筛选并回第 1 页；重置（reset）→ 恢复 defaultParams 回第 1 页
 * - 远程排序（remote-sort）→ sort-change 写入 params[sortPropKey/sortOrderKey]
 *   （asc/desc）后以当前页重查；远程筛选（remote-filter）→ 写入 params[filterParamKey]
 *   并回第 1 页
 * - fit 默认开：整页撑满 flex 父容器剩余空间，表格内部滚动（多出内部滚，不整页滚）
 */
import { computed, ref, useSlots } from 'vue'
import EbDataTable from '../data-table/index.vue'
import EbSearchFilter from '../search-filter/index.vue'
import { useTable } from '../../composables/useTable'

defineOptions({ name: 'EbTablePage' })

const props = defineProps({
  /** 数据请求：async (params) => { list, total } | 数组；分页开启时 params 带 page/pageSize */
  request: { type: Function, required: true },
  columns: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  /** 查询字段配置（EbSearchFilter fields）；与 search 插槽二选一，插槽优先 */
  fields: { type: Array, default: () => [] },
  /** 查询区栅格列数（2~4） */
  searchColumns: { type: Number, default: 3 },
  /** 请求初始参数（reset 的恢复基准） */
  defaultParams: { type: Object, default: () => ({}) },
  /** 挂载后自动首查；SSR 场景可关掉后手动 run */
  immediate: { type: Boolean, default: true },
  /** false 关闭分页（一次性加载全量） */
  pagination: { type: Boolean, default: true },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
  /** 撑满父容器剩余空间，表格内部滚动；父链需 flex column 或有确定高度 */
  fit: { type: Boolean, default: true },
  selectable: { type: Boolean, default: false },
  showIndex: { type: Boolean, default: false },
  showTotal: { type: Boolean, default: true },
  operationsLabel: { type: String, default: '操作' },
  operationsWidth: { type: [String, Number], default: undefined },
  operationsFixed: { type: [Boolean, String], default: 'right' },
  /** 远程排序：排序变化写入 params 后以当前页重查；关闭则走表格内建客户端排序 */
  remoteSort: { type: Boolean, default: true },
  sortPropKey: { type: String, default: 'sortProp' },
  sortOrderKey: { type: String, default: 'sortOrder' },
  /** 远程筛选：列筛选变化以 filterParamKey 写入 params 并回第 1 页；关闭则客户端过滤 */
  remoteFilter: { type: Boolean, default: false },
  filterParamKey: { type: String, default: 'filters' },
  /** 透传 EbTable 的 attrs（border/stripe/virtual 等） */
  tableAttrs: { type: Object, default: () => ({}) },
  /** 数据预处理 (result, params) => { list, total } */
  transform: { type: Function, default: null },
  onSuccess: { type: Function, default: null },
  onError: { type: Function, default: null },
})

const emit = defineEmits([
  'page-change',
  'selection-change',
  'sort-change',
  'filter-change',
  'row-click',
  'cell-click',
  'cell-change',
])

const dataTableRef = ref(null)

// ─── 数据代理 ───
const {
  data,
  total,
  loading,
  params,
  pagination,
  search,
  reset,
  run,
  refresh,
  setPagination,
  hasPagination,
} = useTable((query) => props.request(query), {
  defaultParams: props.defaultParams,
  immediate: props.immediate,
  pagination: props.pagination,
  defaultPagination: { pageSize: props.pageSizes[0] },
  transform: props.transform ?? undefined,
  onSuccess: props.onSuccess ?? undefined,
  onError: props.onError ?? undefined,
})

// ─── 查询区 ───
const searchModel = ref({})

// SearchFilter reset 后会自带一次 search（searchOnReset）：本次合并抑制，
// 避免与 useTable.reset 双重请求
let resetting = false

const searchContext = {
  params,
  /** 合并筛选并回第 1 页重查 */
  search: (filters) => search(filters),
  /** 恢复 defaultParams 回第 1 页重查（不清自定义表单自身状态） */
  reset: () => reset(),
  loading,
}

function handleSearch(values) {
  if (resetting) return
  search(values ?? {})
}

function handleReset() {
  // SearchFilter reset 后会自带一次 search（searchOnReset）：本次合并抑制，
  // 避免与 useTable.reset 双重请求
  resetting = true
  dataTableRef.value?.clearSort?.()
  reset().finally(() => {
    resetting = false
  })
}

// ─── 表格联动 ───
const selection = ref([])

function handlePageChange(e) {
  // setPagination 的 pageSize 分支自带「改容量回第 1 页」语义；
  // 只传变化的字段，避免翻页时 pageSize 同传把页码冲回 1
  const patch = {}
  if (e.page !== pagination.page) patch.page = e.page
  if (e.pageSize !== pagination.pageSize) patch.pageSize = e.pageSize
  setPagination(patch)
  emit('page-change', e)
}

function handleSelectionChange(rows) {
  selection.value = rows
  emit('selection-change', rows)
}

function handleSortChange(e) {
  emit('sort-change', e)
  if (!props.remoteSort) return
  params[props.sortPropKey] = e.order ? e.prop : ''
  params[props.sortOrderKey] = e.order === 'ascending' ? 'asc' : e.order === 'descending' ? 'desc' : ''
  run()
}

function handleFilterChange(filters) {
  emit('filter-change', filters)
  if (!props.remoteFilter) return
  params[props.filterParamKey] = filters
  search()
}

// ─── 插槽上下文 ───
const toolbarContext = computed(() => ({
  selection: selection.value,
  selectionCount: selection.value.length,
  refresh,
  clearSelection: () => clearSelection(),
}))

// 列自定义单元格等具名插槽原样透传给 EbDataTable
const RESERVED_SLOTS = new Set(['header', 'extra', 'search', 'toolbar', 'operations', 'empty'])
const forwardedSlots = Object.keys(useSlots()).filter((n) => !RESERVED_SLOTS.has(n))

// ─── 实例方法 ───
function clearSelection() {
  dataTableRef.value?.clearSelection?.()
}
function toggleRowSelection(row, selected) {
  dataTableRef.value?.toggleRowSelection?.(row, selected)
}
function toggleAllSelection() {
  dataTableRef.value?.toggleAllSelection?.()
}
function clearSort() {
  dataTableRef.value?.clearSort?.()
}
function sort(prop, order) {
  dataTableRef.value?.sort?.(prop, order)
}

defineExpose({
  /** 以当前参数重查（增删改后调用） */
  refresh,
  /** 合并筛选并回第 1 页重查 */
  search: (filters) => search(filters),
  /** 恢复 defaultParams 回第 1 页重查 */
  reset: () => reset(),
  /** 以显式参数覆盖重查 */
  run,
  params,
  data,
  total,
  loading,
  pagination,
  selection,
  clearSelection,
  toggleRowSelection,
  toggleAllSelection,
  clearSort,
  sort,
})
</script>

<style src="./style.css"></style>
