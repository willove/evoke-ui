import { describe, it, expect } from 'vitest'
import {
  DOCK_SIDES,
  DOCK_PRESENTATIONS,
  createLayoutTree,
  normalizeLayout,
  serializeLayout,
  deserializeLayout,
  loadLayout,
  saveLayout,
  findPanel,
  findDock,
  dockOf,
  allPanelIds,
  visiblePanels,
  togglePanelCollapsed,
  toggleDockCollapsed,
  setPanelSize,
  hidePanel,
  showPanel,
  maximizePanel,
  restorePanel,
  addDock,
  removeDock,
  resetLayout,
  layoutEquals,
} from '../src/runtime/layout/tree'

const defaultTree = () => ({
  docks: [
    {
      id: 'left',
      side: 'left',
      panels: [
        { id: 'files', title: '文件', size: 280, min: 200, max: 480, closable: false },
        { id: 'search', title: '搜索', size: 240 },
      ],
    },
    {
      id: 'right',
      side: 'right',
      panels: [{ id: 'props', title: '属性', size: 300 }],
    },
  ],
  maximized: null,
})

describe('构造与校验', () => {
  it('合法定义通过；缺 title / 坏 side / 坏 size 收集 errors', () => {
    expect(() => createLayoutTree(defaultTree())).not.toThrow()
    const errors = []
    const tree = normalizeLayout(
      {
        docks: [
          { id: 'bad-side', side: 'top', panels: [] },
          { id: 'ok', side: 'left', panels: [{ id: 'p', title: '' }] },
          { id: 's', side: 'bottom', panels: [{ id: 'q', title: '底部', size: -5 }] },
        ],
      },
      null,
      errors,
    )
    expect(errors.join(' ')).toMatch(/side 必须是/)
    expect(errors.join(' ')).toMatch(/title 必填/)
    expect(errors.join(' ')).toMatch(/size 必须是/)
    // bad-side 整条被丢；ok 的面板因 title 缺失被丢但 dock 保留（空 dock 合法）；
    // s 的坏 size 只记 error，面板本身保留
    expect(tree.docks.map((d) => d.id)).toEqual(['ok', 's'])
  })

  it('id 命名空间全局唯一（dock 与面板共用）', () => {
    const errors = []
    normalizeLayout(
      {
        docks: [
          { id: 'left', side: 'left', panels: [{ id: 'dup', title: 'A' }] },
          { id: 'dup', side: 'right', panels: [] },
        ],
      },
      null,
      errors,
    )
    expect(errors.join(' ')).toMatch(/重复/)
  })

  it('enter 时布尔默认值落定（collapsed/hidden/closable）', () => {
    const tree = createLayoutTree({
      docks: [{ id: 'left', side: 'left', panels: [{ id: 'p', title: 'P' }] }],
    })
    expect(tree.docks[0].panels[0]).toMatchObject({ collapsed: false, hidden: false, closable: true })
  })
})

describe('序列化与损坏降级（不白屏）', () => {
  it('round-trip 保真', () => {
    const tree = createLayoutTree(defaultTree())
    const { tree: back, usedFallback } = deserializeLayout(serializeLayout(tree), defaultTree())
    expect(usedFallback).toBe(false)
    expect(layoutEquals(back, tree)).toBe(true)
  })

  it('JSON 坏档 → 降级默认布局', () => {
    const { tree, errors, usedFallback } = deserializeLayout('{oops', defaultTree())
    expect(usedFallback).toBe(true)
    expect(errors[0]).toMatch(/JSON 解析失败/)
    expect(tree.docks).toHaveLength(2)
  })

  it('结构坏档（docks 空 / 非对象）→ 降级', () => {
    expect(deserializeLayout('{"docks":[]}', defaultTree()).usedFallback).toBe(true)
    expect(deserializeLayout('"字符串"', defaultTree()).usedFallback).toBe(true)
  })

  it('半坏档：可用 dock 保留、坏项进 errors', () => {
    const { tree, usedFallback, errors } = deserializeLayout(
      JSON.stringify({ docks: [{ id: 'ok', side: 'left', panels: [{ id: 'p', title: 'P' }] }, { id: 'bad', side: 'nope', panels: [] }] }),
      defaultTree(),
    )
    expect(usedFallback).toBe(false)
    expect(tree.docks.map((d) => d.id)).toEqual(['ok'])
    expect(errors.join(' ')).toMatch(/side/)
  })

  it('storage 读写：空 key、异常存储都降级不炸', () => {
    const mem = () => {
      const map = new Map()
      return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)) }
    }
    const s = mem()
    expect(loadLayout(s, 'k', defaultTree()).usedFallback).toBe(false)
    const tree = createLayoutTree(defaultTree())
    expect(saveLayout(s, 'k', tree)).toBe(true)
    expect(layoutEquals(loadLayout(s, 'k', defaultTree()).tree, tree)).toBe(true)

    const bad = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
    expect(loadLayout(bad, 'k', defaultTree()).usedFallback).toBe(true)
    expect(saveLayout(bad, 'k', tree)).toBe(false)
  })
})

