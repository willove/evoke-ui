import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { effectScope } from 'vue'
import ChatQuestion from '../src/components/chatbot/ChatQuestion.vue'
import ChatApproval from '../src/components/chatbot/ChatApproval.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import ChatSender from '../src/components/chatbot/ChatSender.vue'
import EbAiConsole from '../src/components/ai-console/index.vue'
import { useChatSession } from '../src/components/chatbot/useChatSession'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 提问接管：agent 需要澄清时，输入台让位给提问面板
 * 语义对齐 DSH：逐题作答 / 可跳过 / 可取消，键位 Enter 前进、Esc 取消
 */

const REQ = {
  id: 'q-1',
  items: [
    {
      id: 'i1',
      question: '按哪个口径对比？',
      options: [
        { key: 'mom', label: '环比', recommended: true },
        { key: 'yoy', label: '同比', description: '与去年同期比' },
      ],
    },
    {
      id: 'i2',
      question: '覆盖哪些渠道？',
      multiSelect: true,
      options: [{ key: 'feed', label: '信息流' }, { key: 'organic', label: '自然量' }],
    },
  ],
}

describe('EbChatQuestion', () => {
  it('渲染题号/进度/选项（推荐角标与说明）', () => {
    const w = mount(ChatQuestion, { props: { request: REQ } })
    expect(w.find('.eb-chat-question__badge').text()).toBe(chatLabels.question.badge(1, 2))
    expect(w.find('.eb-chat-question__count').text()).toBe(chatLabels.question.answered(0, 2))
    expect(w.find('.eb-chat-question__text').text()).toBe('按哪个口径对比？')
    const options = w.findAll('.eb-chat-question__option')
    expect(options).toHaveLength(2)
    expect(options[0].find('.eb-chat-question__recommended').text()).toBe(chatLabels.question.recommended)
    expect(options[1].find('.eb-chat-question__option-desc').text()).toBe('与去年同期比')
    expect(w.find('.eb-chat-question__options').attributes('aria-multiselectable')).toBeUndefined()
  })

  it('单选互斥、多选累加；没作答时不能前进', async () => {
    const w = mount(ChatQuestion, { props: { request: REQ } })
    const submit = w.find('.eb-chat-question__btn.is-primary')
    expect(submit.attributes('disabled')).toBeDefined()

    await w.findAll('.eb-chat-question__option')[0].trigger('click')
    expect(w.findAll('.eb-chat-question__option')[0].attributes('aria-selected')).toBe('true')
    await w.findAll('.eb-chat-question__option')[1].trigger('click')
    expect(w.findAll('.eb-chat-question__option')[0].attributes('aria-selected')).toBe('false')
    expect(w.findAll('.eb-chat-question__option')[1].attributes('aria-selected')).toBe('true')

    // 前进到第二题（多选）
    await w.find('.eb-chat-question__btn.is-primary').trigger('click')
    expect(w.find('.eb-chat-question__text').text()).toBe('覆盖哪些渠道？')
    expect(w.find('.eb-chat-question__options').attributes('aria-multiselectable')).toBe('true')
    expect(w.find('.eb-chat-question__count').text()).toBe(chatLabels.question.answered(1, 2))
    await w.findAll('.eb-chat-question__option')[0].trigger('click')
    await w.findAll('.eb-chat-question__option')[1].trigger('click')
    expect(w.findAll('.eb-chat-question__option').every((o) => o.attributes('aria-selected') === 'true')).toBe(true)
  })

  it('Enter 逐题前进并在最后一题提交；Esc 取消', async () => {
    const w = mount(ChatQuestion, { props: { request: REQ } })
    await w.findAll('.eb-chat-question__option')[0].trigger('click')
    await w.trigger('keydown', { key: 'Enter' })
    expect(w.find('.eb-chat-question__text').text()).toBe('覆盖哪些渠道？')
    await w.findAll('.eb-chat-question__option')[0].trigger('click')
    await w.trigger('keydown', { key: 'Enter' })
    const [answer, request] = w.emitted('respond')[0]
    expect(request).toEqual(REQ)
    expect(answer.status).toBe('answered')
    expect(answer.answers).toEqual([
      { id: 'i1', question: '按哪个口径对比？', selected: ['mom'], custom: '', skipped: false },
      { id: 'i2', question: '覆盖哪些渠道？', selected: ['feed'], custom: '', skipped: false },
    ])
    // 提交后按钮全禁用、不再重复回传
    expect(w.findAll('.eb-chat-question__option').every((o) => o.attributes('disabled') !== undefined)).toBe(true)
    await w.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('respond')).toHaveLength(1)

    const cancelled = mount(ChatQuestion, { props: { request: REQ } })
    await cancelled.trigger('keydown', { key: 'Escape' })
    expect(cancelled.emitted('respond')[0][0]).toEqual({ status: 'cancelled', answers: [] })
    expect(cancelled.find('.eb-chat-question__announce').text()).toBe(chatLabels.question.cancelled)
  })

  it('自定义答案与跳过都算作答；文本进 payload', async () => {
    const w = mount(ChatQuestion, { props: { request: REQ } })
    await w.find('.eb-chat-question__custom').setValue('按季度看')
    await w.find('.eb-chat-question__btn.is-primary').trigger('click') // 前进（自定义已提交）
    expect(w.find('.eb-chat-question__count').text()).toBe(chatLabels.question.answered(1, 2))
    await w.findAll('.eb-chat-question__btn').find((b) => b.text() === chatLabels.question.skip).trigger('click')
    const [answer] = w.emitted('respond')[0]
    expect(answer.status).toBe('answered')
    expect(answer.answers[0]).toMatchObject({ id: 'i1', custom: '按季度看' })
    expect(answer.answers[1]).toMatchObject({ id: 'i2', skipped: true, selected: [] })
  })

  it('受控 answered 优先；组字中与带修饰键的 Enter 不提交', async () => {
    const controlled = mount(ChatQuestion, { props: { request: { ...REQ, status: 'answered' } } })
    expect(controlled.findAll('.eb-chat-question__option').every((o) => o.attributes('disabled') !== undefined)).toBe(true)

    const w = mount(ChatQuestion, { props: { request: REQ } })
    await w.findAll('.eb-chat-question__option')[0].trigger('click')
    await w.trigger('keydown', { key: 'Enter', isComposing: true })
    await w.trigger('keydown', { key: 'Enter', ctrlKey: true })
    expect(w.emitted('respond')).toBeUndefined()
  })
})

