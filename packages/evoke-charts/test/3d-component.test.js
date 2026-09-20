import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EvChart3d from '../src/3d/chart3d.vue'
import { createSvgRecorder } from '../src/3d/renderer/svgRecorder.js'

/**
 * 组件冒烟 — 与 evoke-charts 同一套 jsdom 桩法：
 * 桩掉 getBoundingClientRect（jsdom 无布局）、canvas 2d ctx（Proxy 记调用），
 * 动画关闭让 ready 同步可达。
 */

function mockCanvasCtx() {
  const calls = new Map()
  const target = {
    measureText: () => ({ width: 10 }),
    canvas: null,
  }
  const ctx = new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop]
      if (!calls.has(prop)) calls.set(prop, vi.fn())
      return calls.get(prop)
    },
    set(obj, prop, value) {
      obj[prop] = value
      return true
    },
  })
  ctx.__calls = calls
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  return ctx
}

function baseOptions() {
  return {
    type: 'bar3d',
    labels: ['一月', '二月', '三月'],
    series: [
      { name: '华东', data: [120, 200, 150] },
      { name: '华南', data: [90, 60, 130] },
    ],
    animation: { enabled: false },
  }
}

const flushRender = () => new Promise((resolve) => setTimeout(resolve, 40))

beforeEach(() => {
  mockCanvasCtx()
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
  document.body.innerHTML = ''
})

async function mountChart(options = baseOptions()) {
  const wrapper = mount(EvChart3d, {
    props: { options },
    attachTo: document.body,
  })
  await flushRender()
  return wrapper
}

function pickTarget(wrapper) {
  const result = wrapper.vm.getProjected()
  const faces = result.projected.items.filter((i) => i.visible !== false && i.pickable && i.kind === 'face')
  const target = faces[0]
  const cx = target.screen.reduce((s, p) => s + p[0], 0) / target.screen.length
  const cy = target.screen.reduce((s, p) => s + p[1], 0) / target.screen.length
  return { cx, cy, meta: target.meta }
}

function firePointer(el, type, x, y, extra = {}) {
  const evt = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, ...extra })
  el.dispatchEvent(evt)
}

describe('EvChart3d 挂载与四态', () => {
  it('挂载渲染：canvas 存在、有绘制调用、派发 ready', async () => {
    const wrapper = await mountChart()
    expect(wrapper.find('canvas').exists()).toBe(true)
    expect(wrapper.vm.getProjected()).toBeTruthy()
    expect(wrapper.emitted('ready')).toBeTruthy()
    wrapper.unmount()
  })

  it('空数据：无 canvas、显示空态', async () => {
    const wrapper = await mountChart({ type: 'bar3d', labels: [], series: [], animation: { enabled: false } })
    expect(wrapper.find('canvas').exists()).toBe(false)
    expect(wrapper.find('.ev-chart3d__empty').exists()).toBe(true)
    expect(wrapper.find('.ev-chart3d__empty').text()).toContain('暂无数据')
    wrapper.unmount()
  })

  it('加载态：显示骨架且不判空', async () => {
    const wrapper = await mountChart({ type: 'bar3d', labels: [], series: [], loading: true, animation: { enabled: false } })
    expect(wrapper.find('.ev-chart3d__loading').exists()).toBe(true)
    expect(wrapper.find('.ev-chart3d__empty').exists()).toBe(false)
    wrapper.unmount()
  })

  it('无障碍：role/aria-label/tabindex 与 aria-live 区域', async () => {
    const wrapper = await mountChart({
      ...baseOptions(),
      ariaLabel: '季度销量三维柱状图',
    })
    const root = wrapper.find('.ev-chart3d')
    expect(root.attributes('role')).toBe('img')
    expect(root.attributes('aria-label')).toBe('季度销量三维柱状图')
    expect(Number(root.attributes('tabindex'))).toBe(0)
    expect(wrapper.find('.ev-chart3d__sr-only').exists()).toBe(true)
    wrapper.unmount()
  })

  it('渲染异常进入错误边界而不是白屏', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(EvChart3d, {
      props: { options: baseOptions() },
      attachTo: document.body,
    })
    // 让 render 抛错：getContext 返回的对象在 setTransform 上抛
    HTMLCanvasElement.prototype.getContext.mockImplementation(() => {
      throw new Error('boom')
    })
    wrapper.vm.refresh()
    await flushRender()
    expect(wrapper.find('.ev-chart3d__error').exists()).toBe(true)
    expect(wrapper.text()).toContain('渲染失败')
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
    wrapper.unmount()
  })
})

