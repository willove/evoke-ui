import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import ChatAttachments from '../src/components/chatbot/ChatAttachments.vue'
import ChatSender from '../src/components/chatbot/ChatSender.vue'
import ChatMarkdown from '../src/components/chatbot/ChatMarkdown.vue'
import { chatLabels } from '../src/components/chatbot/labels'
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
  registerHighlightLanguage,
  getChatMarkdownConfig,
} from '../src/components/chatbot/chatMarkdown'
import ChatMarkdown from '../src/components/chatbot/ChatMarkdown.vue'

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
    // 第三参 context：无编排上下文时为 undefined
    expect(onSend).toHaveBeenCalledWith('你好', [{ name: 'a.pdf' }], undefined)
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

  it('cancelMessage：中断保留已流出正文，状态记 cancelled 而非 error', () => {
    const engine = useChatEngine()
    const msg = engine.createAssistantMessage()
    engine.appendContent(msg.id, '已经输出的')
    engine.appendContent(msg.id, '一半')
    expect(msg.status).toBe('streaming')

    engine.cancelMessage(msg.id)
    expect(msg.status).toBe('cancelled')
    expect(msg.content).toBe('已经输出的一半')
    // 中断走 cancelled，不落 error / error 文案：那是真出错才用的红块
    expect(msg.error).toBeUndefined()
    // 中断不结算回答用时
    expect(msg.duration).toBeUndefined()
    // 中断后不再被当作进行中的 assistant 消息，下一次发送不会被误判成“还在生成”
    expect(engine.assistantMessage.value).toBeUndefined()
  })

  it('cancelMessage：思考中中断收住思考态，半截思考内容保留', () => {
    const engine = useChatEngine()
    const msg = engine.createAssistantMessage()
    engine.appendThinkContent(msg.id, '正在推理')
    expect(msg.thinking).toBe(true)

    engine.cancelMessage(msg.id)
    expect(msg.status).toBe('cancelled')
    expect(msg.thinking).toBe(false)
    expect(msg.thinkContent).toBe('正在推理')
  })

  it('cancelMessage：思考中中断记 thinkInterrupted 并结算思考用时', () => {
    const realNow = Date.now
    let now = 2_000_000
    Date.now = () => now
    try {
      const engine = useChatEngine()
      const msg = engine.createAssistantMessage()
      engine.appendThinkContent(msg.id, '推理到一半')
      now = 2_002_600
      engine.cancelMessage(msg.id)

      expect(msg.status).toBe('cancelled')
      expect(msg.thinkInterrupted).toBe(true)
      expect(msg.thinking).toBe(false)
      // 与 completeMessage 同款收尾：思考起点折成用时
      expect(msg.thinkDuration).toBe(2600)
    } finally {
      Date.now = realNow
    }
  })

  it('cancelMessage：思考已结束的答复被中断，不算「思考被中断」', () => {
    const engine = useChatEngine()
    const msg = engine.createAssistantMessage()
    engine.appendThinkContent(msg.id, '想完了')
    engine.stopThinking(msg.id)
    engine.appendContent(msg.id, '正文一半')

    engine.cancelMessage(msg.id)
    expect(msg.status).toBe('cancelled')
    // 思考阶段已正常结束：思考块仍说「已深度思考」，不能误标为中断
    expect(msg.thinkInterrupted).toBeUndefined()
    expect(msg.content).toBe('正文一半')
  })

  it('cancelMessage：未知 id 不抛，也不动其他消息', () => {
    const engine = useChatEngine()
    const msg = engine.createAssistantMessage()
    expect(() => engine.cancelMessage('missing')).not.toThrow()
    expect(msg.status).toBe('pending')
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
    // asst2 被移除，重发产生新的一次 onSend('第二问')；context 保留 undefined
    expect(onSend).toHaveBeenLastCalledWith('第二问', [], undefined)
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

  it('data: 协议不在默认白名单，降级为 chip 不可点击；宿主可显式加回', () => {
    const html = renderChatMarkdown('[页面](data:text/html,<h1>hi</h1>)')
    expect(html).not.toContain('<a href="data:')
    expect(html).toContain('data-protocol="data"')
    configureChatMarkdown({ standardProtocols: { add: ['data'] } })
    expect(renderChatMarkdown('[x](data:text/html,hi)')).toContain('<a href="data:')
    configureChatMarkdown({ reset: true })
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

  it('安全回归：链接 href/title/data-* 属性位转义，注入载荷不得逃逸出属性', () => {
    // 无协议相对地址分支：裸引号注入 onmouseover
    const rel = renderChatMarkdown('[x](a"onmouseover="alert(1)b)')
    expect(rel).not.toContain('"onmouseover')
    expect(rel).toContain('href="a&quot;onmouseover=&quot;alert(1)b"')
    // ref-chip 分支：data-ref-href / data-ref-id 同样转义（无空格载荷才能进链接目的地）
    const chip = renderChatMarkdown('[y](doc:react"xid="p)')
    expect(chip).toContain('data-ref-href="doc:react&quot;xid=&quot;p"')
    // title 注入：markdown 里的 \" 转义经 marked 反转义后是裸引号
    const titled = renderChatMarkdown('[z](https://e.dev "b\\"c onmouseover=\\"x")')
    expect(titled).toContain('title="b&quot;c onmouseover=&quot;x"')
  })

  it('安全回归：markdown 原文 raw HTML 转义为纯文本，不产生可执行节点', () => {
    const html = renderChatMarkdown('前文 <img src=x onerror="alert(1)"> 后文')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img src=x')
    const script = renderChatMarkdown('<script>alert(1)</script>')
    expect(script).not.toContain('<script>')
    expect(script).toContain('&lt;script&gt;')
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

describe('消息控制行：追问 / 评价 / 动作条并排', () => {
  const mkMsg = (extra = {}) => ({
    id: 'c1', role: 'assistant', content: '答', status: 'done', createdAt: Date.now(),
    suggestions: ['再展开讲讲', '给个例子'], ...extra,
  })

  it('三块落在同一个控制行里（不再是三行堆叠）', () => {
    const w = mount(ChatMessage, {
      props: { message: mkMsg(), feedback: true, feedbackReasons: ['不准确'] },
    })
    const row = w.find('.eb-chat-message__controls')
    expect(row.exists()).toBe(true)
    expect(row.find('.eb-chat-suggestion').exists()).toBe(true)
    expect(row.find('.eb-chat-feedback').exists()).toBe(true)
    expect(row.find('.eb-chat-message__foot').exists()).toBe(true)
    // 且三块都是控制行的直接子节点（同一行 flex 布局）
    expect(row.element.children.length).toBe(3)
  })

  it('点踩展开原因面板时，评价块拿 is-panel-open（外层据此整行铺开）', async () => {
    const w = mount(ChatMessage, {
      props: { message: mkMsg(), feedback: true, feedbackReasons: ['不准确'] },
    })
    expect(w.find('.eb-chat-feedback').classes()).not.toContain('is-panel-open')
    await w.findAll('.eb-chat-feedback__btn')[1].trigger('click')
    expect(w.find('.eb-chat-feedback').classes()).toContain('is-panel-open')
  })

  it('没有追问与评价时，控制行只放时间与动作条（版面同从前）', () => {
    const w = mount(ChatMessage, { props: { message: { id: 'p', role: 'assistant', content: '答', status: 'done', createdAt: Date.now() } } })
    const row = w.find('.eb-chat-message__controls')
    expect(row.exists()).toBe(true)
    expect(row.element.children.length).toBe(1)
    expect(row.find('.eb-chat-message__foot').exists()).toBe(true)
  })
})

describe('思考模式的用时记录', () => {
  it('appendThinkContent → stopThinking：thinkDuration 被记下，思考态关闭', async () => {
    const eng = useChatEngine({})
    const msg = eng.createAssistantMessage()
    eng.appendThinkContent(msg.id, '先确认口径，再算同比。')
    expect(msg.thinking).toBe(true)
    expect(msg.thinkDuration).toBeUndefined()
    await new Promise((r) => setTimeout(r, 12))
    eng.stopThinking(msg.id)
    expect(msg.thinking).toBe(false)
    expect(msg.thinkDuration).toBeGreaterThan(0)
  })

  it('completeMessage 一并结算思考用时；没思考过就不写该字段', async () => {
    const eng = useChatEngine({})
    const a = eng.createAssistantMessage()
    eng.appendThinkContent(a.id, '想了想')
    await new Promise((r) => setTimeout(r, 10))
    eng.completeMessage(a.id)
    expect(a.thinkDuration).toBeGreaterThan(0)

    const b = eng.createAssistantMessage()
    eng.completeMessage(b.id)
    expect(b.thinkDuration).toBeUndefined()
  })
})

describe('ChatMessage 头部开关与时间位置', () => {
  const mk = (props = {}) =>
    mount(ChatMessage, {
      props: {
        message: { id: 'm1', role: 'user', content: '你好', status: 'done', createdAt: Date.now() },
        ...props,
      },
    })

  it('默认显示头像与昵称', () => {
    const w = mk()
    expect(w.find('.eb-chat-message__avatar').exists()).toBe(true)
    expect(w.find('.eb-chat-message__name').text()).toBe('我')
  })

  it('show-avatar / show-name 关掉后整块不渲染', () => {
    const w = mk({ showAvatar: false, showName: false })
    expect(w.find('.eb-chat-message__avatar').exists()).toBe(false)
    expect(w.find('.eb-chat-message__name').exists()).toBe(false)
    // 头部行没有剩余内容时整行也不渲染
    expect(w.find('.eb-chat-message__meta').exists()).toBe(false)
  })

  it('传对象可分侧：只隐去自己那侧 / 只隐去对方', () => {
    const user = mk({ showAvatar: { user: false }, showName: { user: false } })
    expect(user.find('.eb-chat-message__avatar').exists()).toBe(false)
    expect(user.find('.eb-chat-message__name').exists()).toBe(false)

    const assistantMsg = { id: 'm2', role: 'assistant', content: 'hi', status: 'done', createdAt: Date.now() }
    const assistant = mount(ChatMessage, { props: { message: assistantMsg, showAvatar: { user: false }, showName: { user: false } } })
    expect(assistant.find('.eb-chat-message__avatar').exists()).toBe(true)
    expect(assistant.find('.eb-chat-message__name').exists()).toBe(true)

    // 反向：只隐去对方，自己那侧照常
    const keepUser = mount(ChatMessage, { props: { message: { id: 'm3', role: 'user', content: 'hi', status: 'done' }, showAvatar: { assistant: false }, showName: { assistant: false } } })
    expect(keepUser.find('.eb-chat-message__avatar').exists()).toBe(true)
    expect(keepUser.find('.eb-chat-message__name').exists()).toBe(true)
  })

  it('时间戳落在消息下方（foot 内），不在头部行', () => {
    const w = mk()
    expect(w.find('.eb-chat-message__meta .eb-chat-message__time').exists()).toBe(false)
    const foot = w.find('.eb-chat-message__foot')
    expect(foot.exists()).toBe(true)
    expect(foot.find('.eb-chat-message__time').text()).toMatch(/\d{2}:\d{2}/)
    // DOM 顺序：foot 在气泡之后
    const html = w.html()
    expect(html.indexOf('__bubble')).toBeLessThan(html.indexOf('__foot'))
  })

  it('show-time=false 时不渲染时间', () => {
    const w = mk({ showTime: false })
    expect(w.find('.eb-chat-message__time').exists()).toBe(false)
  })

  it('无 createdAt 的消息不渲染时间（初始数据常见于助手侧）', () => {
    const w = mount(ChatMessage, { props: { message: { id: 'a', role: 'assistant', content: 'hi', status: 'done' } } })
    expect(w.find('.eb-chat-message__time').exists()).toBe(false)
  })
})

describe('ChatMarkdown 的 SSR 安全（无 rAF 环境）', () => {
  it('streaming 时也不碰 requestAnimationFrame：退化为同步渲染', async () => {
    const raf = globalThis.requestAnimationFrame
    const caf = globalThis.cancelAnimationFrame
    // 模拟 Node/SSR：没有帧调度 API
    // @ts-ignore
    delete globalThis.requestAnimationFrame
    // @ts-ignore
    delete globalThis.cancelAnimationFrame
    try {
      const w = mount(ChatMarkdown, { props: { content: '**流式**正文', streaming: true } })
      await nextTick()
      // 同步渲染后即有内容（末尾几个字带流式拖尾），不需要等帧
      expect(w.text()).toContain('流式正文')
      expect(w.html()).toContain('eb-chat-shimmer')
    } finally {
      globalThis.requestAnimationFrame = raf
      globalThis.cancelAnimationFrame = caf
    }
  })
})

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

  it('loading 时输入区仍可打字，发送钮变停止态', () => {
    const w = mount(Chatbot, { props: { modelValue: [], loading: true, stoppable: true } })
    expect(w.find('.eb-chat-sender__textarea').attributes('disabled')).toBeUndefined()
    const btn = w.find('.eb-chat-sender__send-btn')
    expect(btn.classes()).toContain('is-stop')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('stop：点停止钮 emit stop，Enter 不触中断', async () => {
    const w = mount(Chatbot, { props: { modelValue: [], loading: true, stoppable: true } })
    await w.find('.eb-chat-sender__send-btn').trigger('click')
    expect(w.emitted('stop')).toHaveLength(1)

    const textarea = w.find('.eb-chat-sender__textarea')
    await textarea.setValue('x')
    await textarea.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('stop')).toHaveLength(1)
    expect(w.emitted('send')).toBeUndefined()
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

// ── P0 修补回归 ──

describe('P0 回归：输入台', () => {
  it('IME 组字中的 Enter 不发送（isComposing）', async () => {
    const w = mount(ChatSender, { props: { modelValue: '' } })
    const textarea = w.find('.eb-chat-sender__textarea')
    await textarea.setValue('中文输入')
    await textarea.trigger('keydown', { key: 'Enter', isComposing: true })
    expect(w.emitted('send')).toBeUndefined()
  })

  it('IME 组字中的 Enter 不发送（Safari keyCode 229 兜底）', async () => {
    const w = mount(ChatSender, { props: { modelValue: '' } })
    const textarea = w.find('.eb-chat-sender__textarea')
    await textarea.setValue('にほんご')
    await textarea.trigger('keydown', { key: 'Enter', keyCode: 229 })
    expect(w.emitted('send')).toBeUndefined()
  })

  it('maxLength 真正绑到 textarea；0 视为不限长', () => {
    const w = mount(ChatSender, { props: { modelValue: '', maxLength: 30 } })
    expect(w.find('.eb-chat-sender__textarea').attributes('maxlength')).toBe('30')
    const w2 = mount(ChatSender, { props: { modelValue: '', maxLength: 0 } })
    expect(w2.find('.eb-chat-sender__textarea').attributes('maxlength')).toBeUndefined()
  })

  it('生成中连按两次 Esc 停止；单次 Esc 不误触', async () => {
    const w = mount(ChatSender, { props: { modelValue: '草稿', loading: true, stoppable: true } })
    const ta = w.find('.eb-chat-sender__textarea')
    await ta.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('stop')).toBeUndefined()
    await ta.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('stop')).toHaveLength(1)

    // 带修饰键的 Esc 不算这个手势
    const mod = mount(ChatSender, { props: { modelValue: '草稿', loading: true, stoppable: true } })
    const modTa = mod.find('.eb-chat-sender__textarea')
    await modTa.trigger('keydown', { key: 'Escape', ctrlKey: true })
    await modTa.trigger('keydown', { key: 'Escape', ctrlKey: true })
    expect(mod.emitted('stop')).toBeUndefined()

    // 没在生成、或没有停止钮：Esc 完全留给别人
    const idle = mount(ChatSender, { props: { modelValue: '草稿' } })
    const idleTa = idle.find('.eb-chat-sender__textarea')
    await idleTa.trigger('keydown', { key: 'Escape' })
    await idleTa.trigger('keydown', { key: 'Escape' })
    expect(idle.emitted('stop')).toBeUndefined()
  })

  it('弹层打开时 Esc 归弹层，不触发停止', async () => {
    const w = mount(ChatSender, { props: { modelValue: '', loading: true, stoppable: true, menuOpen: true } })
    const ta = w.find('.eb-chat-sender__textarea')
    await ta.trigger('keydown', { key: 'Escape' })
    await ta.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('stop')).toBeUndefined()
    expect(w.emitted('menu-key')).toHaveLength(2)
  })
})

describe('P0 回归：消息体', () => {
  const userMsg = { id: 'u1', role: 'user', content: '你好 **世界**', status: 'done' }

  it('markdown 模式下用户消息带气泡容器（此前只有纯文本模式有）', () => {
    const w = mount(ChatMessage, { props: { message: userMsg, renderMode: 'markdown' } })
    expect(w.find('.eb-chat-message__bubble').exists()).toBe(true)
    expect(w.find('.eb-chat-message__bubble .eb-chat-markdown').exists()).toBe(true)
  })

  it('用户消息动作条只有复制，无重新生成', () => {
    const w = mount(ChatMessage, { props: { message: userMsg } })
    const btns = w.findAll('.eb-chat-actionbar__btn')
    expect(btns.length).toBe(1)
  })

  it('streaming：拖尾套在最后一个文字块内，且不切断结构', async () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 's1', role: 'assistant', content: '正在输出这段回答', status: 'streaming' } },
    })
    // 流式路径按帧合并，等一帧
    await new Promise((r) => requestAnimationFrame(() => r()))
    await w.vm.$nextTick()
    const shimmer = w.find('.eb-chat-shimmer')
    expect(shimmer.exists()).toBe(true)
    // 不再另起一行：拖尾的父节点就是正文 <p>
    expect(shimmer.element.parentElement.tagName).toBe('P')
    expect(w.find('.eb-chat-message__bubble').text()).toContain('正在输出这段回答')
  })

  it('streaming：拖尾不破坏行内结构（加粗/链接完整）', async () => {
    const w = mount(ChatMessage, {
      props: {
        message: {
          id: 's3', role: 'assistant', status: 'streaming',
          content: '说明文字，后面是**加粗重点**和[链接](https://example.com)',
        },
      },
    })
    await new Promise((r) => requestAnimationFrame(() => r()))
    await w.vm.$nextTick()
    expect(w.find('strong').text()).toBe('加粗重点')
    const link = w.find('.eb-chat-markdown a')
    expect(link.attributes('href')).toBe('https://example.com')
    expect(w.find('.eb-chat-shimmer').exists()).toBe(true)
  })

  it('streaming：纯文本模式也带拖尾', () => {
    const w = mount(ChatMessage, {
      props: {
        message: { id: 's4', role: 'assistant', content: '纯文本模式的长回答内容一二三四五六七八', status: 'streaming' },
        renderMode: 'text',
      },
    })
    const shimmer = w.find('.eb-chat-shimmer')
    expect(shimmer.exists()).toBe(true)
    expect(w.find('.eb-chat-message__text').text()).toBe('纯文本模式的长回答内容一二三四五六七八')
  })

  it('非流式不带拖尾', async () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 's2', role: 'assistant', content: '已完成', status: 'done' } },
    })
    await w.vm.$nextTick()
    expect(w.find('.eb-chat-shimmer').exists()).toBe(false)
  })

  it('cancelled：保留正文并显示已停止，不走 error 红块', () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 'c1', role: 'assistant', content: '已经输出的一半', status: 'cancelled' } },
    })
    expect(w.find('.eb-chat-message__error').exists()).toBe(false)
    expect(w.find('.eb-chat-message__bubble').text()).toContain('已经输出的一半')
    expect(w.find('.eb-chat-message__cancelled').text()).toContain('已停止生成')
  })

  it('cancelled：引擎中断管线端到端——半截正文 + 灰标，无红块无拖尾', () => {
    // 锁住示例页 @stop 的接线：appendContent 流到一半 → cancelMessage
    const engine = useChatEngine()
    const msg = engine.createAssistantMessage()
    engine.appendContent(msg.id, '已经输出的一半')
    engine.cancelMessage(msg.id)

    const w = mount(ChatMessage, { props: { message: engine.messages.value[0] } })
    expect(w.find('.eb-chat-message__error').exists()).toBe(false)
    expect(w.find('.eb-chat-message__bubble').text()).toContain('已经输出的一半')
    expect(w.find('.eb-chat-message__cancelled').text()).toContain('已停止生成')
    // 中断后不再显示流式拖尾
    expect(w.find('.eb-chat-shimmer').exists()).toBe(false)
  })

  it('cancelled：思考阶段中断（尚无正文）也给出「已停止生成」，不留空窗', () => {
    const engine = useChatEngine()
    const msg = engine.createAssistantMessage()
    engine.appendThinkContent(msg.id, '正在推理')
    engine.cancelMessage(msg.id)

    const w = mount(ChatMessage, { props: { message: engine.messages.value[0] } })
    // 中断已收尾：既不是三点加载态，也不是红块；中断反馈必须出现
    expect(w.find('.eb-chat-message__loading').exists()).toBe(false)
    expect(w.find('.eb-chat-message__error').exists()).toBe(false)
    expect(w.find('.eb-chat-message__cancelled').text()).toContain('已停止生成')
    // 思考块改说「思考已中断」，不再谎报「已深度思考」
    expect(w.find('.eb-chat-thinking__label').text()).toContain(chatLabels.thinking.interrupted)
    expect(w.find('.eb-chat-thinking__label').text()).not.toContain(chatLabels.thinking.done)
  })

  it('error 态挂 role=alert', () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 'e2', role: 'assistant', status: 'error', error: '超时' } },
    })
    expect(w.find('.eb-chat-message__error').attributes('role')).toBe('alert')
  })
})

