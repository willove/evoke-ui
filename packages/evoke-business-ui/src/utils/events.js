/**
 * 事件绑定工具（统一 passive/capture 语义与解绑）
 */

/**
 * 绑定事件并返回解绑函数
 * @param {EventTarget | null | undefined} target
 * @param {string} event
 * @param {EventListener} handler
 * @param {AddEventListenerOptions} [options]
 * @returns {() => void} off
 */
export function on(target, event, handler, options) {
  if (!target || !target.addEventListener) return () => {}
  target.addEventListener(event, handler, options)
  return () => target.removeEventListener(event, handler, options)
}

/**
 * 停止事件冒泡与默认行为（事件回调内使用）
 * @param {Event} e
 */
export function stopEvent(e) {
  e?.stopPropagation?.()
  e?.preventDefault?.()
}

/**
 * 判断键盘事件是否为 ENTER
 * @param {KeyboardEvent} e
 */
export function isEnter(e) {
  return e?.key === 'Enter'
}

/**
 * 判断键盘事件是否为 ESC
 * @param {KeyboardEvent} e
 */
export function isEsc(e) {
  return e?.key === 'Escape'
}
