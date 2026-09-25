import { describe, it, expect, vi } from 'vitest'
import { effectScope } from 'vue'
import { parseSseText, readSseFrames, sseFramesOf } from '../src/components/chatbot/adapters/sse'
import { openai } from '../src/components/chatbot/adapters/openai'
import { anthropic } from '../src/components/chatbot/adapters/anthropic'
import { createChatTransport } from '../src/components/chatbot/adapters/createChatTransport'
import { useChatSession } from '../src/components/chatbot/useChatSession'

/**
 * 消息接入适配层：SSE 解析 + 两家 wire → 本库事件 + transport 端到端
 * fixture 按两家官方流式格式手工构造（不联网）。
 */

/** 造一个 ReadableStream：按给定切片吐出字节，用于测「帧跨 chunk 边界」 */
function streamOf(chunks) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c))
      controller.close()
    },
  })
}

async function collect(iterable) {
  const out = []
  for await (const item of iterable) out.push(item)
  return out
}

describe('SSE 解析', () => {
  it('按空行切帧；data 多行按 \\n 拼；注释（心跳）忽略', () => {
    const frames = parseSseText(': ping\n\ndata: {"a":1}\n\ndata: line1\ndata: line2\n\n')
    expect(frames).toHaveLength(2)
    expect(JSON.parse(frames[0].data)).toEqual({ a: 1 })
    expect(frames[1].data).toBe('line1\nline2')
  })

  it('兼容 CRLF 与 [DONE]', () => {
    const frames = parseSseText('event: message\r\ndata: {"x":1}\r\n\r\ndata: [DONE]\r\n\r\n')
    expect(frames[0].event).toBe('message')
    expect(JSON.parse(frames[0].data)).toEqual({ x: 1 })
    expect(frames[1].done).toBe(true)
  })

  it('帧被切在两个 chunk 中间也能拼回来', async () => {
    const frames = await collect(readSseFrames(streamOf(['data: {"a":', '1}\n\ndata: {"b":2}', '\n\n'])))
    expect(frames.map((f) => JSON.parse(f.data))).toEqual([{ a: 1 }, { b: 2 }])
  })

  it('sseFramesOf 直接吃 fetch 的 ReadableStream', async () => {
    const frames = await collect(sseFramesOf(streamOf(['data: {"ok":true}\n\n'])))
    expect(JSON.parse(frames[0].data)).toEqual({ ok: true })
  })
})

describe('OpenAI 适配', () => {
  const ctx = { messageId: 'm1' }

  it('文本增量 → assistant/delta；终态与用量在 finalize 出', () => {
    const state = openai.createState()
    const events = [
      ...openai.frameToEvents({ data: JSON.stringify({ choices: [{ delta: { content: '你' } }] }) }, state, ctx),
      ...openai.frameToEvents({ data: JSON.stringify({ choices: [{ delta: { content: '好' } }] }) }, state, ctx),
      // 带 usage 的收尾帧：choices 为空
      ...openai.frameToEvents({ data: JSON.stringify({ choices: [], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 } }) }, state, ctx),
      ...openai.frameToEvents({ data: '[DONE]', done: true }, state, ctx),
      ...openai.finalize(state, { messageId: 'm1', contextWindow: 1000 }),
    ]
    expect(events.filter((e) => e.type === 'assistant/delta').map((e) => e.data.text)).toEqual(['你', '好'])
    expect(events.at(-2)).toMatchObject({ type: 'context/usage', data: { used: 120, capacity: 1000 } })
    expect(events.at(-1)).toMatchObject({ type: 'turn/end', data: { messageId: 'm1', reason: { kind: 'completed' } } })
  })

  it('工具参数是分片 JSON：拼完再 parse，工具卡拿到对象', () => {
    const state = openai.createState()
    const chunks = [
      { choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_1', function: { name: 'web_search', arguments: '{"qu' } }] } }] },
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'ery":"渠道"}' } }] } }] },
      { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
    ]
    for (const c of chunks) openai.frameToEvents({ data: JSON.stringify(c) }, state, ctx)
    const events = openai.finalize(state, ctx)
    const call = events.find((e) => e.type === 'tool/call')
    expect(call.data).toMatchObject({ callId: 'call_1', name: 'web_search', args: { query: '渠道' } })
    expect(events.at(-1).data.reason).toEqual({ kind: 'completed' })
  })

  it('finish_reason=length 是截断不是失败', () => {
    const state = openai.createState()
    openai.frameToEvents({ data: JSON.stringify({ choices: [{ delta: { content: '半截' }, finish_reason: 'length' }] }) }, state, ctx)
    expect(openai.finalize(state, ctx).at(-1).data.reason).toEqual({ kind: 'max-tokens' })
  })

  it('消息历史：assistant 带 tool_calls、工具结果以 role=tool 回灌', () => {
    const messages = openai.messagesOf([
      { role: 'user', content: '查一下' },
      { role: 'assistant', content: '好的', toolCalls: [{ id: 'c1', name: 'web_search', args: { query: 'x' }, result: '命中 3 条', status: 'done' }] },
    ], { system: '你是助手' })
    expect(messages[0]).toEqual({ role: 'system', content: '你是助手' })
    expect(messages[1]).toEqual({ role: 'user', content: '查一下' })
    expect(messages[2].tool_calls[0]).toMatchObject({ id: 'c1', function: { name: 'web_search', arguments: '{"query":"x"}' } })
    expect(messages[3]).toEqual({ role: 'tool', tool_call_id: 'c1', content: '命中 3 条' })
  })

  it('请求体：stream + include_usage + tools 形状', () => {
    const body = openai.buildRequest({ model: 'gpt-x', messages: [], tools: [{ name: 'web_search' }] })
    expect(body).toMatchObject({ model: 'gpt-x', stream: true, stream_options: { include_usage: true } })
    expect(body.tools[0].function).toMatchObject({ name: 'web_search', parameters: { type: 'object', properties: {} } })
  })
})