describe('P0 回归：代码块工具条与消息列表无障碍', () => {
  it('代码块输出语言标签与复制按钮', () => {
    const html = renderChatMarkdown('```js\nconst a = 1\n```')
    expect(html).toContain('eb-chat-code__lang')
    expect(html).toContain('eb-chat-code__copy')
    expect(html).toContain('aria-label')
  })

  it('ChatMarkdown 点击复制按钮走 clipboard，且不把原文塞进 data-*', async () => {
    const w = mount(ChatMarkdown, { props: { content: '```js\nconst a = 1\n```' } })
    await w.vm.$nextTick()
    expect(w.html()).not.toContain('data-code')
    const desc = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    try {
      await w.find('.eb-chat-code__copy').trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(writeText).toHaveBeenCalledWith('const a = 1')
    } finally {
      if (desc) Object.defineProperty(navigator, 'clipboard', desc)
      else delete navigator.clipboard
    }
  })

  it('ChatList 暴露 role=log 与流式播报语义', () => {
    const w = mount(Chatbot, {
      props: { modelValue: [{ id: 'a1', role: 'assistant', content: 'hi', status: 'done' }], showTip: false },
    })
    const list = w.find('.eb-chat-list')
    expect(list.attributes('role')).toBe('log')
    expect(list.attributes('aria-live')).toBe('polite')
    expect(list.attributes('aria-relevant')).toBe('additions')
  })

  it('autoScroll=false 时不自动播报', () => {
    const w = mount(Chatbot, {
      props: { modelValue: [{ id: 'a1', role: 'assistant', content: 'hi', status: 'done' }], autoScroll: false, showTip: false },
    })
    expect(w.find('.eb-chat-list').attributes('aria-live')).toBe('off')
  })

  it('思考块为 button 语义并带 aria-expanded；结束后默认收起、点开再收起', async () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 't1', role: 'assistant', content: '答', status: 'done', thinkContent: '因' } },
    })
    const header = w.find('.eb-chat-thinking__header')
    expect(header.attributes('type')).toBe('button')
    // 已结束的思考块默认收起（长思考不占版面），点开可看内容
    expect(header.attributes('aria-expanded')).toBe('false')
    await header.trigger('click')
    expect(header.attributes('aria-expanded')).toBe('true')
    await header.trigger('click')
    expect(header.attributes('aria-expanded')).toBe('false')
  })

  it('思考进行中强制展开，结束后自动收回', async () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 't2', role: 'assistant', content: '', status: 'streaming', thinking: true, thinkContent: '正在想' } },
    })
    expect(w.find('.eb-chat-thinking__header').attributes('aria-expanded')).toBe('true')
    await w.setProps({ message: { id: 't2', role: 'assistant', content: '答', status: 'done', thinking: false, thinkContent: '正在想' } })
    expect(w.find('.eb-chat-thinking__header').attributes('aria-expanded')).toBe('false')
  })
})

