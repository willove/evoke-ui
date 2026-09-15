/**
 * 守卫式 DOM 工具
 * 所有函数内部才访问 window/document，模块顶层零全局引用（Electron/SSR 安全）
 */

/** 挂载目标：selector 字符串 / 元素 / 返回元素的函数 */
export type MountTarget = string | HTMLElement | (() => HTMLElement) | null | undefined

/** 是否处于浏览器环境 */
export function inBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * 解析挂载目标：selector 字符串 / 元素 / 返回元素的函数
 * @param fallback 默认 document.body
 */
export function resolveTarget(target: MountTarget, fallback?: HTMLElement): HTMLElement | null {
  if (!inBrowser()) return null
  const fb = fallback ?? document.body
  if (!target) return fb
  if (typeof target === 'string') {
    return (document.querySelector(target) as HTMLElement | null) ?? fb
  }
  if (typeof target === 'function') {
    try {
      return target() ?? fb
    } catch {
      return fb
    }
  }
  return target
}

/**
 * 元素是否包含另一元素（自身也算）
 */
export function contains(
  parent: HTMLElement | null | undefined,
  child: Node | null | undefined,
): boolean {
  if (!parent || !child) return false
  return parent === child || parent.contains(child)
}

/** 获取元素相对文档的偏移 */
export function getOffset(el: HTMLElement | null | undefined): { top: number; left: number } {
  if (!el || typeof el.getBoundingClientRect !== 'function') return { top: 0, left: 0 }
  const rect = el.getBoundingClientRect()
  return {
    top: rect.top + (window.scrollY || window.pageXOffset || 0),
    left: rect.left + (window.scrollX || window.pageXOffset || 0),
  }
}

/**
 * 守卫式 localStorage 读取（Electron file:// 与隐私模式安全）
 */
export function storageGet(key: string): string | null {
  try {
    if (inBrowser() && window.localStorage) {
      return window.localStorage.getItem(key)
    }
  } catch {
    /* 隐私模式/受限环境静默降级 */
  }
  return null
}

/** 守卫式 localStorage 写入 */
export function storageSet(key: string, value: string): void {
  try {
    if (inBrowser() && window.localStorage) {
      window.localStorage.setItem(key, value)
    }
  } catch {
    /* 静默降级 */
  }
}
