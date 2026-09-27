# 邮件工作台

经典三栏：文件夹停在左停靠、列表与阅读面板分居中列，回复 / 归档 / 删除走同一张命令表。点文件夹过滤、点邮件进阅读面板（未读自动标已读），归档与删除会真的把邮件从列表里移走。

<DocExample :code="mailCaseSource"><MailWorkspaceCase /></DocExample>

## 用到的组件

- [EtWorkbench](/components/workbench) —— 区域槽骨架与布局持久化（左停靠两面板可折叠、可拖宽）
- [EtToolGroup](/components/tool-group) · [EtToolButton](/components/tool-button) —— 工具区两组：邮件动作与标记开关，大钮 + 组标题行
- [EtTabStrip](/components/tab-strip) —— 列表头的全部 / 未读 / 星标过滤
- [EtScrollArea](/components/scroll-area) —— 文件夹、标签、邮件列表与正文四处滚动位
- [EtEmptyState](/components/empty-state) —— 过滤无结果与未选中两处空态
- [EtKeyHint](/components/key-hint) —— 标题栏快捷位的 ⌘R
- [EtShortcutHint](/components/shortcut-hint) —— 工具区尾部的归档 / 删除键位
- [EtStatusBar](/components/status-bar) —— 文件夹 / 未读 / 过滤 / 当前邮件四个读数
- [EtToast](/components/toast) —— 命令与状态栏点击的反馈位

## 实现要点

- **一份 ctx 喂全部按钮**：`{ hasMail, starred, unread, inArchive }` 由选中邮件与文件夹推演，模板里的 `disabled / active` 读 `registry.state()`——归档在归档文件夹里自动禁用，星标钮的选中态跟着邮件走。
- **归档与删除是数据变更**：邮件数组是唯一事实源，移走或删掉后选中项落到原位置的下一封；删空一个文件夹就落到空态，而不是留一张空列表。
- **过滤三层同源**：文件夹（停靠）× 过滤 tab（列表头）× 星标（标记组）都作用在同一个投影上，状态栏读数跟着变。
- **键位提示是展示、接线归宿主**：案例只渲染 `EtKeyHint` / `EtShortcutHint`，真实按键由产品的 `comboMatchesEvent` 接（见[键盘优先](/guide/keyboard)）。
- 停靠尺寸与折叠态由 `persist-key="case-mail-layout"` 记住；坏档走 `layout-corrupted` 降级默认布局。

想看同一套 chrome 用在办公场景，对照[电子表格工作台](/examples/sheet-workbench)；设置类界面见[设置中心](/examples/settings-backstage)。

<script setup>
import MailWorkspaceCase from './cases/MailWorkspaceCase.vue'
import mailCaseSource from './cases/MailWorkspaceCase.vue?raw'
</script>