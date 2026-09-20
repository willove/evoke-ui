import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

const pkgRoot = resolve(__dirname, '../../packages/charts-3d')

/**
 * 源码级 alias：playground 直接消费包源码，改动即时 HMR
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@wil-works\/charts-3d$/,
        replacement: resolve(pkgRoot, 'src/index.js'),
      },
      {
        find: /^@wil-works\/charts-3d\/styles$/,
        replacement: resolve(pkgRoot, 'src/chart3d.vue'),
      },
    ],
  },
  server: {
    port: 8630,
  },
})
