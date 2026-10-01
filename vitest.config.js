import { defineConfig } from 'vitest/config'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import { getComponentEntries } from './packages/evoke-business-ui/scripts/component-entries.mjs'

/**
 * 衍生包（@wil-works/evoke-chat）从源码里 import 底座：`@wil-works/evoke-business-ui`
 * 与它的组件子路径。测试里若让裸名走 node_modules → dist，而测试自己又用相对路径
 * 引了底座源码，就会同时存在两份底座实例——ConfigProvider 的 inject key 是模块级
 * Symbol，两实例互不相认，locale/主题会静默失效。这里统一指回源码，单实例。
 */
const BASE_ROOT = path.join(__dirname, 'packages/evoke-business-ui')
const baseEntries = new Map(
  getComponentEntries().map((e) => [e.name, path.join(BASE_ROOT, 'src', e.file)]),
)

function baseSourceAlias() {
  return {
    name: 'evoke-base-source-alias',
    enforce: 'pre',
    resolveId(source) {
      if (source === '@wil-works/evoke-business-ui') return path.join(BASE_ROOT, 'src/index.js')
      if (source === '@wil-works/evoke-business-ui/styles') return path.join(BASE_ROOT, 'src/styles/index.css')
      if (source === '@wil-works/evoke-business-ui/locale') return path.join(BASE_ROOT, 'src/locale/index.js')
      const m = /^@wil-works\/evoke-business-ui\/(.+)$/.exec(source)
      if (m && baseEntries.has(m[1])) return baseEntries.get(m[1])
      return null
    },
  }
}

export default defineConfig({
  plugins: [vue(), baseSourceAlias()],
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
        'packages/evoke-chat/src/**',
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
      // 保守下限（2026-09-22 实测：语句 71.9 / 分支 65.0 / 函数 76.8 / 行 74.1，
      // 已含拆包后的 evoke-chat），防整体回退；留约 2 个点缓冲吸收环境波动
      thresholds: {
        statements: 69,
        branches: 62,
        functions: 74,
        lines: 71,
      },
    },
  },
})
