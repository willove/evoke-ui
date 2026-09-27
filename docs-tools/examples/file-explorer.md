# 文件资源管理器

文件管理形态的装配：左目录树、右预览与属性、中列文件列表，工具区与右键走同一张命令表。点目录切位置，点文件看预览，空目录给引导，双击进文件夹。

<DocExample :code="fileExplorerSource"><FileExplorerCase /></DocExample>

## 用到的组件

- [EtWorkbench](/components/workbench) —— 区域槽骨架：标题栏 / 工具区 / 左右停靠 / 列表画布 / 状态栏，布局树唯一写树处
- [EtRibbonBar](/components/ribbon-bar) —— 工具区：开始 / 查看两个 tab，命令表驱动（含视图切换的激活态）
- [EtDock](/components/dock) · [EtPanel](/components/panel) —— 左目录树、右预览与属性三块面板，可拖可键盘调
- [EtContextMenu](/components/context-menu) —— 列表右键（含「视图」子菜单），与工具区同源
- [EtEmptyState](/components/empty-state) —— 空目录与筛选无命中的两处空态，空目录的主钮就是上传命令
- [EtStatusBar](/components/status-bar) —— 位置 / 项目 / 选中 / 视图，随选择实时重算
- [EtDropdown](/components/dropdown) —— 排序方式（名称 / 大小 / 时间）
- [EtToolButton](/components/tool-button) · [EtIcon](/components/icons) —— 面包屑、视图切换钮与文件类型图标
- [EtToast](/components/toast) —— 命令与窗口控制的反馈位
- [EtScrollArea](/components/scroll-area) —— 目录树与文件列表的滚动外壳

## 实现要点

- **选中项是一份状态**：`selectedId` 一份，预览、属性、状态栏与命令 `enabled` 全从它推演；右键先选中再弹菜单，菜单里禁用项与当前选择必然一致。
- **两处空态都是真交互**：空目录的主钮走 `upload` 命令（上传后列表立刻有内容），筛选无命中的主钮清空关键词。
- **剪切 → 粘贴是真移动**：`cut` 记下条目 id，`paste` 把它从原目录摘出并插进当前目录，`paste` 的 `enabled` 由 ctx 的 `hasClipboard` 推演。
- **重命名就地编辑**：列表行内换成输入框，回车提交、Esc 放弃——不引入第二个弹层。
- **视图与扩展名是命令的激活态**：列表 / 图标、显示扩展名都注册成命令，工具区、右键子菜单与辅助行按钮三处同源。
- 持久化与降级：`persist-key` 记住停靠尺寸与折叠态；`layout-corrupted` 时降级默认布局并提示，不白屏。

<script setup>
import FileExplorerCase from './cases/FileExplorerCase.vue'
import fileExplorerSource from './cases/FileExplorerCase.vue?raw'
</script>