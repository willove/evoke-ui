# Pagination 分页

> 移动端：页码器换为「加载更多」，参见 [移动端 · 页面导航](/mobile/navigation)。

<script setup>
import { ref } from 'vue'

const pageModel = ref({ page: 2, size: 20 })
const sizePage = ref(1)
const sizeValue = ref(10)
const jumpPage = ref(1)
const ctrlPage = ref(3)
const ctrlSize = ref(10)
const changeLog = ref('')
function onPagingChange(e) {
  changeLog.value = `current=${e.current}，pageSize=${e.pageSize}`
}
</script>

数据分页控件：`layout` 自由组合 total / sizes / prev / pager / next / jumper 六个部分，页码超长时自动折叠省略；兼容对象 v-model `{ page, size }`、数字 v-model 与 `v-model:current-page` / `v-model:page-size` 多种受控写法。

## 基础用法

v-model 绑定 `{ page, size }` 对象（也接受纯页码数字），翻页与修改每页条数都会同步回对象。

<DemoBlock>
  <ev-pagination v-model="pageModel" :total="120" />
  <p style="margin-top: 8px; font-size: 13px; color: #909399;">page: {{ pageModel.page }} / size: {{ pageModel.size }}</p>
</DemoBlock>

## 每页条数与总数

`sizes` 部分渲染条数下拉，`page-sizes` 自定义候选值，`page-size` 指定初始每页条数；`total` 驱动总条数文案与页数计算。

<DemoBlock>
  <ev-pagination v-model:current-page="sizePage" v-model:page-size="sizeValue" :page-sizes="[10, 30, 60]" layout="total, sizes, prev, pager, next" :total="480" />
</DemoBlock>

## 页码跳转

layout 加入 `jumper` 渲染「去第 X 页」输入框，回车或失焦跳转；页码超出范围自动收敛到有效页。

<DemoBlock>
  <ev-pagination v-model:current-page="jumpPage" layout="prev, pager, next, jumper" :total="60" :page-size="10" />
</DemoBlock>

## 受控页码与事件

`v-model:current-page` / `v-model:page-size` 分别受控页码与每页条数；`change` 事件统一回传 `{ current, pageSize }`，另有 `current-change` / `size-change` / `prev-click` / `next-click` 细分事件。

<DemoBlock>
  <ev-pagination v-model:current-page="ctrlPage" v-model:page-size="ctrlSize" :total="316" @change="onPagingChange" />
  <p style="margin-top: 8px; font-size: 13px; color: #909399;">最近 change：{{ changeLog || '操作分页试试' }}</p>
</DemoBlock>

## 尺寸与背景

`size` 支持 large / default / small（`small` 属性等价 size='small'）；`background` 为 false 时页码按钮去掉底色；`disabled` 整体禁用。

<DemoBlock>
  <ev-pagination size="small" :background="false" :model-value="{ page: 1, size: 10 }" :total="45" />
  <ev-pagination disabled :model-value="{ page: 1, size: 10 }" :total="45" style="margin-top: 12px;" />
</DemoBlock>

## 单页隐藏

`hide-on-single-page` 开启后，总页数不超过 1 时整个组件不渲染（下方 total 仅够一页，组件已隐藏）。

<DemoBlock>
  <ev-pagination :total="8" :page-size="20" hide-on-single-page />
</DemoBlock>

## API

<ApiTable title="Pagination Props" :rows="[
  { name: 'v-model / model-value', desc: '对象 { page, size } 或页码数字', type: 'object | number', default: 'null' },
  { name: 'current-page', desc: '当前页码，配合 v-model:current-page 受控', type: 'number', default: '—' },
  { name: 'current', desc: 'current-page 别名（v-model:current）', type: 'number', default: '—' },
  { name: 'page-size', desc: '每页条数，配合 v-model:page-size 受控', type: 'number', default: '—' },
  { name: 'total', desc: '总条数', type: 'number', default: '0' },
  { name: 'layout', desc: '组件布局，子组件名逗号分隔', type: 'string', default: 'total, sizes, prev, pager, next, jumper' },
  { name: 'page-sizes', desc: '每页条数候选值', type: 'number[]', default: '[10, 20, 50, 100]' },
  { name: 'size', desc: '尺寸', type: 'large | default | small', default: 'default' },
  { name: 'small', desc: '等价 size 为 small 的兼容写法', type: 'boolean', default: 'false' },
  { name: 'background', desc: '页码按钮显示底色', type: 'boolean', default: 'true' },
  { name: 'disabled', desc: '禁用全部交互', type: 'boolean', default: 'false' },
  { name: 'pager-count', desc: '页码按钮数（含首末，奇数，超出折叠省略）', type: 'number', default: '7' },
  { name: 'hide-on-single-page', desc: '只有一页时隐藏整体', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Pagination Events" :rows="[
  { name: 'update:model-value', desc: '页码或每页条数变化时同步 v-model', type: '(value: object | number) => void', default: '—' },
  { name: 'update:current-page / update:current', desc: '页码变化受控更新', type: '(page: number) => void', default: '—' },
  { name: 'update:page-size', desc: '每页条数变化受控更新', type: '(size: number) => void', default: '—' },
  { name: 'current-change', desc: '当前页变化', type: '(page: number) => void', default: '—' },
  { name: 'size-change', desc: '每页条数变化（自动修正越界页码）', type: '(size: number) => void', default: '—' },
  { name: 'change', desc: '页码或条数变化（统一回传）', type: '({ current, pageSize }) => void', default: '—' },
  { name: 'prev-click / next-click', desc: '点击上一页 / 下一页按钮', type: '(page: number) => void', default: '—' },
]" />

<ApiTable title="Pagination Methods" :rows="[
  { name: 'currentPage', desc: '当前页码（ref，已按总页数收敛）', type: 'ComputedRef<number>', default: '—' },
  { name: 'pageSize', desc: '当前每页条数（ref）', type: 'ComputedRef<number>', default: '—' },
]" />
