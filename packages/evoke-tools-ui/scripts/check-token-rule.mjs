#!/usr/bin/env node
/**
 * G1 令牌门 — tools-ui 的命名空间与回流铁律（tools-ui 计划 06 §一 G1）
 *
 * 规则：
 *   ① 禁第三方令牌/类名/组件名前缀（--el-* / el-* / El*）
 *   ② 禁裸色值（#rrggbb / rgb() / hsl() / color-mix() 里的字面色值）——
 *      只准出现在令牌定义文件（src/styles/variables.css 与 dark.css）
 *   ③ var(--et-xxx) 不带 fallback 时，--et-xxx 必须在本包某处有定义
 *   ④ 禁办公语义回流：--ot-* 令牌、以及 cell / sheet / formula / canvas-grid
 *      等办公语义名出现在自定义属性名里（--et-* 是工具框架层，不认识办公语义）
 *   ⑤ 禁兄弟库命名空间回流（--ev-* / --ew-* / Ev* / Ew* / ev-* / ew-*）
 *   ⑥ 消费的底座令牌 var(--eb-xxx) 必须真实存在于 business-ui 样式源码
 *      （monorepo 内可读；独立安装场景读不到则跳过并说明）
 *   ⑦ import 边界：只允许 vue / @wil-works/evoke-business-ui / 相对路径 / 自引用
 *   ⑧ package.json 依赖白名单：peer = vue + 底座；dependencies 为空（框架层零运行时依赖）
 *
 * 范围：src/ + test/（规则 ② 只扫 src/：测试断言允许使用字面色值）
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

/** 允许出现裸色值的文件（令牌定义位） */
const TOKEN_DEFINITION_FILES = [
  resolve(pkgRoot, 'src/styles/variables.css'),
  resolve(pkgRoot, 'src/styles/dark.css'),
]

/** 办公语义回流黑名单（tools-ui 计划 03 §一 回流禁令；命中自定义属性名即违规） */
const OFFICE_SEMANTIC_WORDS = ['cell', 'sheet', 'formula', 'canvas-grid', 'spreadsheet']

/** 允许被引用的裸模块（相对路径另算） */
const ALLOWED_MODULES = [
  /^vue($|\/)/,
  /^@wil-works\/evoke-business-ui($|\/)/,
  // 自引用：只出现在头部用法注释里
  /^@wil-works\/evoke-tools-ui($|\/)/,
]

const ALLOWED_TEST_MODULES = [/^vitest($|\/)/, /^@vue\/test-utils($|\/)/, /^node:/]

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

/** 裸色值：#hex / rgb() / hsl() / hwb() / oklch()（透明关键字除外） */
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|oklch|lab|lch)\(/;

const violations = []
const files = ROOTS.flatMap(walk)

for (const file of files) {
  const isTest = /[\\/]test[\\/]/.test(file)
  const allowed = isTest ? [...ALLOWED_MODULES, ...ALLOWED_TEST_MODULES] : ALLOWED_MODULES
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const at = `${file}:${i + 1}`
    const snippet = line.trim().slice(0, 100)
    // ① 第三方
    if (/--el-/.test(line)) violations.push(`${at}  出现第三方 --el-* 令牌: ${snippet}`)
    if (/\bel-[a-z][a-z0-9]*(-[a-z0-9]+)*/.test(line)) violations.push(`${at}  出现第三方 el-* 类名: ${snippet}`)
    if (/\bEl[A-Z]/.test(line)) violations.push(`${at}  出现第三方 El* 组件命名: ${snippet}`)
    // ④ 办公语义回流（先于兄弟库检查：--ot-* 与语义词都拦）
    if (/--ot-[a-z]/.test(line)) violations.push(`${at}  出现办公语义 --ot-* 令牌（反向回流）: ${snippet}`)
    if (/\bot-[a-z][a-z0-9]*(-[a-z0-9]+)*/.test(line)) violations.push(`${at}  出现 ot-* 命名（办公语义回流）: ${snippet}`)
    // ⑤ 兄弟库回流
    if (/--ev-[a-z]/.test(line)) violations.push(`${at}  出现兄弟库 --ev-* 令牌（应使用 --et-*）: ${snippet}`)
    if (/--ew-[a-z]/.test(line)) violations.push(`${at}  出现兄弟库 --ew-* 令牌（应使用 --et-*）: ${snippet}`)
    if (/(?<![\w-])ev-[a-z][a-z0-9]*(-[a-z0-9]+)*/.test(line)) violations.push(`${at}  出现 ev-* 命名（应使用 et-*）: ${snippet}`)
    if (/(?<![\w-])ew-[a-z][a-z0-9]*(-[a-z0-9]+)*/.test(line)) violations.push(`${at}  出现 ew-* 命名（应使用 et-*）: ${snippet}`)
    if (/\bEv[A-Z]/.test(line)) violations.push(`${at}  出现 Ev* 组件命名（应使用 Et* / Eb*）: ${snippet}`)
    if (/\bEw[A-Z]/.test(line)) violations.push(`${at}  出现 Ew* 组件命名（应使用 Et* / Eb*）: ${snippet}`)
    // ⑦ import 边界
    for (const m of line.matchAll(/(?:from\s+|import\()\s*['"]([^'"]+)['"]/g)) {
      const spec = m[1]
      if (spec.startsWith('.') || spec.startsWith('/')) continue
      if (allowed.some((re) => re.test(spec))) continue
      violations.push(`${at}  import 越界（只允许 vue / 底座 / 相对路径）: ${spec}`)
    }
  })

  // ② 裸色值（只扫 src/；令牌定义文件豁免）
  if (!isTest && !TOKEN_DEFINITION_FILES.includes(file)) {
    const src = readFileSync(file, 'utf8')
    src.split('\n').forEach((line, i) => {
      if (RAW_COLOR.test(line)) {
        violations.push(`${file}:${i + 1}  出现裸色值（令牌只准定义在 src/styles/variables.css）: ${line.trim().slice(0, 80)}`)
      }
    })
  }

  // ④-b 办公语义词不得进入自定义属性名（注释里出现不拦：只查属性声明与引用）
  const src = readFileSync(file, 'utf8')
  for (const word of OFFICE_SEMANTIC_WORDS) {
    const propRe = new RegExp(`--[a-z0-9-]*${word}[a-z0-9-]*\\s*:`, 'g')
    for (const _ of src.matchAll(propRe)) {
      violations.push(`${file}  自定义属性名含办公语义「${word}」（--et-* 回流禁令）`)
      break
    }
  }
}

