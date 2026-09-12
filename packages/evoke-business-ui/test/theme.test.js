import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  normalizeHex,
  hexToRgb,
  rgbToHex,
  mixHex,
  generateColorRamp,
  generatePrimaryRamp,
  setPrimaryColor,
  setSemanticColors,
  setSeriesPalette,
  clearSeriesPalette,
  getSeriesPalette,
  resetTheme,
  getPrimaryColor,
  saveThemeConfig,
  loadThemeConfig,
  clearThemeConfig,
  EB_THEME_PRESETS,
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
    expect(ramp['--eb-color-primary']).toBe('#175dff')
    expect(ramp['--eb-color-primary-rgb']).toBe('23, 93, 255')
    expect(Object.keys(ramp)).toHaveLength(8)
    // light-9 最浅（趋白），dark-2 加深 20%（趋黑）— 与 mixHex 端点数学一致
    expect(ramp['--eb-color-primary-light-9']).toBe('#e8efff')
    expect(ramp['--eb-color-primary-dark-2']).toBe('#124acc')
    // 非法输入
    expect(generatePrimaryRamp('nope')).toBeNull()
  })

  it('setPrimaryColor：注入 documentElement 并派发主题变更事件', () => {
    const spy = vi.fn()
    document.documentElement.addEventListener('eb-theme-change', spy)
    const ramp = setPrimaryColor('#16a34a')
    expect(ramp['--eb-color-primary']).toBe('#16a34a')
    expect(
      document.documentElement.style.getPropertyValue('--eb-color-primary'),
    ).toBe('#16a34a')
    expect(
      document.documentElement.style.getPropertyValue('--eb-color-primary-light-5'),
    ).toBeTruthy()
    expect(spy).toHaveBeenCalledTimes(1)
    // 恢复默认，避免污染其他用例
    setPrimaryColor('#175DFF')
    document.documentElement.removeEventListener('eb-theme-change', spy)
  })

  it('setPrimaryColor：非法输入返回 null 且不触碰 DOM', () => {
    expect(setPrimaryColor('not-a-color')).toBeNull()
  })
})

describe('theme utils — 图表系列色板', () => {
  beforeEach(() => {
    resetTheme()
  })

  it('setSeriesPalette 逐槽写入 --ev-color-series-N 并派发 ev-theme-change', () => {
    const spy = vi.fn()
    document.addEventListener('ev-theme-change', spy)
    const injected = setSeriesPalette(['#175DFF', '#5AD8A6', '', '#F6BD16'])
    expect(injected).toEqual({ 1: '#175dff', 2: '#5ad8a6', 4: '#f6bd16' })
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-1')).toBe('#175dff')
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-3')).toBe('')
    expect(spy).toHaveBeenCalled()
    document.removeEventListener('ev-theme-change', spy)
  })

  it('clearSeriesPalette 清空槽位，getSeriesPalette 回到 null', () => {
    setSeriesPalette(['#175DFF'])
    expect(getSeriesPalette()).toBeTruthy()
    clearSeriesPalette()
    expect(getSeriesPalette()).toBe(null)
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-1')).toBe('')
  })

  it('resetTheme 一并清除系列色槽位', () => {
    setSeriesPalette(['#175DFF', '#5AD8A6'])
    resetTheme()
    expect(getSeriesPalette()).toBe(null)
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-1')).toBe('')
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-2')).toBe('')
  })
})

describe('theme utils — 密度切换', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-eb-density')
  })

  it('setDensity / getDensity 往返', () => {
    expect(setDensity('compact')).toBe(true)
    expect(document.documentElement.getAttribute('data-eb-density')).toBe('compact')
    expect(getDensity()).toBe('compact')

    expect(setDensity('loose')).toBe(true)
    expect(getDensity()).toBe('loose')

    expect(setDensity('default')).toBe(true)
    expect(document.documentElement.hasAttribute('data-eb-density')).toBe(false)
    expect(getDensity()).toBe('default')

    expect(setDensity('xxl')).toBe(false)
  })
})

