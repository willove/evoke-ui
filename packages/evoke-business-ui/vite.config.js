import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { getComponentEntries } from './scripts/component-entries.mjs'

/**
 * Vite 库模式构建配置
 * 纯 JS 源码，编译 .vue → .mjs，消费端无需源码级编译
 * 组件样式由各组件 import './style.css'，Vite 自动聚合为单一 css 产物
 *
 * 按需子路径导出：主入口与 full-icons 之外，每个组件 / 命令式 API 单独成入口
 * （清单从 src/index.js 解析，见 scripts/component-entries.mjs）——
 * `import EbButton from '@wil-works/evoke-business-ui/button'` 只解析该组件与其依赖。
 * 入口间共享模块落入 chunks/（不对外）。
 */
const componentEntries = getComponentEntries()

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.js'),
        // 完整图标库入口：Remix 全量 3229 图标，独立产物按需引入
        'full-icons': resolve(__dirname, 'src/full-icons.js'),
        // 语言包入口：宿主自己指定语言时用（7 个语言包）
        locale: resolve(__dirname, 'src/locale/index.js'),
        ...Object.fromEntries(
          componentEntries.map((c) => [c.name, resolve(__dirname, 'src', c.file)]),
        ),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.mjs`,
    },
    rollupOptions: {
      // external：vue + 图表独立包（EbChart 别名重导出，样式由消费端单独引入 charts 包）
      // 运行时依赖全部外置（正则覆盖 dayjs/plugin/* 等子路径导入），消费端按
      // dependencies 解析，避免 dayjs 等被整体内联造成双份运行时
      external: [
        /^vue($|\/)/,
        /^@wil-works\/evoke-charts($|\/)/,
        /^@floating-ui\//,
        /^async-validator($|\/)/,
        /^dayjs($|\/)/,
      ],
      output: {
        globals: {
          vue: 'Vue',
          '@wil-works/evoke-charts': 'EvokeCharts',
        },
        entryFileNames: '[name].mjs',
        // 入口间共享 chunk 归入 chunks/ 子目录，与组件入口文件隔离
        chunkFileNames: 'chunks/[name].mjs',
        // 单文件产物，样式聚合为 evoke-business-ui.css
        assetFileNames: (assetInfo) =>
          assetInfo.names?.[0]?.endsWith('.css') ? 'evoke-business-ui.css' : assetInfo.names[0],
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    // 产物不压缩，交由消费端构建器统一 minify
    minify: false,
  },
})
