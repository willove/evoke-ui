/**
 * @wil-works/evoke-tools-ui/common — common-tools（公共工具 GUI）
 *
 * 不含任何办公语义的一层：基准件 + 通用壳 + 命令面 + 面板 + 反馈 + 输入。
 * 编辑器 / IDE / 运维台 / 办公套件都用这一层；办公形态（功能区 / 后台页 /
 * 画布桥）在 `@wil-works/evoke-tools-ui/office`。
 *
 * Usage:
 *   import { createApp } from 'vue'
 *   import CommonTools from '@wil-works/evoke-tools-ui/common'
 *   import '@wil-works/evoke-tools-ui/styles'
 *   createApp(App).use(CommonTools)
 *
 * 分类与粒度见 src/taxonomy.js（单一来源）；本文件的导出集合由
 * test/taxonomy.test.js 与 scripts/check-taxonomy.mjs 对着它守。
 */

// ══════ CSS — 设计变量（--et-*）+ 暗色重映射 + 工具界面基础样式 ══════
import '../styles/index.css'

// 图标机制载体（走 ./icons 子路径；不计入两层分类表）
import EtIcon from '../icons/icon.vue'

// ─── 基础 primitives ───
import EtProvider from '../components/provider/index.vue'
import EtDivider from '../components/divider/index.vue'
// ─── 工具区 toolbar ───
import EtToolButton from '../components/tool-button/index.vue'
import EtToolGroup from '../components/tool-group/index.vue'
import EtToolSpacer from '../components/tool-spacer/index.vue'
import EtTabStrip from '../components/tab-strip/index.vue'
// ─── 命令 command ───
import EtCommandPalette from '../components/command-palette/index.vue'
import EtContextMenu from '../components/context-menu/index.vue'
import EtShortcutPanel from '../components/shortcut-panel/index.vue'
import EtKeyHint from '../components/key-hint/index.vue'
import EtShortcutHint from '../components/shortcut-hint/index.vue'
// ─── 面板 panel ───
import EtDock from '../components/dock/index.vue'
import EtPanel from '../components/panel/index.vue'
import EtPanelGroup from '../components/panel/group.vue'
import EtSplitter from '../components/splitter/index.vue'
import EtSplitterPanel from '../components/splitter/panel.vue'
import EtScrollArea from '../components/scroll-area/index.vue'
// ─── 壳 shell ───
import EtWorkbench from '../components/workbench/index.vue'
import EtDocumentTabs from '../components/document-tabs/index.vue'
import EtTitleBar from '../components/title-bar/index.vue'
import EtStatusBar from '../components/status-bar/index.vue'
// ─── 反馈 feedback ───
import EtScreenTip from '../components/screen-tip/index.vue'
import EtTooltip from '../components/tooltip/index.vue'
import EtDialog from '../components/dialog/index.vue'
import EtToast from '../components/toast/index.vue'
import EtBanner from '../components/banner/index.vue'
import EtEmptyState from '../components/empty-state/index.vue'
// ─── 输入 inputs ───
import EtSelect from '../components/select/index.vue'
import EtDropdown from '../components/dropdown/index.vue'

// ─── 分类元数据（文档站与消费方都读它，避免各自维护一份分类）──
import { LAYERS, CATEGORIES, GRANULARITIES, COMPONENT_TAXONOMY, byLayer, groupedByCategory, taxonomyOf } from '../taxonomy.js'
import { SLOT_CONTRACT, SLOT_CONTRACT_PATHS, tagOf, contractByLayer } from '../slots.js'

// ─── Component Registry ───
const components = {
  EtProvider,
  EtDivider,
  EtToolButton,
  EtToolGroup,
  EtToolSpacer,
  EtTabStrip,
  EtCommandPalette,
  EtContextMenu,
  EtShortcutPanel,
  EtKeyHint,
  EtShortcutHint,
  EtDock,
  EtPanel,
  EtPanelGroup,
  EtSplitter,
  EtSplitterPanel,
  EtScrollArea,
  EtWorkbench,
  EtDocumentTabs,
  EtTitleBar,
  EtStatusBar,
  EtScreenTip,
  EtTooltip,
  EtDialog,
  EtToast,
  EtBanner,
  EtEmptyState,
  EtSelect,
  EtDropdown,
}

// ─── Vue Plugin Install ───
function install(app) {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
  // 图标机制：两层都带上（组件内部走直接 import，这里只是让模板里的 <et-icon> 也能用）
  app.component('EtIcon', EtIcon)
}

export {
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
  // 分类元数据
  LAYERS,
  CATEGORIES,
  GRANULARITIES,
  COMPONENT_TAXONOMY,
  byLayer,
  groupedByCategory,
  taxonomyOf,
  // 槽位组合契约
  SLOT_CONTRACT,
  SLOT_CONTRACT_PATHS,
  tagOf,
  contractByLayer,
  // Install
  install,
  components,
}

export default { install }