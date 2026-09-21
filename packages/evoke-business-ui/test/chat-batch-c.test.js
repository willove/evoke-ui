import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatToolCall from '../src/components/chatbot/ChatToolCall.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 C：工具调用卡与引擎状态机
 */

describe('ChatToolCall', () => {
  it('四种状态渲染对应文案与标记', () => {
    const cases = [
      ['pending', chatLabels.tool.pending],
      ['running', chatLabels.tool.running],
      ['done', chatLabels.tool.done],
      ['error', chatLabels.tool.error],
    ]
    for (const [status, text] of cases) {
      const w = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'search', status } } })
      expect(w.find('.eb-chat-tool-call__status').text()).toBe(text)
      expect(w.classes()).toContain(`is-${status}`)
      w.unmount()
    }
  })

  it('label 覆盖 name；无 label 时用 name，都没有时兜底', () => {
    expect(mount(ChatToolCall, { props: { toolCall: { name: 'web_search', label: '搜索网页', status: 'done' } } }).find('.eb-chat-tool-call__name').text()).toBe('搜索网页')
    expect(mount(ChatToolCall, { props: { toolCall: { name: 'web_search', status: 'done' } } }).find('.eb-chat-tool-call__name').text()).toBe('web_search')
    expect(mount(ChatToolCall, { props: { toolCall: { status: 'done' } } }).find('.eb-chat-tool-call__name').text()).toBe(chatLabels.tool.fallback)
  })

  it('无参数无结果不可展开；失败态始终可展开看错误', () => {
    const bare = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'done' } } })
    expect(bare.find('.eb-chat-tool-call__header').attributes('disabled')).toBeDefined()
    const err = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'error', error: '上游 500' } } })
    expect(err.find('.eb-chat-tool-call__header').attributes('disabled')).toBeUndefined()
    expect(err.find('.eb-chat-tool-call__pre--error').text()).toBe('上游 500')
  })

  it('展开后参数与结果各自成段，对象走 JSON 缩进', async () => {
    const w = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'done', args: { q: 'a' }, result: { hits: 2 } } } })
    const header = w.find('.eb-chat-tool-call__header')
    expect(header.attributes('aria-expanded')).toBe('false')
    expect(header.attributes('aria-controls')).toBe(w.find('.eb-chat-tool-call__body').attributes('id'))
    await header.trigger('click')
    expect(header.attributes('aria-expanded')).toBe('true')
    const pres = w.findAll('.eb-chat-tool-call__pre')
    expect(pres[0].text()).toContain('"q": "a"')
    expect(pres[1].text()).toContain('"hits": 2')
    expect(w.emitted('toggle')[0]).toEqual([w.props('toolCall'), true])
  })

  it('字符串 result 原样展示，不额外加引号', () => {
    const w = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'done', result: '纯文本输出' }, expanded: true } })
    expect(w.find('.eb-chat-tool-call__pre').text()).toBe('纯文本输出')
  })

  it('循环引用的参数不炸渲染', () => {
    const args = { a: 1 }
    args.self = args
    const w = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'pending', args }, expanded: true } })
    expect(w.find('.eb-chat-tool-call__pre').text()).toContain('[Circular]')
  })

  it('重试钮只在失败态出现，retryable 可关', async () => {
    const done = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'done', result: 'ok' }, expanded: true } })
    expect(done.find('.eb-chat-tool-call__retry').exists()).toBe(false)
    const failed = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'error', error: 'e' }, expanded: true } })
    await failed.find('.eb-chat-tool-call__retry').trigger('click')
    expect(failed.emitted('retry')[0][0].id).toBe('t')
    const off = mount(ChatToolCall, { props: { toolCall: { id: 't', name: 'x', status: 'error', error: 'e' }, expanded: true, retryable: false } })
    expect(off.find('.eb-chat-tool-call__retry').exists()).toBe(false)
  })

  it('#args / #result 插槽可替换默认 pre', () => {
    const w = mount(ChatToolCall, {
      props: { toolCall: { id: 't', name: 'x', status: 'done', args: { q: 1 }, result: 'r' }, expanded: true },
      slots: { args: '<div class="mine">自定义参数</div>', result: '<div class="mine2">自定义结果</div>' },
    })
    expect(w.find('.mine').text()).toBe('自定义参数')
    expect(w.find('.mine2').text()).toBe('自定义结果')
    expect(w.findAll('.eb-chat-tool-call__pre')).toHaveLength(0)
  })
})

