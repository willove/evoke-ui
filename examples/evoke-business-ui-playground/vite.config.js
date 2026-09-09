import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

const pkgRoot = resolve(__dirname, '../../packages/evoke-business-ui')

/**
 * 源码级 alias：playground 直接消费包源码，组件改动即时 HMR
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
    port: 8620,
  },
})
