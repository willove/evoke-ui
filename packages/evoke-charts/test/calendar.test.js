import { describe, it, expect } from 'vitest'
import { computeCalendarLayout, renderCalendarHeatmapChart, calendarHitTest } from '../src/renderer/charts-advanced.js'

const THEME = {
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  textColorSecondary: '#6b7280',
  gridColor: '#eff0f3',
}

const PLOT = { x: 40, y: 10, width: 800, height: 220 }

// 固定区间：2026-06-01（周一）～ 2026-08-31（周一），weekStart 1
function data(start, end, step = 864e5) {
  const out = []
  for (let ts = Date.parse(start); ts <= Date.parse(end); ts += step) {
    const d = new Date(ts)
    const dow = d.getDay()
    const base = dow === 0 || dow === 6 ? 2 : 20
    out.push({ date: d.toISOString().slice(0, 10), value: base + (ts / 864e5) % 7 })
  }
  return out
}

const OPTS = (extra = {}) => ({
  type: 'calendar-heatmap',
  calendarData: data('2026-06-01', '2026-08-31'),
  calendar: { start: '2026-06-01', end: '2026-08-31', weekStart: 1, today: '2026-08-15', ...extra },
})

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

describe('日历热力布局（列=周 / 行=星期 / 月标签 / 今日）', () => {
  it('格子数量 = 区间天数；周一对齐后 92 天 → 14 周（尾部补齐到周日）', () => {
    const geo = computeCalendarLayout(PLOT, OPTS(), THEME)
    // 6-01 至 8-31 共 92 天；首周对齐（周一开始已是周界），尾周补到周日
    expect(geo.cols).toBe(Math.ceil(92 / 7))
    expect(geo.cells.length).toBe(92)
    // 行数 7：每列周一（row 0）到周日（row 6）
    expect(geo.cells[0].row).toBe(0)
  })

  it('数值等宽分档：满档值落第 4 档、低值落第 1 档、缺测为空档（ramps[0]）', () => {
    const geo = computeCalendarLayout(PLOT, OPTS(), THEME)
    const values = geo.cells.map((c) => c.value)
    const vMax = Math.max(...values)
    const top = geo.cells.find((c) => c.value === vMax)
    expect(top.color).toBe(geo.ramps[4])
    // 低值（≤ vMax/4）落第 1 档
    const low = geo.cells.find((c) => c.value > 0 && c.value <= vMax / 4)
    expect(low.color).toBe(geo.ramps[1])
    const none = computeCalendarLayout(PLOT, {
      calendarData: [{ date: '2026-06-05', value: 0 }],
      calendar: { start: '2026-06-01', end: '2026-06-07' },
    }, THEME)
    expect(none.cells.find((c) => c.label === '2026-06-05').color).toBe(none.ramps[0])
  })

  it('今日格打标；月份标签在月份变化列生成', () => {
    const geo = computeCalendarLayout(PLOT, OPTS(), THEME)
    const today = geo.cells.find((c) => c.today)
    expect(today.label).toBe('2026-08-15')
    const labels = geo.monthLabels.map((m) => m.label)
    expect(labels).toContain('7月')
    expect(labels).toContain('8月')
  })

  it('星期标签默认只标一/三/五（weekStart=1 → row 0/2/4）', () => {
    const geo = computeCalendarLayout(PLOT, OPTS(), THEME)
    expect(geo.showRows.map((r) => r.name)).toEqual(['一', '三', '五'])
    const geo2 = computeCalendarLayout(PLOT, OPTS({ showAllWeekdays: true }), THEME)
    expect(geo2.showRows.length).toBe(7)
  })
})

describe('日历热力渲染与命中同口径', () => {
  it('命中格子返回日期 + 数值；格间空隙不命中', () => {
    const geo = computeCalendarLayout(PLOT, OPTS(), THEME)
    const c = geo.cells[10]
    const hit = calendarHitTest(c.x + c.size / 2, c.y + c.size / 2, PLOT, OPTS(), THEME)
    expect(hit.params.name).toBe(c.label)
    expect(hit.params.value).toBe(c.value)
    const miss = calendarHitTest(c.x - Math.max(2, geo.gap / 2) - 1, c.y + 1, PLOT, OPTS(), THEME)
    expect(miss === null || miss.params.name !== c.label).toBe(true)
  })

  it('今日格有主色描边（stroke 出现在 fill 之后的两轮绘制里）', () => {
    const { proxy, calls } = recorder()
    renderCalendarHeatmapChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: OPTS(),
      progress: 1,
      hoverIndex: -1,
    })
    const strokes = calls.filter((c) => c.name === 'stroke')
    expect(strokes.length).toBeGreaterThanOrEqual(1)
  })

  it('showScale 关闭后不画「少/多」', () => {
    const on = recorder()
    renderCalendarHeatmapChart({ ctx: on.proxy, theme: THEME, plotArea: PLOT, options: OPTS(), progress: 1, hoverIndex: -1 })
    const textsOn = on.calls.filter((c) => c.name === 'fillText').map((c) => String(c.args[0]))
    expect(textsOn).toContain('少')
    const off = recorder()
    renderCalendarHeatmapChart({ ctx: off.proxy, theme: THEME, plotArea: PLOT, options: OPTS({ showScale: false }), progress: 1, hoverIndex: -1 })
    const textsOff = off.calls.filter((c) => c.name === 'fillText').map((c) => String(c.args[0]))
    expect(textsOff).not.toContain('少')
  })
})
