import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatSuggestion from '../src/components/chatbot/ChatSuggestion.vue'
import ChatFeedback from '../src/components/chatbot/ChatFeedback.vue'
import ChatMessageEdit from '../src/components/chatbot/ChatMessageEdit.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 A 三组件：追问 chips / 点赞点踩 / 用户消息编辑重发
 * 外加引擎 editAndResend·setFeedback 与消息体到根的转发链
 */

const doneAssistant = { id: 'a1', role: 'assistant', content: '回答', status: 'done' }
const doneUser = { id: 'u1', role: 'user', content: '原始提问', status: 'done' }

describe('ChatSuggestion', () => {
  it('string 与对象两种形态；pick 交出 { text, prompt }', async () => {
    const w = mount(ChatSuggestion, { props: { items: ['继续讲讲', { text: '换个说法', prompt: '请换个说法' }] } })
    const chips = w.findAll('.eb-chat-suggestion__chip')
    expect(chips).toHaveLength(2)
    expect(chips[0].text()).toBe('继续讲讲')
    await chips[1].trigger('click')
    expect(w.emitted('pick')[0][0]).toEqual({ text: '换个说法', prompt: '请换个说法' })
  })

  it('空列表不渲染容器；layout 与 icon 生效', () => {
    const empty = mount(ChatSuggestion, { props: { items: [] } })
    expect(empty.find('.eb-chat-suggestion').exists()).toBe(false)
    const w = mount(ChatSuggestion, { props: { items: ['a'], layout: 'column', icon: 'question-answer' } })
    expect(w.find('.eb-chat-suggestion--column').exists()).toBe(true)
    expect(w.find('.eb-chat-suggestion__chip svg').exists()).toBe(true)
  })

  it('disabled 既不 emit 也可聚焦置灰', async () => {
    const w = mount(ChatSuggestion, { props: { items: ['a'], disabled: true } })
    await w.find('.eb-chat-suggestion__chip').trigger('click')
    expect(w.emitted('pick')).toBeUndefined()
    expect(w.find('.eb-chat-suggestion__chip').attributes('disabled')).toBeDefined()
  })
})

describe('ChatFeedback', () => {
  it('点赞：立即 submit 且无需理由，显示致谢', async () => {
    const w = mount(ChatFeedback)
    const up = w.findAll('.eb-chat-feedback__btn')[0]
    await up.trigger('click')
    expect(w.emitted('submit')[0][0]).toEqual({ value: 'up', reasons: [], note: '' })
    expect(up.attributes('aria-pressed')).toBe('true')
    expect(w.find('.eb-chat-feedback__thanks').exists()).toBe(true)
    expect(w.find('.eb-chat-feedback__panel').exists()).toBe(false)
  })

  it('点踩：开面板；理由多选与备注进 payload', async () => {
    const w = mount(ChatFeedback, { props: { reasons: ['不准', '太啰嗦'] } })
    await w.findAll('.eb-chat-feedback__btn')[1].trigger('click')
    const panel = w.find('.eb-chat-feedback__panel')
    expect(panel.exists()).toBe(true)
    const chips = w.findAll('.eb-chat-feedback__reason')
    await chips[0].trigger('click')
    await chips[1].trigger('click')
    await chips[1].trigger('click') // 取消第二个
    await w.find('.eb-chat-feedback__note').setValue('  数据对不上  ')
    await w.find('.eb-chat-feedback__act--primary').trigger('click')
    expect(w.emitted('submit').at(-1)[0]).toEqual({ value: 'down', reasons: ['不准'], note: '数据对不上' })
    expect(w.find('.eb-chat-feedback__panel').exists()).toBe(false)
  })

  it('不传 reasons 用内置六项', () => {
    const w = mount(ChatFeedback, { props: { value: 'down' } })
    expect(w.findAll('.eb-chat-feedback__reason')).toHaveLength(chatLabels.feedback.reasons.length)
  })

  it('再点一次取消评价，并把 null 交给宿主（否则存的 feedback 清不掉）', async () => {
    const w = mount(ChatFeedback)
    const up = w.findAll('.eb-chat-feedback__btn')[0]
    await up.trigger('click')
    await up.trigger('click')
    expect(w.emitted('submit').at(-1)[0]).toEqual({ value: null, reasons: [], note: '' })
    expect(up.attributes('aria-pressed')).toBe('false')
  })

  it('面板取消：收起并交出 null', async () => {
    const w = mount(ChatFeedback, { props: { value: 'down' } })
    await w.find('.eb-chat-feedback__reason').trigger('click')
    const acts = w.findAll('.eb-chat-feedback__act')
    await acts[0].trigger('click')
    expect(w.emitted('submit').at(-1)[0].value).toBeNull()
    expect(w.find('.eb-chat-feedback__panel').exists()).toBe(false)
  })

  it('disabled 拦点击', async () => {
    const w = mount(ChatFeedback, { props: { disabled: true } })
    await w.findAll('.eb-chat-feedback__btn')[0].trigger('click')
    expect(w.emitted('submit')).toBeUndefined()
  })
})

