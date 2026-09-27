import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getEtComponentEntries } from '../scripts/component-entries.mjs'
import {
  LAYERS,
  CATEGORIES,
  GRANULARITIES,
  COMPONENT_TAXONOMY,
  OFFICE_SEMANTIC_WORDS,
  byLayer,
  groupedByCategory,
  taxonomyOf,
} from '../src/taxonomy.js'

/**
 * 两层重构的分类契约（tools-ui G9 的测试面）
 *
 * 单一来源 src/taxonomy.js，三处视图（index.js 入口表 / common 层 / office 层）
 * 与它必须逐项一致；office 层是**办公形态的显式清单**，多一个少一个都要在此说明。
 */

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')

/** 办公形态清单：进 office 层的唯一理由见 src/taxonomy.js 的层注释 */
const OFFICE_ALLOWLIST = [
  // 壳：办公形态的「文件」后台页与底带表页签
  'backstage',
  'sheet-tabs',
  // 工具区：功能区的 tab/组语义与溢出
  'ribbon-bar',
  'overflow-menu',
  // 面板：表格画布宿主（办公画布的地基）
  'sheet-canvas-host',
  // 输入：公式栏
  'formula-bar',
  // 基础：画布调色板桥
  'theme-bridge',
]

function exportsOfLayer(rel) {
  const src = readFileSync(resolve(pkgRoot, rel), 'utf8')
  const block = (src.split('// ─── Component Registry ───')[1] ?? '').split('// ─── Vue Plugin Install ───')[0]
  return new Set([...block.matchAll(/^\s*(Et[A-Z]\w+),?\s*$/gm)].map((m) => m[1]))
}

const pascal = (name) =>
  `Et${name
    .split('-')
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('')}`

describe('分层与分类（单一来源 taxonomy）', () => {
  const entries = getEtComponentEntries()

  it('taxonomy 与入口表逐项一致（不重不漏）', () => {
    const entryNames = entries.map((e) => e.name).sort()
    const taxNames = COMPONENT_TAXONOMY.map((c) => c.id).sort()
    expect(taxNames).toEqual(entryNames)
  })

  it('每条都标了合法的层 / 分类 / 粒度，且有摘要', () => {
    for (const c of COMPONENT_TAXONOMY) {
      expect(LAYERS[c.layer], `${c.id} layer`).toBeTruthy()
      expect(CATEGORIES[c.category], `${c.id} category`).toBeTruthy()
      expect(GRANULARITIES[c.granularity], `${c.id} granularity`).toBeTruthy()
      expect(c.summary.length, `${c.id} summary`).toBeGreaterThan(6)
    }
  })

  it('office 层就是办公形态清单（多一个少一个都要改这里）', () => {
    expect(byLayer('office').map((c) => c.id).sort()).toEqual([...OFFICE_ALLOWLIST].sort())
  })

  it('common 层的摘要不承诺办公语义', () => {
    for (const c of byLayer('common')) {
      const hit = OFFICE_SEMANTIC_WORDS.filter((w) => c.summary.toLowerCase().includes(w))
      expect(hit, `${c.id} 摘要出现办公语义词：${hit.join(',')}`).toEqual([])
    }
  })

  it('两层视图模块的导出集合与 taxonomy 一致', () => {
    for (const layer of Object.keys(LAYERS)) {
      const declared = exportsOfLayer(`src/${layer}/index.js`)
      const expected = new Set(byLayer(layer).map((c) => pascal(c.id)))
      expect([...declared].sort(), `${layer} 层导出`).toEqual([...expected].sort())
    }
  })

  it('分类分组覆盖该层全部条目且顺序稳定', () => {
    for (const layer of Object.keys(LAYERS)) {
      const grouped = groupedByCategory(layer)
      const flat = grouped.flatMap((g) => g.components.map((c) => c.id)).sort()
      expect(flat).toEqual(byLayer(layer).map((c) => c.id).sort())
      expect(grouped.length).toBeGreaterThan(0)
    }
  })

  it('taxonomyOf 可反查（文档站侧栏与搜索用它）', () => {
    expect(taxonomyOf('ribbon-bar')?.layer).toBe('office')
    expect(taxonomyOf('tool-button')?.category).toBe('toolbar')
    expect(taxonomyOf('not-exist')).toBeNull()
  })
})