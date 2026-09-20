import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvChart from '../src/chart.vue'
import { prefersReducedMotion, staggerProgress } from '../src/motion.js'
import { captureChart3dData, sameChart3dShape, interpolateChart3dOptions } from '../src/3d/core/tween.js'

// 2D 图表走 canvas 2d + rAF：jsdom 无 2d context，用 Proxy 兜底任意 ctx 方法
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
      if (!calls.has(prop)) calls.set(prop, vi.fn())
      return calls.get(prop)
    },
  })
  ctx.__calls = calls
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  return ctx
}

const flush = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms))

const BAR_OPTIONS = () => ({
  type: 'bar',
  labels: ['一', '二', '三', '四'],
  series: [
    { name: '营收', data: [10, 40, 25, 60] },
    { name: '成本', data: [5, 20, 15, 30] },
  ],
})

async function mountChart(options) {
  const wrapper = mount(EvChart, { props: { options }, attachTo: document.body })
  await nextTick()
  return wrapper
}

beforeEach(() => {
  mockCanvas()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 600,
    height: 400,
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 600,
    bottom: 400,
    toJSON: () => ({}),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('motion 基础件', () => {
  it('staggerProgress：stagger = 0 或单条目时原样返回', () => {
    expect(staggerProgress(0.42, 3, 8, 0)).toBe(0.42)
    expect(staggerProgress(0.42, 0, 1, 0.5)).toBe(0.42)
    expect(staggerProgress(1, 0, 5, 0.5)).toBe(1)
  })

  it('staggerProgress：首条领先、末条在 progress = 1 收齐、全程单调不减', () => {
    const at = (i, p) => staggerProgress(p, i, 5, 0.6)
    expect(at(0, 0.5)).toBe(1) // 首条已走完
    expect(at(4, 0.5)).toBeLessThan(1)
    expect(at(4, 1)).toBe(1) // 末条在终点收齐
    for (let i = 0; i < 5; i++) {
      expect(at(i, 0.2)).toBeLessThanOrEqual(at(i, 0.6))
      if (i > 0) expect(at(i, 0.6)).toBeLessThanOrEqual(at(i - 1, 0.6))
    }
  })

  it('prefersReducedMotion：matchMedia 命中为 true，无 matchMedia 回落 false', () => {
    vi.stubGlobal('matchMedia', (q) => ({ matches: q.includes('reduce') }))
    expect(prefersReducedMotion()).toBe(true)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(prefersReducedMotion()).toBe(false)
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('三维数据补间（快照与插值）', () => {
  const bar = (data) => ({ type: 'bar3d', labels: ['a', 'b'], series: [{ name: 's', data }] })

  it('结构一致才可补间：类目 / 系列名 / 形状变化即拒绝', () => {
    const a = captureChart3dData(bar([1, 2]))
    expect(sameChart3dShape(a, captureChart3dData(bar([3, 4])))).toBe(true)
    expect(sameChart3dShape(a, captureChart3dData({ ...bar([1, 2]), labels: ['a', 'c'] }))).toBe(false)
    expect(sameChart3dShape(a, captureChart3dData(bar([1, 2, 3])))).toBe(false)
    expect(sameChart3dShape(a, captureChart3dData({ type: 'line3d', labels: ['a', 'b'], series: [{ name: 's', data: [1, 2] }] }))).toBe(false)
  })

  it('series：按进度插值，结构不符返回 null', () => {
    const from = captureChart3dData(bar([0, 100]))
    const mid = interpolateChart3dOptions(from, bar([100, 200]), 0.5)
    expect(mid.series[0].data).toEqual([50, 150])
    expect(interpolateChart3dOptions(from, bar([100, 200, 300]), 0.5)).toBeNull()
  })

  it('pieData / scatterData / surfaceData 三形态都能插值', () => {
    const pieFrom = captureChart3dData({ type: 'pie3d', pieData: [{ name: 'A', value: 0 }, { name: 'B', value: 0 }] })
    const pieMid = interpolateChart3dOptions(pieFrom, { type: 'pie3d', pieData: [{ name: 'A', value: 10 }, { name: 'B', value: 30 }] }, 0.25)
    expect(pieMid.pieData.map((d) => d.value)).toEqual([2.5, 7.5])

    const scFrom = captureChart3dData({ type: 'scatter3d', scatterData: [[0, 0, 0], [1, 1, 1]] })
    const scMid = interpolateChart3dOptions(scFrom, { type: 'scatter3d', scatterData: [[2, 4, 6], [3, 5, 7]] }, 0.5)
    expect(scMid.scatterData).toEqual([[1, 2, 3], [2, 3, 4]])

    const sfFrom = captureChart3dData({ type: 'surface3d', surfaceData: { z: [[0, 0], [0, 0]] } })
    const sfMid = interpolateChart3dOptions(sfFrom, { type: 'surface3d', surfaceData: { z: [[2, 4], [6, 8]] } }, 0.5)
    expect(sfMid.surfaceData.z).toEqual([[1, 2], [3, 4]])
  })

  it('错峰补间：先入场的条目先到位', () => {
    const from = captureChart3dData({ type: 'bar3d', labels: ['a', 'b', 'c'], series: [{ name: 's', data: [0, 0, 0] }] })
    const mid = interpolateChart3dOptions(from, { type: 'bar3d', labels: ['a', 'b', 'c'], series: [{ name: 's', data: [100, 100, 100] }] }, 0.5, 0.6)
    const [d0, d1, d2] = mid.series[0].data
    expect(d0).toBeGreaterThan(d1)
    expect(d1).toBeGreaterThan(d2)
    expect(d0).toBe(100)
  })
})

describe('二维动画：减速动效与分段进场', () => {
  it('prefers-reduced-motion：进场动画跳过，立即派发 ready 与 animation-end', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const wrapper = await mountChart(BAR_OPTIONS())
    await flush()
    expect(wrapper.emitted('ready')).toBeTruthy()
    expect(wrapper.emitted('animation-end')).toBeTruthy()
    wrapper.unmount()
  })

  it('常规进场：同一次 flush 内不会提前 ready（动画在跑）', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const wrapper = await mountChart({ ...BAR_OPTIONS(), animation: { duration: 1200 } })
    await flush()
    expect(wrapper.emitted('ready')).toBeFalsy()
    wrapper.unmount()
  })

  it('animation.stagger > 0：分段进场能跑到终点并派发事件（柱/饼/折线都不抛错）', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    for (const options of [
      { ...BAR_OPTIONS(), animation: { stagger: 0.5, duration: 60 } },
      { type: 'pie', pieData: [{ name: 'A', value: 3 }, { name: 'B', value: 2 }, { name: 'C', value: 1 }], animation: { stagger: 0.5, duration: 60 } },
      { type: 'line', labels: ['一', '二', '三'], series: [{ name: '线', data: [1, 3, 2] }], animation: { stagger: 0.5, duration: 60 } },
    ]) {
      const wrapper = await mountChart(options)
      await flush(180)
      expect(wrapper.emitted('ready'), `${options.type} 应完成进场`).toBeTruthy()
      expect(wrapper.emitted('animation-end')).toBeTruthy()
      wrapper.unmount()
    }
  })

  it('animation.stagger 缺省为 0：不进分段分支（保持原有整体进场）', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const wrapper = await mountChart({ ...BAR_OPTIONS(), animation: { duration: 1200 } })
    await flush()
    expect(wrapper.emitted('ready')).toBeFalsy()
    wrapper.unmount()
  })
})
