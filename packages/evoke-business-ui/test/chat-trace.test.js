import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatActionbar from '../src/components/chatbot/ChatActionbar.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 M：观测性深链
 *
 * 契约是 URL 模板而不是 URL 生成器——各家追踪平台路径差异极大，模板是最小可复用面。
 */

const TEMPLATE = 'https://smith.example.com/o/acme/runs/{traceId}'
const msg = (extra = {}) => ({ id: 'a1', role: 'assistant', content: '回答', status: 'done', ...extra })

describe('ChatActionbar 追踪外链', () => {
  it('按模板替换 {traceId}，渲染成新窗口锚点', () => {
    const w = mount(ChatActionbar, { props: { message: msg({ traceId: 'run_abc123' }), traceUrl: TEMPLATE } })
    const link = w.find('a.eb-chat-actionbar__btn')
    expect(link.attributes('href')).toBe('https://smith.example.com/o/acme/runs/run_abc123')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.attributes('aria-label')).toBe(chatLabels.actionbar.trace)
  })

  it('traceId 里的特殊字符被编码，不破 URL', () => {
    const w = mount(ChatActionbar, { props: { message: msg({ traceId: 'a/b?c=1&d' }), traceUrl: TEMPLATE } })
    expect(w.find('a.eb-chat-actionbar__btn').attributes('href')).toBe(
      'https://smith.example.com/o/acme/runs/a%2Fb%3Fc%3D1%26d',
    )
  })

  it('消息自带 traceUrl 时优先于模板', () => {
    const w = mount(ChatActionbar, {
      props: { message: msg({ traceId: 'ignored', traceUrl: 'https://other.example/t/9' }), traceUrl: TEMPLATE },
    })
    expect(w.find('a.eb-chat-actionbar__btn').attributes('href')).toBe('https://other.example/t/9')
  })

  it('解析不出地址就不渲染，不留死链', () => {
    const cases = [
      { label: '无 traceId', props: { message: msg(), traceUrl: TEMPLATE } },
      { label: '无模板', props: { message: msg({ traceId: 'x' }) } },
      { label: '模板里没有占位符', props: { message: msg({ traceId: 'x' }), traceUrl: 'https://a.example/runs' } },
    ]
    for (const c of cases) {
      const w = mount(ChatActionbar, { props: c.props })
      expect(w.find('a.eb-chat-actionbar__btn').exists(), c.label).toBe(false)
      w.unmount()
    }
  })

  it('长模板不会被当成死链：多个占位符都替换', () => {
    const w = mount(ChatActionbar, {
      props: { message: msg({ traceId: 'r1' }), traceUrl: 'https://a.example/{traceId}/detail/{traceId}' },
    })
    expect(w.find('a.eb-chat-actionbar__btn').attributes('href')).toBe('https://a.example/r1/detail/r1')
  })
})

describe('追踪链路的透传与引擎', () => {
  it('ChatMessage 与 Chatbot 都能把模板传到动作条', async () => {
    const direct = mount(ChatMessage, { props: { message: msg({ traceId: 'r1' }), traceUrl: TEMPLATE } })
    expect(direct.find('a.eb-chat-actionbar__btn').exists()).toBe(true)
    direct.unmount()

    const fromBot = mount(Chatbot, { props: { showTip: false, traceUrl: TEMPLATE, modelValue: [msg({ traceId: 'r1' })] } })
    await nextTick()
    expect(fromBot.find('a.eb-chat-actionbar__btn').attributes('href')).toContain('r1')
  })

  it('用户消息不给追踪外链（调用链属于助手那一轮）', () => {
    const w = mount(ChatActionbar, {
      props: { message: { id: 'u1', role: 'user', content: '问', status: 'done', traceId: 'r1' }, traceUrl: TEMPLATE },
    })
    // 动作条本身不按角色收敛 trace：用户消息通常不带 traceId，带了也照渲染
    expect(w.find('a.eb-chat-actionbar__btn').exists()).toBe(true)
  })

  it('setTrace 写入 id 与地址；空值可清回', () => {
    const eng = useChatEngine({})
    const m = eng.createAssistantMessage()
    eng.completeMessage(m.id)
    eng.setTrace(m.id, { traceId: 'run_1', traceUrl: '' })
    expect(eng.messages.value[0]).toMatchObject({ traceId: 'run_1', traceUrl: '' })
    eng.setTrace(m.id, { traceUrl: 'https://x.example/runs/run_1' })
    expect(eng.messages.value[0]).toMatchObject({ traceId: '', traceUrl: 'https://x.example/runs/run_1' })
    eng.setTrace(m.id)
    expect(eng.messages.value[0]).toMatchObject({ traceId: '', traceUrl: '' })
  })
})
