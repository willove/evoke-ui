import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EbAiConsole from '../src/components/ai-console/index.vue'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'

/**
 * AI 工作台：欢迎区（高亮词渐变拆分）/ 示例问题（send / fill 两态）/
 * 会话区接线（engine 收支）/ PromptBox 上下文透传
 */

const WELCOME = { title: '欢迎体验文本生成，今天你想创造什么？', highlight: '文本生成' }

function mountConsole(props = {}) {
  return mount(EbAiConsole, {
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
