import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvChart from '../src/chart.vue'
import { getPadding } from '../src/renderer/core.js'
import { renderYAxis, thinTickValues, renderAnnotations } from '../src/renderer/axes.js'
import { renderChart } from '../src/renderer/index.js'
import { renderScatterChart } from '../src/renderer/charts-basic.js'
import { computeLegendLayout } from '../src/renderer/legend.js'
import { applySeriesPalette, clearSeriesPalette } from '../src/palette.js'
import { chartOptionsSchema, validateOptions } from '../src/schema.js'

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

  it('横向条形图 left 按最宽分类名自适应，分类标签零截断', () => {
    const HB = {
      type: 'horizontal-bar',
      labels: ['线下门店', '社群裂变', '外部引流', '直接访问', '搜索引擎'],
      series: [{ name: '成交额', data: [320, 260, 200, 150, 90] }],
      legend: { show: false },
    }
    // 4 字分类名 ≈ 48px + 26 → 约 74，远大于数值刻度的 40 档
    const p = getPadding(HB, 800)
    expect(p.left).toBeGreaterThan(60)
    expect(p.left).toBeLessThanOrEqual(140)
    // 显式 padding.left 仍然优先
    expect(getPadding({ ...HB, padding: { left: 100 } }, 800).left).toBe(100)
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

  it('yAxis.width 显式定轴槽宽：列表场景统一绘图区起点', () => {
    expect(getPadding({ ...LINE, yAxis: { width: 80 } }, 800).left).toBe(80)
    // padding.left 优先级最高
    expect(getPadding({ ...LINE, yAxis: { width: 80 }, padding: { left: 56 } }, 800).left).toBe(56)
    // 非法值回落标签自适应
    expect(getPadding({ ...LINE, yAxis: { width: -1 } }, 800).left).toBeGreaterThanOrEqual(40)
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

describe('Spec 契约（getSpec / setSpec / validateOptions / exportSVG）', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(() => cb(performance.now() + 1e9), 0)
      return 1
    })
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

  const flushRender = () => new Promise((r) => setTimeout(r, 40))
  const drawCalls = () => (ctx.__calls.get('clearRect')?.mock.calls.length ?? 0)
    + (ctx.__calls.get('fillRect')?.mock.calls.length ?? 0)
    + (ctx.__calls.get('fill')?.mock.calls.length ?? 0)
    + (ctx.__calls.get('stroke')?.mock.calls.length ?? 0)

  it('getSpec 返回深拷贝：改副本不反噬图表 options', async () => {
    const options = { ...LINE_OPTIONS(), title: '基线图' }
    const wrapper = mount(EvChart, { props: { options }, attachTo: document.body })
    await nextTick()
    const spec = wrapper.vm.getSpec()
    expect(spec.title).toBe('基线图')
    spec.title = '副本改的'
    spec.series[0].data[0] = 999
    expect(options.title).toBe('基线图')
    expect(options.series[0].data[0]).toBe(10)
    wrapper.unmount()
  })

  it('setSpec 整体替换：旧键清除、新键生效并重绘', async () => {
    const wrapper = mount(EvChart, {
      props: { options: { ...LINE_OPTIONS(), title: '旧标题' } },
      attachTo: document.body,
    })
    await nextTick()
    await flushRender()
    const before = drawCalls()
    wrapper.vm.setSpec({ type: 'bar', labels: ['甲', '乙'], series: [{ name: '销量', data: [3, 7] }] })
    await flushRender()
    const spec = wrapper.vm.getSpec()
    expect(spec.title).toBeUndefined()
    expect(spec.type).toBe('bar')
    expect(spec.series[0].name).toBe('销量')
    expect(spec.legend).toBeUndefined()
    expect(drawCalls()).toBeGreaterThan(before)
    wrapper.unmount()
  })

  it('setSpec 重置交互状态：隐藏系列清空、缩放回到配置初值', async () => {
    const wrapper = mount(EvChart, {
      props: { options: { ...LINE_OPTIONS(), dataZoom: { enabled: true, start: 20, end: 80 } } },
      attachTo: document.body,
    })
    await nextTick()
    wrapper.vm.toggleSeries('营收')
    expect(wrapper.vm.getHiddenSeries()).toEqual(['营收'])
    wrapper.vm.setDataZoomRange(40, 60)
    expect(wrapper.vm.getDataZoomRange()).toEqual({ start: 40, end: 60 })
    wrapper.vm.setSpec({ type: 'line', labels: ['一', '二'], series: [{ name: '新系列', data: [1, 2] }] })
    expect(wrapper.vm.getHiddenSeries()).toEqual([])
    // 新 Spec 未启用 dataZoom：缩放随整体替换回到未启用
    expect(wrapper.vm.getDataZoomRange()).toBeNull()
    wrapper.unmount()
  })

  it('setSpec 对非响应式普通 options 同样生效（版本失效 + 显式重绘）', async () => {
    const plain = { type: 'line', labels: ['一', '二'], series: [{ name: 'a', data: [1, 2] }] }
    const wrapper = mount(EvChart, { props: { options: plain }, attachTo: document.body })
    await nextTick()
    await flushRender()
    const before = drawCalls()
    wrapper.vm.setSpec({ type: 'pie', pieData: [{ name: '甲', value: 3 }, { name: '乙', value: 5 }] })
    await flushRender()
    expect(drawCalls()).toBeGreaterThan(before)
    expect(plain.type).toBe('pie')
    // 关键断言：effectiveOptions 不得缓存旧 spec（渲染读的是它）
    expect(wrapper.vm.getEffectiveSpec().type).toBe('pie')
    wrapper.unmount()
  })

  it('validateOptions：合法 Spec 通过，非法给出定位 path', () => {
    expect(validateOptions(LINE_OPTIONS()).ok).toBe(true)
    const bad = validateOptions({ type: 'nope', series: [{ data: [1] }] })
    expect(bad.ok).toBe(false)
    expect(bad.warnings.some((w) => w.path === 'options.type')).toBe(true)
    expect(bad.warnings.some((w) => w.path === 'options.series[0].name')).toBe(true)
  })

  it('chartOptionsSchema 可导出（draft-07，type 必填）', () => {
    expect(chartOptionsSchema.$schema).toContain('draft-07')
    expect(chartOptionsSchema.required).toContain('type')
    expect(chartOptionsSchema.properties.type.enum).toContain('line')
  })

  it('exportSVG 导出真 SVG（指令重放含文字元素）', async () => {
    const wrapper = mount(EvChart, { props: { options: LINE_OPTIONS() }, attachTo: document.body })
    await nextTick()
    await flushRender()
    const svg = wrapper.vm.exportSVG()
    expect(svg).toContain('<svg')
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('<text')
    wrapper.unmount()
  })
})

describe('叙述注解 annotations[] 与 emphasis', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(() => cb(performance.now() + 1e9), 0)
      return 1
    })
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

  const flushRender = () => new Promise((r) => setTimeout(r, 40))
  const drawCalls = () => (ctx.__calls.get('clearRect')?.mock.calls.length ?? 0)
    + (ctx.__calls.get('fillRect')?.mock.calls.length ?? 0)
    + (ctx.__calls.get('fill')?.mock.calls.length ?? 0)
    + (ctx.__calls.get('stroke')?.mock.calls.length ?? 0)

  // 录制式 ctx：方法调用与样式赋值按序记账
  const recordingCtx = () => {
    const calls = []
    const styles = {}
    const target = { measureText: () => ({ width: 10 }) }
    const proxy = new Proxy(target, {
      get(obj, prop) {
        if (prop in obj) return obj[prop]
        if (prop in styles) return styles[prop]
        return (...args) => { calls.push([prop, args]) }
      },
      set(obj, prop, value) {
        styles[prop] = value
        calls.push([`set:${String(prop)}`, value])
        return true
      },
    })
    return { proxy, calls, styles }
  }
  const THEME = { textColor: '#111827', textColorSecondary: '#6b7280', colors: ['#175DFF', '#5AD8A6'] }
  const ANNOT_OPTIONS = () => ({
    type: 'line',
    labels: ['一', '二', '三', '四'],
    series: [
      { name: '营收', data: [10, 40, 25, 60] },
      { name: '成本', data: [5, 20, 15, 30] },
    ],
  })
  const renderAnns = (options, extra = {}) => {
    const rec = recordingCtx()
    renderAnnotations(
      {
        ctx: rec.proxy,
        theme: THEME,
        plotArea: { x: 40, y: 10, width: 400, height: 300 },
        options,
        width: 480,
        height: 320,
        ...extra,
      },
      { min: 0, max: 100 },
    )
    return rec
  }
  const byName = (calls, name) => calls.filter((c) => c[0] === name)

  it('text：次要色斜体、默认点上方 6px 居中', () => {
    const rec = renderAnns({ ...ANNOT_OPTIONS(), annotations: [{ type: 'text', x: '二', y: 40, text: '注意' }] })
    const texts = byName(rec.calls, 'fillText')
    expect(texts).toHaveLength(1)
    // y=40 → plotArea.y + h - 40/100*300 = 10+300-120 = 190；默认 offsetY -6
    // x=索引 1：直角系类目端到端均分 step = 400/3
    const [t, x, y] = texts[0][1]
    expect(t).toBe('注意')
    expect(x).toBeCloseTo(40 + 400 / 3)
    expect(y).toBe(184)
    expect(rec.styles.fillStyle).toBe('#6b7280')
    expect(rec.styles.font).toContain('italic')
  })

  it('callout：8 向锚点虚线引线 + r2 端点；textColor 承载旁注正文', () => {
    const rec = renderAnns({
      ...ANNOT_OPTIONS(),
      annotations: [{ type: 'callout', x: '三', y: 25, label: '回落', anchor: 'top-right' }],
    })
    const arcs = byName(rec.calls, 'arc')
    expect(arcs[0][1][2]).toBe(2) // 端点小圆点 r2
    // y=25 → 10+300-75 = 235；anchor top-right：线到 (px+16-2, py-16+2)，文字再外推 2px
    const lines = byName(rec.calls, 'lineTo')
    expect(lines[0][1][1]).toBe(221)
    expect(lines[0][1][0]).toBeCloseTo(40 + 2 * (400 / 3) + 14)
    const texts = byName(rec.calls, 'fillText')
    expect(texts[0][1][0]).toBe('回落')
    expect(texts[0][1][1]).toBeCloseTo(40 + 2 * (400 / 3) + 18)
    expect(texts[0][1][2]).toBe(217)
    expect(rec.styles.fillStyle).toBe('#6b7280')
  })

  it('point：按系列名取色，r3 实心 + r6 外环', () => {
    const rec = renderAnns({
      ...ANNOT_OPTIONS(),
      annotations: [{ type: 'point', x: '四', y: 60, series: '成本' }],
    })
    const arcs = byName(rec.calls, 'arc')
    expect(arcs.map((a) => a[1][2])).toEqual([3, 6])
    expect(rec.styles.fillStyle).toBe('#5AD8A6')
  })

  it('delta：三角路径 + 涨跌色跟随 K 线约定', () => {
    const rec = renderAnns({
      ...ANNOT_OPTIONS(),
      annotations: [{ type: 'delta', x: '四', y: 60, direction: 'up', text: '同比 +23%' }],
    })
    expect(rec.styles.fillStyle).toBe('#dc2626')
    const texts = byName(rec.calls, 'fillText')
    expect(texts[0][1][0]).toBe('同比 +23%')
    expect(rec.styles.font).toContain('600')
    const rec2 = renderAnns({
      ...ANNOT_OPTIONS(),
      annotations: [{ type: 'delta', x: '三', y: 25, direction: 'down', text: '-12%' }],
    })
    expect(rec2.styles.fillStyle).toBe('#16a34a')
  })

  it('region：类目区间带半档扩展填充 + 左上斜体标签', () => {
    const rec = renderAnns({
      ...ANNOT_OPTIONS(),
      annotations: [{ type: 'region', from: '一', to: '三', label: '观察期' }],
    })
    const rects = byName(rec.calls, 'fillRect')
    expect(rects).toHaveLength(1)
    const [, , w, h] = rects[0][1]
    expect(h).toBe(300)
    expect(w).toBeGreaterThan(0)
    expect(rec.styles.globalAlpha).toBe(0.06)
    expect(byName(rec.calls, 'fillText')[0][1][0]).toBe('观察期')
  })

  it('xPx/yPx 像素定位优先于 data 定位', () => {
    const rec = renderAnns({
      ...ANNOT_OPTIONS(),
      annotations: [{ type: 'text', x: '二', y: 40, xPx: 123, yPx: 77, text: '像素' }],
    })
    expect(byName(rec.calls, 'fillText')[0][1].slice(1)).toEqual([123, 71])
  })

  it('未知类目与非法类型安全跳过；旧 annotation 字段仍工作', () => {
    const rec = renderAnns({
      ...ANNOT_OPTIONS(),
      annotations: [{ type: 'text', x: '不存在', y: 40, text: 'ghost' }],
      annotation: { texts: [{ x: '二', y: 40, content: '旧注' }] },
    })
    expect(byName(rec.calls, 'fillText').map((t) => t[1][0])).toEqual(['旧注'])
  })

  it('挂载冒烟：annotations + emphasis 渲染不崩且生效重绘', async () => {
    const wrapper = mount(EvChart, {
      props: {
        options: {
          ...ANNOT_OPTIONS(),
          annotations: [{ type: 'callout', x: '四', y: 60, label: '峰值', anchor: 'top-right' }],
          emphasis: { series: '营收', dimOthers: true },
        },
      },
      attachTo: document.body,
    })
    await nextTick()
    await flushRender()
    expect(drawCalls()).toBeGreaterThan(0)
    await wrapper.setProps({ options: { ...ANNOT_OPTIONS() } })
    await flushRender()
    expect(drawCalls()).toBeGreaterThan(0)
    wrapper.unmount()
  })
})

