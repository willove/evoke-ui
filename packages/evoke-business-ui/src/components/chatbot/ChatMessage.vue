<template>
  <div 
    class="ev-chat-message" 
    :class="[
      `ev-chat-message--${message?.role}`,
      { 'ev-chat-message--error': message?.status === 'error' }
    ]"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="ev-chat-message__avatar">
      <ev-avatar 
        :size="36" 
        :src="avatarSrc"
        class="ev-chat-message__avatar-el"
      >
        {{ avatarText }}
      </ev-avatar>
    </div>
    <div class="ev-chat-message__body">
      <div class="ev-chat-message__meta">
        <span class="ev-chat-message__name">{{ displayName }}</span>
        <span v-if="message?.createdAt" class="ev-chat-message__time">{{ formatTime(message.createdAt) }}</span>
        <span v-if="message?.role === 'assistant' && message?.duration && message?.status === 'done'" class="ev-chat-message__duration">
          <ev-icon name="stopwatch" />
          {{ formatDuration(message.duration) }}
        </span>
      </div>
      <div class="ev-chat-message__content">
        <ChatAttachments 
          v-if="message?.attachments?.length" 
          :attachments="message.attachments" 
        />
        <ChatThinking 
          v-if="showThinking && (message?.thinking || message?.thinkContent)"
          :content="message?.thinkContent"
          :thinking="message?.thinking"
        />
        <div v-if="message?.status === 'pending' || (message?.thinking && !message?.content)" class="ev-chat-message__loading">
          <ChatLoading />
        </div>
        <template v-else-if="message?.status === 'error'">
          <div class="ev-chat-message__error">
            <ev-icon name="warning-filled" />
            <span>{{ message?.error || '消息发送失败' }}</span>
          </div>
        </template>
        <template v-else-if="message?.content">
          <ChatMarkdown v-if="renderMode === 'markdown'" :content="message.content" />
          <div v-else class="ev-chat-message__text">{{ message.content }}</div>
        </template>
        <ChatActionbar 
          v-if="message?.role === 'assistant' && message?.status === 'done'"
          :class="{ 'is-visible': hovered }"
          :message="message"
          :actions="actions"
          @copy="handleCopy"
          @regenerate="handleRegenerate"
          @action="handleAction"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import EvIcon from "../icon/index.vue"
import EvAvatar from "../avatar/index.vue"
import { ref, computed } from "vue";
import ChatMarkdown from "./ChatMarkdown.vue";
import ChatThinking from "./ChatThinking.vue";
import ChatLoading from "./ChatLoading.vue";
import ChatAttachments from "./ChatAttachments.vue";
import ChatActionbar from "./ChatActionbar.vue";
import { getIconByNameSync } from "../icon/iconRegistry";
const props = defineProps({
  message: { type: null, required: false },
  showThinking: { type: Boolean, required: false, default: true },
  avatarUser: { type: String, required: false, default: "" },
  avatarAssistant: { type: String, required: false, default: "" },
  userName: { type: String, required: false, default: "\u6211" },
  assistantName: { type: String, required: false, default: "AI\u52A9\u624B" },
  renderMode: { type: String, required: false, default: "markdown" },
  actions: { type: Array, required: false, default: () => [] }
});
const emit = defineEmits(["copy", "regenerate", "action"]);
const WarningFilled = getIconByNameSync("warning-filled");
const Stopwatch = getIconByNameSync("stopwatch");
const hovered = ref(false);
const avatarSrc = computed(() => {
  if (props.message?.role === "user") return props.avatarUser;
  return props.avatarAssistant;
});
const avatarText = computed(() => {
  if (props.message?.role === "user") return props.userName?.[0] || "\u6211";
  return props.assistantName?.[0] || "AI";
});
const displayName = computed(() => {
  if (props.message?.role === "user") return props.userName;
  return props.assistantName;
});
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
function formatDuration(ms) {
  if (ms < 1e3) return `${ms}ms`;
  if (ms < 6e4) return `${(ms / 1e3).toFixed(1)}s`;
  const minutes = Math.floor(ms / 6e4);
  const seconds = Math.floor(ms % 6e4 / 1e3);
  return `${minutes}m${seconds}s`;
}
function handleCopy(message) {
  emit("copy", message);
}
function handleRegenerate(message) {
  emit("regenerate", message);
}
function handleAction(key, message) {
  emit("action", key, message);
}

</script>

<style scoped>

.ev-chat-message {
  display: flex;
  gap: var(--ev-space-3);
  padding: var(--ev-space-3) 0;
  width: 100%;
  box-sizing: border-box;
}

.ev-chat-message + .ev-chat-message {
  border-top: 1px dashed var(--ev-border-color-extra-light);
}

.ev-chat-message--user {
  flex-direction: row-reverse;
}

.ev-chat-message__avatar {
  flex-shrink: 0;
}

.ev-chat-message__avatar-el {
  background: var(--ev-fill-color);
  color: var(--ev-text-color-secondary);
  font-size: var(--ev-font-size-sm);
  font-weight: var(--ev-font-weight-medium);
}

.ev-chat-message--assistant .ev-chat-message__avatar-el {
  background: linear-gradient(135deg, var(--ev-color-primary), var(--ev-color-primary-light-3));
  color: white;
}

.ev-chat-message__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.ev-chat-message--user .ev-chat-message__body {
  align-items: flex-end;
  flex: 0 1 auto;
  max-width: min(80%, 600px);
}

.ev-chat-message--assistant .ev-chat-message__body {
  width: 100%;
}

.ev-chat-message__meta {
  display: flex;
  align-items: center;
  gap: var(--ev-space-2);
  margin-bottom: var(--ev-space-1);
}

.ev-chat-message--user .ev-chat-message__meta {
  justify-content: flex-end;
}

.ev-chat-message__name {
  font-size: var(--ev-font-size-sm);
  font-weight: var(--ev-font-weight-medium);
  color: var(--ev-text-color-primary);
}

.ev-chat-message__time {
  font-size: var(--ev-font-size-xs);
  color: var(--ev-text-color-placeholder);
}

.ev-chat-message__duration {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--ev-font-size-xs);
  color: var(--ev-text-color-placeholder);
}

.ev-chat-message__content {
  position: relative;
  width: 100%;
}

.ev-chat-message--user .ev-chat-message__content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.ev-chat-message__text {
  font-size: var(--ev-font-size-base);
  line-height: var(--ev-line-height-loose);
  color: var(--ev-text-color-regular);
  word-break: break-word;
  white-space: pre-wrap;
}

.ev-chat-message--user .ev-chat-message__text {
  background: var(--ev-color-primary);
  color: white;
  padding: var(--ev-space-2) var(--ev-space-4);
  border-radius: var(--ev-radius-lg);
  border-top-right-radius: var(--ev-radius-sm);
  max-width: 100%;
}

.ev-chat-message--error .ev-chat-message__text {
  color: var(--ev-color-danger);
}

.ev-chat-message__error {
  display: flex;
  align-items: center;
  gap: var(--ev-space-2);
  padding: var(--ev-space-2) var(--ev-space-3);
  background: var(--ev-color-danger-light-9);
  border: 1px solid var(--ev-color-danger-light-7);
  border-radius: var(--ev-radius-md);
  color: var(--ev-color-danger);
  font-size: var(--ev-font-size-sm);
}

.ev-chat-message__loading {
  padding: var(--ev-space-2) 0;
}
</style>
