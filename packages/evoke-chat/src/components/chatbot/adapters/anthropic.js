/**
 * Anthropic Messages 适配 —— wire 帧 / 消息 → 本库事件
 *
 * 与 OpenAI 的差异（都在这里吸收掉）：
 *   1. 工具参数走 `input_json_delta.partial_json`，同样是**分片 JSON**，按 `content_block` 的 index 拼完再 parse；
 *   2. 思考是 `thinking_delta`（另有 `signature_delta`，本库不展示，忽略）；
 *   3. 用量分两处：`message_start` 给 input_tokens，`message_delta` 给 output_tokens（要合并）；
 *   4. `stop_reason` 在 `message_delta` 上：`end_turn` / `tool_use` / `max_tokens` / `stop_sequence`。
 */

export const ANTHROPIC_DEFAULT_URL = 'https://api.anthropic.com/v1/messages'
export const ANTHROPIC_VERSION = '2023-06-01'

export function headersOf({ apiKey, headers } = {}) {
  return {
    'content-type': 'application/json',
    'anthropic-version': ANTHROPIC_VERSION,
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
    ...(headers || {}),
  }
}

/** 工具定义：[{ name, description?, parameters? }] → Anthropic tools（注意是 input_schema） */
export function toolsOf(tools) {
  if (!Array.isArray(tools) || !tools.length) return undefined
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters || { type: 'object', properties: {} },
  }))
}

/** 消息历史 → Anthropic messages（assistant 内容块 + tool_result 回灌） */
export function messagesOf(messages = [], { system } = {}) {
  const out = []
  for (const m of messages) {
    if (m.role === 'user') {
      out.push({ role: 'user', content: m.content || '' })
      continue
    }
    if (m.role !== 'assistant') continue
    const calls = (m.toolCalls || []).filter((t) => t.status === 'done' || t.status === 'cancelled')
    const content = []
    if (m.content) content.push({ type: 'text', text: m.content })
    for (const t of calls) content.push({ type: 'tool_use', id: t.id, name: t.name, input: t.args ?? {} })
    out.push({ role: 'assistant', content: content.length ? content : (m.content || '') })
    if (calls.length) {
      out.push({
        role: 'user',
        content: calls.map((t) => ({
          type: 'tool_result',
          tool_use_id: t.id,
          content: typeof t.result === 'string' ? t.result : JSON.stringify(t.result ?? ''),
        })),
      })
    }
  }
  return out
}

export function buildRequest({ model, messages = [], system, tools, maxTokens, stream = true, ...rest } = {}) {
  return {
    model,
    max_tokens: maxTokens || 4096, // Anthropic 必填
    messages: messagesOf(messages),
    ...(stream ? { stream: true } : {}),
    ...(system ? { system } : {}),
    ...(toolsOf(tools) ? { tools: toolsOf(tools) } : {}),
    ...rest,
  }
}

export function createState() {
  return { toolCalls: new Map(), stopReason: null, usage: null, model: null }
}

function safeJson(text) {
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return text || {}
  }
}

export function endReason(stopReason) {
  if (stopReason === 'max_tokens') return { kind: 'max-tokens' }
  if (stopReason === 'refusal') return { kind: 'error', error: { message: '模型拒绝了该请求' } }
  return { kind: 'completed' } // end_turn / tool_use / stop_sequence
}

/** 一帧 → 事件数组 */
export function frameToEvents(frame, state, ctx = {}) {
  const events = []
  const messageId = ctx.messageId
  if (!frame || frame.done) return events
  let payload
  try {
    payload = JSON.parse(frame.data)
  } catch {
    return events
  }
  const type = payload?.type || frame.event
  switch (type) {
    case 'message_start': {
      state.model = payload.message?.model || state.model
      if (payload.message?.usage) state.usage = { ...(state.usage || {}), ...payload.message.usage }
      break
    }
    case 'content_block_start': {
      const block = payload.content_block
      if (block?.type === 'tool_use') {
        state.toolCalls.set(payload.index ?? 0, { id: block.id, name: block.name, args: '' })
      }
      break
    }
    case 'content_block_delta': {
      const delta = payload.delta || {}
      if (delta.type === 'text_delta' && delta.text) {
        events.push({ type: 'assistant/delta', transient: true, data: { messageId, text: delta.text } })
      } else if (delta.type === 'thinking_delta' && delta.thinking) {
        events.push({ type: 'assistant/delta', transient: true, data: { messageId, think: delta.thinking } })
      } else if (delta.type === 'input_json_delta') {
        const acc = state.toolCalls.get(payload.index ?? 0)
        if (acc) acc.args += delta.partial_json || ''
      }
      break
    }
    case 'content_block_stop': {
      const acc = state.toolCalls.get(payload.index ?? 0)
      if (acc) {
        events.push({ type: 'tool/call', transient: true, data: { messageId, callId: acc.id, name: acc.name, args: safeJson(acc.args) } })
      }
      break
    }
    case 'message_delta': {
      if (payload.usage) state.usage = { ...(state.usage || {}), ...payload.usage }
      if (payload.delta?.stop_reason) state.stopReason = payload.delta.stop_reason
      break
    }
    default:
      break // ping / message_stop 等：终态在 finalize
  }
  return events
}

/** 流结束 → 用量 + 终态 */
export function finalize(state, ctx = {}) {
  const events = []
  const usage = state.usage || null
  if (usage) {
    const used = Number(usage.input_tokens || 0) + Number(usage.output_tokens || 0)
    events.push({
      type: 'context/usage',
      transient: true,
      data: { used, ...(ctx.contextWindow ? { capacity: ctx.contextWindow } : {}) },
    })
  }
  events.push({ type: 'turn/end', transient: true, data: { messageId: ctx.messageId, reason: endReason(state.stopReason), usage: usage || undefined } })
  return events
}

export function usageOf(usage) {
  if (!usage) return null
  return {
    promptTokens: usage.input_tokens,
    completionTokens: usage.output_tokens,
    totalTokens: Number(usage.input_tokens || 0) + Number(usage.output_tokens || 0),
    cacheReadTokens: usage.cache_read_input_tokens,
  }
}

export const anthropic = { buildRequest, frameToEvents, finalize, createState, headersOf, messagesOf, defaultUrl: ANTHROPIC_DEFAULT_URL, usageOf }