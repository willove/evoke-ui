import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatUsage from '../src/components/chatbot/ChatUsage.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 L：token 与成本计量
 *
 * 组件只展示宿主给的 usage——成本要价目表，那是宿主的业务数据，引擎与组件都不猜。
 */

const usage = (extra = {}) => ({ promptTokens: 120, completionTokens: 380, totalTokens: 500, ...extra })

describe('ChatUsage 格式化', () => {
  it('小于一千原样，一千 / 一百万以上折算', () => {
    const w = mount(ChatUsage, { props: { usage: usage({ totalTokens: 999 }) } })
    expect(w.find('.eb-chat-usage__tokens').text()).toBe(chatLabels.usage.tokens('999'))
    w.unmount()
    const k = mount(ChatUsage, { props: { usage: usage({ totalTokens: 12400 }) } })
    expect(k.find('.eb-chat-usage__tokens').text()).toContain('12.4k')
    k.unmount()
    const m = mount(ChatUsage, { props: { usage: usage({ totalTokens: 2300000 }) } })
    expect(m.find('.eb-chat-usage__tokens').text()).toContain('2.3M')
    m.unmount()
  })

  it('total 缺失时用输入+输出补', () => {
    const w = mount(ChatUsage, { props: { usage: { promptTokens: 100, completionTokens: 50 } } })
    expect(w.find('.eb-chat-usage__tokens').text()).toContain('150')
  })

  it('成本小额保留四位、常规两位，币种前缀跟随数据', () => {
    const small = mount(ChatUsage, { props: { usage: usage({ cost: 0.0032, currency: '$' }) } })
    expect(small.find('.eb-chat-usage__cost').text()).toBe('$0.0032')
    small.unmount()
    const big = mount(ChatUsage, { props: { usage: usage({ cost: 1.239, currency: '¥' }) } })
    expect(big.find('.eb-chat-usage__cost').text()).toBe('¥1.24')
    big.unmount()
  })

  it('没给成本就不显示成本位', () => {
    const w = mount(ChatUsage, { props: { usage: usage() } })
    expect(w.find('.eb-chat-usage__cost').exists()).toBe(false)
  })

  it('输入/输出明细以读屏文本与悬浮提示给出，视觉上不占位', () => {
    const w = mount(ChatUsage, { props: { usage: usage() } })
    const detail = w.find('.eb-chat-usage__detail')
    expect(detail.attributes('role')).toBe('status')
    expect(detail.text()).toContain('输入 120')
    expect(detail.text()).toContain('输出 380')
    expect(w.attributes('title')).toBe(detail.text())
  })

  it('没有任何用量数据时整个不渲染', () => {
    expect(mount(ChatUsage, { props: { usage: {} } }).find('.eb-chat-usage').exists()).toBe(false)
    expect(mount(ChatUsage, { props: { usage: null } }).find('.eb-chat-usage').exists()).toBe(false)
  })
})

describe('ChatUsage 汇总', () => {
  const ITEMS = [
    { promptTokens: 100, completionTokens: 200, totalTokens: 300, cost: 0.001, currency: '$' },
    { promptTokens: 50, completionTokens: 50, totalTokens: 100, cost: 0.002, currency: '$' },
  ]

  it('多条累加，token 与成本都汇总', () => {
    const w = mount(ChatUsage, { props: { items: ITEMS } })
    expect(w.find('.eb-chat-usage__tokens').text()).toContain('400')
    expect(w.find('.eb-chat-usage__cost').text()).toBe('$0.0030')
    expect(w.find('.eb-chat-usage__detail').text()).toContain('近 2 条合计')
  })

  it('部分条目没有成本时，有成本才汇总', () => {
    const w = mount(ChatUsage, { props: { items: [{ promptTokens: 10 }, { totalTokens: 5 }] } })
    expect(w.find('.eb-chat-usage__cost').exists()).toBe(false)
    expect(w.find('.eb-chat-usage__tokens').text()).toContain('15')
  })

  it('混币种取第一个出现的，不做汇率换算', () => {
    const w = mount(ChatUsage, { props: { items: [{ cost: 1, currency: '$' }, { cost: 1, currency: '¥' }] } })
    expect(w.find('.eb-chat-usage__cost').text()).toBe('$2.00')
  })

  it('空数组与含空项都不炸', () => {
    expect(mount(ChatUsage, { props: { items: [] } }).find('.eb-chat-usage').exists()).toBe(false)
    const w = mount(ChatUsage, { props: { items: [null, { totalTokens: 7 }] } })
    expect(w.find('.eb-chat-usage__tokens').text()).toContain('7')
  })
})

describe('ChatUsage 尺寸与外观', () => {
  it('compact 与 default 两档；bare 决定要不要底色', () => {
    const compact = mount(ChatUsage, { props: { usage: usage() } })
    expect(compact.classes()).toContain('eb-chat-usage--compact')
    expect(compact.classes()).toContain('is-bare')
    compact.unmount()
    const rich = mount(ChatUsage, { props: { usage: usage(), size: 'default', bare: false } })
    expect(rich.classes()).toContain('eb-chat-usage--default')
    expect(rich.classes()).not.toContain('is-bare')
  })
})

describe('引擎与消息接线', () => {
  it('setUsage 写进消息；空值可清回', () => {
    const eng = useChatEngine({})
    const m = eng.createAssistantMessage()
    eng.completeMessage(m.id)
    eng.setUsage(m.id, usage())
    expect(eng.messages.value[0].usage.totalTokens).toBe(500)
    eng.setUsage(m.id, null)
    expect(eng.messages.value[0].usage).toBeNull()
  })

  it('消息带 usage 时元信息行显示，不带就不显示（回归钉）', () => {
    const withUsage = mount(ChatMessage, {
      props: { message: { id: 'a1', role: 'assistant', content: 'x', status: 'done', usage: usage({ cost: 0.5, currency: '$' }) } },
    })
    expect(withUsage.find('.eb-chat-usage').exists()).toBe(true)
    expect(withUsage.text()).toContain('500')
    withUsage.unmount()

    const without = mount(ChatMessage, {
      props: { message: { id: 'a2', role: 'assistant', content: 'x', status: 'done' } },
    })
    expect(without.find('.eb-chat-usage').exists()).toBe(false)
  })
})