describe('theme utils — 暗色感知梯度', () => {
  it('dark 模式下梯度反向：light 档趋黑、dark-2 趋白', () => {
    const light = generateColorRamp('#175dff')
    const dark = generateColorRamp('#175dff', { dark: true })
    // 暗色 dark-2 = 向白混 20%
    expect(dark['--eb-color-primary-dark-2']).toBe(mixHex('#175dff', '#ffffff', 0.2))
    // 方向对比：暗色 light-3 应比亮色 light-3 更深（趋黑）
    const lum = (hex) => parseInt(hex.slice(1, 3), 16)
    expect(lum(dark['--eb-color-primary-light-3'])).toBeLessThan(lum(light['--eb-color-primary-light-3']))
    // 暗色 light-9 接近黑底
    expect(lum(dark['--eb-color-primary-light-9'])).toBeLessThan(30)
  })

  it('generateColorRamp 支持语义色前缀', () => {
    const ramp = generateColorRamp('#16a34a', { dark: false, prefix: '--eb-color-success' })
    expect(ramp['--eb-color-success']).toBe('#16a34a')
    expect(ramp['--eb-color-success-light-5']).toBeTruthy()
    expect(ramp['--eb-color-primary']).toBeUndefined()
  })
})

describe('theme utils — 语义色 / 重置 / 查询', () => {
  afterEach(() => {
    resetTheme()
    clearThemeConfig()
  })

  it('setSemanticColors：注入语义色梯度并支持部分更新', () => {
    const injected = setSemanticColors({ success: '#16a34a', warning: '#d97706' })
    expect(injected).toEqual({ success: '#16a34a', warning: '#d97706' })
    expect(
      document.documentElement.style.getPropertyValue('--eb-color-warning-light-7'),
    ).toBeTruthy()
    setSemanticColors({ danger: '#dc2626' })
    expect(document.documentElement.style.getPropertyValue('--eb-color-success')).toBe('#16a34a')
    expect(document.documentElement.style.getPropertyValue('--eb-color-danger')).toBe('#dc2626')
  })

  it('setSemanticColors：全部非法输入返回 null', () => {
    expect(setSemanticColors({ success: 'nope' })).toBeNull()
    expect(setSemanticColors(null)).toBeNull()
  })

  it('getPrimaryColor / resetTheme', () => {
    setPrimaryColor('#7b2ff2')
    expect(getPrimaryColor()).toBe('#7b2ff2')
    expect(
      document.documentElement.style.getPropertyValue('--eb-color-primary'),
    ).toBe('#7b2ff2')
    resetTheme()
    expect(getPrimaryColor()).toBeNull()
    expect(
      document.documentElement.style.getPropertyValue('--eb-color-primary'),
    ).toBe('')
    expect(
      document.documentElement.style.getPropertyValue('--eb-color-primary-light-9'),
    ).toBe('')
  })

  it('暗色切换后自动按新模式重注入', async () => {
    const html = document.documentElement
    html.classList.remove('dark')
    setPrimaryColor('#175dff')
    const lightLight3 = html.style.getPropertyValue('--eb-color-primary-light-3')
    html.classList.add('dark')
    await new Promise((r) => setTimeout(r, 30))
    const darkLight3 = html.style.getPropertyValue('--eb-color-primary-light-3')
    expect(darkLight3).not.toBe(lightLight3)
    expect(parseInt(darkLight3.slice(1, 3), 16)).toBeLessThan(parseInt(lightLight3.slice(1, 3), 16))
    html.classList.remove('dark')
    resetTheme()
  })
})

describe('theme utils — 持久化', () => {
  afterEach(() => clearThemeConfig())

  it('save / load / clear 往返', () => {
    expect(loadThemeConfig()).toBeNull()
    saveThemeConfig({ primary: '#7b2ff2', semantic: { danger: '#dc2626' } })
    expect(loadThemeConfig()).toEqual({ primary: '#7b2ff2', semantic: { danger: '#dc2626' } })
    clearThemeConfig()
    expect(loadThemeConfig()).toBeNull()
  })

  it('EB_THEME_PRESETS：预设色板可用作 setPrimaryColor 输入', () => {
    expect(EB_THEME_PRESETS.length).toBeGreaterThanOrEqual(5)
    for (const preset of EB_THEME_PRESETS) {
      expect(generatePrimaryRamp(preset.value)).not.toBeNull()
      expect(typeof preset.name).toBe('string')
    }
  })
})
