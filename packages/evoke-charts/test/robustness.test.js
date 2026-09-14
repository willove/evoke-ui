import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvChart from '../src/chart.vue'
import { minOf, maxOf } from '../src/extent.js'
import { createAnimation, updateAnimation } from '../src/renderer/index.js'
import { computeSankeyLayout } from '../src/renderer/charts-relation.js'
import { waterfallSteps, minMaxDecimatePoints } from '../src/renderer/core.js'

// 本文件是健壮性回访回归：tooltip 转义、缺 data 系列、大数组极值、
// destroy 清理、gauge 边界、easing 回落、sankey nodeAlign。

let ctx

function mockCanvas() {
  const calls = new Map()
  const target = {
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  }
  const ctxProxy = new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop]
      if (!calls.has(prop)) calls.set(prop, vi.fn())
      return calls.get(prop)
    },
  })
  ctxProxy.__calls = calls
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctxProxy)
  return ctxProxy
}

const drawCount = () =>
  (ctx.__calls.get('clearRect')?.mock.calls.length ?? 0)
  + (ctx.__calls.get('fillRect')?.mock.calls.length ?? 0)
  + (ctx.__calls.get('fill')?.mock.calls.length ?? 0)
  + (ctx.__calls.get('stroke')?.mock.calls.length ?? 0)
  + (ctx.__calls.get('beginPath')?.mock.calls.length ?? 0)

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
    return { left: 0, top: 0, right: 800, bottom: 400, width: 800, height: 400, x: 0, y: 0, toJSON: () => {} }
  })
  ctx = mockCanvas()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const flushRender = () => new Promise((r) => setTimeout(r, 40))

describe('minOf / maxOf 循环归约', () => {
  it('大数据量不触发 RangeError（此前 Math.min(...arr) 约 10 万点即栈溢出）', () => {
    const big = Array.from({ length: 200001 }, (_, i) => i % 977)
    expect(minOf(big)).toBe(0)
    expect(maxOf(big)).toBe(976)
  })

  it('NaN 传播、空数组与额外常量语义与 Math.min/max 一致', () => {
    expect(minOf([3, NaN, 1])).toBeNaN()
    expect(maxOf([3, NaN, 1])).toBeNaN()
    expect(minOf([3, 1, 2])).toBe(1)
    expect(maxOf([3, 1, 2])).toBe(3)
    expect(minOf([], 5)).toBe(5)
    expect(maxOf([], -2)).toBe(-2)
    expect(minOf([])).toBe(Infinity)
    expect(maxOf([])).toBe(-Infinity)
    expect(minOf([4, 2], 0, 1)).toBe(0)
    expect(maxOf([1, 2], 9, 3)).toBe(9)
  })
})

describe('tooltip 默认模板转义', () => {
  it('类目名含 HTML 时进 tooltip 被转义，不产生真实节点', async () => {
    const wrapper = mount(EvChart, {
      props: {
        options: {
          type: 'pie',
          animation: { enabled: false },
          pieData: [
            { name: '<img src=x onerror="alert(1)">', value: 60 },
            { name: '正常项', value: 40 },
          ],
        },
      },
      attachTo: document.body,
    })
    await nextTick()
    await flushRender()
    // jsdom 的 MouseEvent clientX 只读，VTU trigger 赋值会抛错：手动构造事件
    const fireMove = (x, y) => {
      wrapper.find('canvas').element.dispatchEvent(
        new MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true })
      )
    }
    // 饼图圆心必命中扇区，触发悬浮 tooltip
    fireMove(400, 200)
    await flushRender()
    const tip = wrapper.find('.ev-chart__tooltip')
    expect(tip.exists()).toBe(true)
    const html = tip.html()
    // 命中的正是恶意名扇区：原始 <img> 标签必须以文本形态出现（&lt;img），而非真实元素
    expect(html).toContain('&lt;img src=x')
    expect(html).not.toContain('<img src=x')
    wrapper.unmount()
  })
})

