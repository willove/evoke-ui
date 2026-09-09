import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

/**
 * Vite 库模式构建配置
 * 纯 JS 源码，编译 .vue → .mjs，消费端无需源码级编译
 * 组件样式由各组件 import './style.css'，Vite 自动聚合为单一 css 产物
 */
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.js'),
        // 完整图标库入口：Remix 全量 3229 图标，独立产物按需引入
        'full-icons': resolve(__dirname, 'src/full-icons.js'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.mjs`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
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