describe('EvChart3d 指针交互', () => {
  it('悬浮柱体：派发 hover、显示 tooltip、光标变化', async () => {
    const wrapper = await mountChart()
    const canvas = wrapper.find('canvas').element
    const { cx, cy } = pickTarget(wrapper)
    firePointer(canvas, 'pointermove', cx, cy)
    await flushRender()
    expect(wrapper.emitted('hover')).toBeTruthy()
    expect(wrapper.find('.ev-chart3d__tooltip').exists()).toBe(true)
    expect(wrapper.find('.ev-chart3d__tooltip').text()).toContain('华东')
    firePointer(canvas, 'pointerleave', -10, -10)
    await flushRender()
    expect(wrapper.emitted('unhover')).toBeTruthy()
    expect(wrapper.find('.ev-chart3d__tooltip').exists()).toBe(false)
    wrapper.unmount()
  })

  it('点选柱体：派发 click 并带元数据', async () => {
    const wrapper = await mountChart()
    const canvas = wrapper.find('canvas').element
    const { cx, cy, meta } = pickTarget(wrapper)
    firePointer(canvas, 'pointerdown', cx, cy)
    firePointer(canvas, 'pointerup', cx, cy)
    await flushRender()
    const clicks = wrapper.emitted('click')
    expect(clicks).toBeTruthy()
    expect(clicks[0][0].seriesName).toBe(meta.seriesName)
    wrapper.unmount()
  })

  it('点击图例：切换隐藏并派发 legend-click', async () => {
    const wrapper = await mountChart()
    const legend = wrapper.vm.getProjected().legend.items[0]
    const canvas = wrapper.find('canvas').element
    firePointer(canvas, 'pointerdown', legend.x + 5, legend.y + 8)
    firePointer(canvas, 'pointerup', legend.x + 5, legend.y + 8)
    await flushRender()
    expect(wrapper.emitted('legend-click')).toBeTruthy()
    expect(wrapper.vm.getHiddenSeries().has(legend.name)).toBe(true)
    // 再点一次恢复
    firePointer(canvas, 'pointerdown', legend.x + 5, legend.y + 8)
    firePointer(canvas, 'pointerup', legend.x + 5, legend.y + 8)
    await flushRender()
    expect(wrapper.vm.getHiddenSeries().has(legend.name)).toBe(false)
    wrapper.unmount()
  })

  it('拖拽轨道：yaw 随水平拖拽变化并派发 camera-change', async () => {
    const wrapper = await mountChart()
    const before = wrapper.vm.getCamera().yaw
    const canvas = wrapper.find('canvas').element
    firePointer(canvas, 'pointerdown', 300, 200)
    firePointer(canvas, 'pointermove', 380, 200)
    firePointer(canvas, 'pointerup', 380, 200)
    await flushRender()
    const after = wrapper.vm.getCamera().yaw
    expect(after).toBeLessThan(before)
    expect(wrapper.emitted('camera-change')).toBeTruthy()
    // 有位移的拖拽不算点选
    expect(wrapper.emitted('click')).toBeFalsy()
    wrapper.unmount()
  })

  it('滚轮缩放：distance 收敛到界内', async () => {
    const wrapper = await mountChart()
    const canvas = wrapper.find('canvas').element
    const before = wrapper.vm.getCamera().distance
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -240, cancelable: true }))
    await flushRender()
    const after = wrapper.vm.getCamera().distance
    expect(after).toBeLessThan(before)
    expect(after).toBeGreaterThanOrEqual(1.4)
    wrapper.unmount()
  })

  it('双击复位：yaw 回到配置默认', async () => {
    const wrapper = await mountChart({ ...baseOptions(), camera: { yaw: 20 } })
    const canvas = wrapper.find('canvas').element
    firePointer(canvas, 'pointerdown', 300, 200)
    firePointer(canvas, 'pointermove', 420, 260)
    firePointer(canvas, 'pointerup', 420, 260)
    await flushRender()
    expect(wrapper.vm.getCamera().yaw).not.toBe(20)
    canvas.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
    await flushRender()
    expect(wrapper.vm.getCamera().yaw).toBe(20)
    wrapper.unmount()
  })
})

