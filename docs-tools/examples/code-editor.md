# 代码编辑器

IDE 形态的装配：脏标记文档标签、左停靠（资源 / 搜索）、带行号与光标行的编辑画布、底停靠（问题 / 终端）。工具区、右键、命令面板共用同一张命令表——按 ⌘K 试，⌘S 存当前文件。

<DocExample :code="codeCaseSource"><CodeEditorCase /></DocExample>

## 用到的组件

- [EtWorkbench](/components/workbench) —— 区域槽骨架：标题栏 / 文档标签 / 工具区 / 停靠 / 画布 / 状态栏
- [EtDocumentTabs](/components/document-tabs) —— 多文档标签：脏标记、不可关文档；资源里点已关闭的文件会按需重开
- [EtRibbonBar](/components/ribbon-bar) —— 工具区：开始 / 诊断两 tab，`Ctrl+F1` 折叠后命令经 peek 仍可达
- [EtCommandPalette](/components/command-palette) —— ⌘K 面板，条目来自同一张命令表
- [EtContextMenu](/components/context-menu) —— 编辑器右键：保存 / 插入日志 / 格式化 / 跳到问题
- [EtScrollArea](/components/scroll-area) —— 资源、搜索、问题、终端四个面板的滚动外壳
- [EtStatusBar](/components/status-bar) —— 文件 / 光标 / 问题 / 语言 / 终端五个读数
- [EtKeyHint](/components/key-hint) —— 工具区右侧的 ⌘K 键帽
- [EtToast](/components/toast) —— 命令、文档切换与窗口控制的反馈位

## 实现要点

- **脏标记是产品状态**：`documents[].dirty` 只有一处；「插入日志」真的往当前文件追加一行并置脏，「保存」清脏——保存钮的 `enabled` 直接读 `ctx.dirty`，没有第二份开关。
- **跳转是一个动作三处入口**：资源列表、搜索命中、问题面板都走同一个 `goto(file, line)`，光标行与终端回执始终一致。
- **面板按 id 分发**：`#panel` 槽按 `panel.id` 认领四个面板，布局树只管尺寸与呈现（`presentation: 'tabs'`），不认业务。
- **键位归产品**：⌘K / ⌘S 在消费方绑定，组字期（`e.isComposing`）不抢键；命令面板的 `hotkey` 只负责展示。
- 想对照更小的装配看[日志分析器](/examples/log-analyzer)，同一套 chrome 用在办公场景看[电子表格工作台](/examples/sheet-workbench)。

<script setup>
import CodeEditorCase from './cases/CodeEditorCase.vue'
import codeCaseSource from './cases/CodeEditorCase.vue?raw'
</script>