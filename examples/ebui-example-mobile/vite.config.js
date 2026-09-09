import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

const pkgRoot = resolve(__dirname, '../../packages/evoke-business-ui')

/**
 * 源码级 alias：示例工程直接消费组件库源码，改动即时 HMR。
 * 移动端示例与桌面示例共用同一个 ebui 包与构建链（简单模式单包打包），
 * 不引入任何额外运行时依赖；移动适配由页面级响应式样式完成。
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
    port: 8628,
    host: true,
  },
})
