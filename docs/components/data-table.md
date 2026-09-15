# DataTable 数据表格

> 移动端：宽表格在触屏转译为卡片列表，参见 [移动端 · 数据展示](/mobile/data-display)。

CRUD 场景的表格封装：工具栏（标题 + 计数角标 + 操作区）、`columns` 配置式列、内置分页与加载遮罩，基于 EbTable 并透传其实例方法。

## 基础用法

<DemoBlock>
  <eb-data-table
    title="订单列表"
    :columns="[
      { prop: 'name', label: '订单名称' },
      { prop: 'owner', label: '负责人', stack: (row) => row.dept },
      { prop: 'amount', label: '金额', align: 'right' },
    ]"
    :data="[
      { name: '订单 A-1001', owner: '张三', dept: '销售部', amount: 9900 },
      { name: '订单 A-1002', owner: '李四', dept: '交付部', amount: 12800 },
    ]"
    :total="120"
  >
    <template #toolbar>
      <eb-button type="primary" size="small">新建订单</eb-button>
    </template>
  </eb-data-table>
</DemoBlock>

## 多选与操作列

`selectable` 打开多选列并 emit `selection-change`；`show-index` 打开序号列（宽度由 `index-width` 控制）。`operations` 插槽渲染操作列，作用域为 `{ row, $index, column }`，列头文案与宽度用 `operations-label / operations-width` 调整。

<DemoBlock>
  <eb-data-table
    title="批量操作"
    selectable
    show-index
    :columns="[{ prop: 'name', label: '订单名称' }, { prop: 'owner', label: '负责人' }]"
    :data="dtRows"
    @selection-change="(rows) => (dtSelection = rows)"
  >
    <template #operations="{ row }">
      <eb-button text type="primary" size="small">编辑</eb-button>
      <eb-button text type="danger" size="small">删除</eb-button>
    </template>
  </eb-data-table>
  <p style="margin-top: 8px;">已选 {{ dtSelection.length }} 行</p>
</DemoBlock>

## 插槽列与加载态

列配置 `slot: 'status'` 后由同名插槽渲染单元格（省略时默认按 `prop` 名查找插槽，作用域 `{ row, $index, column }`）；`loading` 时表格覆盖旋转遮罩，适合包裹请求过程。

<DemoBlock>
  <eb-data-table
    title="状态列"
    :loading="dtLoading"
    :columns="[
      { prop: 'name', label: '订单名称' },
      { prop: 'status', label: '状态', slot: 'status' },
      { prop: 'amount', label: '金额', align: 'right' },
    ]"
    :data="dtRows"
  >
    <template #toolbar>
      <eb-button @click="dtLoading = !dtLoading">{{ dtLoading ? '关闭加载态' : '模拟加载' }}</eb-button>
    </template>
    <template #status="{ row }">
      <eb-status-tag :value="row.status" :statuses="dtStatuses" />
    </template>
  </eb-data-table>
</DemoBlock>

## 双行单元格

列配置 `stack: (row) => 副行文本` 即可在单元格内渲染主行加粗 + 副行浅灰省略（等价于内置 EbCellStack）。

## 服务端分页

`page / pageSize` 受控 + `total` 驱动分页条；翻页时组件先 emit `update:page / update:pageSize`，再 emit `page-change`，在回调里按新页码重新拉取数据即可。

<DemoBlock>
  <eb-data-table
    title="分页"
    :columns="[{ prop: 'name', label: '订单名称' }]"
    :data="dtPageRows.slice((dtPage - 1) * dtPageSize, dtPage * dtPageSize)"
    v-model:page="dtPage"
    v-model:page-size="dtPageSize"
    :total="dtPageRows.length"
  />
  <p style="margin-top: 8px;">第 {{ dtPage }} 页，每页 {{ dtPageSize }} 条</p>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const dtRows = [
  { name: '订单 A-1001', owner: '张三', dept: '销售部', amount: 9900, status: 'paid' },
  { name: '订单 A-1002', owner: '李四', dept: '交付部', amount: 12800, status: 'pending' },
  { name: '订单 A-1003', owner: '王五', dept: '销售部', amount: 6600, status: 'closed' },
]
const dtStatuses = [
  { value: 'paid', label: '已支付', type: 'success' },
  { value: 'pending', label: '待支付', type: 'warning' },
  { value: 'closed', label: '已关闭', type: 'info' },
]
const dtSelection = ref([])
const dtLoading = ref(false)
const dtPage = ref(1)
const dtPageSize = ref(10)
const dtPageRows = Array.from({ length: 23 }, (_, i) => ({ name: '订单 B-' + (1000 + i) }))
</script>

