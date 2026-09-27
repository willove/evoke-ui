#!/usr/bin/env node
/**
 * G9 分类门 — 两层（common / office）与用途分类的一致性
 *
 * 单一来源是 src/taxonomy.js；本门禁守三处视图不许与它漂移：
 *   ① src/index.js 的 33 个入口（scripts/component-entries.mjs 解析）↔ taxonomy 名称集合
 *   ② src/common/index.js 的导出集合 ↔ taxonomy 里 layer=common 的条目
 *   ③ src/office/index.js 的导出集合 ↔ taxonomy 里 layer=office 的条目
 * 外加：layer / category / granularity 三个键必须都在白名单内，且名称不重复。
 *
 * 用法: node scripts/check-taxonomy.mjs （已挂入 build，违规即构建失败）
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getEtComponentEntries } from './component-entries.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')

const failures = []
const fail = (msg) => failures.push(msg)

const { LAYERS, CATEGORIES, GRANULARITIES, COMPONENT_TAXONOMY } = await import(
  resolve(pkgRoot, 'src/taxonomy.js')
)

// ── ① 入口表 ↔ taxonomy ──
const entries = getEtComponentEntries()
const entryNames = new Set(entries.map((e) => e.name))
const taxNames = new Set(COMPONENT_TAXONOMY.map((c) => c.id))

for (const name of entryNames) {
  if (!taxNames.has(name)) fail(`taxonomy 缺条目：${name}（index.js 里有这个入口）`)
}
for (const name of taxNames) {
  if (!entryNames.has(name)) fail(`taxonomy 多条目：${name}（index.js 里没有这个入口）`)
}
if (COMPONENT_TAXONOMY.length !== taxNames.size) fail('taxonomy 里有重复的 id')

// ── ② 键合法性 ──
for (const c of COMPONENT_TAXONOMY) {
  if (!LAYERS[c.layer]) fail(`${c.id}: 未知 layer「${c.layer}」`)
  if (!CATEGORIES[c.category]) fail(`${c.id}: 未知 category「${c.category}」`)
  if (!GRANULARITIES[c.granularity]) fail(`${c.id}: 未知 granularity「${c.granularity}」`)
  if (!c.summary) fail(`${c.id}: 缺 summary（文档站与目录页要读它）`)
}

// ── ③ 两层视图模块的导出集合 ↔ taxonomy ──
const EXPORT_RE = /^\s*(Et[A-Z]\w+),?\s*$/gm

function exportsOf(rel) {
  const src = readFileSync(resolve(pkgRoot, rel), 'utf8')
  const install = src.split('// ─── Component Registry ───')[1] ?? ''
  const block = install.split('// ─── Vue Plugin Install ───')[0] ?? ''
  return new Set([...block.matchAll(EXPORT_RE)].map((m) => m[1]))
}

const LAYER_MODULES = {
  common: 'src/common/index.js',
  office: 'src/office/index.js',
}

for (const [layer, rel] of Object.entries(LAYER_MODULES)) {
  const declared = new Set(exportsOf(rel))
  const expected = new Set(
    COMPONENT_TAXONOMY.filter((c) => c.layer === layer).map((c) => `Et${c.id
      .split('-')
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join('')}`),
  )
  for (const name of expected) {
    if (!declared.has(name)) fail(`${rel} 缺导出：${name}（taxonomy 标为 ${layer}）`)
  }
  for (const name of declared) {
    if (!expected.has(name)) fail(`${rel} 多导出：${name}（taxonomy 未标为 ${layer}）`)
  }
}

// ── 报告 ──
if (failures.length) {
  console.error('✗ G9 分类门未通过：')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}

const counts = Object.keys(LAYERS)
  .map((l) => `${l} ${COMPONENT_TAXONOMY.filter((c) => c.layer === l).length}`)
  .join(' / ')
console.log(`✓ G9 分类门通过：${COMPONENT_TAXONOMY.length} 个入口（${counts}），分类与两层视图一致`)