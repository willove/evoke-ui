import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  normalizeHex,
  hexToRgb,
  rgbToHex,
  mixHex,
  generatePrimaryRamp,
  setPrimaryColor,
  setDensity,
  getDensity,
} from '../src/utils/theme'

describe('theme utils — 颜色基础', () => {
  it('normalizeHex：3/6/8 位十六进制归一', () => {
    expect(normalizeHex('#FFF')).toBe('#ffffff')
    expect(normalizeHex('#175DFF')).toBe('#175dff')
    expect(normalizeHex('#175DFFFF')).toBe('#175dff')
    expect(normalizeHex('blue')).toBeNull()
    expect(normalizeHex('')).toBeNull()
    expect(normalizeHex(undefined)).toBeNull()
  })

  it('hexToRgb / rgbToHex 往返一致', () => {
    expect(hexToRgb('#175DFF')).toEqual({ r: 23, g: 93, b: 255 })
    expect(rgbToHex(23, 93, 255)).toBe('#175dff')
    expect(rgbToHex(300, -5, 12.4)).toBe('#ff000c')
  })

  it('mixHex：端点与中点', () => {
    const white = '#ffffff'
    const black = '#000000'
    expect(mixHex('#175dff', white, 0)).toBe('#175dff')
    expect(mixHex('#175dff', white, 1)).toBe('#ffffff')
    expect(mixHex('#000000', white, 0.5)).toBe('#808080')
    expect(mixHex('bad', white, 0.5)).toBeNull()
  })
})

describe('theme utils — 主色梯度', () => {
  it('generatePrimaryRamp：输出 9 个令牌，浅档单调趋白、深档趋黑', () => {
    const ramp = generatePrimaryRamp('#175DFF')
    expect(ramp['--ev-color-primary']).toBe('#175dff')
    expect(ramp['--ev-color-primary-rgb']).toBe('23, 93, 255')
    expect(Object.keys(ramp)).toHaveLength(8)
    // light-9 最浅（趋白），dark-2 加深 20%（趋黑）— 与 mixHex 端点数学一致
    expect(ramp['--ev-color-primary-light-9']).toBe('#e8efff')
    expect(ramp['--ev-color-primary-dark-2']).toBe('#124acc')
    // 非法输入
    expect(generatePrimaryRamp('nope')).toBeNull()
  })

  it('setPrimaryColor：注入 documentElement 并派发主题变更事件', () => {
    const spy = vi.fn()
    document.documentElement.addEventListener('ev-theme-change', spy)
    const ramp = setPrimaryColor('#16a34a')
    expect(ramp['--ev-color-primary']).toBe('#16a34a')
    expect(
      document.documentElement.style.getPropertyValue('--ev-color-primary'),
    ).toBe('#16a34a')
    expect(
      document.documentElement.style.getPropertyValue('--ev-color-primary-light-5'),
    ).toBeTruthy()
    expect(spy).toHaveBeenCalledTimes(1)
    // 恢复默认，避免污染其他用例
    setPrimaryColor('#175DFF')
    document.documentElement.removeEventListener('ev-theme-change', spy)
  })

  it('setPrimaryColor：非法输入返回 null 且不触碰 DOM', () => {
    expect(setPrimaryColor('not-a-color')).toBeNull()
  })
})

describe('theme utils — 密度切换', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-ev-density')
  })

  it('setDensity / getDensity 往返', () => {
    expect(setDensity('compact')).toBe(true)
    expect(document.documentElement.getAttribute('data-ev-density')).toBe('compact')
    expect(getDensity()).toBe('compact')

    expect(setDensity('loose')).toBe(true)
    expect(getDensity()).toBe('loose')

    expect(setDensity('default')).toBe(true)
    expect(document.documentElement.hasAttribute('data-ev-density')).toBe(false)
    expect(getDensity()).toBe('default')

    expect(setDensity('xxl')).toBe(false)
  })
})
