import { ref, computed, toRaw } from "vue";
import { generateId } from "./utils";
import { chatLabels as labels } from "./labels";
const startTimeMap = /* @__PURE__ */ new WeakMap();
function useChatEngine(options = {}) {
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
  function appendThinkContent(id, content) {
    const msg = messages.value.find((m) => m.id === id);
    if (msg) {
      msg.thinkContent = (msg.thinkContent || "") + content;
      msg.thinking = true;
    }
  }
  function startThinking(id) {
    updateMessage(id, { thinking: true });
  }
  function stopThinking(id) {
    updateMessage(id, { thinking: false });
  }
  function completeMessage(id) {
    const msg = messages.value.find((m) => m.id === id);
    if (msg) {
      // find 返回的是响应式代理，startTimeMap 以原始对象为键，必须 toRaw 才能命中
      const startTime = startTimeMap.get(toRaw(msg));
      const duration = startTime ? Date.now() - startTime : void 0;
      msg.status = "done";
      msg.thinking = false;
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
   */
  function cancelMessage(id) {
    updateMessage(id, { status: "cancelled", thinking: false });
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
  // 工具调用挂在具体的 assistant 消息上，宿主 transport 里按消息 id 驱动
  function findMessage(id) {
    return messages.value.find((m) => m.id === id);
  }
  function addToolCall(messageId, call = {}) {
    const msg = findMessage(messageId);
    if (!msg) return null;
    const tc = {
      id: call.id || generateId(),
      name: call.name || "tool",
      label: call.label || "",
      args: call.args ?? null,
      result: undefined,
      status: call.status || "pending",
      duration: 0,
      error: "",
      startedAt: 0
    };
    msg.toolCalls = [...(msg.toolCalls || []), tc];
    return tc;
  }
  function updateToolCall(messageId, callId, updates) {
    const msg = findMessage(messageId);
    if (!msg?.toolCalls) return;
    msg.toolCalls = msg.toolCalls.map((t) => t.id === callId ? { ...t, ...updates } : t);
  }
  /** 开始一次工具调用：给了已存在的 id 就复用，否则新建。返回调用 id。 */
  function startToolCall(messageId, call = {}) {
    const msg = findMessage(messageId);
    if (!msg) return null;
    const existing = call.id && (msg.toolCalls || []).find((t) => t.id === call.id);
    const tc = existing || addToolCall(messageId, call);
    if (!tc) return null;
    updateToolCall(messageId, tc.id, { status: "running", startedAt: Date.now() });
    return tc.id;
  }
  function completeToolCall(messageId, callId, result) {
    const msg = findMessage(messageId);
    const tc = (msg?.toolCalls || []).find((t) => t.id === callId);
    const duration = tc?.startedAt ? Date.now() - tc.startedAt : 0;
    updateToolCall(messageId, callId, { status: "done", result, duration });
  }
  function failToolCall(messageId, callId, error) {
    const text = error instanceof Error ? error.message : error;
    updateToolCall(messageId, callId, { status: "error", error: text || labels.tool.error });
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
    setUsage
  };
}
export {
  useChatEngine
};