describe('输入区接管：审批优先于提问', () => {
  const APPROVAL = { id: 'ap-1', toolName: 'run_tests', reason: '要跑测试' }

  it('EbChatbot：只有 question 时上提问面板；两个都有时审批优先', async () => {
    const onlyQuestion = mount(Chatbot, { props: { modelValue: [], question: REQ } })
    expect(onlyQuestion.findComponent(ChatQuestion).exists()).toBe(true)
    expect(onlyQuestion.findComponent(ChatSender).exists()).toBe(false)
    await onlyQuestion.findComponent(ChatQuestion).trigger('keydown', { key: 'Escape' })
    expect(onlyQuestion.emitted('question-respond')[0][0]).toEqual({ status: 'cancelled', answers: [] })

    const both = mount(Chatbot, { props: { modelValue: [], question: REQ, approval: APPROVAL } })
    expect(both.findComponent(ChatApproval).exists()).toBe(true)
    expect(both.findComponent(ChatQuestion).exists()).toBe(false)

    const none = mount(Chatbot, { props: { modelValue: [] } })
    expect(none.findComponent(ChatSender).exists()).toBe(true)
  })

  it('EbAiConsole：同一套优先级与转发', async () => {
    const w = mount(EbAiConsole, { props: { question: REQ, showTip: false } })
    expect(w.find('.eb-ai-prompt-box').exists()).toBe(false)
    await w.findComponent(ChatQuestion).trigger('keydown', { key: 'Escape' })
    expect(w.emitted('question-respond')[0][0]).toEqual({ status: 'cancelled', answers: [] })
  })
})

describe('useChatSession：提问流', () => {
  function boot(overrides = {}) {
    const transport = {
      send: vi.fn(async () => {}),
      cancel: vi.fn(async () => {}),
      page: vi.fn(async () => []),
      open: vi.fn(() => () => {}),
      approve: vi.fn(async () => {}),
      answerQuestion: vi.fn(async () => {}),
      ...overrides,
    }
    const scope = effectScope()
    const session = scope.run(() => useChatSession({ transport, sessionId: 's1' }))
    return { session, transport, scope }
  }

  it('question/request 进待回答；respondQuestion 回传并收起', async () => {
    const { session, transport, scope } = boot()
    session.open({ cursor: 0, records: [] })
    session.receive({ type: 'question/request', transient: true, data: { id: 'q-1', items: REQ.items } })
    expect(session.question.value).toMatchObject({ id: 'q-1', status: 'pending' })
    expect(session.question.value.items).toHaveLength(2)

    await session.respondQuestion({ status: 'answered', answers: [{ id: 'i1', selected: ['mom'] }] })
    expect(transport.answerQuestion).toHaveBeenCalledWith({
      id: 'q-1', status: 'answered', answers: [{ id: 'i1', selected: ['mom'] }], sessionId: 's1',
    })
    expect(await session.respondQuestion({ status: 'cancelled' })).toBe(false)

    session.receive({ type: 'question/decided', transient: true, data: { id: 'q-1' } })
    expect(session.question.value).toBeNull()
    scope.stop()
  })

  it('持久形态的提问事件不破坏连续性、也不降级', () => {
    const { session, scope } = boot()
    session.open({ cursor: 0, records: [] })
    session.receive({ type: 'question/request', seq: 1, time: 1, data: { id: 'q-2', items: [] } })
    session.receive({ type: 'turn/start', seq: 2, time: 2, data: {} })
    expect(session.log.cursor).toBe(2)
    expect(session.state.value.degraded).toBe(false)
    expect(session.question.value.id).toBe('q-2')
    scope.stop()
  })
})