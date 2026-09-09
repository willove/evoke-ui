# 会员管理 CRUD 列表页示例

企业中后台最典型的「标准列表管理页」基础 case：筛选表单 + 数据表格 + 列设置 + 导入导出 + 新建/编辑弹窗表单 + 批量删除，全流程可交互（内存 mock 数据，模拟服务端延迟）。

## 运行

```bash
# 在 monorepo 根目录
pnpm --filter @wil-works/ebui-example-crud-list dev
# http://localhost:8622
```

## 覆盖组件

| 组件 | 用途 |
| --- | --- |
| SearchFilter | 筛选表单（关键词 / 等级 / 状态） |
| DataTable | 数据表格（多选、序号、双行单元格、插槽列、服务端式分页） |
| ColumnSettings | 工具栏列设置（控制可见列与顺序） |
| ImportExportPanel | 批量导入 / 导出面板（手动 done() 复位 loading） |
| Dialog + Form | 新建/编辑会员弹窗表单（校验） |
| StatusTag | 会员状态列 |
| CellStack | 负责人/部门双行单元格（data-table stack 函数） |
| Message / Popconfirm | 操作反馈、删除二次确认 |
| PageHeader | 页头 |

## 业务流程

1. SearchFilter 触发 `search` → 重置到第 1 页并按条件过滤（模拟 300ms 请求延迟 + loading）。
2. DataTable 翻页 / 改每页条数 → `page-change` 重新切片。
3. 工具栏「新建会员」→ Dialog 表单校验通过后插入数据；行操作「编辑」回填表单。
4. 行操作「删除」→ Popconfirm 确认；勾选多行 → 工具栏「批量删除」。
5. 导入面板选择文件 → `import-file` 模拟解析入库 → `done('import')` 复位；导出选择格式 → `export` → `done('export')`。

## 结构

```
src/
  App.vue                  # 独立运行外壳
  pages/
    MemberListPage.vue     # 列表页（自包含，可被文档站源码级引入预览）
    mock.js                # 44 条模拟会员数据 + 状态/等级字典
```

## 与文档站的关系

`pages/MemberListPage.vue` 被 `evoke-business-ui-docs/examples/crud-list.md` 直接 import 作为在线实时预览，文档页同时展示该文件完整源码。