// ── 规则 ③：--et-* 引用完整性 ──
{
  const defined = new Set()
  const usedNoFallback = []
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/(--et-[a-z0-9-]+)['"]?\s*:/g)) defined.add(m[1])
    for (const m of src.matchAll(/var\((--et-[a-z0-9-]+)\)/g)) usedNoFallback.push({ file, name: m[1] })
  }
  for (const { file, name } of usedNoFallback) {
    if (!defined.has(name)) {
      violations.push(`${file}  var(${name}) 无 fallback 且本包未定义 — 相关声明会整体失效`)
    }
  }
}

// ── 规则 ⑥：底座令牌引用完整性 ──
{
  const baseStyles = ['variables.css', 'dark.css'].map((f) =>
    resolve(pkgRoot, '../evoke-business-ui/src/styles', f),
  )
  const readable = baseStyles.filter((p) => existsSync(p))
  if (!readable.length) {
    console.log('[check-token-rule] 未找到底座样式源码（独立仓场景），跳过底座令牌存在性检查')
  } else {
    const baseDefined = new Set()
    for (const p of readable) {
      for (const m of readFileSync(p, 'utf8').matchAll(/(--eb-[a-z0-9-]+)\s*:/g)) baseDefined.add(m[1])
    }
    const localDefined = new Set()
    for (const file of files) {
      for (const m of readFileSync(file, 'utf8').matchAll(/(--eb-[a-z0-9-]+)['"]?\s*:/g)) localDefined.add(m[1])
    }
    for (const file of files) {
      for (const m of readFileSync(file, 'utf8').matchAll(/var\((--eb-[a-z0-9-]+)\)/g)) {
        const name = m[1]
        if (!baseDefined.has(name) && !localDefined.has(name)) {
          violations.push(`${file}  var(${name}) 无 fallback 且底座与本包均未定义 — 相关声明会整体失效`)
        }
      }
    }
  }
}

// ── 规则 ⑧：依赖白名单 ──
{
  const pkg = JSON.parse(readFileSync(PKG, 'utf8'))
  const depKeys = Object.keys({
    ...pkg.dependencies,
    ...pkg.peerDependencies,
    ...pkg.devDependencies,
  })
  // 框架层零第三方运行时依赖；工具链依赖显式登记
  const DEP_ALLOWLIST =
    /^(vue|@wil-works\/evoke-business-ui|vite|@vitejs\/plugin-vue|@vue\/compiler-sfc|typescript|vue-tsc)$/
  for (const key of depKeys) {
    if (!DEP_ALLOWLIST.test(key)) {
      violations.push(`package.json  依赖不在白名单（禁引入第三方组件库/运行时依赖）: ${key}`)
    }
  }
  const runtimeDeps = Object.keys(pkg.dependencies || {})
  if (runtimeDeps.length > 0) {
    violations.push(
      `package.json  dependencies 应为空（business-ui 走 peerDependencies，保证宿主单实例）: ${runtimeDeps.join(', ')}`,
    )
  }
}

if (violations.length) {
  console.error(`[check-token-rule] 违反令牌与回流铁律，共 ${violations.length} 处：`)
  for (const v of violations) console.error('  ' + v)
  console.error('\n铁律：--et-* 只准引用 --eb-*；禁办公语义回流、禁裸色值、禁第三方前缀。')
  process.exit(1)
}

console.log('[check-token-rule] 通过：令牌纯度 + 回流禁令 + 引用完整 + 依赖白名单')
