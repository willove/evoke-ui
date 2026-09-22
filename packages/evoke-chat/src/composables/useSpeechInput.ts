/**
 * useSpeechInput — 口述输入（Web Speech Recognition）
 *
 * 与 useSpeech 一样按能力检测决定是否给入口：Firefox 目前没有
 * SpeechRecognition，Safari 部分版本只认 webkit 前缀，都不支持时
 * supported 为 false，调用 start 是安全空操作。
 *
 * 结果分两路：interim（随时在变的临时结果）与 final（已定稿片段）。
 * 中间结果交给调用方自己决定怎么用——多数场景是覆盖填充输入框，
 * 定稿时才追加，这样光标不会跳。
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { inBrowser } from '@wil-works/evoke-business-ui'

export interface UseSpeechInputOptions {
  /** BCP-47，如 zh-CN */
  lang?: string
  /** 是否连续识别；false 时说完一句就结束 */
  continuous?: boolean
  /** 是否把临时结果也交出来（默认交） */
  interimResults?: boolean
  /** 临时结果变化 */
  onInterim?: (text: string) => void
  /** 一段话定稿 */
  onFinal?: (text: string) => void
  /** 出错（no-speech / not-allowed / network 等） */
  onError?: (code: string) => void
  /** 结束（无论正常还是被打断） */
  onEnd?: () => void
}

type RecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
}

function getCtor(): (new () => RecognitionLike) | null {
  if (!inBrowser()) return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as (new () => RecognitionLike) | null
}

export function useSpeechInput(options: UseSpeechInputOptions = {}): {
  supported: ComputedRef<boolean>
  listening: Ref<boolean>
  error: Ref<string>
  start: () => boolean
  stop: () => void
  toggle: () => void
} {
  const Ctor = getCtor()
  const supported = computed(() => !!Ctor)
  const listening = ref(false)
  const error = ref('')
  let rec: RecognitionLike | null = null

  function ensure(): RecognitionLike | null {
    if (!Ctor) return null
    if (rec) return rec
    rec = new Ctor()
    rec.lang = options.lang || ''
    rec.continuous = options.continuous ?? false
    rec.interimResults = options.interimResults ?? true
    rec.onresult = (e: any) => {
      let interim = ''
      const finals: string[] = []
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const result = e.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) finals.push(text)
        else interim += text
      }
      if (interim) options.onInterim?.(interim)
      // 一段可能一次定稿多句，逐段交出去而不是拼成一坨
      for (const text of finals) options.onFinal?.(text)
    }
    rec.onerror = (e: any) => {
      error.value = e?.error || 'unknown'
      options.onError?.(error.value)
    }
    rec.onend = () => {
      listening.value = false
      options.onEnd?.()
    }
    return rec
  }

  function start(): boolean {
    const instance = ensure()
    if (!instance || listening.value) return false
    error.value = ''
    try {
      instance.start()
      listening.value = true
      return true
    } catch {
      // 连点两次会在某些实现上抛 InvalidStateError：按「已在进行」处理
      listening.value = true
      return false
    }
  }

  function stop() {
    if (!rec || !listening.value) return
    try {
      rec.stop()
    } catch {
      // 忽略：停止失败也会走 onend 复位
    }
  }

  function toggle() {
    if (listening.value) stop()
    else start()
  }

  onBeforeUnmount(() => {
    // 卸载时用 abort：stop 会让识别跑完当前这句再回调，组件已经不在了
    try {
      rec?.abort?.()
    } catch {
      // 忽略
    }
    rec = null
  })

  return { supported, listening, error, start, stop, toggle }
}
