/**
 * 槽位契约（slot composition contract）—— 单一来源
 *
 * 为什么要有这份表：tools-ui 的组合方式是**多槽拼装**（一个组件常常同时开 3–8 个槽），
 * 但槽名散在 30 多个 SFC 里，产品看文档、写代码、改版本三处对不上。这里把"谁开了哪些槽、
 * 每个槽吃什么东西、默认渲染什么"集中成一份数据：
 *   · 文档站「组合契约」页直接读它渲染表格与配方；
 *   · scripts/check-slots.mjs（G10 门）拿它对 SFC 双向核对——文档漏记、代码删槽都会红。
 *
 * 字段：
 *   slots[]       命名槽：{ slot, desc, scope? }（scope = 作用域插槽给的字段，用于选择）。
 *                 键名用 slot 而不是 name——G2 图标门会把 name / icon 字段的字符串当图标名校验
 *   default       默认槽说明（无默认槽则不写）
 *   passthrough   true = 组件把**底座的全部命名槽**原样透传（popper 类包装件），
 *                 槽名由底座决定，此处不逐一列举，也不参与"漏记"比对
 *   slotless      显式声明"无槽"及原因（schema 驱动 / 零 DOM）——门禁会反向核对确实没有槽
 */
export const SLOT_CONTRACT = {
  // ─── 壳 shell ───
  workbench: {
    slots: [
      { slot: 'titlebar', desc: '顶带：EtTitleBar（窗口控制位由它按平台渲染）' },
      { slot: 'documents', desc: '文档标签带：EtDocumentTabs / EtSheetTabs' },
      { slot: 'toolbar', desc: '工具区：EtRibbonBar（或自绘命令条）' },
      { slot: 'left', desc: '左停靠区：EtDock' },
      { slot: 'panel', desc: '面板内容：作用域给 { panel }，按 panel.id 渲染对应内容', scope: '{ panel, dock }' },
      { slot: 'right', desc: '右停靠区：EtDock' },
      { slot: 'bottom', desc: '底停靠区：EtDock' },
      { slot: 'tabbar', desc: '内容页签带（办公形态放 EtSheetTabs；与 #documents 对称，可同时用）' },
      { slot: 'statusbar', desc: '底带：EtStatusBar（缩放等工具位由它渲染）' },
    ],
    default: '画布位（中间内容；办公产品放 EtSheetCanvasHost）',
  },
  title_bar: {
    slots: [
      { slot: 'brand', desc: '产品名 / logo 位' },
      { slot: 'quick', desc: '快捷访问位（保存 / 撤销等，建议 ≤6 个）' },
      { slot: 'center', desc: '中区：文档名 / 搜索框位' },
    ],
  },
  status_bar: {
    slots: [
      { slot: 'left', desc: '左区（就绪语等）；与内置 items 共存，槽在前' },
      { slot: 'center', desc: '中区（给了才渲染）' },
      { slot: 'right', desc: '右区：给了即整体接管内置工具位（缩放）' },
    ],
  },
  backstage: {
    slots: [
      { slot: 'nav', desc: '左分节导航（产品填分节项）' },
    ],
    default: '后台页内容区（新建 / 打开 / 账户等页面）',
  },
  sheet_tabs: {
    slots: [
      { slot: 'nav', desc: '左固定位：滚动 / 导航钮（给了才渲染）' },
      { slot: 'tab', desc: '自定义表签渲染', scope: '{ tab, active, index }' },
      { slot: 'actions', desc: '右固定位：加号 / 全部表；给了即让位内置加号' },
    ],
  },

  // ─── 工具区 toolbar ───
  tool_group: {
    default: '组内控件行（EtToolButton / 小控件；禁换行）',
  },

  // ─── 命令 command ───
  command_palette: {
    default: '触发器内容（透传底座；底座支持时生效，多数场景用键盘唤起）',
  },
  context_menu: {
    default: '自定义菜单内容（默认渲染命令表条目）',
  },

  // ─── 面板 panel ───
  dock: {
    slots: [{ slot: 'panel', desc: '面板渲染位', scope: '{ panel, dock }' }],
  },
  panel: {
    slots: [{ slot: 'tools', desc: '标题栏右侧工具位（关闭 / 最大化 / 自定义）' }],
    default: '面板内容（要滚动就套 EtScrollArea）',
  },
  panel_group: {
    slots: [{ slot: 'tools', desc: '组内所有面板共用的工具位' }],
    default: '面板内容区',
  },
  scroll_area: {
    default: '滚动内容（单轴 / 双轴由 props 定）',
  },
  splitter: { passthrough: true },
  splitter_panel: { passthrough: true },

  // ─── 输入 inputs ───
  select: { passthrough: true },
  dropdown: { passthrough: true },
  formula_bar: {
    slots: [
      { slot: 'reference', desc: '引用位：默认只读回显；要可编辑名称框就填这里' },
      { slot: 'actions', desc: '动作位：fx / 确认 / 取消 / 展开' },
    ],
    default: '编辑区：默认单行输入；产品可换富编辑器（公式高亮 / 自动补全）',
  },

  // ─── 反馈 feedback ───
  dialog: {
    slots: [{ slot: 'footer', desc: '底部动作区（默认渲染取消 / 确认）' }],
    default: '对话框正文',
  },
  toast: {
    slots: [{ slot: 'action', desc: '右侧动作位（撤销 / 查看）' }],
    default: '提示正文',
  },
  banner: {
    slots: [{ slot: 'action', desc: '右侧动作位（关闭 / 了解详情）' }],
    default: '横幅正文',
  },
  empty_state: {
    slots: [{ slot: 'action', desc: '主操作位（一句引导 + 一个主按钮）' }],
  },
  screen_tip: {
    default: '提示正文（默认渲染 name / desc / keys 三段）',
  },
  tooltip: { passthrough: true },

  // ─── 基础 primitives ───
  provider: {
    default: '应用根（密度必须对整个文档生效，只包一层 div 拿不到档位）',
  },

  // ─── office ───
  sheet_canvas_host: {
    slots: [{ slot: 'overlay', desc: '浮层位：不随内容滚动（单元格编辑器 / 拖拽指示 / 菜单锚点）' }],
    default: '画布内容：canvas / SVG / 自绘网格（宿主不认识格子）',
  },
  // 无槽件：结构由数据决定（schema / 命令表 / 零 DOM），此处显式记录"为什么没有槽"
  ribbon_bar: { slotless: 'schema 驱动：tab / 组 / 条目全部来自 ribbonSchema，形态不对外开放' },
  overflow_menu: { slotless: '内部件：溢出条目按命令表自动聚合，外来内容会破坏"收起与展开状态一致"' },
  theme_bridge: { slotless: '零 DOM：只做主题 → 画布调色板的令牌桥，不渲染任何节点' },
}

