import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import ChatList from '../src/components/chatbot/ChatList.vue'
import ChatMessageRow from '../src/components/chatbot/ChatMessageRow.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 O：消息列表虚拟滚动
 *
 * jsdom 没有布局，但 EbVirtualList 在视口高度为 0 时仍有兜底高度：
 * 500 条只渲染十来个节点（探针实测 11）。所以「渲染数有界」在这里是确定性断言。
 */

/** 造一段混合内容的长会话：长短文案、代码块、工具卡、附件都占上 */
function makeMessages(count) {
  const kinds = ['short', 'long', 'code', 'tools', 'plan']
  return Array.from({ length: count }, (_, i) => {
    const kind = kinds[i % kinds.length]
    const base = { id: `m${i}`, role: i % 2 === 0 ? 'user' : 'assistant', status: 'done' }
    if (kind === 'long') return { ...base, content: `第 ${i} 条：${'这是一段很长的说明文字。'.repeat(20)}` }
    if (kind === 'code') return { ...base, content: `第 ${i} 条：\n\n\`\`\`js\nconst a = ${i}\nfunction f() { return a }\n\`\`\`` }
    if (kind === 'tools') return { ...base, content: `第 ${i} 条`, toolCalls: [{ id: `t${i}`, name: 'search', status: 'done', result: `命中 ${i} 条`, args: { q: `q${i}` } }] }
    if (kind === 'plan') return { ...base, content: `第 ${i} 条`, plan: { title: `计划 ${i}`, steps: [{ id: 's1', label: '第一步', status: 'done' }] } }
    return { ...base, content: `第 ${i} 条短消息` }
  })
}

const mountList = (props = {}, slots = {}) =>
  mount(ChatList, { props: { messages: makeMessages(500), ...props }, slots, attachTo: document.body })

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ChatList 虚拟模式', () => {
  it('默认不开：全部消息都渲染（回归钉）', { timeout: 30000 }, () => {
    // 非虚拟分支会把每条都真渲染出来：这里只放 200 条（远高于阈值 60，语义不变），
    // 500 条在并发跑全量时会顶到单测 5s 上限——那条由下面的虚拟分支用例覆盖
    const w = mountList({ messages: makeMessages(200) })
    expect(w.findAllComponents(ChatMessageRow)).toHaveLength(200)
    expect(w.find('.eb-chat-list__virtual').exists()).toBe(false)
    w.unmount()
  })

  it('开了之后渲染数被限制在可视窗口量级', { timeout: 30000 }, () => {
    const w = mountList({ virtual: true })
    const rendered = w.findAllComponents(ChatMessageRow).length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(40)
    // 占位高度按估算值撑开，滚动条才能反映真实长度
    expect(w.find('.eb-virtual-list__spacer').attributes('style')).toContain('60000px')
    w.unmount()
  })

  it('条数不够阈值时不虚拟化（避免短会话白搭一层）', () => {
    const w = mount(ChatList, { props: { messages: makeMessages(10), virtual: true }, attachTo: document.body })
    expect(w.find('.eb-chat-list__virtual').exists()).toBe(false)
    expect(w.findAllComponents(ChatMessageRow)).toHaveLength(10)
    w.unmount()
  })

  it('阈值可调：调到 5 时 10 条也走虚拟', () => {
    const w = mount(ChatList, { props: { messages: makeMessages(10), virtual: true, virtualThreshold: 5 }, attachTo: document.body })
    expect(w.find('.eb-chat-list__virtual').exists()).toBe(true)
    w.unmount()
  })

  it('无障碍语义落在虚拟列表的滚动容器上', () => {
    const w = mountList({ virtual: true })
    const root = w.find('.eb-chat-list__virtual')
    expect(root.attributes('role')).toBe('log')
    expect(root.attributes('aria-live')).toBe('polite')
    expect(root.attributes('aria-relevant')).toBe('additions')
    expect(root.attributes('aria-label')).toBe(chatLabels.list.label)
    w.unmount()
    const off = mountList({ virtual: true, autoScroll: false })
    expect(off.find('.eb-chat-list__virtual').attributes('aria-live')).toBe('off')
    off.unmount()
  })

  it('空态与非虚拟分支的语义不受影响（回归钉）', () => {
    const empty = mount(ChatList, { props: { messages: [] }, attachTo: document.body })
    expect(empty.find('.eb-chat-list').attributes('role')).toBe('log')
    expect(empty.text()).toContain(chatLabels.list.empty)
    empty.unmount()
  })
})

