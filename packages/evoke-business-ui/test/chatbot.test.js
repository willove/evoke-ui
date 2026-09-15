import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import ChatAttachments from '../src/components/chatbot/ChatAttachments.vue'
import ChatSender from '../src/components/chatbot/ChatSender.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import {
  generateId,
  formatFileSize,
  escapeHtml,
  simpleMarkdown,
  copyToClipboard,
} from '../src/components/chatbot/utils'
import {
  renderChatMarkdown,
  configureChatMarkdown,
} from '../src/components/chatbot/chatMarkdown'

// ── useChatEngine 状态机 ──

describe('useChatEngine', () => {
  it('sendMessage：追加用户消息、清空输入、回调 payload、loading 复位', async () => {
    const onSend = vi.fn()
    const engine = useChatEngine({ onSend })
    engine.inputValue.value = '  你好  '
    await engine.sendMessage('  你好  ', [{ name: 'a.pdf' }])

    expect(engine.inputValue.value).toBe('')
    expect(engine.loading.value).toBe(false)
    expect(engine.messages.value).toHaveLength(1)
    const [msg] = engine.messages.value
    expect(msg).toMatchObject({ role: 'user', content: '你好', status: 'done' })
    expect(msg.attachments).toEqual([{ name: 'a.pdf' }])
    expect(onSend).toHaveBeenCalledWith('你好', [{ name: 'a.pdf' }])
  })

  it('sendMessage：loading 中与空内容（且无附件）均忽略', async () => {
    const onSend = vi.fn()
    const engine = useChatEngine({ onSend })
    engine.loading.value = true
    await engine.sendMessage('x')
    expect(onSend).not.toHaveBeenCalled()
    engine.loading.value = false
    await engine.sendMessage('   ')
    expect(onSend).not.toHaveBeenCalled()
    expect(engine.messages.value).toHaveLength(0)
  })

  it('onSend 抛错且最后一条是 assistant：标记 error 状态', async () => {
    const engine = useChatEngine({ onSend: () => { engine.createAssistantMessage(); throw new Error('余额不足') } })
    await engine.sendMessage('hi')
    const last = engine.messages.value[engine.messages.value.length - 1]
    expect(last.status).toBe('error')
    expect(last.error).toBe('余额不足')
    expect(last.thinking).toBe(false)
    expect(engine.loading.value).toBe(false)
  })

  it('流式管线：pending → appendContent 转 streaming → complete 记录时长回 done', () => {
    // 桩定 Date.now 控制时长差（fake timers 对 Date 的推进语义不可靠）
    const realNow = Date.now
    let now = 1_000_000
    Date.now = () => now
    try {
      const engine = useChatEngine()
      const msg = engine.createAssistantMessage()
      expect(msg.status).toBe('pending')
      expect(engine.assistantMessage.value?.id).toBe(msg.id)

      engine.appendContent(msg.id, '你')
      engine.appendContent(msg.id, '好')
      expect(msg.content).toBe('你好')
      expect(msg.status).toBe('streaming')

      engine.appendThinkContent(msg.id, '推理中')
      expect(msg.thinkContent).toBe('推理中')
      expect(msg.thinking).toBe(true)

      now = 1_001_500
      engine.completeMessage(msg.id)
      expect(msg.status).toBe('done')
      expect(msg.thinking).toBe(false)
      expect(msg.duration).toBe(1500)
      // 完成后不再被当作进行中的 assistant 消息
      expect(engine.assistantMessage.value).toBeUndefined()
    } finally {
      Date.now = realNow
    }
  })

  it('regenerateMessage：截断到目标提问之后并以原内容重发', async () => {
    const onSend = vi.fn((content) => {
      const m = engine.createAssistantMessage()
      engine.appendContent(m.id, `回复:${content}`)
      engine.completeMessage(m.id)
    })
    const engine = useChatEngine({ onSend })
    await engine.sendMessage('第一问')
    const asst1 = engine.createAssistantMessage()
    engine.completeMessage(asst1.id)
    await engine.sendMessage('第二问')
    const asst2 = engine.createAssistantMessage()
    engine.completeMessage(asst2.id)
    const countBefore = engine.messages.value.length

    engine.regenerateMessage(asst2.id)
    await Promise.resolve()
    // asst2 被移除，重发产生新的一次 onSend('第二问')
    expect(onSend).toHaveBeenLastCalledWith('第二问', [])
    expect(engine.messages.value.length).toBeLessThan(countBefore + 2)
  })

  it('regenerateMessage：首条消息无从重发，直接忽略', () => {
    const onSend = vi.fn()
    const engine = useChatEngine({ onSend })
    const m = engine.addUserMessage('唯一一条')
    engine.regenerateMessage(m.id)
    expect(onSend).not.toHaveBeenCalled()
  })

  it('removeMessage / clearMessages / updateMessage', () => {
    const engine = useChatEngine()
    const a = engine.addUserMessage('a')
    engine.addUserMessage('b')
    engine.removeMessage(a.id)
    expect(engine.messages.value.map((m) => m.content)).toEqual(['b'])
    engine.updateMessage(engine.messages.value[0].id, { content: 'c' })
    expect(engine.messages.value[0].content).toBe('c')
    engine.clearMessages()
    expect(engine.messages.value).toHaveLength(0)
  })
})

