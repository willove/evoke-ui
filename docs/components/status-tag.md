# StatusTag 状态标签

语义枚举到预设色的状态标签：`statuses` 声明值到文本/颜色的映射，未命中自动回退兜底色，基于 EvTag 渲染。

映射规则：

- 命中某项时，文本取该项 `label`（未配置则回退为值的字符串形式），颜色取该项 `type`（未配置则回退 `info`）；
- 未命中任何项时，显示值的字符串形式，颜色用 `fallbackType`；
- 本组件无事件与插槽，纯展示，适合在表格列插槽、详情描述插槽里直接复用同一份映射表。

## 基础用法

<DemoBlock>
  <ev-space size="middle" style="margin-bottom: 12px;">
    <ev-status-tag value="active" :statuses="[{ value: 'active', label: '启用', type: 'success' }, { value: 'disabled', label: '禁用', type: 'danger' }, { value: 'pending', label: '待审核', type: 'warning' }]" />
    <ev-status-tag value="disabled" :statuses="[{ value: 'active', label: '启用', type: 'success' }, { value: 'disabled', label: '禁用', type: 'danger' }, { value: 'pending', label: '待审核', type: 'warning' }]" />
    <ev-status-tag value="pending" :statuses="[{ value: 'active', label: '启用', type: 'success' }, { value: 'disabled', label: '禁用', type: 'danger' }, { value: 'pending', label: '待审核', type: 'warning' }]" />
    <ev-status-tag value="unknown" :statuses="[{ value: 'active', label: '启用', type: 'success' }, { value: 'disabled', label: '禁用', type: 'danger' }, { value: 'pending', label: '待审核', type: 'warning' }]" />
  </ev-space>
</DemoBlock>

<script setup>
const stStatuses = [
  { value: 'active', label: '启用', type: 'success' },
  { value: 'disabled', label: '禁用', type: 'danger' },
  { value: 'pending', label: '待审核', type: 'warning' },
  { value: 'frozen' },
]
</script>

## 命中与回退

数字值同样支持（内部转字符串比较与展示）；`frozen` 命中但未配 `label`，回退显示原始值且颜色用默认 `info`；`mystery` 未命中，走 `fallback-type` 兜底色并显示原值。

<DemoBlock>
  <ev-space size="middle" style="margin-right: 24px;">
    <ev-status-tag :value="404" :statuses="stStatuses" />
    <ev-status-tag value="frozen" :statuses="stStatuses" />
    <ev-status-tag value="active" :statuses="stStatuses" />
  </ev-space>
  <ev-space size="middle">
    <ev-status-tag value="mystery" :statuses="stStatuses" />
    <ev-status-tag value="mystery" :statuses="stStatuses" fallback-type="danger" />
  </ev-space>
</DemoBlock>

## 尺寸与显示效果

`size` 控制尺寸，`effect` 控制填充风格（light 浅底 / plain 描边 / dark 实底）。

<DemoBlock>
  <ev-space size="middle" style="margin-right: 24px;">
    <ev-status-tag value="active" :statuses="stStatuses" size="small" />
    <ev-status-tag value="active" :statuses="stStatuses" size="default" />
    <ev-status-tag value="active" :statuses="stStatuses" size="large" />
  </ev-space>
  <ev-space size="middle">
    <ev-status-tag value="active" :statuses="stStatuses" effect="light" />
    <ev-status-tag value="active" :statuses="stStatuses" effect="plain" />
    <ev-status-tag value="active" :statuses="stStatuses" effect="dark" />
  </ev-space>
</DemoBlock>

## 在表格中使用

经 DataTable 的列插槽复用同一份映射表，未命中行自动灰底兜底，无需逐行写 if/else。

<DemoBlock>
  <ev-data-table
    title="账户列表"
    :columns="[{ prop: 'name', label: '账户' }, { prop: 'status', label: '状态', slot: 'status' }]"
    :data="[{ name: 'acct-01', status: 'active' }, { name: 'acct-02', status: 'disabled' }, { name: 'acct-03', status: 'unknown' }]"
  >
    <template #status="{ row }">
      <ev-status-tag :value="row.status" :statuses="stStatuses" />
    </template>
  </ev-data-table>
</DemoBlock>

与 EvDataTable 结合时，经列插槽使用即可：`<template #status="{ row }"><ev-status-tag :value="row.status" :statuses="statuses" /></template>`。

映射匹配注意事项：

- 命中判断是严格相等（`===`），数字 `1` 与字符串 `'1'` 不互等，后端返回类型不稳定时先统一转换；
- `statuses` 通常定义为模块级常量，多处表格、详情页共享同一份映射，枚举变更只改一处；
- 组件内部不做翻译与格式化，未命中显示原值是刻意设计，便于暴露脏数据。

## API

<ApiTable title="StatusTag Props" :rows="[
  { name: 'value', desc: '当前状态值', type: 'string | number', default: '' },
  { name: 'statuses', desc: '映射表，见下方 Statuses 项', type: 'Statuses[]', default: '[]' },
  { name: 'fallbackType', desc: '未命中兜底色', type: 'primary | success | warning | info | danger | error', default: 'info' },
  { name: 'size', desc: '尺寸', type: 'small | default | large', default: 'small' },
  { name: 'effect', desc: '显示效果', type: 'light | plain | dark', default: 'light' },
]" />

<ApiTable title="Statuses 项" :rows="[
  { name: 'value', desc: '状态值（与 value 严格相等即命中）', type: 'string | number', default: '—' },
  { name: 'label', desc: '展示文本，缺省回退为值的字符串形式', type: 'string', default: '—' },
  { name: 'type', desc: '预设色', type: 'primary | success | warning | info | danger | error', default: 'info' },
]" />

本组件无事件、插槽与实例方法，纯展示。

