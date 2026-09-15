import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { getComponentEntries, PKG_ROOT } from '../scripts/component-entries.mjs'

// 守卫：src/index.js 组件清单 ↔ package.json exports ↔ vite 多入口三者一致，
// 任何一侧漂移（新增组件忘登记、子路径改名、exports 面回退）都在这里暴露。
// EbChart（evoke-charts 别名）与 EbListy（EbVirtualList 注册别名）无本地文件，合法豁免。
const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'))
const srcIndex = readFileSync(join(PKG_ROOT, 'src/index.js'), 'utf8')
const entries = getComponentEntries()
const NO_SUBPATH_OK = new Set(['EbChart', 'EbListy'])

describe('按需子路径导出契约', () => {
  it('入口清单非空、子路径名 kebab-case 且唯一', () => {
    expect(entries.length).toBeGreaterThanOrEqual(150)
    const names = entries.map((e) => e.name)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('每个子路径的源文件真实存在，且导出名进入 index.js 导出块', () => {
    const exportBlock = srcIndex.slice(srcIndex.lastIndexOf('export {'))
    for (const { exportName, file } of entries) {
      expect(existsSync(join(PKG_ROOT, 'src', file)), file).toBe(true)
      expect(exportBlock, `${exportName} 未导出`).toContain(`\n  ${exportName},`)
    }
  })

  it('index.js 导出块的每个 Eb* 组件都有子路径（别名豁免）', () => {
    const exportBlock = srcIndex.slice(srcIndex.lastIndexOf('export {'))
    const exported = new Set(exportBlock.match(/Eb[A-Z]\w+/g))
    const mapped = new Set(entries.map((e) => e.exportName))
    const missing = [...exported].filter((n) => !mapped.has(n) && !NO_SUBPATH_OK.has(n))
    expect(missing).toEqual([])
  })

  it('exports 面：主入口带 types、full-icons 双通道、通配子路径、styles 保留', () => {
    expect(pkg.exports['.']).toEqual({
      types: './dist/types/index.d.ts',
      default: './dist/index.mjs',
    })
    expect(pkg.exports['./styles']).toBe('./dist/evoke-business-ui.css')
    expect(pkg.exports['./full-icons']).toEqual({
      types: './dist/types/full-icons.d.ts',
      default: './dist/full-icons.mjs',
    })
    expect(pkg.exports['./*']).toEqual({
      types: './dist/types/entries/*.d.ts',
      default: './dist/*.mjs',
    })
    expect(pkg.types).toBe('./dist/types/index.d.ts')
  })

  it('sideEffects 仅声明 css，保证 JS 全量 tree-shaking', () => {
    expect(pkg.sideEffects).toContain('**/*.css')
  })
})
