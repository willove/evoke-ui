---
layout: home

hero:
  name: Evoke Tools UI
  text: 产品级 GUI 框架
  tagline: 工具区 / 停靠 / 外壳件 + 运行时契约。让一个人长时间在软件里干活。
  actions:
    - theme: brand
      text: 设计规范（--et-*）
      link: /guide/design
---

<p class="td-hero__badge">v1.0.0</p>

# 这是什么

`@wil-works/evoke-tools-ui` 是 evoke-ui 体系里的**产品级 GUI 框架**（命名空间 `--et-*`）。
服务对象：要把界面做成**一个软件**的产品——文档/画布居中，工具退到边缘，
chrome（标题栏 / 工具区 / 状态栏）环绕内容，常驻布局、键盘优先、命令驱动。

三个既有库都填不上这个洞：business-ui 解决"把数据陈列清楚"（页面），
evoke-ui 解决"叙事与转化"（官网），evoke-charts 解决"数据可视化"。
tools-ui 只做**business-ui 语境下不存在的东西**，外加组件库给不了的两件：
**布局运行时**与**数据契约**（计划见 `plans/tools-ui/`）。

## 四库分工

| 库 | 界面隐喻 | 谁占中心 | 密度 |
| --- | --- | --- | --- |
| `--eb-*` business-ui | 页面 | 数据表格与筛选器 | 常规 |
| `--ew-*` evoke-ui | 叙事 | 内容与品牌 | 透气 |
| `--ec-*` evoke-charts | 图表 | 数据图形 | —— |
| **`--et-*` tools-ui** | **工作台** | **文档/画布** | **三档（紧凑/默认/宽松）** |

## 当前状态（v1.0.0）

M0 交付：`--et-*` 令牌（三档密度 + chrome 度量与预算）、G1/G2/G4/G5/G7 五道门、
图标解析与兜底机制、12 个 L1 原子件。

M1 交付（0.2.0）：命令运行时（注册表 / 状态推演 / 可达面核对）、菜单 schema（merge + 剪枝）、
工具区框架（`EtRibbonBar`：真折叠 + peek + 分量降级 + 溢出「更多」；`EtCommandPalette` ⌘K；
`EtContextMenu` 分区 + 键盘漫游；`EtShortcutPanel` 从命令表生成），外加 G3 命令面门与 G6 文案门。
M2 起交付（已交付）：工作台布局运行时（EtWorkbench/EtDock/EtPanel/EtDocumentTabs）+ 布局树契约
（持久化 / 损坏降级 / 复用检验已过：非办公域零改逻辑搭出完整工作台）。M3 已交付：外壳件（EtTitleBar 双宿主窗口控制位 / EtStatusBar / EtBackstage）+ 主题桥接
（EtThemeBridge → 画布 --ot-* 调色板随明暗联动）+ 焦点三处一致（EtDialog/EtBackstage/命令面板共用
focus/trap 契约）+ EtToast/EtBanner。M4 起 API 冻结与 v1.0。

M4 交付中：**文档站已成全站**——指南 6 页、33 个组件入口逐页成档（含图标机制页），侧栏可点到每一页。

::: warning 计划文档先行
本库一切取舍以 `plans/tools-ui/01–07` 为准；本页随里程碑批交付更新，不做超前承诺。
:::

<style>
.td-hero__badge {
  display: inline-block;
  margin: 0 0 var(--vp-space-4, 16px);
  padding: 2px 10px;
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 9999px;
  font-size: 12px;
  color: var(--vp-c-text-2, #67676c);
}
</style>
