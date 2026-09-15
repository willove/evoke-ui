# Table 表格

表格组件：列由 `eb-table-column` 声明并注册到父表格（列组件自身不渲染 DOM），内置客户端排序、列筛选、多选、展开行、固定列（sticky）、当前行高亮与空态，并暴露排序、筛选、选中、展开等实例方法。

<script setup>
import { ref } from 'vue'

const treeRows = ref([
  { id: 1, name: '研发部', owner: '张三', status: '运行中', children: [
    { id: 11, name: '前端组', owner: '李四', status: '运行中' },
    { id: 12, name: '后端组', owner: '王五', status: '已暂停', children: [
      { id: 121, name: '网关服务', owner: '赵六', status: '运行中' },
    ] },
  ] },
  { id: 2, name: '市场部', owner: '钱七', status: '运行中' },
])

const rows = ref([
  { id: 1, name: '订单 A-1001', owner: '张三', city: '杭州', status: '已支付', amount: 9900, remark: '加急发货，指定顺丰快递' },
  { id: 2, name: '订单 A-1002', owner: '李四', city: '上海', status: '待支付', amount: 12800, remark: '需要开具增值税专用发票' },
  { id: 3, name: '订单 A-1003', owner: '王五', city: '深圳', status: '已支付', amount: 6600, remark: '收货地址已变更' },
])
const tableRef = ref(null)
const selected = ref([])
const lastSort = ref('amount descending')

const virtualRows = Array.from({ length: 500 }, (_, i) => ({
  id: i + 1,
  name: `资源项 ${String(i + 1).padStart(3, '0')}`,
  value: Math.round(Math.sin(i / 7) * 500) + 500,
}))
const editRows = ref([
  { name: 'SKU-A1001', stock: 62 },
  { name: 'SKU-B2022', stock: 35 },
  { name: 'SKU-C0314', stock: 12 },
])
const lastChange = ref('—')
function onCellChange({ row, prop, value, oldValue }) {
  lastChange.value = `${row.name} 的 ${prop}：${oldValue} → ${value}`
}
function onSortChange(e) { lastSort.value = e.order ? e.prop + ' ' + e.order : '未排序' }
function onSelectionChange(selection) { selected.value = selection }
</script>

## 基础用法

`data` 传入行数组，`eb-table-column` 用 `prop` 绑定字段、`label` 定义表头；`border` 与 `stripe` 开启边框和斑马纹，`sortable` 让金额列出现排序箭头（点击循环升序、降序、取消）。斑马纹加在偶数行（自第 2 行起）；组件始终开启行 hover 高亮，普通行 hover 时整行变浅灰，斑马行因底色规则声明在后、hover 仍保持斑马底色，两层不互相覆盖。数据密集的列表页推荐 `stripe` + `border` 组合，行间辨识度最高。

<DemoBlock>
<eb-table :data="rows" border stripe>
  <eb-table-column prop="name" label="名称" />
  <eb-table-column prop="owner" label="负责人" />
  <eb-table-column prop="amount" label="金额" align="right" sortable />
</eb-table>
</DemoBlock>

## 树形表格

数据行带 `children` 数组即自动启用树形渲染：首列显示展开箭头与层级缩进，点击箭头或调用行展开；`default-expand-all` 默认展开全部，`tree-props` 可自定义 children 字段名。

<DemoBlock>
  <eb-table
    :data="treeRows"
    row-key="id"
    default-expand-all
    border
  >
    <eb-table-column prop="name" label="名称" />
    <eb-table-column prop="owner" label="负责人" />
    <eb-table-column prop="status" label="状态" />
  </eb-table>
</DemoBlock>

## 插槽列自定义单元格

在列内写 `#default` 作用域插槽即可完全接管单元格（scope 含 `row`、`$index`、`column`）；`show-overflow-tooltip` 让超宽文本省略并以 title 提示全文。

<DemoBlock>
<eb-table :data="rows" border>
  <eb-table-column prop="name" label="名称" width="180">
    <template #default="{ row, $index }"><span style="font-weight: 600;">{{ $index + 1 }}. {{ row.name }}</span></template>
  </eb-table-column>
  <eb-table-column prop="status" label="状态" width="120" align="center">
    <template #default="{ row }"><span :style="{ color: row.status === '已支付' ? 'var(--eb-color-success)' : 'var(--eb-color-warning)' }">{{ row.status }}</span></template>
  </eb-table-column>
  <eb-table-column prop="remark" label="备注" width="160" show-overflow-tooltip />
