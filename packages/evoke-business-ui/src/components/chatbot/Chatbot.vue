<template>
  <ChatContent 
    :height="height" 
    :width="width"
    class="eb-chatbot"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    
    <ChatList
      ref="listRef"
      :messages="messages"
      :show-thinking="showThinking"
      :avatar-user="avatarUser"
      :avatar-assistant="avatarAssistant"
      :user-name="userName"
      :assistant-name="assistantName"
      :render-mode="renderMode"
      :actions="actions"
      :auto-scroll="autoScroll"
      :editable="editable"
      :edit-max-length="editMaxLength"
      :feedback="feedback"
      :feedback-reasons="feedbackReasons"
      :tool-retryable="toolRetryable"
      :speech="speech"
      @copy="handleCopy"
      @regenerate="handleRegenerate"
      @action="handleAction"
      @edit="handleEdit"
      @feedback="handleFeedback"
      @suggestion-click="handleSuggestionClick"
      @citation-click="handleCitationClick"
      @tool-retry="handleToolRetry"
      @plan-toggle="(p) => emit('plan-toggle', p)"
      @plan-step-click="(step, i, m) => emit('plan-step-click', step, i, m)"
      @confirm-respond="(c, k, m) => emit('confirm-respond', c, k, m)"
      @artifact-open="(a, m) => emit('artifact-open', a, m)"
      @artifact-copy="(a, m) => emit('artifact-copy', a, m)"
      @file-select="(f, p, m) => emit('file-select', f, p, m)"
    >
      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>
      <template v-if="$slots['message-header']" #header>
        <slot name="message-header" />
      </template>
      <!-- 只在宿主真的传了时才转发，否则 ChatList 走它自己的默认渲染 -->
      <template v-if="$slots.message" #message="p">
        <slot name="message" v-bind="p" />
      </template>
      <template v-if="$slots['message-content']" #message-content="p">
        <slot name="message-content" v-bind="p" />
      </template>
      <template v-if="$slots['tool-result']" #tool-result="p">
        <slot name="tool-result" v-bind="p" />
      </template>
      <template v-if="$slots['tool-args']" #tool-args="p">
        <slot name="tool-args" v-bind="p" />
      </template>
    </ChatList>
    
    <template #footer>
      <div class="eb-chatbot__sender-wrapper">
        <slot name="sender-prepend" />
        <ChatSender
          ref="senderRef"
          v-model="inputValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :loading="loading"
          :stoppable="stoppable"
          :allow-attachments="allowAttachments"
          :max-attachments="maxAttachments"
          :max-length="maxLength"
          :show-word-count="showWordCount"
          :send-on-enter="sendOnEnter"
          :accept="accept"
          :max-file-size="maxFileSize"
          :allow-drop="allowDrop"
          :queueable="queueable"
          @send="handleSend"
          @stop="handleStop"
          @attachment-add="handleAttachmentAdd"
          @attachment-reject="handleAttachmentReject"
        >
          <template v-if="$slots['sender-toolbar']" #toolbar>
            <slot name="sender-toolbar" />
          </template>
        </ChatSender>
        <slot name="sender-append" />
      </div>
      <div v-if="showTip" class="eb-chatbot__tip">
        <slot name="tip">
          <span>{{ labels.message.tip }}</span>
        </slot>
      </div>
    </template>
  </ChatContent>
</template>

