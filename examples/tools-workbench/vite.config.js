import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { getComponentEntries } from '../../packages/evoke-business-ui/scripts/component-entries.mjs'
import { getEtComponentEntries } from '../../packages/evoke-tools-ui/scripts/component-entries.mjs'

const baseRoot = resolve(__dirname, '../../packages/evoke-business-ui')
const toolsRoot = resolve(__dirname, '../../packages/evoke-tools-ui')

/**
 * 源码级 alias：示例工程直接消费两库源码，改动即时 HMR。
 * 与根 vitest / docs-tools 同一模式——bare specifier（含组件子路径）一律指回源码，
 * 保证单实例（ConfigProvider 的 inject key 是模块级 Symbol，双份实例会让 locale/主题
 * 静默失效；实测放过一次：子路径漏 alias 时图标注册表被引两份，全量图标库双 chunk）。
 */
function sourceAliases() {
  const baseEntries = getComponentEntries().map((e) => [e.name, resolve(baseRoot, 'src', e.file)])
  const toolsEntries = getEtComponentEntries().map((e) => [e.name, resolve(toolsRoot, 'src', e.file)])
  return [
    { find: /^@wil-works\/evoke-business-ui$/, replacement: resolve(baseRoot, 'src/index.js') },
    { find: /^@wil-works\/evoke-business-ui\/styles$/, replacement: resolve(baseRoot, 'src/styles/index.css') },
    { find: /^@wil-works\/evoke-business-ui\/locale$/, replacement: resolve(baseRoot, 'src/locale/index.js') },
    ...baseEntries.map(([name, file]) => ({
      find: new RegExp(`^@wil-works/evoke-business-ui/${name}$`),
      replacement: file,
    })),
    { find: /^@wil-works\/evoke-tools-ui$/, replacement: resolve(toolsRoot, 'src/index.js') },
    { find: /^@wil-works\/evoke-tools-ui\/styles$/, replacement: resolve(toolsRoot, 'src/styles/index.css') },
    { find: /^@wil-works\/evoke-tools-ui\/runtime$/, replacement: resolve(toolsRoot, 'src/runtime/index.js') },
    { find: /^@wil-works\/evoke-tools-ui\/icons$/, replacement: resolve(toolsRoot, 'src/icons/index.js') },
    ...toolsEntries.map(([name, file]) => ({
      find: new RegExp(`^@wil-works/evoke-tools-ui/${name}$`),
      replacement: file,
    })),
  ]
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: sourceAliases(),
    dedupe: ['vue'],
  },
  server: {
    port: 8631,
    fs: { allow: [baseRoot, toolsRoot, __dirname] },
  },
  preview: {
    // 视觉回归的伺服端口（playwright webServer 指向这里）；
    // 显式绑 127.0.0.1：localhost 在本机解析到 ::1，Playwright 的 URL 探测会连不上
    // 4180：勿改回 4177——office-works 的 sheets-playground 占着 4177，
    // playwright 的 reuseExistingServer 会撞上并测成对方的 app（M2 踩过）
    port: 4180,
    strictPort: true,
    host: '127.0.0.1',
  },
})
