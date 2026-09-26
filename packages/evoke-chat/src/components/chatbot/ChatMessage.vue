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
    <div v-if="avatarVisible" class="eb-chat-message__avatar">
      <eb-avatar 
        :size="36" 
        :src="avatarSrc"
        class="eb-chat-message__avatar-el"
      >
        {{ avatarText }}
      </eb-avatar>
    </div>
    <div class="eb-chat-message__body">
      <div v-if="nameVisible" class="eb-chat-message__meta">
        <span v-if="nameVisible" class="eb-chat-message__name">{{ displayName }}</span>
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
            :duration="message?.thinkDuration || 0"
            :interrupted="message?.status === 'cancelled' && !!message?.thinkInterrupted"
          />
          <ChatPlan
            v-if="message?.plan?.steps?.length"
            :plan="message.plan"
            @toggle="emit('plan-toggle', $event)"
            @step-click="(step, i) => emit('plan-step-click', step, i, message)"
          />
          <ChatConfirmation
            v-if="message?.confirmation"
            :confirmation="message.confirmation"
            @respond="(c, key) => emit('confirm-respond', c, key, message)"
          />
          <div v-if="resolvedToolCalls.length" class="eb-chat-message__tools">
            <p v-if="resolvedToolCalls.length > 1" class="eb-chat-message__tools-heading">
              <span :class="{ 'eb-chat-shimmer': toolsLive }">{{ toolsHeading }}</span>
            </p>
            <ChatToolCall
              v-for="tc in resolvedToolCalls"
              :key="tc.id"
              :tool-call="tc"
              :retryable="toolRetryable"
              @retry="handleToolRetry"
            >
              <template v-if="$slots['tool-result']" #result="p">
                <slot name="tool-result" v-bind="p" />
              </template>
              <template v-if="$slots['tool-args']" #args="p">
                <slot name="tool-args" v-bind="p" />
              </template>
            </ChatToolCall>
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
          <template v-else-if="message?.status === 'cancelled' && !hasBody">
            <!-- 思考阶段就被中断：还没有正文，但中断反馈不能缺席 -->
            <div class="eb-chat-message__cancelled">
              <eb-icon name="stop" />
              <span>{{ labels.message.cancelled }}</span>
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
            <ChatArtifact
              v-if="message?.artifacts?.length"
              :artifacts="message.artifacts"
              @open="(a) => emit('artifact-open', a, message)"
              @copy="(a) => emit('artifact-copy', a, message)"
            />
            <!-- 改动集汇总：与 artifacts 并列的消息级字段，不是单个 tool 的产物 -->
            <ChatFileTree
              v-if="message?.fileTree?.length"
              :files="message.fileTree"
              @select="(f, p) => emit('file-select', f, p, message)"
            />
            <!-- 本轮改了哪些文件：收尾可见，+a -r 直接给数 -->
            <ChatChanges
              v-if="message?.changes?.files?.length"
              :files="message.changes.files"
              :summary="message.changes"
              @select="(f) => emit('file-select', f, f.path, message)"
            />
          </template>
          <!-- 消息控制行：追问建议 / 评价 / 时间与动作条（动作条仍随悬浮出现）并排一行 -->
          <div
            v-if="resolvedSuggestions.length || showFeedback || showTime || showActions"
            class="eb-chat-message__controls"
          >
          <ChatSuggestion
            v-if="resolvedSuggestions.length"
            :items="resolvedSuggestions"
            @pick="handleSuggestionPick"
          />
          <div
            v-if="showTime || showActions || message?.duration || message?.usage || message?.edited"
            class="eb-chat-message__foot"
          >
            <span v-if="showTime && message?.createdAt" class="eb-chat-message__time">{{ formatTime(message.createdAt) }}</span>
            <!-- 用量与耗时与动作条同一行：信息常显，复制/重试等动作随悬浮淡入 -->
            <span v-if="message?.role === 'assistant' && message?.duration && message?.status === 'done'" class="eb-chat-message__duration">
              <eb-icon name="stopwatch" :size="14" />
              {{ formatDuration(message.duration) }}
            </span>
            <ChatUsage v-if="message?.usage" :usage="message.usage" />
            <span v-if="message?.edited" class="eb-chat-message__edited">{{ labels.message.edited }}</span>
            <ChatActionbar 
              v-if="showActions"
              :class="{ 'is-visible': hovered }"
              :message="message"
              :actions="actions"
              :show-edit="editable && message?.role === 'user'"
              :show-speech="speech"
              :trace-url="traceUrl"
              @copy="handleCopy"
              @regenerate="handleRegenerate"
              @edit="editing = true"
              @action="handleAction"
            />
          </div>
          <ChatFeedback
            v-if="showFeedback"
            :value="message?.feedback || null"
            :reasons="feedbackReasons"
            @submit="handleFeedbackSubmit"
          />
          </div>
        </template>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import EbIcon from "@wil-works/evoke-business-ui/icon"
