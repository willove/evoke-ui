/**
 * tools 文档站目录 — 顶栏 / 侧栏 / 站内搜索共用（移植自 business 站的同构文件）。
 * 版本从包的 package.json 读：顶栏展示点与 npm 包版本不可能漂移
 * （G8 守的是 index.md 的 hero 徽标，这里是顶栏那一处）。
 */
/** 版本展示点由 config.mts 的 themeConfig.toolsVersion 供（构建期读包，不硬编码） */
export const BRAND = { name: 'Evoke Tools UI' }

/** 顶栏导航（外链走 target=_blank） */
export const NAV_ITEMS = [
  { key: 'guide', label: '指南', icon: 'book', path: '/guide/getting-started' },
  { key: 'contract', label: '契约', icon: 'file-text', path: '/guide/design' },
  { key: 'npm', label: 'npm', icon: 'npmjs', path: 'https://www.npmjs.com/package/@wil-works/evoke-tools-ui', external: true },
]

/** 侧栏分组：与 config.mts 的 sidebar 同源（一处改两头同步） */
export const SIDEBAR_GROUPS = [
  {
    name: 'L1 原子件',
    key: 'l1',
    components: [
      { name: 'EtProvider', path: '/components/provider' },
      { name: 'EtToolButton', path: '/components/tool-button' },
      { name: 'EtToolGroup', path: '/components/tool-group' },
      { name: 'EtTabStrip', path: '/components/tab-strip' },
      { name: 'EtScreenTip', path: '/components/screen-tip' },
      { name: 'EtKeyHint', path: '/components/key-hint' },
      { name: 'EtDivider', path: '/components/divider' },
      { name: 'EtToolSpacer', path: '/components/tool-spacer' },
      { name: 'EtDropdown', path: '/components/dropdown' },
      { name: 'EtSelect', path: '/components/select' },
      { name: 'EtTooltip', path: '/components/tooltip' },
      { name: 'EtSplitter', suffix: ' / Panel', path: '/components/splitter' },
    ],
  },
  {
    name: 'L2 工具区',
    key: 'l2',
    components: [
      { name: 'EtRibbonBar', suffix: ' / OverflowMenu', path: '/components/ribbon-bar' },
      { name: 'EtCommandPalette', path: '/components/command-palette' },
      { name: 'EtContextMenu', path: '/components/context-menu' },
      { name: 'EtShortcutPanel', path: '/components/shortcut-panel' },
      { name: 'EtShortcutHint', path: '/components/shortcut-hint' },
    ],
  },
  {
    name: 'L3 工作台',
    key: 'l3',
    components: [
      { name: 'EtWorkbench', path: '/components/workbench' },
      { name: 'EtDock', path: '/components/dock' },
      { name: 'EtPanel', path: '/components/panel' },
      { name: 'EtPanelGroup', path: '/components/panel-group' },
      { name: 'EtDocumentTabs', path: '/components/document-tabs' },
      { name: 'EtScrollArea', path: '/components/scroll-area' },
      { name: 'EtEmptyState', path: '/components/empty-state' },
    ],
  },
  {
    name: 'L4 外壳件',
    key: 'l4',
    components: [
      { name: 'EtTitleBar', path: '/components/title-bar' },
      { name: 'EtStatusBar', path: '/components/status-bar' },
      { name: 'EtBackstage', path: '/components/backstage' },
      { name: 'EtThemeBridge', path: '/components/theme-bridge' },
      { name: 'EtDialog', path: '/components/dialog' },
      { name: 'EtToast', path: '/components/toast' },
      { name: 'EtBanner', path: '/components/banner' },
    ],
  },
  {
    name: '图标机制',
    key: 'icons',
    components: [{ name: 'EtIcon', suffix: ' · 三层命名与兜底', path: '/components/icons' }],
  },
]

/** 侧栏"导航"组（指南与契约） */
export const GUIDE_NAV_ITEMS = [
  { key: 'getting-started', label: '快速开始', icon: 'rocket', path: '/guide/getting-started' },
  { key: 'commands', label: '命令驱动', icon: 'command', path: '/guide/commands' },
  { key: 'workbench', label: '工作台布局', icon: 'layout', path: '/guide/workbench' },
  { key: 'theme', label: '主题与画布桥', icon: 'palette', path: '/guide/theme' },
  { key: 'keyboard', label: '键盘优先', icon: 'keyboard', path: '/guide/keyboard' },
  { key: 'recipe', label: '配方：日志分析器', icon: 'flask', path: '/guide/recipe-log-analyzer' },
  { key: 'design', label: '设计规范', icon: 'file-text', path: '/guide/design' },
]

/** 站内搜索的扁平索引（name + path） */
export const SEARCH_INDEX = [
  ...GUIDE_NAV_ITEMS.map((i) => ({ name: i.label, path: i.path, category: '指南' })),
  ...SIDEBAR_GROUPS.flatMap((g) => g.components.map((c) => ({ name: c.name, path: c.path, category: g.name }))),
]
