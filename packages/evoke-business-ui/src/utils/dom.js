/**
 * 守卫式 DOM 工具
 * 所有函数内部才访问 window/document，模块顶层零全局引用（Electron/SSR 安全）
 */

/** @returns {boolean} 是否处于浏览器环境 */
export function inBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * 解析挂载目标：selector 字符串 / 元素 / 返回元素的函数
 * @param {string | HTMLElement | (() => HTMLElement) | undefined} target
 * @param {HTMLElement} [fallback] 默认 document.body
 * @returns {HTMLElement | null}
 */
export function resolveTarget(target, fallback) {
  if (!inBrowser()) return null
  const fb = fallback ?? document.body
  if (!target) return fb
  if (typeof target === 'string') {
    return document.querySelector(target) ?? fb
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
 * @param {HTMLElement} parent
 * @param {HTMLElement | null | undefined} child
 */
export function contains(parent, child) {
  if (!parent || !child) return false
  return parent === child || parent.contains(child)
}

/**
 * 获取元素相对文档的偏移
 * @param {HTMLElement} el
 */
export function getOffset(el) {
  if (!el || !el.getBoundingClientRect) return { top: 0, left: 0 }
  const rect = el.getBoundingClientRect()
  return {
    top: rect.top + (window.scrollY || window.pageYOffset || 0),
    left: rect.left + (window.scrollX || window.pageXOffset || 0),
  }
}

/**
 * 守卫式 localStorage 读取（Electron file:// 与隐私模式安全）
 * @param {string} key
 * @returns {string | null}
 */
export function storageGet(key) {
  try {
    if (inBrowser() && window.localStorage) {
      return window.localStorage.getItem(key)
    }
  } catch {
    /* 隐私模式/受限环境静默降级 */
  }
  return null
}

/**
 * 守卫式 localStorage 写入
 * @param {string} key
 * @param {string} value
 */
export function storageSet(key, value) {
  try {
    if (inBrowser() && window.localStorage) {
      window.localStorage.setItem(key, value)
    }
  } catch {
    /* 静默降级 */
  }
}
