<script setup>
import DashboardConsole from '../../examples/ebui-example-dashboard/src/pages/DashboardConsole.vue'
import dashboardSource from '../../examples/ebui-example-dashboard/src/pages/DashboardConsole.vue?raw'
</script>

# 工作台 Dashboard

企业后台的「门面页面」：完整应用骨架（侧边菜单 + 顶栏 + 面包屑）之内，除了 KPI 指标、趋势图表、最新业务明细的工作台主视图，侧边菜单的每个模块（订单管理 / 商品列表 / 分类管理 / 会员管理 / 营销中心）都是**真实可操作的页面**，不是占位图。此示例演示 AppLayout 一体化壳的接入方式，以及一套中型中后台的多模块组织。

<a class="bd-live-link" href="/examples/live/dashboard">在全屏示例中心打开「工作台」</a>

## 在线预览

预览即 `examples/ebui-example-dashboard` 工程的真实页面：侧边菜单可切换、可折叠，顶栏可切换暗色，图表 hover 有 tooltip。

<DocExample :code="dashboardSource">
  <DashboardConsole />
</DocExample>

## 组件构成

| 组件 | 在本场景中的角色 |
| --- | --- |
| AppLayout | 一体化后台壳：内置侧栏（菜单插槽 + 折叠）、顶栏（面包屑 / 主题切换 / 右侧操作）、内容区 |
| Menu / MenuItem / SubMenu | 侧边导航；示例未引入 vue-router，用 `index` 驱动视图切换 |
| PageHeader | 内容页页头（标题 + 副标题 + `#actions` 操作区） |
| StatCard | KPI 指标卡：数值千分位滚动、环比趋势、语义色图标 |
| Chart（EvChart） | 折线图（`labels + series`）与环形图（`pieData`），Canvas 自绘、容器自适应 |
| DataTable + StatusTag | 最新订单 / 商品列表 / 营销活动的表格载体（含 `operations` 插槽） |
| Tree | 分类管理的**左树右详情**布局：`highlight-current` 选中、`filter-node-method` + `filter()` 搜索过滤、默认插槽自定义节点（名称 + 数量徽标） |
| DetailDescriptions | 分类属性条与订单详情弹窗的配置式回显 |
| SearchFilter + Pagination | 订单管理模块的筛选与前端分页 |
| Form / Dialog / Switch / Progress / Popconfirm | 商品新建校验、上架开关、活动目标完成度、删除与停用确认 |
| DetailDescriptions | 订单详情弹窗的配置式回显 |
| Row / Col | 栅格排版（`:gutter` 间距 + `xs/sm/lg` 响应式断点） |
| SectionCard / Tag / Badge / Link / Avatar | 区块标题、待办标记、消息数、公告链接、顶栏头像 |

> 模块页面集中在 `pages/modules/` 下；「会员管理」未重复造轮子，直接跨工程源码级复用了 CRUD 列表示例的 `MemberListPage` —— 在线预览、全屏中心、独立工程三处看到的是同一份代码。

## 关键实现说明

**无路由的视图切换**。AppLayout 内置菜单为 router 模式，未装 vue-router 时点击只回发事件不跳转 —— 示例在 `ev-menu-item` 上直接监听原生 `click` 切换 `activeMenu`，`activeMenu` 同时回传给 `default-active` 保持高亮：

```js
function switchView(index) {
  activeMenu.value = index
}
```

**多模块内容组织**。侧边每个菜单对应一个真实模块组件（`pages/modules/` 下按模块拆分文件），`v-else-if` 按 `activeMenu` 挂载；模块自身保持自包含（自己的 mock、自己的状态），主视图与模块间零耦合。

**分类管理的 master-detail 布局**。左侧分类树（搜索过滤 + 选中高亮 + 数量徽标），右侧当前分类的路径面包屑、属性描述与子树聚合的商品表——树节点只做导航，操作全部收敛到右侧上下文区，这是企业中后台处理层级数据的经典形态：

```js
// 选中节点 → 子树聚合商品
const selectedGoods = computed(() => {
  const ids = new Set(collectIds(selected.value))
  return goods.filter((g) => ids.has(g.categoryId))
})
```

**KPI 刷新**。StatCard 的数字滚动（`countUp`）在挂载时执行，给外层 `ev-row` 绑定 `:key="refreshTick"`，点「刷新数据」时递增即可整组重播滚动动画。

**图表配置同构**。折线与饼图只差数据字段：直角系用 `labels + series`，饼系用 `pieData: [{ name, value }]`，其余能力（图例、tooltip、标题）全部收敛在 `options` 单对象里。

## 本地运行

```bash
pnpm example:ebui-dashboard   # http://localhost:8621
```

```text
examples/ebui-example-dashboard/
  src/
    App.vue                   # 独立运行外壳（标题栏 + useDarkMode 暗色切换）
    pages/
      DashboardConsole.vue    # 本页预览的源码（骨架 + 工作台主视图）
      mock.js                 # KPI / 趋势 / 渠道 / 订单 / 待办 / 公告 / 各模块数据
      modules/
        OrderListPage.vue     # 订单管理（筛选 + 分页 + 详情弹窗 + 取消订单）
        GoodsListPage.vue     # 商品列表（新建校验 + 上架开关 + 低库存预警 + 删除）
        CategoryPage.vue      # 分类管理（树形表格 + 新增子分类 / 编辑 / 停用）
        MarketingPage.vue     # 营销中心（活动进度 + 提前结束）
```

## 接入真实业务

- 把 `mock.js` 的各数据源换成接口返回；`ev-chart` 的 `options` 是响应式的，数据到达后自动重绘（同结构数据走补间动画）。
- 菜单接 vue-router 时无需改动：AppLayout 内部菜单自带 router 集成，`index` 即路由路径。