</eb-table>
</DemoBlock>

## 排序与格式化

`default-sort` 指定初始排序（立即生效，非仅高亮箭头）；`sort-method` 提供自定义比较函数（返回值自动乘以排序方向），`sort-change` 返回 `{ prop, order, column }` 用于对接后端；`formatter` 把原始值格式化为展示文本。

<DemoBlock>
<eb-table :data="rows" :default-sort="{ prop: 'amount', order: 'descending' }" @sort-change="onSortChange">
  <eb-table-column prop="name" label="名称" />
  <eb-table-column prop="city" label="城市" sortable :sort-method="(a, b) => a.city.localeCompare(b.city, 'zh-Hans-CN')" />
  <eb-table-column prop="amount" label="金额" align="right" sortable :formatter="(row) => '¥' + row.amount.toLocaleString()" />
</eb-table>
<p style="margin-top: 8px;">当前排序：{{ lastSort }}</p>
</DemoBlock>

## 多选

`type="selection"` 声明多选列，表头出现全选框（含半选态）；`selectable` 可禁用指定行（本例仅已支付行可选）。选中项通过 `selection-change` 同步，也可用实例方法 `clearSelection` 清空。

<DemoBlock>
<eb-table ref="tableRef" :data="rows" border @selection-change="onSelectionChange">
  <eb-table-column type="selection" width="44" :selectable="(row) => row.status === '已支付'" />
  <eb-table-column prop="name" label="名称" />
  <eb-table-column prop="owner" label="负责人" />
</eb-table>
<p style="margin: 8px 0;">已选 {{ selected.length }} 项：{{ selected.map((r) => r.name).join('、') || '—' }}</p>
<eb-button @click="tableRef.clearSelection()">清空选择</eb-button>
</DemoBlock>

## 展开行

`type="expand"` 声明展开列，默认插槽渲染在展开的附加行中（scope 为 `{ row, $index }`）；配合 `default-expand-all` 或 `expand-row-keys`（需 rowKey）可默认展开。

<DemoBlock>
<eb-table :data="rows" border row-key="id">
  <eb-table-column type="expand">
    <template #default="{ row }"><div style="padding: 4px 12px; color: var(--eb-text-color-regular);">备注：{{ row.remark }}（下单人：{{ row.owner }}）</div></template>
  </eb-table-column>
  <eb-table-column prop="name" label="名称" />
  <eb-table-column prop="amount" label="金额" align="right" />
</eb-table>
</DemoBlock>

## 空态

数据为空时渲染空态区域，默认文案为内置国际化「暂无数据」，可用 `empty-text` 修改，或用 `#empty` 插槽整体替换（可搭配 eb-empty）。

<DemoBlock>
<eb-table :data="[]" border>
  <eb-table-column prop="name" label="名称" />
  <eb-table-column prop="owner" label="负责人" />
  <template #empty>
    <eb-empty description="没有匹配的订单" :image-size="64" />
  </template>
</eb-table>
</DemoBlock>

## 虚拟滚动

`virtual` 开启后万级行只渲染可视窗口，表头 / 列宽 / 固定列 / 多选 / 键盘导航全量保留。需配合 `height` 或 `maxHeight` 形成滚动视口；`row-height` 需与实际行高一致（受 size 与内容换行影响时显式对齐）。展开行与树形层级不参与虚拟模式。

<DemoBlock>
<div style="margin-bottom:8px;color:var(--eb-text-color-secondary);font-size:13px">500 行数据，滚动手感与全量渲染一致</div>
<eb-table :data="virtualRows" virtual :row-height="40" height="280" border>
  <eb-table-column prop="id" label="ID" width="80" />
  <eb-table-column prop="name" label="名称" />
  <eb-table-column prop="value" label="数值" width="120" />
</eb-table>
</DemoBlock>

## 行内编辑

列设置 `editable` 后，单元格点击进入编辑：Enter 或失焦提交、Esc 取消；提交时更新行数据并触发 `cell-change`（携带 row / prop / value / oldValue / $index），在其中做校验或落库。需要复杂编辑器（选择器、日期等）时用 default 插槽自行承载，插槽列不受 editable 影响。

<DemoBlock>
<div style="margin-bottom:8px;color:var(--eb-text-color-secondary);font-size:13px">点击「库存」单元格直接改数</div>
<eb-table :data="editRows" border @cell-change="onCellChange">
  <eb-table-column prop="name" label="SKU" />
  <eb-table-column prop="stock" label="库存" editable width="140" />
  <eb-table-column prop="status" label="状态" width="140">
    <template #default="{ row }">
      <eb-tag :type="row.stock > 40 ? 'success' : 'warning'" size="small">{{ row.stock > 40 ? '充足' : '偏低' }}</eb-tag>
    </template>
  </eb-table-column>
