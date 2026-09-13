import { describe, it, expect } from 'vitest'
import { computeFunnelGeometry, funnelStepColor, renderFunnelChart } from '../src/renderer/charts-advanced.js'
import { mixColor, getContrastText } from '../src/renderer/core.js'

const THEME = {
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  textColorSecondary: '#6b7280',
}
const DARK_THEME = { ...THEME, backgroundColor: '#111827', textColor: '#f3f4f6' }
const PLOT = { x: 0, y: 0, width: 800, height: 300 }

// 校招漏斗：极差 23 倍，尾层退化成针尖的老案例
const CAMPUS = () => [
  { label: '收到简历', value: 4860 },
  { label: '笔试通过', value: 1620 },
  { label: '初面通过', value: 760 },
  { label: '终面通过', value: 285 },
  { label: '接受 Offer', value: 212 },
]

function geometry(data = CAMPUS(), options = {}, theme = THEME) {
  return computeFunnelGeometry(PLOT, { funnelData: data, ...options }, theme)
}

// 画布录制代理：收集绘制调用与赋值（jsdom 无 2d context）
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

describe('漏斗几何（宽度即数值 / 末端不收针尖）', () => {
  it('每层上宽 = 本层值 / 最大值 × 80% 绘图区宽', () => {
    const geo = geometry()
    expect(geo.maxWidth).toBeCloseTo(PLOT.width * 0.8, 6)
    geo.steps.forEach((step) => {
      expect(step.topWidth).toBeCloseTo((step.data.value / geo.maxValue) * geo.maxWidth, 6)
    })
  })

  it('下宽等于下一层的值，末层下宽等于自身宽度（底部是平边不是针尖）', () => {
    const geo = geometry()
    geo.steps.slice(0, -1).forEach((step, i) => {
      expect(step.bottomWidth).toBeCloseTo(geo.steps[i + 1].topWidth, 6)
    })
    const last = geo.steps[geo.steps.length - 1]
    expect(last.bottomWidth).toBeCloseTo(last.topWidth, 6)
    // 旧口径会把末层再收 50% 成尖：明确挡住回归
    expect(last.bottomWidth).toBeGreaterThan(last.topWidth * 0.9)
  })

  it('层高均分可用高度（上下各留 8px），宽度单调随数值', () => {
    const geo = geometry()
    expect(geo.stepHeight).toBeCloseTo((PLOT.height - 16) / 5, 6)
    expect(geo.steps[0].y).toBeCloseTo(PLOT.y + 8, 6)
    for (let i = 1; i < geo.steps.length; i++) {
      expect(geo.steps[i].topWidth).toBeLessThan(geo.steps[i - 1].topWidth)
    }
  })

  it('funnelMinRatio 压缩尾段：宽度映射为 min + (1−min) × 值/最大值，单调性不变', () => {
    const geo = geometry(CAMPUS(), { funnelMinRatio: 0.2 })
    const last = geo.steps[geo.steps.length - 1]
    const expected = geo.maxWidth * (0.2 + 0.8 * (212 / 4860))
    expect(last.topWidth).toBeCloseTo(expected, 6)
    for (let i = 1; i < geo.steps.length; i++) {
      expect(geo.steps[i].topWidth).toBeLessThan(geo.steps[i - 1].topWidth)
    }
    // 越界值夹在 0–0.5
    expect(geometry(CAMPUS(), { funnelMinRatio: 9 }).steps[4].topWidth).toBeCloseTo(geo.maxWidth * (0.5 + 0.5 * (212 / 4860)), 6)
    expect(geometry(CAMPUS(), { funnelMinRatio: -3 }).steps[4].topWidth).toBeCloseTo(geometry().steps[4].topWidth, 6)
  })

  it('pyramid 反转绘制顺序，但配色仍按数据层序（最大值始终是基准色）', () => {
    const geo = geometry(CAMPUS(), { pyramid: true })
    expect(geo.steps[0].data.label).toBe('接受 Offer')
    expect(geo.steps[0].topWidth).toBeLessThan(geo.steps[4].topWidth)
    expect(geo.steps[4].color).toBe(THEME.colors[0])
    expect(geo.steps[0].color).not.toBe(THEME.colors[0])
  })
})

describe('漏斗同色系深浅（不用彩虹）', () => {
  it('首层取主题首色，逐层向白混合 15%（上限 60%）', () => {
    const geo = geometry()
    expect(geo.steps[0].color).toBe(THEME.colors[0])
    expect(geo.steps[1].color).toBe(mixColor(THEME.colors[0], 0.15, '#ffffff'))
    expect(geo.steps[4].color).toBe(mixColor(THEME.colors[0], 0.6, '#ffffff'))
  })

  it('段色不再逐层取多色相', () => {
    const colors = geometry().steps.map((s) => s.color)
    expect(new Set(colors).size).toBe(colors.length)
    colors.slice(1).forEach((c) => expect(THEME.colors).not.toContain(c))
  })

  it('暗色主题向黑混合 12%/层（上限 45%）', () => {
    const geo = geometry(CAMPUS(), {}, DARK_THEME)
    expect(geo.steps[0].color).toBe(DARK_THEME.colors[0])
    expect(geo.steps[1].color).toBe(mixColor(DARK_THEME.colors[0], 0.12, '#000000'))
    expect(geo.steps[4].color).toBe(mixColor(DARK_THEME.colors[0], 0.45, '#000000'))
  })

  it('显式 color 是该层定色，不参与逐层混合', () => {
    const data = CAMPUS()
    data[2].color = '#B91C1C'
    expect(funnelStepColor(data[2], 2, THEME)).toBe('#B91C1C')
    expect(geometry(data).steps[2].color).toBe('#B91C1C')
  })
})

