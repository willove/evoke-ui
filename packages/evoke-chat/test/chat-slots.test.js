import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import ChatList from '../src/components/chatbot/ChatList.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'

/**
 * 消息级 scoped 插槽：ChatList#message / ChatList#message-content / ChatMessage#content
 * 关键是「不传即与今天逐字节一致」，所以默认态要有回归钉。
 */

const MSGS = [
  { id: 'u1', role: 'user', content: '提问', status: 'done' },
  { id: 'a1', role: 'assistant', content: '回答一', status: 'done' },
  { id: 'a2', role: 'assistant', content: '回答二', status: 'done' },
]

const mountList = (props = {}, slots = {}) =>
  mount(ChatList, { props: { messages: MSGS, ...props }, slots, attachTo: document.body })

describe('ChatList 默认渲染（非破坏钉）', () => {
  it('不传插槽时仍逐条渲染 ChatMessage', () => {
    const w = mountList()
    expect(w.findAllComponents(ChatMessage)).toHaveLength(3)
    expect(w.findAll('.eb-chat-message__bubble').map((n) => n.text())).toEqual(['提问', '回答一', '回答二'])
    w.unmount()
  })

  it('插槽产出为空时回落默认渲染（Vue renderSlot 语义，实测钉住）', () => {
    // 空字符串 / 空数组 / 仅注释 / v-if 为假，四种空产出 Vue 都会退回 fallback，
    // 于是模板写错的宿主得到的是默认消息列表而不是整屏空白。
    // 推论：宿主不能靠「某些行留空」来挑选接管范围，必须用 itemProps 显式回落
    for (const empty of ['', '<!-- x -->', () => []]) {
      const w = mountList({}, { message: empty })
      expect(w.findAllComponents(ChatMessage)).toHaveLength(3)
      w.unmount()
    }
    const hidden = mountList({}, { message: '<div v-if="false">no</div>' })
    expect(hidden.findAllComponents(ChatMessage)).toHaveLength(3)
    hidden.unmount()
  })
})

describe('ChatList #message 整条接管', () => {
  it('接管后默认 ChatMessage 不再渲染', () => {
    const w = mountList({}, { message: '<div class="probe-row">R</div>' })
    expect(w.findAllComponents(ChatMessage)).toHaveLength(0)
    expect(w.findAll('.probe-row')).toHaveLength(3)
    w.unmount()
  })

  it('slot props 交出 message / index / isLast / itemProps', () => {
    const seen = []
    const w = mountList({}, {
      message: (p) => {
        seen.push({
          id: p.message.id,
          index: p.index,
          isLast: p.isLast,
          itemPropsKeys: Object.keys(p.itemProps).sort().join(','),
        })
        return h('div', { class: 'probe-row' })
      },
    })
    expect(seen.map((x) => [x.id, x.index, x.isLast])).toEqual([
      ['u1', 0, false],
      ['a1', 1, false],
      ['a2', 2, true],
    ])
    // itemProps 要含 ChatMessage 需要的全部入参，宿主才不必自己重接
    for (const key of ['message', 'renderMode', 'actions', 'avatarAssistant', 'userName', 'editable', 'feedback', 'toolRetryable']) {
      expect(seen[0].itemPropsKeys).toContain(key)
    }
    w.unmount()
  })

  it('用 itemProps 回落默认 ChatMessage（只接管某几类的逃生口）', () => {
    const w = mount(
      {
        components: { ChatList, ChatMessage },
        props: { rows: { type: Array, default: () => MSGS } },
        template: `
          <chat-list :messages="rows">
            <template #message="p">
              <div v-if="p.message.role === 'user'" class="custom-user">{{ p.message.content }}</div>
              <chat-message v-else v-bind="p.itemProps" />
            </template>
          </chat-list>
        `,
      },
      { attachTo: document.body },
    )
    expect(w.find('.custom-user').text()).toBe('提问')
    // 其余两条走默认 ChatMessage，外壳与气泡都在
    expect(w.findAllComponents(ChatMessage)).toHaveLength(2)
    expect(w.findAll('.eb-chat-message__bubble').map((n) => n.text())).toEqual(['回答一', '回答二'])
    w.unmount()
  })
})