// ── utils 纯函数 ──

describe('chatbot/utils', () => {
  it('generateId：格式合法且不重复', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId()))
    expect(ids.size).toBe(200)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+$/)
  })

  it('formatFileSize：falsy 空、B/KB/MB 三档', () => {
    expect(formatFileSize(0)).toBe('')
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB')
  })

  it('escapeHtml：HTML 结构字符全部转义（textContent 通道，引号原样保留是安全语义）', () => {
    expect(escapeHtml('<img src=x onerror="a">')).not.toContain('<img')
    expect(escapeHtml('<b>&')).toBe('&lt;b&gt;&amp;')
    expect(escapeHtml('"\'')).toBe('"\'')
  })

  it('simpleMarkdown：标题 / 列表 / 引用 / 分隔线 / 粗斜体', () => {
    const html = simpleMarkdown('# H1\n\n## H2\n\n### H3\n\n- 甲\n- 乙\n\n1. 一\n2. 二\n\n> 引用\n\n---\n\n**粗** *斜*')
    expect(html).toContain('<h1>H1</h1>')
    expect(html).toContain('<h2>H2</h2>')
    expect(html).toContain('<h3>H3</h3>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<ol>')
    expect((html.match(/<li>/g) || []).length).toBe(4)
    expect(html).toContain('<blockquote><p>引用</p></blockquote>')
    expect(html).toContain('<hr>')
    expect(html).toContain('<strong>粗</strong>')
    expect(html).toContain('<em>斜</em>')
  })

  it('simpleMarkdown：代码块转义还原、行内码隔离、外链补安全属性、XSS 不透传', () => {
    const html = simpleMarkdown('前文 `<b>不变粗</b>` **加粗**\n\n```html\n<script>alert(1)<\/script>\n```\n\n访问 https://example.com/x 即可\n\n<img src=x onerror=1>')
    expect((html.match(/<strong>/g) || []).length).toBe(1) // 行内码内的 ** 不参与加粗
    expect(html).toContain('<pre><code>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('<a href="https://example.com/x" target="_blank" rel="noopener noreferrer">')
    expect(html).not.toContain('<img src=x')
  })

  it('copyToClipboard：Clipboard API 与 execCommand 降级双路径', async () => {
    const desc = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    try {
      await expect(copyToClipboard('hello')).resolves.toBeUndefined()
      expect(writeText).toHaveBeenCalledWith('hello')
    } finally {
      if (desc) Object.defineProperty(navigator, 'clipboard', desc)
      else delete navigator.clipboard
    }

    const orig = document.execCommand
    document.execCommand = () => true
    try {
      await expect(copyToClipboard('legacy')).resolves.toBeUndefined()
    } finally {
      if (orig === undefined) delete document.execCommand
      else document.execCommand = orig
    }
  })
})

// ── chatMarkdown 管线 ──

