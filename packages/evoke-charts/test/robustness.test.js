import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvChart from '../src/chart.vue'
import { minOf, maxOf } from '../src/extent.js'
import { createAnimation, updateAnimation } from '../src/renderer/index.js'
import { computeSankeyLayout } from '../src/renderer/charts-relation.js'

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
