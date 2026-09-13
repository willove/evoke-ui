/**
 * useScrollLock — body 滚动锁定（弹层类组件共用）
 *
 * 锁定期间消除「滚动条消失 → 视口变宽 → 内容回流」造成的抖动：
 * - 现代浏览器：给 html 上 scrollbar-gutter: stable 预留滚动条槽位，
 *   视口布局宽度不变，文档流与 position:fixed 元素都不位移；
 * - 不支持 gutter 的浏览器回退 body padding-right 补偿（只能稳住文档流），
 *   并出 --ev-scrollbar-width 变量供消费方补偿 fixed 元素（如固定顶栏）。
 * 引用计数支持多弹层叠加（Modal + ImagePreview 同开等），全部关闭后恢复原状
 */

let lockCount = 0
let savedOverflow = ''
let savedPaddingRight = ''
let savedGutter = ''

function scrollbarWidth() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth)
}

function supportsGutter() {
  return (
    typeof window !== 'undefined' &&
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('scrollbar-gutter: stable')
  )
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
  if (supportsGutter()) {
    savedGutter = document.documentElement.style.scrollbarGutter
    document.documentElement.style.scrollbarGutter = 'stable'
  } else {
    savedPaddingRight = document.body.style.paddingRight
    const gap = scrollbarWidth()
    if (gap > 0) {
      const prev = getComputedStyle(document.body).paddingRight
      document.body.style.paddingRight = `calc(${prev} + ${gap}px)`
      document.body.style.setProperty('--ev-scrollbar-width', `${gap}px`)
    }
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
  document.body.style.removeProperty('--ev-scrollbar-width')
  if (savedGutter) {
    document.documentElement.style.scrollbarGutter = savedGutter
  } else {
    document.documentElement.style.removeProperty('scrollbar-gutter')
  }
  savedOverflow = ''
  savedPaddingRight = ''
  savedGutter = ''
}
