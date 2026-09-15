import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

const pkgRoot = resolve(__dirname, '../../packages/evoke-business-ui')

/**
 * 源码级 alias：脚手架直接消费组件库源码，改动即时 HMR。
 * 作为「母版工程」，业务方复制本目录后只需替换 src/pages 与 src/config。
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
        // 深路径（如 src/locale/index.js）源码级解析
        find: /^@wil-works\/evoke-business-ui\/src\/(.*)$/,
        replacement: resolve(pkgRoot, 'src/$1'),
      },
      {
        find: /^@wil-works\/evoke-business-ui\/styles$/,
        replacement: resolve(pkgRoot, 'src/styles/index.css'),
      },
    ],
  },
  server: {
    port: 8630,
  },
})
