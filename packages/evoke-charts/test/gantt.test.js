import { describe, it, expect } from 'vitest'
import { computeGanttLayout, renderGanttChart, ganttHitTest } from '../src/renderer/charts-gantt.js'

const THEME = {
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  textColorSecondary: '#6b7280',
}
const PLOT = { x: 100, y: 10, width: 700, height: 300 }

const PROJECT = () => [
  { name: '需求确认', start: '2026-01-01', end: '2026-01-10', progress: 1 },
  { name: '视觉设计', start: '2026-01-12', end: '2026-01-25', progress: 0.6, dependsOn: ['需求确认'] },
  { name: '前端开发', start: '2026-01-27', end: '2026-02-20', progress: 0.2, dependsOn: ['视觉设计'] },
  { name: '验收上线', start: '2026-02-21', end: '2026-02-28', milestone: false },
]

const OPTS = (data = PROJECT(), extra = {}) => ({ type: 'gantt', ganttData: data, ...extra })

function recorder() {
  const calls = []
  const target = { measureText: (t) => ({ width: String(t).length * 8 }) }
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

describe('甘特布局（行带 / 时间刻度 / 进度）', () => {
  it('任务条 y 随行序单调，行高均分且不超过 44', () => {
    const geo = computeGanttLayout(PLOT, OPTS(), THEME, new Set())
    expect(geo.rowH).toBeLessThanOrEqual(44)
    for (let i = 1; i < geo.rows.length; i++) {
      expect(geo.rows[i].y).toBeGreaterThan(geo.rows[i - 1].y)
      expect(geo.rows[i].y - geo.rows[i - 1].y).toBeCloseTo(geo.rowH, 6)
    }
  })

  it('时间映射单调：起止越晚 x 越靠右，条宽 = 时长占比', () => {
    const geo = computeGanttLayout(PLOT, OPTS(), THEME, new Set())
    const [a, b] = geo.rows
    expect(geo.xFor(Date.parse(b.end))).toBeGreaterThan(geo.xFor(Date.parse(a.end)))
    const span = geo.tmax - geo.tmin
    const expectedW = ((Date.parse(a.end) - Date.parse(a.start)) / span) * geo.chartW
    expect(a.w).toBeCloseTo(Math.max(3, expectedW), 0)
  })

  it('左列宽按最宽任务名实测并夹在 80–180', () => {
    const geo = computeGanttLayout(PLOT, OPTS(), THEME, new Set())
    // 「验收上线」5 字 × 12px ≈ 60 + 16 → 不低于 80
    expect(geo.labelW).toBeGreaterThanOrEqual(80)
    expect(geo.labelW).toBeLessThanOrEqual(180)
    const long = [{ name: '这是一个特别特别特别特别长的任务名称', start: '2026-01-01', end: '2026-02-01' }]
    const geo2 = computeGanttLayout(PLOT, OPTS(long), THEME, new Set())
    expect(geo2.labelW).toBe(180)
  })

  it('依赖关系解析为折线段（前完成缘 → 后左缘）', () => {
    const geo = computeGanttLayout(PLOT, OPTS(), THEME, new Set())
    expect(geo.deps.length).toBe(2)
    const dep = geo.deps.find((d) => d.from.name === '需求确认' && d.to.name === '视觉设计')
    expect(dep.from.x + dep.from.w).toBeLessThanOrEqual(dep.to.x)
  })

  it('隐藏任务后行数减少且依赖随之过滤', () => {
    const geo = computeGanttLayout(PLOT, OPTS(), THEME, new Set(['视觉设计']))
    expect(geo.rows.length).toBe(3)
    expect(geo.deps.some((d) => d.from.name === '需求确认' || d.to.name === '前端开发')).toBe(false)
  })
})

describe('甘特渲染与命中同口径', () => {
  it('命中行即命中任务，参数带起止与进度', () => {
    const geo = computeGanttLayout(PLOT, OPTS(), THEME, new Set())
    const row2 = geo.rows[2]
    const hit = ganttHitTest(row2.x + row2.w / 2, geo.rows[2].cy, PLOT, OPTS(), THEME, new Set())
    expect(hit.index).toBe(2)
    expect(hit.params.seriesName).toBe('前端开发')
    expect(hit.params.extra.progress).toBeCloseTo(0.2, 6)
    expect(hit.params.extra.start).toBe('2026-01-27')
  })

  it('进度段实心：行内进度标签按百分比绘制', () => {
    const { proxy, calls } = recorder()
    renderGanttChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: OPTS(),
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    })
    const texts = calls.filter((c) => c.name === 'fillText').map((c) => String(c.args[0]))
    expect(texts).toContain('100%')
    expect(texts).toContain('60%')
    expect(texts).toContain('20%')
  })

  it('今日线：ganttToday 后出现主色竖线与「今日」标注', () => {
    const { proxy, calls } = recorder()
    renderGanttChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: OPTS(PROJECT(), { ganttToday: '2026-01-15' }),
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    })
    const texts = calls.filter((c) => c.name === 'fillText').map((c) => String(c.args[0]))
    expect(texts).toContain('今日')
    const geo = computeGanttLayout(PLOT, OPTS(PROJECT(), { ganttToday: '2026-01-15' }), THEME, new Set())
    expect(geo.todayX).toBeGreaterThan(geo.chartX)
    expect(geo.todayX).toBeLessThan(geo.chartX + geo.chartW)
  })

  it('里程碑：milestone 后画旋转 45° 菱形（translate+rotate）', () => {
    const data = [{ name: '评审', start: '2026-01-10', end: '2026-01-10', milestone: true }]
    const { proxy, calls } = recorder()
    renderGanttChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: OPTS(data),
      progress: 1,
      hoverIndex: -1,
      hiddenSeries: new Set(),
    })
    expect(calls.some((c) => c.name === 'translate')).toBe(true)
    expect(calls.some((c) => c.name === 'rotate' && Math.abs(c.args[0] - Math.PI / 4) < 1e-9)).toBe(true)
  })
})