describe('查询', () => {
  it('findPanel / findDock / dockOf', () => {
    const tree = createLayoutTree(defaultTree())
    expect(findPanel(tree, 'search').dock.id).toBe('left')
    expect(findPanel(tree, 'nope')).toBeNull()
    expect(dockOf(tree, 'props').side).toBe('right')
    expect(findDock(tree, 'left').panels).toHaveLength(2)
  })

  it('visiblePanels 排除 hidden/collapsed', () => {
    let tree = createLayoutTree(defaultTree())
    tree = togglePanelCollapsed(tree, 'search')
    tree = hidePanel(tree, 'props')
    expect(visiblePanels(tree).map((p) => p.id)).toEqual(['files'])
  })
})

describe('变更（返回新树、输入不改）', () => {
  it('折叠 / 整个 dock 折叠', () => {
    const tree = createLayoutTree(defaultTree())
    const t1 = togglePanelCollapsed(tree, 'search')
    expect(findPanel(t1, 'search').panel.collapsed).toBe(true)
    expect(findPanel(tree, 'search').panel.collapsed).toBe(false)
    const t2 = toggleDockCollapsed(t1, 'left')
    expect(findDock(t2, 'left').collapsed).toBe(true)
  })

  it('未知 id 的操作原样返回', () => {
    const tree = createLayoutTree(defaultTree())
    expect(togglePanelCollapsed(tree, 'nope')).toBe(tree)
    expect(hidePanel(tree, 'nope')).toBe(tree)
    expect(maximizePanel(tree, 'nope')).toBe(tree)
  })

  it('setPanelSize 过 min/max 夹角', () => {
    const tree = createLayoutTree(defaultTree())
    expect(findPanel(setPanelSize(tree, 'files', 999), 'files').panel.size).toBe(480)
    expect(findPanel(setPanelSize(tree, 'files', 10), 'files').panel.size).toBe(200)
    expect(findPanel(setPanelSize(tree, 'files', '50%'), 'files').panel.size).toBe('50%')
    expect(setPanelSize(tree, 'files', -1)).toBe(tree) // 非法的尺寸不动树
  })

  it('隐藏显式可恢复；隐藏最大化目标时自动退出最大化', () => {
    let tree = createLayoutTree(defaultTree())
    tree = maximizePanel(tree, 'props')
    tree = hidePanel(tree, 'props')
    expect(tree.maximized).toBeNull()
    tree = showPanel(tree, 'props')
    expect(findPanel(tree, 'props').panel.hidden).toBe(false)
    expect(findPanel(tree, 'props').panel.collapsed).toBe(false) // hidePanel 清掉折叠态
  })

  it('最大化同一刻只有一个', () => {
    let tree = createLayoutTree(defaultTree())
    tree = maximizePanel(tree, 'files')
    tree = maximizePanel(tree, 'props')
    expect(tree.maximized).toBe('props')
    expect(restorePanel(tree).maximized).toBeNull()
  })

  it('增删 dock：删到最后一个被拒', () => {
    let tree = createLayoutTree(defaultTree())
    const added = addDock(tree, { id: 'bottom', side: 'bottom', panels: [{ id: 'log', title: '日志' }] })
    expect(added.errors).toEqual([])
    expect(findDock(added.tree, 'bottom').panels).toHaveLength(1)
    tree = added.tree
    const r1 = removeDock(tree, 'left')
    expect(r1.errors).toEqual([])
    const r2 = removeDock(r1.tree, 'right')
    expect(r2.errors).toEqual([])
    const r3 = removeDock(r2.tree, 'bottom')
    expect(r3.errors).toEqual(['至少保留一个 dock'])
  })

  it('resetLayout 返回默认树的副本', () => {
    const tree = createLayoutTree(defaultTree())
    const reset = resetLayout(tree)
    expect(layoutEquals(reset, tree)).toBe(true)
    expect(reset).not.toBe(tree)
  })

  it('layoutEquals 识别无变更（持久化写盘前比对）', () => {
    const tree = createLayoutTree(defaultTree())
    expect(layoutEquals(tree, createLayoutTree(defaultTree()))).toBe(true)
    expect(layoutEquals(tree, togglePanelCollapsed(tree, 'files'))).toBe(false)
  })

  it('DOCK_SIDES 契约', () => {
    expect(DOCK_SIDES).toEqual(['left', 'right', 'bottom'])
  })

  it('presentation 进树并过持久化（tabs 档刷新不丢），非法值记 error', () => {
    const tree = createLayoutTree({
      docks: [{ id: 'left', side: 'left', presentation: 'tabs', panels: [{ id: 'p', title: 'P' }] }],
    })
    expect(tree.docks[0].presentation).toBe('tabs')
    const back = deserializeLayout(serializeLayout(tree), null)
    expect(back.tree.docks[0].presentation).toBe('tabs')

    const errors = []
    const fallback = normalizeLayout({ docks: [{ id: 'l', side: 'left', presentation: 'nope', panels: [] }] }, null, errors)
    expect(errors.join(' ')).toMatch(/presentation 必须是/)
    expect(fallback.docks[0].presentation).toBe('stack') // 未声明 = 默认档
  })
})
