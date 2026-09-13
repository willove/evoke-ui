import { describe, it, expect } from 'vitest'
import { useGlassVars } from '../src/composables/useGlassVars'
import { computed } from 'vue'

function varsFrom(props) {
  const c = useGlassVars(props)
  return c.value
}

describe('useGlassVars / 磨砂参数 → 内联令牌', () => {
  it('全缺省不产出内联样式', () => {
    expect(varsFrom({})).toBeUndefined()
  })

  it('数字 blur 拼 px', () => {
    expect(varsFrom({ blur: 24 })).toEqual({ '--ev-glass-blur': '24px' })
  })

  it('0 显式生效（不能被 truthy 判空吃掉）', () => {
    expect(varsFrom({ blur: 0 })).toEqual({ '--ev-glass-blur': '0px' })
  })

  it('字符串透传', () => {
    expect(varsFrom({ blur: '8px' })).toEqual({ '--ev-glass-blur': '8px' })
  })

  it('saturate 数字转字符串', () => {
    expect(varsFrom({ saturate: 1.8 })).toEqual({ '--ev-glass-saturate': '1.8' })
  })

  it('tint 数字拼完整 color-mix（百分比位不能走 var()）', () => {
    expect(varsFrom({ tint: 60 })).toEqual({
      '--ev-glass-bg': 'color-mix(in srgb, var(--ev-bg-container) 60%, transparent)',
    })
  })

  it('tint 字符串透传（可直接给颜色值）', () => {
    expect(varsFrom({ tint: 'rgba(255,0,0,0.5)' })).toEqual({
      '--ev-glass-bg': 'rgba(255,0,0,0.5)',
    })
  })

  it('组合输出 + 空值跳过', () => {
    expect(varsFrom({ blur: 28, tint: 60 })).toEqual({
      '--ev-glass-blur': '28px',
      '--ev-glass-bg': 'color-mix(in srgb, var(--ev-bg-container) 60%, transparent)',
    })
  })
})
