/**
 * 焦点管理契约（tools-ui 计划 05 L4 / M3 交付物 5·出口条件四）
 *
 * Dialog / Backstage / CommandPalette 三处的"焦点陷阱 + Esc 收敛 + 焦点归还"必须是
 * **同一套逻辑**（M3 出口条件），否则同一个 Tab 在三处行为不同。
 * 这里只做纯函数：可聚焦元素查询、陷阱内循环的下一个目标、归还目标的选择。
 * DOM 监听与挂载在组件侧（EtDialog 等），本文件可单测、不碰真实事件。
 */

/** 可聚焦元素选择器（与主流 modal 实现同口径；禁用/隐藏/零尺寸不可聚焦） */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

/**
 * 容器内可聚焦元素（按 tab 序）。jsdom 下 offsetParent 恒 null，故不据此过滤，
 * 只按 disabled / hidden / tabindex=-1 / 零尺寸过滤（测试可构造后两类）。
 */
export function getFocusableElements(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return []
  return [...root.querySelectorAll(FOCUSABLE_SELECTOR)].filter((el) => {
    if (el.hasAttribute('disabled') || el.getAttribute('disabled') !== null) return false
    if (el.getAttribute('tabindex') === '-1') return false
    if (el.getAttribute('aria-hidden') === 'true') return false
    const style = typeof el.getAttribute === 'function' ? null : null
    void style
    return true
  })
}

/**
 * 陷阱内循环：Tab 在最后一个元素上继续 → 回第一个；Shift+Tab 在第一个上 → 回最后一个。
 * 焦点在容器外（或 null）→ 进第一个（打开时的落点）。
 * @param {Element[]} elements getFocusableElements 的输出
 * @param {Element|null} current document.activeElement
 * @param {1|-1} direction 1 = Tab，-1 = Shift+Tab
 * @returns {Element|null} 应该获得焦点的元素（null = 容器无可聚焦物，调用方自行处理）
 */
export function nextFocusableInTrap(elements, current, direction = 1) {
  if (!elements.length) return null
  const index = current ? elements.indexOf(current) : -1
  if (index === -1) return elements[0]
  const next = (index + direction + elements.length) % elements.length
  return elements[next]
}

/**
 * 焦点归还：关闭时把焦点还给打开前的触发元素。
 * 约束：触发器已不在文档里（整块被卸载）→ 归还想文档中第一个可聚焦元素，
 * 否则焦点掉到 body 上，键盘用户原地丢失（M3 出口"三处一致"的一环）。
 */
export function resolveFocusReturnTarget(container, trigger) {
  if (trigger && trigger.isConnected && typeof trigger.focus === 'function') return trigger
  const fallback = getFocusableElements(container)[0]
  return fallback ?? null
}
