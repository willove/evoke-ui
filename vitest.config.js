import { defineConfig } from 'vitest/config'
import path from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      // 组件挂载测试需要单份 Vue runtime，统一别名到根目录副本
      { find: /^vue$/, replacement: path.join(__dirname, 'node_modules/vue') },
    ],
    dedupe: ['vue'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    env: {
      NODE_ENV: 'test',
    },
    include: ['packages/**/*.test.js', 'packages/**/*.test.ts'],
    server: {
      deps: {
        inline: [/^@wil-works\//],
      },
    },
    threads: false,
    // 逐文件隔离（vitest 默认）：isolate:false 曾让 VTU 全局 transformVNodeArgs、
    // 图标注册表、localStorage 等模块/DOM 状态跨文件泄漏，埋下顺序敏感的偶发挂
    isolate: true,
  },
})
