# CellStack 双行单元格

表格单元格的双行排版：主行加粗、副行浅灰省略。多数场景可直接用 DataTable 的列 `stack` 函数；需要插槽控制时使用本组件。

使用建议：

- DataTable 列配置 `stack: (row) => row.xxx`：纯文本副行，零模板代码；
- 列插槽内手写 `<ev-cell-stack>`：副行需要拼接多字段、格式化或塞入图标等富内容时用；
- `sub` 为空且未提供 `sub` 插槽时只渲染主行单行，不会留出空行。

## 基础用法

<DemoBlock>
  <div style="width: 260px;">
    <ev-cell-stack main="订单 A-1001" sub="张三 · 2026-01-01" />
  </div>
</DemoBlock>

<script setup>
const csRows = [
  { name: '订单 A-1001', dept: '销售部', amount: 9900 },
  { name: '订单 A-1002', dept: '交付部', amount: 12800 },
]
</script>

## 在表格中使用

典型位置是 EvTable / EvDataTable 的单元格插槽内，主行放标题、副行放归属或时间等次级信息。

<DemoBlock>
  <ev-table :data="csRows">
    <ev-table-column prop="name" label="订单">
      <template #default="{ row }">
        <ev-cell-stack :main="row.name" :sub="row.dept" />
      </template>
    </ev-table-column>
    <ev-table-column prop="amount" label="金额" align="right" />
  </ev-table>
</DemoBlock>

## 插槽自定义

`main` / `sub` 两个具名插槽分别接管两行内容，作用域内可混用任意组件与格式化逻辑。

<DemoBlock>
  <div style="width: 280px;">
    <ev-cell-stack main="订单 A-1003">
      <template #sub>
        <ev-text type="info" size="small">张三 · 交付部 · 2026-03-15</ev-text>
      </template>
    </ev-cell-stack>
  </div>
</DemoBlock>

## 只渲染主行

副行为空且无插槽时自动退化为单行，适合数据可能缺失的列，不需要额外条件渲染。

<DemoBlock>
  <div style="width: 260px;">
    <ev-cell-stack main="只有主行" sub="" />
  </div>
</DemoBlock>

## 数值内容

`main / sub` 接受数字，常用于金额、数量列；格式化（千分位、货币符号）在传入前或经插槽完成。

<DemoBlock>
  <div style="width: 260px;">
    <ev-cell-stack :main="12800" sub="含税 14464" />
  </div>
</DemoBlock>

## 取舍建议

- 只有纯文本副行：优先用 DataTable 列配置 `stack: (row) => row.xxx`，零模板代码；
- 副行需要多字段拼接、图标或其他组件：在列插槽内使用本组件；
- 表格之外的双行排版（列表项、卡片标题区）同样可以复用本组件，样式即两行文本排版。

注意事项：

- 副行样式自带单行省略，过长内容会被截断，重要信息不要只放在副行；
- 组件不处理越界点击与事件冒泡，需要行内交互（如副行链接）时在插槽内自行组织；
- 不要在 `main / sub` 传入 HTML 字符串，组件按纯文本渲染；
- 与 DataTable 列 `stack` 函数渲染结果一致，两者不要同时对同一列使用，插槽优先级更高。

## API

<ApiTable title="CellStack Props" :rows="[
  { name: 'main', desc: '主行文本', type: 'string | number', default: '' },
  { name: 'sub', desc: '副行文本（空且无插槽时只渲染主行）', type: 'string | number', default: '' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'main', desc: '主行内容', type: '—', default: 'main prop' },
  { name: 'sub', desc: '副行内容', type: '—', default: 'sub prop' },
]" />

本组件无事件与实例方法，纯展示。
