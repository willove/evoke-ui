/**
 * 点击外部检测 composable
 * pointerdown 捕获阶段判定，供 Dropdown/Select/Popover 关闭行为消费
 */
import { onBeforeUnmount } from 'vue'
import { on } from '../utils/events'
import { contains, inBrowser } from '../utils/dom'

/**
 * @param {import('vue').Ref<HTMLElement|null>|HTMLElement|Array} targets 监听目标（单/多）
 * @param {(e: PointerEvent) => void} handler 外部点击回调
 * @param {boolean} [enabled=true] 开关
 * @returns {{ stop: () => void, start: () => void }}
 */
export function useClickOutside(targets, handler, enabled = true) {
  let off = null

  function getElements() {
    const list = Array.isArray(targets) ? targets : [targets]
    return list.map((t) => (t && t.value !== undefined ? t.value : t)).filter(Boolean)
  }

  function onPointerDown(e) {
    const els = getElements()
    if (!els.length) return
    const inside = els.some((el) => contains(el, e.target))
    if (!inside) handler(e)
  }

  function start() {
    if (off || !inBrowser() || !enabled) return
    off = on(document, 'pointerdown', onPointerDown, { capture: true })
  }

  function stop() {
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
