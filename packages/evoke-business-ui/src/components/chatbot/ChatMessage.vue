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
    <template v-if="isSystem">
      <div class="eb-chat-message__system">
        <ChatMarkdown
          v-if="renderMode === 'markdown'"
          :content="message.content"
          :streaming="isStreaming"
        />
        <span v-else>{{ message?.content }}</span>
      </div>
    </template>
    <template v-else>
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
        <span v-if="message?.edited" class="eb-chat-message__edited">{{ labels.message.edited }}</span>
      </div>
      <div class="eb-chat-message__content">
        <ChatAttachments 
          v-if="message?.attachments?.length && !editing" 
          :attachments="message.attachments" 
        />
        <ChatMessageEdit
          v-if="editing"
          :model-value="message?.content"
          :max-length="editMaxLength"
          @save="handleEditSave"
          @cancel="editing = false"
        />
        <template v-else>
          <ChatThinking 
            v-if="showThinking && (message?.thinking || message?.thinkContent)"
            :content="message?.thinkContent"
            :thinking="message?.thinking"
          />
          <div v-if="resolvedToolCalls.length" class="eb-chat-message__tools">
            <p v-if="resolvedToolCalls.length > 1" class="eb-chat-message__tools-heading">
              {{ labels.tool.group(resolvedToolCalls.length) }}
            </p>
            <ChatToolCall
              v-for="tc in resolvedToolCalls"
              :key="tc.id"
              :tool-call="tc"
              :retryable="toolRetryable"
              @retry="handleToolRetry"
            />
          </div>
          <div v-if="awaitingReply" class="eb-chat-message__loading">
            <ChatLoading />
          </div>
          <template v-else-if="message?.status === 'error'">
            <div class="eb-chat-message__error" role="alert">
              <eb-icon name="warning-filled" />
              <span>{{ message?.error || labels.message.error }}</span>
            </div>
          </template>
          <template v-else-if="hasBody">
            <div class="eb-chat-message__bubble">
              <!-- #content 只接管正文渲染：附件 / 思考 / 工具 / 来源 / 动作条仍由本组件负责 -->
              <slot
                name="content"
                :message="message"
                :content="message?.content"
                :renderMode="renderMode"
                :streaming="isStreaming"
              >
                <ChatMarkdown
                  v-if="renderMode === 'markdown'"
                  :content="message.content"
                  :streaming="isStreaming"
                  @citation-click="handleCitationClick"
                />
                <div v-else class="eb-chat-message__text">{{ textHead }}<span v-if="isStreaming" class="eb-chat-shimmer">{{ textTail }}</span></div>
              </slot>
            </div>
            <div v-if="message?.status === 'cancelled'" class="eb-chat-message__cancelled">
              <eb-icon name="stop" />
              <span>{{ labels.message.cancelled }}</span>
            </div>
            <ChatSources
              v-if="message?.citations?.length"
              ref="sourcesRef"
              :items="message.citations"
            />
          </template>
          <ChatSuggestion
            v-if="resolvedSuggestions.length"
            :items="resolvedSuggestions"
            @pick="handleSuggestionPick"
          />
          <ChatActionbar 
            v-if="showActions"
            :class="{ 'is-visible': hovered }"
            :message="message"
            :actions="actions"
            :show-edit="editable && message?.role === 'user'"
            @copy="handleCopy"
            @regenerate="handleRegenerate"
            @edit="editing = true"
            @action="handleAction"
          />
          <ChatFeedback
            v-if="showFeedback"
            :value="message?.feedback || null"
            :reasons="feedbackReasons"
            @submit="handleFeedbackSubmit"
          />
        </template>
      </div>
    </div>
    </template>
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
import ChatSuggestion from "./ChatSuggestion.vue";
import ChatFeedback from "./ChatFeedback.vue";
import ChatMessageEdit from "./ChatMessageEdit.vue";
import ChatSources from "./ChatSources.vue";
import ChatToolCall from "./ChatToolCall.vue";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  message: { type: null, required: false },
  showThinking: { type: Boolean, required: false, default: true },
  avatarUser: { type: String, required: false, default: "" },
  avatarAssistant: { type: String, required: false, default: "" },
  userName: { type: String, required: false, default: labels.message.user },
  assistantName: { type: String, required: false, default: labels.message.assistant },
  renderMode: { type: String, required: false, default: "markdown" },
  actions: { type: Array, required: false, default: () => [] },
  /** 用户消息可原地编辑并重发 */
  editable: { type: Boolean, required: false, default: false },
  /** 编辑框输入上限，0 不限 */
  editMaxLength: { type: Number, required: false, default: 0 },
  /** 助手消息显示点赞点踩 */
  feedback: { type: Boolean, required: false, default: false },
  /** 点踩原因词汇表；不传用内置 */
  feedbackReasons: { type: Array, required: false, default: () => [] },
  /** 工具调用失败态是否给重试钮 */
  toolRetryable: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["copy", "regenerate", "action", "edit", "feedback", "suggestion-click", "citation-click", "tool-retry"]);
const hovered = ref(false);
const editing = ref(false);
const sourcesRef = ref(null);
function handleCitationClick(id) {
  // 上标与来源卡是兄弟节点，联动走 expose 而不是把 citations 塞进渲染层
  sourcesRef.value?.highlight?.(id);
  emit("citation-click", id, props.message);
}
// system / notice 是「系统提示」而非对话方发言：不给头像、昵称、动作条，居中弱化呈现
const isSystem = computed(() => {
  const role = props.message?.role;
  return role === "system" || role === "notice";
});
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
const showFeedback = computed(() => props.feedback && props.message?.role === "assistant" && props.message?.status === "done");
const resolvedSuggestions = computed(() => props.message?.suggestions || []);
const resolvedToolCalls = computed(() => props.message?.toolCalls || []);
function handleToolRetry(toolCall) {
  emit("tool-retry", toolCall, props.message);
}
function handleEditSave(content) {
  editing.value = false;
  emit("edit", props.message, content);
}
function handleFeedbackSubmit(payload) {
  emit("feedback", props.message, payload);
}
function handleSuggestionPick(s) {
  emit("suggestion-click", s.prompt, s, props.message);
}
const avatarSrc = computed(() => {
  if (props.message?.role === "user") return props.avatarUser;
  return props.avatarAssistant;
});
const avatarText = computed(() => {
  if (props.message?.role === "user") return props.userName?.[0] || labels.message.user;
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

.eb-chat-message__edited {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

/* 多个工具调用归到一组，组标题在此、单卡状态在 ChatToolCall */
.eb-chat-message__tools {
  display: flex;
  flex-direction: column;
  gap: var(--eb-space-1);
}

.eb-chat-message__tools-heading {
  margin: 0 0 2px;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

/* system 与 notice 同族：根类按 role 生成，两个都要钉住 */
.eb-chat-message--system,
.eb-chat-message--notice {
  justify-content: center;
  padding: var(--eb-space-2) 0;
}

.eb-chat-message__system {
  max-width: 88%;
  padding: 2px var(--eb-space-3);
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-lighter);
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-sm);
  line-height: 1.6;
  text-align: center;
}

.eb-chat-message__system :deep(p) {
  margin: 0;
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
