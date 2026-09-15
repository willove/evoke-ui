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

/** 判断键盘事件是否为 ESC */
export function isEsc(e?: KeyboardEvent | null): boolean {
  return e?.key === 'Escape'
}