describe('useChatEngine 工具调用状态机', () => {
  function seeded() {
    const eng = useChatEngine({})
    const m = eng.createAssistantMessage()
    return { eng, m }
  }

  it('startToolCall 新建并转 running，带已存在 id 则复用', () => {
    const { eng, m } = seeded()
    const id = eng.startToolCall(m.id, { name: 'search', args: { q: 'x' } })
    expect(eng.messages.value[0].toolCalls).toHaveLength(1)
    expect(eng.messages.value[0].toolCalls[0]).toMatchObject({ id, name: 'search', status: 'running' })
    eng.startToolCall(m.id, { id })
    expect(eng.messages.value[0].toolCalls).toHaveLength(1)
    expect(eng.messages.value[0].toolCalls[0].status).toBe('running')
  })

  it('completeToolCall 写入结果并算耗时', async () => {
    const { eng, m } = seeded()
    const id = eng.startToolCall(m.id, { name: 'search' })
    await new Promise((r) => setTimeout(r, 15))
    eng.completeToolCall(m.id, id, { hits: 3 })
    const tc = eng.messages.value[0].toolCalls[0]
    expect(tc.status).toBe('done')
    expect(tc.result).toEqual({ hits: 3 })
    expect(tc.duration).toBeGreaterThan(0)
  })

  it('未 start 直接 complete：耗时为 0 但状态与结果照写', () => {
    const { eng, m } = seeded()
    const tc = eng.addToolCall(m.id, { name: 'x' })
    eng.completeToolCall(m.id, tc.id, 'ok')
    expect(eng.messages.value[0].toolCalls[0]).toMatchObject({ status: 'done', result: 'ok', duration: 0 })
  })

  it('failToolCall 接 Error 取 message，接字符串原样', () => {
    const { eng, m } = seeded()
    const a = eng.addToolCall(m.id, { name: 'x' })
    const b = eng.addToolCall(m.id, { name: 'y' })
    eng.failToolCall(m.id, a.id, new Error('上游 500'))
    eng.failToolCall(m.id, b.id, '超时')
    const [t1, t2] = eng.messages.value[0].toolCalls
    expect(t1).toMatchObject({ status: 'error', error: '上游 500' })
    expect(t2).toMatchObject({ status: 'error', error: '超时' })
  })

  it('updateToolCall 局部改；找不到消息或调用不抛', () => {
    const { eng, m } = seeded()
    const tc = eng.addToolCall(m.id, { name: 'x' })
    eng.updateToolCall(m.id, tc.id, { label: '搜索网页' })
    expect(eng.messages.value[0].toolCalls[0].label).toBe('搜索网页')
    eng.addToolCall('nope', { name: 'x' })
    eng.startToolCall('nope', { name: 'x' })
    eng.updateToolCall(m.id, 'nope', { label: 'x' })
    expect(eng.messages.value[0].toolCalls).toHaveLength(1)
  })

  it('工具调用不影响消息状态机', () => {
    const { eng, m } = seeded()
    const id = eng.startToolCall(m.id, { name: 'x' })
    eng.completeToolCall(m.id, id, 'ok')
    eng.appendContent(m.id, '回答')
    eng.completeMessage(m.id)
    expect(eng.messages.value[0]).toMatchObject({ status: 'done', content: '回答' })
    expect(eng.messages.value[0].toolCalls[0].status).toBe('done')
  })
})

describe('ChatMessage 工具卡分组', () => {
  const calls = [
    { id: 't1', name: 'search', status: 'done', result: 'a' },
    { id: 't2', name: 'calc', status: 'error', error: 'e' },
  ]

  it('多个才出组标题，单个不出', () => {
    const many = mount(ChatMessage, { props: { message: { id: 'a', role: 'assistant', status: 'done', content: 'x', toolCalls: calls } } })
    expect(many.find('.eb-chat-message__tools-heading').text()).toBe(chatLabels.tool.group(2))
    expect(many.findAllComponents(ChatToolCall)).toHaveLength(2)
    const one = mount(ChatMessage, { props: { message: { id: 'a', role: 'assistant', status: 'done', content: 'x', toolCalls: [calls[0]] } } })
    expect(one.find('.eb-chat-message__tools-heading').exists()).toBe(false)
  })

  it('tool-retry 交出 (toolCall, message) 两参', async () => {
    const w = mount(ChatMessage, { props: { message: { id: 'a', role: 'assistant', status: 'done', content: 'x', toolCalls: calls } } })
    const failing = w.findAllComponents(ChatToolCall)[1]
    await failing.find('.eb-chat-tool-call__header').trigger('click')
    await failing.find('.eb-chat-tool-call__retry').trigger('click')
    const evt = w.emitted('tool-retry')
    expect(evt[0][0].id).toBe('t2')
    expect(evt[0][1].id).toBe('a')
  })

  it('工具卡排在正文之前（先执行再作答）', () => {
    const w = mount(ChatMessage, { props: { message: { id: 'a', role: 'assistant', status: 'done', content: '回答', toolCalls: [calls[0]] } } })
    const content = w.find('.eb-chat-message__content')
    expect(content.element.children[0].className).toContain('eb-chat-message__tools')
    expect(content.element.children[1].className).toContain('eb-chat-message__bubble')
  })
})

describe('Chatbot 工具卡转发', () => {
  it('tool-retry 一路到根且保留两参', async () => {
    const w = mount(Chatbot, {
      props: {
        showTip: false,
        modelValue: [{ id: 'a1', role: 'assistant', status: 'done', content: 'x', toolCalls: [{ id: 't2', name: 'calc', status: 'error', error: 'e' }] }],
      },
    })
    await nextTick()
    await w.find('.eb-chat-tool-call__header').trigger('click')
    await w.find('.eb-chat-tool-call__retry').trigger('click')
    const evt = w.emitted('tool-retry')
    expect(evt[0][0].id).toBe('t2')
    expect(evt[0][1].id).toBe('a1')
  })
})
