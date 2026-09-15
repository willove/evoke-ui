<template>
  <div ref="rootRef" class="eb-data-table" :class="{ 'is-fit': fit }">
    <!-- 工具栏：标题 + 计数角标 + 右侧操作 -->
    <div v-if="title || $slots.actions || total > 0" class="eb-data-table__toolbar">
      <div class="eb-data-table__toolbar-left">
        <span v-if="title" class="eb-data-table__title">{{ title }}</span>
        <span v-if="showTotal && total > 0" class="eb-data-table__total-badge">
          共 <strong>{{ total }}</strong> 条
        </span>
      </div>
      <div class="eb-data-table__toolbar-right">
        <slot name="toolbar" />
      </div>
    </div>

    <!-- 表格 -->
    <div ref="tableWrapperRef" class="eb-data-table__table-wrapper" :class="{ 'is-loading': loading }">
      <eb-table
        ref="tableRef"
        v-bind="tableAttrs"
        :data="data"
        :height="fitHeight || undefined"
        @selection-change="emit('selection-change', $event)"
        @sort-change="emit('sort-change', $event)"
        @row-click="emit('row-click', $event)"
        @cell-click="emit('cell-click', $event)"
        @cell-change="emit('cell-change', $event)"
      >
        <eb-table-column v-if="selectable" type="selection" :width="44" />
        <eb-table-column v-if="showIndex" type="index" label="#" :width="indexWidth" />
        <eb-table-column
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
          :editable="col.editable"
        >
          <!-- 仅在有自定义单元格需求时挂 default 插槽；否则 editable 列走表格内建编辑 -->
          <template v-if="col.slot || col.stack || $slots[col.prop]" #default="scope">
            <slot :name="col.slot || col.prop" v-bind="scope">
              <eb-cell-stack v-if="col.stack" :main="scope.row[col.prop]" :sub="col.stack(scope.row)" />
              <template v-else>{{ scope.row[col.prop] }}</template>
            </slot>
          </template>
        </eb-table-column>
        <!-- 操作列 -->
        <eb-table-column v-if="$slots.operations" :label="operationsLabel" :width="operationsWidth" :fixed="operationsFixed">
          <template #default="scope">
            <slot name="operations" v-bind="scope" />
          </template>
        </eb-table-column>
        <template v-if="$slots.empty" #empty><slot name="empty" /></template>
      </eb-table>
      <div v-if="loading" class="eb-data-table__loading-mask" aria-label="加载中">
        <eb-spin size="default" />
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination" class="eb-data-table__pagination">
      <eb-pagination
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
 * EbDataTable — CRUD 表格封装（业务封装）
 * toolbar（标题 + 计数角标 + actions 插槽）+ EbTable（columns 配置式）+ 内置分页；
 * columns = [{ prop, label, width?, minWidth?, fixed?, sortable?, align?, slot?, stack?(row)=>副行, editable? }]；
 * 分页受控：page/pageSize props + update:page/update:pageSize/page-change 事件；
 * expose 透传 EbTable 实例方法（clearSelection/toggleRowSelection 等）
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EbButton from '../button/index.vue'
import EbCellStack from '../cell-stack/index.vue'
import EbIcon from '../icon/index.vue'
import EbPagination from '../pagination/index.vue'
import EbSpin from '../spin/index.vue'
import EbTable from '../table/index.vue'
import EbTableColumn from '../table/column.vue'

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
  /**
   * 高度自适应：根节点撑满 flex 父容器的剩余空间，ResizeObserver 实测
   * 表格区高度后写入 EbTable 的 height（多出内部滚动，不整页滚）；
   * 需要父链为 flex column 或有确定高度；与 tableAttrs.height 同时传入时 fit 优先
   */
  fit: { type: Boolean, default: false },
  // 透传 EbTable 的其余 attrs（border/stripe/height 等）
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
  'cell-change',
])

const tableRef = ref(null)
const rootRef = ref(null)
const tableWrapperRef = ref(null)
/** fit 实测的表格区高度（px）；环境无 ResizeObserver 时保持 0（降级为不锁定高度） */
const fitHeight = ref(0)

let resizeObserver = null

function measureFit() {
  fitHeight.value = Math.round(tableWrapperRef.value?.getBoundingClientRect?.().height || 0)
}

onMounted(() => {
  if (!props.fit) return
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => measureFit())
    resizeObserver.observe(tableWrapperRef.value)
  } else {
    // jsdom 等环境：一次性静态量高（通常为 0，等效降级）
    measureFit()
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

// fit 开关切换时补挂/卸观察
watch(
  () => props.fit,
  (on) => {
    if (!on) {
      resizeObserver?.disconnect()
      resizeObserver = null
      fitHeight.value = 0
      return
    }
    if (rootRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver?.disconnect()
      resizeObserver = new ResizeObserver(() => measureFit())
      resizeObserver.observe(tableWrapperRef.value)
    }
  },
)

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