describe('series 缺 data 不再卡死更新链路', () => {
  it('缺 data 的系列持续存在时，其余数据更新仍能触发重绘', async () => {
    const broken = () => ({
      type: 'line',
      animation: { enabled: false },
      labels: ['一', '二'],
      series: [{ name: '缺数据' }, { name: '正常', data: [1, 2] }],
    })
    const wrapper = mount(EvChart, { props: { options: broken() }, attachTo: document.body })
    await nextTick()
    await flushRender()
    await wrapper.setProps({ options: { ...broken() } })
    await flushRender()
    const before = drawCount()
    await wrapper.setProps({ options: { ...broken(), series: [{ name: '缺数据' }, { name: '正常', data: [3, 4] }] } })
    await flushRender()
    // 修复前：deep watch 回调在快照克隆处抛错，debouncedRender 永不再执行
    expect(drawCount()).toBeGreaterThan(before)
    wrapper.unmount()
  })
})

describe('实例 destroy() 清理面', () => {
  it('重复调用与销毁后交互均不抛错', async () => {
    const wrapper = mount(EvChart, {
      props: {
        options: {
          type: 'line',
          animation: { enabled: false },
          labels: ['一', '二'],
          series: [{ name: 'A', data: [1, 2] }],
          connectGroup: 'g1',
        },
      },
      attachTo: document.body,
    })
    await nextTick()
    await flushRender()
    expect(() => wrapper.vm.destroy()).not.toThrow()
    expect(() => wrapper.vm.destroy()).not.toThrow()
    expect(() => wrapper.find('canvas').element.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 10, clientY: 10, bubbles: true })
    )).not.toThrow()
    window.dispatchEvent(new Event('pointerup'))
    wrapper.unmount()
  })
})

describe('gauge 边界', () => {
  it('number 简写与 max: 0 / 负区间均正常渲染', async () => {
    const cases = [
      { type: 'gauge', animation: { enabled: false }, gauge: 75 },
      { type: 'gauge', animation: { enabled: false }, gauge: { value: 0, max: 0 } },
      { type: 'gauge', animation: { enabled: false }, gauge: { min: -40, max: 0, value: -20 } },
    ]
    for (const options of cases) {
      const wrapper = mount(EvChart, { props: { options }, attachTo: document.body })
      await nextTick()
      await flushRender()
      expect(wrapper.find('.ev-chart__error').exists()).toBe(false)
      expect(wrapper.find('canvas.ev-chart__canvas').exists()).toBe(true)
      expect(drawCount()).toBeGreaterThan(0)
      wrapper.unmount()
      ctx.__calls.clear()
    }
  })
})

describe('未知 easing 名回落默认曲线', () => {
  it('拼写错误不再逐帧抛错', () => {
    const state = createAnimation({ enabled: true, duration: 300, easing: 'noSuchEasing' })
    state.startTime = Date.now() - 150
    expect(() => updateAnimation(state)).not.toThrow()
    expect(state.progress).toBeGreaterThan(0)
  })
})

describe('sankey nodeAlign（DESIGN §3.5）', () => {
  // A→B→C 与 A→D：C 深度 2、D 深度 1（汇点）
  const DATA = () => ({
    nodes: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
    links: [
      { source: 'A', target: 'B', value: 10 },
      { source: 'B', target: 'C', value: 10 },
      { source: 'A', target: 'D', value: 5 },
    ],
  })
  const THEME = {
    colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#E8684A'],
    backgroundColor: '#ffffff',
    textColor: '#111827',
    textColorSecondary: '#6b7280',
  }
  const PLOT = { x: 0, y: 0, width: 800, height: 400 }
  const colOf = (layout, name) => layout.nodes.find((n) => n.name === name).col

  it('默认 justify：末端汇点右移到末列贴右缘', () => {
    const layout = computeSankeyLayout(PLOT, { sankeyData: DATA() }, THEME, new Set())
    expect(colOf(layout, 'C')).toBe(2)
    expect(colOf(layout, 'D')).toBe(2)
    expect(colOf(layout, 'A')).toBe(0)
  })

  it('left：汇点保持原始拓扑深度', () => {
    const layout = computeSankeyLayout(PLOT, { sankeyData: DATA(), sankey: { nodeAlign: 'left' } }, THEME, new Set())
    expect(colOf(layout, 'C')).toBe(2)
    expect(colOf(layout, 'D')).toBe(1)
  })

  it('布局不回写用户传入的 nodes（value 缺省汇总进局部 Map）', () => {
    const data = DATA()
    computeSankeyLayout(PLOT, { sankeyData: data }, THEME, new Set())
    expect(data.nodes.every((n) => n.value === undefined)).toBe(true)
  })
})

