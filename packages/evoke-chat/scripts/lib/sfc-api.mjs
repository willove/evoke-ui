/**
 * SFC 接口抽取（供文档门 check-api-docs 与 AI 契约生成 gen-ai-docs 共用）
 *
 * 只做「从源码里读接口面」这件事：props / emits / expose / slots / 摘要。
 * 不引编译器、不跑 vue-tsc——保持零依赖、可在任何环境跑。
 */
import { readFileSync } from 'node:fs'

/** PascalCase / kebab-case 互转（子路径入口用 kebab） */
export function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** 取 `defineXxx(` 的括号内容（按括号配对，跳过字符串里的括号） */
export function callBody(source, callee) {
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

/**
 * 按逗号切一层成员：只在**顶层**逗号处切分（嵌套对象/数组/函数参数的逗号不算），
 * 保留嵌套正文（props 的 type/default 就在里面），并去掉注释（否则成员开头的键匹配不到）。
 */
export function topLevelMembers(body) {
  const trimmed = body.trim()
  if (!trimmed.startsWith('{')) return []
  const out = []
  let brace = 0
  let paren = 0
  let bracket = 0
  let quote = null
  let inLine = false
  let inBlock = false
  let line = ''
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]
    if (inLine) { if (ch === '\n') inLine = false; continue }
    if (inBlock) {
      if (ch === '*' && trimmed[i + 1] === '/') { inBlock = false; i += 1 }
      continue
    }
    if (quote) {
      line += ch
      if (ch === '\\') { line += trimmed[i + 1] ?? ''; i += 1; continue }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '/' && trimmed[i + 1] === '/') { inLine = true; i += 1; continue }
    if (ch === '/' && trimmed[i + 1] === '*') { inBlock = true; i += 1; continue }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; line += ch; continue }
    if (ch === '{') { brace += 1; if (brace > 1) line += ch; continue }
    if (ch === '}') {
      brace -= 1
      if (brace === 0) { if (line.trim()) out.push(line); return out }
      line += ch
      continue
    }
    if (ch === '(') { paren += 1; line += ch; continue }
    if (ch === ')') { paren -= 1; line += ch; continue }
    if (ch === '[') { bracket += 1; line += ch; continue }
    if (ch === ']') { bracket -= 1; line += ch; continue }
    if (ch === ',' && brace === 1 && paren === 0 && bracket === 0) { out.push(line); line = ''; continue }
    line += ch
  }
  if (line.trim()) out.push(line)
  return out
}

/** 一层的键名（键为标识符或引号串；数组字面量则取字符串项） */
export function keysOf(body) {
  const trimmed = body.trim()
  if (!trimmed.startsWith('{')) {
    return [...trimmed.matchAll(/["']([A-Za-z_$][\w$]*)["']/g)].map((m) => m[1])
  }
  return topLevelMembers(trimmed)
    .map((m) => (m.match(/^\s*["']?([A-Za-z_$][\w$]*)["']?\s*:/) || [])[1])
    .filter(Boolean)
}

/** props 明细：{ name: { type, required, default } }（值取源码字面量，不做求值） */
export function propsOf(source) {
  return topLevelMembers(callBody(source, 'defineProps')).map((member) => {
    const name = (member.match(/^\s*["']?([A-Za-z_$][\w$]*)["']?\s*:/) || [])[1]
    if (!name) return null
    const clean = (v) => (v || '').replace(/\s+/g, ' ').replace(/[}\]]+$/, '').trim()
    const type = clean((member.match(/type:\s*([^,\n]+)/) || [])[1])
    const def = clean((member.match(/default:\s*([^,\n]+)/) || [])[1])
    const required = /required:\s*true/.test(member)
    return { name, type, default: def, required }
  }).filter(Boolean)
}

/** 模板里的插槽名（含默认插槽占位 __default） */
export function slotsOf(source) {
  const slots = new Set()
  for (const m of source.matchAll(/<slot\b([^>]*)>/g)) {
    const name = (m[1].match(/name="([^"]+)"/) || [])[1]
    slots.add(name || '__default')
  }
  return [...slots]
}

/** 组件摘要：优先取 defineProps 上方最近一段块注释的首句 */
export function summaryOf(source, fallbackName) {
  const at = source.indexOf('defineProps')
  const head = at > 0 ? source.slice(0, at) : source
  const blocks = [...head.matchAll(/\/\*\*([\s\S]*?)\*\//g)].map((m) => m[1])
  const last = blocks.at(-1)
  if (last) {
    const line = last
      .split('\n')
      .map((l) => l.replace(/^\s*\*?\s?/, '').trim())
      .find((l) => l && !l.startsWith('@'))
    if (line) return line
  }
  return fallbackName
}

/** 读文件（读不到返回空串，调用方自行判断） */
export function readSource(file) {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

/** 从 src/index.js 抽「组件名 → 源文件相对路径」 */
export function componentEntriesOf(indexSource, prefix) {
  const re = new RegExp(`import (${prefix}[A-Za-z0-9]+) from ["'](\\.\\/components\\/[^"']+\\.vue)["']`, 'g')
  return [...indexSource.matchAll(re)].map((m) => ({ name: m[1], file: m[2].replace(/^\.\//, '') }))
}

/** 从 src/index.js 抽具名导出（composable / 工具函数） */
export function namedExportsOf(indexSource) {
  const out = new Set()
  for (const m of indexSource.matchAll(/^export \{ ([^}]+) \}/gm)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim()
      if (name) out.add(name)
    }
  }
  return [...out]
}