<script setup>
import { ref, watch, computed, nextTick } from "vue";
import { generateId } from "./utils";
import { chatLabels as labels } from "./labels";
import ChatContent from "./ChatContent.vue";
import ChatList from "./ChatList.vue";
import ChatSender from "./ChatSender.vue";
const props = defineProps({
  modelValue: { type: Array, required: false, default: () => [] },
  placeholder: { type: String, required: false, default: labels.sender.sendOnEnterPlaceholder },
  loading: { type: Boolean, required: false, default: false },
  disabled: { type: Boolean, required: false, default: false },
  showThinking: { type: Boolean, required: false, default: true },
  allowAttachments: { type: Boolean, required: false, default: true },
  maxAttachments: { type: Number, required: false, default: 5 },
  maxLength: { type: Number, required: false, default: 2e3 },
  showWordCount: { type: Boolean, required: false, default: false },
  sendOnEnter: { type: Boolean, required: false, default: true },
  actions: { type: Array, required: false, default: () => [] },
  /** 用户消息可原地编辑并重发（edit 事件交出原文与新文） */
  editable: { type: Boolean, required: false, default: false },
  editMaxLength: { type: Number, required: false, default: 0 },
  /** 助手消息显示点赞点踩 */
  feedback: { type: Boolean, required: false, default: false },
  feedbackReasons: { type: Array, required: false, default: () => [] },
  /** 工具调用失败态是否给重试钮 */
  toolRetryable: { type: Boolean, required: false, default: true },
  /** 助手消息显示朗读钮（浏览器不支持 Web Speech 时自动不渲染） */
  speech: { type: Boolean, required: false, default: false },
  /** 附件类型白名单（.ext / mime/* / mime/type，逗号分隔）；空为不限 */
  accept: { type: String, required: false, default: "" },
  /** 单个附件字节上限，0 为不限 */
  maxFileSize: { type: Number, required: false, default: 0 },
  /** 允许拖拽与粘贴投递 */
  allowDrop: { type: Boolean, required: false, default: true },
  /** 生成中允许继续发出（交给引擎即自动排队）；关掉则生成中拦下 */
  queueable: { type: Boolean, required: false, default: false },
  height: { type: [String, Number], required: false, default: "600px" },
  width: { type: [String, Number], required: false, default: "100%" },
  avatarUser: { type: String, required: false, default: "" },
  avatarAssistant: { type: String, required: false, default: "" },
  userName: { type: String, required: false, default: labels.message.user },
  assistantName: { type: String, required: false, default: labels.message.assistant },
  renderMode: { type: String, required: false, default: "markdown" },
  autoScroll: { type: Boolean, required: false, default: true },
  showTip: { type: Boolean, required: false, default: true },
  /** 生成中发送钮切换为停止钮（emit stop）；AbortController 由使用方自持 */
  stoppable: { type: Boolean, required: false, default: false },
  inputValue: { type: String, required: false, default: "" }
});
const emit = defineEmits(["update:modelValue", "update:inputValue", "send", "stop", "copy", "regenerate", "action", "edit", "feedback", "suggestion-click", "citation-click", "tool-retry", "plan-toggle", "plan-step-click", "confirm-respond", "artifact-open", "artifact-copy", "file-select", "attachment-add", "attachment-reject"]);
const listRef = ref();
const senderRef = ref();
const innerMessages = ref([...props.modelValue || []]);
const innerInputValue = ref(props.inputValue);
const messages = computed({
  get: () => innerMessages.value,
  set: (val) => {
    innerMessages.value = val;
    emit("update:modelValue", val);
  }
});
const inputValue = computed({
  get: () => innerInputValue.value,
  set: (val) => {
    innerInputValue.value = val;
    emit("update:inputValue", val);
  }
});
watch(() => props.modelValue, (val) => {
  innerMessages.value = [...val || []];
}, { deep: true });
watch(() => props.inputValue, (val) => {
  innerInputValue.value = val;
});
function handleSend(content, attachments) {
  const userMessage = {
    id: generateId(),
    role: "user",
    content,
    attachments: attachments.length > 0 ? attachments : void 0,
    status: "done",
    createdAt: Date.now()
  };
  messages.value = [...messages.value, userMessage];
  emit("update:modelValue", messages.value);
  nextTick(() => {
    listRef.value?.scrollToBottom(false);
  });
  emit("send", content, attachments);
}
function handleCopy(message) {
  emit("copy", message);
}
function handleStop() {
  emit("stop");
}
function handleRegenerate(message) {
  emit("regenerate", message);
}
function handleAction(key, message) {
  emit("action", key, message);
}
function handleEdit(message, content) {
  emit("edit", message, content);
}
function handleFeedback(message, payload) {
  emit("feedback", message, payload);
}
function handleSuggestionClick(text, suggestion, message) {
  emit("suggestion-click", text, suggestion, message);
}
function handleCitationClick(id, message) {
  emit("citation-click", id, message);
}
function handleToolRetry(toolCall, message) {
  emit("tool-retry", toolCall, message);
}
function handleAttachmentAdd(file, attachment) {
  emit("attachment-add", file, attachment);
}
function handleAttachmentReject(file, reason) {
  emit("attachment-reject", file, reason);
}
function scrollToBottom(smooth) {
  listRef.value?.scrollToBottom(smooth);
}
function focus() {
  senderRef.value?.focus();
}
function reset() {
  innerMessages.value = [];
  innerInputValue.value = "";
  senderRef.value?.reset();
}
defineExpose({
  scrollToBottom,
  focus,
  reset,
  messages,
  inputValue
});

</script>

<style scoped>

.eb-chatbot {
  display: flex;
}

.eb-chatbot__sender-wrapper {
  padding: 0 var(--eb-space-2);
}

.eb-chatbot__tip {
  text-align: center;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  padding-top: var(--eb-space-2);
}
</style>