describe('waterfallSteps 共享口径', () => {  it('增量累计、合计列重置、缺失值标记三处消费同一份', () => {
    const steps = waterfallSteps([10, -4, null, 20], [3])
    expect(steps[0]).toEqual({ value: 10, from: 0, to: 10, isTotal: false, missing: false })
    expect(steps[1]).toEqual({ value: -4, from: 10, to: 6, isTotal: false, missing: false })
    expect(steps[2].missing).toBe(true)
    expect(steps[2].from).toBe(6)
    expect(steps[2].to).toBe(6)
    expect(steps[3]).toEqual({ value: 20, from: 0, to: 20, isTotal: true, missing: false })
  })
})

describe('minMaxDecimatePoints（DESIGN §16）', () => {
  const px = (x, y) => [x, y]

  it('列内保首/末/最小/最大，输出 x 单调且索引映射保留', () => {
    // 一列内：首 5、谷 1、峰 9、末 3 —— 四个代表点都要在
    const points = [px(0, 5), px(1, 4), px(2, 1), px(3, 9), px(4, 3)]
    const out = minMaxDecimatePoints(points, 1)
    expect(out.map((e) => e.i)).toEqual([0, 2, 3, 4])
    expect(out.map((e) => e.p[1])).toEqual([5, 1, 9, 3])
  })

  it('整列缺失保留段断标记，不跨缺口连线', () => {
    const points = [px(0, 1), px(1, 2), null, null, px(4, 5), px(5, 1)]
    const out = minMaxDecimatePoints(points, 3)
    // 中列全缺：第一段与第二段之间必须有 null 断段标记
    const gapIdx = out.findIndex((e) => e.p === null)
    expect(gapIdx).toBeGreaterThan(-1)
    expect(out[0].i).toBe(0)
    expect(out[out.length - 1].i).toBe(5)
    // 除断段标记外 x 单调递增
    const coords = out.filter((e) => e.p).map((e) => e.p[0])
    expect(coords).toEqual([...coords].sort((a, b) => a - b))
  })

  it('峰谷保留：正弦数据抽稀后极值仍在输出中', () => {
    const n = 6000
    const points = Array.from({ length: n }, (_, i) => px(i, 100 + 80 * Math.sin(i / 25)))
    const out = minMaxDecimatePoints(points, 700)
    expect(out.length).toBeLessThan(700 * 4 + 10)
    const ys = out.map((e) => e.p[1])
    expect(Math.min(...ys)).toBeLessThanOrEqual(100 + 80 * Math.sin(25 * Math.PI * 0) + 1)
    // 全局最小值点必须保留
    let minI = 0
    for (let i = 1; i < n; i++) if (points[i][1] < points[minI][1]) minI = i
    expect(out.some((e) => e.i === minI)).toBe(true)
    // 全局最大值点必须保留
    let maxI = 0
    for (let i = 1; i < n; i++) if (points[i][1] > points[maxI][1]) maxI = i
    expect(out.some((e) => e.i === maxI)).toBe(true)
  })
})

describe('大数据折线渲染（抽稀生效）', () => {
  it('6000 点折线绘制调用被压到像素列量级，且不进错误态', async () => {
    const points = Array.from({ length: 6000 }, (_, i) => 50 + 40 * Math.sin(i / 30))
    const wrapper = mount(EvChart, {
      props: {
        options: {
          type: 'line',
          animation: { enabled: false },
          labels: points.map((_, i) => String(i)),
          series: [{ name: '高频', data: points }],
        },
      },
      attachTo: document.body,
    })
    await nextTick()
    await flushRender()
    expect(wrapper.find('.ev-chart__error').exists()).toBe(false)
    expect(wrapper.find('canvas.ev-chart__canvas').exists()).toBe(true)
    const lineTo = ctx.__calls.get('lineTo')?.mock.calls.length ?? 0
    // 未抽稀时约 6000+ lineTo；抽稀后 ≤ 4×像素列（约 730 列）
    expect(lineTo).toBeGreaterThan(0)
    expect(lineTo).toBeLessThan(4000)
    wrapper.unmount()
  })
})

