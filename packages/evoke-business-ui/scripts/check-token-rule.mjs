#!/usr/bin/env node
/**
 * 铁律检查 — 本库与第三方组件库完全隔离，与兄弟库命名空间互不回流
 *
 * 规则：
 *   1. 源码（src/）禁止出现第三方令牌命名空间（--el-* 等，统一使用 --eb-*）
 *   2. 源码禁止第三方类名/组件名前缀（el-* / El*，import / 字符串 / 注释均不允许）
 *   3. 源码禁止兄弟库命名空间回流（--ev-* / Ev* / ev-* / --ew-* / Ew* / ew-*）
 *      豁免：图表适配层 —— 含 'evoke-charts' 的依赖行，以及 --ev-*: var(--eb-*) 映射行
 *   4. package.json 依赖白名单制（dependencies / peerDependencies / devDependencies），
 *      禁止引入第三方组件库（evoke-charts 图表包除外）
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

// 图表适配豁免：依赖导入行、EbChart 别名行、图表换肤事件、系列色契约
function isChartAdapterExempt(line) {
  if (line.includes('evoke-charts')) return true
  if (line.includes('EvChart') && line.includes('EbChart')) return true
  // 双注册名兜底契约：<ev-chart> 与 <eb-chart> 同行共测（EvChart 为 EbChart 别名取值）
  if (line.includes('ev-chart') && line.includes('eb-chart')) return true
  // 图表系列色槽位：主题宿主向 evoke-charts 写入的数据色板契约（DESIGN.md §2.1）
  if (line.includes('--ev-color-series-')) return true
  // EvChart 组件名：注册表键（EvChart: EvChart）与组件名查表（app.component('EvChart')）
  if (/EvChart\s*:/.test(line) || /['"`]EvChart['"`]/.test(line)) return true
  return line.includes('ev-theme-change')
}

// --ev-* 令牌仅放行真实映射行：--ev-xxx: var(--eb-xxx) 成对
// （「同行出现两前缀即豁免」过宽，会连带放过混入同一行的其他违规）
function isEvTokenAdapterLine(line) {
  return /--ev-[a-z0-9-]+\s*:\s*var\(--eb-[a-z0-9-]+\)/.test(line)
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
      if (/--ev-[a-z]/.test(line) && !isEvTokenAdapterLine(line)) violations.push(`${file}:${i + 1}  出现兄弟库 --ev-* 令牌（应使用 --eb-*；图表适配行仅放行 --ev-*: var(--eb-*) 映射）: ${line.trim().slice(0, 100)}`)
      // 单段裸类名（如 ev-icon）同样拦截，与 el-* 同口径；
      // 负向环视排除 --ev-/--ew- 令牌尾巴（'-' 是非词字符，\b 会误咬）
      if (/(?<![\w-])ev-[a-z][a-z0-9]*(-[a-z0-9]+)*/.test(line)) violations.push(`${file}:${i + 1}  出现兄弟库 ev-* 命名（应使用 eb-*）: ${line.trim().slice(0, 100)}`)
      if (/\bEv[A-Z]/.test(line)) violations.push(`${file}:${i + 1}  出现兄弟库 Ev* 组件命名（应使用 Eb*）: ${line.trim().slice(0, 100)}`)
      if (/--ew-[a-z]/.test(line)) violations.push(`${file}:${i + 1}  出现兄弟库 --ew-* 令牌（应使用 --eb-*）: ${line.trim().slice(0, 100)}`)
      if (/(?<![\w-])ew-[a-z][a-z0-9]*(-[a-z0-9]+)*/.test(line)) violations.push(`${file}:${i + 1}  出现兄弟库 ew-* 类名（应使用 eb-*）: ${line.trim().slice(0, 100)}`)
      if (/\bEw[A-Z]/.test(line)) violations.push(`${file}:${i + 1}  出现兄弟库 Ew* 组件命名: ${line.trim().slice(0, 100)}`)
    }
  })
}

const pkg = JSON.parse(readFileSync(PKG, 'utf8'))
// devDependencies 同入白名单：构建链依赖也须显式登记，防止从 dev 侧溜进第三方组件库
const depKeys = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies, ...pkg.devDependencies })
// 依赖白名单：新增依赖必须显式登记，第三方组件库永远进不来
// 对话家族拆去 @wil-works/evoke-chat 后，marked / highlight.js 已不属本库
const DEP_ALLOWLIST = /^(@floating-ui\/dom|@wil-works\/evoke-charts|async-validator|dayjs|vue|vite|@vitejs\/plugin-vue|@vue\/compiler-sfc|remixicon|typescript|vue-tsc)$/
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
