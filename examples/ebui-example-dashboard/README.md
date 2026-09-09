# 运营工作台 Dashboard 示例

企业中后台「工作台 + 多业务模块」场景的基础 case：完整后台骨架（侧边菜单 + 面包屑页头）内，工作台主视图承载 KPI 指标卡、趋势/占比图表、待办事项与最近订单；侧边菜单的订单管理、商品列表、分类管理、会员管理、营销中心均为真实可操作页面。

## 运行

```bash
# 在 monorepo 根目录
pnpm --filter @wil-works/ebui-example-dashboard dev
# http://localhost:8621
```

## 覆盖组件

| 组件 | 用途 |
| --- | --- |
| AppLayout / Header / Aside / Main | 后台整体骨架 |
| Menu | 侧边导航（含子菜单、折叠、子项图标） |
| Breadcrumb | 面包屑 |
| PageHeader | 页头（标题 + 操作区） |
| StatCard | KPI 指标卡（数值 + 环比趋势） |
| Chart（EvChart） | 折线趋势图 / 环形占比图 |
| DataTable + StatusTag | 最新订单、商品列表、营销活动 |
| Tree | 分类管理左树导航（选中高亮、搜索过滤、数量徽标） |
| SearchFilter + Pagination | 订单筛选与分页 |
| Form / Dialog / Switch / Progress / Popconfirm | 商品新建校验、上架开关、活动进度、危险操作确认 |
| Card / SectionCard / Tag / Badge / Tabs | 内容分块与版面组织 |

## 业务模块

| 菜单 | 模块 | 交互 |
| --- | --- | --- |
| 运营工作台 | 主视图 | KPI 刷新、图表 tooltip、待办红点 |
| 订单管理 | `modules/OrderListPage.vue` | 条件筛选、分页、详情弹窗、待付款订单取消 |
| 商品列表 | `modules/GoodsListPage.vue` | 新建商品（表单校验）、上架/下架开关、低库存预警、删除确认 |
| 分类管理 | `modules/CategoryPage.vue` | 左树右详情 master-detail：树搜索过滤、路径面包屑、子树商品聚合、新增子分类/编辑/停用 |
| 会员管理 | 复用 `ebui-example-crud-list` 的 MemberListPage（跨工程源码级引用） | 完整 CRUD |
| 营销中心 | `modules/MarketingPage.vue` | 活动目标进度、提前结束 |

## 结构

```
src/
  App.vue            # 独立运行外壳（标题栏 + 暗色切换）
  pages/
    DashboardConsole.vue   # 控制台页面（自包含，可被文档站源码级引入预览）
    mock.js                # 模拟数据（reactive，模块内操作可驱动视图）
    modules/               # 订单 / 商品 / 分类 / 营销四个模块页
```

## 与文档站的关系

`pages/DashboardConsole.vue` 被 `evoke-business-ui-docs/examples/dashboard.md` 直接 import 作为在线实时预览，文档页同时展示该文件完整源码。修改本文件后文档站 dev 模式下即时生效。
