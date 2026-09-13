import { describe, it, expect } from 'vitest'
import { computeSankeyLayout, renderSankeyChart, sankeyHitTest, NODE_WIDTH } from '../src/renderer/charts-relation.js'

const THEME = {
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  textColorSecondary: '#6b7280',
}
const PLOT = { x: 0, y: 0, width: 800, height: 400 }

// 能源流动：三种一次能源 → 两种转换 → 终端用途
const ENERGY = () => ({
  nodes: [
    { name: '煤炭' }, { name: '天然气' }, { name: '水电' },
    { name: '发电' }, { name: '供热' },
    { name: '居民用电' }, { name: '工业用电' },
  ],
  links: [
    { source: '煤炭', target: '发电', value: 300 },
    { source: '煤炭', target: '供热', value: 100 },
    { source: '天然气', target: '发电', value: 200 },
    { source: '天然气', target: '供热', value: 150 },
    { source: '水电', target: '发电', value: 250 },
    { source: '发电', target: '居民用电', value: 400 },
    { source: '发电', target: '工业用电', value: 350 },
  ],
})

const OPTS = (data = ENERGY(), extra = {}) => ({ type: 'sankey', sankeyData: data, ...extra })

function recorder() {
  const calls = []
  const target = { measureText: () => ({ width: 10 }) }
  const proxy = new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop]
      if (typeof prop !== 'string') return undefined
      return (...args) => calls.push({ name: prop, args })
    },
    set(obj, prop, value) {
      calls.push({ name: `set:${String(prop)}`, args: [value] })
      return true
    },
  })
  return { proxy, calls }
}

describe('桑基布局（拓扑分列 / 高度即流量）', () => {
  it('节点深度按最长路：源在首列、转换在中列、终端在末列', () => {
    const geo = computeSankeyLayout(PLOT, OPTS(), THEME, new Set())
    const colOf = (name) => geo.nodes.find((n) => n.name === name).col
    expect(colOf('煤炭')).toBe(0)
    expect(colOf('发电')).toBe(1)
    expect(colOf('居民用电')).toBe(2)
    expect(geo.columnCount).toBe(3)
  })

  it('节点 x 按列均布，流带起点 = 源节点右缘', () => {
    const geo = computeSankeyLayout(PLOT, OPTS(), THEME, new Set())
    const coal = geo.nodes.find((n) => n.name === '煤炭')
    const power = geo.nodes.find((n) => n.name === '发电')
    expect(coal.x).toBe(0)
    expect(power.x).toBeCloseTo((1 * (PLOT.width - NODE_WIDTH)) / 2, 6)
    const link = geo.ribbons.find((r) => r.source.name === '煤炭' && r.target.name === '发电')
    expect(link.x1).toBeCloseTo(coal.x + NODE_WIDTH, 6)
    expect(link.x2).toBeCloseTo(power.x, 6)
  })

  it('节点高度 = max(入流,出流) 等比：发电(750) 是 煤炭(400) 的 1.875 倍', () => {
    const geo = computeSankeyLayout(PLOT, OPTS(), THEME, new Set())
    const coal = geo.nodes.find((n) => n.name === '煤炭')
    const power = geo.nodes.find((n) => n.name === '发电')
    const resident = geo.nodes.find((n) => n.name === '居民用电')
    expect(power.height / coal.height).toBeCloseTo(750 / 400, 6)
    expect(resident.height / coal.height).toBeCloseTo(400 / 400, 6)
  })

  it('同列节点垂直无重叠（含 12px 间隙）', () => {
    const geo = computeSankeyLayout(PLOT, OPTS(), THEME, new Set())
    const col0 = geo.nodes.filter((n) => n.col === 0).sort((a, b) => a.y - b.y)
    for (let i = 1; i < col0.length; i++) {
      expect(col0[i].y).toBeGreaterThanOrEqual(col0[i - 1].y + col0[i - 1].height + 12 - 1e-6)
    }
  })

  it('流带两端偏移互不重叠（源端按序累加不越过节点高度）', () => {
    const geo = computeSankeyLayout(PLOT, OPTS(), THEME, new Set())
    const coal = geo.nodes.find((n) => n.name === '煤炭')
    const outs = geo.ribbons.filter((r) => r.source === coal).sort((a, b) => a.sy0 - b.sy0)
    for (let i = 1; i < outs.length; i++) {
      expect(outs[i].sy0).toBeCloseTo(outs[i - 1].sy1, 6)
    }
    outs.forEach((r) => {
      expect(r.sy1).toBeLessThanOrEqual(coal.y + coal.height + 1e-6)
    })
  })

  it('隐藏中间节点后相关流带剔除、剩余重新等比', () => {
    const geo = computeSankeyLayout(PLOT, OPTS(), THEME, new Set(['供热']))
    expect(geo.nodes.some((n) => n.name === '供热')).toBe(false)
    expect(geo.ribbons.some((r) => r.link.target === '供热' || r.link.source === '供热')).toBe(false)
    // 供热(250) 被剔除后，发电仍是 750（不受影响）
    const power = geo.nodes.find((n) => n.name === '发电')
    expect(power.total).toBe(750)
  })

  it('节点总流量：转换节点取出流、终端节点取入流', () => {
    const geo = computeSankeyLayout(PLOT, OPTS(), THEME, new Set())
    expect(geo.nodes.find((n) => n.name === '发电').total).toBe(750)
    expect(geo.nodes.find((n) => n.name === '居民用电').total).toBe(400)
  })
})

describe('桑基渲染与命中同口径', () => {
  it('命中节点矩形返回节点参数；命中流带带内返回关系参数', () => {
    const geo = computeSankeyLayout(PLOT, OPTS(), THEME, new Set())
    const coal = geo.nodes.find((n) => n.name === '煤炭')
    const nodeHit = sankeyHitTest(coal.x + 5, coal.y + coal.height / 2, PLOT, OPTS(), THEME, new Set())
    expect(nodeHit.params.name).toBe('煤炭')
    expect(nodeHit.index).toBe(geo.nodes.findIndex((n) => n.name === '煤炭'))

    const link = geo.ribbons.find((r) => r.source.name === '煤炭' && r.target.name === '发电')
    const midX = (link.x1 + link.x2) / 2
    const t = (midX - link.x1) / (link.x2 - link.x1)
    const s = t * t * (3 - 2 * t)
    const yTop = link.sy0 + (link.ty0 - link.sy0) * s
    const linkHit = sankeyHitTest(midX, yTop + link.width / 2, PLOT, OPTS(), THEME, new Set())
    expect(linkHit.params.name).toBe('煤炭 → 发电')
    expect(linkHit.params.value).toBe(300)
  })

  it('渲染写出的贝塞尔控制点在流带两端 x 的中点（水平切出）', () => {
    const { proxy, calls } = recorder()
    renderSankeyChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: OPTS(),
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
      valueFormatter: (v) => String(v),
    })
    const beziers = calls.filter((c) => c.name === 'bezierCurveTo')
    expect(beziers.length).toBeGreaterThan(0)
    const geo = computeSankeyLayout(PLOT, OPTS(), THEME, new Set())
    const link = geo.ribbons[0]
    const midX = (link.x1 + link.x2) / 2
    beziers.slice(0, 2).forEach((b) => {
      expect(b.args[0]).toBeCloseTo(midX, 6)
      expect(b.args[2]).toBeCloseTo(midX, 6)
    })
  })
})
