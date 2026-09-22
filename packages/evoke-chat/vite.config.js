import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { getComponentEntries } from './scripts/component-entries.mjs'

/**
 * Vite 库模式构建配置 — evoke-chat
 *
 * 与底座（evoke-business-ui）同构：主入口 + locale + 每组件一条子路径，
 * `import EbChatbot from '@wil-works/evoke-chat/chatbot'` 只解析该组件与其依赖。
 * 组件样式由 SFC 内联 <style> 与 src/styles/index.css 聚合为单一 css 产物。
 */
const componentEntries = getComponentEntries()

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.js'),
        locale: resolve(__dirname, 'src/locale/index.js'),
        ...Object.fromEntries(
          componentEntries.map((c) => [c.name, resolve(__dirname, 'src', c.file)]),
        ),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.mjs`,
    },
    rollupOptions: {
      // 运行时依赖全部外置：底座按 peer 解析（必须与宿主同一份，ConfigProvider 的
      // inject key 是模块级 Symbol，双份实例会让 locale/主题静默失效）；
      // marked / highlight.js 按 dependencies 解析，避免被内联成双份运行时
      external: [
        /^vue($|\/)/,
        /^@wil-works\/evoke-business-ui($|\/)/,
        /^highlight\.js($|\/)/,
        /^marked($|\/)/,
      ],
      output: {
        globals: {
          vue: 'Vue',
          '@wil-works/evoke-business-ui': 'EvokeBusinessUI',
        },
        entryFileNames: '[name].mjs',
        chunkFileNames: 'chunks/[name].mjs',
        assetFileNames: (assetInfo) =>
          assetInfo.names?.[0]?.endsWith('.css') ? 'evoke-chat.css' : assetInfo.names[0],
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
  },
})
