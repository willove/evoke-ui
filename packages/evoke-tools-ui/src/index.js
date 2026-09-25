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
 * 分层：能复用 business-ui 的一律复用（浮层 / 菜单列表 / 命令面板 / 分隔基元），
 * 本库只新建"产品外壳"组件与运行时契约（tools-ui 计划 01 §二）。
 * M0 射程：L0 键位表 + 焦点漫游基座；L1 原子件 12 个（含兜底机制载体 EtIcon）。
 */

// ══════ CSS — 设计变量（--et-*）+ 暗色重映射 + 工具界面基础样式 ══════
import './styles/index.css'

// ─── L1 原子件 ───
import EtProvider from './components/provider/index.vue'
import EtToolButton from './components/tool-button/index.vue'
import EtToolGroup from './components/tool-group/index.vue'
import EtTabStrip from './components/tab-strip/index.vue'
import EtScreenTip from './components/screen-tip/index.vue'
import EtKeyHint from './components/key-hint/index.vue'
import EtDivider from './components/divider/index.vue'
import EtToolSpacer from './components/tool-spacer/index.vue'
// 工具界面专用形态（business-ui 同名件的密度适配包装）
import EtDropdown from './components/dropdown/index.vue'
import EtSelect from './components/select/index.vue'
import EtTooltip from './components/tooltip/index.vue'
import EtSplitter from './components/splitter/index.vue'
import EtSplitterPanel from './components/splitter/panel.vue'

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

// ─── 运行时契约（L0：键位表 / 焦点漫游）──
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
} from './runtime/index.js'

// ─── Composables ───
import { useDensity, ET_DENSITY_KEY, ET_DENSITIES } from './composables/useDensity'

// ─── Component Registry ───
const components = {
  EtProvider,
  EtToolButton,
  EtToolGroup,
  EtTabStrip,
  EtScreenTip,
  EtKeyHint,
  EtDivider,
  EtToolSpacer,
  EtDropdown,
  EtSelect,
  EtTooltip,
  EtSplitter,
  EtSplitterPanel,
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
  // L1 原子件
  EtProvider,
  EtToolButton,
  EtToolGroup,
  EtTabStrip,
  EtScreenTip,
  EtKeyHint,
  EtDivider,
  EtToolSpacer,
  // 工具界面专用形态（business-ui 包装）
  EtDropdown,
  EtSelect,
  EtTooltip,
  EtSplitter,
  EtSplitterPanel,
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
  // 运行时契约（L0）
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
  // Composables
  useDensity,
  ET_DENSITY_KEY,
  ET_DENSITIES,
  // Install
  install,
  components,
}

export default { install }
