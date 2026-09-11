<script setup>
import MemberListPage from '../../examples/ebui-example-crud-list/src/pages/MemberListPage.vue'
import memberListSource from '../../examples/ebui-example-crud-list/src/pages/MemberListPage.vue?raw'
</script>

# 标准 CRUD 列表

中后台出现频率最高的页面形态：筛选区 + 数据表格 + 行操作 + 弹窗表单 + 导入导出。此示例把各业务组件串成完整闭环 —— 筛选回第一页、翻页带条件、列设置控制可见列、新建/编辑/删除/批量删除/导入全部真实可交互（内存 mock，模拟 300ms 服务端延迟）。

<a class="bd-live-link" href="/examples/live/crud-list">在全屏示例中心打开「CRUD 列表」</a>

## 在线预览

试试：输入关键词回车查询、勾选多行批量删除、工具栏「列设置」隐藏列、「导入 / 导出」面板选文件或导出、行内「编辑」改手机号（格式非法会被表单拦截）。

<DocExample :code="memberListSource">
  <MemberListPage />
</DocExample>

## 组件构成

| 组件 | 在本场景中的角色 |
| --- | --- |
| SearchFilter | 配置式筛选表单（`fields` 数组声明关键词 / 等级 / 状态），`@search` 携带值快照 |
| DataTable | 多选、序号、双行单元格（列 `stack` 函数）、插槽列、受控分页、加载遮罩 |
| ColumnSettings | 工具栏列设置，`v-model` 为「按显示顺序的可见列 prop 数组」 |
| ImportExportPanel | 弹窗内的导入导出面板：选文件 → `import-file`，选格式 → `export`，完成后必须手动 `done()` 复位 |
| Dialog + Form + FormItem | 新建 / 编辑共用弹窗，`rules` 校验（手机号格式、必填） |
| Select + Option | 下拉选择（注意：Select 没有 `options` prop，用 `eb-option` 子组件声明选项） |
| RadioGroup / InputNumber | 账户状态单选、余额输入 |
| StatusTag + Tag | 状态列与等级标签（`statuses` 字典模块级复用） |
| Message / Popconfirm | 操作反馈与删除二次确认 |

## 关键实现说明

**筛选与分页的联动契约**。`@search` 触发时把值快照存入 `lastQuery` 并强制回第一页；`@page-change` 触发时带着 `lastQuery` 重新请求 —— 这是服务端分页列表的标准范式：

```js
function onSearch(values) {
  lastQuery = { ...values }
  page.value = 1
  load()
}
```

**列设置的最小接入**。全量列定义 `allColumns`，列设置只保存可见 prop 的有序数组，渲染时映射回完整列配置（slot / stack 函数不丢）：

```js
const visibleColumns = computed(() =>
  visibleProps.value.map((p) => allColumns.find((c) => c.prop === p)).filter(Boolean),
)
```

**导入导出的 loading 责任**。ImportExportPanel 自身不做网络请求，也不自动复位 loading —— 校验失败或请求完成后调用 `ioRef.done('import' | 'export')`，否则按钮永远转圈。

**新建与编辑共用一个弹窗**。`editing` 行引用区分模式：编辑时 `Object.assign(form, ...)` 回填并 `clearValidate()`，避免上一次校验红字残留。

## 本地运行

```bash
pnpm example:ebui-crud-list   # http://localhost:8622
```

```text
examples/ebui-example-crud-list/
  src/
    App.vue
    pages/
      MemberListPage.vue      # 本页预览的源码
      mock.js                 # 内存单例库：fetch / create / update / remove / import
```

## 接入真实业务

- 把 `mock.js` 的 `fetchMembers / createMember / ...` 换成 HTTP 请求，签名不变，页面代码零改动；
- 删除后若当前页被删空，记得 `page.value -= 1` 再刷新（示例已处理）；
- `statuses` 字典建议沉淀为业务常量模块，表格、详情、筛选下拉共用一份。