## API

<ApiTable title="DataTable Props" :rows="[
  { name: 'data', desc: '表格数据', type: 'array', default: '[]' },
  { name: 'columns', desc: '列配置', type: 'Column[]', default: '[]' },
  { name: 'title', desc: '工具栏标题', type: 'string', default: '' },
  { name: 'showTotal', desc: '是否显示计数角标（total > 0 时）', type: 'boolean', default: 'true' },
  { name: 'loading', desc: '加载态（表格遮罩）', type: 'boolean', default: 'false' },
  { name: 'selectable', desc: '显示多选列', type: 'boolean', default: 'false' },
  { name: 'showIndex', desc: '显示序号列', type: 'boolean', default: 'false' },
  { name: 'indexWidth', desc: '序号列宽度', type: 'number | string', default: '56' },
  { name: 'operationsLabel / operationsWidth', desc: '操作列标题 / 宽度', type: 'string / number', default: '操作 / —' },
  { name: 'operationsFixed', desc: '操作列固定方向', type: 'boolean | string', default: 'right' },
  { name: 'page / pageSize', desc: '分页受控', type: 'number', default: '1 / 10' },
  { name: 'total', desc: '总条数（计数角标与分页）', type: 'number', default: '0' },
  { name: 'pageSizes', desc: '每页条数选项', type: 'number[]', default: '[10, 20, 50, 100]' },
  { name: 'paginationLayout', desc: '分页条布局项', type: 'string', default: 'total, sizes, prev, pager, next' },
  { name: 'showPagination', desc: '是否显示分页条', type: 'boolean', default: 'true' },
  { name: 'tableAttrs', desc: '透传 EbTable 其余 props（border/stripe/height 等）', type: 'object', default: '{}' },
]" />

<ApiTable title="Column" :rows="[
  { name: 'prop', desc: '字段名', type: 'string', default: '—' },
  { name: 'label', desc: '列标题', type: 'string', default: '' },
  { name: 'width / minWidth', desc: '列宽', type: 'number | string', default: '—' },
  { name: 'fixed', desc: '固定列', type: 'boolean | string', default: 'false' },
  { name: 'sortable', desc: '可排序', type: 'boolean', default: 'false' },
  { name: 'align', desc: '对齐', type: 'left | center | right', default: 'left' },
  { name: 'showOverflowTooltip', desc: '超出省略并悬浮显示完整内容', type: 'boolean', default: 'true' },
  { name: 'slot', desc: '自定义单元格插槽名（缺省用 prop 名）', type: 'string', default: '—' },
  { name: 'stack', desc: '双行单元格副行取值函数', type: '(row) => string', default: '—' },
  { name: 'editable', desc: '行内编辑：点击单元格进入编辑，Enter / 失焦提交、Esc 取消（配置 slot / stack 的列不生效）', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'toolbar', desc: '工具栏右侧操作区', type: '—', default: '—' },
  { name: 'operations', desc: '操作列内容，作用域 { row, $index, column }', type: '—', default: '—' },
  { name: 'col.slot 或 col.prop', desc: '列内容插槽，作用域 { row, $index, column }', type: '—', default: '—' },
  { name: 'empty', desc: '空数据占位内容', type: '—', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'page-change', desc: '页码或每页条数变化', type: '({ page, pageSize }) => void', default: '—' },
  { name: 'update:page / update:pageSize', desc: '分页受控更新', type: '(n: number) => void', default: '—' },
  { name: 'selection-change', desc: '多选项变化', type: '(rows) => void', default: '—' },
  { name: 'sort-change', desc: '排序变化', type: '(e) => void', default: '—' },
  { name: 'row-click', desc: '行点击', type: '(e) => void', default: '—' },
  { name: 'cell-click', desc: '单元格点击', type: '(e) => void', default: '—' },
  { name: 'cell-change', desc: '行内编辑提交（editable 列，值有变化时触发）', type: '({ row, prop, value, oldValue, $index }) => void', default: '—' },
]" />

<ApiTable title="Methods" :rows="[
  { name: 'clearSelection', desc: '清空多选', type: '() => void', default: '—' },
  { name: 'toggleRowSelection', desc: '切换行选中', type: '(row, selected?) => void', default: '—' },
  { name: 'toggleAllSelection', desc: '切换全选', type: '() => void', default: '—' },
  { name: 'sort', desc: '程序化排序', type: '(prop, order) => void', default: '—' },
  { name: 'clearSort', desc: '清空排序状态', type: '() => void', default: '—' },
  { name: 'tableRef', desc: 'EbTable 实例引用（可调用其全部方法）', type: 'Ref', default: '—' },
]" />
