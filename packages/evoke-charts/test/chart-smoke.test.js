import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvChart from '../src/chart.vue'
import { getPadding } from '../src/renderer/core.js'
import { renderYAxis, thinTickValues } from '../src/renderer/axes.js'
import { applySeriesPalette, clearSeriesPalette } from '../src/palette.js'

// Chart 渲染走 canvas 2d + rAF；jsdom 无 2d context，用 Proxy 兜底任意 ctx 方法
function mockCanvas() {
  const calls = new Map()
  const target = {
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  }
  const ctx = new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop]
      if (!calls.has(prop)) {
        calls.set(prop, vi.fn())
      }
      return calls.get(prop)
    },
  })
  ctx.__calls = calls
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  return ctx
}

const LINE_OPTIONS = () => ({
  type: 'line',
  labels: ['一', '二', '三', '四'],
  series: [
    { name: '营收', data: [10, 40, 25, 60] },
    { name: '成本', data: [5, 20, 15, 30] },
  ],
  legend: { show: true },
})

// 渲染管线共享的 ctx 探针（beforeEach 里重建；跨 describe 读取绘制调用）
let ctx

describe('EvChart（提取冒烟（ev 命名空间））', () => {
  beforeEach(() => {
    // 异步调度 + 巨大时间戳：一帧内动画到终点，且不与渲染同步递归
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(() => cb(performance.now() + 1e9), 0)
      return 1
    })
    // jsdom 布局为 0：mock 容器/画布尺寸，避免渲染入口早退
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return {
        left: 0, top: 0, right: 800, bottom: 400,
        width: 800, height: 400, x: 0, y: 0,
        toJSON: () => {},
      }
    })
    ctx = mockCanvas()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 渲染经 16ms 防抖
  const flushRender = () => new Promise((r) => setTimeout(r, 40))

  it('双 class + canvas 渲染 + options 变化重渲', async () => {
    const wrapper = mount(EvChart, {
      props: { options: LINE_OPTIONS() },
      attachTo: document.body,
    })
    await nextTick()
    expect(wrapper.find('.ev-chart').exists()).toBe(true)
    expect(wrapper.find('canvas.ev-chart__canvas').exists()).toBe(true)
    await flushRender()
    const callsBefore = (ctx.__calls.get('clearRect')?.mock.calls.length ?? 0)
      + (ctx.__calls.get('fillRect')?.mock.calls.length ?? 0)
      + (ctx.__calls.get('fill')?.mock.calls.length ?? 0)
      + (ctx.__calls.get('stroke')?.mock.calls.length ?? 0)
    expect(callsBefore).toBeGreaterThan(0)
    await wrapper.setProps({ options: { ...LINE_OPTIONS(), series: [{ name: 'x', data: [1, 2] }] } })
    await flushRender()
    const callsAfter = (ctx.__calls.get('clearRect')?.mock.calls.length ?? 0)
      + (ctx.__calls.get('fillRect')?.mock.calls.length ?? 0)
      + (ctx.__calls.get('fill')?.mock.calls.length ?? 0)
      + (ctx.__calls.get('stroke')?.mock.calls.length ?? 0)
    expect(callsAfter).toBeGreaterThan(callsBefore)
    wrapper.unmount()
  })

  it('尺寸 props 生效', async () => {
    const wrapper = mount(EvChart, {
      props: { options: LINE_OPTIONS(), width: '50%', height: 240 },
      attachTo: document.body,
    })
    await nextTick()
    const style = wrapper.find('.ev-chart').attributes('style')
    expect(style).toContain('width: 50%')
    expect(style).toContain('height: 240px')
    wrapper.unmount()
  })

  it('空数据：空态渲染而非报错', async () => {
    const wrapper = mount(EvChart, {
      props: { options: { type: 'line', labels: [], series: [] } },
      attachTo: document.body,
    })
    await flushRender()
    expect(wrapper.find('canvas.ev-chart__canvas').exists()).toBe(false)
    const html = wrapper.html()
    expect(html.toLowerCase()).toContain('暂无')
    wrapper.unmount()
  })

  it('pie 类型渲染（pieData 数据面）', async () => {
    const wrapper = mount(EvChart, {
      props: {
        options: {
          type: 'pie',
          pieData: [
            { name: 'A', value: 30 },
            { name: 'B', value: 70 },
          ],
        },
      },
      attachTo: document.body,
    })
    await flushRender()
    expect(wrapper.find('canvas').exists()).toBe(true)
    // 饼图走 arc 绘制
    expect((ctx.__calls.get('arc')?.mock.calls.length ?? 0)).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('渲染报错不崩溃（internalError 空态）', async () => {
    // getContext 抛错 → 组件内部错误兜底
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('no 2d')
    })
    const wrapper = mount(EvChart, {
      props: { options: LINE_OPTIONS() },
      attachTo: document.body,
    })
    await flushRender()
    expect(wrapper.find('.ev-chart').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('getPadding 绘图区空间利用', () => {
  const LINE = { type: 'line', labels: ['一', '二'], series: [{ name: 'x', data: [1, 2] }], legend: { show: false } }

  it('轴类默认留白：left 按刻度标签宽度自适应，其余定值', () => {
    const p = getPadding(LINE, 800)
    expect(p.top).toBe(18)
    expect(p.right).toBe(24)
    expect(p.bottom).toBe(46)
    expect(p.left).toBeGreaterThanOrEqual(40)
    expect(p.left).toBeLessThanOrEqual(140)
  })

  it('大数量级标签自适应加宽 left，零截断', () => {
    const p = getPadding({ ...LINE, yAxis: { min: 0, max: 1000000 } }, 800)
    expect(p.left).toBeGreaterThan(65)
    const small = getPadding({ ...LINE, yAxis: { min: 0, max: 10, ticks: 2 } }, 800)
    expect(small.left).toBeLessThan(65)
  })

  it('默认底部图例带叠加（46 + 26）', () => {
    const p = getPadding({ ...LINE, legend: { show: true } }, 800)
    expect(p.bottom).toBe(46 + 26)
  })

  it('x 轴整体隐藏时回收底部轴位预留（46 → 12）', () => {
    const p = getPadding({ ...LINE, xAxis: { show: false } }, 800)
    expect(p.bottom).toBe(12)
    expect(p.top).toBe(18)
  })

  it('padding 数字覆写四边', () => {
    expect(getPadding({ ...LINE, padding: 10 }, 800)).toEqual({ top: 10, right: 10, bottom: 10, left: 10 })
  })

  it('padding 对象覆写部分字段，未提供边回落默认', () => {
    const p = getPadding({ ...LINE, padding: { top: 8, left: 40 } }, 800)
    expect(p.top).toBe(8)
    expect(p.left).toBe(40)
    expect(p.right).toBe(24)
    expect(p.bottom).toBe(46)
  })

  it('padding 与顶部图例带叠加（图例空间不被挤掉）', () => {
    const p = getPadding({ ...LINE, padding: { top: 8 }, legend: { show: true, position: 'top' } }, 800)
    expect(p.top).toBe(8 + 26)
  })

  it('sparkline padding 覆写', () => {
    const p = getPadding({ type: 'sparkline', labels: ['一'], series: [{ name: 'x', data: [1] }], padding: 4 }, 800)
    expect(p).toEqual({ top: 4, right: 4, bottom: 4, left: 4 })
  })
})

describe('y 轴刻度密度自适应与硬上限', () => {
  beforeEach(() => {
    // 与冒烟组同一套 jsdom 垫片：rAF 一帧到终点 + 容器尺寸 + ctx 探针
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(() => cb(performance.now() + 1e9), 0)
      return 1
    })
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return { left: 0, top: 0, right: 800, bottom: 400, width: 800, height: 400, x: 0, y: 0, toJSON: () => {} }
    })
    ctx = mockCanvas()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  const THEME = { gridColor: '#eee', textColorSecondary: '#666', borderColor: '#ddd', textColor: '#333' }
  // 纯 ctx 存根（不经 prototype spy，直接注入 renderYAxis）
  const stubCtx = () =>
    new Proxy({ measureText: () => ({ width: 10 }) }, { get(obj, prop) { return prop in obj ? obj[prop] : () => {} } })
  const AXIS = (ticks) => ({ type: 'line', yAxis: { min: 0, max: 82, ...(ticks !== undefined ? { ticks } : {}) } })
  // 0..82 的 nice 刻度（按 20 步进）为 5 档：0/20/40/60/80
  const renderAxis = (height, ticks) =>
    renderYAxis(
      {
        ctx: stubCtx(),
        theme: THEME,
        plotArea: { x: 40, y: 6, width: 400, height },
        options: AXIS(ticks),
        width: 480,
      },
      'left'
    )

  it('thinTickValues：保首末、整数倍步长抽稀到上限', () => {
    expect(thinTickValues([0, 20, 40, 60, 80], 3)).toEqual([0, 40, 80])
    expect(thinTickValues([0, 0.2, 0.4, 0.6], 3)).toEqual([0, 0.6])
    expect(thinTickValues([0, 1, 2, 3, 4, 5], 3)).toEqual([0, 5])
    expect(thinTickValues([0, 1, 2], 5)).toEqual([0, 1, 2])
  })

  it('显式 ticks 为硬上限：ticks:3 不再溢出成 5 档', () => {
    expect(renderAxis(300, 3).tickValues).toEqual([0, 40, 80])
  })

  it('矮绘图区自动降密：52px 高只保留 3 档', () => {
    expect(renderAxis(52).tickValues).toEqual([0, 40, 80])
  })

  it('常规高度且未显式传 ticks：保持原 nice 结果不抽稀', () => {
    // yAxis max 改 100：5 档请求产生 0..100 步 20 共 6 档（历史上允许的轻微溢出）
    const options = { type: 'line', yAxis: { min: 0, max: 100 } }
    const result = renderYAxis(
      { ctx: mockCanvas(), theme: THEME, plotArea: { x: 40, y: 6, width: 400, height: 400 }, options, width: 480 },
      'left'
    )
    expect(result.tickValues).toEqual([0, 20, 40, 60, 80, 100])
  })

  it('零基线轴余量取幅值 5% 下限：平直数据不顶满绘图区上缘', () => {
    // 旧逻辑余量 = 极差 10% = 0.8，588 的数据在 0..588.8 轴上贴顶
    const options = { type: 'line', series: [{ name: '内存', data: [580, 588] }], yAxis: { ticks: 3 } }
    const result = renderYAxis(
      {
        ctx: stubCtx(),
        theme: THEME,
        plotArea: { x: 40, y: 6, width: 400, height: 300 },
        options,
        width: 480,
        hiddenSeries: new Set(),
      },
      'left'
    )
    expect(result.max).toBeGreaterThan(588 * 1.04)
  })

  it('显式 min/max 完全尊重，不追加余量', () => {
    const options = { type: 'line', series: [{ name: 'x', data: [95, 98] }], yAxis: { min: 0, max: 100, ticks: 3 } }
    const result = renderYAxis(
      {
        ctx: stubCtx(),
        theme: THEME,
        plotArea: { x: 40, y: 6, width: 400, height: 300 },
        options,
        width: 480,
        hiddenSeries: new Set(),
      },
      'left'
    )
    expect(result.max).toBe(100)
  })

  it('端到端：64px 监控条只画 ≤3 档刻度标签', async () => {
    const wrapper = mount(EvChart, {
      props: {
        options: {
          type: 'line',
          labels: ['a', 'b', 'c'],
          series: [{ name: 'CPU', data: [10, 60, 30] }],
          yAxis: { min: 0, max: 82, ticks: 3, grid: { show: false } },
          xAxis: { show: false },
          legend: { show: false },
          padding: { top: 6, right: 8, bottom: 6 },
          animation: { enabled: false },
        },
        height: 64,
      },
      attachTo: document.body,
    })
    // 渲染经 16ms 防抖（与上方用例同一节奏）
    await new Promise((r) => setTimeout(r, 40))
    const labels = (ctx.__calls.get('fillText')?.mock.calls ?? []).map((c) => String(c[0]))
    const tickLabels = labels.filter((l) => /^\d+(\.\d+)?$/.test(l))
    expect(tickLabels.length).toBeGreaterThan(0)
    expect(tickLabels.length).toBeLessThanOrEqual(3)
    for (const l of tickLabels) expect(['0', '40', '80']).toContain(l)
    wrapper.unmount()
  })
})

describe('applySeriesPalette 配色方案工具', () => {
  afterEach(() => {
    clearSeriesPalette()
  })

  it('数组形态：写入内联槽位并派发 ev-theme-change', () => {
    const spy = vi.fn()
    document.addEventListener('ev-theme-change', spy)
    expect(applySeriesPalette(['#175DFF', '#5AD8A6'])).toBe(true)
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-1')).toBe('#175DFF')
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-2')).toBe('#5AD8A6')
    expect(spy).toHaveBeenCalled()
    document.removeEventListener('ev-theme-change', spy)
  })

  it('对象形态：注入样式表随暗色换挡，清除后一并移除', () => {
    applySeriesPalette({ light: ['#111111'], dark: ['#222222'] })
    const el = document.querySelector('style[data-ev-series-palette]')
    expect(el).toBeTruthy()
    expect(el.textContent).toContain(':root')
    expect(el.textContent).toContain('html.dark')
    expect(el.textContent).toContain('#111111')
    expect(el.textContent).toContain('#222222')
    expect(clearSeriesPalette()).toBe(true)
    expect(document.querySelector('style[data-ev-series-palette]')).toBe(null)
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-1')).toBe('')
  })

  it('非法输入返回 false 且不触碰 DOM', () => {
    const before = document.documentElement.getAttribute('style') ?? ''
    expect(applySeriesPalette(null)).toBe(false)
    expect(applySeriesPalette({})).toBe(false)
    expect(document.documentElement.getAttribute('style') ?? '').toBe(before)
  })
})
