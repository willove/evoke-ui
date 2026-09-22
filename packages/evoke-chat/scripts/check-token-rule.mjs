#!/usr/bin/env node
/**
 * 铁律检查 — evoke-chat 的命名空间与依赖边界
 *
 * 规则：
 *   1. 令牌纯度：禁止 --el-* / --ev-* / --ew-* 与 el-* 类名（本包只消费底座的 --eb-*）
 *   2. 依赖边界：源码只允许 import 相对路径 / vue / @wil-works/evoke-business-ui /
 *      marked / highlight.js —— 其它一律视为越界（含再引别的实现或第三方库）
 *   3. 令牌引用完整性：var(--eb-xxx) 不带 fallback 时，--eb-xxx 必须在底座样式里有定义
 *      （底座源码在 monorepo 内可读；读不到则跳过该规则并打印说明）
 *   4. package.json 依赖白名单：peer = vue + 底座，dependencies = marked + highlight.js
 *
 * 范围：src/ + test/
 *
 * 用法: node scripts/check-token-rule.mjs （已挂入 build，违规即构建失败）
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const ROOTS = [resolve(pkgRoot, 'src'), resolve(pkgRoot, 'test')].filter((p) => existsSync(p))
const PKG = resolve(pkgRoot, 'package.json')

const EXTS = new Set(['.vue', '.js', '.mjs', '.ts', '.css', '.scss'])
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage'])

/** 运行时允许被引用的裸模块（相对路径另算） */
const ALLOWED_MODULES = [
  /^vue($|\/)/,
  /^@wil-works\/evoke-business-ui($|\/)/,
  /^marked($|\/)/,
  /^highlight\.js($|\/)/,
  // 自引用：只出现在头部用法注释里（`import EvokeChat from '@wil-works/evoke-chat'`）
  /^@wil-works\/evoke-chat($|\/)/,
]

/** 测试额外允许：测试框架、断言工具、node 内建 */
const ALLOWED_TEST_MODULES = [
  /^vitest($|\/)/,
  /^@vue\/test-utils($|\/)/,
  /^node:/,
]

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
  const isTest = /[\\/]test[\\/]/.test(file)
  const allowed = isTest ? [...ALLOWED_MODULES, ...ALLOWED_TEST_MODULES] : ALLOWED_MODULES
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const at = `${file}:${i + 1}`
    if (/--el-/.test(line)) violations.push(`${at}  出现 --el-* 令牌（应使用 --eb-*）: ${line.trim().slice(0, 100)}`)
    if (/--ev-/.test(line)) violations.push(`${at}  出现 --ev-* 令牌（兄弟库命名，应使用 --eb-*）: ${line.trim().slice(0, 100)}`)
    if (/--ew-/.test(line)) violations.push(`${at}  出现旧 --ew-* 令牌（应使用 --eb-*）: ${line.trim().slice(0, 100)}`)
    if (/\bel-[a-z][a-z0-9]*(-[a-z0-9]+)*/.test(line)) violations.push(`${at}  出现第三方 el-* 类名: ${line.trim().slice(0, 100)}`)
    // 静态 import / 动态 import / 再导出三种形态都查
    for (const m of line.matchAll(/(?:from\s+|import\()\s*['"]([^'"]+)['"]/g)) {
      const spec = m[1]
      if (spec.startsWith('.') || spec.startsWith('/')) continue
      if (allowed.some((re) => re.test(spec))) continue
      violations.push(`${at}  import 越界（只允许 vue / 底座 / marked / highlight.js）: ${spec}`)
    }
  })
}

const pkg = JSON.parse(readFileSync(PKG, 'utf8'))
const ALLOWED_DEPS = /^(marked|highlight\.js)$/
for (const key of Object.keys(pkg.dependencies || {})) {
  if (!ALLOWED_DEPS.test(key)) violations.push(`package.json  dependencies 不在白名单（应随包走的只有 marked / highlight.js）: ${key}`)
}
for (const key of Object.keys(pkg.peerDependencies || {})) {
  if (!/^(vue|@wil-works\/evoke-business-ui)$/.test(key)) violations.push(`package.json  peerDependencies 不在白名单（底座 + vue）: ${key}`)
}

// ── 规则 3：消费的底座令牌必须真实存在 ──
{
  const baseStyles = ['variables.css', 'dark.css'].map((f) =>
    resolve(pkgRoot, '../evoke-business-ui/src/styles', f),
  )
  const readable = baseStyles.filter((p) => existsSync(p))
  if (!readable.length) {
    console.log('[check-token-rule] 未找到底座样式源码（独立仓/独立安装场景），跳过令牌存在性检查')
  } else {
    const defined = new Set()
    for (const p of readable) {
      for (const m of readFileSync(p, 'utf8').matchAll(/(--eb-[a-z0-9-]+)\s*:/g)) defined.add(m[1])
    }
    const localDefined = new Set()
    for (const file of files) {
      for (const m of readFileSync(file, 'utf8').matchAll(/(--eb-[a-z0-9-]+)['"]?\s*:/g)) localDefined.add(m[1])
    }
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/var\((--eb-[a-z0-9-]+)\)/g)) {
        const name = m[1]
        if (!defined.has(name) && !localDefined.has(name)) {
          violations.push(`${file}  var(${name}) 无 fallback 且底座与本包均未定义 — 相关声明会整体失效`)
        }
      }
    }
  }
}

if (violations.length) {
  console.error(`[check-token-rule] 违反本包边界约定，共 ${violations.length} 处：`)
  for (const v of violations) console.error('  ' + v)
  console.error('\n约定：只消费底座 --eb-* 令牌与 Eb* 组件；marked / highlight.js 是仅有的随包依赖。')
  process.exit(1)
}

console.log('[check-token-rule] 通过：令牌纯度 + 依赖边界 + 底座令牌引用完整')
