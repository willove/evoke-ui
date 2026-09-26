import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * ui 文档站版本号守卫
 *
 * 口径：站点上展示的「当前版本」必须等于本包 package.json 的 version。
 * 首页的版本串（品牌标签 / 发布说明 / 封面标签）与内页页头的版本标签分属
 * 两个文件手写，发版时漏改一处就会出现「首页首页说 0.11、内页页头说 0.10」
 * 的自相矛盾——2026-09-22 实测内页页头就还挂着 v0.10.1。
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

describe('ui 文档站版本号与本包版本一致', () => {
  it('首页出现的版本号都是当前版本', () => {
    const stale = versionsIn(read('docs-web/index.md')).filter((v) => v !== pkg.version)
    expect(stale, `docs-web/index.md 里出现了非当前版本号：${stale.join(', ')}`).toEqual([])
  })

  it('首页确有版本展示（防整段被删后守卫空转）', () => {
    expect(versionsIn(read('docs-web/index.md'))).toContain(pkg.version)
  })

  it('内页页头版本标签是当前版本', () => {
    const stale = versionsIn(read('docs-web/.vitepress/theme/Layout.vue')).filter((v) => v !== pkg.version)
    expect(stale, `Layout.vue 里出现了非当前版本号：${stale.join(', ')}`).toEqual([])
    expect(read('docs-web/.vitepress/theme/Layout.vue')).toContain(`v${pkg.version}`)
  })
})