describe('ChatList #message-content 只换正文', () => {
  it('保留消息外壳，仅替换气泡内正文', () => {
    const w = mountList(
      { feedback: true, actions: [{ key: 'x', label: '自定义动作' }] },
      { 'message-content': (p) => h('div', { class: 'probe-body' }, `B:${p.message.id}`) },
    )
    expect(w.findAllComponents(ChatMessage)).toHaveLength(3)
    expect(w.findAll('.probe-body')).toHaveLength(3)
    expect(w.findAll('.probe-body')[1].text()).toBe('B:a1')
    // 外壳件件都在：头像、动作条、反馈
    expect(w.findAll('.eb-chat-message__avatar')).toHaveLength(3)
    expect(w.findAll('.eb-chat-actionbar')).toHaveLength(3)
    expect(w.findAll('.eb-chat-feedback')).toHaveLength(2)
    // 默认正文不再出现
    expect(w.text()).not.toContain('回答一')
    w.unmount()
  })

  it('slot props 交出 content / renderMode / streaming', () => {
    const seen = []
    const w = mountList(
      { messages: [{ id: 's1', role: 'assistant', content: '流式中', status: 'streaming' }] },
      {
        'message-content': (p) => {
          seen.push({ content: p.content, renderMode: p.renderMode, streaming: p.streaming })
          return h('div')
        },
      },
    )
    expect(seen[0]).toEqual({ content: '流式中', renderMode: 'markdown', streaming: true })
    w.unmount()
  })

  it('与 #message 同时给时以整条接管为准', () => {
    const w = mountList({}, {
      message: () => h('div', { class: 'row-takes-precedence' }),
      'message-content': () => h('div', { class: 'body-ignored' }),
    })
    expect(w.find('.row-takes-precedence').exists()).toBe(true)
    expect(w.find('.body-ignored').exists()).toBe(false)
    w.unmount()
  })
})

describe('ChatMessage #content', () => {
  const rich = {
    id: 'a9',
    role: 'assistant',
    status: 'done',
    content: '正文',
    thinkContent: '思考',
    citations: [{ id: 'c1', title: '来源甲' }],
    suggestions: ['追问甲'],
  }

  it('只换正文，附件外的思考块 / 来源卡 / 追问 / 动作条都还在', () => {
    const w = mount(ChatMessage, {
      props: { message: rich },
      slots: { content: '<div class="mine">自定义正文</div>' },
    })
    expect(w.find('.mine').text()).toBe('自定义正文')
    expect(w.find('.eb-chat-message__bubble .eb-chat-markdown').exists()).toBe(false)
    expect(w.find('.eb-chat-thinking').exists()).toBe(true)
    expect(w.findAll('.eb-chat-sources__item')).toHaveLength(1)
    expect(w.find('.eb-chat-suggestion__chip').text()).toBe('追问甲')
    expect(w.find('.eb-chat-actionbar').exists()).toBe(true)
  })

  it('不传 #content 时默认走 markdown', () => {
    const w = mount(ChatMessage, { props: { message: rich } })
    expect(w.find('.eb-chat-message__bubble .eb-chat-markdown').text()).toBe('正文')
  })

  it('接管态下 citation-click 由宿主自己负责（默认 markdown 不渲染，不报错）', () => {
    const w = mount(ChatMessage, {
      props: { message: rich },
      slots: { content: '<div class="mine">无引用</div>' },
    })
    expect(w.emitted('citation-click')).toBeUndefined()
  })
})

describe('Chatbot 插槽转发', () => {
  const mountBot = (slots = {}) =>
    mount(Chatbot, { props: { modelValue: MSGS, showTip: false }, slots, attachTo: document.body })

  it('不传时默认渲染不变', () => {
    const w = mountBot()
    expect(w.findAllComponents(ChatMessage)).toHaveLength(3)
    expect(w.findAll('.eb-chat-message__bubble')).toHaveLength(3)
    w.unmount()
  })

  it('#message 转发到 ChatList', () => {
    const w = mountBot({ message: '<div class="fwd-row">X</div>' })
    expect(w.findAllComponents(ChatMessage)).toHaveLength(0)
    expect(w.findAll('.fwd-row')).toHaveLength(3)
    w.unmount()
  })

  it('#message-content 转发并保留外壳', () => {
    const w = mountBot({ 'message-content': '<div class="fwd-body">Y</div>' })
    expect(w.findAllComponents(ChatMessage)).toHaveLength(3)
    expect(w.findAll('.fwd-body')).toHaveLength(3)
    expect(w.findAll('.eb-chat-message__avatar')).toHaveLength(3)
    w.unmount()
  })
})
