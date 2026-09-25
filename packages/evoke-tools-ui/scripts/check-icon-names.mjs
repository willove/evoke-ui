#!/usr/bin/env node
/**
 * G2 图标名门 — 悬空图标名 = 构建失败（tools-ui 计划 06 §一 G2 / 04 §四）
 *
 * 上一代实测缺陷：功能区「插入列 / 删除列」两个按钮渲染为 38×24 纯白方块
 * （EbIcon 对未命中名静默渲染空 <i>，无告警）；全仓 150 个功能区按钮 71 个没有图标。
 * 本门把"名字必须在注册表里存在"做成构建期硬检查：
 *
 *   - 提取范围：src/ 的 .vue 模板与 .js（命令表/菜单 schema 的数据字段都算）
 *   - 提取形态：name="x" / :name="'x'" / icon="x" / icon: 'x'（仅 et-icon / EbIcon /
 *     et-tool-button / et-tool-group 等本库组件的图标字段）
 *   - 已知名集合：business-ui 内置集（remix-svg-paths.js）+ 全量集（remix-full-paths.js）
 *     + 元数据（remix-meta.js）；custom: 前缀直通（消费方运行时注册，静态不可判）
 *   - 领域别名（第 ③ 层）由形态包运行时登记，本门只判"别名目标是否存在"：
 *     若名字本身不在语义集但已登记别名（读不到——别名在消费方），由消费方仓的
 *     同名门覆盖；本包内出现即视为悬空。
 *
 * 用法: node scripts/check-icon-names.mjs （已挂入 build，违规即构建失败）
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const SRC = resolve(pkgRoot, 'src')
const BASE_ICON_DIR = resolve(pkgRoot, '../evoke-business-ui/src/components/icon')

const EXTS = new Set(['.vue', '.js', '.mjs', '.ts'])
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', 'test'])

function walk(dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (EXTS.has(extname(p))) out.push(p)
  }
  return out
}

/** business-ui 图标名全集（静态读取，避免 node 解析不了 vue ESM 依赖） */
function loadKnownIconNames() {
  const names = new Set()
  const builtinPath = join(BASE_ICON_DIR, 'remix-svg-paths.js')
  const fullPath = join(BASE_ICON_DIR, 'remix-full-paths.js')
  const metaPath = join(BASE_ICON_DIR, 'remix-meta.js')
  if (existsSync(builtinPath)) {
    const src = readFileSync(builtinPath, 'utf8')
    for (const m of src.matchAll(/^\s{1}"([a-z0-9-]+)":\s*\{/gm)) names.add(m[1])
  }
  if (existsSync(fullPath)) {
    const src = readFileSync(fullPath, 'utf8')
    for (const m of src.matchAll(/"([a-z0-9-]+)":/g)) names.add(m[1])
  }
  if (existsSync(metaPath)) {
    const src = readFileSync(metaPath, 'utf8')
    for (const m of src.matchAll(/^\s{2}"?([a-z0-9-]+)"?\s*:\s*\{/gm)) names.add(m[1])
  }
  if (names.size === 0) {
    console.error('[check-icon-names] 未读到 business-ui 图标数据（remix-*.js），无法校验')
    process.exit(1)
  }
  return names
}

/** 候选图标名提取：只认本库/底座图标字段，避免把普通 prop 当图标名误杀
 *  三种形态齐抓：
 *    ① name="x" / icon="x"                 —— 模板静态属性
 *    ② name: 'x' / icon: 'x'               —— JS 数据字段（命令表/菜单 schema）
 *    ③ :name="'x'" / :icon="'x'"           —— 绑定里写字面量（外层引号包内层引号） */
const ICON_ATTR_PATTERNS = [
  /\b(?:name|icon)\s*=\s*['"]([a-z0-9][a-z0-9:-]*)['"]/g,
  /\b(?:name|icon)\s*:\s*['"]([a-z0-9][a-z0-9:-]*)['"]/g,
  /\b(?:name|icon)\s*=\s*['"]\s*['"]([a-z0-9][a-z0-9:-]*)['"]\s*['"]/g,
]

/** 非图标值黑名单（这些值会是 name/icon 字段的合法非图标取值） */
const NON_ICON_VALUES = new Set([
  'horizontal', 'vertical', 'small', 'large', 'medium', 'top', 'bottom',
  'left', 'right', 'center', 'start', 'end', 'true', 'false', 'undefined',
  'null', 'default', 'dark', 'light', 'hover', 'click', 'focus', 'manual',
])

const known = loadKnownIconNames()
const dangling = []

for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8')
  src.split('\n').forEach((rawLine, i) => {
    // <slot name="documents"> 之类：slot 的 name 与图标 name 同名不同义，
    // 先把整行里的 slot 标签剥掉再抽候选（槽名不是图标名）
    const line = rawLine.replace(/<slot\b[^>]*>/g, '').replace(/<\/slot>/g, '')
    for (const pattern of ICON_ATTR_PATTERNS) {
      for (const m of line.matchAll(pattern)) {
        const value = m[1]
        if (NON_ICON_VALUES.has(value)) continue
        if (value.startsWith('custom:')) continue // 运行时注册，静态不可判
        if (!known.has(value)) {
          dangling.push(`${file}:${i + 1}  图标名未注册：${value}`)
        }
      }
    }
  })
}

if (dangling.length) {
  console.error(`[check-icon-names] 悬空图标名共 ${dangling.length} 处（上一代白块按钮缺陷的根因）：`)
  for (const d of dangling) console.error('  ' + d)
  console.error(
    '\n修复：在 business-ui generate-remix-icons.mjs 的 MAPPING 登记后重新生成，或改用已注册语义名。',
  )
  process.exit(1)
}

console.log(`[check-icon-names] 通过：src/ 图标名全部在注册表中（已知名 ${known.size} 个）`)
