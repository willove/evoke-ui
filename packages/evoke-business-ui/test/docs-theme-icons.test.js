import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 文档站图标守卫
 *
 * 口径：文档站的图标一律用库内 Remix 图标集，站点主题只做「语义名 → 库内名」转发，
 * 不再自绘 SVG。这里钉住三件事：
 *   1. 主题 Index/Icon 组件里不得出现自绘路径（<svg>/<path>/<circle> 等）
 *   2. 主题模板里用到的每个图标名，经站点 MAP 转发后都能在库内图标集里解析到
 *      （改名/漏登记会让图标静默变空白，此前没有任何守卫能发现）
 *   3. 转发表里的目标名必须真实存在（防手滑写错）
 */

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const themeDir = join(repoRoot, 'docs/.vitepress/theme')
const iconSetFile = join(
  repoRoot,
  'packages/evoke-business-ui/src/components/icon/remix-svg-paths.js',
)

/** 库内图标集可用名（生成产物） */
function libraryNames() {
  const src = readFileSync(iconSetFile, 'utf8')
  return new Set([...src.matchAll(/^ "([a-z0-9-]+)":/gm)].map((m) => m[1]))
}

/** 站点转发表：语义名 → 库内名 */
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

/** 主题模板里用到的图标名 */
function usedNames() {
  const used = new Set()
  for (const f of readdirSync(themeDir)) {
    if (!f.endsWith('.vue') || f === 'Icon.vue') continue
    const s = readFileSync(join(themeDir, f), 'utf8')
    for (const m of s.matchAll(/<Icon\b[^>]*\bname="([a-z0-9-]+)"/g)) used.add(m[1])
    for (const m of s.matchAll(/\bicon: '([a-z0-9-]+)'/g)) used.add(m[1])
    // :name="cond ? 'a' : 'b'" 形式的条件图标
    for (const m of s.matchAll(/:name="[^"]*\? '([a-z0-9-]+)' : '([a-z0-9-]+)'"/g)) {
      used.add(m[1])
      used.add(m[2])
    }
  }
  return used
}

/**
 * 文档页（.md）里用到的图标名 —— 主题之外的另一半用法。
 * 此前只扫主题模板，于是首页特性卡的 grid / zap / shield（库内当时没有这三个名）
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
  walk(join(repoRoot, 'docs'))
  for (const f of files) {
    const body = readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '')
    for (const m of body.matchAll(/<(?:BdIcon|EbIcon)\b[^>]*(?<!:)name="([a-z0-9-]+)"/g)) {
      if (!used.has(m[1])) used.set(m[1], f.replace(`${repoRoot}/`, ''))
    }
  }
  return used
}

/** 文档里写死的图标计数 —— 生成器一跑就会漂，只有断言钉得住 */
function docCounts() {
  const pick = (file, re) => {
    const m = readFileSync(join(repoRoot, file), 'utf8').match(re)
    expect(m, `${file} 里应能找到计数（正则 ${re}）`).toBeTruthy()
    return Number(m[1])
  }
  return {
    '首页 hero 统计': pick('docs/index.md', /<strong>(\d+)<\/strong><span>内置图标/),
    '图标总览页': pick('docs/components/icon-gallery.md', /全部内置图标（\*\*(\d+) 个\*\*/),
    '图标页 · 正文': pick('docs/components/icon.md', /共 \*\*(\d+) 个单色图标\*\*/),
    '图标页 · 链接': pick('docs/components/icon.md', /全部内置图标（(\d+) 个）/),
  }
}

describe('文档站图标：全部来自库内 Remix 集', () => {
  const lib = libraryNames()
  const map = siteMap()

  it('库内图标集非空（守卫前提）', () => {
    expect(lib.size).toBeGreaterThan(300)
  })

  it('主题 Icon.vue 不再自绘 SVG，只做转发', () => {
    const src = readFileSync(join(themeDir, 'Icon.vue'), 'utf8')
    for (const tag of ['<svg', '<path', '<circle', '<polyline', '<line ']) {
      expect(src.includes(tag), `Icon.vue 里出现自绘 ${tag}`).toBe(false)
    }
    expect(src).toContain('eb-icon')
  })

  it('模板用到的每个名转发后都能解析', () => {
    const used = usedNames()
    expect(used.size).toBeGreaterThan(10)
    const broken = [...used].filter((n) => !lib.has(map[n] || n)).map((n) => `${n} → ${map[n] || n}`)
    expect(broken, `以下图标名解析不到（会渲染成空白）: ${broken.join(', ')}`).toEqual([])
  })

  it('转发表的目标名都真实存在', () => {
    const bad = Object.entries(map).filter(([, target]) => !lib.has(target))
    expect(bad.map(([k, v]) => `${k} → ${v}`), '转发表指向了不存在的图标').toEqual([])
  })

  it('文档页（.md）用到的每个名转发后都能解析', () => {
    const used = mdUsedNames()
    expect(used.size).toBeGreaterThan(8)
    const broken = [...used]
      .filter(([n]) => !lib.has(map[n] || n))
      .map(([n, f]) => `${n} → ${map[n] || n}（${f}）`)
    expect(broken, `以下图标名解析不到（会渲染成空白）: ${broken.join(', ')}`).toEqual([])
  })

  it('文档里写死的图标计数与生成集一致', () => {
    for (const [where, n] of Object.entries(docCounts())) {
      expect(n, `${where} 的计数落后于生成集（应为 ${lib.size}）`).toBe(lib.size)
    }
  })

  it('docs/ 下不存在旧的手写图标文件残留', () => {
    expect(existsSync(join(themeDir, 'Icon.vue'))).toBe(true)
  })
})
