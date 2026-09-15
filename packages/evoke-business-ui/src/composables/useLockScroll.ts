/**
 * 滚动锁定 composable — 计数式，多弹窗叠加正确解锁
 * 锁定期间消除「滚动条消失 → 视口变宽 → 页面横向抖动」：
 * - 现代浏览器：html 上 scrollbar-gutter: stable 预留滚动条槽位，文档流与
 *   position:fixed 元素都不位移；
 * - 不支持 gutter 的浏览器回退 body padding-right 补偿（只稳住文档流），
 *   并出 --eb-scrollbar-width 变量供消费方补偿 fixed 元素（如固定顶栏）。
 */
import { ref, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import { inBrowser } from '../utils/dom'

let lockCount = 0
let cachedBodyPaddingRight = ''
let cachedBodyWidth = ''
let cachedRootGutter = ''

function supportsGutter(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('scrollbar-gutter: stable')
  )
}

export interface UseLockScrollOptions {
  /** 立即锁定 */
  immediate?: boolean
}

export function useLockScroll(options: UseLockScrollOptions = {}): {
  lock: () => void
  unlock: () => void
  isLocked: Ref<boolean>
} {
  const { immediate = false } = options
  const isLocked = ref(false)

  function lock(): void {
    if (!inBrowser() || isLocked.value) return
    isLocked.value = true
    lockCount++
    if (lockCount === 1) {
      const body = document.body
      const root = document.documentElement
      cachedBodyPaddingRight = body.style.paddingRight
      cachedBodyWidth = body.style.width
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth
      body.style.overflow = 'hidden'
      if (supportsGutter()) {
        cachedRootGutter = root.style.scrollbarGutter
        root.style.scrollbarGutter = 'stable'
      } else if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`
        // 供消费方补偿 body 补偿不到的 fixed 元素（如文档站固定顶栏），避免开关时页面横跳
        body.style.setProperty('--eb-scrollbar-width', `${scrollbarWidth}px`)
      }
      body.classList.add('eb-scroll-locked')
    }
  }

  function unlock(): void {
    if (!isLocked.value) return
    isLocked.value = false
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount === 0) {
      const body = document.body
      const root = document.documentElement
      body.style.overflow = ''
      body.style.paddingRight = cachedBodyPaddingRight
      body.style.width = cachedBodyWidth
      body.style.removeProperty('--eb-scrollbar-width')
      if (cachedRootGutter) {
        root.style.scrollbarGutter = cachedRootGutter
      } else {
        root.style.removeProperty('scrollbar-gutter')
      }
      cachedRootGutter = ''
      body.classList.remove('eb-scroll-locked')
    }
  }

  if (immediate) lock()

  onBeforeUnmount(unlock)

  return { lock, unlock, isLocked }
}
