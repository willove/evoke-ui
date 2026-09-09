/**
 * useFullscreen — 全屏
 *
 * const { isFullscreen, enter, exit, toggle } = useFullscreen(elRef)
 * elRef 缺省作用于 documentElement
 */
import { onBeforeUnmount, ref, watchEffect } from 'vue'
import { inBrowser } from '../utils/dom'

export function useFullscreen(target) {
  const isFullscreen = ref(false)

  function getEl() {
    if (!inBrowser()) return null
    const t = target?.value ?? target
    return t instanceof Element ? t : document.documentElement
  }

  function syncState() {
    isFullscreen.value = !!inBrowser() && !!document.fullscreenElement
  }

  async function enter() {
    const el = getEl()
    if (el?.requestFullscreen) {
      try {
        await el.requestFullscreen()
      } catch {
        /* 用户拒绝或无权限 */
      }
    }
  }

  async function exit() {
    if (inBrowser() && document.exitFullscreen) {
      try {
        await document.exitFullscreen()
      } catch {
        /* ignore */
      }
    }
  }

  function toggle() {
    isFullscreen.value ? exit() : enter()
  }

  let cleanup
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
