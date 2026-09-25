/**
 * SSE 读取 —— 把 fetch 的响应体解析成帧（`{ event, data, done }`）
 *
 * 两家模型服务（OpenAI Chat Completions / Anthropic Messages）都用 Server-Sent Events 推流：
 * 帧以空行分隔，`data:` 可多行（按 \n 拼接），`:` 开头是注释（心跳），`data: [DONE]` 收尾。
 * 这里只做协议解析，不碰业务语义——语义在 openai.js / anthropic.js 里。
 */

/** 找下一帧的结束位置（兼容 \n\n 与 \r\n\r\n） */
function frameEnd(buffer) {
  const lf = buffer.indexOf('\n\n')
  const crlf = buffer.indexOf('\r\n\r\n')
  if (lf === -1 && crlf === -1) return null
  if (lf === -1) return { at: crlf, next: crlf + 4 }
  if (crlf === -1 || lf < crlf) return { at: lf, next: lf + 2 }
  return { at: crlf, next: crlf + 4 }
}

/** 解析单帧文本；没有 data 行返回 null（例如只有注释的心跳） */
export function parseSseFrame(raw) {
  const lines = String(raw).split(/\r?\n/)
  let event = 'message'
  const data = []
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue
    const idx = line.indexOf(':')
    const field = idx === -1 ? line : line.slice(0, idx)
    let value = idx === -1 ? '' : line.slice(idx + 1)
    if (value.startsWith(' ')) value = value.slice(1)
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }
  if (!data.length) return null
  const text = data.join('\n')
  return { event, data: text, done: text.trim() === '[DONE]' }
}

/** 文本 → 帧数组（测试与非流式场景用） */
export function parseSseText(text) {
  const frames = []
  let buffer = String(text ?? '')
  let hit = frameEnd(buffer)
  while (hit) {
    const frame = parseSseFrame(buffer.slice(0, hit.at))
    if (frame) frames.push(frame)
    buffer = buffer.slice(hit.next)
    hit = frameEnd(buffer)
  }
  if (buffer.trim()) {
    const frame = parseSseFrame(buffer)
    if (frame) frames.push(frame)
  }
  return frames
}

/** async iterable（Uint8Array / string）→ 帧 */
export async function* readSseFrames(body) {
  if (!body) return
  const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null
  let buffer = ''
  for await (const chunk of body) {
    buffer += typeof chunk === 'string' ? chunk : (decoder ? decoder.decode(chunk, { stream: true }) : '')
    let hit = frameEnd(buffer)
    while (hit) {
      const frame = parseSseFrame(buffer.slice(0, hit.at))
      buffer = buffer.slice(hit.next)
      if (frame) yield frame
      hit = frameEnd(buffer)
    }
  }
  if (buffer.trim()) {
    const frame = parseSseFrame(buffer)
    if (frame) yield frame
  }
}

/** ReadableStream（fetch 响应体）→ async iterable */
export async function* streamChunks(stream) {
  if (!stream) return
  if (typeof stream[Symbol.asyncIterator] === 'function') {
    yield* stream
    return
  }
  const reader = stream.getReader?.()
  if (!reader) return
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) yield value
    }
  } finally {
    reader.releaseLock?.()
  }
}

/** 便捷入口：fetch 响应体（或任意流）→ 帧 */
export async function* sseFramesOf(body) {
  const stream = body?.getReader && typeof body[Symbol.asyncIterator] !== 'function' ? streamChunks(body) : body
  yield* readSseFrames(stream)
}