</eb-table>
<div style="margin-top:8px;color:var(--eb-text-color-secondary);font-size:13px">最近一次提交：{{ lastChange }}</div>
</DemoBlock>

## API

<ApiTable title="Table Props" :rows="[
  { name: 'data', desc: '表格数据', type: 'array', default: '[]' },
  { name: 'height', desc: '固定高度，表体区域内滚动', type: 'string | number', default: '—' },
  { name: 'maxHeight', desc: '最大高度，超出后表体滚动', type: 'string | number', default: '—' },
  { name: 'border', desc: '边框模式', type: 'boolean', default: 'false' },
  { name: 'stripe', desc: '斑马纹', type: 'boolean', default: 'false' },
  { name: 'size', desc: '尺寸，缺省继承表单上下文', type: 'large | default | small', default: '' },
  { name: 'fit', desc: '列宽自适应容器（minWidth 列参与拉伸）', type: 'boolean', default: 'true' },
  { name: 'showHeader', desc: '是否渲染表头（当前版本始终渲染表头）', type: 'boolean', default: 'true' },
  { name: 'highlightCurrentRow', desc: '点击行时高亮并触发 current-change', type: 'boolean', default: 'false' },
  { name: 'rowKey', desc: '行键，字段名或 (row) => key', type: 'string | function', default: '—' },
  { name: 'defaultExpandAll / expandRowKeys', desc: '默认展开全部 expand 行 / 指定默认展开行的 key 数组（需设置 rowKey）', type: 'boolean / array', default: 'false / []' },
  { name: 'defaultSort', desc: '初始排序 { prop, order }，order 为 ascending / descending', type: 'object', default: '{ prop: \'\', order: \'\' }' },
  { name: 'selectOnIndeterminate', desc: '预留参数（当前未参与全选逻辑）', type: 'boolean', default: 'true' },
  { name: 'emptyText', desc: '空数据文案，优先级低于 empty 插槽', type: 'string', default: '' },
  { name: 'showSummary / summaryMethod', desc: '表尾合计（当前版本暂未渲染表尾）', type: 'boolean / function', default: 'false' },
  { name: 'virtual', desc: '虚拟滚动，万级行只渲染可视窗口（需配合 height / maxHeight；展开行与树形层级不参与）', type: 'boolean', default: 'false' },
  { name: 'rowHeight', desc: '虚拟模式行高，需与实际行高一致', type: 'number', default: '48' },
]" />

<ApiTable title="Table Events" :rows="[
  { name: 'select', desc: '手动勾选某一行', type: '(selection, row) => void', default: '—' },
  { name: 'select-all', desc: '点击表头全选框', type: '(selection) => void', default: '—' },
  { name: 'selection-change', desc: '选中项变化', type: '(selection) => void', default: '—' },
  { name: 'cell-click', desc: '单元格点击', type: '(row, prop, value, event) => void', default: '—' },
  { name: 'row-click', desc: '行点击（开启 highlightCurrentRow 时同时更新当前行）', type: '(row, index, event) => void', default: '—' },
  { name: 'row-dblclick / row-contextmenu', desc: '行双击 / 行右键', type: '(row, index, event) => void', default: '—' },
  { name: 'sort-change', desc: '排序变化，order 为 ascending / descending / null', type: '({ prop, order, column }) => void', default: '—' },
  { name: 'filter-change', desc: '筛选应用或重置，参数为以列 id 为键的选中值映射', type: '(activeFilters) => void', default: '—' },
  { name: 'expand-change', desc: '展开行切换', type: '(row, expandedRows) => void', default: '—' },
  { name: 'current-change', desc: '当前行变化', type: '(currentRow, prevRow) => void', default: '—' },
  { name: 'header-click', desc: '表头单元格点击', type: '(column, event) => void', default: '—' },
  { name: 'cell-change', desc: '行内编辑提交（值有变化时触发，行数据已同步更新）', type: '({ row, prop, value, oldValue, $index }) => void', default: '—' },
]" />

<ApiTable title="Table Slots" :rows="[
  { name: 'default', desc: 'eb-table-column 列定义', type: '—', default: '—' },
  { name: 'empty', desc: '空数据区域（替换 emptyText）', type: '—', default: '—' },
]" />

