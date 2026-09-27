# 日志分析器

非办公工具的完整装配：一套 chrome 服务一个完全不同的业务。过滤器与查询在左停靠、结果在右停靠、命令面板按 ⌘K 唤起——工具区、右键、命令面板三处共用同一张命令表。

<DocExample :code="logCaseSource"><LogAnalyzerCase /></DocExample>

## 用到的组件

- [EtWorkbench](/components/workbench) —— 工作台骨架与布局持久化
- [EtRibbonBar](/components/ribbon-bar) —— 查询 / 过滤 / 导出三组命令的工具区
- [EtCommandPalette](/components/command-palette) —— ⌘K 命令面板，与工具区同源
- [EtContextMenu](/components/context-menu) —— 结果行右键，动作随选区启停
- [EtEmptyState](/components/empty-state) —— 无命中时的引导（一键清空过滤）
- [EtKeyHint](/components/key-hint) —— 工具区右侧的 ⌘K 键帽
- [EtStatusBar](/components/status-bar) —— 命中数 / 级别 / 字段三读数

## 实现要点

- **过滤与查询是产品状态**：`levels / keyword / selectedId` 一处保存，`rows` 是它的投影；命中为 0 时画布换成空态而不是空白。
- **enabled / active 从 ctx 推演**：`hasRow` 决定「复制该行」是否可点，`levels` 决定三个级别过滤钮的选中态——加一个动作 = 加一行数据。
- **键位走运行时**：`comboMatchesEvent` 认平台差异，`isImeComposing` 在中文输入组字期不抢键。
- 想对照「同一套 chrome 用在办公场景」看[电子表格工作台](/examples/sheet-workbench)，逐行装配清单见[配方：日志分析器](/guide/recipe-log-analyzer)。

<script setup>
import LogAnalyzerCase from './cases/LogAnalyzerCase.vue'
import logCaseSource from './cases/LogAnalyzerCase.vue?raw'
</script>