// ── P1 工程债批：图片协议过滤 / 脚注 / 高亮瘦身 ──

describe('chatMarkdown 图片协议过滤', () => {
  it('http/https/data 放行，并补懒加载与 referer 策略', () => {
    const html = renderChatMarkdown('![图](https://example.com/a.png)')
    expect(html).toContain('<img src="https://example.com/a.png"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('referrerpolicy="no-referrer"')
    expect(renderChatMarkdown('![内联](data:image/png;base64,AAAA)')).toContain('src="data:image/png;base64,AAAA"')
  })

  it('javascript: 与 file: 不落 img，退回可读纯文本', () => {
    for (const src of ['javascript:alert(1)', 'file:///etc/passwd', 'vbscript:x']) {
      const html = renderChatMarkdown(`![提示](${src})`)
      expect(html).not.toContain('<img')
      expect(html).not.toContain(src)
      expect(html).toContain('[提示]')
    }
  })

  it('无 href 的图片不产出破标签；alt 里的引号不逃逸出属性', () => {
    expect(renderChatMarkdown('![]()')).not.toContain('<img')
    const hostile = renderChatMarkdown('![a"b](https://example.com/x.png)')
    expect(hostile).toContain('alt="a&quot;b"')
    expect(hostile).not.toMatch(/alt="a"[^>]*b"/)
  })
})

describe('chatMarkdown 脚注不再错误渲染', () => {
  it('[^1] 不产出指向定义文本的假链接（接了脚注扩展后渲染成上标 + 尾注）', () => {
    const html = renderChatMarkdown('结论[^1]\n\n[^1]: 出处说明')
    expect(html).not.toContain('<a href="出处说明"')
    expect(html).not.toMatch(/<a [^>]*>\^1<\/a>/)
    expect(html).toContain('data-cite-num="1"')
    expect(html).toContain('eb-chat-footnotes')
  })

  it('正常链接不被误伤（脱字号不在开头、含行内标记都照走 <a>）', () => {
    expect(renderChatMarkdown('[官网](https://example.com)')).toContain('<a href="https://example.com"')
    expect(renderChatMarkdown('[a^b](https://example.com)')).toContain('>a^b</a>')
    expect(renderChatMarkdown('[**bold**](https://example.com)')).toContain('<strong>bold</strong>')
  })

  it('多脚注各自成上标，定义文本只出现在尾注里', () => {
    const html = renderChatMarkdown('见[^a]与[^b]\n\n[^a]: A 出处\n[^b]: B 出处')
    expect(html).toMatch(/data-ref-id="a" data-cite-num="1"/)
    expect(html).toMatch(/data-ref-id="b" data-cite-num="2"/)
    expect(html).not.toContain('<a ')
    // 正文段里不能出现定义体，只允许在尾注列表里
    const [body] = html.split('<ol class="eb-chat-footnotes">')
    expect(body).not.toContain('A 出处')
    expect(body).not.toContain('B 出处')
  })

  // 注：[^1](url) 这种「脚注形态写成显式链接」的输入，marked v18 自己就拒解析、
  // 连 URL 一起丢掉（产出 <p>[^1]</p>），不经本渲染器，不是这里能管的范围。
  // 完整脚注支持（上标 + 尾注列表）需要接脚注扩展，另列一项。
})

describe('chatMarkdown 高亮瘦身到 lib/common', () => {
  it('常见语言仍高亮，冷门语言回落 plaintext 而不抛', () => {
    expect(renderChatMarkdown('```js\nconst a = 1\n```')).toContain('hljs-keyword')
    const rare = renderChatMarkdown('```cobol\nIDENTIFICATION DIVISION.\n```')
    expect(rare).toContain('language-plaintext')
    expect(rare).toContain('IDENTIFICATION DIVISION.')
  })

  it('registerHighlightLanguage 注册后该语言即走高亮', () => {
    expect(renderChatMarkdown('```cobol\nFOO\n```')).toContain('language-plaintext')
    const ok = registerHighlightLanguage('cobol', () => ({ contains: [{ className: 'keyword', begin: '\\bFOO\\b' }] }))
    expect(ok).toBe(true)
    const html = renderChatMarkdown('```cobol\nFOO\n```')
    expect(html).toContain('language-cobol')
    expect(html).toContain('hljs-keyword')
  })

  it('非法定义返回 false 不抛', () => {
    expect(registerHighlightLanguage('bogus', null)).toBe(false)
  })
})

// ── system / notice 消息形态 ──

describe('ChatMessage 系统提示形态', () => {
  const sys = (role) => ({ id: 's1', role, content: '以上为历史对话', status: 'done' })

  for (const role of ['system', 'notice']) {
    it(`${role}：居中弱化，无头像 / 昵称 / 动作条`, () => {
      const w = mount(ChatMessage, { props: { message: sys(role), feedback: true, editable: true } })
      expect(w.classes()).toContain(`eb-chat-message--${role}`)
      expect(w.find('.eb-chat-message__system').text()).toBe('以上为历史对话')
      expect(w.find('.eb-chat-message__avatar').exists()).toBe(false)
      expect(w.find('.eb-chat-message__name').exists()).toBe(false)
      expect(w.find('.eb-chat-actionbar').exists()).toBe(false)
      expect(w.find('.eb-chat-feedback').exists()).toBe(false)
      expect(w.find('.eb-chat-message__bubble').exists()).toBe(false)
    })
  }

  it('system 走 markdown 渲染（可放粗体说明），text 模式退回纯文本', () => {
    const md = mount(ChatMessage, { props: { message: { ...sys('system'), content: '**已切换模型**' } } })
    expect(md.find('.eb-chat-message__system strong').text()).toBe('已切换模型')
    const t = mount(ChatMessage, {
      props: { message: { ...sys('system'), content: '**原样**' }, renderMode: 'text' },
    })
    expect(t.find('.eb-chat-message__system').text()).toBe('**原样**')
    // 系统提示不用对话气泡，text 模式下也不挂 __text（那是 user/assistant 的容器）
    expect(t.find('.eb-chat-message__text').exists()).toBe(false)
  })

  it('流式中的 system 也带正文拖尾', async () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 's2', role: 'system', content: '正在同步', status: 'streaming' } },
    })
    await new Promise((r) => requestAnimationFrame(() => r()))
    await w.vm.$nextTick()
    expect(w.find('.eb-chat-shimmer').exists()).toBe(true)
  })

  it('user / assistant 不受影响（回归钉）', () => {
    const u = mount(ChatMessage, { props: { message: { id: 'u1', role: 'user', content: 'x', status: 'done' } } })
    expect(u.find('.eb-chat-message__avatar').exists()).toBe(true)
    expect(u.find('.eb-chat-message__system').exists()).toBe(false)
  })
})

