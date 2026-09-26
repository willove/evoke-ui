/** 运行时统一出口（L0 契约，tools-ui 计划 05）
 *  M0：键位表（解析/平台符号化/事件匹配）+ 焦点漫游基座（roving tabindex）
 *  M1：命令契约 / 菜单 schema / 工具区状态机 / 键位表构建 */
export {
  normalizeCombo,
  formatCombo,
  comboFromEvent,
  comboMatchesEvent,
  isKnownKeyToken,
  keySymbols,
  currentPlatform,
} from './keys/keys'
export { nextRovingIndex, rovingTabindex, useRovingTabindex } from './focus/roving'

// ─── 命令契约 ───
export {
  COMMAND_SURFACES,
  assertCommand,
  resolveCommandState,
  createCommandRegistry,
  buildReachabilityReport,
  collectSchemaCommandIds,
} from './command/index.js'

// ─── 菜单 / 工具区 schema 运行时 ───
export {
  SCHEMA_NODE_TYPES,
  assertSchemaNode,
  mergeSchema,
  pruneSchema,
  collectCommandRefs,
  findDanglingCommandRefs,
  flattenSchema,
  checkVisibleBudget,
} from './menu/index.js'

// ─── 工具区状态机 ───
export {
  RIBBON_SCALE_TIERS,
  nextCollapsed,
  toolAreaHeight,
  scaleGroup,
  planGroupScaleTiers,
  planContextTabs,
  loadCollapsed,
  saveCollapsed,
} from './ribbon/index.js'

// ─── 键位表构建与冲突检测 ───
export { buildShortcutTable, detectKeyConflicts, findCommandByCombo } from './shortcuts/index.js'

// ─── 布局树契约（M2：停靠 / 面板 / 持久化 / 损坏降级） ───
export {
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
} from './layout/index.js'

// ─── 主题 → 画布调色板桥接（M3） ───
export {
  CANVAS_PALETTE,
  resolveCanvasPalette,
  applyCanvasPalette,
  observeThemeChanges,
} from './theme/index.js'

// ─── 焦点管理（M3：Dialog/Backstage/Palette 同一套） ───
export {
  FOCUSABLE_SELECTOR,
  getFocusableElements,
  nextFocusableInTrap,
  resolveFocusReturnTarget,
} from './focus/index.js'

// ─── 宿主与平台探测（M3：标题栏窗口控制位双宿主适配） ───
export {
  HOSTS,
  windowControlPlacement,
  detectPlatform,
  WINDOW_CONTROLS,
} from './window/index.js'