describe('漏斗渲染与几何同口径', () => {
  function render(options = {}, theme = THEME) {
    const { proxy, calls } = recorder()
    renderFunnelChart({
      ctx: proxy,
      theme,
      plotArea: PLOT,
      options: { funnelData: CAMPUS(), ...options },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
      valueFormatter: (v) => String(v),
    })
    return calls
  }

  it('梯形四个顶点与几何口径一致（首层左右对称于中心）', () => {
    const geo = geometry()
    const calls = render()
    const moves = calls.filter((c) => c.name === 'moveTo' || c.name === 'lineTo')
    const first = geo.steps[0]
    expect(moves[0].args).toEqual([geo.centerX - first.topWidth / 2, first.y])
    expect(moves[1].args).toEqual([geo.centerX + first.topWidth / 2, first.y])
    expect(moves[2].args).toEqual([geo.centerX + first.bottomWidth / 2, first.y + geo.stepHeight])
    expect(moves[3].args).toEqual([geo.centerX - first.bottomWidth / 2, first.y + geo.stepHeight])
  })

  /** 层片填充色 = 每次 fill() 之前最后一次 fillStyle 赋值（文字色走 fillText，不会混进来） */
  function bandFills(calls) {
    const out = []
    let last = null
    calls.forEach((c) => {
      if (c.name === 'set:fillStyle') last = c.args[0]
      else if (c.name === 'fill') out.push(last)
    })
    return out
  }

  it('每层填充色就是几何给出的段色，悬浮时同色加深 8%（不位移）', () => {
    const geo = geometry()
    expect(bandFills(render())).toEqual(geo.steps.map((s) => s.color))

    const { proxy, calls: hoverCalls } = recorder()
    renderFunnelChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { funnelData: CAMPUS() },
      progress: 1,
      hoverIndex: 1,
      hiddenSeries: new Set(),
      valueFormatter: (v) => String(v),
    })
    const hoverFills = bandFills(hoverCalls)
    expect(hoverFills[1]).toBe(mixColor(geo.steps[1].color, 0.08, '#000000'))
    expect(hoverFills[0]).toBe(geo.steps[0].color)
    // 悬浮只换色不动形：顶点坐标与常态渲染逐点相同
    const pick = (list) => list.filter((c) => c.name === 'moveTo' || c.name === 'lineTo').map((c) => c.args)
    expect(pick(hoverCalls)).toEqual(pick(render()))
  })

  it('占比按最大值折算，整数不补小数位', () => {
    const calls = render()
    const texts = calls.filter((c) => c.name === 'fillText').map((c) => String(c.args[0]))
    expect(texts).toContain('4860 (100%)')
    expect(texts).toContain('1620 (33.3%)')
    expect(texts).toContain('212 (4.4%)')
  })

  it('内嵌标签文字色按段底色取对比度更高的一方（提亮后自动转深字，不写死反白）', () => {
    // 矮容器挤掉外侧标签，只剩段内两行，便于按绘制顺序对上段色
    const { proxy, calls } = recorder()
    renderFunnelChart({
      ctx: proxy,
      theme: THEME,
      plotArea: { ...PLOT, height: 420 },
      options: { funnelData: CAMPUS() },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
      valueFormatter: (v) => String(v),
    })
    let lastFill = null
    const labelColors = []
    calls.forEach((c) => {
      if (c.name === 'set:fillStyle') lastFill = c.args[0]
      else if (c.name === 'fillText') labelColors.push(lastFill)
    })
    const geo = geometry(CAMPUS(), {}, THEME)
    expect(labelColors.length).toBeGreaterThan(0)
    // 首层深蓝 → 白字；末层浅蓝 → 深字（白字会糊）
    expect(labelColors[0]).toBe(getContrastText(geo.steps[0].color))
    expect(labelColors[0]).toBe('#ffffff')
    expect(getContrastText(geo.steps[4].color)).toBe('#111827')
    // 段内标签只允许「白字 / 深字」，其余颜色只可能来自外侧标签（主色 / 次要色）
    labelColors.forEach((c) => {
      expect(['#ffffff', '#111827', THEME.textColor, THEME.textColorSecondary]).toContain(c)
    })
  })

  it('隐藏层后剩余层重新等比（宽度口径跟着可见数据走）', () => {
    const { proxy, calls } = recorder()
    renderFunnelChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { funnelData: CAMPUS() },
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(['收到简历']),
      valueFormatter: (v) => String(v),
    })
    const moves = calls.filter((c) => c.name === 'moveTo' || c.name === 'lineTo')
    // 最大值（1620）铺满 80% 绘图区，其后按剩余可见数据等比
    expect(moves[1].args[0] - moves[0].args[0]).toBeCloseTo(PLOT.width * 0.8, 6)
    expect(moves[5].args[0] - moves[4].args[0]).toBeCloseTo((760 / 1620) * PLOT.width * 0.8, 6)
  })
})
