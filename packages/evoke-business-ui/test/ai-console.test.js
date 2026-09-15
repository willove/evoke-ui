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
