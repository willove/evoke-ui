import { describe, it, expect } from 'vitest'
import { renderGaugeChart } from '../src/renderer/charts-advanced.js'
import { renderCandleChart, candleVolumeLayout } from '../src/renderer/charts-advanced.js'
import { renderBoxplotChart, computeBoxplotGeometry, boxplotHitTest } from '../src/renderer/charts-extra.js'
import { renderXAxis } from '../src/renderer/axes.js'

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

describe('K 线 + 成交量', () => {
  const CANDLES = [
    { label: '1月', open: 10, close: 12, high: 13, low: 9 },
    { label: '2月', open: 12, close: 11, high: 12.5, low: 10.5 },
    { label: '3月', open: 11, close: 14, high: 14.5, low: 10.8 },
  ]
  const YRANGE = { min: 8, max: 16 }

  it('candleVolumeLayout：量带开启时价格区占 76%', () => {
    const vol = candleVolumeLayout(PLOT, { candleData: CANDLES, volumeData: [100, 80, 140] }, new Set())
    expect(vol.on).toBe(true)
    expect(vol.priceArea.height).toBeCloseTo(PLOT.height * 0.76, 6)
    expect(vol.bandTop).toBeCloseTo(PLOT.y + PLOT.height * 0.76 + 1, 6)
  })

  it('图例隐去「成交量」后量带关闭、K 线回铺全高', () => {
    const hidden = new Set(['成交量'])
    const vol = candleVolumeLayout(PLOT, { candleData: CANDLES, volumeData: [100, 80, 140] }, hidden)
    expect(vol.on).toBe(false)
    expect(vol.priceArea.height).toBe(PLOT.height)
  })

  it('volumeData 与 candleData 不等长时量带不开启', () => {
    const vol = candleVolumeLayout(PLOT, { candleData: CANDLES, volumeData: [100] }, new Set())
    expect(vol.on).toBe(false)
  })

  it('量柱填充在量带内（y ≥ bandTop），颜色跟随涨跌', () => {
    const { proxy, calls } = recorder()
    renderCandleChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { candleData: CANDLES, volumeData: [100, 80, 140] },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    }, YRANGE)
    const vol = candleVolumeLayout(PLOT, { candleData: CANDLES, volumeData: [100, 80, 140] }, new Set())
    const fills = calls.filter((c) => c.name === 'fillRect')
    const volFills = fills.filter((c) => c.args[1] >= vol.bandTop - 1)
    expect(volFills.length).toBe(3)
    // 阳线红、阴线绿
    expect(calls.some((c) => c.name === 'set:globalAlpha' && c.args[0] === 0.55)).toBe(true)
  })
})

describe('仪表盘指针与外观定制', () => {
  const GAUGE = { value: 66, min: 0, max: 100, unit: '分' }

  it('默认形态无指针（不加针身三角），中心数值在 centerY 上方', () => {
    const { proxy, calls } = recorder()
    renderGaugeChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { gauge: GAUGE },
      progress: 1,
      hoverIndex: -1,
    })
    // 无针尾圆帽（r5 arc + fill 组合在数值绘制前只有 0 次 fill）
    expect(calls.filter((c) => c.name === 'arc' && Math.abs(c.args[2] - 5) < 1e-9).length).toBe(0)
  })

  it('pointer.show 后绘制针身三角 + 针尾圆帽，进度环淡化', () => {
    const { proxy, calls } = recorder()
    renderGaugeChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { gauge: { ...GAUGE, pointer: { show: true } } },
      progress: 1,
      hoverIndex: -1,
    })
    // 针尾圆帽 r5
    expect(calls.some((c) => c.name === 'arc' && Math.abs(c.args[2] - 5) < 1e-9)).toBe(true)
    // 进度环 globalAlpha 0.6（progressDim 默认开）
    expect(calls.some((c) => c.name === 'set:globalAlpha' && c.args[0] === 0.6)).toBe(true)
    // 数值下移避让：值文本 y 在盘心下方 max(26, radius×0.45) 处
    const valueText = calls.find((c) => c.name === 'fillText' && c.args[0] === '66')
    const radius = Math.min(600, 300) / 2 - 20
    expect(valueText.args[2]).toBeCloseTo(PLOT.y + PLOT.height / 2 + 20 + Math.max(26, radius * 0.45), 6)
  })

  it('axisWidth 覆写环厚', () => {
    const { proxy, calls } = recorder()
    renderGaugeChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { gauge: { ...GAUGE, axisWidth: 30 } },
      progress: 1,
      hoverIndex: -1,
    })
    expect(calls.filter((c) => c.name === 'set:lineWidth' && c.args[0] === 30).length).toBeGreaterThanOrEqual(2)
  })

  it('pointer.color 定制针色（不同于进度色）', () => {
    const { proxy, calls } = recorder()
    renderGaugeChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { gauge: { ...GAUGE, pointer: { show: true, color: '#111827' } } },
      progress: 1,
      hoverIndex: -1,
    })
    const fillStyle = calls.filter((c) => c.name === 'set:fillStyle')
    expect(fillStyle.some((c) => c.args[0] === '#111827')).toBe(true)
  })
})