describe('scenes 编排时间轴', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(() => cb(performance.now() + 1e9), 0)
      return 1
    })
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

  const flushRender = () => new Promise((r) => setTimeout(r, 40))
  const SCENES_OPTIONS = () => ({
    type: 'line',
    labels: ['一', '二', '三'],
    series: [
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [2, 3, 4] },
    ],
    scenes: {
      items: [
        { patch: { title: '第一幕' }, duration: 500 },
        { patch: { title: '第二幕', emphasis: { series: 'A', dimOthers: true } }, duration: 500 },
      ],
    },
  })

  it('初始停在第一幕：getEffectiveSpec 含 patch，getSpec 保持基底', async () => {
    const wrapper = mount(EvChart, { props: { options: SCENES_OPTIONS() }, attachTo: document.body })
    await nextTick()
    expect(wrapper.vm.getSceneIndex()).toBe(0)
    expect(wrapper.vm.getEffectiveSpec().title).toBe('第一幕')
    expect(wrapper.vm.getSpec().title).toBeUndefined()
    wrapper.unmount()
  })

  it('nextScene / gotoScene 推进与夹界，scene-change 载荷正确', async () => {
    const wrapper = mount(EvChart, { props: { options: SCENES_OPTIONS() }, attachTo: document.body })
    await nextTick()
    wrapper.vm.nextScene()
    expect(wrapper.vm.getSceneIndex()).toBe(1)
    expect(wrapper.vm.getEffectiveSpec().emphasis).toEqual({ series: 'A', dimOthers: true })
    wrapper.vm.nextScene() // 已在末幕：夹界不动
    expect(wrapper.vm.getSceneIndex()).toBe(1)
    wrapper.vm.gotoScene(0)
    expect(wrapper.vm.getSceneIndex()).toBe(0)
    expect(wrapper.vm.getEffectiveSpec().emphasis).toBeUndefined()
    expect(wrapper.vm.getEffectiveSpec().title).toBe('第一幕')
    await flushRender()
    const evt = wrapper.emitted('scene-change')
    expect(evt).toHaveLength(2)
    expect(evt[0][0]).toEqual({ index: 1, total: 2 })
    expect(evt[1][0]).toEqual({ index: 0, total: 2 })
    wrapper.unmount()
  })

  it('prevScene 在第一幕夹界；setSpec 重置回第一幕', async () => {
    const wrapper = mount(EvChart, { props: { options: SCENES_OPTIONS() }, attachTo: document.body })
    await nextTick()
    wrapper.vm.prevScene()
    expect(wrapper.vm.getSceneIndex()).toBe(0)
    wrapper.vm.nextScene()
    expect(wrapper.vm.getSceneIndex()).toBe(1)
    wrapper.vm.setSpec(SCENES_OPTIONS())
    expect(wrapper.vm.getSceneIndex()).toBe(0)
    expect(wrapper.vm.getEffectiveSpec().title).toBe('第一幕')
    wrapper.unmount()
  })

  it('无 scenes：getEffectiveSpec 等同基底且剔除 __ 内部键', async () => {
    const wrapper = mount(EvChart, { props: { options: LINE_OPTIONS() }, attachTo: document.body })
    await nextTick()
    const spec = wrapper.vm.getEffectiveSpec()
    expect(spec.title).toBeUndefined()
    expect(Object.keys(spec).some((k) => k.startsWith('__'))).toBe(false)
    expect(spec.series).toHaveLength(2)
    wrapper.unmount()
  })
})

