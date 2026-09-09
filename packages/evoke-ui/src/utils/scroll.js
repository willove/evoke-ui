/**
 * 滚动定位工具 — 移动组件（EwPullRefresh / EwLoadMore 等）共用
 */

/** 元素是否为可纵向滚动的容器 */
function isScrollable(el) {
  const { overflowY } = getComputedStyle(el)
  return /scroll|auto/.test(overflowY) && el.scrollHeight > el.clientHeight
}

/** 找到元素最近的可行滚动祖先；无则回退 window */
export function getScrollParent(el) {
  let node = el?.parentElement
  while (node && node !== document.body && node !== document.documentElement) {
    if (isScrollable(node)) return node
    node = node.parentElement
  }
  return window
}

/** 读取滚动容器（或 window）的纵向滚动位置 */
export function getScrollTop(target) {
  if (target === window) return window.pageYOffset ?? 0
  return target?.scrollTop ?? 0
}
