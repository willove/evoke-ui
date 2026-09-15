/**
 * useCopy — 剪贴板复制（带降级）
 * 优先 Clipboard API，非安全上下文降级 execCommand
 *
 * Usage:
 *   const { copy, copied } = useCopy()
 *   await copy('text')   // copied 在 1.5s 后自动复位
 */
import { ref } from 'vue'
import type { Ref } from 'vue'

export function useCopy(resetDelay = 1500): {
  copy: (text: unknown) => Promise<boolean>
  copied: Ref<boolean>
} {
  const copied = ref(false)
  let timer: number | undefined

  async function copy(text: unknown): Promise<boolean> {
    const value = String(text ?? '')
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
        ok = true
      }
    } catch {
      /* 走降级 */
    }
    if (!ok) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        ok = document.execCommand('copy')
        textarea.remove()
      } catch {
        ok = false
      }
    }
    if (ok) {
      copied.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => (copied.value = false), resetDelay)
    }
    return ok
  }

  return { copy, copied }
}
