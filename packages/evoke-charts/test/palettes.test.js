// 内置色系：注册表结构、DESIGN.md §2.1 验收规则、schema 契约与固定语义
import { describe, it, expect } from 'vitest'
import { CHART_PALETTES, resolveChartPalette } from '../src/palettes.js'
import { validateOptions } from '../src/schema.js'
import { getTheme } from '../src/renderer/core.js'

function hexToHsl(hex) {
  const s = hex.replace('#', '')
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let sat = 0
  if (max !== min) {
    const d = max - min
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return { h, s: sat, l }
}

const hueGap = (a, b) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

describe('内置色系注册表', () => {
  it('7 套色系，id 唯一，明暗各 8 槽，名称与场景齐备', () => {
    expect(CHART_PALETTES.map((p) => p.id)).toEqual([
      'classic', 'aurora', 'sunset', 'morandi', 'forest', 'ink', 'candy',
    ])
    for (const p of CHART_PALETTES) {
      expect(p.light).toHaveLength(8)
      expect(p.dark).toHaveLength(8)
      expect(p.name).toBeTruthy()
      expect(p.scene).toBeTruthy()
    }
  })

  it('DESIGN 验收：相邻色相差 ≥ 30°（S < 20% 灰调槽豁免）', () => {
    for (const p of CHART_PALETTES) {
      for (const key of ['light', 'dark']) {
        const hsl = p[key].map(hexToHsl)
        for (let i = 0; i < hsl.length - 1; i++) {
          const a = hsl[i]
          const b = hsl[i + 1]
          if (a.s >= 0.2 && b.s >= 0.2) {
            expect(hueGap(a.h, b.h)).toBeGreaterThanOrEqual(30)
          }
        }
      }
    }
  })

  it('DESIGN 验收：暗色板同色相提亮（S ≥ 20% 槽位）', () => {
    for (const p of CHART_PALETTES) {
      p.light.forEach((hex, i) => {
        const l = hexToHsl(hex)
        const d = hexToHsl(p.dark[i])
        if (l.s >= 0.2 && d.s >= 0.2) {
          expect(hueGap(l.h, d.h)).toBeLessThanOrEqual(8)
          expect(d.l).toBeGreaterThanOrEqual(l.l)
        }
      })
    }
  })

  it('resolveChartPalette：按明暗取组，未知 id 返回 null', () => {
    expect(resolveChartPalette('aurora', false)[0]).toBe('#3B82F6')
    expect(resolveChartPalette('aurora', true)[0]).toBe('#60A5FA')
    expect(resolveChartPalette('aurora', false)).toHaveLength(8)
    expect(resolveChartPalette('nope', false)).toBeNull()
  })
})

describe('options.palette 固定语义', () => {
  it('schema：合法 id 通过，未知 id 报错', () => {
    expect(validateOptions({ type: 'bar', palette: 'aurora' }).ok).toBe(true)
    expect(validateOptions({ type: 'bar', palette: 'classic' }).ok).toBe(true)
    expect(validateOptions({ type: 'bar', palette: 'nope' }).ok).toBe(false)
  })

  it('getTheme：palette 生效即固定系列色（无 DOM 令牌兜底路径同样取到）', () => {
    expect(getTheme(false, undefined, 'aurora').colors[0]).toBe('#3B82F6')
    expect(getTheme(true, undefined, 'aurora').colors[0]).toBe('#60A5FA')
    expect(getTheme(true, undefined, 'morandi').colors[0]).toBe('#B4BEC9')
    // 未知 id 回落令牌/静态兜底路径，不抛错
    expect(getTheme(false, undefined, 'nope').colors[0]).toBe('#175DFF')
  })

  it('优先级：theme.colors 手工数组压过 palette', () => {
    const theme = getTheme(false, { colors: ['#111111', '#222222'] }, 'aurora')
    expect(theme.colors[0]).toBe('#111111')
  })

  it('默认路径不受影响：不传 palette 走令牌/静态兜底', () => {
    expect(getTheme(false, undefined).colors[0]).toBe('#175DFF')
    expect(getTheme(true, undefined).colors[0]).toBe('#4d8bff')
  })
})
