import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvChart from '../src/chart.vue'

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

describe('EvChart（提取冒烟（ev 命名空间））', () => {
  let ctx
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
