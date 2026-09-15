/**
 * 焦点圈禁 composable — Dialog/Msgbox 消费
 * Tab 循环圈禁 + ESC 处理 + aria-modal
 */
import { onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import { on } from '../utils/events'
import { inBrowser } from '../utils/dom'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export interface UseFocusTrapOptions {
  /** ESC 是否退出 */
  escapeDeactivates?: boolean
  /** ESC 回调 */
  onEscape?: (e: KeyboardEvent) => void
  /** 激活时聚焦容器 */
  initialFocus?: boolean
}

/**
 * @param containerRef 圈禁容器
 */
export function useFocusTrap(
  containerRef: Ref<HTMLElement | null | undefined>,
  options: UseFocusTrapOptions = {},
): { activate: () => void; deactivate: () => void } {
  const { escapeDeactivates = true, onEscape, initialFocus = true } = options
  let offKeydown: (() => void) | null = null
  let active = false
  let previouslyFocused: HTMLElement | null = null

  function getFocusableList(): HTMLElement[] {
    const el = containerRef.value
    if (!el) return []
    return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (node) => !node.hasAttribute('disabled') && node.offsetParent !== null
    )
  }

  function onKeydown(evt: Event): void {
    const e = evt as KeyboardEvent
    if (e.key === 'Escape' && escapeDeactivates) {
      onEscape?.(e)
      return
    }
    if (e.key !== 'Tab') return
    const list = getFocusableList()
    if (!list.length) {
      e.preventDefault()
      containerRef.value?.focus?.()
      return
    }
    const first = list[0]
    const last = list[list.length - 1]
    const current = document.activeElement
    if (e.shiftKey) {
      if (current === first || !containerRef.value?.contains(current)) {
        e.preventDefault()
        last.focus({ preventScroll: true })
      }
    } else if (current === last || !containerRef.value?.contains(current)) {
      e.preventDefault()
      first.focus({ preventScroll: true })
    }
  }

  function activate(): void {
    if (active || !inBrowser()) return
    active = true
    previouslyFocused = document.activeElement as HTMLElement | null
    offKeydown = on(document, 'keydown', onKeydown)
    if (initialFocus) {
      // 下一帧等 DOM 渲染完成后聚焦；preventScroll 防止浏览器为可见性滚动
      // overflow:auto 的遮罩（抽屉 enter 起始态在屏外，聚焦会把遮罩滚出错误原点，动画方向表现反转）
      requestAnimationFrame(() => {
        const el = containerRef.value
        if (!el) return
        const list = getFocusableList()
        ;(list[0] ?? el).focus?.({ preventScroll: true })
      })
    }
  }

  function deactivate(): void {
    if (!active) return
    active = false
    if (offKeydown) {
      offKeydown()
      offKeydown = null
    }
    // 归还焦点
    if (previouslyFocused) {
      previouslyFocused.focus()
    }
    previouslyFocused = null
  }

  onBeforeUnmount(deactivate)

  return { activate, deactivate }
}
