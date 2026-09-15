# TablePage 表格页

CRUD 列表页的整页封装：页头（标题 / 描述 / 动作）、查询区、工具栏、表格 + 分页四区一体，内部由 `request` 数据代理驱动——翻页、查询、重置、远程排序与筛选全自动联动，开箱即得「撑满剩余空间、表格内部滚动」的中后台页面骨架。

## 基础用法

传 `request`（返回 `{ list, total }`）+ `fields`（查询字段）+ `columns` 即可成一个完整列表页：查询区自带查询 / 重置按钮（回车触发），翻页自动携带 `page / pageSize` 重查，筛选条件合并进请求参数并回第 1 页。

<DemoBlock>
  <eb-table-page
    title="订单列表"
    description="全部销售订单"
    :request="tpRequest"
    :fields="[
      { prop: 'keyword', label: '订单名称', placeholder: '名称关键字' },
      { prop: 'dept', label: '部门', type: 'select', options: [
        { label: '销售部', value: '销售部' },
        { label: '交付部', value: '交付部' },
      ] },
    ]"
    :columns="[
      { prop: 'name', label: '订单名称' },
      { prop: 'owner', label: '负责人', stack: (row) => row.dept },
      { prop: 'amount', label: '金额', align: 'right' },
    ]"
  >
    <template #toolbar>
      <eb-button type="primary">新建订单</eb-button>
    </template>
    <template #operations>
      <eb-button text type="primary" size="small">编辑</eb-button>
    </template>
  </eb-table-page>
</DemoBlock>

## 远程排序与筛选

`remote-sort`（默认开）把列排序写入请求参数（`sort-prop-key / sort-order-key`，默认 `sortProp / sortOrder`，值为 `asc / desc`），以当前页重查；`remote-filter` 把列筛选收敛为 `filters` 参数并回第 1 页。关闭时回落表格内建的客户端排序与过滤。

<DemoBlock>
  <eb-table-page
    title="人员名单"
    :request="tpSortRequest"
    :fields="tpSortFields"
    :columns="[
      { prop: 'name', label: '姓名' },
      { prop: 'age', label: '年龄', sortable: true },
      { prop: 'dept', label: '部门', sortable: true, filters: [
        { text: '销售部', value: '销售部' },
        { text: '交付部', value: '交付部' },
      ] },
    ]"
    remote-filter
    filter-param-key="depts"
    @sort-change="(e) => (tpLastQuery = { ...tpLastQuery, sort: e.prop + ' ' + (e.order || '无') })"
  />
  <p style="margin-top: 8px;">最近一次排序：{{ tpLastQuery.sort || '未排序' }}（筛选以 depts 参数提交）</p>
</DemoBlock>

## 撑满剩余空间

`fit` 默认开：整页撑满 flex 父容器的剩余高度，表格区自动量高、内部滚动，工具栏与分页常驻可视区——列表再长也不整页滚。父链保持 flex column 或给定确定高度即可。

<DemoBlock>
  <div style="height: 440px; display: flex;">
    <eb-table-page
      title="运行日志"
      description="fit 模式：表格内部滚动，工具栏与分页不随页面滚走"
      :request="tpFitRequest"
      :columns="[{ prop: 'time', label: '时间' }, { prop: 'level', label: '级别', width: 90 }, { prop: 'message', label: '内容' }]"
    />
  </div>
</DemoBlock>

`EbDataTable` 也单独提供 `fit`：给已有页面里的数据表格单独开启同样的高度自适应。

## Methods

通过模板 ref 调用；`refresh` 用于增删改后以当前参数重查，`search / reset` 与查询区按钮同一入口。

