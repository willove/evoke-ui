import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvChart from '../src/chart.vue'

// 图型覆盖回访：此前 radar / heatmap / bin / bullet / waterfall / mixed /
// stacked-bar / area / doughnut / rose / horizontal-bar / sparkline（以及
// arc 的 arcCircular 分发路径）没有任何直接渲染测试。本文件逐型挂载冒烟：
// 不进空态、不进错误态、画布有落笔。

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

const CASES = {
  area: {
    type: 'area',
    labels: ['一', '二', '三'],
    series: [{ name: 'A', data: [1, 3, 2] }, { name: 'B', data: [2, 1, 3] }],
    stackAreas: true,
  },
  'stacked-bar': {
    type: 'stacked-bar',
    labels: ['一', '二', '三'],
    series: [{ name: 'A', data: [1, 3, 2] }, { name: 'B', data: [2, 1, 3] }],
  },
  'horizontal-bar': {
    type: 'horizontal-bar',
    labels: ['甲', '乙', '丙'],
    series: [{ name: 'A', data: [4, 2, 6] }],
  },
  doughnut: {
    type: 'doughnut',
    pieData: [{ name: '甲', value: 50 }, { name: '乙', value: 30 }, { name: '丙', value: 20 }],
    innerRadius: 0.6,
  },
  rose: {
    type: 'rose',
    pieData: [{ name: '甲', value: 50 }, { name: '乙', value: 30 }, { name: '丙', value: 20 }],
  },
  radar: {
    type: 'radar',
    radarIndicators: [{ name: '速度', max: 100 }, { name: '力量', max: 100 }, { name: '耐力', max: 100 }],
    radarSeries: [{ name: '选手A', data: [80, 60, 70] }],
    radarRingFill: true,
  },
  heatmap: {
    type: 'heatmap',
    heatmapData: [
      { x: '周一', y: '上午', value: 5 },
      { x: '周二', y: '下午', value: 8 },
    ],
    heatmapColorBar: true,
  },
  bin: {
    type: 'bin',
    series: [{ name: '样本', data: [3, 8, 12, 5, 9, 14, 7, 2, 11, 6] }],
    binConfig: { binCount: 4 },
  },
  bullet: {
    type: 'bullet',
    bulletData: [
      { name: '营收', value: 270, target: 300, ranges: [{ from: 0, to: 200 }, { from: 200, to: 350 }] },
    ],
  },
  waterfall: {
    type: 'waterfall',
    labels: ['一月', '二月', '三月', '累计'],
    series: [{ name: '损益', data: [100, -30, 50, 120] }],
    waterfall: { totalIndices: [3] },
  },
  mixed: {
    type: 'mixed',
    labels: ['一月', '二月', '三月'],
    series: [
      { name: '营收', data: [120, 150, 130], chartType: 'bar' },
      { name: '增长率', data: [12, 25, -8], chartType: 'line' },
    ],
    yAxisRight: { show: true },
  },
  sparkline: {
    type: 'sparkline',
    labels: ['一', '二', '三', '四'],
    series: [{ name: 'A', data: [1, 4, 2, 5] }],
    sparklineSmooth: true,
  },
  'arc-circular': {
    type: 'arc',
    arcCircular: true,
    arcData: {
      nodes: [{ name: '网关' }, { name: '订单' }, { name: '支付' }],
      links: [
        { source: '网关', target: '订单', value: 40 },
        { source: '订单', target: '支付', value: 25 },
      ],
    },
  },
}

describe('图型覆盖冒烟', () => {
  for (const [name, extra] of Object.entries(CASES)) {
    it(`${name} 渲染有落笔且不进错误态`, async () => {
      const options = { animation: { enabled: false }, legend: { show: false }, ...extra }
      const wrapper = mount(EvChart, { props: { options }, attachTo: document.body })
      await nextTick()
      await flushRender()
      expect(wrapper.find('.ev-chart__error').exists()).toBe(false)
      expect(wrapper.find('.ev-chart__empty').exists()).toBe(false)
      expect(wrapper.find('canvas.ev-chart__canvas').exists()).toBe(true)
      expect(drawCount()).toBeGreaterThan(0)
      wrapper.unmount()
      ctx.__calls.clear()
    })
  }
})
