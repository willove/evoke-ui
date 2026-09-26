import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 图表文档站版本号守卫
 *
 * 口径：站点上展示的「当前版本」必须等于本包 package.json 的 version。
 * 首页 hero 徽标与主题元信息 version（页头徽标）都是手写的，发版漏改一处
 * 就会出现同一站点两个版本号——2026-09-22 实测首页 hero 还写 v0.6.0（包已发 0.7.0）。
 */

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const pkg = JSON.parse(readFileSync(resolve(here, '../package.json'), 'utf8'))

function read(rel) {
  return readFileSync(join(repoRoot, rel), 'utf8')
}

/** 文本里出现的全部 vX.Y.Z */
function versionsIn(src) {
  return [...src.matchAll(/v(\d+\.\d+\.\d+)/g)].map((m) => m[1])
}

describe('图表文档站版本号与本包版本一致', () => {
  it('首页 hero 徽标写的是当前版本', () => {
    const m = read('docs-charts/index.md').match(/cd-hero__badge">([^<]*)</)
    expect(m, 'docs-charts/index.md 里应有 cd-hero__badge').toBeTruthy()
    expect(m[1]).toContain(`v${pkg.version}`)
  })

  it('首页不再残留其它版本号', () => {
    const stale = versionsIn(read('docs-charts/index.md')).filter((v) => v !== pkg.version)
    expect(stale, `docs-charts/index.md 里出现了非当前版本号：${stale.join(', ')}`).toEqual([])
  })

  it('主题元信息 version（页头徽标）与包版本一致', () => {
    const m = read('docs-charts/.vitepress/theme/meta.js').match(/^\s*version:\s*'([^']+)'/m)
    expect(m, 'meta.js 里应有 version 字段').toBeTruthy()
    expect(m[1]).toBe(pkg.version)
  })
})
