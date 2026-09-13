import { describe, it, expect } from 'vitest'
import { computeVennLayout, renderVennChart, vennHitTest, VENN_FILL_ALPHA } from '../src/renderer/charts-relation.js'

const THEME = {
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  textColorSecondary: '#6b7280',
}
const PLOT = { x: 0, y: 0, width: 600, height: 400 }

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

describe('韦恩布局（等面积半径 / 交集反解圆距）', () => {
  it('半径按 √值等面积：值 4 倍 → 半径 2 倍', () => {
    const geo = computeVennLayout(PLOT, {
      vennData: [{ name: 'A', value: 400 }, { name: 'B', value: 100 }],
    }, THEME)
    expect(geo.circles[0].r / geo.circles[1].r).toBeCloseTo(2, 6)
  })

  it('交集越大圆距越近（数值反解单调）', () => {
    const near = computeVennLayout(PLOT, {
      vennData: [
        { name: 'A', value: 300 },
        { name: 'B', value: 300 },
        { sets: ['A', 'B'], value: 200 },
      ],
    }, THEME)
    const far = computeVennLayout(PLOT, {
      vennData: [
        { name: 'A', value: 300 },
        { name: 'B', value: 300 },
        { sets: ['A', 'B'], value: 10 },
      ],
    }, THEME)
    const dNear = Math.abs(near.circles[0].x - near.circles[1].x)
    const dFar = Math.abs(far.circles[0].x - far.circles[1].x)
    expect(dNear).toBeLessThan(dFar)
    expect(dFar).toBeGreaterThan(near.circles[0].r * 0.5)
  })

  it('交集值等于较小集合时退化为包含（圆距 = 半径差）', () => {
    const geo = computeVennLayout(PLOT, {
      vennData: [
        { name: 'A', value: 400 },
        { name: 'B', value: 100 },
        { sets: ['A', 'B'], value: 100 },
      ],
    }, THEME)
    const d = Math.abs(geo.circles[0].x - geo.circles[1].x)
    expect(d).toBeCloseTo(Math.abs(geo.circles[0].r - geo.circles[1].r), 4)
  })

  it('三集合：整体质心居中于绘图区', () => {
    const geo = computeVennLayout(PLOT, {
      vennData: [
        { name: 'A', value: 300 }, { name: 'B', value: 260 }, { name: 'C', value: 200 },
        { sets: ['A', 'B'], value: 90 }, { sets: ['A', 'C'], value: 60 }, { sets: ['B', 'C'], value: 40 },
      ],
    }, THEME)
    const cx = geo.circles.reduce((s, c) => s + c.x, 0) / 3
    const cy = geo.circles.reduce((s, c) => s + c.y, 0) / 3
    expect(cx).toBeCloseTo(PLOT.width / 2, 0)
    expect(cy).toBeCloseTo(PLOT.height / 2, 0)
  })

  it('vennHollow 只描边不填充', () => {
    const { proxy, calls } = recorder()
    renderVennChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { vennHollow: true, vennData: [{ name: 'A', value: 300 }, { name: 'B', value: 300 }] },
      progress: 1,
      hoverIndex: -1,
      hoverAnimProgress: 1,
      hiddenSeries: new Set(),
    })
    const fills = calls.filter((c) => c.name === 'fill')
    expect(fills.length).toBe(0)
    const strokes = calls.filter((c) => c.name === 'stroke')
    expect(strokes.length).toBeGreaterThanOrEqual(2)
  })

  it('基础形态：填充透明度为 VENN_FILL_ALPHA', () => {
    const { proxy, calls } = recorder()
    renderVennChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { vennData: [{ name: 'A', value: 300 }, { name: 'B', value: 300 }] },
      progress: 1,
      hoverIndex: -1,
      hoverAnimProgress: 1,
      hiddenSeries: new Set(),
    })
    const fillCalls = []
    let last = null
    calls.forEach((c) => {
      if (c.name === 'set:globalAlpha') last = c.args[0]
      else if (c.name === 'fill') fillCalls.push(last)
    })
    expect(fillCalls).toContain(VENN_FILL_ALPHA)
  })
})

describe('韦恩命中', () => {
  const OPTIONS = {
    vennData: [
      { name: 'A', value: 300 },
      { name: 'B', value: 300 },
      { sets: ['A', 'B'], value: 150 },
    ],
  }

  it('命中单圆返回集合参数', () => {
    const geo = computeVennLayout(PLOT, OPTIONS, THEME)
    const a = geo.circles[0]
    // 取 A 的最左缘（远离交集区），避免误入 B 的覆盖范围
    const hit = vennHitTest(a.x - a.r * 0.9, a.y, PLOT, OPTIONS, THEME, new Set())
    expect(hit.params.name).toBe('A')
  })

  it('命中交集区返回交集参数（index = 圆数 + 交集序）', () => {
    const hit = vennHitTest(PLOT.width / 2, PLOT.height / 2, PLOT, OPTIONS, THEME, new Set())
    expect(hit.params.name).toBe('A ∩ B')
    expect(hit.params.value).toBe(150)
    expect(hit.index).toBe(2)
  })

  it('图例隐去一圆后交集命中消失', () => {
    const hit = vennHitTest(PLOT.width / 2, PLOT.height / 2, PLOT, OPTIONS, THEME, new Set(['B']))
    expect(hit === null || hit.params.name !== 'A ∩ B').toBe(true)
  })
})
