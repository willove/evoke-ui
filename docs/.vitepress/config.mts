import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'
import { demoSourcePlugin } from './demo-source.mjs'

const pkgRoot = resolve(__dirname, '../../packages/evoke-business-ui')
const examplesRoot = resolve(__dirname, '../../examples')

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
      ],
      dedupe: ['vue'],
    },
    server: { fs: { allow: [pkgRoot, examplesRoot, resolve(__dirname)] } },
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