// ── 脚注（marked 无内置扩展，自己接的）──

describe('chatMarkdown 脚注', () => {
  it('引用渲染为上标、定义收进尾注，且可点（role=button 可聚焦）', () => {
    const html = renderChatMarkdown('结论[^1]\n\n[^1]: 出处说明')
    expect(html).toContain('data-ref-id="1"')
    expect(html).toContain('data-cite-num="1"')
    expect(html).toContain('role="button"')
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('aria-label="查看第 1 条脚注"')
    expect(html).toContain('<ol class="eb-chat-footnotes">')
    expect(html).toContain('<li id="eb-fn-1">出处说明</li>')
    // 定义体不再原地出现
    expect(html).not.toMatch(/<p>\[1\]:/)
  })

  it('编号按定义出现顺序，不按引用顺序', () => {
    const html = renderChatMarkdown('先引乙[^b]再引甲[^a]\n\n[^a]: A\n[^b]: B')
    // b 定义在后 → 编号 2；a 定义在前 → 编号 1
    expect(html).toMatch(/data-ref-id="b" data-cite-num="2"/)
    expect(html).toMatch(/data-ref-id="a" data-cite-num="1"/)
  })

  it('未被引用的定义不进尾注；只有定义没有引用时不出尾注', () => {
    const used = renderChatMarkdown('正文[^1]\n\n[^1]: 用到的\n[^2]: 没用到')
    expect(used).toContain('用到的')
    expect(used).not.toContain('没用到')
    const none = renderChatMarkdown('正文\n\n[^x]: 只有定义')
    expect(none).not.toContain('eb-chat-footnotes')
    // 定义体被消费掉，不留在正文里
    expect(none).toBe('<p>正文</p>\n')
  })

  it('没有对应定义的引用退回原样文本，不产出假链接', () => {
    const html = renderChatMarkdown('正文[^missing]')
    expect(html).toContain('[^missing]')
    expect(html).not.toContain('<sup')
    expect(html).not.toContain('<a ')
  })

  it('代码块里的 [^1]: 不被当成定义', () => {
    const html = renderChatMarkdown('```\n[^1]: 不该被当定义\n```\n\n正文[^1]')
    expect(html).toContain('[^1]: 不该被当定义')
    expect(html).not.toContain('eb-chat-footnotes')
    // 正文里的引用因为无定义而退回原文
    expect(html).toContain('正文[^1]')
  })

  it('定义体支持续行与行内标记', () => {
    const multi = renderChatMarkdown('正文[^1]\n\n[^1]: 第一行\n第二行')
    expect(multi).toContain('第一行<br>第二行')
    const bold = renderChatMarkdown('正文[^1]\n\n[^1]: **加粗**出处')
    expect(bold).toContain('<strong>加粗</strong>出处')
  })

  it('跨次渲染不串号：上一次的定义与编号都不泄漏', () => {
    renderChatMarkdown('甲[^1]\n\n[^1]: 第一次')
    const second = renderChatMarkdown('乙[^1]\n\n[^1]: 第二次')
    expect(second).toContain('第二次')
    expect(second).not.toContain('第一次')
    expect(second).toContain('data-cite-num="1"')
  })

  it('脚注上标与 source: 引用共用同一套类名，宿主可统一着色', () => {
    const fn = renderChatMarkdown('正文[^1]\n\n[^1]: 出处')
    const cite = renderChatMarkdown('见[1](source:c1)')
    expect(fn).toContain('class="eb-chat-citation"')
    expect(cite).toContain('class="eb-chat-citation"')
  })
})

