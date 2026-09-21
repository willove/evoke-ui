/**
 * 事件绑定工具（统一 passive/capture 语义与解绑）
 */

/**
 * 绑定事件并返回解绑函数
 */
export function on(
  target: EventTarget | null | undefined,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions,
): () => void {
  if (!target || typeof target.addEventListener !== 'function') return () => {}
  target.addEventListener(event, handler, options)
  return () => target.removeEventListener(event, handler, options)
}

/**
 * 停止事件冒泡与默认行为（事件回调内使用）
 */
export function stopEvent(e?: Event | null): void {
  e?.stopPropagation?.()
  e?.preventDefault?.()
}

/** 判断键盘事件是否为 ENTER */
export function isEnter(e?: KeyboardEvent | null): boolean {
  return e?.key === 'Enter'
}

/**
 * 该键盘事件是否来自输入法组字（composition）过程。
 * Enter 提交路径必须过这一关：中文/日文输入法用 Enter 上屏候选词，
 * 不拦截等价于「选词即发送」。Safari 旧版不上报 isComposing，用 keyCode 229 兜底。
 */
export function isImeComposing(e?: KeyboardEvent | null): boolean {
  return !!e && (e.isComposing === true || e.keyCode === 229)
}

/** 判断键盘事件是否为 ESC */
export function isEsc(e?: KeyboardEvent | null): boolean {
  return e?.key === 'Escape'
}
