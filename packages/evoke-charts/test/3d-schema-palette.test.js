import { describe, it, expect } from 'vitest'
import { chart3dOptionsSchema, validateOptions3d } from '../src/3d/schema.js'
import { CHART3D_PALETTES, CHART3D_RAMPS, resolveChartPalette, resolveChartRamp } from '../src/3d/palette.js'
import { applySeriesPalette, clearSeriesPalette, SLOT_COUNT } from '../src/palette.js'
import { getTheme, CHART3D_TYPES, easings, resolveEasing, resolveI18n } from '../src/3d/types.js'

describe('schema 校验', () => {
  it('合法柱状图配置零告警', () => {
    const { ok, warnings } = validateOptions3d({
      type: 'bar3d',
      labels: ['a', 'b'],
      series: [{ name: 'x', data: [1, 2] }],
      camera: { yaw: -30, pitch: 40 },
      xAxis: { name: '月份' },
    })
    expect(ok).toBe(true)
    expect(warnings).toHaveLength(0)
  })

  it('缺失 type 报必填', () => {
    const { ok } = validateOptions3d({})
    expect(ok).toBe(false)
  })

  it('非法 type 报枚举', () => {
    const { warnings } = validateOptions3d({ type: 'bar' })
    expect(warnings.some((w) => w.path === 'options.type')).toBe(true)
  })

  it('palette 枚举校验', () => {
    const good = validateOptions3d({ type: 'bar3d', palette: 'aurora' })
    const bad = validateOptions3d({ type: 'bar3d', palette: 'nope' })
    expect(good.ok).toBe(true)
    expect(bad.ok).toBe(false)
  })

  it('series 项类型错误逐项定位', () => {
    const { warnings } = validateOptions3d({
      type: 'bar3d',
      series: [{ name: 123, data: 'x' }],
    })
    expect(warnings.some((w) => w.path.includes('series[0].name'))).toBe(true)
    expect(warnings.some((w) => w.path.includes('series[0].data'))).toBe(true)
  })

  it('饼数据数值校验', () => {
    const { warnings } = validateOptions3d({
      type: 'pie3d',
      pieData: [{ name: 'a', value: 'x' }],
    })
    expect(warnings.some((w) => w.path.includes('pieData[0].value'))).toBe(true)
  })

  it('曲面矩阵结构校验', () => {
    const bad = validateOptions3d({ type: 'surface3d', surfaceData: { z: 'nope' } })
    expect(bad.ok).toBe(false)
    const good = validateOptions3d({ type: 'surface3d', surfaceData: { x: [1], y: [1], z: [[1]] } })
    expect(good.ok).toBe(true)
  })

  it('非对象输入直接失败', () => {
    expect(validateOptions3d(null).ok).toBe(false)
    expect(validateOptions3d([1]).ok).toBe(false)
    expect(validateOptions3d('x').ok).toBe(false)
  })

  it('函数字段（formatter）接受函数', () => {
    const { ok } = validateOptions3d({
      type: 'bar3d',
      xAxis: { formatter: (v) => v },
      tooltip: { formatter: () => '' },
    })
    expect(ok).toBe(true)
  })

  it('schema 覆盖全部图型枚举', () => {
    expect(chart3dOptionsSchema.properties.type.enum).toEqual(CHART3D_TYPES)
  })
})

describe('内置色系', () => {
  it('7 套色系各 8 槽且明暗成对', () => {
    expect(CHART3D_PALETTES).toHaveLength(7)
    for (const p of CHART3D_PALETTES) {
      expect(p.light).toHaveLength(8)
      expect(p.dark).toHaveLength(8)
      expect(p.id).toBeTruthy()
    }
  })

  it('resolveChartPalette 未知 id 返回 null', () => {
    expect(resolveChartPalette('aurora', false)).toHaveLength(8)
    expect(resolveChartPalette('aurora', true)).toHaveLength(8)
    expect(resolveChartPalette('x', false)).toBe(null)
  })

  it('色带解析与明暗两套', () => {
    expect(resolveChartRamp('heat', false).length).toBeGreaterThan(2)
    expect(resolveChartRamp('heat', true).length).toBeGreaterThan(2)
    expect(resolveChartRamp('x', false)).toBe(null)
    expect(Object.keys(CHART3D_RAMPS).length).toBeGreaterThanOrEqual(5)
  })
})

