#!/usr/bin/env node
/**
 * 铁律检查 — 本库命名空间隔离
 *
 * 规则：
 *   1. 源码（src/）禁止出现 --el-* / --ev-* 令牌命名（统一使用 --ew-*）
 *   2. 源码禁止第三方组件库引用与跨库引用（evoke-business-ui）（import / 字符串 / 注释均不允许）
 *   3. package.json 禁止声明上述相关依赖
 *   4. var(--ew-xxx) 不带 fallback 时，--ew-xxx 必须在库内某处有定义
 *
 * 用法: node scripts/check-token-rule.mjs （已挂入 build，违规即构建失败）
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(__dirname, '../src')
const PKG = resolve(__dirname, '../package.json')

const EXTS = new Set(['.vue', '.js', '.mjs', '.ts', '.css', '.scss'])
const SKIP_DIRS = new Set(['node_modules', 'dist'])

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

for (const file of walk(SRC)) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (/--el-/.test(line)) violations.push(`${file}:${i + 1}  出现 --el-* 令牌（应使用 --ew-*）: ${line.trim().slice(0, 100)}`)
    if (/--ev-/.test(line)) violations.push(`${file}:${i + 1}  出现 --ev-* 令牌（应使用 --ew-*）: ${line.trim().slice(0, 100)}`)
    if (/\bel-[a-z]{2,}(-|__)/.test(line)) violations.push(`${file}:${i + 1}  出现第三方 el-* 类名: ${line.trim().slice(0, 100)}`)
    if (/evoke-business-ui/i.test(line)) violations.push(`${file}:${i + 1}  出现 evoke-business-ui 引用（两库完全隔离）: ${line.trim().slice(0, 100)}`)
  })
}

const pkg = JSON.parse(readFileSync(PKG, 'utf8'))
const depKeys = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })
// 运行时依赖白名单：仅允许 Vue 本体，新增依赖必须显式登记
const DEP_ALLOWLIST = /^(vue|@wil-works\/)$/
for (const key of depKeys) {
  if (!DEP_ALLOWLIST.test(key) && !key.startsWith('@wil-works/')) {
    violations.push(`package.json  依赖不在白名单（禁止第三方/跨库依赖）: ${key}`)
  }
}

// ── 规则 4：令牌引用完整性 ──
// var(--ew-xxx) 不带 fallback 时，--ew-xxx 必须在库内某处有定义
// （CSS 声明 / JS style 绑定对象键 / 模板内联样式均算定义点）
{
  const files = walk(SRC)
  const defined = new Set()
  const usedNoFallback = []
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/(--ew-[a-z0-9-]+)['"]?\s*:/g)) defined.add(m[1])
    for (const m of src.matchAll(/var\((--ew-[a-z0-9-]+)\)/g)) usedNoFallback.push({ file, name: m[1] })
  }
  for (const { file, name } of usedNoFallback) {
    if (!defined.has(name)) {
      violations.push(`${file}  var(${name}) 无 fallback 且全库未定义 — 相关声明会整体失效`)
    }
  }
}

if (violations.length) {
  console.error(`[check-token-rule] 违反隔离铁律，共 ${violations.length} 处：`)
  for (const v of violations) console.error('  ' + v)
  console.error('\n铁律：本库独立命名空间。CSS 令牌一律使用 --ew-* 前缀，禁止第三方与跨库引用。')
  process.exit(1)
}

console.log('[check-token-rule] 通过：源码仅使用 --ew-* 令牌，无跨库引用/依赖')
