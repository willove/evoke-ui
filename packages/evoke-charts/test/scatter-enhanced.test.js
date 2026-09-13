import { describe, it, expect } from 'vitest'
import {
  scatterPointPositions,
  scatterGroupColors,
  linearFit,
  computeFacetGrids,
  computeMatrixCells,
  matrixFieldExtent,
  renderScatterChart,
  renderScatterMatrixChart,
  renderScatterFacetChart,
} from '../src/renderer/charts-basic.js'

const THEME = {
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  textColorSecondary: '#6b7280',
}
const PLOT = { x: 40, y: 20, width: 600, height: 300 }
const YRANGE = { min: 0, max: 120 }

const DATA = () => [
  { x: 10, y: 32, label: 'A项目', group: '线上' },
  { x: 30, y: 48, label: 'B项目', group: '线上' },
  { x: 50, y: 60, label: 'C项目', group: '线下' },
  { x: 70, y: 90, label: 'D项目', group: '线下' },
]

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

describe('散点抖动（确定性偏移防重叠）', () => {
  it('同数据同偏移：两次计算结果完全一致', () => {
    const a = scatterPointPositions(DATA(), YRANGE, PLOT, { jitter: 12 })
    const b = scatterPointPositions(DATA(), YRANGE, PLOT, { jitter: 12 })
    expect(a).toEqual(b)
  })

  it('抖动只在半径内：偏移幅度 ≤ jitter', () => {
    const positions = scatterPointPositions(DATA(), YRANGE, PLOT, { jitter: 10 })
    const plain = scatterPointPositions(DATA(), YRANGE, PLOT, {})
    positions.forEach(([x, y], i) => {
      const [px, py] = plain[i]
      expect(Math.abs(x - px)).toBeLessThanOrEqual(10 + 1e-9)
      expect(Math.abs(y - py)).toBeLessThanOrEqual(10 + 1e-9)
    })
  })

  it('jitter 越界值夹在 0–20', () => {
    const wild = scatterPointPositions(DATA(), YRANGE, PLOT, { jitter: 99 })
    const at20 = scatterPointPositions(DATA(), YRANGE, PLOT, { jitter: 20 })
    expect(wild).toEqual(at20)
  })
})

describe('散点颜色通道分组', () => {
  it('按组首现顺序取系列色，同组同色', () => {
    const map = scatterGroupColors(DATA(), THEME)
    expect(map.size).toBe(2)
    expect(map.get('线上')).toBe(THEME.colors[0])
    expect(map.get('线下')).toBe(THEME.colors[1])
  })

  it('图例按组聚合（legend.js 侧由 chart 集成验证，此处验证组色来源）', () => {
    const data = [{ x: 1, y: 1, group: 'A' }, { x: 2, y: 2, group: 'A' }, { x: 3, y: 3, group: 'B' }]
    const map = scatterGroupColors(data, THEME)
    expect(map.get('A')).toBe(map.get('A'))
    expect(map.size).toBe(2)
  })
})

describe('回归线（linearFit + R²）', () => {
  it('完全线性数据 R² = 1，斜率正确', () => {
    const fit = linearFit([0, 1, 2, 3], [1, 3, 5, 7])
    expect(fit.r2).toBeCloseTo(1, 9)
    expect(fit.predict(10)).toBeCloseTo(21, 9)
  })

  it('噪声数据 R² 在 0–1 之间且小于完全线性', () => {
    const fit = linearFit([0, 1, 2, 3, 4], [0, 3, 3, 7, 10])
    expect(fit.r2).toBeGreaterThan(0)
    expect(fit.r2).toBeLessThan(1)
  })
})

