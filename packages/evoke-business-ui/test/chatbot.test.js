import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import ChatAttachments from '../src/components/chatbot/ChatAttachments.vue'
import ChatSender from '../src/components/chatbot/ChatSender.vue'
import ChatMarkdown from '../src/components/chatbot/ChatMarkdown.vue'
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

  it('思考块为 button 语义并带 aria-expanded', async () => {
    const w = mount(ChatMessage, {
      props: { message: { id: 't1', role: 'assistant', content: '答', status: 'done', thinkContent: '因' } },
    })
    const header = w.find('.eb-chat-thinking__header')
    expect(header.attributes('type')).toBe('button')
    expect(header.attributes('aria-expanded')).toBeDefined()
    await header.trigger('click')
    expect(header.attributes('aria-expanded')).toBe('false')
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
  it('[^1] 不产出指向定义文本的假链接，退回原样文本', () => {
    const html = renderChatMarkdown('结论[^1]\n\n[^1]: 出处说明')
    expect(html).not.toContain('<a href="出处说明"')
    expect(html).not.toMatch(/<a [^>]*>\^1<\/a>/)
    expect(html).toContain('[^1]')
  })

  it('正常链接不被误伤（脱字号不在开头、含行内标记都照走 <a>）', () => {
    expect(renderChatMarkdown('[官网](https://example.com)')).toContain('<a href="https://example.com"')
    expect(renderChatMarkdown('[a^b](https://example.com)')).toContain('>a^b</a>')
    expect(renderChatMarkdown('[**bold**](https://example.com)')).toContain('<strong>bold</strong>')
  })

  it('多脚注各自退回原样，且定义文本不泄漏成正文', () => {
    const html = renderChatMarkdown('见[^a]与[^b]\n\n[^a]: A\n[^b]: B')
    expect(html).toContain('[^a]')
    expect(html).toContain('[^b]')
    expect(html).not.toContain('<a ')
    expect(html).not.toMatch(/>A<|>B</)
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
