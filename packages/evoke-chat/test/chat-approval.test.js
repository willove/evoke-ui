import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { effectScope } from 'vue'
import ChatApproval from '../src/components/chatbot/ChatApproval.vue'
import Chatbot from '../src/components/chatbot/Chatbot.vue'
import ChatSender from '../src/components/chatbot/ChatSender.vue'
import EbAiConsole from '../src/components/ai-console/index.vue'
import { useChatSession } from '../src/components/chatbot/useChatSession'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 审批接管：待审批时输入区让位给审批面板（Enter 允许一次 / Esc 拒绝）
 * 语义对齐 DSH：只有 allowed-once | rejected，没有"总是允许"（那是会话级权限模式的事）
 */

const REQ = { id: 'ap-1', toolName: 'run_tests', reason: '需要执行测试命令', detail: 'pnpm test -- --run' }

describe('EbChatApproval', () => {
  it('标题：给了 reason 用 reason，没给就用「工具 X 请求越权执行」', () => {
    const withReason = mount(ChatApproval, { props: { request: REQ } })
    expect(withReason.find('.eb-chat-approval__headline').text()).toBe('需要执行测试命令')
    expect(withReason.find('.eb-chat-approval__detail').text()).toBe('pnpm test -- --run')

    const without = mount(ChatApproval, { props: { request: { id: 'a', toolName: 'rm' } } })
    expect(without.find('.eb-chat-approval__headline').text()).toBe(chatLabels.approval.escalation('rm'))
    expect(without.find('.eb-chat-approval__detail').exists()).toBe(false)
  })

  it('Enter 允许一次、Esc 拒绝；不带修饰键才认', async () => {
    const allow = mount(ChatApproval, { props: { request: REQ } })
    await allow.trigger('keydown', { key: 'Enter' })
    expect(allow.emitted('respond')[0]).toEqual(['allowed-once', REQ])

    const reject = mount(ChatApproval, { props: { request: REQ } })
    await reject.trigger('keydown', { key: 'Escape' })
    expect(reject.emitted('respond')[0]).toEqual(['rejected', REQ])

    const modified = mount(ChatApproval, { props: { request: REQ } })
    await modified.trigger('keydown', { key: 'Enter', ctrlKey: true })
    await modified.trigger('keydown', { key: 'Escape', metaKey: true })
    expect(modified.emitted('respond')).toBeUndefined()

    // 组字中的 Enter 是上屏候选词，不是"允许"
    const composing = mount(ChatApproval, { props: { request: REQ } })
    await composing.trigger('keydown', { key: 'Enter', isComposing: true })
    expect(composing.emitted('respond')).toBeUndefined()
  })

  it('点过就禁用并播报；主机回写的 status 也渲染成已响应', async () => {
    const w = mount(ChatApproval, { props: { request: REQ } })
    await w.findAll('.eb-chat-approval__btn')[1].trigger('click')
    expect(w.emitted('respond')[0][0]).toBe('allowed-once')
    expect(w.findAll('.eb-chat-approval__btn').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    expect(w.classes()).toContain('is-answered')
    expect(w.find('.eb-chat-approval__announce').text()).toBe(chatLabels.approval.answered)

    // 重复点击不再回传
    await w.findAll('.eb-chat-approval__btn')[0].trigger('click')
    expect(w.emitted('respond')).toHaveLength(1)

    const decided = mount(ChatApproval, { props: { request: { ...REQ, status: 'rejected' } } })
    expect(decided.find('.eb-chat-approval__announce').text()).toBe(chatLabels.approval.rejected)
    await decided.trigger('keydown', { key: 'Enter' })
    expect(decided.emitted('respond')).toBeUndefined()
  })

  it('受控 answered 优先；槽位里的输入控件不吃键位', async () => {
    const controlled = mount(ChatApproval, { props: { request: REQ, answered: true } })
    expect(controlled.findAll('.eb-chat-approval__btn').every((b) => b.attributes('disabled') !== undefined)).toBe(true)

    const withInput = mount(ChatApproval, {
      props: { request: REQ },
      slots: { default: '<input class="mine" />' },
    })
    await withInput.find('.mine').trigger('keydown', { key: 'Enter' })
    expect(withInput.emitted('respond')).toBeUndefined()
  })
})

describe('输入区接管', () => {
  it('EbChatbot：有 approval 时发送区换成审批面板，响应抛 approval-respond', async () => {
    const w = mount(Chatbot, { props: { modelValue: [], approval: REQ } })
    expect(w.findComponent(ChatSender).exists()).toBe(false)
    const panel = w.findComponent(ChatApproval)
    expect(panel.exists()).toBe(true)
    await panel.findAll('.eb-chat-approval__btn')[1].trigger('click')
    expect(w.emitted('approval-respond')[0]).toEqual(['allowed-once', REQ])

    // 没有待审批时输入台照旧
    await w.setProps({ approval: null })
    expect(w.findComponent(ChatSender).exists()).toBe(true)
    expect(w.findComponent(ChatApproval).exists()).toBe(false)
  })

  it('EbAiConsole：同样接管输入台并向上转发', async () => {
    const w = mount(EbAiConsole, { props: { approval: REQ, showTip: false } })
    expect(w.find('.eb-ai-prompt-box').exists()).toBe(false)
    const panel = w.findComponent(ChatApproval)
    await panel.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('approval-respond')[0]).toEqual(['rejected', REQ])
  })
})

describe('useChatSession：审批流', () => {
  function boot(overrides = {}) {
    const transport = { send: vi.fn(async () => {}), cancel: vi.fn(async () => {}), page: vi.fn(async () => []), open: vi.fn(() => () => {}), approve: vi.fn(async () => {}), ...overrides }
    const scope = effectScope()
    const session = scope.run(() => useChatSession({ transport, sessionId: 's1' }))
    return { session, transport, scope }
  }

  it('瞬时 approval/request 进待审批；respondApproval 回传并转已响应；decided 清空', async () => {
    const { session, transport, scope } = boot()
    session.open({ cursor: 0, records: [] })

    session.receive({ type: 'approval/request', transient: true, data: { id: 'ap-1', toolName: 'rm', reason: '要删文件' } })
    expect(session.approval.value).toMatchObject({ id: 'ap-1', toolName: 'rm', status: 'pending' })

    await session.respondApproval('allowed-once')
    expect(transport.approve).toHaveBeenCalledWith({ id: 'ap-1', outcome: 'allowed-once', sessionId: 's1' })
    expect(session.approval.value.status).toBe('approved')
    // 重复响应无效
    expect(await session.respondApproval('rejected')).toBe(false)

    session.receive({ type: 'approval/decided', transient: true, data: { id: 'ap-1' } })
    expect(session.approval.value).toBeNull()
    scope.stop()
  })

  it('持久形态的审批事件不破坏日志连续性、也不判为未知降级', () => {
    const { session, scope } = boot()
    session.open({ cursor: 0, records: [] })
    session.receive({ type: 'approval/request', seq: 1, time: 1, data: { id: 'ap-2', toolName: 'x' } })
    session.receive({ type: 'turn/start', seq: 2, time: 2, data: {} })
    expect(session.log.cursor).toBe(2)
    expect(session.log.repairing).toBe(false)
    expect(session.state.value.degraded).toBe(false)
    expect(session.approval.value.id).toBe('ap-2')
    scope.stop()
  })

  it('没有待审批时响应返回 false（不误发 approve）', async () => {
    const { session, transport, scope } = boot()
    expect(await session.respondApproval('rejected')).toBe(false)
    expect(transport.approve).not.toHaveBeenCalled()
    scope.stop()
  })
})