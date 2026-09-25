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
 * M0 只有一页指南（guide/design.md，--et-* 全量令牌 + 三档密度对照）；组件页与
 * recipe 随各里程碑批交付（tools-ui 计划 07 批次节奏：文档随批，不补）。
 */
export default defineConfig({
  lang: 'zh-CN',
  title: 'Evoke Tools UI',
  description: '产品级 GUI 框架：工具区 / 停靠 / 外壳件 + 运行时契约，命名空间 --et-*',
  themeConfig: {
    sidebar: [
      {
        text: '指南',
        items: [{ text: '设计规范（--et-* 全量）', link: '/guide/design' }],
      },
    ],
  },
  vite: {
    plugins: [sourceAlias()],
  },
})