describe('ChatMessageEdit', () => {
  it('预填原文；保存交出 trim 后文本', async () => {
    const w = mount(ChatMessageEdit, { props: { modelValue: '  改写后的提问  ' } })
    expect(w.find('.eb-chat-message-edit__textarea').element.value).toBe('  改写后的提问  ')
    await w.find('.eb-chat-message-edit__act--primary').trigger('click')
    expect(w.emitted('save')[0][0]).toBe('改写后的提问')
  })

  it('清空后保存钮置灰；Esc 取消；Enter 保存', async () => {
    const w = mount(ChatMessageEdit, { props: { modelValue: 'x' } })
    await w.find('textarea').setValue('   ')
    expect(w.find('.eb-chat-message-edit__act--primary').attributes('disabled')).toBeDefined()
    await w.find('textarea').setValue('y')
    await w.find('textarea').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('save')[0][0]).toBe('y')
    await w.find('textarea').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('cancel')).toHaveLength(1)
  })

  it('IME 组字中的 Enter 不保存；maxLength 生效', async () => {
    const w = mount(ChatMessageEdit, { props: { modelValue: 'y', maxLength: 20 } })
    expect(w.find('textarea').attributes('maxlength')).toBe('20')
    await w.find('textarea').trigger('keydown', { key: 'Enter', isComposing: true })
    expect(w.emitted('save')).toBeUndefined()
  })
})

describe('ChatMessage 批 A 集成', () => {
  it('editable 只在用户消息给编辑钮；点开后原地换输入框', async () => {
    const w = mount(ChatMessage, { props: { message: doneUser, editable: true } })
    const editBtn = w.findAll('.eb-chat-actionbar__btn').find((b) => b.attributes('aria-label') === chatLabels.actionbar.edit)
    expect(editBtn).toBeTruthy()
    await editBtn.trigger('click')
    expect(w.find('.eb-chat-message-edit').exists()).toBe(true)
    expect(w.find('.eb-chat-message__bubble').exists()).toBe(false)
    await w.find('.eb-chat-message-edit__act--primary').trigger('click')
    const evt = w.emitted('edit')
    expect(evt[0][0].id).toBe('u1')
    expect(evt[0][1]).toBe('原始提问')
    expect(w.find('.eb-chat-message-edit').exists()).toBe(false)
  })

  it('未开 editable 时用户消息没有编辑钮', () => {
    const w = mount(ChatMessage, { props: { message: doneUser } })
    expect(w.findAll('.eb-chat-actionbar__btn').some((b) => b.attributes('aria-label') === chatLabels.actionbar.edit)).toBe(false)
  })

  it('edited 标记渲染', () => {
    const w = mount(ChatMessage, { props: { message: { ...doneUser, edited: true } } })
    expect(w.find('.eb-chat-message__edited').text()).toBe(chatLabels.message.edited)
  })

  it('feedback 只在助手完成态渲染', () => {
    const off = mount(ChatMessage, { props: { message: doneAssistant } })
    expect(off.find('.eb-chat-feedback').exists()).toBe(false)
    const on = mount(ChatMessage, { props: { message: doneAssistant, feedback: true } })
    expect(on.find('.eb-chat-feedback').exists()).toBe(true)
    const user = mount(ChatMessage, { props: { message: doneUser, feedback: true } })
    expect(user.find('.eb-chat-feedback').exists()).toBe(false)
    const streaming = mount(ChatMessage, { props: { message: { ...doneAssistant, status: 'streaming' }, feedback: true } })
    expect(streaming.find('.eb-chat-feedback').exists()).toBe(false)
  })

  it('feedback 事件带 (message, payload) 两参', async () => {
    const w = mount(ChatMessage, { props: { message: doneAssistant, feedback: true } })
    await w.findAll('.eb-chat-feedback__btn')[0].trigger('click')
    const evt = w.emitted('feedback')
    expect(evt[0][0].id).toBe('a1')
    expect(evt[0][1]).toEqual({ value: 'up', reasons: [], note: '' })
  })

  it('suggestions 渲染并交出 (text, suggestion, message) 三参', async () => {
    const w = mount(ChatMessage, { props: { message: { ...doneAssistant, suggestions: ['再讲讲'] } } })
    await w.find('.eb-chat-suggestion__chip').trigger('click')
    const evt = w.emitted('suggestion-click')
    expect(evt[0][0]).toBe('再讲讲')
    expect(evt[0][1]).toEqual({ text: '再讲讲', prompt: '再讲讲' })
    expect(evt[0][2].id).toBe('a1')
  })
})

