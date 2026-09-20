import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

const pkgRoot = resolve(__dirname, '../../packages/evoke-charts')

/**
 * 源码级 alias：playground 直接消费三维篇章源码，改动即时 HMR
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@wil-works\/evoke-charts$/,
        replacement: resolve(pkgRoot, 'src/index.js'),
      },
      {
        find: /^@wil-works\/evoke-charts\/3d$/,
        replacement: resolve(pkgRoot, 'src/3d/index.js'),
      },
      {
        find: /^@wil-works\/evoke-charts\/styles$/,
        replacement: resolve(pkgRoot, 'src/chart.vue'),
      },
    ],
  },
  server: {
    port: 8630,
  },
})
