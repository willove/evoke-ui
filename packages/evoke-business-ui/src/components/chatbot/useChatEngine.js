import { ref, computed } from "vue";
import { generateId } from "./utils";
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
      const startTime = startTimeMap.get(msg);
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
  function removeMessage(id) {
    const index = messages.value.findIndex((m) => m.id === id);
    if (index > -1) {
      messages.value.splice(index, 1);
    }
  }
  function clearMessages() {
    messages.value = [];
  }
  async function sendMessage(content, attachments = []) {
    if (loading.value) return;
    if (!content.trim() && attachments.length === 0) return;
    loading.value = true;
    inputValue.value = "";
    try {
      addUserMessage(content.trim(), attachments);
      if (options.onSend) {
        await options.onSend(content.trim(), attachments);
      }
    } catch (err) {
      const lastMsg = messages.value[messages.value.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        setMessageError(lastMsg.id, err?.message || "\u53D1\u9001\u5931\u8D25");
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
    removeMessage,
    clearMessages,
    sendMessage,
    regenerateMessage
  };
}
export {
  useChatEngine
};
