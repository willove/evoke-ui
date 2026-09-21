import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, defineComponent, h } from 'vue'
import ChatSpeak from '../src/components/chatbot/ChatSpeak.vue'
import ChatVoiceInput from '../src/components/chatbot/ChatVoiceInput.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import { useSpeech } from '../src/composables/useSpeech'
import { useSpeechInput } from '../src/composables/useSpeechInput'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 I：语音朗读与口述输入
 *
 * 两条能力都按 Web Speech API 的能力检测决定给不给入口，不支持时安全降级。
 * jsdom 里没有这些 API，用例自己注入 mock——注意必须在挂载/调用 composable
 * 之前装好：useSpeechInput 在建实例时就读构造器。
 */

// ── TTS mock ──
class FakeUtterance {
  constructor(text) {
    this.text = text
    this.lang = ''
    this.rate = 1
    this.pitch = 1
    this.volume = 1
    this.onend = null
    this.onerror = null
  }
}
const spoken = []
let synthCancel = 0
const installSynthesis = () => {
  spoken.length = 0
  synthCancel = 0
  window.SpeechSynthesisUtterance = FakeUtterance
  window.speechSynthesis = {
    speak: (u) => spoken.push(u),
    cancel: () => { synthCancel += 1 },
  }
}
const removeSynthesis = () => {
  delete window.SpeechSynthesisUtterance
  delete window.speechSynthesis
}

// ── STT mock ──
let lastRec = null
class FakeRecognition {
  constructor() {
    lastRec = this
    this.lang = ''
    this.continuous = false
    this.interimResults = true
    this.onresult = null
    this.onerror = null
    this.onend = null
    this.started = 0
    this.stopped = 0
    this.aborted = 0
  }
  start() { this.started += 1 }
  stop() { this.stopped += 1; this.onend?.() }
  abort() { this.aborted += 1 }
  emit(results) {
    this.onresult?.({ resultIndex: 0, results })
  }
}
const installRecognition = () => {
  lastRec = null
  window.SpeechRecognition = FakeRecognition
}
const removeRecognition = () => {
  delete window.SpeechRecognition
  delete window.webkitSpeechRecognition
}

afterEach(() => {
  removeSynthesis()
  removeRecognition()
  document.body.innerHTML = ''
})

describe('useSpeech 朗读', () => {
  it('无 speechSynthesis 时 supported=false，speak 返回 false 且不抛', () => {
    let api
    mount(defineComponent({ setup() { api = useSpeech(); return () => h('div') } }))
    expect(api.supported.value).toBe(false)
    expect(api.speak('hi')).toBe(false)
    expect(api.speaking.value).toBe(false)
  })

  it('有实现时按参数朗读，结束复位 speaking', async () => {
    installSynthesis()
    let api
    mount(defineComponent({ setup() { api = useSpeech({ lang: 'zh-CN', rate: 1.5 }); return () => h('div') } }))
    expect(api.supported.value).toBe(true)
    expect(api.speak('念这段')).toBe(true)
    expect(api.speaking.value).toBe(true)
    expect(spoken[0].text).toBe('念这段')
    expect(spoken[0].lang).toBe('zh-CN')
    expect(spoken[0].rate).toBe(1.5)
    spoken[0].onend()
    await nextTick()
    expect(api.speaking.value).toBe(false)
  })

  it('空文本不朗读；再点会先 cancel 上一条', () => {
    installSynthesis()
    let api
    mount(defineComponent({ setup() { api = useSpeech(); return () => h('div') } }))
    expect(api.speak('   ')).toBe(false)
    expect(spoken).toHaveLength(0)
    api.speak('第一段')
    api.speak('第二段')
    expect(synthCancel).toBeGreaterThan(0)
    expect(spoken).toHaveLength(2)
  })
})

describe('useSpeechInput 口述', () => {
  it('无实现时 supported=false，start 返回 false', () => {
    let api
    mount(defineComponent({ setup() { api = useSpeechInput(); return () => h('div') } }))
    expect(api.supported.value).toBe(false)
    expect(api.start()).toBe(false)
  })

  it('装了实现后 start/stop 与回调串联', async () => {
    installRecognition()
    const interim = []
    const finals = []
    const ends = []
    let api
    mount(defineComponent({
      setup() {
        api = useSpeechInput({
          lang: 'zh-CN',
          onInterim: (t) => interim.push(t),
          onFinal: (t) => finals.push(t),
          onEnd: () => ends.push(1),
        })
        return () => h('div')
      },
    }))
    expect(api.supported.value).toBe(true)
    expect(api.start()).toBe(true)
    expect(api.listening.value).toBe(true)
    expect(lastRec.started).toBe(1)
    expect(lastRec.lang).toBe('zh-CN')

    lastRec.emit([{ isFinal: false, 0: { transcript: '你好' } }])
    expect(interim).toEqual(['你好'])
    lastRec.emit([{ isFinal: true, 0: { transcript: '你好世界' } }])
    expect(finals).toEqual(['你好世界'])

    api.stop()
    expect(lastRec.stopped).toBe(1)
    expect(api.listening.value).toBe(false)
    expect(ends).toHaveLength(1)
  })

  it('识别途中一次定稿多句逐段交出，不拼成一坨', () => {
    installRecognition()
    const finals = []
    let api
    mount(defineComponent({ setup() { api = useSpeechInput({ onFinal: (t) => finals.push(t) }); return () => h('div') } }))
    api.start()
    lastRec.emit([{ isFinal: true, 0: { transcript: '第一句。' } }, { isFinal: true, 0: { transcript: '第二句。' } }])
    expect(finals).toEqual(['第一句。', '第二句。'])
  })

  it('toggle 在听与不听之间切换', () => {
    installRecognition()
    let api
    mount(defineComponent({ setup() { api = useSpeechInput(); return () => h('div') } }))
    api.toggle()
    expect(api.listening.value).toBe(true)
    api.toggle()
    expect(api.listening.value).toBe(false)
  })

  it('错误回调带 code；卸载时 abort 而不是 stop', async () => {
    installRecognition()
    const errors = []
    let api
    const w = mount(defineComponent({ setup() { api = useSpeechInput({ onError: (c) => errors.push(c) }); return () => h('div') } }))
    // 识别实例是惰性建的：先 start 才有实例可驱动
    api.start()
    lastRec.onerror({ error: 'not-allowed' })
    expect(errors).toEqual(['not-allowed'])
    w.unmount()
    expect(lastRec.aborted).toBe(1)
  })

  it('webkit 前缀也认', () => {
    window.webkitSpeechRecognition = FakeRecognition
    let api
    mount(defineComponent({ setup() { api = useSpeechInput(); return () => h('div') } }))
    expect(api.supported.value).toBe(true)
  })
})

