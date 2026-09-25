/**
 * useChatSession —— 接真实流式后端的推荐接法（会话日志层 + 折叠进引擎）
 *
 * 与 `useChatEngine` 的分工：
 *   - `useChatEngine` 管**视图状态**（消息、流式回写、工具状态机），不碰网络；
 *   - 本组合式管**会话日志**（游标、缺口补齐、断线恢复、幂等发送），再把持久事件
 *     折叠进引擎。宿主只提供一个窄适配器，不必自己拼状态。
 *
 * 宿主适配器（全部可选，缺省即退化成"只折叠、不发送"）：
 *   transport = {
 *     open({ cursor, generation })        // 订阅事件流；返回 unsubscribe 可选
 *     page({ from, to })                  // 补页：返回该 seq 区间的持久事件数组
 *     send({ requestId, sessionId, content, attachments, mode, context })
 *     cancel({ sessionId })
 *   }
 *
 * 事件契约（宿主把自家 wire 数据映射成这几类；其余类型按 `ignorable` 处理）：
 *   user/message      { requestId?, message: { id?, content, attachments? } }
 *   assistant/delta   { messageId, text? , think? }            瞬时（无 seq）
 *   assistant/message { messageId, message: { content, thinkContent?, usage? }, interrupted? }
 *   tool/call         { messageId, callId, name, label?, args? }
 *   tool/result       { messageId, callId, result?, error?, duration? }
 *   turn/end          { messageId, reason: { kind } , error? }
 *   reason.kind: completed / max-tokens / aborted / interrupted / blocked / error
 *
 * 三条不变量由 sessionLog 保证：连续 seq、游标只被持久事件推进、恢复不倒退。
 * 本文件只负责"把日志折叠成引擎状态"与"发送/停止"，不重复实现它们。
 */
import { onScopeDispose, ref, shallowRef } from "vue";
import { createSessionLog } from "./sessionLog";
import { useChatEngine } from "./useChatEngine";

function newRequestId() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 把 `turn/end` 的 reason 归一成引擎的收尾动作 */
function endAction(reason) {
  const kind = typeof reason === "string" ? reason : reason?.kind;
  if (kind === "error") return "error";
  if (kind === "aborted" || kind === "interrupted" || kind === "blocked") return "cancel";
  return "complete"; // completed / max-tokens / forked / 未知：保留已产出的内容收尾
}

/**
 * 取宿主给的 messageId 对应的消息；引擎里还没有就地建一条并用宿主的 id 命名。
 * 宿主可能只推持久事件（没有瞬时增量预热），所以每条 assistant/tool 事件都要能自建。
 */
function ensureMessage(engine, id) {
  if (!id) return engine.createAssistantMessage().id;
  if (engine.messages.value.some((m) => m.id === id)) return id;
  const created = engine.createAssistantMessage();
  engine.updateMessage(created.id, { id });
  return id;
}

/**
 * 单条事件 → 引擎。返回 true 表示已被消化（未知事件返回 false，由调用方按 ignorable 处理）。
 * 导出出来是为了可单测、也方便宿主在事件上叠自己的语义。
 */
export function applySessionEvent(engine, event) {
  const type = event?.type;
  const data = event?.data || {};
  const targetId = data.messageId || data.message?.id || data.id;

  switch (type) {
    case "user/message": {
      engine.addUserMessage(data.message?.content ?? "", data.message?.attachments || []);
      return true;
    }
    case "assistant/delta": {
      if (!targetId) return false;
      ensureMessage(engine, targetId);
      if (data.think) engine.appendThinkContent(targetId, data.think);
      if (data.text) engine.appendContent(targetId, data.text);
      return true;
    }
    case "assistant/message": {
      const patch = {};
      if (data.message?.content !== undefined) patch.content = data.message.content;
      if (data.message?.thinkContent !== undefined) patch.thinkContent = data.message.thinkContent;
      if (data.message?.usage !== undefined) patch.usage = data.message.usage;
      if (!targetId) return false;
      ensureMessage(engine, targetId);
      engine.updateMessage(targetId, patch);
      if (data.interrupted) engine.cancelMessage(targetId);
      return true;
    }
    case "tool/call": {
      if (!targetId || !data.callId) return false;
      ensureMessage(engine, targetId);
      engine.startToolCall(targetId, {
        id: data.callId,
        name: data.name,
        label: data.label,
        args: data.args,
      });
      return true;
    }
    case "tool/result": {
      if (!targetId || !data.callId) return false;
      ensureMessage(engine, targetId);
      const code = typeof data.error === "string" ? "" : data.error?.code;
      if (code === "interrupted") {
        // 被中断的调用落 stopped（本库术语 cancelled），不回填成失败
        engine.updateToolCall(targetId, data.callId, { status: "cancelled", streaming: false });
      } else if (data.error) {
        engine.failToolCall(targetId, data.callId, data.error.reason || data.error.message || data.error);
      } else {
        engine.completeToolCall(targetId, data.callId, data.result);
      }
      return true;
    }
    case "workspace/changes": {
      // 事件带 messageId 就挂那条；不带则挂最后一条助手消息（DSH 的 turn-tail 语义）
      const target = targetId || [...engine.messages.value].reverse().find((m) => m.role === "assistant")?.id;
      if (!target) return false;
      engine.setChanges(target, data);
      return true;
    }
    case "turn/end": {
      if (!targetId) return true;
      ensureMessage(engine, targetId);
      const action = endAction(data.reason);
      if (action === "cancel") engine.cancelMessage(targetId);
      else if (action === "error") engine.setMessageError(targetId, data.error?.message || data.message || "");
      else engine.completeMessage(targetId);
      engine.loading.value = false;
      return true;
    }
    // 结构性事件：真实宿主必发，但对消息状态没有直接作用——认领即可，不判未知
    case "turn/start":
    case "step/start":
    case "step/end":
    case "assistant/attempt":
    case "session/title":
      return true;
    // 审批 / 提问是"交互态"而不是对话内容：状态由 useChatSession 自己管，这里只认领、不落引擎
    case "approval/request":
    case "approval/decided":
    case "question/request":
    case "question/decided":
    case "context/usage":
      return true;
    default:
      return false;
  }
}