describe('EvChart3d 键盘与实例方法', () => {
  it('方向键环绕、加减缩放、Home 复位', async () => {
    const wrapper = await mountChart({ ...baseOptions(), camera: { yaw: 0, pitch: 30 } })
    const root = wrapper.find('.ev-chart3d').element
    const fire = (key) => root.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    fire('ArrowLeft')
    expect(wrapper.vm.getCamera().yaw).toBeCloseTo(-8, 6)
    fire('ArrowRight')
    expect(wrapper.vm.getCamera().yaw).toBeCloseTo(0, 6)
    fire('ArrowUp')
    expect(wrapper.vm.getCamera().pitch).toBeGreaterThan(30)
    const dist = wrapper.vm.getCamera().distance
    fire('=')
    expect(wrapper.vm.getCamera().distance).toBeLessThan(dist)
    fire('Home')
    expect(wrapper.vm.getCamera().yaw).toBe(0)
    expect(wrapper.vm.getCamera().pitch).toBe(30)
    wrapper.unmount()
  })

  it('setCamera / resetCamera / toggleSeries 实例方法', async () => {
    const wrapper = await mountChart()
    wrapper.vm.setCamera({ yaw: 77 })
    expect(wrapper.vm.getCamera().yaw).toBe(77)
    wrapper.vm.resetCamera()
    expect(wrapper.vm.getCamera().yaw).not.toBe(77)
    wrapper.vm.toggleSeries('华东')
    expect(wrapper.vm.getHiddenSeries().has('华东')).toBe(true)
    expect(wrapper.vm.getProjected().stats.pickable).toBe(3)
    wrapper.unmount()
  })

  it('exportSVG 注入录制器可产出 SVG 字符串', async () => {
    const wrapper = await mountChart()
    const real = document.createElement('canvas').getContext('2d')
    const recorder = createSvgRecorder(real)
    const svg = wrapper.vm.exportSVG({ ctx: recorder.ctx, toSvg: recorder.toSvg })
    expect(typeof svg).toBe('string')
    expect(svg).toContain('<svg')
    wrapper.unmount()
  })

  it('update 替换 options 后重渲染', async () => {
    const wrapper = await mountChart()
    wrapper.vm.update({
      type: 'pie3d',
      pieData: [{ name: 'A', value: 3 }, { name: 'B', value: 2 }],
      animation: { enabled: false },
    })
    await flushRender()
    expect(wrapper.emitted('data-update')).toBeTruthy()
    const projected = wrapper.vm.getProjected()
    expect(projected.stats.pickable).toBe(2)
    wrapper.unmount()
  })

  it('resize / refresh / destroy 可调用且卸载干净', async () => {
    const wrapper = await mountChart()
    wrapper.vm.resize()
    wrapper.vm.refresh()
    expect(wrapper.vm.getCanvas()).toBeTruthy()
    wrapper.vm.destroy()
    expect(wrapper.vm.getProjected()).toBe(null)
    wrapper.unmount()
  })
})
