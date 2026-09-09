import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Vite 库模式构建配置
 * 纯 JS 源码，编译 .vue → .mjs，消费端无需源码级编译
 * 组件样式由各组件 import './style.css'，Vite 自动聚合为单一 css 产物
 * EwIconGrid 的展示图标集通过动态 import 独立分 chunk，不进主包
 */
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        // 动态 import 的展示图标集固定 chunk 名（相对引用，消费端构建器自动跟随）
        chunkFileNames: (chunkInfo) =>
          chunkInfo.isDynamicEntry && chunkInfo.name === 'showcase'
            ? 'showcase-icons.mjs'
            : '[name].mjs',
        assetFileNames: (assetInfo) =>
          assetInfo.names?.[0]?.endsWith('.css') ? 'evoke-ui.css' : assetInfo.names[0],
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    // 产物不压缩，交由消费端构建器统一 minify
    minify: false,
  },
})
