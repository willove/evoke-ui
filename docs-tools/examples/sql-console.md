# 数据库查询台

数据工具形态的装配：左侧对象树与消息面板、中列「编辑器 + 结果网格」，工具区与右键共用一张命令表。点对象树选表，编辑器里执行语句，结果网格可选中、可过滤，消息面板逐条记执行轨迹。

<DocExample :code="sqlConsoleSource"><SqlConsoleCase /></DocExample>

## 用到的组件

- [EtWorkbench](/components/workbench) —— 区域槽骨架：标题栏 / 查询标签 / 工具区 / 左停靠（对象树 + 消息）/ 画布 / 状态栏，布局树唯一写树处
- [EtDocumentTabs](/components/document-tabs) —— 查询标签：脏标记与不可关的「连接日志」
- [EtRibbonBar](/components/ribbon-bar) —— 工具区：开始 / 数据两个 tab，命令表驱动，支持折叠与溢出
- [EtSplitter](/components/splitter) · EtSplitterPanel —— 画布内上下分栏（编辑器 / 结果），可拖可键盘调
- [EtContextMenu](/components/context-menu) —— 结果网格右键（含子菜单），与工具区同源
- [EtEmptyState](/components/empty-state) —— 未执行与过滤无命中的两处空态
- [EtStatusBar](/components/status-bar) —— 连接 / 表 / 选中 / 行数，随交互实时重算
- [EtDropdown](/components/dropdown) —— 数据源切换（底座 `eb-dropdown-menu` 承载菜单）
- [EtToolButton](/components/tool-button) · [EtKeyHint](/components/key-hint) —— 辅助行的数据源钮与快捷键提示
- [EtToast](/components/toast) —— 命令、标签切换与窗口控制的反馈位
- [EtScrollArea](/components/scroll-area) —— 对象树与消息面板的滚动外壳

## 实现要点

- **一份 ctx 喂全部界面**：`{ hasTable, hasResult, hasRow, filtered }` 由选中表、结果与过滤词推演；工具区、右键菜单的 `enabled` 都读它——没有第二处状态。
- **对象树决定查询目标**：点表名写 `selectedTable`，执行时按它取数据集（表 ↔ 结果有因果，不是装饰）。
- **结果网格是产品内容**：案例用最小替身（点行选中 + 关键词过滤 + 导出/执行计划进消息）；换成本地查询引擎时 chrome 一行不用改。
- **执行入口三处同源**：工具区「执行查询」、空态主钮、编辑器 `⌘↩` 都走同一个命令 id。
- 持久化与降级：`persist-key` 记住停靠尺寸、分栏与折叠态；`layout-corrupted` 时降级默认布局并提示，不白屏。

<script setup>
import SqlConsoleCase from './cases/SqlConsoleCase.vue'
import sqlConsoleSource from './cases/SqlConsoleCase.vue?raw'
</script>