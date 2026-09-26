import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 图表文档站（docs-charts）图标守卫
 *
 * 该站的姊妹库是 evoke-ui，图标取 EvIcon 核心集（同样由 generate-remix-icons.mjs
 * 从 Remix Icon 生成）。口径与 business 文档站一致：
 *   1. 站点主题只做「语义名 → 库内名」转发，不自绘 SVG
 *   2. 模板用到的名与转发表目标名都必须能在核心集里解析（否则静默空白）
 */

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const themeDir = join(repoRoot, 'docs-charts/.vitepress/theme')
const iconSetFile = join(repoRoot, 'packages/evoke-ui/src/components/icon/svg-paths.js')

function libraryNames() {
  const src = readFileSync(iconSetFile, 'utf8')
  return new Set([...src.matchAll(/^ "([a-z0-9-]+)":/gm)].map((m) => m[1]))
}

function siteMap() {
  const src = readFileSync(join(themeDir, 'Icon.vue'), 'utf8')
  const start = src.indexOf('const MAP = {')
  expect(start, 'Icon.vue 里应有转发表 MAP').toBeGreaterThan(-1)
  const body = src.slice(start, src.indexOf('\n}', start))
  const map = {}
  for (const m of body.matchAll(/(?:'([a-z0-9-]+)'|([a-z0-9-]+)):\s*'([a-z0-9-]+)'/g)) {
    map[m[1] || m[2]] = m[3]
  }
  return map
}

function usedNames() {
  const used = new Set()
  for (const f of readdirSync(themeDir)) {
    if (!f.endsWith('.vue') || f === 'Icon.vue') continue
    const s = readFileSync(join(themeDir, f), 'utf8')
    for (const m of s.matchAll(/<CdIcon\b[^>]*\bname="([a-z0-9-]+)"/g)) used.add(m[1])
    for (const m of s.matchAll(/\bicon: '([a-z0-9-]+)'/g)) used.add(m[1])
    for (const m of s.matchAll(/:name="[^"]*\? '([a-z0-9-]+)' : '([a-z0-9-]+)'"/g)) {
      used.add(m[1])
      used.add(m[2])
    }
  }
  return used
}

/**
 * 文档页（.md）里用到的图标名 —— 主题之外的另一半用法。
 * 此前只扫主题模板，首页特性卡的 zap / layers / shield（核心集当时没有这三个名）
 * 长期渲染成空白而无人发现。代码围栏里的示例不算真实用法，先剔除。
 */
function mdUsedNames() {
  const used = new Map()
  const files = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (['dist', 'node_modules', 'cache', 'public'].includes(e.name)) continue
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.md')) files.push(p)
    }
  }
  walk(join(repoRoot, 'docs-charts'))
  for (const f of files) {
    const body = readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '')
    for (const m of body.matchAll(/<(?:CdIcon|EvIcon|Icon)\b[^>]*(?<!:)name="([a-z0-9-]+)"/g)) {
      if (!used.has(m[1])) used.set(m[1], f.replace(`${repoRoot}/`, ''))
    }
  }
  return used
}

describe('图表文档站图标：全部来自库内 Remix 集', () => {
  const lib = libraryNames()
  const map = siteMap()

  it('核心集非空（守卫前提）', () => {
    expect(lib.size).toBeGreaterThan(60)
  })

  it('主题 Icon.vue 不再自绘 SVG，只做转发', () => {
    const src = readFileSync(join(themeDir, 'Icon.vue'), 'utf8')
    for (const tag of ['<svg', '<path', '<circle', '<polyline', '<line ']) {
      expect(src.includes(tag), `Icon.vue 里出现自绘 ${tag}`).toBe(false)
    }
    expect(src).toContain('EvIcon')
  })

  it('模板用到的每个名转发后都能解析', () => {
    const used = usedNames()
    expect(used.size).toBeGreaterThan(5)
    const broken = [...used].filter((n) => !lib.has(map[n] || n)).map((n) => `${n} → ${map[n] || n}`)
    expect(broken, `以下图标名解析不到（会渲染成空白）: ${broken.join(', ')}`).toEqual([])
  })

  it('转发表的目标名都真实存在', () => {
    const bad = Object.entries(map).filter(([, target]) => !lib.has(target))
    expect(bad.map(([k, v]) => `${k} → ${v}`), '转发表指向了不存在的图标').toEqual([])
  })

  it('文档页（.md）用到的每个名转发后都能解析', () => {
    const used = mdUsedNames()
    expect(used.size).toBeGreaterThan(4)
    const broken = [...used]
      .filter(([n]) => !lib.has(map[n] || n))
      .map(([n, f]) => `${n} → ${map[n] || n}（${f}）`)
    expect(broken, `以下图标名解析不到（会渲染成空白）: ${broken.join(', ')}`).toEqual([])
  })
})
