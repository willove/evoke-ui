/**
 * 滚动锁定 composable — 计数式，多弹窗叠加正确解锁
 * scrollbar-gutter 补偿避免锁定时页面横向抖动
 */
import { ref, onBeforeUnmount } from 'vue'
import { inBrowser } from '../utils/dom'

let lockCount = 0
let cachedBodyPaddingRight = ''
let cachedBodyWidth = ''

/**
 * @param {Object} [options]
 * @param {boolean} [options.immediate=false] 立即锁定
 * @returns {{ lock: () => void, unlock: () => void, isLocked: import('vue').Ref<boolean> }}
 */
export function useLockScroll(options = {}) {
  const { immediate = false } = options
  const isLocked = ref(false)

  function lock() {
    if (!inBrowser() || isLocked.value) return
    isLocked.value = true
    lockCount++
    if (lockCount === 1) {
      const body = document.body
      cachedBodyPaddingRight = body.style.paddingRight
      cachedBodyWidth = body.style.width
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth
      body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`
        // 供消费方补偿 body 补偿不到的 fixed 元素（如文档站固定顶栏），避免开关时页面横跳
        body.style.setProperty('--ev-scrollbar-width', `${scrollbarWidth}px`)
      }
      body.classList.add('ev-scroll-locked')
    }
  }

  function unlock() {
    if (!isLocked.value) return
    isLocked.value = false
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount === 0) {
      const body = document.body
      body.style.overflow = ''
      body.style.paddingRight = cachedBodyPaddingRight
      body.style.width = cachedBodyWidth
      body.style.removeProperty('--ev-scrollbar-width')
      body.classList.remove('ev-scroll-locked')
    }
  }

  if (immediate) lock()

  onBeforeUnmount(unlock)

  return { lock, unlock, isLocked }
}