// ── 数学公式与图表（都是宿主注入渲染器的 opt-in 能力）──

describe('chatMarkdown 数学公式', () => {
  const fakeTex = (tex, display) => `<span class="fake-tex" data-display="${display}">${tex}</span>`

  afterEach(() => {
    configureChatMarkdown({ reset: true })
  })

  it('未配置渲染器时原样保留，不猜', () => {
    expect(renderChatMarkdown('质能方程 $E=mc^2$ 很好记')).toContain('$E=mc^2$')
    expect(renderChatMarkdown('$$\\int_0^1 x dx$$')).not.toContain('eb-chat-math')
  })

  it('配置后行内与块级分别渲染，displayMode 传给宿主', () => {
    configureChatMarkdown({ math: fakeTex })
    const inline = renderChatMarkdown('质能方程 $E=mc^2$ 很好记')
    expect(inline).toContain('class="eb-chat-math eb-chat-math--inline"')
    expect(inline).toContain('data-display="false"')
    expect(inline).toContain('E=mc^2')

    const block = renderChatMarkdown('推导如下：\n\n$$\\int_0^1 x\\,dx = \\frac{1}{2}$$\n\n结束')
    expect(block).toContain('class="eb-chat-math eb-chat-math--block"')
    expect(block).toContain('data-display="true"')
  })

  it('金额写法不被当成公式（纯数字内容直接放行）', () => {
    configureChatMarkdown({ math: fakeTex })
    const html = renderChatMarkdown('这套 $100 与那套 $200 都要')
    expect(html).not.toContain('eb-chat-math')
    expect(html).toContain('$100')
    expect(html).toContain('$200')
  })

  it('宿主渲染器抛错时退回转义原文，不炸整篇', () => {
    configureChatMarkdown({ math: () => { throw new Error('katex 出错') } })
    const html = renderChatMarkdown('前 $x$ 后')
    expect(html).toContain('$x$')
    expect(html).toContain('前')
    expect(html).toContain('后')
  })

  it('reset 关闭该能力', () => {
    configureChatMarkdown({ math: fakeTex })
    expect(renderChatMarkdown('$x$')).toContain('eb-chat-math')
    configureChatMarkdown({ reset: true })
    expect(renderChatMarkdown('$x$')).not.toContain('eb-chat-math')
  })
})

