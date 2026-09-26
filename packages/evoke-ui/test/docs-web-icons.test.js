import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * ui 文档站（docs-web）图标守卫
 *
 * 该站**没有**「语义名 → 库内名」的转发表：页面直接写库内名，可用的名字来自两个命名空间
 *   · 核心集（svg-paths.js，随包内置，77→80 个语义名）
 *   · 展示集（showcase-paths.js，922 个 Remix 原生命名，靠主题里的 loadShowcaseIcons() 运行时预载）
 * 两者都是生成产物。名字写错不会有任何编译期提示，只会静默渲染成空白——这里钉住：
 *   1. 页面用到的静态图标名必须落在「核心集 ∪ 展示集」里
 *   2. 主题必须仍预载展示集（否则展示集里的名字全部失效）
 *   3. 文档里写死的核心集计数必须与生成集一致
 */

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const webDir = join(repoRoot, 'docs-web')
const iconDir = join(repoRoot, 'packages/evoke-ui/src/components/icon')

function namesIn(file) {
  const src = readFileSync(join(iconDir, file), 'utf8')
  return new Set([...src.matchAll(/^\s*"([a-z0-9-]+)":\s*\{/gm)].map((m) => m[1]))
}

/** 页面（.md / .vue）里用到的静态图标名 */
function usedNames() {
  const used = new Map()
  const files = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (['dist', 'node_modules', 'cache', 'public'].includes(e.name)) continue
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.md') || e.name.endsWith('.vue')) files.push(p)
    }
  }
  walk(webDir)
  for (const f of files) {
    const body = readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '')
    for (const m of body.matchAll(/<EvIcon\b[^>]*(?<!:)name="([a-z0-9-]+)"/g)) {
      if (!used.has(m[1])) used.set(m[1], f.replace(`${repoRoot}/`, ''))
    }
  }
  return used
}

describe('ui 文档站图标：核心集与展示集之内', () => {
  const core = namesIn('svg-paths.js')
  const showcase = namesIn('showcase-paths.js')
  const available = new Set([...core, ...showcase])

  it('两个生成集都非空（守卫前提）', () => {
    expect(core.size).toBeGreaterThan(60)
    expect(showcase.size).toBeGreaterThan(500)
  })

  it('页面用到的每个静态图标名都能解析', () => {
    const used = usedNames()
    expect(used.size).toBeGreaterThan(20)
    const broken = [...used].filter(([n]) => !available.has(n)).map(([n, f]) => `${n}（${f}）`)
    expect(broken, `以下图标名不在核心集也不在展示集（会渲染成空白）: ${broken.join(', ')}`).toEqual([])
  })

  it('主题仍预载展示集（展示集里的名字全靠它）', () => {
    const src = readFileSync(join(webDir, '.vitepress/theme/index.ts'), 'utf8')
    expect(src).toContain('loadShowcaseIcons')
  })

  it('文档里写死的核心集计数与生成集一致', () => {
    const src = readFileSync(join(webDir, 'components/icon.md'), 'utf8')
    const picks = [
      ['核心集条数', /核心集\*\*：(\d+) 个语义命名图标/],
      ['正文计数', /全部 (\d+) 个语义图标/],
      ['演示块标题', /内置核心集（(\d+)）/],
    ]
    for (const [where, re] of picks) {
      const m = src.match(re)
      expect(m, `docs-web/components/icon.md 里应能找到${where}（正则 ${re}）`).toBeTruthy()
      expect(Number(m[1]), `${where}与生成集不一致（应为 ${core.size}）`).toBe(core.size)
    }
  })
})
