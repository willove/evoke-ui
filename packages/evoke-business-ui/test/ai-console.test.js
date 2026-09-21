import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EbAiConsole from '../src/components/ai-console/index.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'
import { useChatSessions } from '../src/components/chatbot/useChatSessions'
import ChatThreads from '../src/components/chatbot/ChatThreads.vue'

/**
 * AI 工作台：欢迎区（高亮词渐变拆分）/ 示例问题（send / fill 两态）/
 * 会话区接线（engine 收支）/ PromptBox 上下文透传
 */

const WELCOME = { title: '欢迎体验文本生成，今天你想创造什么？', highlight: '文本生成' }

function mountConsole(props = {}, slots = {}) {
  return mount(EbAiConsole, {
    slots,
    props: {
      welcome: WELCOME,
      examples: ['请把“不要香菜”翻译成英文', { text: '写一首诗', prompt: '以秋天为主题写一首五言绝句' }],
      showTip: false,
      ...props,
    },
    attachTo: document.body,
  })
}

async function flush(wrapper, ms = 30) {
  await new Promise((r) => setTimeout(r, ms))
  return wrapper
}

describe('EbAiConsole 欢迎区', () => {
  it('标题 + 高亮词拆分渲染', () => {
    const wrapper = mountConsole()
    const title = wrapper.find('.eb-ai-console__title')
    expect(title.text()).toBe(WELCOME.title)
    expect(wrapper.find('.eb-ai-console__title-highlight').text()).toBe('文本生成')
    wrapper.unmount()
  })

  it('无 welcome.title 时不渲染标题', () => {
    const wrapper = mountConsole({ welcome: null })
    expect(wrapper.find('.eb-ai-console__title').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('EbAiConsole 示例问题', () => {
  it('默认 send：点击直发，onSend 收到完整 context，欢迎区收起', async () => {
    const onSend = vi.fn(async () => {})
    const wrapper = mountConsole({ transport: onSend })
    await flush(wrapper)
    const examples = wrapper.findAll('.eb-ai-console__example')
    expect(examples.length).toBe(2)
    await examples[1].trigger('click')
    await flush(wrapper)
    expect(onSend).toHaveBeenCalledTimes(1)
    const [content, attachments, context] = onSend.mock.calls[0]
    expect(content).toBe('以秋天为主题写一首五言绝句')
    expect(attachments).toEqual([])
    expect(context).toEqual({ scene: '', capabilities: [], model: '' })
    // transport 未造 assistant → 仅 user 消息入列，但欢迎区照样收起
    expect(wrapper.vm.engine.messages.value.length).toBe(1)
    expect(wrapper.vm.engine.messages.value[0].role).toBe('user')
    expect(wrapper.find('.eb-ai-console__welcome').exists()).toBe(false)
    wrapper.unmount()
  })

  it('fill 模式：仅填充不发送', async () => {
    const onSend = vi.fn()
    const wrapper = mountConsole({ transport: onSend, exampleAction: 'fill' })
    await wrapper.findAll('.eb-ai-console__example')[0].trigger('click')
    await flush(wrapper)
    expect(onSend).not.toHaveBeenCalled()
    expect(wrapper.find('.eb-ai-prompt-box__textarea').element.value).toBe('请把“不要香菜”翻译成英文')
    expect(wrapper.vm.engine.messages.value.length).toBe(0)
    wrapper.unmount()
  })
})

describe('EbAiConsole 引擎接线', () => {
  it('PromptBox 发送透传上下文到 onSend', async () => {
    const onSend = vi.fn(async () => {})
    const wrapper = mountConsole({
      transport: onSend,
      scenes: [{ key: 'write', label: '创意写作' }],
      capabilities: [{ key: 'web', label: '联网搜索' }],
      models: [{ key: 'qwen-max', label: 'Qwen3.8-Max' }],
    })
    await flush(wrapper)
    // 选场景 + 手输发送
    await wrapper.findAll('.eb-ai-prompt-box__scene-chip')[0].trigger('click')
    await flush(wrapper)
    const textarea = wrapper.find('.eb-ai-prompt-box__textarea')
    await textarea.setValue('自定义问题')
    await textarea.trigger('keydown', { key: 'Enter' })
    await flush(wrapper)
    expect(onSend).toHaveBeenCalledTimes(1)
    const [content, , context] = onSend.mock.calls[0]
    expect(content).toBe('自定义问题')
    expect(context.scene).toBe('write')
    expect(context.capabilities).toEqual([])
    wrapper.unmount()
  })

  it('外部 engine 受控：消息写入外部实例', async () => {
    const external = useChatEngine({})
    const onSend = vi.fn(async () => {})
    const wrapper = mountConsole({ engine: external, transport: onSend })
    await flush(wrapper)
    await wrapper.findAll('.eb-ai-console__example')[0].trigger('click')
    await flush(wrapper)
    expect(external.messages.value.length).toBe(1)
    // Console expose 的 engine 即外部实例
    expect(wrapper.vm.engine.messages).toBe(external.messages)
    wrapper.unmount()
  })

  it('流式回写：assistant 内容经引擎逐步进入消息列表', async () => {
    let eng = null
    const onSend = async (content) => {
      const msg = eng.createAssistantMessage()
      eng.appendContent(msg.id, '你好')
      eng.appendContent(msg.id, '，世界')
      eng.completeMessage(msg.id)
    }
    const wrapper = mountConsole({ transport: onSend })
    eng = wrapper.vm.engine
    await flush(wrapper)
    await wrapper.findAll('.eb-ai-console__example')[0].trigger('click')
    await flush(wrapper)
    const msgs = wrapper.vm.engine.messages.value
    expect(msgs.length).toBe(2)
    expect(msgs[1].role).toBe('assistant')
    expect(msgs[1].content).toBe('你好，世界')
    expect(msgs[1].status).toBe('done')
    wrapper.unmount()
  })

  it('stoppable：停止事件透传', async () => {
    const onStop = vi.fn()
    const wrapper = mountConsole({ stoppable: true, loading: true, onStop })
    await flush(wrapper)
    await wrapper.find('.eb-ai-prompt-box__send').trigger('click')
    expect(wrapper.emitted('stop')).toBeTruthy()
    wrapper.unmount()
  })

  it('expose clear：清空会话后欢迎区回归', async () => {
    const onSend = vi.fn(async () => {})
    const wrapper = mountConsole({ transport: onSend })
    await flush(wrapper)
    await wrapper.findAll('.eb-ai-console__example')[0].trigger('click')
    await flush(wrapper)
    expect(wrapper.vm.engine.messages.value.length).toBe(1)
    wrapper.vm.clear()
    await flush(wrapper)
    expect(wrapper.find('.eb-ai-console__welcome').exists()).toBe(true)
    wrapper.unmount()
  })
})

// ── 会话区接线回归（此前无覆盖，三处缺陷因此漏过） ──

describe('EbAiConsole 会话区接线', () => {
  async function withConversation(extraProps = {}) {
    const sent = []
    const wrapper = mountConsole({
      transport: (content) => { sent.push(content) },
      ...extraProps,
    })
    const eng = wrapper.vm.engine
    eng.addUserMessage('原始提问', [])
    const a = eng.createAssistantMessage()
    eng.appendContent(a.id, '回答')
    eng.completeMessage(a.id)
    await wrapper.vm.$nextTick()
    return { eng, sent, wrapper }
  }

  it('重新生成：动作条点击真的重跑 transport（对象当 id 传曾是死按钮）', async () => {
    const { eng, sent, wrapper } = await withConversation()
    const assistant = wrapper.findAllComponents({ name: 'ChatMessage' })
      .find((m) => m.props('message')?.role === 'assistant')
    const btns = assistant.findAll('.eb-chat-actionbar__btn')
    await btns[1].trigger('click')
    await flush(wrapper, 30)
    expect(sent).toEqual(['原始提问'])
    // 截断后由引擎重新追加一轮用户提问
    expect(eng.messages.value.at(-1).role).toBe('user')
    expect(wrapper.emitted('regenerate')?.[0][0].content).toBe('回答')
    wrapper.unmount()
  })

  it('action 转发保留 (key, message) 两参', async () => {
    const { wrapper } = await withConversation({ actions: [{ key: 'collect', label: '收藏' }] })
    const list = wrapper.findComponent({ name: 'ChatList' })
    const target = { id: 'a', role: 'assistant', content: 'x', status: 'done' }
    list.vm.$emit('action', 'collect', target)
    await wrapper.vm.$nextTick()
    const evt = wrapper.emitted('action')
    expect(evt[0]).toEqual(['collect', target])
    wrapper.unmount()
  })

  it('头像与昵称透传到会话区（此前 ChatList 未接这几个 prop）', async () => {
    const { wrapper } = await withConversation({
      userName: '王工',
      assistantName: '小 Ev',
      avatarAssistant: 'https://example.com/a.png',
    })
    const assistant = wrapper.findAllComponents({ name: 'ChatMessage' })
      .find((m) => m.props('message')?.role === 'assistant')
    expect(assistant.props('assistantName')).toBe('小 Ev')
    expect(assistant.props('avatarAssistant')).toBe('https://example.com/a.png')
    wrapper.unmount()
  })

  it('已知边界：传外部 engine 时 Console 的 transport 不参与（引擎自带 onSend 才生效）', async () => {
    const external = useChatEngine({})
    const onSend = vi.fn()
    const wrapper = mountConsole({ engine: external, transport: onSend })
    await flush(wrapper)
    await wrapper.findAll('.eb-ai-console__example')[0].trigger('click')
    await flush(wrapper)
    expect(external.messages.value.length).toBe(1)
    expect(onSend).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

// ── 批 D：sessions 模式（多会话接入） ──

describe('EbAiConsole sessions 模式', () => {
  function boot() {
    const seen = []
    const sessions = useChatSessions({
      initialThreads: [
        { id: 's1', title: '甲会话', messages: [{ id: 's1-m1', role: 'user', content: '甲的提问', status: 'done' }] },
        { id: 's2', title: '乙会话', messages: [{ id: 's2-m1', role: 'assistant', content: '乙的回答', status: 'done' }] },
      ],
      activeId: 's1',
      transport: (content, _a, _c, meta) => {
        seen.push([content, meta.threadId])
        const engine = sessions.engineOf(meta.threadId)
        const msg = engine.createAssistantMessage()
        engine.appendContent(msg.id, `答：${content}`)
        engine.completeMessage(msg.id)
      },
    })
    const wrapper = mountConsole({ sessions, showTip: false })
    return { sessions, seen, wrapper }
  }

  it('不传 sessions 时仍是单栏（非破坏钉）', () => {
    const w = mountConsole({ showTip: false })
    expect(w.find('.eb-ai-console__threads').exists()).toBe(false)
    expect(w.classes()).not.toContain('has-threads')
    expect(w.find('.eb-ai-console__main').exists()).toBe(true)
    w.unmount()
  })

  it('传 sessions 时渲染列表，当前会话的消息进入会话区', async () => {
    const { wrapper } = boot()
    await flush(wrapper)
    expect(wrapper.classes()).toContain('has-threads')
    expect(wrapper.findAll('.eb-chat-threads__item')).toHaveLength(2)
    // 当前会话预置了历史：欢迎区直接收起，不是等本次会话首次发送才收
    expect(wrapper.find('.eb-ai-console__welcome').exists()).toBe(false)
    expect(wrapper.text()).toContain('甲的提问')
    expect(wrapper.text()).not.toContain('乙的回答')
    wrapper.unmount()
  })

  it('切会话后展示对应消息，互不串台', async () => {
    const { wrapper } = boot()
    await flush(wrapper)
    const items = wrapper.findAll('.eb-chat-threads__trigger')
    await items[1].trigger('click')
    await flush(wrapper)
    expect(wrapper.text()).toContain('乙的回答')
    expect(wrapper.text()).not.toContain('甲的提问')
    wrapper.unmount()
  })

  it('发送经 sessions：自动起标题并带上 threadId', async () => {
    const { sessions, seen, wrapper } = boot()
    await flush(wrapper)
    sessions.rename('s1', '')
    await wrapper.find('.eb-ai-prompt-box__textarea').setValue('帮我理一下这批工单')
    await wrapper.find('.eb-ai-prompt-box__textarea').trigger('keydown', { key: 'Enter' })
    await flush(wrapper)
    expect(seen.at(-1)[1]).toBe('s1')
    expect(sessions.threads.value.find((t) => t.id === 's1').title).toBe('帮我理一下这批工单')
    wrapper.unmount()
  })

  it('expose clear 清空全部会话而不是仅清当前', async () => {
    const { sessions, wrapper } = boot()
    await flush(wrapper)
    wrapper.vm.clear()
    await flush(wrapper)
    expect(sessions.threads.value).toHaveLength(0)
    wrapper.unmount()
  })

  it('切到没有历史的会话时欢迎区回归，切回有历史的再收起', async () => {
    const sessions = useChatSessions({
      initialThreads: [
        { id: 'has', title: '有历史', messages: [{ id: 'm1', role: 'user', content: '旧话', status: 'done' }] },
        { id: 'blank', title: '空会话', messages: [] },
      ],
      activeId: 'has',
    })
    const w = mountConsole({ sessions, welcome: WELCOME, showTip: false })
    await flush(w)
    expect(w.find('.eb-ai-console__welcome').exists()).toBe(false)
    const triggers = w.findAll('.eb-chat-threads__trigger')
    await triggers[1].trigger('click')
    await flush(w)
    expect(w.find('.eb-ai-console__welcome').exists()).toBe(true)
    await w.findAll('.eb-chat-threads__trigger')[0].trigger('click')
    await flush(w)
    expect(w.find('.eb-ai-console__welcome').exists()).toBe(false)
    w.unmount()
  })

  it('#threads 插槽可整块替换侧栏', async () => {
    const sessions = useChatSessions({ initialThreads: [{ id: 'x', title: 'X' }], activeId: 'x' })
    const w = mountConsole(
      { sessions, showTip: false },
      { threads: '<div class="my-sidebar">自定义侧栏</div>' },
    )
    await flush(w)
    expect(w.find('.my-sidebar').text()).toBe('自定义侧栏')
    expect(w.findComponent(ChatThreads).exists()).toBe(false)
    w.unmount()
  })
})
