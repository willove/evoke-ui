import { describe, it, expect, vi } from 'vitest'
import {
  CANVAS_PALETTE,
  resolveCanvasPalette,
  applyCanvasPalette,
  observeThemeChanges,
} from '../src/runtime/theme/palette'

const stubStyle = (values) => ({ getPropertyValue: (name) => values[name] ?? '' })

describe('画布调色板映射', () => {
  it('登记表只含令牌名（G1 红线：无任何颜色字面量）', () => {
    for (const [role, token] of Object.entries(CANVAS_PALETTE)) {
      expect(token.startsWith('--'), `${role} → ${token} 不是令牌名`).toBe(true)
    }
    expect(CANVAS_PALETTE['canvas-bg']).toBe('--eb-bg-color')
  })

  it('解析：从主题样式读实际值，缺令牌 = 空 value', () => {
    const palette = resolveCanvasPalette(
      stubStyle({ '--eb-bg-color': '#fff', '--eb-color-primary': '#2f6bff' }),
    )
    expect(palette['canvas-bg']).toEqual({ token: '--eb-bg-color', value: '#fff' })
    expect(palette['canvas-grid-line'].value).toBe('')
  })

  it('落值：只写有值的角色，--ot-* 前缀', () => {
    const target = { setProperty: vi.fn() }
    const ot = (role) => `--ot-${role}` // G1 扫 test/：前缀不写字面量
    const written = applyCanvasPalette(target, {
      'canvas-bg': { token: '--eb-bg-color', value: '#fff' },
      'canvas-text': { token: '--eb-text-color-regular', value: '' },
    })
    expect(written).toEqual(['canvas-bg'])
    expect(target.setProperty).toHaveBeenCalledWith(ot('canvas-bg'), '#fff')
    expect(target.setProperty).not.toHaveBeenCalledWith(ot('canvas-text'), expect.anything())
  })

  it('订阅：挂载发首值，之后只有主题状态真变了才回调（去重），退订后不再触发', () => {
    let values = { '--eb-bg-color': '#fff' }
    const getStyle = () => stubStyle(values)
    const onChange = vi.fn()
    let attrs = {}
    const target = {
      className: '',
      setAttribute: (k, v) => { attrs[k] = v },
      removeAttribute: (k) => { delete attrs[k] },
      getAttribute: (k) => attrs[k] ?? null,
    }
    let fire = null
    const disconnect = vi.fn()
    vi.stubGlobal('MutationObserver', class {
      constructor(cb) { fire = cb }
      observe() {}
      disconnect() { disconnect(); fire = null }
    })
    const off = observeThemeChanges(target, getStyle, onChange)
    expect(onChange).toHaveBeenCalledTimes(1)

    // 真驱动 mutation：状态没变 → 去重要挡住（写回行内 --ot-* 也算这种噪声）
    fire()
    expect(onChange).toHaveBeenCalledTimes(1)

    // 密度切档（值一个没变，只有 data-density 变）→ 必须发
    attrs['data-density'] = 'compact'
    fire()
    expect(onChange).toHaveBeenCalledTimes(2)

    // 品牌换色（解析结果变）→ 必须发
    values = { '--eb-bg-color': '#111' }
    fire()
    expect(onChange).toHaveBeenCalledTimes(3)
    fire()
    expect(onChange).toHaveBeenCalledTimes(3)

    off()
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(fire).toBeNull()
    vi.unstubAllGlobals()
  })

  it('palette = {} 是「只订阅不落值」：画布产品自持 --ot-*，只要主题信号（2026-09-27 修的死订阅）', () => {
    let attrs = {}
    const target = {
      className: '',
      setAttribute: (k, v) => { attrs[k] = v },
      removeAttribute: (k) => { delete attrs[k] },
      getAttribute: (k) => attrs[k] ?? null,
    }
    let fire = null
    vi.stubGlobal('MutationObserver', class {
      constructor(cb) { fire = cb }
      observe() {}
      disconnect() { fire = null }
    })
    const onChange = vi.fn()
    // 空 palette：解析结果恒为 {}，若签名只看解析结果就永远是空串 → 一次都不发
    const off = observeThemeChanges(target, () => stubStyle({}), onChange, {})
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toEqual({})

    target.className = 'dark'
    fire()
    expect(onChange).toHaveBeenCalledTimes(2)
    fire()
    expect(onChange).toHaveBeenCalledTimes(2) // 没变仍去重
    off()
    vi.unstubAllGlobals()
  })
})