describe('色系注入', () => {
  it('数组写入内联令牌槽位并可清除', () => {
    const colors = ['#111111', '#222222', '#333333']
    expect(applySeriesPalette(colors)).toBe(true)
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-1')).toBe('#111111')
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-3')).toBe('#333333')
    // 只写提供的槽位，其余不动（共享实现契约）
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-4')).toBe('')
    clearSeriesPalette()
    expect(document.documentElement.style.getPropertyValue('--ev-color-series-1')).toBe('')
  })

  it('按 id 注入内置色系（复用主体系注册表）', () => {
    expect(applySeriesPalette('aurora', { dark: true })).toBe(true)
    const v = document.documentElement.style.getPropertyValue('--ev-color-series-2')
    expect(v.toLowerCase()).toBe(CHART3D_PALETTES.find((p) => p.id === 'aurora').dark[1].toLowerCase())
    clearSeriesPalette()
  })

  it('明暗两套注入 style 表并随 dark 切换', () => {
    clearSeriesPalette()
    expect(applySeriesPalette({ light: ['#aaaaaa'], dark: ['#bbbbbb'] })).toBe(true)
    const style = document.head.querySelector('style[data-ev-series-palette]')
    expect(style).toBeTruthy()
    expect(style.textContent).toContain(':root')
    expect(style.textContent).toContain('--ev-color-series-1: #aaaaaa')
    expect(style.textContent).toContain('html.dark')
    expect(style.textContent).toContain('--ev-color-series-1: #bbbbbb')
    clearSeriesPalette()
    expect(document.head.querySelector('style[data-ev-series-palette]')).toBe(null)
  })

  it('非法输入返回 false 不抛错', () => {
    expect(applySeriesPalette(null)).toBe(false)
    expect(applySeriesPalette(42)).toBe(false)
    expect(applySeriesPalette('unknown-id')).toBe(false)
  })
})

describe('主题', () => {
  it('customTheme.colors 优先于 palette', () => {
    const theme = getTheme({}, { colors: ['#010203'] }, ['#0a0b0c'])
    expect(theme.colors[0]).toBe('#010203')
  })

  it('palette 次于 customTheme、优先于令牌', () => {
    const theme = getTheme({}, null, ['#0a0b0c'])
    expect(theme.colors[0]).toBe('#0a0b0c')
  })

  it('customTheme 非 colors 字段覆写结构色', () => {
    const theme = getTheme({}, { textColor: '#ff0000' })
    expect(theme.textColor).toBe('#ff0000')
    expect(theme.colors.length).toBeGreaterThan(0)
  })

  it('undefined 覆写字段不抹掉已裁定值', () => {
    const theme = getTheme({}, { colors: undefined, textColor: undefined })
    expect(theme.colors.length).toBeGreaterThan(0)
    expect(theme.textColor).toBeTruthy()
  })

  it('缓动表与回退', () => {
    expect(resolveEasing('easeOut')(1)).toBe(1)
    expect(resolveEasing('easeOut')(0)).toBe(0)
    expect(resolveEasing('nope')).toBe(easings.easeOut)
  })

  it('i18n 中英切换与字段合并', () => {
    expect(resolveI18n({ lang: 'en' }).noData).toBe('No Data')
    expect(resolveI18n({}).noData).toBe('暂无数据')
    expect(resolveI18n({ i18n: { noData: '空' } }).noData).toBe('空')
    expect(resolveI18n({ i18n: { tooltip: { value: '值' } } }).tooltip.x).toBeTruthy()
  })
})
