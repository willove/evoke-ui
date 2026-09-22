import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatSources from '../src/components/chatbot/ChatSources.vue'
import ChatMarkdown from '../src/components/chatbot/ChatMarkdown.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import { renderChatMarkdown } from '../src/components/chatbot/chatMarkdown'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 B：source: 协议行内引用上标 + ChatSources 来源卡 + 两者联动
 */

const CITATIONS = [
  { id: 'c1', title: 'Nature 论文', url: 'https://journal.example.org/a/b?utm=1', source: 'journal.example.org', snippet: '摘要一' },
  { id: 'c2', title: '维基条目', url: 'https://ref.example.com/x' },
]

describe('chatMarkdown source: 协议', () => {
  it('渲染为上标而非 ref-chip 或 <a>', () => {
    const html = renderChatMarkdown('结论见[1](source:c1)。')
    expect(html).toContain('class="eb-chat-citation"')
    expect(html).toContain('data-ref-id="c1"')
    expect(html).toContain('data-cite-num="1"')
    expect(html).toContain('role="button"')
    expect(html).toContain('tabindex="0"')
    expect(html).not.toContain('eb-ref-chip')
    expect(html).not.toContain('<a href="source:')
  })

  it('链接文字是纯数字就沿用它作序号，否则按本次渲染递增分配', () => {
    expect(renderChatMarkdown('[来源甲](source:c1) 与 [来源乙](source:c2)')).toMatch(/data-cite-num="1"[\s\S]*data-cite-num="2"/)
    expect(renderChatMarkdown('[3](source:c1)')).toContain('data-cite-num="3"')
  })

  it('序号计数器每次渲染归零（跨条消息不串号）', () => {
    renderChatMarkdown('[a](source:c1)')
    const second = renderChatMarkdown('[b](source:c2)')
    expect(second).toContain('data-cite-num="1"')
  })

  it('markdown title 落到 title 属性；ref-id 里的引号不得逃逸出属性', () => {
    expect(renderChatMarkdown('[1](source:c1 "出处标题")')).toContain('title="出处标题"')
    // 尖括号目标才允许引号进入 href——正好用来验属性位转义
    const hostile = renderChatMarkdown('[1](<source:a"b>)')
    expect(hostile).toContain('data-ref-id="a&quot;b"')
    expect(hostile).not.toMatch(/data-ref-id="a"[^>]*b"/)
    expect(hostile).toContain('aria-label="' + chatLabels.markdown.citation('1') + '"')
  })

  it('非 source 的自定义协议仍走 ref-chip', () => {
    expect(renderChatMarkdown('[实体](entity:42)')).toContain('eb-ref-chip')
  })
})

describe('ChatMarkdown 上标事件委托', () => {
  it('点击与键盘 Enter 都发 citation-click(id)', async () => {
    const w = mount(ChatMarkdown, { props: { content: '见[2](source:c1)。' } })
    await nextTick()
    const sup = w.find('.eb-chat-citation')
    expect(sup.exists()).toBe(true)
    await sup.trigger('click')
    expect(w.emitted('citation-click')[0]).toEqual(['c1'])
    await sup.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('citation-click')).toHaveLength(2)
    await sup.trigger('keydown', { key: ' ' })
    expect(w.emitted('citation-click')).toHaveLength(3)
  })

  it('普通链接点击不误触 citation-click', async () => {
    const w = mount(ChatMarkdown, { props: { content: '[官网](https://example.com)' } })
    await nextTick()
    await w.find('a').trigger('click')
    expect(w.emitted('citation-click')).toBeUndefined()
  })
})

