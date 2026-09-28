/**
 * createChatTransport —— 把 OpenAI / Anthropic 两家接成 `useChatSession` 要的 transport
 *
 * 用法：
 *   const transport = createChatTransport({
 *     provider: 'anthropic',            // 'openai' | 'anthropic'（也可直接给自定义 adapter 对象）
 *     apiKey: '...',                    // 浏览器直连不安全：生产请走你自己的后端代理
 *     model: 'claude-sonnet-4-5',
 *     system: '你是运营助手',
 *     tools: [{ name: 'web_search', description: '联网检索', parameters: {…} }],
 *     contextWindow: 32000,             // 给了才会报上下文占用
 *     getMessages: () => session.messages.value,   // 历史来源（本库消息数组）
 *     onExtension: ({ event, data, json }) => {    // 标准协议之外的载荷（RAG 引用/进度/运行卡）
 *       if (json?.type === 'citations') { session.receive(toCitationEvent(json)); return true }
 *       // 返回 true = 本帧已被扩展消费，跳过标准映射；返回 falsy 则照常走 adapter
 *     },
 *   })
 *   const session = useChatSession({ transport })
 *
 * 边界（刻意）：
 *   - 这两家**没有** follow 流与补页协议，所以 `open` 只登记事件出口、`page` 返回空；
 *     历史由宿主自己存（刷新页面后从你的后端拿），本层不假装有日志层。
 *   - `approve` / `answerQuestion` 是应用级交互，不属于 provider 适配，故不在此实现。
 *   - 中断是客户端 AbortController：abort 会解除 SSE 挂起中的 read（signal 直通解析层），
 *     然后统一发一条 `turn/end(aborted)`，UI 才不会一直转。
 *   - 自定义 provider 对象要实现适配器契约：`createState() / buildRequest({…}) /
 *     headersOf({…}) / defaultUrl / frameToEvents(frame, state, { messageId }) / finalize(state, {…})`。
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
    onExtension,
  } = options;

  // provider 可以是名字，也可以是实现了适配器契约的对象（不想复制整条 fetch/abort 管线时用）
  const custom = provider !== null && typeof provider === "object";
  const adapter = custom ? provider : ADAPTERS[provider];
  if (!adapter) throw new Error(`[chat-transport] 未知 provider: ${provider}（支持 openai / anthropic，或传自定义 adapter 对象）`);
  if (custom) {
    const missing = ["createState", "buildRequest", "headersOf", "frameToEvents", "finalize"].filter(
      (k) => typeof adapter[k] !== "function",
    );
    if (missing.length) {
      throw new Error(`[chat-transport] 自定义 adapter 缺少契约方法: ${missing.join(", ")}`);
    }
  }

  let sink = null;
  let controller = null;
  let closed = false;
  /** 中止过就不允许再补一条正常终态（否则 cancelled 会被覆盖成 done） */
  let aborted = false;

  async function send(payload = {}) {
    const requestId = payload.requestId || `req-${Date.now().toString(36)}`;
    const messageId = `m-${requestId}`;
    const text = (payload.content || []).map((part) => part.text || "").join("");
    aborted = false;
    // 本轮的事件出口在开始时固定：open() 换代（切会话/重开）后，旧轮的迟到事件
    // 去旧出口（useChatSession 的代际守卫会丢弃），不会污染切换后的新视图
    const turnEmit = sink ? (event) => sink(event) : () => {};
    const emitAll = (events) => {
      for (const event of events) turnEmit(event);
    };

    // 1) 用户消息先交出去：会话层据此摘掉乐观气泡（与 DSH 的持久回声同构）
    turnEmit({ type: "user/message", transient: true, data: { requestId, message: { content: text, attachments: payload.attachments || [] } } });

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
        turnEmit({ type: "turn/end", transient: true, data: { messageId, reason: { kind: "aborted" } } });
        return;
      }
      turnEmit({ type: "turn/end", transient: true, data: { messageId, reason: { kind: "error" }, error: { message: error?.message || String(error) } } });
      return;
    }

    if (!response?.ok) {
      const detail = await readErrorText(response);
      turnEmit({
        type: "turn/end",
        transient: true,
        data: { messageId, reason: { kind: "error" }, error: { message: `${provider} ${response?.status || ""} ${detail}`.trim() } },
      });
      return;
    }

    try {
      // signal 直通解析层：abort 时 reader.cancel() 解除挂起中的 read，循环立即收尾
      for await (const frame of sseFramesOf(response.body, { signal: controller.signal })) {
        if (frame.done) break;
        if (typeof onExtension === "function") {
          let json;
          try {
            json = JSON.parse(frame.data);
          } catch {
            json = undefined;
          }
          // 返回 true = 本帧已被扩展消费（RAG 引用 / 进度 / 运行卡等非标准载荷），跳过标准映射
          if (onExtension({ event: frame.event, data: frame.data, json }) === true) continue;
        }
        emitAll(adapter.frameToEvents(frame, state, { messageId }));
      }
      if (aborted) {
        turnEmit({ type: "turn/end", transient: true, data: { messageId, reason: { kind: "aborted" } } });
        return;
      }
      emitAll(adapter.finalize(state, { messageId, contextWindow }));
    } catch (error) {
      if (aborted || error?.name === "AbortError") {
        turnEmit({ type: "turn/end", transient: true, data: { messageId, reason: { kind: "aborted" } } });
        return;
      }
      turnEmit({ type: "turn/end", transient: true, data: { messageId, reason: { kind: "error" }, error: { message: error?.message || String(error) } } });
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