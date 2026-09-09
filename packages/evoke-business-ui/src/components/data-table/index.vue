<template>
  <div class="ev-data-table">
    <!-- 工具栏：标题 + 计数角标 + 右侧操作 -->
    <div v-if="title || $slots.actions || total > 0" class="ev-data-table__toolbar">
      <div class="ev-data-table__toolbar-left">
        <span v-if="title" class="ev-data-table__title">{{ title }}</span>
        <span v-if="showTotal && total > 0" class="ev-data-table__total-badge">
          共 <strong>{{ total }}</strong> 条
        </span>
      </div>
      <div class="ev-data-table__toolbar-right">
        <slot name="toolbar" />
      </div>
    </div>

    <!-- 表格 -->
    <div class="ev-data-table__table-wrapper" :class="{ 'is-loading': loading }">
      <ev-table
        ref="tableRef"
        v-bind="tableAttrs"
        :data="data"
        @selection-change="emit('selection-change', $event)"
        @sort-change="emit('sort-change', $event)"
        @row-click="emit('row-click', $event)"
        @cell-click="emit('cell-click', $event)"
      >
        <ev-table-column v-if="selectable" type="selection" :width="44" />
        <ev-table-column v-if="showIndex" type="index" label="#" :width="indexWidth" />
        <ev-table-column
          v-for="col in columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :sortable="col.sortable"
          :align="col.align"
          :show-overflow-tooltip="col.showOverflowTooltip !== false"
        >
          <template #default="scope">
            <slot :name="col.slot || col.prop" v-bind="scope">
              <ev-cell-stack v-if="col.stack" :main="scope.row[col.prop]" :sub="col.stack(scope.row)" />
              <template v-else>{{ scope.row[col.prop] }}</template>
            </slot>
          </template>
        </ev-table-column>
        <!-- 操作列 -->
        <ev-table-column v-if="$slots.operations" :label="operationsLabel" :width="operationsWidth" :fixed="operationsFixed">
          <template #default="scope">
            <slot name="operations" v-bind="scope" />
          </template>
        </ev-table-column>
        <template v-if="$slots.empty" #empty><slot name="empty" /></template>
      </ev-table>
      <div v-if="loading" class="ev-data-table__loading-mask" aria-label="加载中">
        <ev-spin size="default" />
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination" class="ev-data-table__pagination">
      <ev-pagination
        :model-value="{ page: page, size: pageSize }"
        :total="total"
        :page-size="pageSize"
        :page-sizes="pageSizes"
        :layout="paginationLayout"
        @update:model-value="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * EvDataTable — CRUD 表格封装（业务封装）
 * toolbar（标题 + 计数角标 + actions 插槽）+ EvTable（columns 配置式）+ 内置分页；
 * columns = [{ prop, label, width?, minWidth?, fixed?, sortable?, align?, slot?, stack?(row)=>副行 }]；
 * 分页受控：page/pageSize props + update:page/update:pageSize/page-change 事件；
 * expose 透传 EvTable 实例方法（clearSelection/toggleRowSelection 等）
 */
import { ref } from 'vue'
import EvButton from '../button/index.vue'
import EvCellStack from '../cell-stack/index.vue'
import EvIcon from '../icon/index.vue'
import EvPagination from '../pagination/index.vue'
import EvSpin from '../spin/index.vue'
import EvTable from '../table/index.vue'
import EvTableColumn from '../table/column.vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  /** 显示计数角标 */
  showTotal: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  showIndex: { type: Boolean, default: false },
  indexWidth: { type: [String, Number], default: 56 },
  /** 操作列 */
  operationsLabel: { type: String, default: '操作' },
  operationsWidth: { type: [String, Number], default: undefined },
  operationsFixed: { type: [Boolean, String], default: 'right' },
  // 分页
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
  paginationLayout: { type: String, default: 'total, sizes, prev, pager, next' },
  showPagination: { type: Boolean, default: true },
  // 透传 EvTable 的其余 attrs（border/stripe/height 等）
  tableAttrs: { type: Object, default: () => ({}) },
})

const emit = defineEmits([
  'update:page',
  'update:pageSize',
  'page-change',
  'selection-change',
  'sort-change',
  'row-click',
  'cell-click',
])

const tableRef = ref(null)

function handlePageChange(val) {
  // 分页组件对象形态为 { page, size }，数字形态为页码
  const next = typeof val === 'number'
    ? { page: val, pageSize: props.pageSize }
    : { page: val.page, pageSize: val.size ?? val.pageSize ?? props.pageSize }
  if (next.page !== props.page) emit('update:page', next.page)
  if (next.pageSize !== props.pageSize) emit('update:pageSize', next.pageSize)
  emit('page-change', { page: next.page, pageSize: next.pageSize })
}

// 实例方法透传
function clearSelection() {
  tableRef.value?.clearSelection?.()
}
function toggleRowSelection(row, selected) {
  tableRef.value?.toggleRowSelection?.(row, selected)
}
function toggleAllSelection() {
  tableRef.value?.toggleAllSelection?.()
}
function clearSort() {
  tableRef.value?.clearSort?.()
}
function sort(prop, order) {
  tableRef.value?.sort?.(prop, order)
}

defineExpose({ clearSelection, toggleRowSelection, toggleAllSelection, clearSort, sort, tableRef })
</script>

<style src="./style.css"></style>