describe('chatMarkdown', () => {
  it('renderChatMarkdown：空值短路、标准协议链接带安全属性', () => {
    expect(renderChatMarkdown('')).toBe('')
    const html = renderChatMarkdown('[官网](https://e.dev) 与 [电话](tel:123)')
    expect(html).toContain('<a href="https://e.dev" target="_blank" rel="noopener noreferrer">')
    expect(html).toContain('<a href="tel:123">')
  })

  it('非标准协议渲染为引用 chip（主题按配置，未知回落 primary）', () => {
    const html = renderChatMarkdown('[钩子文档](doc:react) 与 [词条](book:abc)')
    expect(html).toContain('class="eb-ref-chip eb-ref-chip--info"')
    expect(html).toContain('data-protocol="doc"')
    expect(html).toContain('data-ref-id="react"')
    expect(html).toContain('eb-ref-chip--primary') // book 无主题配置 → primary
  })

  it('configureChatMarkdown：增删协议、覆盖主题色、reset 归默认', () => {
    configureChatMarkdown({ standardProtocols: { add: ['book'] }, protocolThemes: { doc: 'danger' } })
    const customized = renderChatMarkdown('[x](book:1) [钩子](doc:r)')
    expect(customized).toContain('<a href="book:1">')
    expect(customized).toContain('eb-ref-chip--danger')

    configureChatMarkdown({ reset: true })
    const restored = renderChatMarkdown('[x](book:1) [钩子](doc:r)')
    expect(restored).toContain('data-protocol="book"')
    expect(restored).toContain('eb-ref-chip--info')
  })

  it('代码块：已知语言走 hljs 高亮，未知语言回落 plaintext', () => {
    expect(renderChatMarkdown('```js\nconst a = 1\n```')).toContain('language-js')
    expect(renderChatMarkdown('```nope\nx\n```')).toContain('language-plaintext')
  })
})

// ── ChatMessage 行为 ──

const doneAssistant = { id: 'a1', role: 'assistant', content: '**答案**', status: 'done', createdAt: Date.now() }

describe('ChatMessage 行为', () => {
  it('error 状态：容器挂 error 类并展示错误文案', () => {
    const w = mount(ChatMessage, { props: { message: { id: 'e1', role: 'assistant', status: 'error', error: '余额不足' } } })
    expect(w.classes()).toContain('eb-chat-message--error')
    expect(w.find('.eb-chat-message__error').text()).toContain('余额不足')
  })

  it('pending 状态渲染 loading 占位', () => {
    const w = mount(ChatMessage, { props: { message: { id: 'p1', role: 'assistant', status: 'pending', content: '' } } })
    expect(w.find('.eb-chat-message__loading').exists()).toBe(true)
  })

  it('附件渲染文件名与格式化体积', () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 'f1', role: 'user', content: '看附件', status: 'done', attachments: [{ name: '报告.pdf', size: 2048 }] } },
    })
    expect(w.findComponent(ChatAttachments).exists()).toBe(true)
    expect(w.text()).toContain('报告.pdf')
    expect(w.text()).toContain('2.0 KB')
  })

  it('done 且有时长：展示格式化耗时', () => {
    const w = mount(ChatMessage, { props: { message: { ...doneAssistant, duration: 65000 } } })
    expect(w.find('.eb-chat-message__duration').text()).toContain('1m5s')
    const w2 = mount(ChatMessage, { props: { message: { ...doneAssistant, duration: 500 } } })
    expect(w2.find('.eb-chat-message__duration').text()).toContain('500ms')
  })

  it('text 渲染模式走纯文本分支', () => {
    const w = mount(ChatMessage, { props: { message: doneAssistant, renderMode: 'text' } })
    expect(w.find('.eb-chat-message__text').exists()).toBe(true)
    expect(w.find('strong').exists()).toBe(false)
  })

  it('动作条链路：copy / regenerate / 自定义 action 逐级向上 emit', async () => {
    const actions = [{ key: 'like', label: '点赞' }]
    const w = mount(ChatMessage, { props: { message: doneAssistant, actions } })
    const btns = w.findAll('.eb-chat-actionbar__btn')
    expect(btns.length).toBe(3) // 复制 + 重新生成 + 点赞

    const desc = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true })
    try {
      await btns[0].trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(w.emitted('copy')[0][0].id).toBe('a1')
    } finally {
      if (desc) Object.defineProperty(navigator, 'clipboard', desc)
      else delete navigator.clipboard
    }

    await btns[1].trigger('click')
    expect(w.emitted('regenerate')[0][0].id).toBe('a1')
    await btns[2].trigger('click')
    expect(w.emitted('action')[0]).toEqual(['like', doneAssistant])
  })
})

