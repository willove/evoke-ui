import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { getEtComponentEntries } from './scripts/component-entries.mjs'

/**
 * Vite 库模式构建配置 — evoke-tools-ui
 *
 * 与底座（evoke-business-ui）/ evoke-chat 同构：主入口 + styles 之外的
 * 运行时契约入口（runtime / icons）+ 每组件一条子路径，
 * `import EtToolButton from '@wil-works/evoke-tools-ui/tool-button'` 只解析该组件。
 *
 * business-ui 与 vue 全部外置：底座必须与宿主同一份实例（ConfigProvider 的
 * inject key 是模块级 Symbol，双份实例会让 locale/主题静默失效 —— 根 vitest
 * 的别名注释记录过同一个坑）。
 */
const componentEntries = getEtComponentEntries()

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.js'),
        // 运行时契约入口（L0：键位表 / 焦点漫游 / 图标机制），消费方可不装组件只用契约
        runtime: resolve(__dirname, 'src/runtime/index.js'),
        icons: resolve(__dirname, 'src/icons/index.js'),
        ...Object.fromEntries(
          componentEntries.map((c) => [c.name, resolve(__dirname, 'src', c.file)]),
        ),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.mjs`,
    },
    rollupOptions: {
      external: [
        /^vue($|\/)/,
        /^@wil-works\/evoke-business-ui($|\/)/,
      ],
      output: {
        globals: {
          vue: 'Vue',
          '@wil-works/evoke-business-ui': 'EvokeBusinessUI',
        },
        entryFileNames: '[name].mjs',
        // 入口间共享 chunk 归入 chunks/ 子目录，与组件入口文件隔离
        chunkFileNames: 'chunks/[name].mjs',
        // 单文件产物，样式聚合为 evoke-tools-ui.css
        assetFileNames: (assetInfo) =>
          assetInfo.names?.[0]?.endsWith('.css') ? 'evoke-tools-ui.css' : assetInfo.names[0],
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    // 产物不压缩，交由消费端构建器统一 minify（与底座一致）
    minify: false,
  },
})