<ApiTable title="TablePage Methods" :rows="[
  { name: 'refresh', desc: '以当前参数重查', type: '() => Promise<void>', default: '—' },
  { name: 'search', desc: '合并筛选并回第 1 页重查', type: '(filters?) => Promise<void>', default: '—' },
  { name: 'reset', desc: '恢复 defaultParams 回第 1 页重查', type: '() => Promise<void>', default: '—' },
  { name: 'run', desc: '以显式参数覆盖重查', type: '(overrides?) => Promise<void>', default: '—' },
  { name: 'clearSelection / toggleRowSelection / toggleAllSelection', desc: '多选操作（透传表格）', type: '() => void', default: '—' },
  { name: 'sort / clearSort', desc: '程序化排序（透传表格）', type: '(prop, order) => void', default: '—' },
  { name: 'params / data / total / loading / selection', desc: '响应式状态读取', type: 'Reactive | Ref', default: '—' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'search', desc: '自定义查询表单，作用域 { params, search, reset, loading }（传入后 fields 查询区让位）', type: '—', default: '—' },
  { name: 'toolbar', desc: '工具栏右侧操作区，作用域 { selection, selectionCount, refresh, clearSelection }', type: '—', default: '—' },
  { name: 'operations', desc: '操作列内容，作用域 { row, $index, column }', type: '—', default: '—' },
  { name: 'header', desc: '自定义页头（替代标题 + 描述）', type: '—', default: '—' },
  { name: 'extra', desc: '页头右侧动作区', type: '—', default: '—' },
  { name: 'empty', desc: '空数据占位内容', type: '—', default: '—' },
  { name: '列插槽', desc: 'columns 里声明 slot 后由同名插槽渲染单元格，原样透传', type: '—', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'page-change', desc: '页码或每页条数变化', type: '({ page, pageSize }) => void', default: '—' },
  { name: 'sort-change', desc: '排序变化（remote-sort 下写入参数后自动重查）', type: '({ prop, order, column }) => void', default: '—' },
  { name: 'filter-change', desc: '列筛选变化', type: '(filters) => void', default: '—' },
  { name: 'selection-change', desc: '多选项变化', type: '(rows) => void', default: '—' },
  { name: 'row-click / cell-click', desc: '行 / 单元格点击', type: '(e) => void', default: '—' },
  { name: 'cell-change', desc: '行内编辑提交', type: '(e) => void', default: '—' },
]" />

<script setup>
import { ref } from 'vue'

const tpOrders = Array.from({ length: 57 }, (_, i) => ({
  name: `订单 A-${1001 + i}`,
  owner: ['张三', '李四', '王五', '赵六'][i % 4],
  dept: i % 3 === 0 ? '交付部' : '销售部',
  amount: 6600 + ((i * 137) % 9000),
}))
const tpDepts = ['销售部', '交付部']

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const tpRequest = async (params) => {
  const { page = 1, pageSize = 10, keyword, dept } = params
  let list = tpOrders
  if (keyword) list = list.filter((o) => o.name.includes(keyword))
  if (dept) list = list.filter((o) => o.dept === dept)
  await delay(250)
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

const tpSortFields = [{ prop: 'name', label: '姓名' }]
const tpStaff = Array.from({ length: 23 }, (_, i) => ({
  name: `员工 ${String(i + 1).padStart(2, '0')}`,
  age: 22 + ((i * 7) % 30),
  dept: i % 2 ? '交付部' : '销售部',
}))
const tpLastQuery = ref({})
const tpSortRequest = async (params) => {
  tpLastQuery.value = { ...tpLastQuery.value, ...params }
  let list = [...tpStaff]
  if (params.depts?.length) list = list.filter((p) => params.depts.includes(p.dept))
  if (params.sortProp && params.sortOrder) {
    const dir = params.sortOrder === 'asc' ? 1 : -1
    list.sort((a, b) => (a[params.sortProp] > b[params.sortProp] ? dir : -dir))
  }
  await delay(200)
  return { list, total: list.length }
}

const tpLogs = Array.from({ length: 80 }, (_, i) => ({
  time: `08:${String(i % 60).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
  level: i % 9 === 0 ? 'WARN' : 'INFO',
  message: `服务 #${(i % 6) + 1} 健康检查通过，延迟 ${(i % 40) + 3}ms`,
}))
const tpFitRequest = async (params) => {
  const { page = 1, pageSize = 15 } = params
  await delay(200)
  const start = (page - 1) * pageSize
  return { list: tpLogs.slice(start, start + pageSize), total: tpLogs.length }
}
</script>
