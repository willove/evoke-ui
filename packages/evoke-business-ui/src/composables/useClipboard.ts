/**
 * useClipboard — 剪贴板
 *
 * const { copied, copy } = useClipboard({ timeout: 1500 })
 * await copy('text')  // Clipboard API 优先，execCommand 兜底（file:// / 旧 WebView）
 */
import { ref } from 'vue'
import type { Ref } from 'vue'
import { inBrowser } from '../utils/dom'

export interface UseClipboardOptions {
  /** copied 复位延时（ms） */
  timeout?: number
}

export function useClipboard(options: UseClipboardOptions = {}): {
  copied: Ref<boolean>
  copy: (text: string) => Promise<boolean>
} {
  const { timeout = 1500 } = options
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  async function copy(text: string): Promise<boolean> {
    if (!inBrowser()) return false
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        ok = true
      }
    } catch {
      ok = false
    }
    if (!ok) {
      // execCommand 兜底：非 https / Electron file:// 场景
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        ok = document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        ok = false
      }
    }
    if (ok) {
      copied.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        copied.value = false
      }, timeout)
    }
    return ok
  }

  return { copied, copy }
}
