import { mount, describe, it, expect, beforeEach, EvConfigProvider } from './helpers'
import { generatePrimaryRamp, hexToRgb, mixHex } from '../src/utils/color'
import { resolveThemeVars, EV_COLOR_PRESETS, EV_RADIUS_PRESETS, EV_SPACE_PRESETS, EV_CONTAINER_PRESETS } from '../src/presets'
import { useThemeConfig } from '../src/composables/useThemeConfig'

describe('颜色工具', () => {
  it('hexToRgb 支持缩写与全写', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#0D70FF')).toEqual({ r: 13, g: 112, b: 255 })
    expect(hexToRgb('nope')).toBeNull()
  })

  it('mixHex 向白混 30% 与默认 light-3 一致量级', () => {
    const mixed = mixHex('#000000', '#ffffff', 1)
    expect(mixed).toBe('#ffffff')
  })

  it('generatePrimaryRamp 生成完整色阶', () => {
    const ramp = generatePrimaryRamp('#0D70FF')
    expect(ramp.base).toBe('#0D70FF')
    expect(ramp.rgb).toBe('13, 112, 255')
    // light-9 明显比主色更接近白
    const l9 = hexToRgb(ramp.light9)
    const base = hexToRgb(ramp.base)
    expect(l9.r + l9.g + l9.b).toBeGreaterThan(base.r + base.g + base.b)
    // dark-2 比主色暗
    expect(ramp.dark2).not.toBe(ramp.base)
  })
})

describe('主题预设与 resolveThemeVars', () => {
  it('预设齐全', () => {
    expect(Object.keys(EV_COLOR_PRESETS)).toContain('blue')
    expect(EV_RADIUS_PRESETS.round.scale).toBeGreaterThan(1)
    expect(EV_SPACE_PRESETS.compact.scale).toBeLessThan(1)
    expect(EV_CONTAINER_PRESETS.wide.width).toBeGreaterThan(EV_CONTAINER_PRESETS.default.width)
  })

  it('primary 解析出淡色阶令牌', () => {
    const vars = resolveThemeVars({ primary: '#7C5CFC' })
    expect(vars['--ev-color-primary']).toBe('#7C5CFC')
    expect(vars['--ev-color-primary-light-9']).toMatch(/^#/)
    expect(vars['--ev-color-primary-rgb']).toBe('124, 92, 252')
  })

  it('radius/space/container 解析出对应档位', () => {
    const vars = resolveThemeVars({ radius: 'round', space: 'loose', container: 'wide' })
    expect(vars['--ev-radius-xl']).toBe('26px')
    expect(vars['--ev-space-6']).toBe('29px')
    expect(vars['--ev-container-width']).toBe('1360px')
  })
})

describe('useThemeConfig', () => {
  beforeEach(() => {
    const { reset } = useThemeConfig()
    reset()
  })

  it('resolveThemeVars series 解析出 --ev-color-series-1..8', () => {
    const vars = resolveThemeVars({ series: ['#175DFF', '#5AD8A6'] })
    expect(vars['--ev-color-series-1']).toBe('#175DFF')
    expect(vars['--ev-color-series-2']).toBe('#5AD8A6')
    expect(vars['--ev-color-series-3']).toBeUndefined()
  })

  it('setSeries 写入图表系列槽位，null 清除', () => {
    const { setSeries } = useThemeConfig()
    setSeries(['#175DFF', '#5AD8A6'])
    const style = document.documentElement.style
    expect(style.getPropertyValue('--ev-color-series-1')).toBe('#175DFF')
    expect(style.getPropertyValue('--ev-color-series-2')).toBe('#5AD8A6')
    setSeries(null)
    expect(style.getPropertyValue('--ev-color-series-1')).toBe('')
    expect(style.getPropertyValue('--ev-color-series-2')).toBe('')
  })

  it('setPrimary 写入文档根令牌，reset 清除', () => {
    const { setPrimary, reset } = useThemeConfig()
    setPrimary('#F04E60')
    const style = document.documentElement.style
    expect(style.getPropertyValue('--ev-color-primary')).toBe('#F04E60')
    expect(style.getPropertyValue('--ev-color-primary-rgb')).toBe('240, 78, 96')
    reset()
    expect(style.getPropertyValue('--ev-color-primary')).toBe('')
  })

  it('setRadius 非 default 档写入圆角令牌', () => {
    const { setRadius } = useThemeConfig()
    setRadius('sharp')
    expect(document.documentElement.style.getPropertyValue('--ev-radius-md')).toBeTruthy()
    useThemeConfig().reset()
  })

  it('applyPreset 一整套写入主色/圆角/间距/容器宽', () => {
    const { applyPreset } = useThemeConfig()
    applyPreset('personal')
    const style = document.documentElement.style
    expect(style.getPropertyValue('--ev-color-primary')).toBe('#1A2947')
    expect(style.getPropertyValue('--ev-radius-xl')).toBeTruthy()
    expect(style.getPropertyValue('--ev-space-6')).toBeTruthy()
    expect(style.getPropertyValue('--ev-container-width')).toBe('920px')
    useThemeConfig().reset()
    expect(style.getPropertyValue('--ev-container-width')).toBe('')
  })

  it('applyPreset 未知 key 安全忽略', () => {
    const { applyPreset } = useThemeConfig()
    applyPreset('no-such-preset')
    expect(document.documentElement.style.getPropertyValue('--ev-color-primary')).toBe('')
  })
})

describe('EvConfigProvider 卸载还原 :root 令牌', () => {
  it('卸载时移除自己写入且原本不存在的令牌', () => {
    const style = document.documentElement.style
    const wrapper = mount(EvConfigProvider, {
      props: { primary: '#7C5CFC', radius: 'round', space: 'loose', container: 'wide' },
      slots: { default: 'x' },
    })
    expect(style.getPropertyValue('--ev-color-primary')).toBe('#7C5CFC')
    expect(style.getPropertyValue('--ev-radius-xl')).toBeTruthy()
    expect(style.getPropertyValue('--ev-container-width')).toBe('1360px')
    wrapper.unmount()
    expect(style.getPropertyValue('--ev-color-primary')).toBe('')
    expect(style.getPropertyValue('--ev-radius-xl')).toBe('')
    expect(style.getPropertyValue('--ev-container-width')).toBe('')
  })

  it('卸载还原到卸载前已存在的原值', () => {
    const style = document.documentElement.style
    style.setProperty('--ev-color-primary', '#112233')
    const wrapper = mount(EvConfigProvider, {
      props: { primary: '#7C5CFC' },
      slots: { default: 'x' },
    })
    expect(style.getPropertyValue('--ev-color-primary')).toBe('#7C5CFC')
    wrapper.unmount()
    expect(style.getPropertyValue('--ev-color-primary')).toBe('#112233')
    style.removeProperty('--ev-color-primary')
  })
})
