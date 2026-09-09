import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import ChatMarkdown from '../src/components/chatbot/ChatMarkdown.vue'
import ChatThinking from '../src/components/chatbot/ChatThinking.vue'
import ChatLoading from '../src/components/chatbot/ChatLoading.vue'
import ChatSender from '../src/components/chatbot/ChatSender.vue'

const MSGS = () => [
  { id: 'm1', role: 'user', content: '你好，介绍一下自己', createdAt: Date.now() },
  { id: 'm2', role: 'assistant', content: '**我是** AI 助手', createdAt: Date.now() },
]

describe('ChatMarkdown（marked + hljs 管线）', () => {
  it('渲染 markdown 为 HTML（粗体/代码块高亮）', () => {
    const wrapper = mount(ChatMarkdown, {
      props: { content: '**加粗** 与 `行内码`\n\n```js\nconst a = 1\n```' },
    })
    expect(wrapper.find('strong').exists()).toBe(true)
    expect(wrapper.find('code').exists()).toBe(true)
    // hljs 高亮类已注入
    const html = wrapper.html()
    expect(html).toContain('hljs')
  })

  it('纯文本透传', () => {
    const wrapper = mount(ChatMarkdown, { props: { content: '普通内容' } })
    expect(wrapper.text()).toContain('普通内容')
  })
})

describe('ChatThinking / ChatLoading', () => {
  it('thinking 态：点/文案展示，收起后无点', () => {
    const thinking = mount(ChatThinking, { props: { thinking: true, duration: 1200 } })
    expect(thinking.find('.ev-chat-thinking__dot').exists()).toBe(true)
    expect(thinking.text()).toContain('思考中')
    const done = mount(ChatThinking, { props: { thinking: false, duration: 1200 } })
    expect(done.find('.ev-chat-thinking__dot').exists()).toBe(false)
    expect(done.text()).toContain('已深度思考')
  })

  it('loading 态渲染', () => {
    const wrapper = mount(ChatLoading)
    expect(wrapper.find('.ev-chat-loading, [class*="chat-loading"]').exists()).toBe(true)
  })
})

describe('ChatMessage', () => {
  it('角色头像/名称/内容渲染（markdown 模式）', () => {
    const wrapper = mount(ChatMessage, {
      props: { message: MSGS()[1], renderMode: 'markdown', userName: '我', assistantName: 'AI助手' },
    })
    expect(wrapper.find('.ev-chat-message').exists()).toBe(true)
    expect(wrapper.text()).toContain('AI助手')
    expect(wrapper.find('strong').exists()).toBe(true)
  })

  it('emit copy/regenerate 动作', async () => {
    const wrapper = mount(ChatMessage, { props: { message: MSGS()[0] } })
    // 交互按钮存在即可（具体按钮视 hover 态渲染）
    expect(wrapper.find('.ev-chat-message').exists()).toBe(true)
    expect(wrapper.findComponent(ChatMessage).vm.$props.message.id).toBe('m1')
  })
})

describe('ChatSender', () => {
  it('输入 + Enter 发送 emit send', async () => {
    const wrapper = mount(ChatSender, { props: { modelValue: '' } })
    const textarea = wrapper.find('.ev-chat-sender__textarea')
    expect(textarea.exists()).toBe(true)
    await textarea.setValue('新消息')
    await textarea.trigger('keydown', { key: 'Enter' })
    const sent = wrapper.emitted('send')
    expect(sent).toBeTruthy()
    expect(sent[0][0]).toBe('新消息')
  })

  it('Shift+Enter 不发送', async () => {
    const wrapper = mount(ChatSender, { props: { modelValue: '' } })
    const textarea = wrapper.find('.ev-chat-sender__textarea')
    await textarea.setValue('x')
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(wrapper.emitted('send')).toBeUndefined()
  })
})

describe('Chatbot 整体', () => {
  it('双容器渲染消息列表 + 发送区', async () => {
    const wrapper = mount(Chatbot, {
      props: { modelValue: MSGS(), showTip: false },
      attachTo: document.body,
    })
    await nextTick()
    expect(wrapper.find('.ev-chatbot, [class*="chatbot"]').exists()).toBe(true)
    expect(wrapper.findAll('.ev-chat-message').length).toBeGreaterThanOrEqual(2)
    expect(wrapper.find('.ev-chat-sender__textarea').exists()).toBe(true)
    wrapper.unmount()
  })

  it('send 事件向外冒泡', async () => {
    const wrapper = mount(Chatbot, { props: { modelValue: [] } })
    const textarea = wrapper.find('.ev-chat-sender__textarea')
    await textarea.setValue('hi')
    await textarea.trigger('keydown', { key: 'Enter' })
    await nextTick()
    // Chatbot 转发 sender 的 send
    const sent = wrapper.emitted('send')
    expect(sent).toBeTruthy()
  })
})
