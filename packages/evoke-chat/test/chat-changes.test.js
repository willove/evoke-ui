import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { effectScope } from 'vue'
import ChatChanges from '../src/components/chatbot/ChatChanges.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import { useChatSession } from '../src/components/chatbot/useChatSession'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 交付/变更汇总卡：收尾时「改了哪些文件 + 增删行数」，超出折叠行数给「全部 N 个文件」
 */

const FILES = [
  { path: 'src/pages/AiWorkbench.vue', added: 88, deleted: 12 },
  { path: 'src/mock.js', added: 6 },
  { path: 'public/logo.png', binary: true },
  { path: 'dist/bundle.js', oversized: true },
  { path: 'src/utils/format.js', added: 3, deleted: 3 },
  { path: 'README.md', added: 2 },
]

describe('EbChatChanges', () => {
  it('标题与总计：多文件给「已编辑 N 个文件」，单文件给文件名', () => {
    const many = mount(ChatChanges, { props: { files: FILES } })
    expect(many.find('.eb-chat-changes__title').text()).toBe(chatLabels.changes.title(6))
    const header = many.find('.eb-chat-changes__header')
    expect(header.text()).toContain('+99')
    expect(header.text()).toContain('-15')

    const one = mount(ChatChanges, { props: { files: [{ path: 'src/a.js', added: 1 }] } })
    expect(one.find('.eb-chat-changes__title').text()).toBe(chatLabels.changes.single('src/a.js'))
    expect(one.find('.eb-chat-changes__header').attributes('disabled')).toBeDefined()
  })

  it('summary 优先（宿主给的总计不被行数覆盖）', () => {
    const w = mount(ChatChanges, {
      props: { files: [{ path: 'a.js', added: 1 }], summary: { total: 9, added: 120, deleted: 40 } },
    })
    expect(w.find('.eb-chat-changes__title').text()).toBe(chatLabels.changes.title(9))
    expect(w.find('.eb-chat-changes__header').text()).toContain('+120')
    expect(w.find('.eb-chat-changes__header').text()).toContain('-40')
  })

  it('折叠：默认露前 4 行，给「全部 N 个文件」，点开后平铺', async () => {
    const w = mount(ChatChanges, { props: { files: FILES } })
    expect(w.findAll('.eb-chat-changes__row')).toHaveLength(4)
    const more = w.find('.eb-chat-changes__more-btn')
    expect(more.text()).toBe(chatLabels.changes.more(2))
    await more.trigger('click')
    expect(w.findAll('.eb-chat-changes__row')).toHaveLength(6)
    expect(w.find('.eb-chat-changes__more').exists()).toBe(false)
  })

  it('二进制/过大不给行数，标记出来；路径点击抛 select', async () => {
    const w = mount(ChatChanges, { props: { files: FILES, defaultOpen: true } })
    const binaryRow = w.findAll('.eb-chat-changes__row')[2]
    expect(binaryRow.find('.eb-chat-changes__flag').text()).toBe(chatLabels.changes.binary)
    expect(binaryRow.find('.eb-chat-changes__added').exists()).toBe(false)
    const oversizedRow = w.findAll('.eb-chat-changes__row')[3]
    expect(oversizedRow.find('.eb-chat-changes__flag').text()).toBe(chatLabels.changes.oversized)

    await w.findAll('.eb-chat-changes__file')[0].trigger('click')
    expect(w.emitted('select')[0][0]).toMatchObject({ path: 'src/pages/AiWorkbench.vue' })
  })

  it('纯增或纯删只显示一边', () => {
    const w = mount(ChatChanges, { props: { files: [{ path: 'a.js', added: 3 }] } })
    expect(w.find('.eb-chat-changes__header').text()).toContain('+3')
    expect(w.find('.eb-chat-changes__header .eb-chat-changes__deleted').exists()).toBe(false)
  })
})

describe('改动汇总接线', () => {
  it('ChatMessage：message.changes 渲染卡片，点行抛 file-select', async () => {
    const w = mount(ChatMessage, {
      props: {
        message: {
          id: 'a1', role: 'assistant', status: 'done', content: '改好了',
          changes: { files: [{ path: 'src/a.js', added: 2, deleted: 1 }], total: 1, added: 2, deleted: 1 },
        },
      },
    })
    const card = w.findComponent(ChatChanges)
    expect(card.exists()).toBe(true)
    await card.findAll('.eb-chat-changes__file')[0].trigger('click')
    const [, path, message] = w.emitted('file-select')[0]
    expect(path).toBe('src/a.js')
    expect(message.id).toBe('a1')

    const none = mount(ChatMessage, { props: { message: { id: 'a2', role: 'assistant', status: 'done', content: 'x' } } })
    expect(none.findComponent(ChatChanges).exists()).toBe(false)
  })

  it('useChatSession：workspace/changes 挂到最后一条助手消息（带 id 则精确挂）', () => {
    const scope = effectScope()
    const session = scope.run(() => useChatSession({ transport: {}, sessionId: 's1' }))
    session.open({
      cursor: 1,
      records: [{ type: 'assistant/message', seq: 1, time: 1, data: { messageId: 'a1', message: { content: '做完了' } } }],
    })
    session.receive({
      type: 'workspace/changes',
      transient: true,
      data: { files: [{ path: 'src/a.js', added: 4 }] },
    })
    expect(session.messages.value[0].changes.files[0].path).toBe('src/a.js')

    // 持久形态：不产生缺口、不降级
    session.receive({ type: 'workspace/changes', seq: 2, time: 2, data: { messageId: 'a1', files: [{ path: 'b.js', added: 1 }] } })
    session.receive({ type: 'turn/start', seq: 3, time: 3, data: {} })
    expect(session.log.cursor).toBe(3)
    expect(session.state.value.degraded).toBe(false)
    expect(session.messages.value[0].changes.files[0].path).toBe('b.js')
    scope.stop()
  })

  it('引擎 setChanges 与消息字段一致', () => {
    const engine = useChatEngine()
    const id = engine.createAssistantMessage().id
    engine.setChanges(id, { files: [{ path: 'x.js', added: 1 }] })
    expect(engine.messages.value[0].changes.files).toHaveLength(1)
    engine.setChanges(id, null)
    expect(engine.messages.value[0].changes).toBeNull()
  })
})