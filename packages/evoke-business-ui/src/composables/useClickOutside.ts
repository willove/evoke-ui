/**
 * 点击外部检测 composable
 * pointerdown 捕获阶段判定，供 Dropdown/Select/Popover 关闭行为消费
 */
import { onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import { on } from '../utils/events'
import { contains, inBrowser } from '../utils/dom'

type ClickOutsideTarget = Ref<HTMLElement | null | undefined> | HTMLElement | null | undefined

/**
 * @param targets 监听目标（单/多）
 * @param handler 外部点击回调
 * @param enabled 开关
 */
export function useClickOutside(
  targets: ClickOutsideTarget | ClickOutsideTarget[],
  handler: (e: PointerEvent) => void,
  enabled = true,
): { stop: () => void; start: () => void } {
  let off: (() => void) | null = null

  function getElements(): HTMLElement[] {
    const list = Array.isArray(targets) ? targets : [targets]
    return list
      .map((t) => (t && 'value' in t ? t.value : t))
      .filter((el): el is HTMLElement => !!el)
  }

  function onPointerDown(e: Event): void {
    const els = getElements()
    if (!els.length) return
    const inside = els.some((el) => contains(el, e.target as Node | null))
    if (!inside) handler(e as PointerEvent)
  }

  function start(): void {
    if (off || !inBrowser() || !enabled) return
    off = on(document, 'pointerdown', onPointerDown, { capture: true })
  }

  function stop(): void {
    if (off) {
      off()
      off = null
    }
  }

  if (enabled) {
    // 延迟到 mounted 后由调用方 start()；这里默认在下一帧启用
    if (inBrowser()) {
      queueMicrotask(start)
    }
  }

  onBeforeUnmount(stop)

  return { stop, start }
}