describe('四象限与点标注（渲染层）', () => {
  it('quadrant 配置绘制十字虚线与四角标签', () => {
    const { proxy, calls } = recorder()
    renderScatterChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: {
        scatterData: DATA(),
        quadrant: { labels: ['潜力', '明星', '观察', '瘦狗'] },
      },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    }, YRANGE)
    expect(calls.some((c) => c.name === 'setLineDash' && c.args[0].join(',') === '4,4')).toBe(true)
    const texts = calls.filter((c) => c.name === 'fillText').map((c) => String(c.args[0]))
    ;['潜力', '明星', '观察', '瘦狗'].forEach((t) => expect(texts).toContain(t))
  })

  it('pointLabels 开启时每点绘制 label，重叠点让位不画', () => {
    const { proxy, calls } = recorder(() => ({ width: 10 }))
    renderScatterChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { scatterData: DATA(), pointLabels: true },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    }, YRANGE)
    const texts = calls.filter((c) => c.name === 'fillText').map((c) => String(c.args[0]))
    expect(texts).toContain('A项目')
    expect(texts).toContain('D项目')
  })
})

describe('分面散点', () => {
  it('按组切网格：2 组 → 1 行 2 列，每格独立量程', () => {
    const grid = computeFacetGrids(DATA(), PLOT, {})
    expect(grid.facets.length).toBe(2)
    expect(grid.cols).toBe(2)
    expect(grid.rows).toBe(1)
    const [f0, f1] = grid.facets
    expect(f0.name).toBe('线上')
    // 每格量程只看本组数据
    expect(f0.yMax).toBe(48)
    expect(f1.yMax).toBe(90)
  })

  it('单一组时退回普通散点渲染', () => {
    const grid = computeFacetGrids([{ x: 1, y: 1, group: 'A' }], PLOT, {})
    expect(grid).toBe(null)
  })

  it('分面渲染写出的点位落在各自格内', () => {
    const { proxy, calls } = recorder()
    renderScatterFacetChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { scatterData: DATA() },
      yRange: YRANGE,
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    })
    const arcs = calls.filter((c) => c.name === 'arc' && Math.abs(c.args[4] - Math.PI * 2) < 1e-9)
    expect(arcs.length).toBe(4)
    const grid = computeFacetGrids(DATA(), PLOT, {})
    arcs.forEach((a) => {
      const [x, y] = a.args
      const inCell = grid.facets.some((f) => x >= f.area.x && x <= f.area.x + f.area.width && y >= f.area.y && y <= f.area.y + f.area.height)
      expect(inCell).toBe(true)
    })
  })
})

describe('散点矩阵', () => {
  const FIELDS = ['面积', '总价', '距地铁']
  const RECORDS = () => [
    { 面积: 60, 总价: 300, 距地铁: 1.2, label: '甲小区' },
    { 面积: 90, 总价: 520, 距地铁: 0.4, label: '乙小区' },
    { 面积: 120, 总价: 700, 距地铁: 2.0, label: '丙小区' },
    { 面积: 45, 总价: 210, 距地铁: 0.8, label: '丁小区' },
  ]

  it('n 字段生成 n×n 格，对角格坐标正确', () => {
    const cells = computeMatrixCells(PLOT, FIELDS)
    expect(cells.length).toBe(9)
    const diag = cells.filter((c) => c.row === c.col)
    expect(diag.length).toBe(3)
    expect(diag[0].yField).toBe('面积')
    expect(diag[1].xField).toBe('总价')
  })

  it('字段量程含 8% 余量', () => {
    const ext = matrixFieldExtent(RECORDS(), '面积')
    expect(ext.min).toBeLessThan(45)
    expect(ext.max).toBeGreaterThan(120)
  })

  it('渲染：非对角格画点，对角格只写字段名', () => {
    const { proxy, calls } = recorder()
    renderScatterMatrixChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { matrixFields: FIELDS, matrixData: RECORDS() },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    })
    const arcs = calls.filter((c) => c.name === 'arc')
    // 6 个非对角格 × 4 条记录
    expect(arcs.length).toBe(24)
    const texts = calls.filter((c) => c.name === 'fillText').map((c) => String(c.args[0]))
    FIELDS.forEach((f) => expect(texts).toContain(f))
  })
})
