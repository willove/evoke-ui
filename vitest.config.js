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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: [
        'packages/evoke-ui/src/**',
        'packages/evoke-business-ui/src/**',
        'packages/evoke-charts/src/**',
      ],
      // 纯样式/纯常量与构建辅助不计入
      exclude: [
        '**/dist/**',
        '**/node_modules/**',
        '**/*.css',
        '**/*.d.ts',
        '**/locale/**',
      ],
      // 保守下限（2026-09 实测：语句 65.8 / 分支 58.1 / 函数 71.9 / 行 67.9），防整体回退
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 65,
        lines: 60,
      },
    },
  },
})
