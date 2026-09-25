import { ref, computed, toRaw } from "vue";
import { generateId } from "./utils";
import { useChatLabels } from "./labels";
const startTimeMap = /* @__PURE__ */ new WeakMap();
/** 思考起点：首次进入思考态时记下，结束（stopThinking / completeMessage）时折成 thinkDuration */
const thinkStartMap = /* @__PURE__ */ new WeakMap();
function useChatEngine(options = {}) {
  const labels = useChatLabels();
  const messages = ref(options.initialMessages || []);
  const loading = ref(false);
  const inputValue = ref("");
  // 生成期间的待发送队列；steerable 为真时改走宿主注入当前轮
  const pending = ref([]);
  const steerable = ref(options.steerable ?? false);
  const assistantMessage = computed(() => {
    return messages.value.find((m) => m.role === "assistant" && (m.status === "streaming" || m.status === "pending"));
  });
  function addUserMessage(content, attachments) {
    const message = {
      id: generateId(),
      role: "user",
      content,
      attachments: attachments || [],
      status: "done",
      createdAt: Date.now()
    };
    messages.value.push(message);
    return message;
  }
  function createAssistantMessage() {
    const now = Date.now();
    const message = {
      id: generateId(),
      role: "assistant",
      content: "",
      thinkContent: "",
      thinking: false,
      status: "pending",
      createdAt: now
    };
    startTimeMap.set(message, now);
    messages.value.push(message);
    return message;
  }
  function updateMessage(id, updates) {
    const msg = messages.value.find((m) => m.id === id);
    if (msg) {
      Object.assign(msg, updates);
    }
  }
  function appendContent(id, content) {
    const msg = messages.value.find((m) => m.id === id);
    if (msg) {
      msg.content += content;
      if (msg.status !== "streaming") {
        msg.status = "streaming";
      }
    }
  }
  function markThinkStart(msg) {
    // 重新开始思考：上一次的「被打断」不再成立
    if (msg.thinkInterrupted) msg.thinkInterrupted = false;
    if (!thinkStartMap.has(toRaw(msg))) thinkStartMap.set(toRaw(msg), Date.now());
  }
  /** 结束思考：把起点折成 thinkDuration（毫秒），思考块据此显示「（用时 X）」 */
  function settleThinkDuration(msg) {
    const start = thinkStartMap.get(toRaw(msg));
    if (!start) return;
    thinkStartMap.delete(toRaw(msg));
    const span = Date.now() - start;
    if (span > 0) msg.thinkDuration = span;
  }
  function appendThinkContent(id, content) {
    const msg = messages.value.find((m) => m.id === id);
    if (msg) {
      msg.thinkContent = (msg.thinkContent || "") + content;
      msg.thinking = true;
      markThinkStart(msg);
    }
  }
  function startThinking(id) {
    const msg = messages.value.find((m) => m.id === id);
    if (!msg) return;
    msg.thinking = true;
    markThinkStart(msg);
  }
  function stopThinking(id) {
    const msg = messages.value.find((m) => m.id === id);
    if (!msg) return;
    msg.thinking = false;
    settleThinkDuration(msg);
  }
  function completeMessage(id) {
    const msg = messages.value.find((m) => m.id === id);
    if (msg) {
      // find 返回的是响应式代理，startTimeMap 以原始对象为键，必须 toRaw 才能命中
      const startTime = startTimeMap.get(toRaw(msg));
      const duration = startTime ? Date.now() - startTime : void 0;
      msg.status = "done";
      msg.thinking = false;
      settleThinkDuration(msg);
      if (duration && duration > 0) {
        msg.duration = duration;
      }
    }
  }
  function setMessageError(id, error) {
    updateMessage(id, { status: "error", error, thinking: false });
  }
  /**
   * 中断生成：保留已流出的正文，状态记 cancelled。
   * 走 setMessageError 会把半截回答整体换成红色错误块，那是错的表达。
   * 若中断发生在思考阶段，额外记 thinkInterrupted——思考块据此说「思考已中断」，
   * 不能继续显示「已深度思考」（那等于谎报思考已完成）。
   */
  function cancelMessage(id) {
    const msg = messages.value.find((m) => m.id === id);
    if (!msg) return;
    if (msg.thinking) msg.thinkInterrupted = true;
    msg.thinking = false;
    // 与 completeMessage 同款收尾：思考起点折成 thinkDuration（没思考过则不动）
    settleThinkDuration(msg);
    // 还在跑的工具调用不能继续转圈：与消息同一终态语义（cancelled），
    // 并停止接收后续增量。DSH 把被中断的调用映射成 stopped，取意相同。
    if (msg.toolCalls?.length) {
      const cancelTree = (list) => (list || []).map((t) => ({
        ...t,
        ...(t.status === "running" || t.status === "pending" ? { status: "cancelled", streaming: false } : {}),
        ...(t.subCalls?.length ? { subCalls: cancelTree(t.subCalls) } : {})
      }));
      msg.toolCalls = cancelTree(msg.toolCalls);
    }
    msg.status = "cancelled";
  }
  function removeMessage(id) {
    const index = messages.value.findIndex((m) => m.id === id);
    if (index > -1) {
      messages.value.splice(index, 1);
    }
  }
  function clearMessages() {
    messages.value = [];
  }
  async function sendMessage(content, attachments = [], context) {
    const text = String(content ?? "").trim();
    if (loading.value) {
      // 生成中不再静默丢弃：可转向就交给宿主注入到当前这一轮，否则排队等下一轮
      if (steerable.value && options.onSteer) {
        inputValue.value = "";
        await options.onSteer(text, attachments, context);
        return "steered";
      }
      enqueue(text, attachments, context);
      return "queued";
    }
    if (!text && attachments.length === 0) return;
    loading.value = true;
    inputValue.value = "";
    try {
      addUserMessage(text, attachments);
      if (options.onSend) {
        await options.onSend(text, attachments, context);
      }
    } catch (err) {
      const lastMsg = messages.value[messages.value.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        setMessageError(lastMsg.id, err?.message || labels.engine.sendFailed);
      }
    } finally {
      loading.value = false;
      // 一轮结束后自动带出排队中的下一条；每条消费一项，不会自激
      if (pending.value.length) flushQueue();
    }
  }
  function regenerateMessage(messageId) {
    const index = messages.value.findIndex((m) => m.id === messageId);
    if (index <= 0) return;
    let userMsgIndex = index - 1;
    while (userMsgIndex >= 0 && messages.value[userMsgIndex]?.role !== "user") {
      userMsgIndex--;
    }
    if (userMsgIndex >= 0) {
      messages.value.splice(userMsgIndex + 1);
      const userMsg = messages.value[userMsgIndex];
      sendMessage(userMsg.content, userMsg.attachments || []);
    }
  }
  /**
   * 编辑用户消息后就地重发：截断该条之后的所有消息，不重复追加提问。
   * 与 regenerateMessage 的区别是提问文本本身变了，且要留「已编辑」标记。
   */
  async function editAndResend(messageId, content, context) {
    if (loading.value) return;
    const text = (content || "").trim();
    const index = messages.value.findIndex((m) => m.id === messageId);
    if (index < 0 || !text) return;
    const edited = {
      ...messages.value[index],
      content: text,
      edited: true,
      status: "done",
      createdAt: Date.now()
    };
    const attachments = edited.attachments || [];
    messages.value.splice(index, messages.value.length - index, edited);
    loading.value = true;
    inputValue.value = "";
    try {
      if (options.onSend) {
        await options.onSend(text, attachments, context);
      }
    } catch (err) {
      const lastMsg = messages.value[messages.value.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        setMessageError(lastMsg.id, err?.message || labels.engine.sendFailed);
      }
    } finally {
      loading.value = false;
    }
  }
  // ── 生成中的输入排队 ──
  // 用户在生成期间发出的消息不再被丢掉：默认排队，steerable 时转交宿主注入当前轮
  function enqueue(content, attachments = [], context) {
    const text = String(content ?? "").trim();
    if (!text && !attachments.length) return null;
    const item = { id: generateId(), content: text, attachments, context, createdAt: Date.now() };
    pending.value = [...pending.value, item];
    options.onQueueChange?.(pending.value);
    return item.id;
  }
  function dequeue(id) {
    if (!pending.value.some((i) => i.id === id)) return;
    pending.value = pending.value.filter((i) => i.id !== id);
    options.onQueueChange?.(pending.value);
  }
  function clearQueue() {
    pending.value = [];
    options.onQueueChange?.([]);
  }
  /** 手动带出下一条（自动 flush 已接在每轮结束时，这里留给宿主做「立即发送」） */
  async function flushQueue() {
    if (loading.value) return false;
    const [next, ...rest] = pending.value;
    if (!next) return false;
    pending.value = rest;
    options.onQueueChange?.(pending.value);
    await sendMessage(next.content, next.attachments, next.context);
    return true;
  }

  // ── 计划 ──
  function setPlan(messageId, plan) {
    updateMessage(messageId, { plan });
  }
  function updatePlanStep(messageId, stepId, patch) {
    const msg = findMessage(messageId);
    if (!msg?.plan) return;
    msg.plan = {
      ...msg.plan,
      steps: (msg.plan.steps || []).map((s) => s.id === stepId ? { ...s, ...patch } : s)
    };
  }
  function startPlanStep(messageId, stepId) {
    updatePlanStep(messageId, stepId, { status: "running", startedAt: Date.now() });
  }
  function completePlanStep(messageId, stepId, detail) {
    const msg = findMessage(messageId);
    const step = (msg?.plan?.steps || []).find((s) => s.id === stepId);
    const duration = step?.startedAt ? Date.now() - step.startedAt : 0;
    updatePlanStep(messageId, stepId, detail === void 0 ? { status: "done", duration } : { status: "done", duration, detail });
  }
  function failPlanStep(messageId, stepId, error) {
    const text = error instanceof Error ? error.message : error;
    updatePlanStep(messageId, stepId, { status: "error", detail: text || labels.plan.status.error });
  }
  function skipPlanStep(messageId, stepId) {
    updatePlanStep(messageId, stepId, { status: "skipped" });
  }

  // ── 人工确认门 ──
  function setConfirmation(messageId, confirmation) {
    updateMessage(messageId, { confirmation });
  }
  /**
   * 记录响应。动作的语义由它自己声明：actions[].status 取 approved / rejected；
   * 未声明时按 type 兜底——danger 视为拒绝，其余视为批准。不替宿主猜业务含义，
   * 只保证「点了拒绝不会显示成已批准」这个方向不出错。
   */
  function respondConfirmation(messageId, actionKey) {
    const msg = findMessage(messageId);
    const current = msg?.confirmation;
    if (!current || (current.status && current.status !== "pending")) return;
    const action = (current.actions || []).find((a) => a.key === actionKey);
    if (!action) return;
    const status = action.status || (action.type === "danger" ? "rejected" : "approved");
    msg.confirmation = { ...current, status, responseKey: actionKey, respondedAt: Date.now() };
  }

  // ── 用量 ──
  // 只存不解析：成本要价目表，那是宿主的业务数据，引擎不猜
  function setUsage(messageId, usage) {
    updateMessage(messageId, { usage: usage || null });
  }
  /** 本轮改动汇总 { files: [{ path, display?, added?, deleted?, binary?, oversized? }], total?, added?, deleted? } */
  function setChanges(messageId, changes) {
    updateMessage(messageId, { changes: changes || null });
  }

  // ── 调用链追踪 ──
  // 只记 id / 地址，不拼 URL：各家追踪平台路径不同，模板由宿主给
  function setTrace(messageId, trace = {}) {
    updateMessage(messageId, {
      traceId: trace.traceId || "",
      traceUrl: trace.traceUrl || ""
    });
  }

  // ── 产物 ──
  function addArtifact(messageId, artifact = {}) {
    const msg = findMessage(messageId);
    if (!msg) return null;
    const item = { id: generateId(), type: "", title: "", ...artifact };
    msg.artifacts = [...(msg.artifacts || []), item];
    return item;
  }
  function updateArtifact(messageId, artifactId, patch) {
    const msg = findMessage(messageId);
    if (!msg?.artifacts) return;
    msg.artifacts = msg.artifacts.map((a) => a.id === artifactId ? { ...a, ...patch } : a);
  }
  function removeArtifact(messageId, artifactId) {
    const msg = findMessage(messageId);
    if (!msg?.artifacts) return;
    msg.artifacts = msg.artifacts.filter((a) => a.id !== artifactId);
  }

  // ── 工具调用状态机 ──
  // 工具调用挂在具体的 assistant 消息上，宿主 transport 里按消息 id 驱动；
  // 调用可以带 subCalls（并行/嵌套派发），所有按 id 的操作都递归到子层。
  /** 子调用最大嵌套层数：挡住异常数据造成的无限递归（DSH 同样设了上限） */
  const MAX_TOOL_DEPTH = 16;
  function findMessage(id) {
    return messages.value.find((m) => m.id === id);
  }
  /** 在树里按 id 定位，同时带回深度（供嵌套上限判断） */
  function locateToolCall(list, callId, depth = 0) {
    for (const t of list || []) {
      if (t.id === callId) return { call: t, depth };
      const hit = locateToolCall(t.subCalls, callId, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  /** 递归替换命中的节点；没命中就原样返回（引用不变，宿主可据此跳过重渲染） */
  function mapToolCalls(list, callId, fn) {
    let changed = false;
    const next = (list || []).map((t) => {
      if (t.id === callId) {
        changed = true;
        return fn(t);
      }
      const sub = mapToolCalls(t.subCalls, callId, fn);
      if (sub !== t.subCalls) {
        changed = true;
        return { ...t, subCalls: sub };
      }
      return t;
    });
    return changed ? next : list;
  }
  /** 递归生成一个工具调用节点（含空的 subCalls，供宿主直接 push） */
  function makeToolCall(call = {}) {
    return {
      id: call.id || generateId(),
      name: call.name || "tool",
      label: call.label || "",
      args: call.args ?? null,
      result: undefined,
      status: call.status || "pending",
      duration: 0,
      error: "",
      streaming: false,
      startedAt: 0,
      subCalls: []
    };
  }
  function addToolCall(messageId, call = {}) {
    const msg = findMessage(messageId);
    if (!msg) return null;
    const tc = makeToolCall(call);
    msg.toolCalls = [...(msg.toolCalls || []), tc];
    return tc;
  }
  /** 给某个调用挂一个子调用（并行派发/PTC 子步）；返回子调用 id（与 startToolCall 一致），父不存在或超深返回 null */
  function addSubToolCall(messageId, parentCallId, call = {}) {
    const msg = findMessage(messageId);
    if (!msg) return null;
    const hit = locateToolCall(msg.toolCalls, parentCallId);
    if (!hit || hit.depth >= MAX_TOOL_DEPTH) return null;
    const child = makeToolCall(call);
    msg.toolCalls = mapToolCalls(msg.toolCalls, parentCallId, (t) => ({
      ...t,
      subCalls: [...(t.subCalls || []), child]
    }));
    return child.id;
  }
  function updateToolCall(messageId, callId, updates) {
    const msg = findMessage(messageId);
    if (!msg?.toolCalls) return;
    msg.toolCalls = mapToolCalls(msg.toolCalls, callId, (t) => ({ ...t, ...updates }));
  }
  function findToolCall(messageId, callId) {
    const msg = findMessage(messageId);
    return msg ? locateToolCall(msg.toolCalls, callId)?.call || null : null;
  }
  /** 开始一次工具调用：给了已存在的 id 就复用，否则新建。返回调用 id。 */
  function startToolCall(messageId, call = {}) {
    const msg = findMessage(messageId);
    if (!msg) return null;
    const existing = call.id ? locateToolCall(msg.toolCalls, call.id)?.call : null;
    const tc = existing || addToolCall(messageId, call);
    if (!tc) return null;
    updateToolCall(messageId, tc.id, { status: "running", streaming: false, startedAt: Date.now() });
    return tc.id;
  }
  /**
   * 工具输出的流式增量：命令与检索类工具边跑边出结果，宿主逐片回写即可。
   * 复用同一张卡（不新建），状态自动转 running 并打上 streaming（卡片据此显示光标、贴底滚动）。
   * 无 id 时返回 null；已 done / error 的调用不再接收增量，避免回填把终态改回去。
   */
  function appendToolCallResult(messageId, callId, chunk) {
    const msg = findMessage(messageId);
    const tc = msg ? locateToolCall(msg.toolCalls, callId)?.call : null;
    if (!tc || tc.status === "done" || tc.status === "error" || tc.status === "cancelled") return null;
    const text = String(chunk ?? "");
    const base = tc.result === undefined || tc.result === null ? "" : String(tc.result);
    updateToolCall(messageId, callId, {
      result: base + text,
      status: "running",
      streaming: true,
      startedAt: tc.startedAt || Date.now()
    });
    return tc.id;
  }
  /**
   * 收尾工具调用。`result` 省略时保留流式累积的输出——流式接法下调用方
   * 往往没有完整结果可给，不能因为没传就把已流出的内容抹掉。
   */
  function completeToolCall(messageId, callId, result) {
    const msg = findMessage(messageId);
    const tc = msg ? locateToolCall(msg.toolCalls, callId)?.call : null;
    // 已被中断的调用是终态：迟到的 complete 不能把它改回「已完成」
    if (!tc || tc.status === "cancelled") return;
    const duration = tc?.startedAt ? Date.now() - tc.startedAt : 0;
    const patch = { status: "done", streaming: false, duration };
    if (result !== undefined) patch.result = result;
    updateToolCall(messageId, callId, patch);
  }
  function failToolCall(messageId, callId, error) {
    const msg = findMessage(messageId);
    const tc = msg ? locateToolCall(msg.toolCalls, callId)?.call : null;
    if (!tc || tc.status === "cancelled") return;
    const text = error instanceof Error ? error.message : error;
    updateToolCall(messageId, callId, { status: "error", streaming: false, error: text || labels.tool.error });
  }
  /** 记录一条消息的点赞点踩与结构化原因 */
  function setFeedback(messageId, value, payload = {}) {
    updateMessage(messageId, {
      feedback: value || null,
      feedbackReasons: payload.reasons || [],
      feedbackNote: payload.note || ""
    });
  }
  return {
    messages,
    loading,
    inputValue,
    assistantMessage,
    addUserMessage,
    createAssistantMessage,
    updateMessage,
    appendContent,
    appendThinkContent,
    startThinking,
    stopThinking,
    completeMessage,
    setMessageError,
    cancelMessage,
    removeMessage,
    clearMessages,
    sendMessage,
    regenerateMessage,
    pending,
    steerable,
    enqueue,
    dequeue,
    clearQueue,
    flushQueue,
    editAndResend,
    setFeedback,
    addToolCall,
    updateToolCall,
    startToolCall,
    addSubToolCall,
    findToolCall,
    appendToolCallResult,
    completeToolCall,
    failToolCall,
    setPlan,
    updatePlanStep,
    startPlanStep,
    completePlanStep,
    failPlanStep,
    skipPlanStep,
    setConfirmation,
    respondConfirmation,
    addArtifact,
    updateArtifact,
    removeArtifact,
    setUsage,
    setChanges,
    setTrace
  };
}
export {
  useChatEngine
};
