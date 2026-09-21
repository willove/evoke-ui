/**
 * useSpeech — 朗读（Web Speech Synthesis）
 *
 * 浏览器支持参差（Chrome / Edge / Safari 较好，Firefox 视平台而定），
 * 所以 supported 交给调用方决定要不要渲染入口；不支持时调用 speak 是安全空操作。
 *
 * 单实例单次朗读：同一 composable 内再次 speak 会先停掉上一条，
 * 避免多条消息同时念。
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { inBrowser } from '../utils/dom'

export interface UseSpeechOptions {
  /** BCP-47 语言标签，如 zh-CN；缺省跟随浏览器 */
  lang?: string
  /** 0.1 ~ 10，默认 1 */
  rate?: number
  /** 0 ~ 2，默认 1 */
  pitch?: number
  /** 0 ~ 1，默认 1 */
  volume?: number
  /** 结束或被取消 */
  onEnd?: () => void
}

export function useSpeech(options: UseSpeechOptions = {}): {
  supported: ComputedRef<boolean>
  speaking: Ref<boolean>
  speak: (text: string, overrides?: Partial<UseSpeechOptions>) => boolean
  stop: () => void
} {
  const supported = computed(
    () =>
      inBrowser() &&
      typeof window.speechSynthesis !== 'undefined' &&
      typeof window.SpeechSynthesisUtterance !== 'undefined',
  )
  const speaking = ref(false)
  let current: SpeechSynthesisUtterance | null = null

  function stop() {
    if (!supported.value) return
    try {
      window.speechSynthesis.cancel()
    } catch {
      // 某些实现 cancel 会抛，忽略：停止失败不该冒泡给调用方
    }
    current = null
    speaking.value = false
  }

  function speak(text: string, overrides: Partial<UseSpeechOptions> = {}): boolean {
    if (!supported.value || !String(text || '').trim()) return false
    // 先停上一条：否则队列会一条条念完，用户点第二次像是没反应
    stop()
    const utter = new window.SpeechSynthesisUtterance(String(text))
    const merged = { ...options, ...overrides }
    if (merged.lang) utter.lang = merged.lang
    if (typeof merged.rate === 'number') utter.rate = merged.rate
    if (typeof merged.pitch === 'number') utter.pitch = merged.pitch
    if (typeof merged.volume === 'number') utter.volume = merged.volume
    utter.onend = () => {
      speaking.value = false
      current = null
      merged.onEnd?.()
    }
    utter.onerror = () => {
      // 被 cancel 也走 error：这里只负责复位，不区分原因
      speaking.value = false
      current = null
    }
    try {
      window.speechSynthesis.speak(utter)
      current = utter
      speaking.value = true
      return true
    } catch {
      speaking.value = false
      current = null
      return false
    }
  }

  onBeforeUnmount(stop)

  return { supported, speaking, speak, stop }
}
