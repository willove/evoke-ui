/**
 * 焦点漫游与 roving tabindex（tools-ui 计划 05 L0 · M0 交付物）
 *
 * 纯函数部分可单测（契约错了全盘皆错，见 06 §二 L1 测试层）；
 * useRovingTabindex 只是把纯函数接上 Vue 响应式。
 */
import { isImeComposing } from '@wil-works/evoke-business-ui'

/**
 * 焦点漫游下一步（纯函数）
 * @param {number} current 当前索引
 * @param {number} count 条目总数
 * @param {string} key KeyboardEvent.key（ArrowRight/Left/Up/Down/Home/End）
 * @param {'horizontal'|'both'} [orientation] both = 两向漫游（工具区/菜单网格）
 * @returns {number|null} 新索引；key 不适用时返回 null（调用方不拦截）
 */
export function nextRovingIndex(current, count, key, orientation = 'horizontal') {
  if (!Number.isInteger(current) || !Number.isInteger(count) || count <= 0) return null
  const clamp = (i) => Math.max(0, Math.min(count - 1, i))
  switch (key) {
    case 'ArrowRight':
      return orientation === 'horizontal' ? clamp(current + 1) : null
    case 'ArrowLeft':
      return orientation === 'horizontal' ? clamp(current - 1) : null
    case 'ArrowDown':
      return orientation === 'horizontal' ? null : clamp(current + 1)
    case 'ArrowUp':
      return orientation === 'horizontal' ? null : clamp(current - 1)
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

/**
 * roving tabindex 取值（纯函数）：整组只占一个 tab 位
 * @param {number} index 当前条目下标
 * @param {number} activeIndex 组内激活下标
 * @returns {0|-1}
 */
export function rovingTabindex(index, activeIndex) {
  return index === activeIndex ? 0 : -1
}

/**
 * roving tabindex 组合式函数
 * @param {{ count: import('vue').Ref<number> | number, active: import('vue').Ref<number>, orientation?: 'horizontal'|'both', onMove?: (next: number) => void }} options
 * @returns {{ tabindex: (i: number) => 0|-1, onKeydown: (e: KeyboardEvent) => void }}
 */
export function useRovingTabindex({ count, active, orientation = 'horizontal', onMove }) {
  const toValue = (v) => (typeof v === 'number' ? v : v?.value ?? 0)
  const tabindex = (i) => rovingTabindex(i, toValue(active))
  function onKeydown(e) {
    // 输入法组字期间禁漫游：否则候选词上屏会顺带移动焦点（G5 输入法门）
    if (isImeComposing(e)) return
    const next = nextRovingIndex(toValue(active), toValue(count), e.key, orientation)
    if (next === null || next === toValue(active)) return
    e.preventDefault()
    onMove ? onMove(next) : (active.value = next)
  }
  return { tabindex, onKeydown }
}
