import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * AI 契约产物守卫
 *
 * 产物（docs/public/ai/evoke-chat.md + .components.json）是 AI 消费接口的唯一入口：
 * 组件加了 prop / 事件却忘了重新生成，AI 会照着旧契约写代码。构建链里的 --check 已经
 * 会拦，这里再补一条不依赖构建顺序的用例：产物必须覆盖导出面、配方必须成规模、
 * 关键规则必须在文里。
 */

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')
const repoRoot = resolve(pkgRoot, '../..')
const aiDir = join(repoRoot, 'docs/public/ai')
const mdFile = join(repoRoot, 'docs/chat/ai-contract.md')

function load() {
  const json = JSON.parse(readFileSync(join(aiDir, 'evoke-chat.components.json'), 'utf8'))
  const md = readFileSync(mdFile, 'utf8')
  return { json, md }
}

describe('AI 契约产物', () => {
  it('产物存在（由 scripts/gen-ai-docs.mjs 生成并入库）', () => {
    expect(existsSync(join(aiDir, 'evoke-chat.components.json')), '缺少 components.json').toBe(true)
    expect(existsSync(mdFile), '缺少 docs/chat/ai-contract.md').toBe(true)
  })

  it('覆盖全部导出组件与具名导出', () => {
    const { json } = load()
    const index = readFileSync(join(pkgRoot, 'src/index.js'), 'utf8')
    const components = [...index.matchAll(/import (Eb[A-Za-z0-9]+) from ["']\.\/components\//g)].map((m) => m[1])
    expect(components.length).toBeGreaterThan(30)
    const inContract = new Set(json.components.map((c) => c.name))
    const missing = components.filter((n) => !inContract.has(n))
    expect(missing, `契约里没有这些组件：${missing.join(', ')}`).toEqual([])
    expect(json.composables.length).toBeGreaterThanOrEqual(10)
  })

  it('props 抽取有效：多数组件带类型与默认值', () => {
    const { json } = load()
    const withProps = json.components.filter((c) => c.props.length > 0)
    expect(withProps.length).toBeGreaterThan(25)
    const typed = withProps.flatMap((c) => c.props).filter((p) => p.type)
    expect(typed.length / withProps.flatMap((c) => c.props).length).toBeGreaterThan(0.8)
    // 子路径入口必须是去 Eb 前缀的 kebab 名（与 dist 里的 *.mjs 对齐）
    for (const c of json.components) {
      expect(c.entry.startsWith('@wil-works/evoke-chat/')).toBe(true)
      expect(c.entry).not.toContain('/eb-')
    }
  })

  it('配方成规模，且给出代码与坑', () => {
    const { json, md } = load()
    expect(json.recipes.length).toBeGreaterThanOrEqual(10)
    for (const r of json.recipes) {
      expect(r.task, '配方缺少标题').toBeTruthy()
      expect(r.code.length, `配方「${r.task}」缺少代码`).toBeGreaterThan(20)
      expect(r.pitfalls.length, `配方「${r.task}」缺少注意项`).toBeGreaterThan(0)
      expect(md).toContain(`### ${r.task}`)
    }
  })

  it('硬规则与逐组件小节都在文里', () => {
    const { json, md } = load()
    for (const rule of ['流式回写一律用', 'cancelled', '按 id 操作']) {
      expect(md, `缺少硬规则：${rule}`).toContain(rule)
    }
    for (const c of json.components.slice(0, 12)) {
      expect(md).toContain(`### ${c.name}`)
      expect(md).toContain(c.entry)
    }
  })
})
