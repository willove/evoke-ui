/**
 * 暗色模式 composable — html.dark 切换（API ）
 * DOM 访问全部在函数内（Electron 安全）
 */
import { ref, watchEffect } from 'vue'
import { inBrowser } from '../utils/dom'

const isDark = ref(false)
let initialized = false

function detect() {
  if (!inBrowser()) return false
  return document.documentElement.classList.contains('dark')
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
    isDark.value = !isDark.value
  }

  function setDark(value) {
    isDark.value = !!value
  }

  return { isDark, toggleDark, setDark }
}
