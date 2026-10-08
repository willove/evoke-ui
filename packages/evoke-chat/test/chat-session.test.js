import { describe, it, expect, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { createSessionLog } from '../src/components/chatbot/sessionLog'
import { applySessionEvent, useChatSession } from '../src/components/chatbot/useChatSession'
import { useChatEngine } from '../src/components/chatbot/useChatEngine'

/**
 * 会话日志层：可修复的增量窗口 + 折叠进引擎
 * 对标 DSH 的 durable log / 游标补齐 / 幂等发送，落成本库可测的不变量。
 */

const ev = (type, seq, data = {}, meta = {}) => ({ type, seq, time: 1000 + seq, data, ...meta })

describe('sessionLog：不变量', () => {
  it('连续事件推进游标；install 装快照并对齐 cursor', () => {
    const log = createSessionLog()
    log.install({ cursor: 2, records: [ev('user/message', 1), ev('turn/start', 2)] })
    expect(log.cursor).toBe(2)
    expect(log.entries.map((e) => e.seq)).toEqual([1, 2])

    expect(log.apply(ev('assistant/delta', 3, { messageId: 'a1', text: '你' }))).toBe('applied')
    expect(log.cursor).toBe(3)
    expect(log.repairing).toBe(false)
  })

  it('跳号：挂起 + 上报缺口，补页填平后按序冲刷（绝不越序应用）', () => {
    const gaps = []
    const log = createSessionLog({ onGap: (g) => gaps.push(g) })
    log.install({ cursor: 0, records: [] })
    log.apply(ev('turn/start', 1))

    const late = log.apply(ev('turn/end', 4, { messageId: 'a1' }))
    expect(late).toBe('buffered')
    expect(log.repairing).toBe(true)
    expect(gaps).toEqual([{ from: 2, to: 3, cursor: 1 }])
    // 挂起期间窗口不前进：乱序内容不许进引擎
    expect(log.entries.map((e) => e.seq)).toEqual([1])
    expect(log.pending.map((e) => e.seq)).toEqual([4])

    log.repair([ev('assistant/message', 2), ev('tool/call', 3)])
    expect(log.cursor).toBe(4)
    expect(log.entries.map((e) => e.seq)).toEqual([1, 2, 3, 4])
    expect(log.repairing).toBe(false)
  })

  it('补页不合规（不从 cursor+1 起）：上报 bad-page 且窗口不变', () => {
    const rows = []
    const log = createSessionLog({ onViolation: (v) => rows.push(v) })
    log.install({ cursor: 3, records: [] })
    log.apply(ev('turn/end', 6))
    log.repair([ev('tool/call', 5)])
    expect(rows.map((r) => r.code)).toEqual(['bad-page'])
    expect(log.cursor).toBe(3)
    expect(log.repairing).toBe(true)
  })

  it('补页重叠段幂等丢弃', () => {
    const log = createSessionLog()
    log.install({ cursor: 1, records: [ev('turn/start', 1)] })
    log.apply(ev('turn/end', 4))
    log.repair([ev('turn/start', 1), ev('assistant/message', 2), ev('tool/call', 3), ev('turn/end', 4)])
    expect(log.entries.map((e) => e.seq)).toEqual([1, 2, 3, 4])
  })

  it('同一代内重复投递幂等；新代里倒退 = stale-replay 违规', () => {
    const rows = []
    const log = createSessionLog({ onViolation: (v) => rows.push(v) })
    log.install({ cursor: 0, records: [] })
    log.apply(ev('turn/start', 1))
    // 同一代重复：静默丢
    expect(log.apply(ev('turn/start', 1))).toBe('duplicate')
    expect(rows).toEqual([])

    // 重连后服务端从更早的 seq 重放：协议违规，不进窗口
    log.beginGeneration()
    expect(log.apply(ev('turn/start', 1))).toBe('violation')
    expect(rows.map((r) => r.code)).toEqual(['stale-replay'])
    // 紧接游标的仍然正常
    expect(log.apply(ev('turn/start', 2))).toBe('applied')
  })

  it('瞬时通知不进窗口、不推游标；没标记又没 seq 的按坏信封上报', () => {
    const seen = []
    const rows = []
    const log = createSessionLog({ onTransient: (e) => seen.push(e.type), onViolation: (v) => rows.push(v) })
    log.install({ cursor: 1, records: [ev('turn/start', 1)] })
    expect(log.apply({ type: 'assistant/delta', transient: true, data: { text: 'x' } })).toBe('transient')
    expect(log.apply({ type: 'assistant/delta', data: { text: 'y' } })).toBe('violation')
    expect(log.cursor).toBe(1)
    expect(log.entries).toHaveLength(1)
    expect(seen).toEqual(['assistant/delta'])
    expect(rows.map((r) => r.code)).toEqual(['bad-envelope'])
  })

  it('坏信封与未知事件：上报而不是静默', () => {
    const rows = []
    const log = createSessionLog({ onViolation: (v) => rows.push(v) })
    expect(log.apply({ type: 'turn/start' })).toBe('violation')
    expect(log.acceptUnknown({ type: 'weird/thing', ignorable: true })).toBe(true)
    expect(log.acceptUnknown({ type: 'weird/thing' })).toBe(false)
    expect(rows.map((r) => r.code)).toEqual(['bad-envelope', 'unknown-event'])
  })
})

describe('useChatSession：折叠与发送', () => {
  function boot(overrides = {}) {
    const transport = {
      send: vi.fn(async () => {}),
      cancel: vi.fn(async () => {}),
      page: vi.fn(async () => []),
      open: vi.fn(() => () => {}),
      ...overrides,
    }
    const scope = effectScope()
    const session = scope.run(() => useChatSession({ transport, sessionId: 's1' }))
    return { session, transport, scope }
  }

  it('install 快照 + 瞬时增量 → 引擎状态正确', async () => {
    const { session, scope } = boot()
    session.open({
      cursor: 3,
      records: [
        ev('user/message', 1, { requestId: 'r1', message: { content: '你好' } }),
        ev('assistant/message', 2, { messageId: 'a1', message: { content: '在的' } }),
        ev('turn/end', 3, { messageId: 'a1', reason: { kind: 'completed' } }),
      ],
    })
    expect(session.messages.value.map((m) => [m.role, m.content])).toEqual([['user', '你好'], ['assistant', '在的']])
    expect(session.messages.value[1].status).toBe('done')

    session.receive({ type: 'assistant/delta', transient: true, data: { messageId: 'a2', text: '流式' } })
    // 瞬时增量直接折进引擎：先建消息（宿主给 id 时用给的那条）
    expect(session.messages.value.at(-1).content).toBe('流式')
    expect(session.log.cursor).toBe(3)
    scope.stop()
  })

  it('tool/args 瞬时事件流式拼入参；assistant/message 透传 model/provider', () => {
    const { session, scope } = boot()
    session.open({ cursor: 0, records: [] })
    session.receive({ type: 'tool/call', transient: true, data: { messageId: 'a1', callId: 'c1', name: 'sql_query' } })
    session.receive({ type: 'tool/args', transient: true, data: { messageId: 'a1', callId: 'c1', chunk: '{"query":' } })
    session.receive({ type: 'tool/args', transient: true, data: { messageId: 'a1', callId: 'c1', chunk: '"SELECT 1"}' } })
    const tc = session.messages.value.at(-1).toolCalls[0]
    expect(tc).toMatchObject({ name: 'sql_query', status: 'running', argsStreaming: true })
    expect(tc.args).toBe('{"query":"SELECT 1"}')

    session.receive({ type: 'assistant/message', seq: 1, data: { messageId: 'a1', message: { content: '好了', model: 'glm-5', provider: 'zhipu' } } })
    const msg = session.messages.value.at(-1)
    expect(msg.model).toBe('glm-5')
    expect(msg.provider).toBe('zhipu')
    // 收尾把入参 parse 回对象
    session.receive({ type: 'tool/result', transient: true, data: { messageId: 'a1', callId: 'c1' } })
    expect(session.messages.value.at(-1).toolCalls[0].args).toEqual({ query: 'SELECT 1' })
    scope.stop()
  })

  it('缺口走 transport.page 补齐，补完才折叠后到的事件', async () => {
    const { session, transport, scope } = boot({
      page: vi.fn(async ({ from, to }) => [ev('assistant/message', 2, { messageId: 'a1', message: { content: '第二' } }), ev('turn/end', 3, { messageId: 'a1', reason: { kind: 'completed' } })]),
    })
    session.open({ cursor: 1, records: [ev('user/message', 1, { message: { content: '第一' } })] })
    const buffered = session.receive(ev('user/message', 4, { message: { content: '第四' } }))
    expect(buffered).toBe('buffered')
    expect(session.state.value.repairing).toBe(true)
    await nextTick()
    await vi.waitFor(() => expect(session.state.value.repairing).toBe(false))
    expect(transport.page).toHaveBeenCalledWith({ from: 2, to: 3, sessionId: 's1' })
    expect(session.messages.value.map((m) => m.content)).toEqual(['第一', '第二', '第四'])
    scope.stop()
  })

  it('发送：requestId 关联乐观气泡，持久回声到了自动摘除', async () => {
    const { session, transport, scope } = boot()
    session.open({ cursor: 0, records: [] })
    const requestId = await session.submit('帮我看看', [{ name: 'a.pdf' }])
    expect(transport.send).toHaveBeenCalledTimes(1)
    expect(transport.send.mock.calls[0][0]).toMatchObject({ requestId, sessionId: 's1', mode: 'queue' })
    expect(session.pending.value).toHaveLength(1)
    expect(session.engine.loading.value).toBe(true)

    session.receive(ev('user/message', 1, { requestId, message: { content: '帮我看看' } }))
    expect(session.pending.value).toHaveLength(0)
    expect(session.engine.loading.value).toBe(false)
    expect(session.messages.value.at(-1).content).toBe('帮我看看')
    scope.stop()
  })

  it('发送失败：保留 requestId 供同 id 幂等重发（服务端按 id 去重）', async () => {
    const send = vi.fn(async () => { throw new Error('网络断了') })
    const { session, scope } = boot({ send })
    session.open({ cursor: 0, records: [] })
    const requestId = await session.submit('重试我')
    expect(session.pending.value).toHaveLength(1)
    await session.retrySend(requestId)
    expect(send).toHaveBeenCalledTimes(2)
    expect(send.mock.calls[0][0].requestId).toBe(send.mock.calls[1][0].requestId)
    scope.stop()
  })

  it('stop 走宿主的协作式中止（本层不持 AbortController）', async () => {
    const { session, transport, scope } = boot()
    await session.stop()
    expect(transport.cancel).toHaveBeenCalledWith({ sessionId: 's1' })
    scope.stop()
  })

  it('中断语义：turn/end aborted → 消息 cancelled；工具 interrupted → 已停止', () => {
    const engine = useChatEngine()
    const id = engine.createAssistantMessage().id
    const callId = engine.startToolCall(id, { name: 'run_tests' })

    applySessionEvent(engine, ev('tool/result', 2, { messageId: id, callId, error: { code: 'interrupted' } }))
    expect(engine.messages.value[0].toolCalls[0].status).toBe('cancelled')

    engine.appendContent(id, '半截')
    applySessionEvent(engine, ev('turn/end', 3, { messageId: id, reason: { kind: 'aborted' } }))
    const msg = engine.messages.value[0]
    expect(msg.status).toBe('cancelled')
    expect(msg.content).toBe('半截')
  })

  it('max-tokens / error 的分流：截断保留 vs 红块', () => {
    const engine = useChatEngine()
    const a = engine.createAssistantMessage().id
    engine.appendContent(a, '被截断的回答')
    applySessionEvent(engine, ev('turn/end', 1, { messageId: a, reason: { kind: 'max-tokens' } }))
    expect(engine.messages.value[0]).toMatchObject({ status: 'done', content: '被截断的回答' })

    const b = engine.createAssistantMessage().id
    applySessionEvent(engine, ev('turn/end', 2, { messageId: b, reason: { kind: 'error' }, error: { message: '上游 500' } }))
    expect(engine.messages.value[1]).toMatchObject({ status: 'error', error: '上游 500' })
  })

  it('不可忽略的未知事件 → 标记降级并交给宿主', async () => {
    const onDegraded = vi.fn()
    const scope = effectScope()
    const session = scope.run(() => useChatSession({ transport: {}, sessionId: 's1', onDegraded }))
    session.open({ cursor: 0, records: [] })
    session.receive(ev('mystery/event', 1, {}))
    expect(session.state.value.degraded).toBe(true)
    expect(onDegraded).toHaveBeenCalledTimes(1)

    // ignorable 的未知事件不降级
    const other = effectScope()
    const s2 = other.run(() => useChatSession({ transport: {}, sessionId: 's1' }))
    s2.open({ cursor: 0, records: [] })
    s2.receive(ev('mystery/event', 1, {}, { ignorable: true }))
    expect(s2.state.value.degraded).toBe(false)
    scope.stop()
    other.stop()
  })
})
describe('useChatSession：接通防线（真实接入反馈批）', () => {
  function boot(overrides = {}) {
    const transport = {
      send: vi.fn(async () => {}),
      cancel: vi.fn(async () => {}),
      page: vi.fn(async () => []),
      open: vi.fn(() => () => {}),
      ...overrides,
    }
    const scope = effectScope()
    const session = scope.run(() => useChatSession({ transport, sessionId: 's1' }))
    return { session, transport, scope }
  }

  it('submit 前忘调 open()：自动补开 + 警告，事件出口接通后流式照常到达', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { session, transport, scope } = boot()
    // 刻意不调 open() —— 旧版在这里静默断链，delta/turn/end 全部蒸发，页面永远“思考中”
    await session.submit('你好')
    expect(transport.open).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('open()'))
    session.receive({ type: 'assistant/delta', transient: true, data: { messageId: 'a1', text: '流式' } })
    expect(session.messages.value.at(-1).content).toBe('流式')
    warn.mockRestore()
    scope.stop()
  })

  it('代际守卫：切会话（再 open）后，旧订阅的迟到事件不再折叠（幽灵消息防线）', () => {
    let lastOnEvent
    const transport = {
      open: vi.fn(({ onEvent }) => { lastOnEvent = onEvent; return () => {} }),
      send: vi.fn(async () => {}),
      cancel: vi.fn(async () => {}),
      page: vi.fn(async () => []),
    }
    const scope = effectScope()
    const session = scope.run(() => useChatSession({ transport, sessionId: 's1' }))
    session.open({ cursor: 0, records: [] })
    const firstGenOnEvent = lastOnEvent
    // 切会话 = 再 open()：换快照、进新代
    session.open({ cursor: 1, records: [ev('user/message', 1, { message: { content: '新会话' } })] })
    expect(transport.open).toHaveBeenCalledTimes(2)

    // 旧代闭包还在“在途轮”手里：瞬态增量、持久事件都不许折进新视图
    firstGenOnEvent({ type: 'assistant/delta', transient: true, data: { messageId: 'ghost', text: '幽灵' } })
    firstGenOnEvent(ev('assistant/message', 9, { messageId: 'ghost', message: { content: '幽灵' } }))
    expect(session.messages.value.some((m) => m.id === 'ghost')).toBe(false)
    expect(session.log.cursor).toBe(1)

    // 新代订阅照常工作
    lastOnEvent({ type: 'assistant/delta', transient: true, data: { messageId: 'a1', text: '活的' } })
    expect(session.messages.value.at(-1).content).toBe('活的')
    scope.stop()
  })

  it('dispose()：事件停折、submit 拒发、transport.close 被调；幂等；再 open() 复活', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let lastOnEvent
    const transport = {
      open: vi.fn(({ onEvent }) => { lastOnEvent = onEvent; return () => {} }),
      send: vi.fn(async () => {}),
      cancel: vi.fn(async () => {}),
      page: vi.fn(async () => []),
      close: vi.fn(async () => {}),
    }
    const scope = effectScope()
    const session = scope.run(() => useChatSession({ transport, sessionId: 's1' }))
    session.open({ cursor: 0, records: [] })
    const oldOnEvent = lastOnEvent

    session.dispose()
    session.dispose() // 幂等：close 只调一次
    expect(transport.close).toHaveBeenCalledTimes(1)
    oldOnEvent({ type: 'assistant/delta', transient: true, data: { messageId: 'ghost', text: '幽灵' } })
    expect(session.messages.value).toHaveLength(0)
    expect(await session.submit('不该发')).toBe(null)
    expect(transport.send).not.toHaveBeenCalled()

    // 再 open() = 复活（切会话的另一种姿势）
    session.open({ cursor: 0, records: [] })
    lastOnEvent({ type: 'assistant/delta', transient: true, data: { messageId: 'a1', text: '活的' } })
    expect(session.messages.value.at(-1).content).toBe('活的')
    warn.mockRestore()
    scope.stop()
  })

  it('assistant/progress 折叠成 message.progress；turn/end 收尾后清空', () => {
    const { session, scope } = boot()
    session.open({
      cursor: 0,
      records: [ev('user/message', 1, { message: { content: '查一下' } })],
    })
    session.receive({
      type: 'assistant/progress',
      transient: true,
      data: { messageId: 'a1', label: '检索知识库', detail: '3 个库', elapsedMs: 1200 },
    })
    const assistant = session.messages.value.at(-1)
    expect(assistant.id).toBe('a1')
    expect(assistant.progress).toEqual({ label: '检索知识库', detail: '3 个库', elapsedMs: 1200 })

    session.receive({ type: 'turn/end', transient: true, data: { messageId: 'a1', reason: { kind: 'completed' } } })
    expect(session.messages.value.at(-1).progress).toBe(null)
    scope.stop()
  })
})
