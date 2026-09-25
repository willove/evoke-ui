import { describe, it, expect } from 'vitest'
import {
  RIBBON_SCALE_TIERS,
  nextCollapsed,
  toolAreaHeight,
  scaleGroup,
  planGroupScaleTiers,
  planContextTabs,
  loadCollapsed,
  saveCollapsed,
} from '../src/runtime/ribbon/state'

describe('折叠状态机', () => {
  it('四动作语义', () => {
    expect(nextCollapsed(false, 'toggle')).toBe(true)
    expect(nextCollapsed(true, 'toggle')).toBe(false)
    expect(nextCollapsed(false, 'collapse')).toBe(true)
    expect(nextCollapsed(true, 'expand')).toBe(false)
    expect(nextCollapsed(true, 'peek')).toBe(true) // peek 不改持久态
    expect(nextCollapsed(false, '未知动作')).toBe(false)
  })

  it('折叠态工具区高度归零（--et-chrome-toolarea-collapsed = 0）', () => {
    expect(toolAreaHeight({ collapsed: true, largeButton: 56, groupLabel: 16 })).toBe(0)
    expect(toolAreaHeight({ collapsed: false, largeButton: 56, groupLabel: 16 })).toBe(72)
    expect(toolAreaHeight({ collapsed: false, largeButton: 48, groupLabel: 16 })).toBe(64) // 紧凑档
  })
})

describe('分量降级（ScalingPolicy）', () => {
  const group = {
    key: 'g-font',
    type: 'group',
    label: '字体',
    children: [
      { key: 'bold', type: 'item', command: 'bold' },
      { key: 'italic', type: 'item', command: 'italic' },
    ],
  }

  it('FULL 档原样返回', () => {
    expect(scaleGroup(group, RIBBON_SCALE_TIERS.FULL)).toBe(group)
  })

  it('SMALL 档条目转小钮', () => {
    const scaled = scaleGroup(group, RIBBON_SCALE_TIERS.SMALL)
    expect(scaled.scaled).toBe('small')
    expect(scaled.children.every((c) => c.size === 'small')).toBe(true)
    expect(group.children[0].size).toBeUndefined() // 输入不改
  })

  it('GROUP_DROPDOWN 档整组退化（官方建议：几乎每个组都声明到最小档）', () => {
    const scaled = scaleGroup(group, RIBBON_SCALE_TIERS.GROUP_DROPDOWN)
    expect(scaled.scaled).toBe('dropdown')
    expect(scaled.children.every((c) => c.inDropdown)).toBe(true)
  })
})

describe('逐组降级规划', () => {
  const groups = [
    { key: 'a', width: 300, items: 3, smallWidth: 28, dropdownWidth: 96 },
    { key: 'b', width: 200, items: 2, smallWidth: 28, dropdownWidth: 96 },
    { key: 'c', width: 100, items: 1, smallWidth: 28, dropdownWidth: 96 },
  ]

  it('放得下时全部 FULL', () => {
    const r = planGroupScaleTiers(groups, 800, { gap: 8 })
    expect(r.tiers).toEqual({ a: 0, b: 0, c: 0 })
    expect(r.fits).toBe(true)
    expect(r.overflow).toEqual([])
  })

  it('宽度不足时从最宽的组开始降档', () => {
    // 600 - (300+200+100) = 0 → 全 FULL 放不下；最宽的 a 先降 SMALL：84+200+100=384+16=400 ≤ 600
    const r = planGroupScaleTiers(groups, 600, { gap: 8 })
    expect(r.tiers.a).toBe(1)
    expect(r.fits).toBe(true)
  })

  it('全部最小档仍放不下 → 从最宽的组开始贪心收进「更多」', () => {
    // 三个 1 条目组（各档都 100 宽）：全 DROPDOWN = 316 > 240；收 a、b 剩 100 + 入口 60 = 168 ≤ 240
    const flat = [
      { key: 'a', width: 100, items: 1, smallWidth: 100, dropdownWidth: 100 },
      { key: 'b', width: 100, items: 1, smallWidth: 100, dropdownWidth: 100 },
      { key: 'c', width: 100, items: 1, smallWidth: 100, dropdownWidth: 100 },
    ]
    const r = planGroupScaleTiers(flat, 240, { gap: 8, moreWidth: 60 })
    expect(r.tiers).toEqual({ c: 2 })
    expect(r.overflow).toEqual(['a', 'b'])
    expect(r.fits).toBe(true)
  })

  it('一个都放不下时 overflow 非空、fits=false', () => {
    const flat = [
      { key: 'a', width: 400, items: 1, smallWidth: 400, dropdownWidth: 400 },
      { key: 'b', width: 400, items: 1, smallWidth: 400, dropdownWidth: 400 },
    ]
    const r = planGroupScaleTiers(flat, 20, { gap: 8, moreWidth: 60 })
    expect(r.overflow).toEqual(['a', 'b'])
    expect(r.fits).toBe(false)
  })
})

describe('上下文 tab（声明式唤出）', () => {
  const contextTabs = [
    { id: 'pic-format', when: (ctx) => ctx.selection === 'picture' },
    { id: 'chart-design', when: (ctx) => ctx.selection === 'chart' },
  ]

  it('条件满足才可见；激活项不可见时退回 null', () => {
    const r = planContextTabs(contextTabs, 'chart-design', { selection: 'chart' })
    expect(r.visible).toEqual(['chart-design'])
    expect(r.active).toBe('chart-design')
    const r2 = planContextTabs(contextTabs, 'chart-design', { selection: 'picture' })
    expect(r2.active).toBeNull()
    expect(r2.visible).toEqual(['pic-format'])
  })

  it('when 缺省视为常可见', () => {
    expect(planContextTabs([{ id: 'x' }], null, {}).visible).toEqual(['x'])
  })
})

describe('持久化（异常静默降级）', () => {
  const mem = () => {
    const map = new Map()
    return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)) }
  }

  it('存取往返', () => {
    const s = mem()
    expect(loadCollapsed(s, 'k')).toBe(false)
    saveCollapsed(s, 'k', true)
    expect(loadCollapsed(s, 'k')).toBe(true)
  })

  it('存储抛异常不炸（隐私模式 / 配额满）', () => {
    const bad = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
    expect(loadCollapsed(bad, 'k')).toBe(false)
    expect(saveCollapsed(bad, 'k', true)).toBe(false)
  })
})
