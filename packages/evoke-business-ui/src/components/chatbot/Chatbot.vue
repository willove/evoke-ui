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
      @copy="handleCopy"
      @regenerate="handleRegenerate"
      @action="handleAction"
    >
      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>
      <template v-if="$slots['message-header']" #header>
        <slot name="message-header" />
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
          @send="handleSend"
          @stop="handleStop"
          @attachment-add="handleAttachmentAdd"
        >
          <template v-if="$slots['sender-toolbar']" #toolbar>
            <slot name="sender-toolbar" />
          </template>
        </ChatSender>
        <slot name="sender-append" />
      </div>
      <div v-if="showTip" class="eb-chatbot__tip">
        <slot name="tip">
          <span>内容由 AI 生成，仅供参考</span>
        </slot>
      </div>
    </template>
  </ChatContent>
</template>

<script setup>
import { ref, watch, computed, nextTick } from "vue";
import { generateId } from "./utils";
import ChatContent from "./ChatContent.vue";
import ChatList from "./ChatList.vue";
import ChatSender from "./ChatSender.vue";
const props = defineProps({
  modelValue: { type: Array, required: false, default: () => [] },
  placeholder: { type: String, required: false, default: "\u8F93\u5165\u6D88\u606F\uFF0C\u6309 Enter \u53D1\u9001\uFF0CShift+Enter \u6362\u884C" },
  loading: { type: Boolean, required: false, default: false },
  disabled: { type: Boolean, required: false, default: false },
  showThinking: { type: Boolean, required: false, default: true },
  allowAttachments: { type: Boolean, required: false, default: true },
  maxAttachments: { type: Number, required: false, default: 5 },
  maxLength: { type: Number, required: false, default: 2e3 },
  showWordCount: { type: Boolean, required: false, default: false },
  sendOnEnter: { type: Boolean, required: false, default: true },
  actions: { type: Array, required: false, default: () => [] },
  height: { type: [String, Number], required: false, default: "600px" },
  width: { type: [String, Number], required: false, default: "100%" },
  avatarUser: { type: String, required: false, default: "" },
  avatarAssistant: { type: String, required: false, default: "" },
  userName: { type: String, required: false, default: "\u6211" },
  assistantName: { type: String, required: false, default: "AI\u52A9\u624B" },
  renderMode: { type: String, required: false, default: "markdown" },
  autoScroll: { type: Boolean, required: false, default: true },
  showTip: { type: Boolean, required: false, default: true },
  /** 生成中发送钮切换为停止钮（emit stop）；AbortController 由使用方自持 */
  stoppable: { type: Boolean, required: false, default: false },
  inputValue: { type: String, required: false, default: "" }
});
const emit = defineEmits(["update:modelValue", "update:inputValue", "send", "stop", "copy", "regenerate", "action", "attachment-add"]);
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
function handleAttachmentAdd(file) {
  emit("attachment-add", file);
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