import EbAvatar from "@wil-works/evoke-business-ui/avatar"
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
import ChatPlan from "./ChatPlan.vue";
import ChatConfirmation from "./ChatConfirmation.vue";
import ChatArtifact from "./ChatArtifact.vue";
import ChatFileTree from "./ChatFileTree.vue";
import ChatChanges from "./ChatChanges.vue";
import ChatUsage from "./ChatUsage.vue";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  message: { type: null, required: false },
  showThinking: { type: Boolean, required: false, default: true },
  avatarUser: { type: String, required: false, default: "" },
  avatarAssistant: { type: String, required: false, default: "" },
  userName: { type: String, required: false, default: void 0 },
  assistantName: { type: String, required: false, default: void 0 },
  renderMode: { type: String, required: false, default: "markdown" },
  /**
   * 消息头部：头像 / 显示名可整块隐去（隐藏后 meta 行按剩余内容决定是否渲染）。
   * 传对象可分侧控制：`{ user: false }` 只隐去自己那侧，`{ assistant: false }` 只隐去对方。
   */
  showAvatar: { type: [Boolean, Object], required: false, default: true },
  showName: { type: [Boolean, Object], required: false, default: true },
  /** 时间戳：落在消息下方、与动作条同排，悬浮或键盘聚焦时显示；关掉则完全不渲染 */
  showTime: { type: Boolean, required: false, default: true },
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
  toolRetryable: { type: Boolean, required: false, default: true },
  /** 助手消息显示朗读钮（浏览器不支持 Web Speech 时自动不渲染） */
  speech: { type: Boolean, required: false, default: false },
  /** 追踪链接模板；消息自带 traceId / traceUrl 时才渲染 */
  traceUrl: { type: String, required: false, default: "" }
});
const emit = defineEmits(["copy", "regenerate", "action", "edit", "feedback", "suggestion-click", "citation-click", "tool-retry", "plan-toggle", "plan-step-click", "confirm-respond", "artifact-open", "artifact-copy", "file-select"]);
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
// 运行过程标题：跑着就说「正在执行 N 个步骤」（带流光），跑完才结算「执行了 N 个步骤（用时 X）」
const toolsLive = computed(() => resolvedToolCalls.value.some((t) => t.status === "running" || t.status === "pending"));
const toolsHeading = computed(() => {
  const count = resolvedToolCalls.value.length;
  if (toolsLive.value) return labels.tool.groupRunning(count);
  const total = resolvedToolCalls.value.reduce((sum, t) => sum + (t.duration || 0), 0);
  const text = labels.tool.group(count);
  return total > 0 ? `${text}${labels.message.duration(formatDuration(total))}` : text;
});
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
/** 分侧开关：boolean 全开全关，对象按 role 取值（缺省 true） */
function sideVisible(value, role) {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object") return value[role] !== false;
  return true;
}
/** 消息头部是否显示（分侧）与是否整体渲染 */
const avatarVisible = computed(() => sideVisible(props.showAvatar, props.message?.role));
const nameVisible = computed(() => sideVisible(props.showName, props.message?.role));
const avatarSrc = computed(() => {
  if (props.message?.role === "user") return props.avatarUser;
  return props.avatarAssistant;
});
const displayName = computed(() => {
  if (props.message?.role === "user") return props.userName ?? labels.message.user;
  return props.assistantName ?? labels.message.assistant;
});
const avatarText = computed(() => {
  const name = displayName.value;
  if (props.message?.role === "user") return name?.[0] || labels.message.user;
  return name?.[0] || "AI";
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

/* 消息控制行：追问 chips / 评价 / 时间与动作条并排；换行时各自成行 */
.eb-chat-message__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--eb-space-2);
  margin-top: var(--eb-space-1);
}

.eb-chat-message--user .eb-chat-message__controls {
  justify-content: flex-end;
}

/* 追问 chips 吃掉剩余宽度（自身可换行），评价与动作条靠右 */
.eb-chat-message__controls > .eb-chat-suggestion {
  flex: 1 1 auto;
  min-width: 0;
}

.eb-chat-message__controls > .eb-chat-feedback {
  flex: 0 0 auto;
}

/* 点踩展开原因面板：反馈块整行铺开，面板才够宽 */
.eb-chat-message__controls > .eb-chat-feedback.is-panel-open {
  flex: 1 1 100%;
}

.eb-chat-message__controls > .eb-chat-message__foot {
  margin-top: 0;
}

/*
 * 消息底部行：时间 / 耗时 / tokens 用量 / 动作条同一行。
 * 信息（时间·耗时·用量）**常显**——它们是读数，不该等悬浮；只有动作条随悬浮淡入
 * （动作条自身 opacity 门控 + pointer-events，行高不变，hover 不会位移）。
 */
.eb-chat-message__foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--eb-space-2);
  margin-top: var(--eb-space-1);
}

.eb-chat-message__foot > .eb-chat-actionbar {
  margin-top: 0;
}

.eb-chat-message__foot.is-visible,
.eb-chat-message__foot:focus-within {
  opacity: 1;
}

@media (hover: none) {
}

.eb-chat-message--user .eb-chat-message__foot {
  justify-content: flex-end;
}

.eb-chat-message__time {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.eb-chat-message__duration {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-secondary);
}

/* 底行图标统一色调与尺寸：信息图标不再比动作图标更淡、也不一大一小 */
.eb-chat-message__foot :deep(.eb-icon) {
  color: var(--eb-text-color-secondary);
  flex: none;
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
