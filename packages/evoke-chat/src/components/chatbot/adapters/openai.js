/**
 * OpenAI Chat Completions 适配 —— wire chunk / 消息 → 本库事件
 *
 * 只做映射，不发请求、不引 SDK：请求体由 buildRequest 组，事件由 frameToEvents 出。
 * 三个容易踩的点在这里一次做对：
 *   1. `delta.tool_calls[].function.arguments` 是**分片 JSON 字符串**，必须按 index 拼完再 parse；
 *   2. 带 `stream_options.include_usage` 时，用量在**最后一个空 choices 的 chunk** 里，
 *      所以终态（turn/end / context/usage）统一放到 finalize，不在 finish_reason 那帧就结账；
 *   3. `finish_reason: 'length'` 是"截断"而不是失败——映射成我们的 max-tokens（保留已产出内容）。
 */

export const OPENAI_DEFAULT_URL = 'https://api.openai.com/v1/chat/completions'

export function headersOf({ apiKey, headers } = {}) {
  return {
    'content-type': 'application/json',
    ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    ...(headers || {}),
  }
}

/** 工具定义：[{ name, description?, parameters? }] → OpenAI tools */
export function toolsOf(tools) {
  if (!Array.isArray(tools) || !tools.length) return undefined
  return tools.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters || { type: 'object', properties: {} } },
  }))
}

/** 消息历史：本库消息数组 → OpenAI messages（含 tool_calls / tool 回灌） */
export function messagesOf(messages = [], { system } = {}) {
  const out = []
  if (system) out.push({ role: 'system', content: system })
  for (const m of messages) {
    if (m.role === 'user') {
      out.push({ role: 'user', content: m.content || '' })
      continue
    }
    if (m.role !== 'assistant') continue
    const calls = (m.toolCalls || []).filter((t) => t.status === 'done' || t.status === 'cancelled')
    out.push({
      role: 'assistant',
      content: m.content || '',
      ...(calls.length
        ? {
          tool_calls: calls.map((t) => ({
            id: t.id,
            type: 'function',
            function: { name: t.name, arguments: JSON.stringify(t.args ?? {}) },
          })),
        }
        : {}),
    })
    for (const t of calls) {
      out.push({ role: 'tool', tool_call_id: t.id, content: typeof t.result === 'string' ? t.result : JSON.stringify(t.result ?? '') })
    }
  }
  return out
}

export function buildRequest({ model, messages = [], input, system, tools, maxTokens, stream = true, ...rest } = {}) {
  return {
    model,
    messages: messagesOf(messages, { system }),
    ...(stream ? { stream: true, stream_options: { include_usage: true } } : {}),
    ...(toolsOf(tools) ? { tools: toolsOf(tools) } : {}),
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
    ...rest,
  }
}

export function createState() {
  return { text: '', reasoning: '', toolCalls: new Map(), finishReason: null, usage: null, started: false }
}

function safeJson(text) {
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    // 分片没收全或模型给了非法 JSON：原样交出去，别丢
    return text || {}
  }
}

/** 把 finish_reason 归一成本库的收尾语义 */
export function endReason(finishReason) {
  if (finishReason === 'length') return { kind: 'max-tokens' }
  if (finishReason === 'content_filter') return { kind: 'error', error: { message: '内容被安全策略拦截' } }
  if (finishReason === 'tool_calls' || finishReason === 'function_call') return { kind: 'completed' }
  return { kind: 'completed' }
}

/**
 * 一帧 → 事件数组（帧是 SSE 帧；OpenAI 的 data 是 JSON，可能多帧拼成一条）
 * `[DONE]` 帧返回空（终态由 finalize 出）。
 */
export function frameToEvents(frame, state, ctx = {}) {
  const events = []
  const messageId = ctx.messageId
  if (!frame || frame.done) return events
  let chunk
  try {
    chunk = JSON.parse(frame.data)
  } catch {
    return events
  }
  if (chunk?.usage) state.usage = chunk.usage
  if (chunk?.model) state.model = chunk.model
  const choice = chunk?.choices?.[0]
  const delta = choice?.delta || {}
  if (typeof delta.content === 'string' && delta.content) {
    state.text += delta.content
    events.push({ type: 'assistant/delta', transient: true, data: { messageId, text: delta.content } })
  }
  // 部分兼容服务把思维链放在 reasoning_content（非 OpenAI 官方字段，有就透传）
  if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) {
    state.reasoning += delta.reasoning_content
    events.push({ type: 'assistant/delta', transient: true, data: { messageId, think: delta.reasoning_content } })
  }
  for (const call of delta.tool_calls || []) {
    const index = call.index ?? 0
    const acc = state.toolCalls.get(index) || { id: call.id, name: '', args: '' }
    if (call.id) acc.id = call.id
    if (call.function?.name) acc.name += call.function.name
    if (call.function?.arguments) acc.args += call.function.arguments
    state.toolCalls.set(index, acc)
  }
  if (choice?.finish_reason) state.finishReason = choice.finish_reason
  return events
}

/** 流结束 → 工具调用（参数拼完再 parse）+ 用量 + 终态 */
export function finalize(state, ctx = {}) {
  const events = []
  const messageId = ctx.messageId
  for (const acc of state.toolCalls.values()) {
    events.push({
      type: 'tool/call',
      transient: true,
      data: { messageId, callId: acc.id, name: acc.name, args: safeJson(acc.args) },
    })
  }
  if (state.usage) {
    const used = state.usage.total_tokens ?? (Number(state.usage.prompt_tokens || 0) + Number(state.usage.completion_tokens || 0))
    events.push({
      type: 'context/usage',
      transient: true,
      data: { used, ...(ctx.contextWindow ? { capacity: ctx.contextWindow } : {}) },
    })
  }
  events.push({ type: 'turn/end', transient: true, data: { messageId, reason: endReason(state.finishReason), usage: state.usage || undefined } })
  return events
}

/** 归一用量（宿主想拿来做消息级展示时用） */
export function usageOf(usage) {
  if (!usage) return null
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  }
}

export const openai = { buildRequest, frameToEvents, finalize, createState, headersOf, messagesOf, defaultUrl: OPENAI_DEFAULT_URL, usageOf }