<ApiTable title="Table Methods（defineExpose）" :rows="[
  { name: 'sort / clearSort', desc: '程序化排序 / 清空排序状态', type: '(prop, order) => void / () => void', default: '—' },
  { name: 'toggleRowSelection', desc: '勾选 / 取消某行，selected 缺省时取反', type: '(row, selected?) => void', default: '—' },
  { name: 'toggleAllSelection', desc: '切换全选', type: '() => void', default: '—' },
  { name: 'clearSelection / clearFilter', desc: '清空所有选中 / 清空筛选（缺省清全部，可传列 key 数组）', type: '() => void / (columnKeys?) => void', default: '—' },
  { name: 'toggleRowExpansion', desc: '展开 / 收起行，expanded 缺省时取反', type: '(row, expanded?) => void', default: '—' },
  { name: 'setCurrentRow', desc: '设置当前行（配合 highlightCurrentRow）', type: '(row) => void', default: '—' },
  { name: 'doLayout', desc: '重新布局（sticky 布局自适应，保留兼容）', type: '() => Promise', default: '—' },
  { name: 'getSelection', desc: '获取当前选中行数组', type: '() => array', default: '—' },
  { name: 'ref', desc: '根 DOM 元素', type: 'HTMLElement', default: '—' },
]" />

<ApiTable title="TableColumn Props" :rows="[
  { name: 'type', desc: '特殊列类型：selection 多选 / expand 展开 / index 序号', type: 'selection | expand | index', default: '—' },
  { name: 'prop', desc: '字段名（同时作为列 id 与筛选、排序默认依据）', type: 'string', default: '' },
  { name: 'label', desc: '列标题', type: 'string', default: '' },
  { name: 'width / minWidth', desc: '固定列宽 / 最小列宽（fit 模式下 minWidth 参与拉伸）', type: 'string | number', default: '—' },
  { name: 'fixed', desc: '固定列（position: sticky 实现）', type: 'boolean | left | right', default: 'false' },
  { name: 'sortable', desc: '开启排序（custom 仅供语义标注，行为与 true 相同）', type: 'boolean | string', default: 'false' },
  { name: 'sortMethod', desc: '自定义比较函数，返回值自动乘以排序方向', type: '(a, b) => number', default: 'null' },
  { name: 'sortBy', desc: '排序取值来源，字段名、字段数组或取值函数', type: 'string | array | (row) => any', default: '—' },
  { name: 'sortOrders', desc: '点击循环的排序序列', type: 'array', default: '[\'ascending\', \'descending\', null]' },
  { name: 'filters', desc: '列筛选项 [{ text, value }]，配置后表头出现筛选图标', type: 'array', default: '[]' },
  { name: 'filterMethod', desc: '筛选方法（必须提供才会参与过滤）', type: '(value, row, column) => boolean', default: 'null' },
  { name: 'filterMultiple', desc: '筛选项是否可多选', type: 'boolean', default: 'true' },
  { name: 'columnKey', desc: '列唯一键，同 prop 多列或 clearFilter 定位时使用', type: 'string', default: '—' },
  { name: 'align', desc: '内容对齐', type: 'left | center | right', default: 'left' },
  { name: 'headerAlign', desc: '表头对齐，缺省跟随 align', type: 'left | center | right', default: '—' },
  { name: 'showOverflowTooltip', desc: '单元格超宽省略并以 title 提示全文', type: 'boolean | object', default: 'false' },
  { name: 'formatter', desc: '展示文本格式化', type: '(row, column, value, index) => string', default: 'null' },
  { name: 'className / labelClassName', desc: '单元格 / 表头单元格类名', type: 'string', default: '' },
  { name: 'selectable', desc: 'selection 列的行可选判断，返回 false 禁用该行', type: '(row, index) => boolean', default: 'null' },
  { name: 'index', desc: 'index 列序号，数字为起始号，函数自定义', type: 'number | (index) => number', default: '—' },
  { name: 'editable', desc: '行内编辑：点击单元格进入编辑，Enter / 失焦提交、Esc 取消（default 插槽列不受影响）', type: 'boolean', default: 'false' },
]" />

<ApiTable title="TableColumn Slots" :rows="[
  { name: 'default', desc: '自定义单元格；type=expand 时为展开行内容', type: 'scope: { row, $index, column }', default: '—' },
  { name: 'header', desc: '自定义表头', type: 'scope: { column, $index }', default: '—' },
]" />
