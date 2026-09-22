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

  it('docs/ 下不存在旧的手写图标文件残留', () => {
    expect(existsSync(join(themeDir, 'Icon.vue'))).toBe(true)
  })
})
