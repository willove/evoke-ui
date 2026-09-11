/**
 * useScrollLock — body 滚动锁定（弹层类组件共用）
 *
 * 锁定期间为 body 补偿滚动条宽度（padding-right），避免
 * 「滚动条消失 → 视口变宽 → 内容回流」造成的抖动；
 * 引用计数支持多弹层叠加（Modal + ImagePreview 同开等），全部关闭后恢复原状
 */

let lockCount = 0
let savedOverflow = ''
let savedPaddingRight = ''

function scrollbarWidth() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth)
}

/** 锁定 body 滚动；重复调用按引用计数叠加 */
export function lockBodyScroll() {
  if (typeof document === 'undefined') return
  if (lockCount > 0) {
    lockCount += 1
    return
  }
  lockCount = 1
  savedOverflow = document.body.style.overflow
  savedPaddingRight = document.body.style.paddingRight
  const gap = scrollbarWidth()
  if (gap > 0) {
    const prev = getComputedStyle(document.body).paddingRight
    document.body.style.paddingRight = `calc(${prev} + ${gap}px)`
  }
  document.body.style.overflow = 'hidden'
}

/** 解除锁定；与 lockBodyScroll 配对使用，计数归零后才真正恢复 */
export function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  if (lockCount === 0) return
  lockCount -= 1
  if (lockCount > 0) return
  document.body.style.overflow = savedOverflow
  document.body.style.paddingRight = savedPaddingRight
  savedOverflow = ''
  savedPaddingRight = ''
}
