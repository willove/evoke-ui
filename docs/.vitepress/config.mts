import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'
import llmstxt from 'vitepress-plugin-llms'
import { demoSourcePlugin } from './demo-source.mjs'
import { getComponentEntries } from '../../packages/evoke-business-ui/scripts/component-entries.mjs'

const pkgRoot = resolve(__dirname, '../../packages/evoke-business-ui')
const chatRoot = resolve(__dirname, '../../packages/evoke-chat')
const chartsRoot = resolve(__dirname, '../../packages/evoke-charts')
const examplesRoot = resolve(__dirname, '../../examples')

/**
 * 底座组件子路径（`@wil-works/evoke-business-ui/icon` …）→ 源码文件。
 * 对话家族的整体源码 import 的是这些子路径，若让它们落到 node_modules（= 已构建的
 * dist），文档站就会同时持有两份底座实例——ConfigProvider 的 inject key 是模块级
 * Symbol，两份互不相认，语言/主题会在聊天演示里静默失效。统一指回源码。
 */
const baseEntries = new Map(
  getComponentEntries().map((e) => [e.name, resolve(pkgRoot, 'src', e.file)]),
)

function baseSourceAlias() {
  return {
    name: 'evoke-base-source-alias',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (source === '@wil-works/evoke-business-ui') return resolve(pkgRoot, 'src/index.js')
      if (source === '@wil-works/evoke-business-ui/styles') return resolve(pkgRoot, 'src/styles/index.css')
      if (source === '@wil-works/evoke-business-ui/locale') return resolve(pkgRoot, 'src/locale/index.js')
      const m = /^@wil-works\/evoke-business-ui\/(.+)$/.exec(source)
      if (m && baseEntries.has(m[1])) return baseEntries.get(m[1])
      return null
    },
  }
}

/**
 * Evoke Business UI 文档站
 * 自定义布局（layout: false 于主题内控制），源码级消费组件库（改动即时生效）
 * 注意：VitePress 自带 plugin-vue，勿再手动注入第二个实例（双实例会损坏 SFC 解析）
 */
export default defineConfig({
  lang: 'zh-CN',
  title: 'Evoke Business UI',
  description: '面向中后台管理界面的 Vue3 组件库：通用组件、业务组件与 Canvas 自绘图表',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],

  vite: {
    plugins: [llmstxt(), baseSourceAlias()],
    resolve: {
      alias: [
        {
          find: /^@wil-works\/evoke-business-ui$/,
          replacement: resolve(pkgRoot, 'src/index.js'),
        },
        {
          find: /^@wil-works\/evoke-business-ui\/styles$/,
          replacement: resolve(pkgRoot, 'src/styles/index.css'),
        },
        {
          find: /^@wil-works\/evoke-chat$/,
          replacement: resolve(chatRoot, 'src/index.js'),
        },
        {
          find: /^@wil-works\/evoke-chat\/styles$/,
          replacement: resolve(chatRoot, 'src/styles/index.css'),
        },
        {
          find: /^@wil-works\/evoke-chat\/locale$/,
          replacement: resolve(chatRoot, 'src/locale/index.js'),
        },
        {
          find: /^@wil-works\/evoke-charts$/,
          replacement: resolve(chartsRoot, 'src/index.js'),
        },
      ],
      dedupe: ['vue'],
    },
    server: { fs: { allow: [pkgRoot, chatRoot, chartsRoot, examplesRoot, resolve(__dirname)] } },
  },

  markdown: {
    config(md) {
      md.use(demoSourcePlugin)
    },
  },

  themeConfig: {
    // 完全自定义主题（theme/index.ts 渲染 DocLayout）
  },
})
