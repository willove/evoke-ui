import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

/**
 * Vite 库模式构建配置
 * 纯 JS 源码，编译 .vue → .mjs，消费端无需源码级编译
 * 组件样式（SFC style 块）由 Vite 聚合为单一 css 产物
 */
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: { index: resolve(__dirname, 'src/index.js') },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.mjs`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        assetFileNames: (assetInfo) =>
          assetInfo.names?.[0]?.endsWith('.css') ? 'charts-3d.css' : assetInfo.names[0],
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    // 产物不压缩，交由消费端构建器统一 minify
    minify: false,
  },
})