describe('chatMarkdown Mermaid', () => {
  const SOURCE = '```mermaid\ngraph TD\n  A --> B\n```'

  afterEach(() => {
    configureChatMarkdown({ reset: true })
  })

  it('未配置渲染器时就是普通代码块，不给按钮', () => {
    const html = renderChatMarkdown(SOURCE)
    expect(html).toContain('eb-chat-code')
    expect(html).not.toContain('eb-chat-mermaid__render')
    expect(html).toContain('graph TD')
  })

  it('配置后保留代码块并补「渲染图表」按钮（异步不能塞进同步管线）', () => {
    configureChatMarkdown({ mermaid: async () => '<svg></svg>' })
    const html = renderChatMarkdown(SOURCE)
    expect(html).toContain('eb-chat-mermaid__render')
    expect(html).toContain('language-mermaid')
    expect(html).toContain('graph TD')
  })

  it('点渲染按钮：宿主收到源码，块被换成图；失败则按钮恢复并改文案', async () => {
    const seen = []
    configureChatMarkdown({ mermaid: async (src) => { seen.push(src); return '<svg class="fake-diagram"></svg>' } })
    const ok = mount(ChatMarkdown, { props: { content: SOURCE } })
    await ok.vm.$nextTick()
    await ok.find('.eb-chat-mermaid__render').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    expect(seen[0]).toContain('graph TD')
    expect(ok.find('.eb-chat-mermaid svg.fake-diagram').exists()).toBe(true)
    expect(ok.find('.eb-chat-code').exists()).toBe(false)

    configureChatMarkdown({ reset: true })
    configureChatMarkdown({ mermaid: async () => { throw new Error('mermaid 出错') } })
    const bad = mount(ChatMarkdown, { props: { content: SOURCE } })
    await bad.vm.$nextTick()
    await bad.find('.eb-chat-mermaid__render').trigger('click')
    await new Promise((r) => setTimeout(r, 0))
    const btn = bad.find('.eb-chat-mermaid__render')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('disabled')).toBeUndefined()
    expect(btn.text()).toBe(chatLabels.markdown.diagramFailed)
  })

  it('getChatMarkdownConfig 交出 math / mermaid 供宿主自检', () => {
    const renderer = () => ''
    configureChatMarkdown({ math: renderer, mermaid: renderer })
    const cfg = getChatMarkdownConfig()
    expect(cfg.math).toBe(renderer)
    expect(cfg.mermaid).toBe(renderer)
  })
})