describe('ChatSources', () => {
  it('渲染序号/标题/域名/摘要，字符串项归一为对象', () => {
    const w = mount(ChatSources, { props: { items: CITATIONS } })
    const cards = w.findAll('.eb-chat-sources__card')
    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toContain('Nature 论文')
    expect(cards[0].text()).toContain('journal.example.org')
    expect(cards[0].text()).toContain('摘要一')
    // 未给 source 时从 url 取主机名，不带查询串
    expect(cards[1].text()).toContain('ref.example.com')
    expect(cards[1].text()).not.toContain('utm')

    const plain = mount(ChatSources, { props: { items: ['纯字符串来源'] } })
    expect(plain.findAll('.eb-chat-sources__item')).toHaveLength(1)
    expect(plain.text()).toContain('纯字符串来源')
  })

  it('空列表不渲染', () => {
    expect(mount(ChatSources, { props: { items: [] } }).find('.eb-chat-sources').exists()).toBe(false)
  })

  it('折叠头带 aria-expanded，收起时列表隐藏', async () => {
    const w = mount(ChatSources, { props: { items: CITATIONS, defaultOpen: true } })
    const toggle = w.find('.eb-chat-sources__toggle')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.attributes('aria-controls')).toBe(w.find('.eb-chat-sources__list').attributes('id'))
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(w.find('.eb-chat-sources__list').attributes('style')).toContain('display: none')
  })

  it('collapsible=false 时无折叠头，列表常驻', () => {
    const w = mount(ChatSources, { props: { items: CITATIONS, collapsible: false } })
    expect(w.find('.eb-chat-sources__toggle').exists()).toBe(false)
    expect(w.find('.eb-chat-sources__heading').text()).toBe(chatLabels.sources.toggle(2))
  })

  it('item-click 交出 (item, index)', async () => {
    const w = mount(ChatSources, { props: { items: CITATIONS } })
    await w.findAll('.eb-chat-sources__card')[1].trigger('click')
    const evt = w.emitted('item-click')
    expect(evt[0][0].id).toBe('c2')
    expect(evt[0][1]).toBe(1)
  })

  it('highlight 展开列表并标记对应卡片；传 null 清除', async () => {
    const w = mount(ChatSources, { props: { items: CITATIONS, defaultOpen: false } })
    expect(w.find('.eb-chat-sources__toggle').attributes('aria-expanded')).toBe('false')
    w.vm.highlight('c2')
    await nextTick()
    expect(w.find('.eb-chat-sources__toggle').attributes('aria-expanded')).toBe('true')
    const items = w.findAll('.eb-chat-sources__item')
    expect(items[1].classes()).toContain('is-highlighted')
    expect(items[0].classes()).not.toContain('is-highlighted')
    w.vm.highlight(null)
    await nextTick()
    expect(w.findAll('.eb-chat-sources__item')[1].classes()).not.toContain('is-highlighted')
  })

  it('id 含引号也不破 DOM 查找', async () => {
    const w = mount(ChatSources, { props: { items: [{ id: 'a"b', title: '怪 id' }] } })
    w.vm.highlight('a"b')
    await nextTick()
    expect(w.find('.eb-chat-sources__item').classes()).toContain('is-highlighted')
  })
})

describe('ChatMessage 引用联动', () => {
  const msg = {
    id: 'a1', role: 'assistant', status: 'done',
    content: '结论见[1](source:c1)与[2](source:c2)。',
    citations: CITATIONS,
  }

  it('citations 渲染来源卡，上标点击联动高亮并向上 emit', async () => {
    const w = mount(ChatMessage, { props: { message: msg } })
    await nextTick()
    expect(w.findComponent(ChatSources).exists()).toBe(true)
    await w.findAll('.eb-chat-citation')[1].trigger('click')
    const evt = w.emitted('citation-click')
    expect(evt[0][0]).toBe('c2')
    expect(evt[0][1].id).toBe('a1')
    expect(w.findAll('.eb-chat-sources__item')[1].classes()).toContain('is-highlighted')
  })

  it('无 citations 时不渲染来源卡', () => {
    const w = mount(ChatMessage, { props: { message: { ...msg, citations: undefined } } })
    expect(w.findComponent(ChatSources).exists()).toBe(false)
  })
})

describe('Chatbot 引用转发', () => {
  it('citation-click 一路到根且保留两参', async () => {
    const w = mount(Chatbot, {
      props: {
        showTip: false,
        modelValue: [{
          id: 'a1', role: 'assistant', status: 'done',
          content: '见[1](source:c1)。',
          citations: CITATIONS,
        }],
      },
    })
    await nextTick()
    await w.find('.eb-chat-citation').trigger('click')
    const evt = w.emitted('citation-click')
    expect(evt[0][0]).toBe('c1')
    expect(evt[0][1].id).toBe('a1')
  })
})