describe('静默边界改空态占位', () => {
  it('饼图全 0 不再留白画布，进空态', async () => {
    const wrapper = mount(EvChart, {
      props: { options: { type: 'pie', animation: { enabled: false }, pieData: [{ name: '甲', value: 0 }, { name: '乙', value: 0 }] } },
      attachTo: document.body,
    })
    await nextTick()
    await flushRender()
    expect(wrapper.find('.ev-chart__empty').exists()).toBe(true)
    expect(wrapper.find('canvas').exists()).toBe(false)
    wrapper.unmount()
  })

  it('韦恩超 3 集合（无闭合解）进空态', async () => {
    const wrapper = mount(EvChart, {
      props: {
        options: {
          type: 'venn',
          animation: { enabled: false },
          vennData: [
            { name: '甲', value: 10 }, { name: '乙', value: 10 },
            { name: '丙', value: 10 }, { name: '丁', value: 10 },
          ],
        },
      },
      attachTo: document.body,
    })
    await nextTick()
    await flushRender()
    expect(wrapper.find('.ev-chart__empty').exists()).toBe(true)
    wrapper.unmount()
  })

  it('散点含 NaN 值仍正常渲染（量程过滤非有限值）', async () => {
    const wrapper = mount(EvChart, {
      props: {
        options: {
          type: 'scatter',
          animation: { enabled: false },
          scatterData: [{ x: 1, y: NaN }, { x: 2, y: 5 }, { x: 3, y: 8 }],
        },
      },
      attachTo: document.body,
    })
    await nextTick()
    await flushRender()
    expect(wrapper.find('.ev-chart__error').exists()).toBe(false)
    expect(wrapper.find('canvas.ev-chart__canvas').exists()).toBe(true)
    expect(drawCount()).toBeGreaterThan(0)
    wrapper.unmount()
  })
})

describe('键盘巡历（DESIGN §13.7 期 1–2）', () => {
  const BAR_OPTIONS = () => ({
    type: 'bar',
    animation: { enabled: false },
    labels: ['一', '二', '三', '四'],
    series: [{ name: '销量', data: [10, 40, 25, 60] }],
  })
  const press = (wrapper, key) => {
    wrapper.find('.ev-chart').element.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    )
  }

  it('容器可聚焦（空态不可聚焦），方向键步进悬浮且 tooltip / 播报跟随', async () => {
    const wrapper = mount(EvChart, { props: { options: BAR_OPTIONS() }, attachTo: document.body })
    await nextTick()
    await flushRender()
    expect(wrapper.find('.ev-chart').attributes('tabindex')).toBe('0')
    press(wrapper, 'ArrowRight')
    await flushRender()
    const tip = wrapper.find('.ev-chart__tooltip')
    expect(tip.exists()).toBe(true)
    expect(tip.find('.ev-chart__tooltip-title').text()).toBe('一')
    expect(wrapper.find('.ev-chart__sr-only').text()).toContain('销量')
    press(wrapper, 'ArrowRight')
    await flushRender()
    expect(wrapper.find('.ev-chart__tooltip-title').text()).toBe('二')
    press(wrapper, 'End')
    await flushRender()
    expect(wrapper.find('.ev-chart__tooltip-title').text()).toBe('四')
    press(wrapper, 'Home')
    await flushRender()
    expect(wrapper.find('.ev-chart__tooltip-title').text()).toBe('一')
    wrapper.unmount()
  })

  it('横向条形图 ↑/↓ 步进', async () => {
    const wrapper = mount(EvChart, {
      props: {
        options: { ...BAR_OPTIONS(), type: 'horizontal-bar' },
      },
      attachTo: document.body,
    })
    await nextTick()
    await flushRender()
    press(wrapper, 'ArrowUp')
    await flushRender()
    expect(wrapper.find('.ev-chart__tooltip-title').text()).toBe('一')
    press(wrapper, 'ArrowUp')
    await flushRender()
    expect(wrapper.find('.ev-chart__tooltip-title').text()).toBe('二')
    wrapper.unmount()
  })

  it('焦点离开清空悬浮态', async () => {
    const wrapper = mount(EvChart, { props: { options: BAR_OPTIONS() }, attachTo: document.body })
    await nextTick()
    await flushRender()
    press(wrapper, 'ArrowRight')
    await flushRender()
    expect(wrapper.find('.ev-chart__tooltip').exists()).toBe(true)
    wrapper.find('.ev-chart').element.dispatchEvent(new Event('focusout', { bubbles: false }))
    await flushRender()
    expect(wrapper.find('.ev-chart__tooltip').exists()).toBe(false)
    wrapper.unmount()
  })
})