/** 组件 id → 契约键（子件与主件同目录不同文件，键名用蛇形便于文档页引用） */
export const SLOT_CONTRACT_PATHS = {
  workbench: 'workbench/index.vue',
  title_bar: 'title-bar/index.vue',
  status_bar: 'status-bar/index.vue',
  backstage: 'backstage/index.vue',
  sheet_tabs: 'sheet-tabs/index.vue',
  tool_group: 'tool-group/index.vue',
  command_palette: 'command-palette/index.vue',
  context_menu: 'context-menu/index.vue',
  dock: 'dock/index.vue',
  panel: 'panel/index.vue',
  panel_group: 'panel/group.vue',
  scroll_area: 'scroll-area/index.vue',
  splitter: 'splitter/index.vue',
  splitter_panel: 'splitter/panel.vue',
  select: 'select/index.vue',
  dropdown: 'dropdown/index.vue',
  formula_bar: 'formula-bar/index.vue',
  dialog: 'dialog/index.vue',
  toast: 'toast/index.vue',
  banner: 'banner/index.vue',
  empty_state: 'empty-state/index.vue',
  screen_tip: 'screen-tip/index.vue',
  tooltip: 'tooltip/index.vue',
  provider: 'provider/index.vue',
  sheet_canvas_host: 'sheet-canvas-host/index.vue',
  ribbon_bar: 'ribbon-bar/index.vue',
  overflow_menu: 'ribbon-bar/overflow.vue',
  theme_bridge: 'theme-bridge/index.vue',
}

/** 文档展示名：snake → 组件标签（EtXxx） */
export function tagOf(key) {
  return `Et${key
    .split('_')
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('')}`
}

/** 按层取契约（文档页分段展示用） */
export function contractByLayer(layer, taxonomy) {
  return taxonomy
    .filter((c) => c.layer === layer)
    .map((c) => ({ id: c.id, zh: c.zh, key: c.id.replaceAll('-', '_') }))
    .filter((c) => SLOT_CONTRACT[c.key] && (SLOT_CONTRACT[c.key].slots?.length || SLOT_CONTRACT[c.key].default || SLOT_CONTRACT[c.key].passthrough))
}