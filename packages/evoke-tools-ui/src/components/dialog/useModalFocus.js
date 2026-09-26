/**
 * 模态焦点管理 — M3 L0 焦点契约的组件侧胶水（tools-ui 计划 07 M3 出口条件四）
 *
 * EtDialog / EtBackstage 两处的「焦点陷阱 + Esc 收敛 + 焦点归还」共用本件：
 * 判定逻辑全部走 runtime/focus/trap 的纯函数（getFocusableElements /
 * nextFocusableInTrap / resolveFocusReturnTarget），不另写一套——同一个 Tab
 * 在 Dialog / Backstage / CommandPalette 三处行为必须一致。
 *
 * 用法（容器 = Teleport 到 body 的那个浮层根元素，tabindex=-1）：
 *   const focus = useModalFocus(() => rootRef.value, { onEscape })
 *   watch(modelValue, open => open ? nextTick(focus.activate) : focus.deactivate())
 *
 * 键位监听挂在容器元素上（不是 document 级：焦点被陷阱圈在容器内， Esc/Tab
 * 由容器自己收敛；G5 组字守卫仍然先过——候选词上屏不是应用命令）。
 */
import { getFocusableElements, nextFocusableInTrap, resolveFocusReturnTarget } from '../../runtime/focus/trap'
import { isImeComposing } from '@wil-works/evoke-business-ui'

/**
 * @param {() => (HTMLElement|null)} getContainer 浮层根元素（延迟取，挂载后才存在）
 * @param {{ onEscape?: () => void }} [options] Esc 收敛回调（调用方自行决定是否关闭）
 */
export function useModalFocus(getContainer, options = {}) {
  const onEscape = options.onEscape
  /** 打开前的焦点持有者（触发器）；关闭时经 resolveFocusReturnTarget 归还 */
  let trigger = null

  function onKeydown(event) {
    // 组字期禁快捷键（G5）：中文/日文输入法候选词上屏不等同于应用命令
    if (isImeComposing(event)) return
    const container = getContainer()
    if (!container) return
    if (event.key === 'Escape') {
      event.preventDefault()
      if (onEscape) onEscape()
      return
    }
    if (event.key !== 'Tab') return
    // 陷阱内循环：末位 Tab 回首位、首位 Shift+Tab 回末位；焦点在容器外则进第一个
    const next = nextFocusableInTrap(
      getFocusableElements(container),
      document.activeElement,
      event.shiftKey ? -1 : 1,
    )
    if (next) {
      event.preventDefault()
      next.focus()
    }
  }

  /** 打开：记住触发器 → 焦点落容器内第一个可聚焦物（容器本身 tabindex=-1 兜底）→ 上监听 */
  function activate() {
    const container = getContainer()
    if (!container) return
    trigger = document.activeElement
    const first = nextFocusableInTrap(getFocusableElements(container), null, 1)
    ;(first ?? container).focus()
    container.addEventListener('keydown', onKeydown)
  }

  /** 关闭：摘监听 → 焦点归还（触发器已卸载 → 容器内第一个，不丢键盘用户） */
  function deactivate() {
    const container = getContainer()
    if (container) container.removeEventListener('keydown', onKeydown)
    const target = resolveFocusReturnTarget(container, trigger)
    trigger = null
    if (target && typeof target.focus === 'function') target.focus()
  }

  return { activate, deactivate }
}
