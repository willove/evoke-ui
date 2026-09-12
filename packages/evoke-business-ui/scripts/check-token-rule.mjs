#!/usr/bin/env node
/**
 * 铁律检查 — 本库与第三方组件库完全隔离，与兄弟库命名空间互不回流
 *
 * 规则：
 *   1. 源码（src/）禁止出现第三方令牌命名空间（--el-* 等，统一使用 --eb-*）
 *   2. 源码禁止第三方类名/组件名前缀（el-* / El*，import / 字符串 / 注释均不允许）
 *   3. 源码禁止兄弟库命名空间回流（--ev-* / Ev* / ev-* / --ew-* / Ew*）
 *      豁免：图表适配层 —— 含 'evoke-charts' 的依赖行，以及 --ev-* 与 --eb-* 成对出现的适配行
 *   4. package.json 运行时依赖白名单制，禁止引入第三方组件库（evoke-charts 图表包除外）
 *   5. 令牌引用完整性：var(--eb-xxx) 不带 fallback 时，--eb-xxx 必须在库内某处有定义
 *
 * 范围：src/ + test/ + 示例工程（examples/，历史曾在示例页漏网 el-* 类名）
 *
 * 用法: node scripts/check-token-rule.mjs （已挂入 build，违规即构建失败）
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOTS = [
  resolve(__dirname, '../src'),
  resolve(__dirname, '../test'),
  resolve(__dirname, '../../examples'),
].filter((p) => existsSync(p))
const PKG = resolve(__dirname, '../package.json')

const EXTS = new Set(['.vue', '.js', '.mjs', '.ts', '.css', '.scss'])
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage'])

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (EXTS.has(extname(p))) out.push(p)
  }
  return out
}

// 图表适配豁免：依赖导入行、--ev-*/--eb-* 成对的适配映射行、EbChart 别名行、图表换肤事件
function isChartAdapterExempt(line) {
  if (line.includes('evoke-charts')) return true
  if (line.includes('--ev-') && line.includes('--eb-')) return true
  if (line.includes('EvChart') && line.includes('EbChart')) return true
  // 图表系列色槽位：主题宿主向 evoke-charts 写入的数据色板契约（DESIGN.md §2.1）
  if (line.includes('--ev-color-series-')) return true
  return line.includes('ev-theme-change')
}

const violations = []

const files = ROOTS.flatMap(walk)
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (/--el-/.test(line)) violations.push(`${file}:${i + 1}  出现第三方 --el-* 令牌（应使用 --eb-*）: ${line.trim().slice(0, 100)}`)
    if (/\bel-[a-z][a-z0-9]*(-[a-z0-9]+)*/.test(line)) violations.push(`${file}:${i + 1}  出现第三方 el-* 类名: ${line.trim().slice(0, 100)}`)
    if (/\bEl[A-Z]/.test(line)) violations.push(`${file}:${i + 1}  出现第三方 El* 组件命名: ${line.trim().slice(0, 100)}`)
    if (!isChartAdapterExempt(line)) {
      if (/--ev-[a-z]/.test(line)) violations.push(`${file}:${i + 1}  出现兄弟库 --ev-* 令牌（应使用 --eb-*；图表适配行需与 --eb-* 成对）: ${line.trim().slice(0, 100)}`)
      if (/ev-[a-z][a-z-]*-|EvChart|\bEv[A-Z]/.test(line)) violations.push(`${file}:${i + 1}  出现兄弟库 ev-*/Ev* 命名（应使用 eb-*/Eb*）: ${line.trim().slice(0, 100)}`)
      if (/--ew-[a-z]/.test(line)) violations.push(`${file}:${i + 1}  出现兄弟库 --ew-* 令牌（应使用 --eb-*）: ${line.trim().slice(0, 100)}`)
      if (/\bEw[A-Z]/.test(line)) violations.push(`${file}:${i + 1}  出现兄弟库 Ew* 组件命名: ${line.trim().slice(0, 100)}`)
    }
  })
}

const pkg = JSON.parse(readFileSync(PKG, 'utf8'))
const depKeys = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })
// 运行时依赖白名单：新增依赖必须显式登记，第三方组件库永远进不来
const DEP_ALLOWLIST = /^(@floating-ui\/dom|@wil-works\/evoke-charts|async-validator|dayjs|highlight\.js|marked|vue)$/
for (const key of depKeys) {
  if (!DEP_ALLOWLIST.test(key)) violations.push(`package.json  依赖不在白名单（禁止引入第三方组件库）: ${key}`)
}

// ── 规则 5：令牌引用完整性 ──
// var(--eb-xxx) 不带 fallback 时，--eb-xxx 必须在库内某处有定义
// （CSS 声明 / JS style 绑定对象键 / 模板内联样式均算定义点）
{
  const defined = new Set()
  const usedNoFallback = []
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/(--eb-[a-z0-9-]+)['"]?\s*:/g)) defined.add(m[1])
    for (const m of src.matchAll(/var\((--eb-[a-z0-9-]+)\)/g)) usedNoFallback.push({ file, name: m[1] })
  }
  for (const { file, name } of usedNoFallback) {
    if (!defined.has(name)) {
      violations.push(`${file}  var(${name}) 无 fallback 且全库未定义 — 边框/阴影等声明会整体失效`)
    }
  }
}

if (violations.length) {
  console.error(`[check-token-rule] 违反隔离铁律，共 ${violations.length} 处：`)
  for (const v of violations) console.error('  ' + v)
  console.error('\n铁律：本库与第三方组件库完全隔离。CSS 令牌一律使用 --eb-* 前缀，禁止引入第三方依赖或命名。')
  process.exit(1)
}

console.log('[check-token-rule] 通过：源码无第三方/跨库令牌与命名，依赖符合白名单')
