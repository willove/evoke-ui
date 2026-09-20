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
      // index：完整库（含 Vue 组件）；ai：AI 生成引擎（无 Vue 依赖，MCP/Node 场景轻量引入）；
      // 3d：三维篇章（轨道相机 + 透视投影自绘，独立子路径避免二维消费方背负包体）
      entry: {
        index: resolve(__dirname, 'src/index.js'),
        ai: resolve(__dirname, 'src/ai/index.js'),
        '3d': resolve(__dirname, 'src/3d/index.js'),
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
        assetFileNames: (assetInfo) =>
          assetInfo.names?.[0]?.endsWith('.css') ? 'evoke-charts.css' : assetInfo.names[0],
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    // 产物不压缩，交由消费端构建器统一 minify
    minify: false,
  },
})
