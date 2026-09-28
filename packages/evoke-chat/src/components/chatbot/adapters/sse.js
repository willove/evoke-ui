/**
 * SSE 读取 —— 把 fetch 的响应体解析成帧（`{ event, data, done }`）
 *
 * 两家模型服务（OpenAI Chat Completions / Anthropic Messages）都用 Server-Sent Events 推流：
 * 帧以空行分隔，`data:` 可多行（按 \n 拼接），`:` 开头是注释（心跳），`data: [DONE]` 收尾。
 * 这里只做协议解析，不碰业务语义——语义在 openai.js / anthropic.js 里。
 *
 * 取消（`{ signal }`）：abort 后挂起中的 `reader.read()` 会被 `reader.cancel()` 解除，
 * 迭代**安静收尾**（等同流正常结束，不抛错）；读到一半的残帧按丢弃处理——中途取消的
 * 帧不完整，交出去就是半个 JSON。三个 Web 流语义消费方容易踩，这里替你处理掉：
 *   - 流一经 `getReader()` 即锁定，别人再 lock/iterate 会抛；
 *   - `response.clone()` 必须在锁定**前**调用；
 *   - `tee()` 出的分支要两个都 `cancel()`，源才会真正关。
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

/**
 * async iterable / ReadableStream → 帧（可传 `{ signal }`：abort 解除挂起的 read，安静收尾）
 *
 * reader 由这里持有并负责释放：abort / 消费方中途退出都会 `cancel()` 流，
 * 不给「锁了不还、abort 了还挂在 read 上」留门。
 */
export async function* readSseFrames(source, { signal } = {}) {
  if (!source || signal?.aborted) return
  // 有 getReader 的按流处理（reader 才有 cancel 通道）；纯 async iterable 走迭代器协议
  const reader = typeof source.getReader === 'function' ? source.getReader() : null
  const iterator = reader ? null : source[Symbol.asyncIterator]()
  let aborted = false
  const onAbort = () => {
    aborted = true
    // cancel 让挂起的 read 以 { done: true } 收场——这是「解除阻塞」而不是「打断报错」
    reader?.cancel()?.catch?.(() => {})
    iterator?.return?.()?.catch?.(() => {})
  }
  signal?.addEventListener('abort', onAbort, { once: true })
  const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null
  try {
    let buffer = ''
    for (;;) {
      const { done, value } = reader ? await reader.read() : await iterator.next()
      if (done) break
      buffer += typeof value === 'string' ? value : (decoder ? decoder.decode(value, { stream: true }) : '')
      let hit = frameEnd(buffer)
      while (hit) {
        const frame = parseSseFrame(buffer.slice(0, hit.at))
        buffer = buffer.slice(hit.next)
        if (frame) yield frame
        hit = frameEnd(buffer)
      }
    }
    // 残段只在正常收尾时冲洗：中途 abort 的残帧不完整，不该当成一帧交出去
    if (!aborted && buffer.trim()) {
      const frame = parseSseFrame(buffer)
      if (frame) yield frame
    }
  } finally {
    signal?.removeEventListener('abort', onAbort)
    if (reader) {
      // cancel 对已自然收尾的流是幂等 no-op；中途退出（break / return）也能还掉资源
      reader.cancel()?.catch?.(() => {})
      reader.releaseLock?.()
    } else {
      iterator?.return?.()?.catch?.(() => {})
    }
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

/** 便捷入口：fetch 响应体（或任意流 / async iterable）→ 帧；`signal` 原样透传 */
export async function* sseFramesOf(body, { signal } = {}) {
  yield* readSseFrames(body, { signal })
}