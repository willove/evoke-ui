import { describe, it, expect } from 'vitest'
import {
  computeChordLayout, renderChordChart, chordHitTest,
  computeArcLayout, renderArcChart, arcHitTest,
} from '../src/renderer/charts-relation.js'

const THEME = {
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  textColorSecondary: '#6b7280',
}
const PLOT = { x: 0, y: 0, width: 600, height: 600 }

// 部门协作关系
const RELATION = () => ({
  nodes: [{ name: '研发' }, { name: '设计' }, { name: '市场' }, { name: '客服' }],
  links: [
    { source: '研发', target: '设计', value: 40 },
    { source: '研发', target: '市场', value: 10 },
    { source: '设计', target: '市场', value: 25 },
    { source: '市场', target: '客服', value: 30 },
  ],
})

describe('环形弦图布局', () => {
  it('节点弧长默认均布，节点按 2° 间隙隔开', () => {
    const geo = computeChordLayout(PLOT, { chordData: RELATION() }, THEME, new Set())
    const spans = geo.nodeArcs.map((n) => n.endAngle - n.startAngle)
    spans.forEach((s) => expect(s).toBeCloseTo(spans[0], 6))
    const total = Math.PI * 2 - (2 * Math.PI / 180) * 4
    expect(spans[0] * 4).toBeCloseTo(total, 6)
  })

  it('chordByValue 时弧长按值占比', () => {
    const geo = computeChordLayout(PLOT, { chordData: RELATION(), chordByValue: true }, THEME, new Set())
    const yanfa = geo.nodeArcs.find((n) => n.name === '研发')
    const kefu = geo.nodeArcs.find((n) => n.name === '客服')
    // 研发出入度和 50，客服 30
    expect((yanfa.endAngle - yanfa.startAngle) / (kefu.endAngle - kefu.startAngle)).toBeCloseTo(50 / 30, 3)
  })

  it('关系带颜色继承源节点色，宽度按值映射', () => {
    const geo = computeChordLayout(PLOT, { chordData: RELATION() }, THEME, new Set())
    const big = geo.ribbons.find((r) => r.link.value === 40)
    const small = geo.ribbons.find((r) => r.link.value === 10)
    expect(big.color).toBe(THEME.colors[0])
    expect(big.halfWidth / small.halfWidth).toBeCloseTo(4, 6)
  })

  it('隐藏节点后相连关系带剔除', () => {
    const geo = computeChordLayout(PLOT, { chordData: RELATION() }, THEME, new Set(['客服']))
    expect(geo.nodeArcs.length).toBe(3)
    expect(geo.ribbons.length).toBe(3)
  })

  it('命中测试：命中关系带采样折线附近返回关系参数', () => {
    const geo = computeChordLayout(PLOT, { chordData: RELATION() }, THEME, new Set())
    const ribbon = geo.ribbons.find((r) => r.link.value === 40)
    const mid = ribbon.samples[12]
    const hit = chordHitTest(mid[0], mid[1], PLOT, { chordData: RELATION() }, THEME, new Set())
    expect(hit.params.name).toBe('研发 ↔ 设计')
    expect(hit.params.value).toBe(40)
  })
})

describe('线性弧长连接图布局', () => {
  it('节点均布水平轴，弧样点全部在轴上方', () => {
    const geo = computeArcLayout(PLOT, { arcData: RELATION() }, THEME, new Set())
    geo.nodes.forEach((n, i) => {
      expect(n.x).toBeCloseTo(PLOT.x + (i + 0.5) * (PLOT.width / geo.nodes.length), 6)
    })
    geo.arcs.forEach((a) => {
      a.samples.forEach(([x, y]) => {
        expect(y).toBeLessThanOrEqual(geo.axisY + 1e-6)
        expect(x).toBeGreaterThanOrEqual(Math.min(a.x1, a.x2) - 1e-6)
        expect(x).toBeLessThanOrEqual(Math.max(a.x1, a.x2) + 1e-6)
      })
    })
  })

  it('线宽 1.5–6 线性映射关系值', () => {
    const geo = computeArcLayout(PLOT, { arcData: RELATION() }, THEME, new Set())
    const big = geo.arcs.find((a) => a.link.value === 40)
    const small = geo.arcs.find((a) => a.link.value === 10)
    expect(big.width).toBeCloseTo(6, 6)
    expect(small.width).toBeCloseTo(1.5 + (10 / 40) * 4.5, 6)
  })

  it('弧色继承源节点色；隐藏节点剔除相关弧', () => {
    const geo = computeArcLayout(PLOT, { arcData: RELATION() }, THEME, new Set(['设计']))
    expect(geo.arcs.length).toBe(2)
    expect(geo.arcs.every((a) => a.source.name !== '设计' && a.target.name !== '设计')).toBe(true)
  })

  it('命中测试：弧中点附近返回关系参数', () => {
    const geo = computeArcLayout(PLOT, { arcData: RELATION() }, THEME, new Set())
    const arc = geo.arcs.find((a) => a.link.value === 30)
    const mid = arc.samples[12]
    const hit = arcHitTest(mid[0], mid[1], PLOT, { arcData: RELATION() }, THEME, new Set())
    expect(hit.params.name).toBe('市场 ↔ 客服')
    expect(hit.params.value).toBe(30)
  })

  it('渲染：贝塞尔控制点在弧顶（y = axisY - cy）', () => {
    const { proxy, calls } = recorderShared()
    renderArcChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { arcData: RELATION() },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    })
    const beziers = calls.filter((c) => c.name === 'bezierCurveTo')
    expect(beziers.length).toBe(4)
    const geo = computeArcLayout(PLOT, { arcData: RELATION() }, THEME, new Set())
    beziers.forEach((b) => {
      expect(b.args[1]).toBeLessThan(geo.axisY)
      expect(b.args[3]).toBeLessThan(geo.axisY)
    })
  })
})

function recorderShared() {
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

describe('弦图渲染', () => {
  it('节点弧以 10px 描边绘制，标签在半径外 18px', () => {
    const { proxy, calls } = recorderShared()
    renderChordChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { chordData: RELATION() },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    })
    const strokes = calls.filter((c) => c.name === 'set:lineWidth' && c.args[0] === 10)
    expect(strokes.length).toBe(4)
    const geo = computeChordLayout(PLOT, { chordData: RELATION() }, THEME, new Set())
    const labels = calls.filter((c) => c.name === 'fillText' && c.args[0] === '研发')
    expect(labels.length).toBe(1)
    const [lx, ly] = labels[0].args.slice(1)
    const n = geo.nodeArcs.find((x) => x.name === '研发')
    const expectedX = geo.cx + Math.cos(n.midAngle) * (geo.R + 18)
    const expectedY = geo.cy + Math.sin(n.midAngle) * (geo.R + 18)
    expect(lx).toBeCloseTo(expectedX, 0)
    expect(ly).toBeCloseTo(expectedY, 0)
  })
})
