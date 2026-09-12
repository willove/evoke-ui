import { describe, it, expect } from 'vitest'
import {
  SUNBURST_DIM_ALPHA,
  computeSunburstGeometry,
  isSunburstDescendant,
  renderSunburstChart,
} from '../src/renderer/charts-extra.js'
import { renderTreemapChart } from '../src/renderer/charts-special.js'
import { mixColor } from '../src/renderer/core.js'

// 层级类图表统一的强调方式：悬浮节点与它的子孙保持原色，其余淡出。
const THEME = {
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  textColorSecondary: '#6b7280',
}
const PLOT = { x: 0, y: 0, width: 800, height: 600 }
const SUNBURST = () => [
  { name: '甲', children: [{ name: '甲一', children: [{ name: '甲一x', value: 30 }], value: 40 }, { name: '甲二', value: 60 }] },
  { name: '乙', value: 100 },
]
const TREEMAP = () => [
  { name: '甲', children: [{ name: '甲一', value: 40 }, { name: '甲二', value: 60 }] },
  { name: '乙', value: 100 },
]

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

function renderSunburst(hoverIndex, hoverAnimProgress = 1) {
  const { proxy, calls } = recorder()
  renderSunburstChart({
    ctx: proxy,
    theme: THEME,
    plotArea: PLOT,
    options: { sunburstData: SUNBURST() },
    progress: 1,
    hoverIndex,
    hoverAnimProgress,
    valueFormatter: (v) => String(v),
  })
  return calls
}

// 每次 fill 时生效的 globalAlpha（段填充一次一个；标签走 fillText 不计入）
function fillAlphas(calls) {
  const out = []
  let current = 1
  calls.forEach((c) => {
    if (c.name === 'set:globalAlpha') current = c.args[0]
    else if (c.name === 'fill') out.push(current)
  })
  return out
}

describe('层级图聚焦（矩形树图与旭日图同一套）', () => {
  it('旭日图：悬浮节点与其子孙保持原色，其余段淡出到 0.25', () => {
    const geo = computeSunburstGeometry(PLOT, { sunburstData: SUNBURST() }, THEME, (v) => String(v))
    const hoverIndex = geo.segments.findIndex((s) => s.node.name === '甲')
    const alphas = fillAlphas(renderSunburst(hoverIndex))
    const inFocus = geo.segments.filter((s, i) => isSunburstDescendant(geo.segments, i, hoverIndex)).length
    expect(inFocus).toBe(4) // 甲 + 甲一 + 甲一x + 甲二
    expect(alphas).toHaveLength(geo.segments.length)
    expect(alphas.filter((a) => a === 1)).toHaveLength(inFocus)
    expect(alphas.filter((a) => a === SUNBURST_DIM_ALPHA)).toHaveLength(geo.segments.length - inFocus)
  })

  it('旭日图：淡化程度随 hoverAnimProgress 缓动，不是硬切', () => {
    const geo = computeSunburstGeometry(PLOT, { sunburstData: SUNBURST() }, THEME, (v) => String(v))
    const hoverIndex = geo.segments.findIndex((s) => s.node.name === '甲')
    const mid = fillAlphas(renderSunburst(hoverIndex, 0.5))
    const expected = 1 - (1 - SUNBURST_DIM_ALPHA) * 0.5
    expect(mid).toContain(expected)
    expect(mid).not.toContain(SUNBURST_DIM_ALPHA)
  })

  it('旭日图：无悬浮时全部原色，被悬浮段自身加深一档', () => {
    const idle = renderSunburst(-1).filter((c) => c.name === 'set:globalAlpha').map((c) => c.args[0])
    expect(idle.every((a) => a === 1)).toBe(true)

    const geo = computeSunburstGeometry(PLOT, { sunburstData: SUNBURST() }, THEME, (v) => String(v))
    const hoverIndex = geo.segments.findIndex((s) => s.node.name === '乙')
    const fills = renderSunburst(hoverIndex).filter((c) => c.name === 'set:fillStyle').map((c) => c.args[0])
    expect(fills).toContain(mixColor(THEME.colors[1], 0.08, '#000000'))
  })

  it('isSunburstDescendant：自身、子孙为真；兄弟与祖先为假', () => {
    const geo = computeSunburstGeometry(PLOT, { sunburstData: SUNBURST() }, THEME, (v) => String(v))
    const idx = (name) => geo.segments.findIndex((s) => s.node.name === name)
    expect(isSunburstDescendant(geo.segments, idx('甲'), idx('甲'))).toBe(true)
    expect(isSunburstDescendant(geo.segments, idx('甲一x'), idx('甲'))).toBe(true)
    expect(isSunburstDescendant(geo.segments, idx('甲二'), idx('甲'))).toBe(true)
    expect(isSunburstDescendant(geo.segments, idx('乙'), idx('甲'))).toBe(false)
    expect(isSunburstDescendant(geo.segments, idx('甲'), idx('甲一'))).toBe(false)
  })

  it('矩形树图：悬浮块的子孙保持原色、其余淡出，且不再画阴影', () => {
    const { proxy, calls } = recorder()
    renderTreemapChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { treemapData: TREEMAP() },
      progress: 1,
      hoverIndex: 0, // 顶级「甲」及其两个子块
      hoverAnimProgress: 1,
      valueFormatter: (v) => String(v),
    })
    const alphas = fillAlphas(calls)
    expect(alphas.filter((a) => a === 1).length).toBeGreaterThanOrEqual(3)
    expect(alphas).toContain(SUNBURST_DIM_ALPHA)
    // 阴影是库里唯一的例外，按「默认无阴影」原则撤掉
    expect(calls.some((c) => c.name === 'set:shadowBlur' && c.args[0] > 0)).toBe(false)
  })

  it('矩形树图：无悬浮时全部原色', () => {
    const { proxy, calls } = recorder()
    renderTreemapChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { treemapData: TREEMAP() },
      progress: 1,
      hoverIndex: -1,
      valueFormatter: (v) => String(v),
    })
    const alphas = calls.filter((c) => c.name === 'set:globalAlpha').map((c) => c.args[0])
    expect(alphas.every((a) => a === 1)).toBe(true)
  })
})
