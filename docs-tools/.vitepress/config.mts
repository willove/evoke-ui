import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'
import llmstxt from 'vitepress-plugin-llms'
import { demoSourcePlugin } from './demo-source.mjs'
import { componentApiPlugin } from './component-api.mjs'
import toolsPkg from '../../packages/evoke-tools-ui/package.json'
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
 * 侧栏/目录页/搜索的组件分类与 src/taxonomy.js 同源（两层 + 用途分类）；
 * 组件数以产物入口为准（G8），分类一致性由包的 G9 分类门守。
 */
export default defineConfig({
  lang: 'zh-CN',
  title: 'Evoke Tools UI',
  description: '产品级 GUI 框架：common-tools 通用层 + office-tools 办公子类 + 运行时契约，命名空间 --et-*',
  // <DemoBlock>源码注入（文档页只写一遍演示代码，块内即预览）
  markdown: {
    config(md) {
      md.use(demoSourcePlugin)
    },
  },
  themeConfig: {
    // 顶栏版本展示点：构建期从包读取（不硬编码——G8 版本守卫扫的是本文件里的
    // 字面版本串，程序化读入不会造成假阳性，也不会与 npm 包版本漂移）
    toolsVersion: toolsPkg.version,
    // 侧栏/顶栏/搜索的目录数据在 theme/meta.js（与 business / charts 两站同构：
    // 自定义外壳自己渲染导航，不用 VitePress 默认主题的 sidebar）
  },
  vite: {
    plugins: [sourceAlias(), componentApiPlugin()],
  },
})
