import { describe, it, expect } from 'vitest'
import { zhCN, en, ja, zhTW, ko, es, pt } from '../src/locale'

/**
 * 语言包键位奇偶守卫：任何语言包缺键/多键都会在构建期后于此暴露，
 * 防止某个语言在运行时回退到 t() 的路径字符串。
 */

/** 展开对象为 'a.b.c' 路径集合（数组按索引展开，titles[0]/titles[1]） */
function flatten(obj, prefix = '') {
  const out = new Set()
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === 'object') {
          for (const p of flatten(item, `${path}[${i}]`)) out.add(p)
        } else {
          out.add(`${path}[${i}]`)
        }
      })
    } else if (value && typeof value === 'object') {
      for (const p of flatten(value, path)) out.add(p)
    } else {
      out.add(path)
    }
  }
  return out
}

const packs = { 'zh-CN': zhCN, en, ja, 'zh-TW': zhTW, ko, es, pt }
const basePaths = flatten(zhCN)

describe('locale 语言包键位奇偶', () => {
  it('基准包 zh-CN 结构完整', () => {
    expect(zhCN.name).toBe('zh-cn')
    // 关键路径抽查
    for (const p of ['eb.datepicker.months.jan', 'eb.select.placeholder', 'eb.transfer.titles[0]']) {
      expect(basePaths.has(p)).toBe(true)
    }
  })

  for (const [name, pack] of Object.entries(packs)) {
    if (name === 'zh-CN') continue
    it(`${name} 与 zh-CN 键位完全一致`, () => {
      const paths = flatten(pack)
      const missing = [...basePaths].filter((p) => !paths.has(p))
      const extra = [...paths].filter((p) => !basePaths.has(p))
      expect(missing, `${name} 缺少键: ${missing.join(', ')}`).toEqual([])
      expect(extra, `${name} 多出键: ${extra.join(', ')}`).toEqual([])
    })
  }

  it('共 7 个语言包', () => {
    expect(Object.keys(packs)).toHaveLength(7)
  })

  it('新增包 name 标识正确', () => {
    expect(ko.name).toBe('ko')
    expect(es.name).toBe('es')
    expect(pt.name).toBe('pt')
  })
})
