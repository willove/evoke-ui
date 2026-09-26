import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatStatusBar from '../src/components/chatbot/ChatStatusBar.vue'
import ChatQueue from '../src/components/chatbot/ChatQueue.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import EbAiConsole from '../src/components/ai-console/index.vue'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 输入台上方的状态条 + 队列的「立即发送 / 取回」动作
 *
 * 无障碍重点：live region 只包状态句（elapsed 每秒在跳，aria-hidden 处理），
 * 空态不渲染（不占位、不留空条）。
 */

describe('EbChatStatusBar', () => {
  it('空态不渲染：null / 缺 phase / idle', () => {
    expect(mount(ChatStatusBar, { props: {} }).find('.eb-chat-status').exists()).toBe(false)
    expect(mount(ChatStatusBar, { props: { status: {} } }).find('.eb-chat-status').exists()).toBe(false)
    expect(mount(ChatStatusBar, { props: { status: { phase: 'idle' } } }).find('.eb-chat-status').exists()).toBe(false)
  })

  it('各阶段给对应文案，并带上阶段类名（形状/运动靠它区分）', () => {
    const cases = [
      ['thinking', {}, chatLabels.status.thinking],
      ['running', { tool: '联网检索' }, chatLabels.status.runningTool('联网检索')],
      ['running', {}, chatLabels.status.running],
      ['approval', {}, chatLabels.status.approval],
      ['queued', { queue: 3 }, chatLabels.status.queued(3)],
      ['retrying', {}, chatLabels.status.retrying],
      ['compacting', {}, chatLabels.status.compacting],
      ['error', {}, chatLabels.status.error],
    ]
    for (const [phase, extra, text] of cases) {
      const w = mount(ChatStatusBar, { props: { status: { phase, ...extra } } })
      expect(w.find('.eb-chat-status').classes()).toContain(`is-${phase}`)
      expect(w.find('.eb-chat-status__live').text()).toBe(text)
    }
  })

  it('宿主可覆盖文案（label / error 原文）', () => {
    const custom = mount(ChatStatusBar, { props: { status: { phase: 'running', label: '在跑第 3 步' } } })
    expect(custom.find('.eb-chat-status__live').text()).toBe('在跑第 3 步')
    const err = mount(ChatStatusBar, { props: { status: { phase: 'error', error: '上游 503' } } })
    expect(err.find('.eb-chat-status__live').text()).toBe('上游 503')
  })

  it('elapsed 只在真在跑的阶段显示，且不进 live region（否则每秒都在播报）', () => {
    const running = mount(ChatStatusBar, { props: { status: { phase: 'running', elapsed: 1500 } } })
    const elapsed = running.find('.eb-chat-status__elapsed')
    expect(elapsed.exists()).toBe(true)
    expect(elapsed.text()).toBe('1.5s')
    expect(elapsed.attributes('aria-hidden')).toBe('true')
    expect(running.find('.eb-chat-status__live').text()).not.toContain('1.5s')

    const approval = mount(ChatStatusBar, { props: { status: { phase: 'approval', elapsed: 9000 } } })
    expect(approval.find('.eb-chat-status__elapsed').exists()).toBe(false)

    const minutes = mount(ChatStatusBar, { props: { status: { phase: 'thinking', elapsed: 125000 } } })
    expect(minutes.find('.eb-chat-status__elapsed').text()).toBe('2m 5s')
    const ms = mount(ChatStatusBar, { props: { status: { phase: 'thinking', elapsed: 320 } } })
    expect(ms.find('.eb-chat-status__elapsed').text()).toBe('320ms')
  })

  it('live region 是 polite + atomic，且不停留焦点', () => {
    const w = mount(ChatStatusBar, { props: { status: { phase: 'thinking' } } })
    const live = w.find('.eb-chat-status__live')
    expect(live.attributes('role')).toBe('status')
    expect(live.attributes('aria-live')).toBe('polite')
    expect(live.attributes('aria-atomic')).toBe('true')
  })

  it('排队计数可点、停止钮按 stoppable 出现', async () => {
    const w = mount(ChatStatusBar, { props: { status: { phase: 'queued', queue: 2 }, stoppable: true } })
    const queue = w.find('.eb-chat-status__queue')
    expect(queue.text()).toContain('2')
    await queue.trigger('click')
    expect(w.emitted('view-queue')).toHaveLength(1)

    const stop = w.find('.eb-chat-status__stop')
    expect(stop.text()).toBe(chatLabels.status.stop)
    await stop.trigger('click')
    expect(w.emitted('stop')).toHaveLength(1)

    const bare = mount(ChatStatusBar, { props: { status: { phase: 'thinking' } } })
    expect(bare.find('.eb-chat-status__stop').exists()).toBe(false)
    expect(bare.find('.eb-chat-status__queue').exists()).toBe(false)
  })

  it('hint 作为弱化补充信息展示', () => {
    const w = mount(ChatStatusBar, { props: { status: { phase: 'compacting', hint: '已压缩 12 条历史' } } })
    expect(w.find('.eb-chat-status__hint').text()).toBe('已压缩 12 条历史')
  })
})

describe('队列动作', () => {
  const ITEMS = [{ id: 'q1', content: '第一条' }, { id: 'q2', content: '第二条' }]

  it('每条给「立即发送 / 取回编辑 / 移出」三个动作，事件带 id', async () => {
    const w = mount(ChatQueue, { props: { items: ITEMS } })
    const acts = w.findAll('.eb-chat-queue__act')
    expect(acts).toHaveLength(4) // 2 条 × 2 动作
    expect(acts[0].attributes('aria-label')).toBe(chatLabels.queue.sendNow)
    expect(acts[1].attributes('aria-label')).toBe(chatLabels.queue.recall)
    await acts[0].trigger('click')
    await acts[3].trigger('click')
    expect(w.emitted('send-now')[0]).toEqual(['q1'])
    expect(w.emitted('recall')[0]).toEqual(['q2'])

    await w.findAll('.eb-chat-queue__remove')[0].trigger('click')
    expect(w.emitted('remove')[0]).toEqual(['q1'])
  })
})

describe('状态条接线', () => {
  it('EbChatbot / EbAiConsole：给了 status 才渲染，stop 与 view-queue 转发出去', async () => {
    const none = mount(Chatbot, { props: { modelValue: [] } })
    expect(none.findComponent(ChatStatusBar).exists()).toBe(false)

    const w = mount(Chatbot, { props: { modelValue: [], status: { phase: 'running', tool: '抓取正文' }, statusStoppable: true } })
    const bar = w.findComponent(ChatStatusBar)
    expect(bar.exists()).toBe(true)
    expect(bar.text()).toContain(chatLabels.status.runningTool('抓取正文'))
    await bar.find('.eb-chat-status__stop').trigger('click')
    await bar.find('.eb-chat-status__queue').exists() // 无排队时不渲染计数
    expect(w.emitted('stop')).toHaveLength(1)

    const console_ = mount(EbAiConsole, { props: { showTip: false, status: { phase: 'queued', queue: 1 } } })
    const bar2 = console_.findComponent(ChatStatusBar)
    expect(bar2.exists()).toBe(true)
    await bar2.find('.eb-chat-status__queue').trigger('click')
    expect(console_.emitted('status-queue')).toHaveLength(1)
  })
})