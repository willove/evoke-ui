import { ref, computed, toRaw } from "vue";
import { generateId } from "./utils";
import { chatLabels as labels } from "./labels";
const startTimeMap = /* @__PURE__ */ new WeakMap();
function useChatEngine(options = {}) {
  const messages = ref(options.initialMessages || []);
  const loading = ref(false);
  const inputValue = ref("");
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
    if (loading.value) return;
    if (!content.trim() && attachments.length === 0) return;
    loading.value = true;
    inputValue.value = "";
    try {
      addUserMessage(content.trim(), attachments);
      if (options.onSend) {
        await options.onSend(content.trim(), attachments, context);
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
    editAndResend,
    setFeedback,
    addToolCall,
    updateToolCall,
    startToolCall,
    completeToolCall,
    failToolCall
  };
}
export {
  useChatEngine
};
