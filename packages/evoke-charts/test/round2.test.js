import { describe, it, expect } from 'vitest'
import { renderGaugeChart } from '../src/renderer/charts-advanced.js'
import { renderCandleChart, candleVolumeLayout } from '../src/renderer/charts-advanced.js'
import { computeBoxplotGeometry, boxplotHitTest } from '../src/renderer/charts-extra.js'
import { renderScatterFacetChart } from '../src/renderer/charts-basic.js'
import { computeChordLayout, renderChordChart } from '../src/renderer/charts-relation.js'

const THEME = {
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  textColorSecondary: '#6b7280',
  gridColor: '#eff0f3',
  borderColor: '#e0e2e7',
}
const PLOT = { x: 50, y: 10, width: 600, height: 300 }

function recorder(measure) {
  const calls = []
  const target = { measureText: measure || (() => ({ width: 10 })) }
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

describe('仪表盘弧向（数学角约定：弧走上方、开口朝下）', () => {
  const GAUGE = { value: 66, min: 0, max: 100 }

  function renderGauge(options) {
    const { proxy, calls } = recorder()
    renderGaugeChart({ ctx: proxy, theme: THEME, plotArea: PLOT, options, progress: 1, hoverIndex: -1 })
    return calls
  }

  it('默认 220→-40：首条弧起点 = -220°（canvas 角换算），终点 = 40°，顺时针经顶部', () => {
    const calls = renderGauge({ gauge: GAUGE })
    const arc = calls.find((c) => c.name === 'arc')
    expect(arc.args[3]).toBeCloseTo((-220 * Math.PI) / 180, 6)
    expect(arc.args[4]).toBeCloseTo((40 * Math.PI) / 180, 6)
    expect(arc.args[5]).toBe(false)
    // 260° 扫角
    expect(arc.args[4] - arc.args[3]).toBeCloseTo((260 * Math.PI) / 180, 6)
  })

  it('进度弧终点按值落位（66/100 → 220-260×0.66 = 48.4°），且位于上半盘', () => {
    const calls = renderGauge({ gauge: GAUGE })
    const progressArc = calls.filter((c) => c.name === 'arc')[1]
    const endDeg = 220 - 260 * 0.66
    expect(progressArc.args[4]).toBeCloseTo((-endDeg * Math.PI) / 180, 6)
    // canvas 角 -48.4° 的 sin 为负 → y 在盘心上方
    expect(Math.sin(progressArc.args[4])).toBeLessThan(0)
  })

  it('半盘 180→0：起点 = -180°、终点 = 0°，经典 ∩ 形态（弧顶在上）', () => {
    const calls = renderGauge({ gauge: { ...GAUGE, startAngle: 180, endAngle: 0 } })
    const arc = calls.find((c) => c.name === 'arc')
    expect(arc.args[3]).toBeCloseTo(-Math.PI, 6)
    expect(arc.args[4]).toBeCloseTo(0, 6)
    expect(arc.args[5]).toBe(false)
  })
})

describe('分面散点返回值契约', () => {
  it('renderScatterFacetChart 必须返回数组（renderChart 读取 points）', () => {
    const { proxy } = recorder()
    const out = renderScatterFacetChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: {
        facet: true,
        scatterData: [
          { x: 1, y: 2, group: 'A' },
          { x: 3, y: 4, group: 'B' },
        ],
      },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    }, { min: 0, max: 5 })
    expect(Array.isArray(out)).toBe(true)
    expect(out.length).toBe(0)
  })
})

describe('分组箱线命中：按类目轴取最近箱', () => {
  const data = [
    { label: 'Q1', group: '线上', min: 10, q1: 20, median: 30, q3: 40, max: 50 },
    { label: 'Q1', group: '线下', min: 8, q1: 18, median: 25, q3: 38, max: 46 },
    { label: 'Q2', group: '线上', min: 12, q1: 22, median: 32, q3: 42, max: 52 },
    { label: 'Q2', group: '线下', min: 9, q1: 19, median: 27, q3: 36, max: 48 },
  ]
  const RANGE = { min: 0, max: 80 }

  it('悬停第二箱（线下）左半区即命中第二箱，不再被第一箱吞掉', () => {
    const geo = computeBoxplotGeometry(PLOT, { boxData: data }, THEME, new Set(), RANGE)
    const q1 = geo.boxes.filter((b) => b.b.label === 'Q1')
    q1.sort((a, b) => a.cx - b.cx)
    // 第二箱中心左移 1/3 slot（仍在第二箱领地内）
    const slot = q1[1].cx - q1[0].cx
    const x = q1[1].cx - slot / 3
    const hit = boxplotHitTest(x, q1[1].cy, PLOT, { boxData: data }, THEME, new Set(), RANGE)
    expect(hit.params.seriesName).toBe('Q1 · 线下')
  })

  it('命中区有界：远离全部箱体的 x 不命中', () => {
    const geo = computeBoxplotGeometry(PLOT, { boxData: data }, THEME, new Set(), RANGE)
    const hit = boxplotHitTest(PLOT.x + PLOT.width + 50, PLOT.y, PLOT, { boxData: data }, THEME, new Set(), RANGE)
    expect(hit).toBe(null)
    void geo
  })
})

