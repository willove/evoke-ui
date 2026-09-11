/**
 * 暗色模式 composable — html.dark 切换
 * toggleDark 优先走 View Transitions 整页交叉淡入淡出（浅→深 / 深→浅柔和过渡），
 * 不支持的环境或用户偏好减少动效时退化为直接切换。
 * DOM 访问全部在函数内（Electron 安全）
 */
import { ref, nextTick, watchEffect } from 'vue'
import { inBrowser } from '../utils/dom'

const isDark = ref(false)
let initialized = false

function detect() {
  if (!inBrowser()) return false
  return document.documentElement.classList.contains('dark')
}

function prefersReducedMotion() {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * @returns {{ isDark: import('vue').Ref<boolean>, toggleDark: () => void, setDark: (v: boolean) => void }}
 */
export function useDarkMode() {
  if (!initialized) {
    initialized = true
    isDark.value = detect()
    // 监听外部脚本对 html.dark 的修改（如 lock screen 自行切换）
    if (inBrowser() && typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        isDark.value = detect()
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }
  }

  watchEffect(() => {
    if (!inBrowser()) return
    document.documentElement.classList.toggle('dark', isDark.value)
  })

  function toggleDark() {
    if (
      inBrowser() &&
      typeof document.startViewTransition === 'function' &&
      !prefersReducedMotion()
    ) {
      // 回调内同步改状态并等 Vue 完成 DOM 补丁，新旧页面快照交叉淡入淡出
      document.startViewTransition(async () => {
        isDark.value = !isDark.value
        await nextTick()
      })
      return
    }
    isDark.value = !isDark.value
  }

  function setDark(value) {
    isDark.value = !!value
  }

  return { isDark, toggleDark, setDark }
}
