import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * tools-ui 文档站版本号守卫（M4 G8：第四个库的版本展示点）
 *
 * 口径与 ui / business-ui / charts 三个包一致：站点上展示的「当前版本」必须等于
 * 本包 package.json 的 version。tools-ui 的展示点：
 *   · docs-tools/index.md hero 徽标（vX.Y.Z · 内测版）
 *   · docs-tools/.vitepress/config.mts（站点标题/描述里的版本串，若有）
 *   · packages/evoke-tools-ui/README.md 徽标行（npm 版本 badge 链接）
 * 漏改任何一处，都会出现「文档站说 0.3、npm 上已是 0.4」的自相矛盾。
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

describe('tools-ui 文档站版本号与本包版本一致', () => {
  it('首页 hero 徽标是当前版本', () => {
    const stale = versionsIn(read('docs-tools/index.md')).filter((v) => v !== pkg.version)
    expect(stale, `docs-tools/index.md 里出现了非当前版本号：${stale.join(', ')}`).toEqual([])
    expect(versionsIn(read('docs-tools/index.md'))).toContain(pkg.version)
  })

  it('README 徽标行是当前版本', () => {
    const stale = versionsIn(read('packages/evoke-tools-ui/README.md')).filter((v) => v !== pkg.version)
    expect(stale, `README.md 里出现了非当前版本号：${stale.join(', ')}`).toEqual([])
    expect(versionsIn(read('packages/evoke-tools-ui/README.md'))).toContain(pkg.version)
  })

  it('发布笔记与站点配置不含过期版本号', () => {
    for (const rel of ['docs-tools/.vitepress/config.mts']) {
      const src = read(rel)
      const stale = versionsIn(src).filter((v) => v !== pkg.version)
      expect(stale, `${rel} 里出现了非当前版本号：${stale.join(', ')}`).toEqual([])
    }
  })
})