describe('箱型图扩展', () => {
  const BOXES = () => [
    { label: '研发', min: 10, q1: 20, median: 30, q3: 40, max: 50, outliers: [70] },
    { label: '市场', min: 5, q1: 15, median: 22, q3: 35, max: 44 },
  ]

  it('showOutliers: false 后异常点不画', () => {
    const geo = computeBoxplotGeometry(PLOT, { boxData: BOXES(), showOutliers: false }, THEME, new Set(), { min: 0, max: 80 })
    geo.boxes.forEach((b) => expect(b.outliers.length).toBe(0))
  })

  it('boxHorizontal：箱体横向（须线沿 x 轴），类目在 y 向均分', () => {
    const geo = computeBoxplotGeometry(PLOT, { boxData: BOXES(), boxHorizontal: true }, THEME, new Set(), { min: 0, max: 80 })
    expect(geo.horizontal).toBe(true)
    const [a, b] = geo.boxes
    expect(Math.abs(b.cy - a.cy)).toBeCloseTo(PLOT.height / 2, 6)
    // 须线：wLo < qLo < med < qHi < wHi（x 向递增）
    expect(a.wLo).toBeLessThan(a.qLo)
    expect(a.qLo).toBeLessThan(a.med)
    expect(a.med).toBeLessThan(a.qHi)
    expect(a.qHi).toBeLessThan(a.wHi)
  })

  it('分组箱型：同类目内按组并排，颜色按组序取系列色', () => {
    const data = [
      { label: 'Q1', group: '线上', min: 10, q1: 20, median: 30, q3: 40, max: 50 },
      { label: 'Q1', group: '线下', min: 8, q1: 18, median: 25, q3: 38, max: 46 },
      { label: 'Q2', group: '线上', min: 12, q1: 22, median: 32, q3: 42, max: 52 },
      { label: 'Q2', group: '线下', min: 9, q1: 19, median: 27, q3: 36, max: 48 },
    ]
    const geo = computeBoxplotGeometry(PLOT, { boxData: data }, THEME, new Set(), { min: 0, max: 80 })
    expect(geo.groupedMode).toBe(true)
    expect(geo.groupNames).toEqual(['线上', '线下'])
    const q1Boxes = geo.boxes.filter((b) => b.b.label === 'Q1')
    expect(q1Boxes.length).toBe(2)
    // 两组中心对称于类目中心
    const catCenter = PLOT.x + 0.5 * (PLOT.width / 2)
    expect((q1Boxes[0].cx + q1Boxes[1].cx) / 2).toBeCloseTo(catCenter, 6)
    expect(q1Boxes[0].color).toBe(THEME.colors[0])
    expect(q1Boxes[1].color).toBe(THEME.colors[1])
  })

  it('图例隐去组后该组箱体剔除（命中测试同步）', () => {
    const data = [
      { label: 'Q1', group: '线上', min: 10, q1: 20, median: 30, q3: 40, max: 50 },
      { label: 'Q1', group: '线下', min: 8, q1: 18, median: 25, q3: 38, max: 46 },
    ]
    const hidden = new Set(['线下'])
    const geo = computeBoxplotGeometry(PLOT, { boxData: data }, THEME, hidden, { min: 0, max: 80 })
    expect(geo.boxes.length).toBe(1)
    const hit = boxplotHitTest(geo.boxes[0].cx, geo.boxes[0].cy, PLOT, { boxData: data }, THEME, hidden, { min: 0, max: 80 })
    expect(hit.params.seriesName).toBe('Q1 · 线上')
  })
})

describe('x 轴拥挤优化（抽稀 → 截断）', () => {
  function renderAxis(labels, plotArea, axisConfig = {}) {
    const { proxy, calls } = recorder((t) => ({ width: String(t).length * 8 }))
    renderXAxis({
      ctx: proxy,
      theme: THEME,
      plotArea,
      options: { labels, xAxis: axisConfig },
      hiddenSeries: new Set(),
    })
    return calls.filter((c) => c.name === 'fillText').map((c) => String(c.args[0]))
  }

  it('标签放不下自动抽稀：步距 ≥ 标签宽 + 12，首末必留', () => {
    const labels = Array.from({ length: 20 }, (_, i) => `类目名称${i}`)
    const texts = renderAxis(labels, { x: 0, y: 0, width: 400, height: 200 })
    // 步距 = ceil((40+12)/21) = 3 → i=0,3,6,9,12,15,18 + 末位 19 = 8 个
    expect(texts.length).toBe(8)
    expect(texts).toContain(labels[0])
    expect(texts).toContain(labels[labels.length - 1])
  })

  it('标签稀疏时全量展示', () => {
    const labels = ['1月', '2月', '3月', '4月']
    const texts = renderAxis(labels, { x: 0, y: 0, width: 600, height: 200 })
    expect(texts).toEqual(labels)
  })

  it('显式 interval 是硬步长', () => {
    const labels = Array.from({ length: 10 }, (_, i) => `${i + 1}月`)
    const texts = renderAxis(labels, { x: 0, y: 0, width: 600, height: 200 }, { interval: 3 })
    expect(texts).toEqual(['1月', '4月', '7月', '10月'])
  })
})
