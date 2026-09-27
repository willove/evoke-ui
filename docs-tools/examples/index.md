# 案例总览

案例讲的是「一个软件怎么用这套框架搭起来」：每个案例都是可运行的完整装配，chrome 全走 `et-*`，右上角源码面板能看到整份实现。

<div class="case-cards">
  <a class="case-card" href="/examples/sheet-workbench">
    <strong class="case-card__title">电子表格工作台</strong>
    <p class="case-card__desc">消费方形态的旗舰装配：标题栏、多文档标签、功能区、公式栏、双停靠、画布宿主与表页签，点单元格看求和。</p>
    <span class="case-card__tags">Workbench · RibbonBar · FormulaBar · SheetCanvasHost · SheetTabs</span>
  </a>
  <a class="case-card" href="/examples/log-analyzer">
    <strong class="case-card__title">日志分析器</strong>
    <p class="case-card__desc">非办公工具的完整装配：过滤与查询在左停靠、结果在右停靠，⌘K 唤起命令面板。</p>
    <span class="case-card__tags">CommandPalette · ContextMenu · EmptyState · KeyHint</span>
  </a>
  <a class="case-card" href="/examples/sql-console">
    <strong class="case-card__title">数据库查询台</strong>
    <p class="case-card__desc">对象树、编辑器与结果分栏、消息面板：一条 SQL 从写到底，执行与过滤共用一张命令表。</p>
    <span class="case-card__tags">DocumentTabs · RibbonBar · Splitter · ContextMenu</span>
  </a>
  <a class="case-card" href="/examples/file-explorer">
    <strong class="case-card__title">文件资源管理器</strong>
    <p class="case-card__desc">目录树、文件列表与预览 / 属性面板：右键菜单、就地重命名与空态引导都在真实数据流里。</p>
    <span class="case-card__tags">RibbonBar · ContextMenu · Dock · EmptyState</span>
  </a>
  <a class="case-card" href="/examples/code-editor">
    <strong class="case-card__title">代码编辑器</strong>
    <p class="case-card__desc">脏标记文档标签、编辑器画布与问题面板；命令面板与工具区共用一张命令表。</p>
    <span class="case-card__tags">DocumentTabs · CommandPalette · RibbonBar · ContextMenu</span>
  </a>
  <a class="case-card" href="/examples/ops-monitor">
    <strong class="case-card__title">运维监控台</strong>
    <p class="case-card__desc">刷新与时间窗在工具区，服务、指标、事件三块面板并列，折叠、空态与 Toast 反馈齐全。</p>
    <span class="case-card__tags">RibbonBar · Dock · EmptyState · Toast</span>
  </a>
  <a class="case-card" href="/examples/mail-workspace">
    <strong class="case-card__title">邮件工作台</strong>
    <p class="case-card__desc">经典三栏：文件夹、列表、阅读面板，回复归档走命令 + 键位，两处空态各给下一步。</p>
    <span class="case-card__tags">ToolGroup · ShortcutHint · TabStrip · EmptyState</span>
  </a>
  <a class="case-card" href="/examples/settings-backstage">
    <strong class="case-card__title">设置中心（Backstage）</strong>
    <p class="case-card__desc">「文件」入口打开全屏设置页：左分节导航 + 右表单区，开关全屏页时画布尺寸读数不动。</p>
    <span class="case-card__tags">Backstage · TitleBar · TabStrip · Provider</span>
  </a>
</div>

## 挑案例还是挑组件？

要一个能直接改的整页装配，从案例进；只想知道某个组件的 props 与行为，去[组件目录](/components/tool-button)。两者用的是同一批入口：案例里的每一件都能在组件页找到契约，逐行装配清单见[配方：日志分析器](/guide/recipe-log-analyzer)。

<style scoped>
.case-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
  margin: 18px 0 8px;
}
.case-card {
  display: block;
  padding: 18px 18px 14px;
  border: 1px solid var(--td-border);
  border-radius: 10px;
  background: var(--td-bg);
  text-decoration: none;
  transition: border-color 0.15s;
}
.case-card:hover {
  border-color: var(--td-primary);
}
.case-card .case-card__title.case-card__title {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
  color: var(--td-text);
}
.case-card .case-card__desc.case-card__desc {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--td-text-secondary);
}
.case-card .case-card__tags.case-card__tags {
  font-size: 11px;
  color: var(--td-text-tertiary);
  font-family: var(--td-mono);
}
</style>