describe('K 线 MA 均线', () => {
  const CANDLES = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}日`,
    open: 10 + i,
    close: 11 + i,
    high: 12 + i,
    low: 9 + i,
  }))
  const YRANGE = { min: 8, max: 26 }

  it('candleMa: [5] 画一条折线，首点从第 5 根开始（收盘价 5 日均值）', () => {
    const { proxy, calls } = recorder()
    renderCandleChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { candleData: CANDLES, candleMa: [5] },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    }, YRANGE)
    // 影线：12 根 × (moveTo+lineTo)；MA：1 moveTo + 7 lineTo
    const moves = calls.filter((c) => c.name === 'moveTo')
    expect(moves.length).toBe(13)
    expect(calls.filter((c) => c.name === 'lineTo').length).toBe(19)
    // MA 首点（第 13 个 moveTo）x = 第 5 根的槽中心
    const slot = PLOT.width / 12
    expect(moves[12].args[0]).toBeCloseTo(PLOT.x + 4.5 * slot, 6)
  })

  it('图例隐去 MA5 后只剩影线（无 MA 折线）', () => {
    const { proxy, calls } = recorder()
    renderCandleChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { candleData: CANDLES, candleMa: [5] },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(['MA5']),
    }, YRANGE)
    const moves = calls.filter((c) => c.name === 'moveTo')
    expect(moves.length).toBe(12)
    expect(calls.filter((c) => c.name === 'lineTo').length).toBe(12)
  })
})

describe('弦图弧形环状形态（chordMode: curve）', () => {
  const RELATION = () => ({
    nodes: [{ name: '研发' }, { name: '设计' }, { name: '市场' }],
    links: [
      { source: '研发', target: '设计', value: 40 },
      { source: '设计', target: '市场', value: 20 },
    ],
  })

  it('mode 标记为 curve；连接带宽度按值线性映射（1.5–6）', () => {
    const geo = computeChordLayout(PLOT, { chordData: RELATION(), chordMode: 'curve' }, THEME, new Set())
    expect(geo.mode).toBe('curve')
    const big = geo.ribbons.find((r) => r.link.value === 40)
    const small = geo.ribbons.find((r) => r.link.value === 20)
    expect(big.lineWidth).toBeCloseTo(6, 6)
    expect(small.lineWidth).toBeCloseTo(3.75, 6)
  })

  it('curve 渲染以描边弧线 + 节点圆点呈现（无 10px 节点弧描边）', () => {
    const { proxy, calls } = recorder()
    renderChordChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { chordData: RELATION(), chordMode: 'curve' },
      progress: 1,
      hoverIndex: -1,
      hoverAnimProgress: 1,
      hiddenSeries: new Set(),
    })
    const strokes = calls.filter((c) => c.name === 'stroke')
    expect(strokes.length).toBeGreaterThanOrEqual(5)
    // 节点为圆点（arc 半径 6）
    expect(calls.filter((c) => c.name === 'arc' && Math.abs(c.args[2] - 6) < 1e-9).length).toBe(3)
    // fill 只出现在节点圆点（3 次），无 ribbon 色带
    expect(calls.filter((c) => c.name === 'fill').length).toBe(3)
  })

  it('band 形态（默认）保持节点 10px 弧描边', () => {
    const { proxy, calls } = recorder()
    renderChordChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { chordData: RELATION() },
      progress: 1,
      hoverIndex: -1,
      hoverAnimProgress: 1,
      hiddenSeries: new Set(),
    })
    expect(calls.filter((c) => c.name === 'set:lineWidth' && c.args[0] === 10).length).toBe(3)
  })
})