describe('ChatSpeak 按钮', () => {
  it('不支持时整个按钮不渲染', () => {
    const w = mount(ChatSpeak, { props: { text: 'hi' } })
    expect(w.find('.eb-chat-speak').exists()).toBe(false)
  })

  it('点一次开始朗读并抛 start，再点停止并抛 stop', async () => {
    installSynthesis()
    const w = mount(ChatSpeak, { props: { text: '念我' } })
    const btn = w.find('.eb-chat-speak')
    expect(btn.attributes('aria-pressed')).toBe('false')
    expect(btn.attributes('aria-label')).toBe(chatLabels.speech.speak)
    await btn.trigger('click')
    expect(w.emitted('start')[0][0]).toBe('念我')
    expect(btn.attributes('aria-pressed')).toBe('true')
    expect(btn.attributes('aria-label')).toBe(chatLabels.speech.stopSpeak)
    await btn.trigger('click')
    expect(w.emitted('stop')).toHaveLength(1)
    expect(spoken).toHaveLength(1)
  })

  it('空文本点了不朗读', async () => {
    installSynthesis()
    const w = mount(ChatSpeak, { props: { text: '  ' } })
    await w.find('.eb-chat-speak').trigger('click')
    expect(w.emitted('start')).toBeUndefined()
    expect(spoken).toHaveLength(0)
  })
})

describe('ChatVoiceInput 按钮', () => {
  it('不支持时不渲染', () => {
    expect(mount(ChatVoiceInput).find('.eb-chat-voice').exists()).toBe(false)
  })

  it('点击开始/停止，临时与定稿分别抛出', async () => {
    installRecognition()
    const w = mount(ChatVoiceInput, { props: { lang: 'zh-CN' } })
    const btn = w.find('.eb-chat-voice')
    expect(btn.attributes('aria-label')).toBe(chatLabels.speech.startListening)
    await btn.trigger('click')
    expect(w.emitted('start')).toHaveLength(1)
    expect(btn.classes()).toContain('is-listening')
    expect(w.find('.eb-chat-voice__pulse').exists()).toBe(true)

    lastRec.emit([{ isFinal: false, 0: { transcript: '在说' } }])
    expect(w.emitted('interim')[0][0]).toBe('在说')
    lastRec.emit([{ isFinal: true, 0: { transcript: '说完了' } }])
    expect(w.emitted('result')[0][0]).toBe('说完了')

    await btn.trigger('click')
    expect(w.emitted('end')).toHaveLength(1)
    expect(btn.classes()).not.toContain('is-listening')
  })
})

describe('speech 开关链', () => {
  const ASSISTANT = { id: 'a1', role: 'assistant', content: '回答', status: 'done' }

  it('未开 speech 时动作条没有朗读钮（回归钉）', () => {
    installSynthesis()
    const w = mount(ChatMessage, { props: { message: ASSISTANT } })
    expect(w.find('.eb-chat-speak').exists()).toBe(false)
  })

  it('开了 speech 时助手消息有、用户消息没有', () => {
    installSynthesis()
    const a = mount(ChatMessage, { props: { message: ASSISTANT, speech: true } })
    expect(a.find('.eb-chat-speak').exists()).toBe(true)
    const u = mount(ChatMessage, { props: { message: { id: 'u1', role: 'user', content: '问', status: 'done' }, speech: true } })
    expect(u.find('.eb-chat-speak').exists()).toBe(false)
  })

  it('从 Chatbot 层开 speech 能一路传到动作条', async () => {
    installSynthesis()
    const w = mount(Chatbot, { props: { showTip: false, speech: true, modelValue: [ASSISTANT] } })
    await nextTick()
    expect(w.find('.eb-chat-speak').exists()).toBe(true)
  })

  it('浏览器不支持时即便开了 speech 也不渲染朗读钮', () => {
    const w = mount(ChatMessage, { props: { message: ASSISTANT, speech: true } })
    expect(w.find('.eb-chat-speak').exists()).toBe(false)
  })
})
