/**
 * @wil-works/evoke-tools-ui
 * Evoke Tools UI — 纯 JS Vue3 产品级 GUI 框架（工具区 / 停靠 / 外壳件 + 运行时契约）
 *
 * Usage:
 *   import { createApp } from 'vue'
 *   import EvokeToolsUI from '@wil-works/evoke-tools-ui'
 *   import '@wil-works/evoke-tools-ui/styles'
 *
 *   const app = createApp(App)
 *   app.use(EvokeToolsUI)
 *
 * 分层（v1.3 起）：组件分两层，分类单一来源见 src/taxonomy.js
 *   · common（29 件）—— public GUI：基准件 / 通用壳 / 命令面 / 面板 / 反馈 / 输入，不含办公语义
 *   · office（4 件）—— 办公形态：功能区 / 溢出菜单 / 后台页 / 画布桥
 * 两层可分别按子路径安装：`@wil-works/evoke-tools-ui/common` 与 `/office`。
 * 本入口 = 全量（33 件），行为与既有版本一致。
 */

// ══════ CSS — 设计变量（--et-*）+ 暗色重映射 + 工具界面基础样式 ══════
import './styles/index.css'
// 办公皮肤（office 层的横带序列类；根入口 = 全量，两层都带）
import './office/styles/office.css'

// ─── common · 基础 primitives ───
import EtProvider from './components/provider/index.vue'
import EtDivider from './components/divider/index.vue'
// ─── common · 工具区 toolbar ───
import EtToolButton from './components/tool-button/index.vue'
import EtToolGroup from './components/tool-group/index.vue'
import EtToolSpacer from './components/tool-spacer/index.vue'
import EtTabStrip from './components/tab-strip/index.vue'
// ─── common · 命令 command ───
import EtCommandPalette from './components/command-palette/index.vue'
import EtContextMenu from './components/context-menu/index.vue'
import EtShortcutPanel from './components/shortcut-panel/index.vue'
import EtKeyHint from './components/key-hint/index.vue'
import EtShortcutHint from './components/shortcut-hint/index.vue'
// ─── common · 面板 panel ───
import EtDock from './components/dock/index.vue'
import EtPanel from './components/panel/index.vue'
import EtPanelGroup from './components/panel/group.vue'
import EtSplitter from './components/splitter/index.vue'
import EtSplitterPanel from './components/splitter/panel.vue'
import EtScrollArea from './components/scroll-area/index.vue'
// ─── common · 壳 shell ───
import EtWorkbench from './components/workbench/index.vue'
import EtDocumentTabs from './components/document-tabs/index.vue'
import EtTitleBar from './components/title-bar/index.vue'
import EtStatusBar from './components/status-bar/index.vue'
// ─── common · 反馈 feedback ───
import EtScreenTip from './components/screen-tip/index.vue'
import EtTooltip from './components/tooltip/index.vue'
import EtDialog from './components/dialog/index.vue'
import EtToast from './components/toast/index.vue'
import EtBanner from './components/banner/index.vue'
import EtEmptyState from './components/empty-state/index.vue'
// ─── common · 输入 inputs ───
import EtSelect from './components/select/index.vue'
import EtDropdown from './components/dropdown/index.vue'
// ─── office · 壳 shell（办公形态） ───
import EtBackstage from './components/backstage/index.vue'
import EtSheetTabs from './components/sheet-tabs/index.vue'
// ─── office · 工具区 toolbar（办公形态） ───
import EtRibbonBar from './components/ribbon-bar/index.vue'
import EtOverflowMenu from './components/ribbon-bar/overflow.vue'
// ─── office · 面板 panel（办公形态） ───
import EtSheetCanvasHost from './components/sheet-canvas-host/index.vue'
// ─── office · 输入 inputs（办公形态） ───
import EtFormulaBar from './components/formula-bar/index.vue'
// ─── office · 基础 primitives（画布桥） ───
import EtThemeBridge from './components/theme-bridge/index.vue'