describe('ChatList 虚拟模式下的插槽与事件', () => {
  it('#message 插槽整条接管仍然可用', () => {
    const w = mountList({ virtual: true }, { message: (p) => h('div', { class: 'my-row' }, p.message.content.slice(0, 6)) })
    const rows = w.findAll('.my-row')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThan(40)
    expect(w.findAllComponents(ChatMessageRow)).toHaveLength(0)
    w.unmount()
  })

  it('#message-content 只换正文，外壳仍在', () => {
    const w = mountList({ virtual: true }, { 'message-content': (p) => h('div', { class: 'my-body' }, p.message.id) })
    expect(w.findAll('.my-body').length).toBeGreaterThan(0)
    expect(w.findAllComponents(ChatMessageRow).length).toBeGreaterThan(0)
    w.unmount()
  })

  it('事件束在虚拟分支同样生效（copy 能一路上去）', async () => {
    // copy 要真写到剪贴板才 emit：jsdom 没有实现，按其它用例的做法装 mock
    const desc = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    try {
      const w = mountList({ virtual: true })
      await w.findAll('.eb-chat-actionbar__btn')[0].trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(w.emitted('copy')?.length).toBeGreaterThan(0)
      w.unmount()
    } finally {
      if (desc) Object.defineProperty(navigator, 'clipboard', desc)
      else delete navigator.clipboard
    }
  })
})

describe('Chatbot 透传 virtual', () => {
  it('开了 virtual 才走虚拟分支（曾因只加在 ChatList 上而静默失效）', { timeout: 30000 }, async () => {
    const messages = makeMessages(100)
    const on = mount(Chatbot, { props: { modelValue: messages, showTip: false, virtual: true }, attachTo: document.body })
    await nextTick()
    expect(on.find('.eb-chat-list__virtual').exists()).toBe(true)
    expect(on.findAllComponents(ChatMessageRow).length).toBeLessThan(40)
    on.unmount()

    const off = mount(Chatbot, { props: { modelValue: messages, showTip: false }, attachTo: document.body })
    await nextTick()
    expect(off.find('.eb-chat-list__virtual').exists()).toBe(false)
    expect(off.findAllComponents(ChatMessageRow)).toHaveLength(100)
    off.unmount()
  })

  it('阈值与估算行高也能透传', async () => {
    const w = mount(Chatbot, {
      props: { modelValue: makeMessages(10), showTip: false, virtual: true, virtualThreshold: 5, estimatedItemSize: 80 },
      attachTo: document.body,
    })
    await nextTick()
    const root = w.find('.eb-chat-list__virtual')
    expect(root.exists()).toBe(true)
    // 10 条 × 80px 估算
    expect(w.find('.eb-virtual-list__spacer').attributes('style')).toContain('800px')
    w.unmount()
  })
})

describe('ChatList 虚拟模式下的滚动', () => {
  function fakeScrollBox(root, { scrollTop, scrollHeight, clientHeight }) {
    Object.defineProperty(root, 'scrollHeight', { value: scrollHeight, configurable: true })
    Object.defineProperty(root, 'clientHeight', { value: clientHeight, configurable: true })
    Object.defineProperty(root, 'scrollTop', { value: scrollTop, writable: true, configurable: true })
  }

  it('滚离底部时出现回到底部钮；点击后贴底且按钮消失', async () => {
    const w = mountList({ virtual: true })
    const root = w.find('.eb-chat-list__virtual').element
    fakeScrollBox(root, { scrollTop: 0, scrollHeight: 60000, clientHeight: 400 })
    await w.find('.eb-chat-list__virtual').trigger('scroll')
    await nextTick()
    const btn = w.find('.eb-chat-list__backtop')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toBe(chatLabels.list.backToBottom)

    await btn.trigger('click')
    await new Promise((r) => requestAnimationFrame(() => r()))
    await nextTick()
    expect(root.scrollTop).toBe(60000)
    w.unmount()
  })

  it('expose 的 scrollToBottom 在虚拟模式下也贴到底', async () => {
    const w = mountList({ virtual: true })
    const root = w.find('.eb-chat-list__virtual').element
    fakeScrollBox(root, { scrollTop: 0, scrollHeight: 60000, clientHeight: 400 })
    w.vm.scrollToBottom(false)
    await new Promise((r) => requestAnimationFrame(() => r()))
    await nextTick()
    expect(root.scrollTop).toBe(60000)
    w.unmount()
  })

  it('滚动事件仍向宿主透传', async () => {
    const w = mountList({ virtual: true })
    const root = w.find('.eb-chat-list__virtual').element
    fakeScrollBox(root, { scrollTop: 100, scrollHeight: 60000, clientHeight: 400 })
    await w.find('.eb-chat-list__virtual').trigger('scroll')
    expect(w.emitted('scroll')?.length).toBeGreaterThan(0)
    w.unmount()
  })
})
