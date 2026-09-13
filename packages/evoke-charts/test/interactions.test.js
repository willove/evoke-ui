// 交互规范：常量快照（防漂移闸门）+ 纯函数行为 + Esc 清态冒烟
import { describe, it, expect } from 'vitest'
import { INTERACTION, applyWheelZoom, resolveCursor, pickTooltipRows } from '../src/interactions.js'
import { mount } from '@vue/test-utils'
import EvChart from '../src/chart.vue'

describe('交互常量单一事实源（DESIGN.md 交互规范）', () => {
  it('规范数值快照：改动必须先改 DESIGN.md 并同步本快照', () => {
    expect(INTERACTION).toEqual({
      focusDimAlpha: 0.22,
      legendHiddenAlpha: { icon: 0.4, text: 0.6 },
      hierarchyDimAlpha: 0.25,
      zoom: { wheelFactor: 1.15, minSpan: 2 },
      tooltip: {
        cursorGap: 12,
        posTransition:
          'left 0.25s cubic-bezier(0.22, 1, 0.36, 1), top 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        fadeTransition: 'opacity 0.18s ease',
      },
      animation: { duration: 1200, easing: 'easeOut' },
    })
  })
})

describe('applyWheelZoom：光标锚点滚轮缩放', () => {
  it('缩放保持锚点比例：锚在窗口中点，缩完仍在原中心', () => {
    const next = applyWheelZoom({ start: 20, end: 40 }, 30, -1)
    const mid = (next.start + next.end) / 2
    expect(Math.abs(mid - 30)).toBeLessThan(0.01)
    expect(next.end - next.start).toBeCloseTo(20 / 1.15, 5)
  })

  it('deltaY > 0 扩窗（拉远），deltaY < 0 收窗（推近）', () => {
    const out = applyWheelZoom({ start: 40, end: 60 }, 50, 1)
    expect(out.end - out.start).toBeGreaterThan(20)
    const inR = applyWheelZoom({ start: 40, end: 60 }, 50, -1)
    expect(inR.end - inR.start).toBeLessThan(20)
  })

  it('窗口下限 2%，不因继续收窗而更小', () => {
    const next = applyWheelZoom({ start: 50, end: 51 }, 50.5, -1)
    expect(next.end - next.start).toBe(2)
  })

  it('边界钳制：不出 0–100', () => {
    const left = applyWheelZoom({ start: 0, end: 10 }, 2, -1)
    expect(left.start).toBeGreaterThanOrEqual(0)
    const right = applyWheelZoom({ start: 90, end: 100 }, 99, 1)
    expect(right.end).toBeLessThanOrEqual(100)
    expect(right.start).toBeGreaterThanOrEqual(0)
  })
})

describe('resolveCursor：光标语义', () => {
  it('绘图区 crosshair、图例/工具箱 pointer、滑块 grab/grabbing、其余 default', () => {
    expect(resolveCursor('plot')).toBe('crosshair')
    expect(resolveCursor('legend')).toBe('pointer')
    expect(resolveCursor('toolbox')).toBe('pointer')
    expect(resolveCursor('slider')).toBe('grab')
    expect(resolveCursor('slider', true)).toBe('grabbing')
    expect(resolveCursor('other')).toBe('default')
  })
})

describe('pickTooltipRows：空值行不渲染', () => {
  it('过滤 null / undefined / NaN，保留 0、空串与数组值（K 线 / 箱线）', () => {
    const rows = pickTooltipRows([
      { seriesName: 'a', value: 12 },
      { seriesName: 'b', value: null },
      { seriesName: 'c', value: 0 },
      { seriesName: 'd', value: undefined },
      { seriesName: 'e', value: NaN },
      { seriesName: 'f', value: [1, 2, 3, 4] },
      { seriesName: 'g', value: '' },
    ])
    expect(rows.map((r) => r.seriesName)).toEqual(['a', 'c', 'f', 'g'])
  })

  it('非数组输入原样返回（单系列 params）', () => {
    const p = { seriesName: 'a', value: null }
    expect(pickTooltipRows(p)).toBe(p)
  })
})

describe('Esc 清态冒烟', () => {
  it('挂载后派发 Escape 不抛错', () => {
    const wrapper = mount(EvChart, {
      props: {
        options: { type: 'line', labels: ['一', '二'], series: [{ name: 'a', data: [1, 2] }] },
        width: 400,
        height: 260,
        responsive: false,
      },
    })
    expect(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    }).not.toThrow()
    wrapper.unmount()
  })
})
