/**
 * 组件分类单一来源（tools-ui 两层重构）
 *
 * 两层：
 *   · common — 公共工具 GUI：不含任何办公语义（禁 cell/sheet/formula/--ot-*），
 *     任何"工具形态"的软件都能用（编辑器 / IDE / 运维台 / 办公套件都成立）。
 *   · office — 办公子类 UI：办公形态与画布语义的载体（功能区 tab/组语义、
 *     「文件」后台页、画布调色板桥），只被办公形态消费。
 *
 * 一级分类按**工具用途**（不是实现批次）：
 *   壳 shell / 工具区 toolbar / 命令 command / 面板 panel / 反馈 feedback /
 *   输入 inputs / 基础 primitives
 * 二级按粒度：atom（最小可复用件）/ block（可直接放进界面的功能块）/
 *   pattern（全局契约或组合装配）。
 *
 * 消费方：
 *   · 包入口 src/index.js（根，全量）与 src/common|office/index.js（两层视图）
 *   · 构建：scripts/check-taxonomy.mjs（门禁）与 test/taxonomy.test.js
 *   · 文档站：docs-tools/.vitepress/theme/meta.js（侧栏/搜索由此派生）
 * 改分类 = 只改本文件；三处视图若与本文件不一致，门禁会红。
 */

/** 两层 */
export const LAYERS = {
  common: {
    key: 'common',
    label: 'common-tools',
    zh: '公共工具',
    desc: '通用工具 GUI：基准件 + 通用壳 + 命令面 + 反馈，不含办公语义，任何工具形态都能用。',
    entry: '@wil-works/evoke-tools-ui/common',
  },
  office: {
    key: 'office',
    label: 'office-tools',
    zh: '办公子类',
    desc: '办公形态 UI：功能区 tab/组语义、「文件」后台页、画布调色板桥——只被办公形态消费。',
    entry: '@wil-works/evoke-tools-ui/office',
  },
}

/** 一级分类（按工具用途），对象键序即文档与侧栏的展示顺序 */
export const CATEGORIES = {
  shell: { key: 'shell', zh: '壳', desc: '软件的骨架：区域槽、面板树、文档与状态带' },
  toolbar: { key: 'toolbar', zh: '工具区', desc: '命令的显性入口：钮、组、tab 条、功能区' },
  command: { key: 'command', zh: '命令', desc: '同一张命令表的其它可达面：面板 / 右键 / 键位' },
  panel: { key: 'panel', zh: '面板', desc: '可停靠、可分隔、可滚动的内容容器' },
  feedback: { key: 'feedback', zh: '反馈', desc: '提示、空态、模态与轻提示' },
  inputs: { key: 'inputs', zh: '输入', desc: '工具界面里的选择与下拉' },
  primitives: { key: 'primitives', zh: '基础', desc: '最小可复用件与全局契约' },
}

/** 二级粒度 */
export const GRANULARITIES = {
  atom: { key: 'atom', zh: '原子件', desc: '单一职责，无内部结构依赖' },
  block: { key: 'block', zh: '功能块', desc: '有内部结构与状态，可直接放进界面' },
  pattern: { key: 'pattern', zh: '契约', desc: '全局契约或跨组件装配' },
}

/**
 * 33 个组件入口的分类表
 * id = 子路径名（与 scripts/component-entries.mjs 解析结果一致）；zh = 文档站与目录页的短名。
 * 键名故意用 id 而不是 name：G2 图标门会把 name / icon 字段的字符串当图标名校验。
 */