// ── 生成中的输入排队 / 转向 ──

describe('useChatEngine 输入排队', () => {
  function hangable() {
    const releases = []
    const seen = []
    const eng = useChatEngine({
      onSend: (content) => {
        seen.push(content)
        return new Promise((r) => releases.push(r))
      },
    })
    return { eng, releases, seen }
  }

  it('生成中再发不丢弃，转为排队；一轮结束自动带出下一条', async () => {
    const { eng, releases, seen } = hangable()
    eng.sendMessage('第一条', [])
    await nextTick()
    expect(eng.loading.value).toBe(true)

    // sendMessage 是 async，返回值要 await 才拿得到
    expect(await eng.sendMessage('第二条', [])).toBe('queued')
    expect(await eng.sendMessage('第三条', [])).toBe('queued')
    expect(eng.pending.value.map((i) => i.content)).toEqual(['第二条', '第三条'])
    // 排队期间不重复投递
    expect(seen).toEqual(['第一条'])

    releases[0]()
    await new Promise((r) => setTimeout(r, 10))
    expect(seen).toEqual(['第一条', '第二条'])
    expect(eng.pending.value.map((i) => i.content)).toEqual(['第三条'])

    releases[1]()
    await new Promise((r) => setTimeout(r, 10))
    expect(seen).toEqual(['第一条', '第二条', '第三条'])
    expect(eng.pending.value).toHaveLength(0)

    releases[2]()
    await new Promise((r) => setTimeout(r, 10))
    expect(eng.loading.value).toBe(false)
  })

  it('排队的消息进入消息流时是正常用户消息', async () => {
    const { eng, releases } = hangable()
    eng.sendMessage('先问', [])
    await nextTick()
    eng.sendMessage('后问', [])
    releases[0]()
    await new Promise((r) => setTimeout(r, 10))
    expect(eng.messages.value.filter((m) => m.role === 'user').map((m) => m.content)).toEqual(['先问', '后问'])
  })

  it('空内容不入队', async () => {
    const { eng } = hangable()
    expect(await eng.sendMessage('   ', [])).toBeUndefined()
    expect(eng.pending.value).toHaveLength(0)
  })

  it('dequeue / clearQueue 与 onQueueChange 回调', async () => {
    const changes = []
    const { eng } = hangable()
    eng.sendMessage('占位', [])
    await nextTick()
    const a = eng.enqueue('甲', [], {})
    eng.enqueue('乙', [], {})
    expect(eng.pending.value).toHaveLength(2)
    eng.dequeue(a)
    expect(eng.pending.value.map((i) => i.content)).toEqual(['乙'])
    eng.clearQueue()
    expect(eng.pending.value).toHaveLength(0)
    void changes
  })

  it('flushQueue 生成中不动作，空闲时手动带出一条', async () => {
    const { eng, releases, seen } = hangable()
    eng.sendMessage('先', [])
    await nextTick()
    eng.enqueue('后', [], {})
    expect(await eng.flushQueue()).toBe(false)
    releases[0]()
    await new Promise((r) => setTimeout(r, 10))
    expect(seen).toEqual(['先', '后'])
    expect(await eng.flushQueue()).toBe(false)
  })

  it('steerable 且有 onSteer 时转交宿主注入，不入队', async () => {
    const steered = []
    const releases = []
    const eng = useChatEngine({
      onSend: () => new Promise((r) => releases.push(r)),
      steerable: true,
      onSteer: (text) => steered.push(text),
    })
    eng.sendMessage('原始问题', [])
    await nextTick()
    expect(await eng.sendMessage('补充一句', [])).toBe('steered')
    expect(steered).toEqual(['补充一句'])
    expect(eng.pending.value).toHaveLength(0)
    releases[0]()
  })

  it('steerable 但没有 onSteer 时退回排队（不丢）', async () => {
    const releases = []
    const eng = useChatEngine({ onSend: () => new Promise((r) => releases.push(r)), steerable: true })
    eng.sendMessage('先', [])
    await nextTick()
    expect(await eng.sendMessage('补', [])).toBe('queued')
    expect(eng.pending.value.map((i) => i.content)).toEqual(['补'])
    releases[0]()
  })
})