describe('Chatbot 转发链', () => {
  it('edit / feedback / suggestion-click 一路到根', async () => {
    const w = mount(Chatbot, {
      props: {
        modelValue: [
          { ...doneUser, suggestions: undefined },
          { ...doneAssistant, suggestions: ['继续'] },
        ],
        editable: true,
        feedback: true,
        showTip: false,
      },
    })
    await w.find('.eb-chat-suggestion__chip').trigger('click')
    expect(w.emitted('suggestion-click')[0][0]).toBe('继续')

    const userMsg = w.findAllComponents({ name: 'ChatMessage' }).find((m) => m.props('message')?.role === 'user')
    const editBtn = userMsg.findAll('.eb-chat-actionbar__btn').find((b) => b.attributes('aria-label') === chatLabels.actionbar.edit)
    await editBtn.trigger('click')
    await userMsg.find('.eb-chat-message-edit__act--primary').trigger('click')
    expect(w.emitted('edit')[0][0].id).toBe('u1')
    expect(w.emitted('edit')[0][1]).toBe('原始提问')

    const assistant = w.findAllComponents({ name: 'ChatMessage' }).find((m) => m.props('message')?.role === 'assistant')
    // 点踩只开面板，submit 要等面板提交
    await assistant.findAll('.eb-chat-feedback__btn')[1].trigger('click')
    expect(w.emitted('feedback')).toBeUndefined()
    await assistant.find('.eb-chat-feedback__act--primary').trigger('click')
    const fb = w.emitted('feedback')
    expect(fb[0][0].id).toBe('a1')
    expect(fb[0][1].value).toBe('down')
  })
})

describe('useChatEngine 批 A 扩展', () => {
  it('editAndResend：截断其后消息、标 edited、不重复追加提问', async () => {
    const onSend = vi.fn(async () => {})
    const eng = useChatEngine({ onSend })
    eng.addUserMessage('原提问', [])
    const a = eng.createAssistantMessage()
    eng.appendContent(a.id, '旧回答')
    eng.completeMessage(a.id)
    expect(eng.messages.value).toHaveLength(2)

    await eng.editAndResend(eng.messages.value[0].id, '  改写后的提问  ')
    expect(onSend).toHaveBeenCalledTimes(1)
    expect(onSend.mock.calls[0][0]).toBe('改写后的提问')
    const list = eng.messages.value
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ role: 'user', content: '改写后的提问', edited: true, status: 'done' })
  })

  it('editAndResend：loading 中、空文本、找不到 id 均忽略', async () => {
    const onSend = vi.fn(async () => {})
    const eng = useChatEngine({ onSend })
    const u = eng.addUserMessage('q', [])
    await eng.editAndResend(u.id, '   ')
    await eng.editAndResend('nope', 'x')
    expect(onSend).not.toHaveBeenCalled()
    eng.loading.value = true
    await eng.editAndResend(u.id, 'x')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('setFeedback 写入 feedback / reasons / note', () => {
    const eng = useChatEngine({})
    const a = eng.createAssistantMessage()
    eng.completeMessage(a.id)
    eng.setFeedback(a.id, 'down', { reasons: ['不准'], note: '数据对不上' })
    expect(eng.messages.value[0]).toMatchObject({ feedback: 'down', feedbackReasons: ['不准'], feedbackNote: '数据对不上' })
    eng.setFeedback(a.id, null)
    expect(eng.messages.value[0]).toMatchObject({ feedback: null, feedbackReasons: [], feedbackNote: '' })
  })

  it('editAndResend 里 onSend 抛错标 error', async () => {
    const eng = useChatEngine({
      onSend: async () => {
        const m = eng.createAssistantMessage()
        throw new Error('上游炸了')
      },
    })
    const u = eng.addUserMessage('q', [])
    await eng.editAndResend(u.id, '改一下')
    const last = eng.messages.value.at(-1)
    expect(last.role).toBe('assistant')
    expect(last.status).toBe('error')
    expect(eng.loading.value).toBe(false)
  })
})
