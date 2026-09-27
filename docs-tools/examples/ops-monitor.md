# 运维监控台

刷新与时间窗在工具区，服务列表、指标、事件流三块面板并列，中间是大盘与事件详情。自动刷新开着时每 3s 走一次与手动刷新完全相同的路径，`Ctrl+F1` 折叠功能区。

<DocExample :code="opsCaseSource"><OpsMonitorCase /></DocExample>

## 用到的组件

- [EtWorkbench](/components/workbench) —— 三向停靠（左服务 / 右指标 / 底事件）+ 顶部 chrome + 状态栏
- [EtRibbonBar](/components/ribbon-bar) —— 监控 / 事件两 tab：刷新、时间窗、显示、处置四组命令，含真折叠
- [EtTitleBar](/components/title-bar) —— 顶带产品名与集群名
- [EtScrollArea](/components/scroll-area) —— 三块面板的滚动外壳，横轴锁死
- [EtEmptyState](/components/empty-state) —— 事件流为空时的引导（一键手动刷新）
- [EtStatusBar](/components/status-bar) —— 集群 / 服务 / 时间窗 / 自动刷新 / 事件五个读数
- [EtToast](/components/toast) —— 刷新、切服务、确认事件的反馈位

## 实现要点

- **刷新只有一条路径**：自动刷新与手动刷新都走同一个 `doRefresh()`，差别只在谁触发；关闭或卸载时清定时器，不留后台任务。
- **数值可复现**：指标抖动取自按 `step` 索引的固定序列，不用随机数——同一串操作得到同一屏，截图与断言才站得住。
- **三块面板同源**：选中的服务是唯一事实源，指标、事件流与大盘都从它投影；该服务没有事件时面板换成空态，不是空白。
- **时间窗是命令**：三档 `active` 由 `ctx.window` 推演，切档后数值按窗口系数重算，工具区与状态栏读数不会脱节。
- 想对照带 ⌘K 命令面板的装配看[代码编辑器](/examples/code-editor)，旗舰装配见[电子表格工作台](/examples/sheet-workbench)。

<script setup>
import OpsMonitorCase from './cases/OpsMonitorCase.vue'
import opsCaseSource from './cases/OpsMonitorCase.vue?raw'
</script>