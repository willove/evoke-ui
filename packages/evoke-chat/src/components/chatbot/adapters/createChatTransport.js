/**
 * createChatTransport —— 把 OpenAI / Anthropic 两家接成 `useChatSession` 要的 transport
 *
 * 用法：
 *   const transport = createChatTransport({
 *     provider: 'anthropic',            // 'openai' | 'anthropic'
 *     apiKey: '...',                    // 浏览器直连不安全：生产请走你自己的后端代理
 *     model: 'claude-sonnet-4-5',
 *     system: '你是运营助手',
 *     tools: [{ name: 'web_search', description: '联网检索', parameters: {…} }],
 *     contextWindow: 32000,             // 给了才会报上下文占用
 *     getMessages: () => session.messages.value,   // 历史来源（本库消息数组）
 *   })
 *   const session = useChatSession({ transport })
 *
 * 边界（刻意）：
 *   - 这两家**没有** follow 流与补页协议，所以 `open` 只登记事件出口、`page` 返回空；
 *     历史由宿主自己存（刷新页面后从你的后端拿），本层不假装有日志层。
 *   - `approve` / `answerQuestion` 是应用级交互，不属于 provider 适配，故不在此实现。
 *   - 中断是客户端 AbortController：abort 后统一发一条 `turn/end(aborted)`，UI 才不会一直转。
 */
import { openai } from "./openai";
import { anthropic } from "./anthropic";
import { sseFramesOf } from "./sse";

const ADAPTERS = { openai, anthropic };

export function createChatTransport(options = {}) {
  const {
    provider = "openai",
    url,
    apiKey,
    model,
    system,
    tools,
    maxTokens,
    contextWindow,
    getMessages,
    fetchImpl,
    headers,
    extraBody,
    extraRequest,
  } = options;

  const adapter = ADAPTERS[provider];
  if (!adapter) throw new Error(`[chat-transport] 未知 provider: ${provider}（支持 openai / anthropic）`);

  let sink = null;
  let controller = null;
  let closed = false;
  /** 中止过就不允许再补一条正常终态（否则 cancelled 会被覆盖成 done） */
  let aborted = false;

  const emit = (event) => {
    if (!sink) return;
    sink(event);
  };
  const emitAll = (events) => {
    for (const event of events) emit(event);
  };

  async function send(payload = {}) {
    const requestId = payload.requestId || `req-${Date.now().toString(36)}`;
    const messageId = `m-${requestId}`;
    const text = (payload.content || []).map((part) => part.text || "").join("");
    aborted = false;

    // 1) 用户消息先交出去：会话层据此摘掉乐观气泡（与 DSH 的持久回声同构）
    emit({ type: "user/message", transient: true, data: { requestId, message: { content: text, attachments: payload.attachments || [] } } });

    const history = typeof getMessages === "function" ? getMessages() : [];
    const state = adapter.createState();
    const body = adapter.buildRequest({
      model,
      messages: history,
      system,
      tools,
      maxTokens,
      stream: true,
      ...(extraBody || {}),
    });

    controller = new AbortController();
    let response;
    try {
      const doFetch = fetchImpl || globalThis.fetch;
      if (typeof doFetch !== "function") throw new Error("当前环境没有 fetch：请注入 fetchImpl");
      response = await doFetch(url || adapter.defaultUrl, {
        method: "POST",
        headers: adapter.headersOf({ apiKey, headers }),
        body: JSON.stringify(body),
        signal: controller.signal,
        ...(extraRequest || {}),
      });
    } catch (error) {
      if (aborted || error?.name === "AbortError") {
        emit({ type: "turn/end", transient: true, data: { messageId, reason: { kind: "aborted" } } });
        return;
      }
      emit({ type: "turn/end", transient: true, data: { messageId, reason: { kind: "error" }, error: { message: error?.message || String(error) } } });
      return;
    }

    if (!response?.ok) {
      const detail = await readErrorText(response);
      emit({
        type: "turn/end",
        transient: true,
        data: { messageId, reason: { kind: "error" }, error: { message: `${provider} ${response?.status || ""} ${detail}`.trim() } },
      });
      return;
    }

    try {
      for await (const frame of sseFramesOf(response.body)) {
        if (frame.done) break;
        emitAll(adapter.frameToEvents(frame, state, { messageId }));
      }
      if (aborted) {
        emit({ type: "turn/end", transient: true, data: { messageId, reason: { kind: "aborted" } } });
        return;
      }
      emitAll(adapter.finalize(state, { messageId, contextWindow }));
    } catch (error) {
      if (aborted || error?.name === "AbortError") {
        emit({ type: "turn/end", transient: true, data: { messageId, reason: { kind: "aborted" } } });
        return;
      }
      emit({ type: "turn/end", transient: true, data: { messageId, reason: { kind: "error" }, error: { message: error?.message || String(error) } } });
    }
  }

  return {
    /** 登记事件出口并接管关闭；这两家没有可订阅的服务端流，故只做登记 */
    open({ onEvent } = {}) {
      sink = onEvent || null;
      closed = false;
      return () => {
        closed = true;
        sink = null;
      };
    },
    /** 无 follow/补页协议：历史由宿主自己存 */
    async page() {
      return [];
    },
    send,
    /** 协作中断：abort 之后统一补一条 turn/end(aborted) */
    async cancel() {
      aborted = true;
      controller?.abort();
    },
    get closed() {
      return closed;
    },
  };
}

async function readErrorText(response) {
  try {
    const text = await response.text?.();
    if (!text) return "";
    try {
      const json = JSON.parse(text);
      return json?.error?.message || json?.message || text.slice(0, 200);
    } catch {
      return text.slice(0, 200);
    }
  } catch {
    return "";
  }
}

export { openai, anthropic };