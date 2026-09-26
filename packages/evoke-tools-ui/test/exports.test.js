import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { getEtComponentEntries, PKG_ROOT } from '../scripts/component-entries.mjs'

// 守卫：src/index.js 组件清单 ↔ package.json exports ↔ vite 多入口三者一致。
// 子路径名从入口表解析生成，漏登记 / 改名 / exports 面回退都在这里暴露
// （范式同底座 packages/evoke-business-ui/test/exports.test.js）。
// EtIcon 是图标兜底机制的载体，走 ./icons 子路径而非 "./*" 通配，合法豁免。
const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'))
const srcIndex = readFileSync(join(PKG_ROOT, 'src/index.js'), 'utf8')
const entries = getEtComponentEntries()
const NO_SUBPATH_OK = new Set(['EtIcon'])

describe('M0 入口与导出契约', () => {
  it('入口清单 = M0 13 件 + M1 6 件 + M2 7 件 + M3 7 件', () => {
    expect(entries.length).toBe(33)
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

  it('index.js 导出块的每个 Et* 组件都有子路径（图标载体豁免）', () => {
    const exportBlock = srcIndex.slice(srcIndex.lastIndexOf('export {'))
    const exported = new Set(exportBlock.match(/Et[A-Z]\w*/g))
    const mapped = new Set(entries.map((e) => e.exportName))
    const missing = [...exported].filter((n) => !mapped.has(n) && !NO_SUBPATH_OK.has(n))
    expect(missing).toEqual([])
  })

  it('exports 面：主入口带 types、styles / runtime / icons 契约入口、通配子路径', () => {
    expect(pkg.exports['.']).toEqual({
      types: './dist/types/index.d.ts',
      default: './dist/index.mjs',
    })
    expect(pkg.exports['./styles']).toBe('./dist/evoke-tools-ui.css')
    expect(pkg.exports['./runtime']).toEqual({
      types: './dist/types/runtime/index.d.ts',
      default: './dist/runtime.mjs',
    })
    expect(pkg.exports['./icons']).toEqual({
      types: './dist/types/icons/index.d.ts',
      default: './dist/icons.mjs',
    })
    expect(pkg.exports['./*']).toEqual({
      types: './dist/types/entries/*.d.ts',
      default: './dist/*.mjs',
    })
  })

  it('peer 依赖只有 vue + 底座；零第三方运行时依赖（dependencies 为空）', () => {
    expect(Object.keys(pkg.peerDependencies).sort()).toEqual([
      '@wil-works/evoke-business-ui',
      'vue',
    ])
    expect(pkg.dependencies ?? {}).toEqual({})
  })

  it('安装函数把全部组件注册进 app', async () => {
    const mod = await import('../src/index.js')
    const registered = []
    const app = { component: (name, comp) => registered.push([name, comp]), config: { globalProperties: {} }, provide: () => {}, directive: () => {} }
    mod.default.install(app)
    expect(registered.length).toBeGreaterThanOrEqual(entries.length)
    for (const { exportName } of entries) {
      expect(registered.map(([n]) => n)).toContain(exportName)
    }
  })

  it('运行时契约从 ./runtime 入口可取出（键位表 + 焦点漫游）', async () => {
    const runtime = await import('../src/runtime/index.js')
    for (const name of ['normalizeCombo', 'formatCombo', 'comboFromEvent', 'nextRovingIndex', 'rovingTabindex']) {
      expect(typeof runtime[name], name).toBe('function')
    }
  })
})
