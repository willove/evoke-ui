#!/usr/bin/env node
/**
 * 铁律检查 — 本库与第三方组件库及其他 Evoke 库完全隔离
 *
 * 规则：
 *   1. 源码（src/）禁止出现第三方令牌命名空间（--el-* 等，统一使用 --ev-*）
 *   2. 源码禁止第三方类名/组件名前缀（el-* / El*，import / 字符串 / 注释均不允许）
 *   3. 源码禁止其他 Evoke 库的命名空间回流（--ec-* / EcChart / ec-chart / --ew-* / Ew*）
 *   4. package.json 运行时依赖白名单制，禁止引入第三方组件库
 *   5. 令牌引用完整性：var(--ev-xxx) 不带 fallback 时，--ev-xxx 必须在库内某处有定义
 *
 * 规则 4 是三维能力路线的硬约束：白名单只放行 vue，
 * 因此本库的三维渲染必须是自绘投影管线，不能引入 WebGL 封装库。
 *
 * 范围：src/ + test/
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

const violations = []

const files = ROOTS.flatMap(walk)
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (/--el-/.test(line)) violations.push(`${file}:${i + 1}  出现第三方 --el-* 令牌（应使用 --ev-*）: ${line.trim().slice(0, 100)}`)
    if (/\bel-[a-z][a-z0-9]*(-[a-z0-9]+)*/.test(line)) violations.push(`${file}:${i + 1}  出现第三方 el-* 类名: ${line.trim().slice(0, 100)}`)
    if (/\bEl[A-Z]/.test(line)) violations.push(`${file}:${i + 1}  出现第三方 El* 组件命名: ${line.trim().slice(0, 100)}`)
    // 其他 Evoke 库的命名空间不得回流进本库（ev 是本库唯一命名空间）
    if (/--ec-[a-z]/.test(line)) violations.push(`${file}:${i + 1}  出现其他库 --ec-* 令牌（应使用 --ev-*）: ${line.trim().slice(0, 100)}`)
    if (/ec-chart|EcChart/.test(line)) violations.push(`${file}:${i + 1}  出现其他库组件/类名命名（应使用 EvChart3d / ev-chart3d）: ${line.trim().slice(0, 100)}`)
    if (/--ew-[a-z]/.test(line)) violations.push(`${file}:${i + 1}  出现其他库 --ew-* 令牌（应使用 --ev-*）: ${line.trim().slice(0, 100)}`)
    if (/\bEw[A-Z]/.test(line)) violations.push(`${file}:${i + 1}  出现其他库 Ew* 组件命名: ${line.trim().slice(0, 100)}`)
  })
}

const pkg = JSON.parse(readFileSync(PKG, 'utf8'))
const depKeys = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })
// 运行时依赖白名单：新增依赖必须显式登记，第三方组件库永远进不来
const DEP_ALLOWLIST = /^(vue)$/
for (const key of depKeys) {
  if (!DEP_ALLOWLIST.test(key)) violations.push(`package.json  依赖不在白名单（禁止引入第三方组件库）: ${key}`)
}

// ── 规则 5：令牌引用完整性 ──
// var(--ev-xxx) 不带 fallback 时，--ev-xxx 必须在库内某处有定义
// （CSS 声明 / JS style 绑定对象键 / 模板内联样式均算定义点）
{
  const defined = new Set()
  const usedNoFallback = []
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/(--ev-[a-z0-9-]+)['"]?\s*:/g)) defined.add(m[1])
    for (const m of src.matchAll(/var\((--ev-[a-z0-9-]+)\)/g)) usedNoFallback.push({ file, name: m[1] })
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
  console.error('\n铁律：本库与第三方组件库及其他 Evoke 库完全隔离。CSS 令牌一律使用 --ev-* 前缀，禁止引入第三方依赖或命名。')
  process.exit(1)
}

console.log('[check-token-rule] 通过：源码无第三方/跨库令牌与命名，依赖符合白名单')
