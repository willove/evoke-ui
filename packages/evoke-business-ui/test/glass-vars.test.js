import { describe, it, expect } from 'vitest'
import { useGlassVars } from '../src/composables/useGlassVars'

describe('useGlassVars / 磨砂参数 → 内联令牌（eb 前缀）', () => {
  it('blur/tint/saturate 组合输出，底色拼 --eb-bg-color', () => {
    const c = useGlassVars({ blur: 20, saturate: 1.6, tint: 70 })
    expect(c.value).toEqual({
      '--eb-glass-blur': '20px',
      '--eb-glass-saturate': '1.6',
      '--eb-glass-bg': 'color-mix(in srgb, var(--eb-bg-color) 70%, transparent)',
    })
  })

  it('全缺省不产出内联样式；0 显式生效', () => {
    expect(useGlassVars({}).value).toBeUndefined()
    expect(useGlassVars({ blur: 0 }).value).toEqual({ '--eb-glass-blur': '0px' })
  })
})