describe('图层钩子 layers 与 overlay 插槽', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(() => cb(performance.now() + 1e9), 0)
      return 1
    })
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

  const recordingCtx = () => {
    const calls = []
    const styles = {}
    const target = { measureText: () => ({ width: 10 }) }
    const proxy = new Proxy(target, {
      get(obj, prop) {
        if (prop in obj) return obj[prop]
        if (prop in styles) return styles[prop]
        return (...args) => { calls.push([prop, args]) }
      },
      set(obj, prop, value) {
        styles[prop] = value
        calls.push([`set:${String(prop)}`, value])
        return true
      },
    })
    return { proxy, calls }
  }
  // 图层绘制标记：唯一参数组合，便于在调用序列中定位
  const markerLayer = (at) => ({
    at,
    draw: (c) => {
      c.fillStyle = '#123456'
      c.fillRect(7, 7, 7, 7)
    },
  })
  const markerIndex = (calls) => calls.findIndex((c) => c[0] === 'fillRect' && c[1][0] === 7 && c[1][1] === 7)
  const LINE_SPEC = () => ({
    type: 'line',
    labels: ['一', '二', '三'],
    series: [{ name: 'A', data: [1, 5, 3] }],
  })
  const renderWith = (layers) => {
    const rec = recordingCtx()
    renderChart(
      { width: 800, height: 400 },
      { options: { ...LINE_SPEC(), layers }, ctx: rec.proxy, dpr: 1, progress: 1, hoverIndex: -1, mouseX: -1, mouseY: -1 },
    )
    return rec
  }

  it('back 层先于一切路径绘制（含坐标轴与系列）', () => {
    const rec = renderWith([markerLayer('back')])
    const layerIdx = markerIndex(rec.calls)
    const firstMoveTo = rec.calls.findIndex((c) => c[0] === 'moveTo')
    expect(layerIdx).toBeGreaterThan(-1)
    expect(firstMoveTo).toBeGreaterThan(-1)
    expect(layerIdx).toBeLessThan(firstMoveTo)
  })

  it('front 层晚于系列与注解；省略 at 默认 front', () => {
    // 注解文字是 front 锚点之后才可能出现的内容分界：after-series 在注解前，front 在注解后
    const spec = {
      ...LINE_SPEC(),
      annotations: [{ type: 'text', x: '二', y: 4, text: '注解标记' }],
    }
    const rec = recordingCtx()
    renderChart(
      { width: 800, height: 400 },
      { options: { ...spec, layers: [markerLayer(undefined)] }, ctx: rec.proxy, dpr: 1, progress: 1, hoverIndex: -1, mouseX: -1, mouseY: -1 },
    )
    const layerIdx = markerIndex(rec.calls)
    const firstMoveTo = rec.calls.findIndex((c) => c[0] === 'moveTo')
    const annText = rec.calls.findIndex((c) => c[0] === 'fillText' && c[1][0] === '注解标记')
    expect(layerIdx).toBeGreaterThan(-1)
    expect(firstMoveTo).toBeGreaterThan(-1)
    expect(annText).toBeGreaterThan(-1)
    expect(layerIdx).toBeGreaterThan(annText)
    expect(layerIdx).toBeGreaterThan(firstMoveTo)
  })

  it('after-series 层在系列之后、图例之前', () => {
    // 图例绘制含 fillText（系列名 A）；after-series 标记应早于图例文字
    const rec = renderWith([markerLayer('after-series')])
    const layerIdx = markerIndex(rec.calls)
    const firstMoveTo = rec.calls.findIndex((c) => c[0] === 'moveTo')
    const legendText = rec.calls.findIndex((c) => c[0] === 'fillText' && c[1][0] === 'A')
    expect(layerIdx).toBeGreaterThan(firstMoveTo)
    expect(legendText).toBeGreaterThan(-1)
    expect(layerIdx).toBeLessThan(legendText)
  })

  it('draw 收到 renderCtx（plotArea / theme / options）', () => {
    let received = null
    renderChart(
      { width: 800, height: 400 },
      {
        options: {
          ...LINE_SPEC(),
          layers: [{ at: 'front', draw: (c, rc) => { received = rc } }],
        },
        ctx: recordingCtx().proxy,
        dpr: 1,
        progress: 1,
        hoverIndex: -1,
        mouseX: -1,
        mouseY: -1,
      },
    )
    expect(received).not.toBeNull()
    expect(received.plotArea.width).toBeGreaterThan(0)
    expect(Array.isArray(received.theme.colors)).toBe(true)
    expect(received.options.type).toBe('line')
  })

  it('overlay 插槽渲染进覆盖层', async () => {
    const wrapper = mount(EvChart, {
      props: { options: LINE_OPTIONS() },
      slots: { overlay: '<div class="ov-mark">旁白</div>' },
      attachTo: document.body,
    })
    await nextTick()
    expect(wrapper.find('.ev-chart__overlay').exists()).toBe(true)
    expect(wrapper.find('.ov-mark').exists()).toBe(true)
    // pointer-events:none 由 .ev-chart__overlay 样式保证；jsdom 不应用 SFC 样式表，浏览器验收覆盖
    wrapper.unmount()
  })
})

