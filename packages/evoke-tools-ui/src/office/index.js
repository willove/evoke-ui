/**
 * @wil-works/evoke-tools-ui/office — office-tools（办公子类 UI）
 *
 * 办公形态的一层：功能区的 tab/组语义、「文件」全屏后台页、底带工作表标签、公式栏、
 * 表格画布宿主、画布调色板桥 + 办公皮肤（横带序列）。
 * 依赖 common-tools 的基准件与通用壳；产品侧（office-works）再把
 * `--ot-*` 办公语义令牌接到画布与网格上（回流禁令：--et-* 内不得出现办公语义）。
 *
 * Usage（两层一起装）：
 *   import CommonTools from '@wil-works/evoke-tools-ui/common'
 *   import OfficeTools from '@wil-works/evoke-tools-ui/office'
 *   import '@wil-works/evoke-tools-ui/styles'
 *   createApp(App).use(CommonTools).use(OfficeTools)
 *
 * 分类与粒度见 src/taxonomy.js（单一来源）。
 */

// ─── 壳 shell（办公形态）───
import EtBackstage from '../components/backstage/index.vue'
import EtSheetTabs from '../components/sheet-tabs/index.vue'
// ─── 工具区 toolbar（办公形态）───
import EtRibbonBar from '../components/ribbon-bar/index.vue'
import EtOverflowMenu from '../components/ribbon-bar/overflow.vue'
// ─── 面板 panel（办公形态）───
import EtSheetCanvasHost from '../components/sheet-canvas-host/index.vue'
// ─── 输入 inputs（办公形态）───
import EtFormulaBar from '../components/formula-bar/index.vue'
// ─── 基础 primitives（办公语义出口）───
import EtThemeBridge from '../components/theme-bridge/index.vue'

// ══════ CSS — 框架样式（令牌 / 暗色 / 焦点环）+ 办公皮肤（横带序列）══════
import '../styles/index.css'

// 图标机制载体（走 ./icons 子路径；不计入两层分类表）
import EtIcon from '../icons/icon.vue'

// 办公皮肤（横带序列 + 画布位布局；消费 --et-* 框架令牌，不定义办公语义色）
import './styles/office.css'

// ─── 分类元数据 ───
import { LAYERS, CATEGORIES, GRANULARITIES, COMPONENT_TAXONOMY, byLayer, groupedByCategory, taxonomyOf } from '../taxonomy.js'
import { SLOT_CONTRACT, SLOT_CONTRACT_PATHS, tagOf, contractByLayer } from '../slots.js'

// ─── Component Registry ───
const components = {
  // 壳
  EtBackstage,
  EtSheetTabs,
  // 工具区
  EtRibbonBar,
  EtOverflowMenu,
  // 面板
  EtSheetCanvasHost,
  // 输入
  EtFormulaBar,
  // 基础（画布桥）
  EtThemeBridge,
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
  // 壳
  EtBackstage,
  EtSheetTabs,
  // 工具区
  EtRibbonBar,
  EtOverflowMenu,
  // 面板
  EtSheetCanvasHost,
  // 输入
  EtFormulaBar,
  // 基础（画布桥）
  EtThemeBridge,
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