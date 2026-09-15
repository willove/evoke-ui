/**
 * useFullscreen — 全屏
 *
 * const { isFullscreen, enter, exit, toggle } = useFullscreen(elRef)
 * elRef 缺省作用于 documentElement
 */
import { onBeforeUnmount, ref, watchEffect } from 'vue'
import type { Ref } from 'vue'
import { inBrowser } from '../utils/dom'

export function useFullscreen(target?: Ref<Element | null | undefined> | Element | null): {
  isFullscreen: Ref<boolean>
  enter: () => Promise<void>
  exit: () => Promise<void>
  toggle: () => void
} {
  const isFullscreen = ref(false)

  function getEl(): Element | null {
    if (!inBrowser()) return null
    const t =
      target && typeof target === 'object' && 'value' in target ? target.value : (target as Element | null)
    return t instanceof Element ? t : document.documentElement
  }

  function syncState(): void {
    isFullscreen.value = !!inBrowser() && !!document.fullscreenElement
  }

  async function enter(): Promise<void> {
    const el = getEl()
    if (el && typeof el.requestFullscreen === 'function') {
      try {
        await el.requestFullscreen()
      } catch {
        /* 用户拒绝或无权限 */
      }
    }
  }

  async function exit(): Promise<void> {
    if (inBrowser() && typeof document.exitFullscreen === 'function') {
      try {
        await document.exitFullscreen()
      } catch {
        /* ignore */
      }
    }
  }

  function toggle(): void {
    isFullscreen.value ? exit() : enter()
  }

  let cleanup: (() => void) | undefined
  watchEffect((onCleanup) => {
    if (!inBrowser()) return
    document.addEventListener('fullscreenchange', syncState)
    syncState()
    cleanup = () => document.removeEventListener('fullscreenchange', syncState)
    onCleanup(() => {
      cleanup?.()
    })
  })
  onBeforeUnmount(() => cleanup?.())

  return { isFullscreen, enter, exit, toggle }
}
