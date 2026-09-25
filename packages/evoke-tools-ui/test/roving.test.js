import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { nextRovingIndex, rovingTabindex, useRovingTabindex } from '../src/runtime/focus/roving'

describe('nextRovingIndex — 焦点漫游纯函数', () => {
  it('水平方向：Right/Left 进退，边界钳制', () => {
    expect(nextRovingIndex(1, 4, 'ArrowRight')).toBe(2)
    expect(nextRovingIndex(1, 4, 'ArrowLeft')).toBe(0)
    expect(nextRovingIndex(3, 4, 'ArrowRight')).toBe(3)
    expect(nextRovingIndex(0, 4, 'ArrowLeft')).toBe(0)
  })

  it('水平容器里上下键不拦截', () => {
    expect(nextRovingIndex(1, 4, 'ArrowDown', 'horizontal')).toBeNull()
    expect(nextRovingIndex(1, 4, 'ArrowDown', 'both')).toBe(2)
  })

  it('Home/End 跳到首尾（两向都响应）', () => {
    expect(nextRovingIndex(2, 5, 'Home')).toBe(0)
    expect(nextRovingIndex(2, 5, 'End')).toBe(4)
    expect(nextRovingIndex(2, 5, 'End', 'both')).toBe(4)
  })

  it('非漫游键返回 null（调用方不拦截）', () => {
    expect(nextRovingIndex(1, 4, 'Enter')).toBeNull()
    expect(nextRovingIndex(1, 4, 'a')).toBeNull()
  })

  it('非法入参返回 null', () => {
    expect(nextRovingIndex(0, 0, 'ArrowRight')).toBeNull()
    expect(nextRovingIndex(null, 4, 'ArrowRight')).toBeNull()
  })
})

describe('rovingTabindex — 整组一个 tab 位', () => {
  it('激活项 0，其余 -1', () => {
    expect(rovingTabindex(1, 1)).toBe(0)
    expect(rovingTabindex(0, 1)).toBe(-1)
  })
})

describe('useRovingTabindex — 组合式函数', () => {
  it('方向键移动激活项并 preventDefault', () => {
    const active = ref(0)
    const onMove = vi.fn()
    const { onKeydown } = useRovingTabindex({ count: ref(3), active, onMove })
    onKeydown({ key: 'ArrowRight', preventDefault: vi.fn(), isComposing: false })
    expect(onMove).toHaveBeenCalledWith(1)
  })

  it('组字期间不漫游（输入法候选词上屏不抢焦点）', () => {
    const active = ref(0)
    const onMove = vi.fn()
    const { onKeydown } = useRovingTabindex({ count: ref(3), active, onMove })
    onKeydown({ key: 'ArrowRight', preventDefault: vi.fn(), isComposing: true })
    expect(onMove).not.toHaveBeenCalled()
  })

  it('未提供 onMove 时写回 active ref', () => {
    const active = ref(1)
    const { onKeydown } = useRovingTabindex({ count: ref(3), active })
    onKeydown({ key: 'ArrowLeft', preventDefault: vi.fn(), isComposing: false })
    expect(active.value).toBe(0)
  })

  it('tabindex 取值跟随激活项', () => {
    const active = ref(1)
    const { tabindex } = useRovingTabindex({ count: ref(3), active })
    expect(tabindex(0)).toBe(-1)
    expect(tabindex(1)).toBe(0)
  })
})