// ─── 图标机制（解析与兜底载体 + 领域别名注册 API）──
import EtIcon from './icons/icon.vue'
import {
  registerDomainIcons,
  getDomainAlias,
  hasDomainAlias,
  clearDomainIcons,
  listDomainAliases,
  FALLBACK_ICON_NAME,
  resolveIconName,
  isCustomIconName,
  isDanglingIconName,
  findDanglingIconNames,
  pickFallbackIconName,
} from './icons/index.js'

// ─── 运行时契约（L0：键位表 / 焦点漫游 / 命令 / 菜单 schema / 工具区状态机）──
import {
  normalizeCombo,
  formatCombo,
  comboFromEvent,
  comboMatchesEvent,
  isKnownKeyToken,
  keySymbols,
  currentPlatform,
  nextRovingIndex,
  rovingTabindex,
  useRovingTabindex,
  COMMAND_SURFACES,
  assertCommand,
  resolveCommandState,
  createCommandRegistry,
  buildReachabilityReport,
  collectSchemaCommandIds,
  SCHEMA_NODE_TYPES,
  assertSchemaNode,
  mergeSchema,
  pruneSchema,
  collectCommandRefs,
  findDanglingCommandRefs,
  flattenSchema,
  checkVisibleBudget,
  RIBBON_SCALE_TIERS,
  nextCollapsed,
  toolAreaHeight,
  scaleGroup,
  planGroupScaleTiers,
  planContextTabs,
  loadCollapsed,
  saveCollapsed,
  buildShortcutTable,
  detectKeyConflicts,
  findCommandByCombo,
  DOCK_SIDES,
  DOCK_PRESENTATIONS,
  createLayoutTree,
  normalizeLayout,
  serializeLayout,
  deserializeLayout,
  loadLayout,
  saveLayout,
  findPanel,
  findDock,
  dockOf,
  allPanelIds,
  visiblePanels,
  togglePanelCollapsed,
  toggleDockCollapsed,
  setPanelSize,
  hidePanel,
  showPanel,
  maximizePanel,
  restorePanel,
  addDock,
  removeDock,
  resetLayout,
  layoutEquals,
  CANVAS_PALETTE,
  resolveCanvasPalette,
  applyCanvasPalette,
  observeThemeChanges,
  FOCUSABLE_SELECTOR,
  getFocusableElements,
  nextFocusableInTrap,
  resolveFocusReturnTarget,
  HOSTS,
  windowControlPlacement,
  detectPlatform,
  WINDOW_CONTROLS,
} from './runtime/index.js'

// ─── Composables ───
import { useDensity, ET_DENSITY_KEY, ET_DENSITIES } from './composables/useDensity'

// ─── 分类元数据（单一来源：src/taxonomy.js；两层视图见 ./common 与 ./office）──
import {
  LAYERS,
  CATEGORIES,
  GRANULARITIES,
  COMPONENT_TAXONOMY,
  OFFICE_SEMANTIC_WORDS,
  byLayer,
  groupedByCategory,
  taxonomyOf,
} from './taxonomy.js'
import { SLOT_CONTRACT, SLOT_CONTRACT_PATHS, tagOf, contractByLayer } from './slots.js'

// ─── Component Registry ───
const components = {
  // 基础
  EtProvider,
  EtDivider,
  // 工具区
  EtToolButton,
  EtToolGroup,
  EtToolSpacer,
  EtTabStrip,
  // 命令
  EtCommandPalette,
  EtContextMenu,
  EtShortcutPanel,
  EtKeyHint,
  EtShortcutHint,
  // 面板
  EtDock,
  EtPanel,
  EtPanelGroup,
  EtSplitter,
  EtSplitterPanel,
  EtScrollArea,
  // 壳
  EtWorkbench,
  EtDocumentTabs,
  EtTitleBar,
  EtStatusBar,
  // 反馈
  EtScreenTip,
  EtTooltip,
  EtDialog,
  EtToast,
  EtBanner,
  EtEmptyState,
  // 输入
  EtSelect,
  EtDropdown,
  // office · 壳
  EtBackstage,
  EtSheetTabs,
  // office · 工具区
  EtRibbonBar,
  EtOverflowMenu,
  // office · 面板
  EtSheetCanvasHost,
  // office · 输入
  EtFormulaBar,
  // office · 基础（画布桥）
  EtThemeBridge,
  // 图标机制（./icons 子路径；不计入两层分类表，但根入口要注册它）
  EtIcon,
}