export const COMPONENT_TAXONOMY = [
  // ─── common · 基础 ───
  { id: 'provider', zh: '密度根', layer: 'common', category: 'primitives', granularity: 'pattern', summary: '密度档与工具框架度量的注入根（写 html[data-density]）' },
  { id: 'divider', zh: '分隔线', layer: 'common', category: 'primitives', granularity: 'atom', summary: '工具区与面板里的分隔线（横 / 纵）' },
  // ─── common · 工具区 ───
  { id: 'tool-button', zh: '工具钮', layer: 'common', category: 'toolbar', granularity: 'atom', summary: '工具区按钮：大钮（图标 + caption）与小钮（图标 + ScreenTip）' },
  { id: 'tool-group', zh: '工具组', layer: 'common', category: 'toolbar', granularity: 'atom', summary: '工具区分组容器：组标题行 + 组内齐次' },
  { id: 'tool-spacer', zh: '工具弹簧', layer: 'common', category: 'toolbar', granularity: 'atom', summary: '工具区弹簧：把右侧条目推到远端' },
  { id: 'tab-strip', zh: '标签条', layer: 'common', category: 'toolbar', granularity: 'atom', summary: 'tab 条基元：溢出收起、全条目常驻 DOM' },
  // ─── common · 命令 ───
  { id: 'command-palette', zh: '命令面板', layer: 'common', category: 'command', granularity: 'block', summary: '命令面板：命令表驱动的 ⌘K 可达面' },
  { id: 'context-menu', zh: '右键菜单', layer: 'common', category: 'command', granularity: 'block', summary: '右键菜单：与工具区共用同一张命令表' },
  { id: 'shortcut-panel', zh: '快捷键面板', layer: 'common', category: 'command', granularity: 'block', summary: '快捷键面板：从命令表生成键位表' },
  { id: 'key-hint', zh: '键帽', layer: 'common', category: 'command', granularity: 'atom', summary: '键帽：按平台符号化渲染组合键' },
  { id: 'shortcut-hint', zh: '键位提示', layer: 'common', category: 'command', granularity: 'atom', summary: '键位 + 标签的一行提示' },
  // ─── common · 面板 ───
  { id: 'dock', zh: '停靠区', layer: 'common', category: 'panel', granularity: 'block', summary: '停靠区：单侧多面板（stack / tabs）与折叠' },
  { id: 'panel', zh: '面板', layer: 'common', category: 'panel', granularity: 'block', summary: '面板：标题栏动作位 + 内容槽（含合法空态）' },
  { id: 'panel-group', zh: '面板组', layer: 'common', category: 'panel', granularity: 'block', summary: '同侧面板组：tab 切换与激活回落' },
  { id: 'splitter', zh: '分隔面板', layer: 'common', category: 'panel', granularity: 'atom', summary: '分隔面板基元：尺寸分摊与拖拽' },
  { id: 'splitter-panel', zh: '分隔格', layer: 'common', category: 'panel', granularity: 'atom', summary: '分隔面板的一格（size / min / max）' },
  { id: 'scroll-area', zh: '滚动区', layer: 'common', category: 'panel', granularity: 'atom', summary: '滚动容器：单轴 / 双轴，滚动条走令牌' },
  // ─── common · 壳 ───
  { id: 'workbench', zh: '工作台', layer: 'common', category: 'shell', granularity: 'block', summary: '工作台骨架：区域槽 + 布局树持久化 + 损坏降级' },
  { id: 'document-tabs', zh: '文档标签', layer: 'common', category: 'shell', granularity: 'block', summary: '多文档标签：脏标记、不可关文档、溢出' },
  { id: 'title-bar', zh: '标题栏', layer: 'common', category: 'shell', granularity: 'block', summary: '标题栏：产品名 / 文档名 / 窗口控制位（按宿主序）' },
  { id: 'status-bar', zh: '状态栏', layer: 'common', category: 'shell', granularity: 'block', summary: '状态栏：读数条目 + 缩放 + 点击回调' },
  // ─── common · 反馈 ───
  { id: 'screen-tip', zh: '屏幕提示', layer: 'common', category: 'feedback', granularity: 'atom', summary: '屏幕提示：名称 / 说明 / 快捷键三段富提示' },
  { id: 'tooltip', zh: '提示', layer: 'common', category: 'feedback', granularity: 'atom', summary: '工具提示：轻量文字浮层' },
  { id: 'dialog', zh: '对话框', layer: 'common', category: 'feedback', granularity: 'block', summary: '模态：焦点陷阱 / Esc 收敛 / 焦点归还' },
  { id: 'toast', zh: '轻提示', layer: 'common', category: 'feedback', granularity: 'block', summary: '轻提示：命令与会话反馈位' },
  { id: 'banner', zh: '横幅', layer: 'common', category: 'feedback', granularity: 'block', summary: '横幅：可关闭的区块级提示' },
  { id: 'empty-state', zh: '空态', layer: 'common', category: 'feedback', granularity: 'block', summary: '空态：一句引导 + 一个主按钮' },
  // ─── common · 输入 ───
  { id: 'select', zh: '选择器', layer: 'common', category: 'inputs', granularity: 'atom', summary: '选择器：密度自适应的底座 Select 包装' },
  { id: 'dropdown', zh: '下拉', layer: 'common', category: 'inputs', granularity: 'atom', summary: '下拉：密度自适应的底座 Dropdown 包装' },
  // ─── office · 输入 ───
  { id: 'formula-bar', zh: '公式栏', layer: 'office', category: 'inputs', granularity: 'block', summary: '办公输入带：引用位 + 编辑区 + 动作位（槽优先），回车提交 / Esc 收敛' },
  // ─── office · 面板 ───
  { id: 'sheet-canvas-host', zh: '画布宿主', layer: 'office', category: 'panel', granularity: 'block', summary: '画布地基：可滚动视口 + 不随滚动的浮层位 + 尺寸/滚动契约 + 焦点根' },
  // ─── office ───
  { id: 'ribbon-bar', zh: '功能区', layer: 'office', category: 'toolbar', granularity: 'block', summary: '功能区：tab / 组 / 条目，真折叠 + 溢出让位 + 上下文 tab' },
  { id: 'overflow-menu', zh: '溢出菜单', layer: 'office', category: 'toolbar', granularity: 'atom', summary: '功能区溢出菜单：窄屏容纳不下的条目去处' },
  { id: 'backstage', zh: '后台视图', layer: 'office', category: 'shell', granularity: 'block', summary: '「文件」全屏后台页：左分节导航 + 内容区，不引发画布跳动' },
  { id: 'sheet-tabs', zh: '工作表标签', layer: 'office', category: 'shell', granularity: 'block', summary: '底带表页签：当前页白底 + 强调条，roving 漫游与「更多」溢出' },
  { id: 'theme-bridge', zh: '画布桥', layer: 'office', category: 'primitives', granularity: 'pattern', summary: '画布调色板桥：把主题令牌解析成 --ot-* 画布色（办公语义出口）' },
]

/** 办公语义词（common 层禁止出现；与 scripts/check-token-rule.mjs 同词表） */
export const OFFICE_SEMANTIC_WORDS = ['cell', 'sheet', 'formula', 'canvas-grid', 'spreadsheet']

/** 按层过滤（保持 COMPONENT_TAXONOMY 的顺序） */
export function byLayer(layer) {
  return COMPONENT_TAXONOMY.filter((c) => c.layer === layer)
}

/**
 * 按「层 → 分类」分组，分类顺序取 CATEGORIES 键序
 * @param {string} layer
 * @returns {Array<{ category: object, components: Array }>}
 */
export function groupedByCategory(layer) {
  const items = byLayer(layer)
  return Object.values(CATEGORIES)
    .map((category) => ({
      category,
      components: items.filter((c) => c.category === category.key),
    }))
    .filter((g) => g.components.length > 0)
}

/** 单条查询 */
export function taxonomyOf(id) {
  return COMPONENT_TAXONOMY.find((c) => c.id === id) ?? null
}