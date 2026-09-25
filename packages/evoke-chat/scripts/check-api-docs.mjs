/**
 * 文档 API 与源码一致性校验
 *
 * 现状（已知缺口）：文档覆盖门只保证「组件名字在文档里出现过」，props / events 漏写或
 * 写错不会红——新增一个 prop 忘了写文档，门是绿的。本脚本把那句话变成判定：
 *
 *   从每个导出组件的 SFC 里抽 props / emits / expose 的名字，
 *   再到 docs 全文里找同名（camelCase 或 kebab-case 都算），缺谁报谁。
 *
 * 口径说明：
 *   - 只圈本包导出面（与 chat-docs-coverage 同边界），不追求全站
 *   - expose（实例方法）默认只报不判：文档里实例方法多为叙述式，逐个要求会变成噪音
 *   - 名字在文档任意位置出现即算过；「写错参数说明」不在此门范围（那是人审的事）
 *
 * 用法：node scripts/check-api-docs.mjs [--report]
 *   --report 只打印不失败（用于评估存量缺口）
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const repoRoot = resolve(pkgRoot, '../..')
const reportOnly = process.argv.includes('--report')

const srcIndex = readFileSync(join(pkgRoot, 'src/index.js'), 'utf8')

/** 抽出「组件名 → 源文件」 */
function componentEntries() {
  const out = []
  for (const m of srcIndex.matchAll(/import (Eb[A-Za-z0-9]+) from ["'](\.\/components\/[^"']+\.vue)["']/g)) {
    out.push({ name: m[1], file: join(pkgRoot, 'src', m[2].replace(/^\.\//, '')) })
  }
  return out
}

function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** 取 `defineXxx(` 的括号内容（按括号配对，跳过字符串里的括号） */
function callBody(source, callee) {
  const start = source.indexOf(`${callee}(`)
  if (start < 0) return ''
  let i = start + callee.length + 1
  let depth = 1
  let quote = null
  for (; i < source.length; i += 1) {
    const ch = source[i]
    if (quote) {
      if (ch === '\\') i += 1
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1
    else if (ch === ')' || ch === ']' || ch === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start + callee.length + 1, i)
    }
  }
  return ''
}

/** 对象字面量里的一层键（或数组字面量里的字符串） */
function keysOf(body) {
  const trimmed = body.trim()
  if (!trimmed.startsWith('{')) {
    return [...trimmed.matchAll(/["']([A-Za-z_$][\w$]*)["']/g)].map((m) => m[1])
  }
  const keys = []
  let depth = 0
  let quote = null
  let line = ''
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]
    if (quote) {
      line += ch
      if (ch === '\\') { line += trimmed[i + 1] ?? ''; i += 1; continue }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; line += ch; continue }
    if (ch === '{' || ch === '[' || ch === '(') {
      depth += 1
      if (depth === 1) { line = ''; continue }
    }
    if (ch === '}' || ch === ']' || ch === ')') {
      depth -= 1
      if (depth === 0) {
        const hit = /^\s*([A-Za-z_$][\w$]*)\s*:/.exec(line)
        if (hit) keys.push(hit[1])
        line = ''
      }
      continue
    }
    if (ch === ',' && depth === 1) {
      const hit = /^\s*([A-Za-z_$][\w$]*)\s*:/.exec(line)
      if (hit) keys.push(hit[1])
      line = ''
      continue
    }
    if (depth === 1) line += ch
  }
  return keys
}

function docsText() {
  const docsRoot = join(repoRoot, 'docs')
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!/node_modules|\.vitepress|dist/.test(p)) walk(p)
      } else if (entry.name.endsWith('.md')) {
        out.push(readFileSync(p, 'utf8'))
      }
    }
  }
  if (existsSync(docsRoot)) walk(docsRoot)
  return out.join('\n')
}

const docs = docsText()
const documented = (name) => docs.includes(name) || docs.includes(kebab(name))

const missingProps = []
const missingEmits = []
const exposeInfo = []

for (const { name, file } of componentEntries()) {
  if (!existsSync(file)) continue
  const src = readFileSync(file, 'utf8')
  const props = keysOf(callBody(src, 'defineProps'))
  const emits = keysOf(callBody(src, 'defineEmits'))
  const expose = keysOf(callBody(src, 'defineExpose'))

  // 组件名本身没进文档，交给 chat-docs-coverage 报，这里不重复
  if (!documented(name)) continue

  const badProps = props.filter((p) => !documented(p))
  const badEmits = emits.filter((e) => !documented(e))
  if (badProps.length) missingProps.push(`${name}: ${badProps.join(', ')}`)
  if (badEmits.length) missingEmits.push(`${name}: ${badEmits.join(', ')}`)
  const badExpose = expose.filter((k) => !documented(k))
  if (badExpose.length) exposeInfo.push(`${name}: ${badExpose.join(', ')}`)
}

const block = []
if (missingProps.length) block.push(`未写进文档的 props：\n    ${missingProps.join('\n    ')}`)
if (missingEmits.length) block.push(`未写进文档的 events：\n    ${missingEmits.join('\n    ')}`)

if (exposeInfo.length) {
  console.log(`[check-api-docs] 提示（不判失败）—— 实例方法未在文档出现：\n    ${exposeInfo.join('\n    ')}`)
}

if (block.length) {
  const label = reportOnly ? '报告' : '未通过'
  console.log(`[check-api-docs] ${label}：\n  ${block.join('\n  ')}`)
  if (!reportOnly) {
    console.log('  修法：把新 props / events 补进对应文档页的 API 表（camelCase 或 kebab 均可）')
    process.exit(1)
  }
} else {
  console.log('[check-api-docs] 通过：导出组件的 props / emits 都在文档里出现')
}