// ─── Vue Plugin Install ───
function install(app, _options = {}) {
  // options.density 预留：密度由 EtProvider 的 prop 写入 <html data-density>（03 §3.1）
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
}

// ─── Exports ───
export {
  // 基础 primitives
  EtProvider,
  EtDivider,
  // 工具区 toolbar
  EtToolButton,
  EtToolGroup,
  EtToolSpacer,
  EtTabStrip,
  // 命令 command
  EtCommandPalette,
  EtContextMenu,
  EtShortcutPanel,
  EtKeyHint,
  EtShortcutHint,
  // 面板 panel
  EtDock,
  EtPanel,
  EtPanelGroup,
  EtSplitter,
  EtSplitterPanel,
  EtScrollArea,
  // 壳 shell
  EtWorkbench,
  EtDocumentTabs,
  EtTitleBar,
  EtStatusBar,
  // 反馈 feedback
  EtScreenTip,
  EtTooltip,
  EtDialog,
  EtToast,
  EtBanner,
  EtEmptyState,
  // 输入 inputs
  EtSelect,
  EtDropdown,
  // office · 壳
  EtBackstage,
  EtSheetTabs,
  // office · 工具区
  EtRibbonBar,
  EtOverflowMenu,
  // office · 面板
  EtSheetCanvasHost,
  // office · 输入
  EtFormulaBar,
  // office · 基础（画布桥）
  EtThemeBridge,
  // 图标机制
  EtIcon,
  registerDomainIcons,
  getDomainAlias,
  hasDomainAlias,
  clearDomainIcons,
  listDomainAliases,
  FALLBACK_ICON_NAME,
  resolveIconName,
  isCustomIconName,
  isDanglingIconName,
  findDanglingIconNames,
  pickFallbackIconName,
  // 运行时契约（L0：键位表 / 焦点漫游）
  normalizeCombo,
  formatCombo,
  comboFromEvent,
  comboMatchesEvent,
  isKnownKeyToken,
  keySymbols,
  currentPlatform,
  nextRovingIndex,
  rovingTabindex,
  useRovingTabindex,
  // 运行时契约（L0：命令 / 菜单 schema / 工具区状态机 / 键位表 / 布局树）
  COMMAND_SURFACES,
  assertCommand,
  resolveCommandState,
  createCommandRegistry,
  buildReachabilityReport,
  collectSchemaCommandIds,
  SCHEMA_NODE_TYPES,
  assertSchemaNode,
  mergeSchema,
  pruneSchema,
  collectCommandRefs,
  findDanglingCommandRefs,
  flattenSchema,
  checkVisibleBudget,
  RIBBON_SCALE_TIERS,
  nextCollapsed,
  toolAreaHeight,
  scaleGroup,
  planGroupScaleTiers,
  planContextTabs,
  loadCollapsed,
  saveCollapsed,
  buildShortcutTable,
  detectKeyConflicts,
  findCommandByCombo,
  // Composables
  useDensity,
  ET_DENSITY_KEY,
  ET_DENSITIES,
  // 分类元数据（两层与用途分类的单一来源）
  LAYERS,
  CATEGORIES,
  GRANULARITIES,
  COMPONENT_TAXONOMY,
  OFFICE_SEMANTIC_WORDS,
  byLayer,
  groupedByCategory,
  taxonomyOf,
  // 槽位组合契约（谁开了哪些槽 / 吃什么 / 作用域）
  SLOT_CONTRACT,
  SLOT_CONTRACT_PATHS,
  tagOf,
  contractByLayer,
  // Install
  install,
  components,
}

export default { install }
