import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'
import { getComponentEntries } from '../../packages/evoke-business-ui/scripts/component-entries.mjs'
import { getEtComponentEntries } from '../../packages/evoke-tools-ui/scripts/component-entries.mjs'

const baseRoot = resolve(__dirname, '../../packages/evoke-business-ui')
const toolsRoot = resolve(__dirname, '../../packages/evoke-tools-ui')

/**
 * 源码级 alias（与根 vitest / 示例工程同一模式）：
 * 组件子路径（@wil-works/evoke-business-ui/icon、@wil-works/evoke-tools-ui/tool-button…）
 * → 源码文件。若让裸名落到 node_modules（= 已构建 dist），文档站会同时持有两份实例，
 * ConfigProvider 的 inject key 是模块级 Symbol，locale/主题会静默失效。
 */
const baseEntries = new Map(
  getComponentEntries().map((e) => [e.name, resolve(baseRoot, 'src', e.file)]),
)
const toolsEntries = new Map(
  getEtComponentEntries().map((e) => [e.name, resolve(toolsRoot, 'src', e.file)]),
)

function sourceAlias() {
  return {
    name: 'evoke-source-alias',
    enforce: 'pre',
    resolveId(source) {
      if (source === '@wil-works/evoke-business-ui') return resolve(baseRoot, 'src/index.js')
      if (source === '@wil-works/evoke-business-ui/styles') return resolve(baseRoot, 'src/styles/index.css')
      if (source === '@wil-works/evoke-business-ui/locale') return resolve(baseRoot, 'src/locale/index.js')
      if (source === '@wil-works/evoke-tools-ui') return resolve(toolsRoot, 'src/index.js')
      if (source === '@wil-works/evoke-tools-ui/styles') return resolve(toolsRoot, 'src/styles/index.css')
      if (source === '@wil-works/evoke-tools-ui/runtime') return resolve(toolsRoot, 'src/runtime/index.js')
      if (source === '@wil-works/evoke-tools-ui/icons') return resolve(toolsRoot, 'src/icons/index.js')
      const base = /^@wil-works\/evoke-business-ui\/(.+)$/.exec(source)
      if (base && baseEntries.has(base[1])) return baseEntries.get(base[1])
      const tools = /^@wil-works\/evoke-tools-ui\/(.+)$/.exec(source)
      if (tools && toolsEntries.has(tools[1])) return toolsEntries.get(tools[1])
      return null
    },
  }
}

/**
 * Evoke Tools UI 文档站
 * M4 全站：指南 6 页（快速开始 / 命令 / 工作台 / 主题 / 键盘 / recipe）+ 组件页
 * （33 个组件入口逐页 + 图标机制页）+ 契约页（--et-* 全量令牌与契约）。
 * 侧栏分层与 src/index.js 的分层注释同源；组件数以产物入口为准（G8）。
 */
export default defineConfig({
  lang: 'zh-CN',
  title: 'Evoke Tools UI',
  description: '产品级 GUI 框架：工具区 / 停靠 / 外壳件 + 运行时契约，命名空间 --et-*',
  themeConfig: {
    sidebar: [
      {
        text: '指南',
        collapsed: false,
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '命令驱动', link: '/guide/commands' },
          { text: '工作台布局', link: '/guide/workbench' },
          { text: '主题与画布桥', link: '/guide/theme' },
          { text: '键盘优先', link: '/guide/keyboard' },
          { text: '配方：日志分析器', link: '/guide/recipe-log-analyzer' },
        ],
      },
      {
        text: '组件',
        collapsed: false,
        items: [
          {
            text: 'L1 原子件（12）',
            collapsed: false,
            items: [
              { text: 'EtProvider', link: '/components/provider' },
              { text: 'EtToolButton', link: '/components/tool-button' },
              { text: 'EtToolGroup', link: '/components/tool-group' },
              { text: 'EtTabStrip', link: '/components/tab-strip' },
              { text: 'EtScreenTip', link: '/components/screen-tip' },
              { text: 'EtKeyHint', link: '/components/key-hint' },
              { text: 'EtDivider', link: '/components/divider' },
              { text: 'EtToolSpacer', link: '/components/tool-spacer' },
              { text: 'EtDropdown', link: '/components/dropdown' },
              { text: 'EtSelect', link: '/components/select' },
              { text: 'EtTooltip', link: '/components/tooltip' },
              { text: 'EtSplitter / EtSplitterPanel', link: '/components/splitter' },
            ],
          },
          {
            text: 'L2 工具区（6）',
            collapsed: false,
            items: [
              { text: 'EtRibbonBar / EtOverflowMenu', link: '/components/ribbon-bar' },
              { text: 'EtCommandPalette', link: '/components/command-palette' },
              { text: 'EtContextMenu', link: '/components/context-menu' },
              { text: 'EtShortcutPanel', link: '/components/shortcut-panel' },
              { text: 'EtShortcutHint', link: '/components/shortcut-hint' },
            ],
          },
          {
            text: 'L3 工作台（7）',
            collapsed: false,
            items: [
              { text: 'EtWorkbench', link: '/components/workbench' },
              { text: 'EtDock', link: '/components/dock' },
              { text: 'EtPanel', link: '/components/panel' },
              { text: 'EtPanelGroup', link: '/components/panel-group' },
              { text: 'EtDocumentTabs', link: '/components/document-tabs' },
              { text: 'EtScrollArea', link: '/components/scroll-area' },
              { text: 'EtEmptyState', link: '/components/empty-state' },
            ],
          },
          {
            text: 'L4 外壳件（7）',
            collapsed: false,
            items: [
              { text: 'EtTitleBar', link: '/components/title-bar' },
              { text: 'EtStatusBar', link: '/components/status-bar' },
              { text: 'EtBackstage', link: '/components/backstage' },
              { text: 'EtThemeBridge', link: '/components/theme-bridge' },
              { text: 'EtDialog', link: '/components/dialog' },
              { text: 'EtToast', link: '/components/toast' },
              { text: 'EtBanner', link: '/components/banner' },
            ],
          },
          {
            text: '图标机制',
            collapsed: false,
            items: [{ text: 'EtIcon · 三层命名与兜底', link: '/components/icons' }],
          },
        ],
      },
      {
        text: '契约',
        collapsed: false,
        items: [{ text: '设计规范（--et-* 全量）', link: '/guide/design' }],
      },
    ],
  },
  vite: {
    plugins: [sourceAlias()],
  },
})
