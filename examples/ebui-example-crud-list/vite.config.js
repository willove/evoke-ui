import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

const pkgRoot = resolve(__dirname, '../../packages/evoke-business-ui')

/**
 * 源码级 alias：示例工程直接消费组件库源码，改动即时 HMR。
 * 本工程的 pages/*.vue 会被 docs 文档站源码级引入做在线预览，
 * 因此页面组件保持自包含（不依赖 App.vue 提供的上下文）。
 */
export default defineConfig({
  plugins: [vue()],
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
  },
  server: {
    port: 8622,
  },
})
