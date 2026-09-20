import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'
import llmstxt from 'vitepress-plugin-llms'
import { demoSourcePlugin } from './demo-source.mjs'

const charts3dRoot = resolve(__dirname, '../../packages/charts-3d')
const uiRoot = resolve(__dirname, '../../packages/evoke-ui')

/**
 * Charts 3D 文档站
 * 自定义布局，源码级消费图表包（改动即时生效）
 * 注意：VitePress 自带 plugin-vue，勿再手动注入第二个实例（双实例会损坏 SFC 解析）
 */
export default defineConfig({
  lang: 'zh-CN',
  title: 'Charts 3D',
  description: '零依赖 Canvas 三维图表库（Vue 3）：透视投影自绘、轨道交互，主题与暗色跟随宿主，无需 WebGL',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],

  vite: {
    plugins: [llmstxt()],
    resolve: {
      alias: [
        {
          find: /^@wil-works\/charts-3d$/,
          replacement: resolve(charts3dRoot, 'src/index.js'),
        },
      ],
      dedupe: ['vue'],
    },
    server: { fs: { allow: [charts3dRoot, uiRoot, resolve(__dirname)] } },
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
