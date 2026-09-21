<template>
  <div 
    class="eb-chat-message" 
    :class="[
      `eb-chat-message--${message?.role}`,
      { 'eb-chat-message--error': message?.status === 'error' }
    ]"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="eb-chat-message__avatar">
      <eb-avatar 
        :size="36" 
        :src="avatarSrc"
        class="eb-chat-message__avatar-el"
      >
        {{ avatarText }}
      </eb-avatar>
    </div>
    <div class="eb-chat-message__body">
      <div class="eb-chat-message__meta">
        <span class="eb-chat-message__name">{{ displayName }}</span>
        <span v-if="message?.createdAt" class="eb-chat-message__time">{{ formatTime(message.createdAt) }}</span>
        <span v-if="message?.role === 'assistant' && message?.duration && message?.status === 'done'" class="eb-chat-message__duration">
          <eb-icon name="stopwatch" />
          {{ formatDuration(message.duration) }}
        </span>
      </div>
      <div class="eb-chat-message__content">
        <ChatAttachments 
          v-if="message?.attachments?.length" 
          :attachments="message.attachments" 
        />
        <ChatThinking 
          v-if="showThinking && (message?.thinking || message?.thinkContent)"
          :content="message?.thinkContent"
          :thinking="message?.thinking"
        />
        <div v-if="awaitingReply" class="eb-chat-message__loading">
          <ChatLoading />
        </div>
        <template v-else-if="message?.status === 'error'">
          <div class="eb-chat-message__error" role="alert">
            <eb-icon name="warning-filled" />
            <span>{{ message?.error || errorMessage }}</span>
          </div>
        </template>
        <template v-else-if="hasBody">
          <div class="eb-chat-message__bubble">
            <ChatMarkdown
              v-if="renderMode === 'markdown'"
              :content="message.content"
              :streaming="isStreaming"
            />
            <div v-else class="eb-chat-message__text">{{ textHead }}<span v-if="isStreaming" class="eb-chat-shimmer">{{ textTail }}</span></div>
          </div>
          <div v-if="message?.status === 'cancelled'" class="eb-chat-message__cancelled">
            <eb-icon name="stop" />
            <span>{{ cancelledMessage }}</span>
          </div>
        </template>
        <ChatActionbar 
          v-if="showActions"
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
import EbIcon from "../icon/index.vue"
import EbAvatar from "../avatar/index.vue"
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
const errorMessage = "\u6D88\u606F\u53D1\u9001\u5931\u8D25";
const cancelledMessage = "\u5DF2\u505C\u6B62\u751F\u6210";
const hovered = ref(false);
const awaitingReply = computed(() => {
  const m = props.message;
  return m?.status === "pending" || (m?.thinking && !m?.content);
});
const hasBody = computed(() => !!props.message?.content);
const isStreaming = computed(() => props.message?.status === "streaming");
// 纯文本模式没有 ChatMarkdown 那套 HTML 尾巴处理，这里按码点切出拖尾段
const SHIMMER_TAIL = 16;
const textParts = computed(() => {
  const chars = Array.from(props.message?.content || "");
  if (!isStreaming.value) return { head: chars.join(""), tail: "" };
  const from = Math.max(0, chars.length - SHIMMER_TAIL);
  return { head: chars.slice(0, from).join(""), tail: chars.slice(from).join("") };
});
const textHead = computed(() => textParts.value.head);
const textTail = computed(() => textParts.value.tail);
// user 也应有复制；regenerate 仍由 ChatActionbar 按 role 收敛到 assistant
const showActions = computed(() => {
  const m = props.message;
  return m?.status === "done" && (m?.role === "assistant" || m?.role === "user");
});
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

.eb-chat-message {
  display: flex;
  gap: var(--eb-space-3);
  padding: var(--eb-space-3) 0;
  width: 100%;
  box-sizing: border-box;
}

.eb-chat-message + .eb-chat-message {
  border-top: 1px dashed var(--eb-border-color-extra-light);
}

.eb-chat-message--user {
  flex-direction: row-reverse;
}

.eb-chat-message__avatar {
  flex-shrink: 0;
}

.eb-chat-message__avatar-el {
  background: var(--eb-fill-color);
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-sm);
  font-weight: var(--eb-font-weight-medium);
}

.eb-chat-message--assistant .eb-chat-message__avatar-el {
  background: linear-gradient(135deg, var(--eb-color-primary), var(--eb-color-primary-light-3));
  color: white;
}

.eb-chat-message__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.eb-chat-message--user .eb-chat-message__body {
  align-items: flex-end;
  flex: 0 1 auto;
  max-width: min(80%, 600px);
}

.eb-chat-message--assistant .eb-chat-message__body {
  width: 100%;
}

.eb-chat-message__meta {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  margin-bottom: var(--eb-space-1);
}

.eb-chat-message--user .eb-chat-message__meta {
  justify-content: flex-end;
}

.eb-chat-message__name {
  font-size: var(--eb-font-size-sm);
  font-weight: var(--eb-font-weight-medium);
  color: var(--eb-text-color-primary);
}

.eb-chat-message__time {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-message__duration {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-message__content {
  position: relative;
  width: 100%;
}

.eb-chat-message--user .eb-chat-message__content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.eb-chat-message__text {
  font-size: var(--eb-font-size-base);
  line-height: var(--eb-line-height-loose);
  color: var(--eb-text-color-regular);
  word-break: break-word;
  white-space: pre-wrap;
}

.eb-chat-message__bubble {
  position: relative;
  width: 100%;
  min-width: 0;
}

.eb-chat-message--user .eb-chat-message__bubble {
  width: fit-content;
  max-width: 100%;
  /* 用户气泡走浅色染色面：正文里的链接、行内码、代码块在纯主色底上都会糊掉，
     ChatGPT / Claude 同样是 tinted surface 而非实心主色 */
  background: var(--eb-color-primary-light-9);
  color: var(--eb-text-color-primary);
  padding: var(--eb-space-2) var(--eb-space-4);
  border-radius: var(--eb-radius-lg);
  border-top-right-radius: var(--eb-radius-sm);
}

.eb-chat-message--user .eb-chat-message__text {
  color: inherit;
}

.eb-chat-message__cancelled {
  display: inline-flex;
  align-items: center;
  gap: var(--eb-space-1);
  margin-top: var(--eb-space-1);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-message--error .eb-chat-message__text {
  color: var(--eb-color-danger);
}

.eb-chat-message__error {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  padding: var(--eb-space-2) var(--eb-space-3);
  background: var(--eb-color-danger-light-9);
  border: 1px solid var(--eb-color-danger-light-7);
  border-radius: var(--eb-radius-md);
  color: var(--eb-color-danger);
  font-size: var(--eb-font-size-sm);
}

.eb-chat-message__loading {
  padding: var(--eb-space-2) 0;
}
</style>
