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

<p class="td-hero__badge">v0.1.0 · 内测版</p>

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

## 当前状态（M0）

M0 交付：`--et-*` 令牌（三档密度 + chrome 度量与预算）、G1/G2/G4/G5/G7 五道门、
图标解析与兜底机制、12 个 L1 原子件、`DESIGN.md` 与本站设计规范页。
M1 起交付工具区框架（命令 + 菜单 + 折叠/溢出）。

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
