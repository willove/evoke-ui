/**
 * z-index 层级管理器
 * 模块作用域纯计数器，零 DOM 访问（Electron/SSR 安全）
 * 所有浮层（弹窗/消息/下拉）统一消费，保证层级递增不互踩
 */

const DEFAULT_INITIAL = 2000

let seed: number | null = null

/** 获取下一个 z-index */
export function nextZIndex(): number {
  if (seed === null) {
    seed = DEFAULT_INITIAL
  }
  return ++seed
}

/** 读取当前计数（不递增） */
export function currentZIndex(): number {
  return seed ?? DEFAULT_INITIAL
}

/**
 * 重置计数器（仅测试用）
 */
export function resetZIndex(value = DEFAULT_INITIAL): void {
  seed = value
}