export function useChatSession(options = {}) {
  const transport = options.transport || {};
  const sessionId = options.sessionId || "";
  const fold = options.fold; // 宿主扩展：不认识的事件交给他，返回 true 表示已消化

  const engine = options.engine || useChatEngine({
    initialMessages: options.initialMessages || [],
    onSend: (text, attachments, context) => submit(text, attachments, context),
  });

  const state = shallowRef({
    connected: false,
    repairing: false,
    degraded: false,
    cursor: 0,
    pending: [],
    violations: [],
  });
  /** 已发出、还没等到持久回声的消息：UI 可用它渲染乐观气泡 */
  const pending = ref([]);
  /** 待审批请求：非空时输入区应让位给审批面板（EbChatApproval） */
  const approval = ref(null);
  /** 待回答请求：审批缺席时输入区应让位给提问面板（EbChatQuestion） */
  const question = ref(null);
  /** 上下文占用：{ used, capacity, breakdown }，驱动输入区上方的占用环 */
  const context = ref({ used: 0, capacity: 0, breakdown: null });
  /** requestId → 载荷，供同 id 幂等重发 */
  const flights = new Map();
  let foldedUpTo = 0;
  let unsubscribe = null;

  const log = options.log || createSessionLog({
    onGap: (gap) => requestPage(gap),
    onViolation: (row) => sync({ violations: [...state.value.violations, row] }),
    onTransient: (event) => {
      // 瞬时事件不进日志，但要和持久事件走同一套折叠（否则乐观气泡永远摘不掉）
      foldOne(event, { durable: false });
    },
  });

  /** 上下文遥测：宿主报多少信多少，缺窗口容量时环自己不显示 */
  function setContext(patch = {}) {
    context.value = { ...context.value, ...patch };
    sync();
  }

  /** 审批/提问/遥测等"旁路状态"事件：认领返回 true（它们不是对话内容，不落引擎） */
  function handleInteraction(event) {
    const data = event?.data || {};
    if (event?.type === "approval/request") {
      approval.value = {
        id: data.id,
        toolName: data.toolName,
        reason: data.reason,
        detail: data.detail,
        callId: data.callId,
        status: "pending",
      };
      sync();
      return true;
    }
    if (event?.type === "approval/decided") {
      if (!approval.value || (data.id && approval.value.id !== data.id)) return true;
      approval.value = null;
      sync();
      return true;
    }
    if (event?.type === "question/request") {
      question.value = { id: data.id, items: data.items || [], status: "pending" };
      sync();
      return true;
    }
    if (event?.type === "question/decided") {
      if (!question.value || (data.id && question.value.id !== data.id)) return true;
      question.value = null;
      sync();
      return true;
    }
    if (event?.type === "context/usage") {
      setContext(data);
      return true;
    }
    return false;
  }

  /**
   * 回传提问结论：`answer` 形如 `{ status: 'answered' | 'cancelled', answers: [{ id, selected, custom, skipped }] }`
   * （面板直接抛什么就转什么，这里不重排语义）。
   */
  async function respondQuestion(answer) {
    const current = question.value;
    if (!current || current.status !== "pending") return false;
    question.value = { ...current, status: answer?.status || "answered" };
    sync();
    try {
      await transport.answerQuestion?.({ id: current.id, ...answer, sessionId });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 回传审批结论：`'allowed-once' | 'rejected'`（与 DSH 一致，没有"总是允许"——
   * 「总是」属于会话级权限模式，不塞进单次审批）。
   */
  async function respondApproval(outcome) {
    const current = approval.value;
    if (!current || current.status !== "pending") return false;
    approval.value = { ...current, status: outcome === "rejected" ? "rejected" : "approved" };
    sync();
    try {
      await transport.approve?.({ id: current.id, outcome, sessionId });
      return true;
    } catch {
      return false;
    }
  }

  function sync(patch = {}) {
    state.value = {
      ...state.value,
      repairing: log.repairing,
      cursor: log.cursor,
      pending: pending.value,
      ...patch,
    };
  }

  /**
   * 折叠单条事件（持久与瞬时共用）：
   * 交互态先认领 → 内容折进引擎 → 用户消息的 requestId 摘掉乐观气泡 →
   * 不认识的按 ignorable 判降级。
   */
  function foldOne(entry, { durable = true } = {}) {
    if (handleInteraction(entry)) return;
    if (applySessionEvent(engine, entry)) {
      // 回声到了：同 requestId 的乐观气泡收掉（与 DSH 的 retireAdmittedSubmission 同构）
      if (entry.type === "user/message" && entry.data?.requestId) retireEcho(entry.data.requestId);
      return;
    }
    // 瞬时事件不进日志，未知即丢；持久事件的未知要判是否可忽略
    if (!durable) return;
    if (!log.acceptUnknown(entry)) {
      sync({ degraded: true });
      options.onDegraded?.(entry);
    }
  }

  /** 把日志里所有还没折叠的持久事件折进引擎（幂等：按 seq 记账） */
  function foldNewEntries() {
    for (const entry of log.entries) {
      if (entry.seq <= foldedUpTo) continue;
      foldedUpTo = entry.seq;
      foldOne(entry, { durable: true });
    }
  }

  log.subscribe(() => {
    foldNewEntries();
    sync();
  });

  async function requestPage({ from, to }) {
    if (typeof transport.page !== "function") return;
    try {
      const records = await transport.page({ from, to, sessionId });
      log.repair(records || []);
    } catch (err) {
      sync({ violations: [...state.value.violations, { code: "page-failed", detail: err?.message || String(err), at: Date.now() }] });
    }
  }

  /** 打开/重开会话：装快照并订阅；返回 unsubscribe */
  function open(snapshotInput = {}) {
    log.beginGeneration();
    log.install(snapshotInput);
    sync({ connected: true });
    const off = transport.open?.({ cursor: log.cursor, sessionId, onEvent: receive, onGap: requestPage });
    unsubscribe = typeof off === "function" ? off : null;
    return unsubscribe;
  }

  /** 收到一条 wire 事件：先过日志（连续性/缺口），再折叠 */
  function receive(event) {
    return log.apply(event);
  }

  async function submit(text, attachments = [], context) {
    const requestId = context?.requestId || newRequestId();
    const payload = {
      requestId,
      sessionId,
      content: [{ type: "text", text }],
      attachments,
      mode: context?.mode || "queue",
      context,
    };
    flights.set(requestId, payload);
    pending.value = [...pending.value, { requestId, text, attachments, context }];
    engine.loading.value = true;
    sync();
    try {
      await transport.send?.(payload);
      return requestId;
    } catch (err) {
      // 失败不回滚输入：保留 requestId 以便幂等重发，并把错误挂到引擎上（宿主可提示）
      engine.setMessageError(
        engine.messages.value[engine.messages.value.length - 1]?.id || "",
        err?.message || String(err),
      );
      return requestId;
    } finally {
      sync();
    }
  }

  /** 同一 requestId 重发（服务端按 requestId 去重，重复投递是安全的）；失败返回 false 不抛 */
  async function retrySend(requestId) {
    const payload = flights.get(requestId);
    if (!payload) return false;
    try {
      await transport.send?.(payload);
      return true;
    } catch {
      return false;
    }
  }

  /** 停止：交给宿主的协作式中止（本库不持 AbortController） */
  async function stop() {
    await transport.cancel?.({ sessionId });
  }

  /** 持久回声到了：摘掉对应的乐观气泡 */
  function retireEcho(requestId) {
    if (!requestId) return;
    pending.value = pending.value.filter((p) => p.requestId !== requestId);
    flights.delete(requestId);
    if (!pending.value.length) engine.loading.value = false;
    sync();
  }

  // user/message 的持久回声 = 该条已被接受，收掉乐观气泡（见 foldNewEntries）

  onScopeDispose(() => {
    unsubscribe?.();
    transport.close?.({ sessionId });
  });

  return {
    engine,
    log,
    state,
    pending,
    approval,
    question,
    context,
    setContext,
    messages: engine.messages,
    open,
    receive,
    submit,
    retrySend,
    stop,
    respondApproval,
    respondQuestion,
    retireEcho,
  };
}