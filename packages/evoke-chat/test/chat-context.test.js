import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, effectScope } from 'vue'
import ChatContextMeter from '../src/components/chatbot/ChatContextMeter.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import EbAiConsole from '../src/components/ai-console/index.vue'
import { useChatSession } from '../src/components/chatbot/useChatSession'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 上下文占用环：拿不到窗口容量就不显示；环 + 百分比 + 三段构成（系统/工具/消息）
 */

const CIRC = +(2 * Math.PI * 6.5).toFixed(2)

describe('EbChatContextMeter', () => {
  it('缺 used 或 capacity 时不出现（画个环只会误导）', () => {
    expect(mount(ChatContextMeter, { props: {} }).find('.eb-chat-context').exists()).toBe(false)
    expect(mount(ChatContextMeter, { props: { used: 1000 } }).find('.eb-chat-context').exists()).toBe(false)
    expect(mount(ChatContextMeter, { props: { capacity: 128000 } }).find('.eb-chat-context').exists()).toBe(false)
  })

  it('百分比与弧长按 used/capacity 算，aria 可读', () => {
    const w = mount(ChatContextMeter, { props: { used: 64000, capacity: 128000 } })
    const meter = w.find('.eb-chat-context')
    expect(w.find('.eb-chat-context__percent').text()).toBe('50%')
    expect(meter.attributes('aria-label')).toBe(chatLabels.context.aria(50))
    const arc = w.find('.eb-chat-context__arc')
    expect(arc.attributes('stroke-dasharray')).toBe(String(CIRC))
    expect(Number(arc.attributes('stroke-dashoffset'))).toBeCloseTo(CIRC / 2, 1)
  })

  it('阈值 65 / 85：64% 安静、65% 警告、85% 危险；hover 摘要给总量与三段构成', () => {
    const at = (used) => mount(ChatContextMeter, { props: { used, capacity: 100000, breakdown: { system: 1000, tools: 500, messages: 500 } } })
    expect(at(64000).find('.eb-chat-context').classes()).toEqual(expect.not.arrayContaining(['is-warn', 'is-danger']))
    expect(at(65000).find('.eb-chat-context').classes()).toContain('is-warn')
    expect(at(84000).find('.eb-chat-context').classes()).toContain('is-warn')
    expect(at(85000).find('.eb-chat-context').classes()).toContain('is-danger')
    expect(at(64000).find('.eb-chat-context').attributes('title')).toContain('~64.0k / 100.0k')
    expect(at(64000).find('.eb-chat-context').attributes('title')).toContain(chatLabels.context.system)
  })

  it('超过窗口封顶 100%，并按阈值换语义色', () => {
    const over = mount(ChatContextMeter, { props: { used: 200000, capacity: 128000 } })
    expect(over.find('.eb-chat-context__percent').text()).toBe('100%')
    expect(over.find('.eb-chat-context').classes()).toContain('is-danger')

    const warn = mount(ChatContextMeter, { props: { used: 102400, capacity: 128000 } })
    expect(warn.find('.eb-chat-context').classes()).toContain('is-warn')

    const calm = mount(ChatContextMeter, { props: { used: 12800, capacity: 128000 } })
    expect(calm.find('.eb-chat-context').classes()).toEqual(expect.not.arrayContaining(['is-warn', 'is-danger']))
  })

  it('点开后给「已用/窗口」与三段构成（宽度按比例、数值折算）', async () => {
    const w = mount(ChatContextMeter, {
      props: {
        used: 40000,
        capacity: 128000,
        breakdown: { system: 8000, tools: 4000, messages: 28000 },
      },
      attachTo: document.body,
    })
    await w.find('.eb-chat-context').trigger('click')
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))
    const panel = document.body.querySelector('.eb-chat-context__panel')
    expect(panel).toBeTruthy()
    expect(panel.textContent).toContain(chatLabels.context.used)
    expect(panel.textContent).toContain('~40.0k')
    expect(panel.textContent).toContain('128.0k')
    const segs = [...panel.querySelectorAll('.eb-chat-context__bar-seg')]
    expect(segs.map((s) => s.className.split('is-')[1].trim())).toEqual(['system', 'tools', 'messages'])
    expect(segs[2].style.width).toBe('70%')
    const legend = [...panel.querySelectorAll('.eb-chat-context__legend-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim())
    expect(legend[0]).toContain(chatLabels.context.system)
    expect(legend[0]).toContain('8.0k')
    w.unmount()
  })

  it('没有构成数据时不画条形与图例，只留总量', async () => {
    const w = mount(ChatContextMeter, { props: { used: 1000, capacity: 128000 }, attachTo: document.body })
    await w.find('.eb-chat-context').trigger('click')
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))
    const panel = document.body.querySelector('.eb-chat-context__panel')
    expect(panel.querySelector('.eb-chat-context__bar')).toBeNull()
    expect(panel.querySelector('.eb-chat-context__legend')).toBeNull()
    w.unmount()
  })
})

describe('占用环接线', () => {
  it('EbChatbot / EbAiConsole：给了 context 才渲染', async () => {
    const none = mount(Chatbot, { props: { modelValue: [] } })
    expect(none.findComponent(ChatContextMeter).exists()).toBe(false)

    const w = mount(Chatbot, {
      props: { modelValue: [], context: { used: 64000, capacity: 128000 } },
    })
    expect(w.findComponent(ChatContextMeter).exists()).toBe(true)
    expect(w.find('.eb-chatbot__context').text()).toContain('50%')

    const console_ = mount(EbAiConsole, {
      props: { showTip: false, context: { used: 12800, capacity: 128000 } },
    })
    expect(console_.findComponent(ChatContextMeter).exists()).toBe(true)
    // 占用环不再占输入区一行：它经 #toolbar-meta 渲染在输入台工具栏右侧
    expect(console_.find('.eb-ai-console__context').exists()).toBe(false)
    const toolbarRight = console_.find('.eb-ai-prompt-box__toolbar-right')
    expect(toolbarRight.findComponent(ChatContextMeter).exists()).toBe(true)
    expect(toolbarRight.text()).toContain('10%')
  })

  it('useChatSession：context/usage 遥测更新占用且不污染日志', () => {
    const scope = effectScope()
    const session = scope.run(() => useChatSession({ transport: {}, sessionId: 's1' }))
    session.open({ cursor: 0, records: [] })

    session.receive({ type: 'context/usage', transient: true, data: { used: 32000, capacity: 128000, breakdown: { system: 8000 } } })
    expect(session.context.value).toMatchObject({ used: 32000, capacity: 128000 })
    // 增量合并：只报 used 时保留 capacity 与构成
    session.setContext({ used: 40000 })
    expect(session.context.value).toMatchObject({ used: 40000, capacity: 128000 })

    // 持久形态的遥测不产生缺口、也不降级
    session.receive({ type: 'context/usage', seq: 1, time: 1, data: { used: 41000 } })
    session.receive({ type: 'turn/start', seq: 2, time: 2, data: {} })
    expect(session.log.cursor).toBe(2)
    expect(session.state.value.degraded).toBe(false)
    expect(session.context.value.used).toBe(41000)
    scope.stop()
  })
})