describe('散点图点图例（scatterData label 识别）', () => {
  const SCATTER = () => ({
    type: 'scatter',
    legend: { show: true },
    scatterData: [
      { x: 1, y: 1, label: '甲' },
      { x: 2, y: 2, label: '乙' },
      { x: 3, y: 3, label: '丙' },
    ],
  })
  const THEME = {
    colors: ['#175DFF', '#5AD8A6', '#f5a623'],
    textColorSecondary: '#6b7280',
    backgroundColor: '#ffffff',
    gridColor: '#e5e7eb',
  }

  it('图例条目来自 scatterData 的 label，hidden 跟随 hiddenSeries', () => {
    const ctx2d = new Proxy(
      { measureText: () => ({ width: 10 }) },
      { get(obj, prop) { return prop in obj ? obj[prop] : () => {} } },
    )
    const layout = computeLegendLayout(
      ctx2d,
      SCATTER(),
      { x: 40, y: 10, width: 400, height: 300 },
      480,
      320,
      THEME,
      new Set(['乙']),
    )
    expect(layout.items.map((i) => i.name)).toEqual(['甲', '乙', '丙'])
    expect(layout.items.map((i) => i.hidden)).toEqual([false, true, false])
    expect(layout.items[1].color).toBe('#5AD8A6')
  })

  it('renderScatterChart：隐藏点跳过绘制，其余正常出 arc', () => {
    const arcs = []
    const proxy = new Proxy(
      { measureText: () => ({ width: 10 }) },
      { get(obj, prop) { return prop in obj ? obj[prop] : () => { arcs.push(prop) } } },
    )
    renderScatterChart(
      {
        ctx: proxy,
        theme: THEME,
        plotArea: { x: 40, y: 10, width: 400, height: 300 },
        options: SCATTER(),
        progress: 1,
        hoverIndex: -1,
        hiddenSeries: new Set(['乙']),
      },
      { min: 0, max: 3 },
    )
    expect(arcs.filter((a) => a === 'arc')).toHaveLength(2)
  })
})
