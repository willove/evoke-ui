# 电子表格工作台

消费方形态的旗舰装配：标题栏、文档标签、功能区、双停靠面板、网格画布与状态栏各就各位，命令表驱动整条 chrome。点单元格看求和，按方向键移动选区，右上工具区切 tab、Ctrl+F1 折叠。

<DocExample :code="sheetCaseSource"><SheetWorkbenchCase /></DocExample>

## 用到的组件

- [EtWorkbench](/components/workbench) —— 区域槽骨架：标题栏 / 文档标签 / 工具区 / 停靠 / 画布 / 状态栏，布局树唯一写树处
- [EtDocumentTabs](/components/document-tabs) —— 多文档标签：脏标记、不可关文档、溢出收起
- [EtRibbonBar](/components/ribbon-bar) —— 功能区：tab / 组 / 条目 + 真折叠与溢出让位
- [EtFormulaBar](/components/formula-bar) —— 公式栏：引用位跟随选区、编辑区可提交、动作位放 fx
- [EtSheetCanvasHost](/components/sheet-canvas-host) —— 画布宿主：滚动视口 + 浮层位（冻结提示固定于视口）
- [EtSheetTabs](/components/sheet-tabs) —— 底带表页签：roving 漫游、右键菜单、加号
- [EtDock](/components/dock) · [EtPanel](/components/panel) —— 左停靠两块面板（工作表 / 大纲），可拖可键盘调
- [EtContextMenu](/components/context-menu) —— 网格右键，与工具区共用同一张命令表
- [EtStatusBar](/components/status-bar) —— 选区 / 值 / 求和 / 工作表，实时随选区重算
- [EtToast](/components/toast) —— 命令、窗口控制与状态栏点击的反馈位

## 实现要点

- **一份 ctx 喂全部界面**：`{ hasCell, bold, italic, frozen }` 由选区推演，工具区、右键菜单、命令面板的 `enabled / active` 都读它——没有第二处状态。
- **网格是产品内容**：案例用最小替身（点选 + 方向键 + 加粗/倾斜/冻结），换成本地表格引擎时 chrome 一行不用改。
- **视口即网格焦点根**：`viewport-role="grid"` 定语义，行/列规模与活动格 ARIA 由 `syncViewportAria()` 经 `viewportEl` 同步；内层网格不再自设 `tabindex`，宿主的 `viewport-focus / viewport-blur` 才收得到焦点。
- **持久化与降级**：`persist-key` 记住停靠尺寸与折叠态；`layout-corrupted` 时降级默认布局并提示，不白屏。
- 三档密度、暗色与 `--eb-*` 令牌跟随宿主，chrome 与产品内容各自取色。

<script setup>
import SheetWorkbenchCase from './cases/SheetWorkbenchCase.vue'
import sheetCaseSource from './cases/SheetWorkbenchCase.vue?raw'
</script>