describe('Anthropic 适配', () => {
  const ctx = { messageId: 'm2' }
  const frame = (payload, event) => ({ event, data: JSON.stringify(payload) })

  it('文本 / 思考增量、用量分段合并、stop_reason 归一', () => {
    const state = anthropic.createState()
    const events = [
      ...anthropic.frameToEvents(frame({ type: 'message_start', message: { model: 'claude-x', usage: { input_tokens: 90 } } }, 'message_start'), state, ctx),
      ...anthropic.frameToEvents(frame({ type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: '想了想' } }, 'content_block_delta'), state, ctx),
      ...anthropic.frameToEvents(frame({ type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: '结论' } }, 'content_block_delta'), state, ctx),
      ...anthropic.frameToEvents(frame({ type: 'message_delta', delta: { stop_reason: 'max_tokens' }, usage: { output_tokens: 30 } }, 'message_delta'), state, ctx),
      ...anthropic.finalize(state, { messageId: 'm2', contextWindow: 2000 }),
    ]
    expect(events.filter((e) => e.type === 'assistant/delta').map((e) => [e.data.text, e.data.think])).toEqual([[undefined, '想了想'], ['结论', undefined]])
    expect(events.at(-2)).toMatchObject({ type: 'context/usage', data: { used: 120, capacity: 2000 } })
    expect(events.at(-1).data.reason).toEqual({ kind: 'max-tokens' })
  })

  it('tool_use：input_json_delta 拼完，在 content_block_stop 交卡', () => {
    const state = anthropic.createState()
    anthropic.frameToEvents(frame({ type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_1', name: 'web_search' } }, 'content_block_start'), state, ctx)
    const mid = anthropic.frameToEvents(frame({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"que' } }, 'content_block_delta'), state, ctx)
    expect(mid).toEqual([]) // 参数没收全之前不交卡
    anthropic.frameToEvents(frame({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: 'ry":"a"}' } }, 'content_block_delta'), state, ctx)
    const events = anthropic.frameToEvents(frame({ type: 'content_block_stop', index: 0 }, 'content_block_stop'), state, ctx)
    expect(events[0]).toMatchObject({ type: 'tool/call', data: { callId: 'toolu_1', name: 'web_search', args: { query: 'a' } } })
  })

  it('消息历史：tool_use + tool_result 回灌；请求体必带 max_tokens', () => {
    const messages = anthropic.messagesOf([
      { role: 'assistant', content: '好的', toolCalls: [{ id: 'toolu_1', name: 'web_search', args: { query: 'x' }, result: '命中', status: 'done' }] },
    ])
    expect(messages[0].content[0]).toEqual({ type: 'text', text: '好的' })
    expect(messages[0].content[1]).toMatchObject({ type: 'tool_use', id: 'toolu_1', input: { query: 'x' } })
    expect(messages[1].content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'toolu_1', content: '命中' })

    const body = anthropic.buildRequest({ model: 'claude-x', messages: [], system: 'S', tools: [{ name: 't' }] })
    expect(body).toMatchObject({ model: 'claude-x', max_tokens: 4096, stream: true, system: 'S' })
    expect(body.tools[0]).toMatchObject({ name: 't', input_schema: { type: 'object', properties: {} } })
  })
})

describe('createChatTransport 端到端', () => {
  const OPENAI_STREAM = [
    'data: {"choices":[{"delta":{"content":"你好"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"，世界"}}]}\n\n',
    'data: {"choices":[],"usage":{"prompt_tokens":12,"completion_tokens":4,"total_tokens":16}}\n\n',
    'data: [DONE]\n\n',
  ].join('')

  function boot(provider, { body = OPENAI_STREAM, ok = true, status = 200, text } = {}) {
    const fetchImpl = vi.fn(async () => ({
      ok,
      status,
      body: streamOf([body]),
      text: async () => text ?? '',
    }))
    const transport = createChatTransport({
      provider,
      apiKey: 'k',
      model: 'm',
      contextWindow: 1000,
      getMessages: () => sessionRef.session.messages.value,
      fetchImpl,
    })
    const scope = effectScope()
    const sessionRef = {}
    const session = scope.run(() => useChatSession({ transport, sessionId: 's1' }))
    sessionRef.session = session
    return { session, fetchImpl, scope }
  }

  it('OpenAI 流：用户消息回声 → 正文增量 → 终态；loading 收尾', async () => {
    const { session, fetchImpl, scope } = boot('openai')
    session.open({ cursor: 0, records: [] })
    const requestId = await session.submit('你好')
    await vi.waitFor(() => expect(session.messages.value.at(-1).status).toBe('done'))

    const [user, assistant] = session.messages.value
    expect(user).toMatchObject({ role: 'user', content: '你好' })
    expect(assistant.content).toBe('你好，世界')
    expect(session.pending.value).toHaveLength(0)
    expect(session.engine.loading.value).toBe(false)
    expect(session.context.value.used).toBe(16)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(requestId).toBeTruthy()
    scope.stop()
  })

  it('Anthropic 流同样走通（工具调用会落成工具卡）', async () => {
    const anthroStream = [
      'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":8}}}\n\n',
      'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_9","name":"web_search"}}\n\n',
      'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{}"}}\n\n',
      'event: content_block_stop\ndata: {"type":"content_block_stop","index":0}\n\n',
      'event: content_block_delta\ndata: {"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"查完了"}}\n\n',
      'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":5}}\n\n',
    ].join('')
    const { session, scope } = boot('anthropic', { body: anthroStream })
    session.open({ cursor: 0, records: [] })
    await session.submit('查一下')
    await vi.waitFor(() => expect(session.messages.value.at(-1).status).toBe('done'))

    const assistant = session.messages.value.at(-1)
    expect(assistant.content).toBe('查完了')
    expect(assistant.toolCalls[0]).toMatchObject({ id: 'toolu_9', name: 'web_search', status: 'running' })
    scope.stop()
  })

  it('HTTP 错误 → turn/end(error) 带状态与后端消息', async () => {
    const { session, scope } = boot('openai', { ok: false, status: 401, text: JSON.stringify({ error: { message: 'Invalid API key' } }) })
    session.open({ cursor: 0, records: [] })
    await session.submit('hi')
    await vi.waitFor(() => expect(session.messages.value.at(-1).status).toBe('error'))
    expect(session.messages.value.at(-1).error).toContain('Invalid API key')
    scope.stop()
  })

  it('中断：流还挂着时 abort，补一条 aborted 且保留已到的增量', async () => {
    // 造一个「吐一段就挂着」的流：abort 时才报错，模拟真实的长回答
    const hangingFetch = vi.fn(async (_url, opts) => ({
      ok: true,
      status: 200,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"开头"}}]}\n\n'))
          opts?.signal?.addEventListener('abort', () => {
            controller.error(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
          })
        },
      }),
      text: async () => '',
    }))
    const transport = createChatTransport({ provider: 'openai', apiKey: 'k', model: 'm', getMessages: () => [], fetchImpl: hangingFetch })
    const scope = effectScope()
    const session = scope.run(() => useChatSession({ transport, sessionId: 's1' }))
    session.open({ cursor: 0, records: [] })
    const sending = session.submit('写一篇长文')
    await vi.waitFor(() => expect(session.messages.value.at(-1)?.content).toBe('开头'))
    await session.stop()
    await sending
    await vi.waitFor(() => expect(session.messages.value.at(-1).status).toBe('cancelled'))
    // 已流出的正文原地保留，不是失败态
    expect(session.messages.value.at(-1).content).toBe('开头')
    scope.stop()
  })

  it('未知 provider 直接抛，不静默降级', () => {
    expect(() => createChatTransport({ provider: 'gemini' })).toThrow(/未知 provider/)
  })
})