// ── Chatbot 整体行为 ──

describe('Chatbot 行为', () => {
  it('send 流：v-model 收到含新用户消息的数组，send 转发原文', async () => {
    const w = mount(Chatbot, { props: { modelValue: [], showTip: false } })
    const textarea = w.find('.eb-chat-sender__textarea')
    await textarea.setValue('帮我看下这份报表')
    await textarea.trigger('keydown', { key: 'Enter' })
    await nextTick()

    const updated = w.emitted('update:modelValue').at(-1)[0]
    const last = updated.at(-1)
    expect(last).toMatchObject({ role: 'user', content: '帮我看下这份报表', status: 'done' })
    expect(last.id).toBeTruthy()
    expect(w.emitted('send')[0][0]).toBe('帮我看下这份报表')
  })

  it('loading 时发送区禁用', () => {
    const w = mount(Chatbot, { props: { modelValue: [], loading: true } })
    expect(w.find('.eb-chat-sender__textarea').attributes('disabled')).toBeDefined()
  })

  it('assistant 完成态消息的动作条事件一路转发到根', async () => {
    const actions = [{ key: 'like', label: '点赞' }]
    const w = mount(Chatbot, { props: { modelValue: [doneAssistant], actions, showTip: false } })
    const btns = w.findAll('.eb-chat-actionbar__btn')

    const desc = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true })
    try {
      await btns[0].trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(w.emitted('copy')[0][0].id).toBe('a1')
    } finally {
      if (desc) Object.defineProperty(navigator, 'clipboard', desc)
      else delete navigator.clipboard
    }
    await btns[1].trigger('click')
    expect(w.emitted('regenerate')[0][0].id).toBe('a1')
    await btns[2].trigger('click')
    expect(w.emitted('action')[0]).toEqual(['like', doneAssistant])
  })

  it('expose reset()：清空消息与输入', async () => {
    const w = mount(Chatbot, { props: { modelValue: [{ id: 'm1', role: 'user', content: 'x', status: 'done', createdAt: Date.now() }] } })
    await w.vm.reset()
    // defineExpose 的 computed 经 expose 代理解包为数组
    expect(w.vm.messages).toHaveLength(0)
  })
})

// ── ChatSender 行为 ──

describe('ChatSender 行为', () => {
  it('sendOnEnter=false：Enter 不发送，点发送按钮才发', async () => {
    const w = mount(ChatSender, { props: { modelValue: '', sendOnEnter: false } })
    const textarea = w.find('.eb-chat-sender__textarea')
    await textarea.setValue('点按钮发')
    await textarea.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('send')).toBeUndefined()

    await w.find('.eb-chat-sender__send-btn').trigger('click')
    expect(w.emitted('send')[0][0]).toBe('点按钮发')
  })

  it('disabled：输入禁用且按钮点击不发', async () => {
    const w = mount(ChatSender, { props: { modelValue: '', disabled: true } })
    expect(w.find('.eb-chat-sender__textarea').attributes('disabled')).toBeDefined()
    await w.find('.eb-chat-sender__send-btn').trigger('click')
    expect(w.emitted('send')).toBeUndefined()
  })

  it('空内容按钮置灰不发', async () => {
    const w = mount(ChatSender, { props: { modelValue: '' } })
    expect(w.find('.eb-chat-sender__send-btn').attributes('disabled')).toBeDefined()
    await w.find('.eb-chat-sender__send-btn').trigger('click')
    expect(w.emitted('send')).toBeUndefined()
  })
})
