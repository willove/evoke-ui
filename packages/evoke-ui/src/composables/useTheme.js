/**
 * useTheme — 明暗主题管理
 * 驱动 html.dark 类切换（variables.css 暗色令牌重映射入口）
 * 优先级：localStorage 记忆 > 系统偏好；切换后写入记忆
 *
 * Usage:
 *   const { isDark, toggle, set } = useTheme()
 */
import { ref, computed } from 'vue'

const STORAGE_KEY = 'ev-theme'

const isDark = ref(false)
let initialized = false

function apply(dark) {
  isDark.value = dark
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', dark)
  }
}

/** 幂等初始化（app.use(EvokeUI) 时自动调用，也可手动提前） */
export function initTheme() {
  if (initialized || typeof window === 'undefined') return isDark
  initialized = true
  let stored = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    /* 隐私模式等场景下 localStorage 不可用 */
  }
  if (stored === 'dark' || stored === 'light') {
    apply(stored === 'dark')
  } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    apply(true)
  }
  return isDark
}

export function useTheme() {
  initTheme()
  const dark = computed(() => isDark.value)

  function set(value) {
    apply(!!value)
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light')
    } catch {
      /* 忽略写入失败 */
    }
  }

  function toggle() {
    set(!isDark.value)
  }

  return { isDark: dark, setTheme: set, toggleTheme: toggle }
}
