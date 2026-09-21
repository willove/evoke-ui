<template>
  <div 
    ref="listRef"
    class="eb-chat-list"
    role="log"
    :aria-live="autoScroll ? 'polite' : 'off'"
    aria-relevant="additions"
    :aria-label="labels.list.label"
    @scroll="handleScrollEvent"
  >
    <div v-if="!messages || messages.length === 0" class="eb-chat-list__empty">
      <slot name="empty">
        <EbEmpty :description="labels.list.empty" />
      </slot>
    </div>
    <EbVirtualList
      v-else-if="isVirtual"
      ref="virtualRef"
      class="eb-chat-list__virtual"
      :items="messages"
      item-key="id"
      :estimated-size="estimatedItemSize"
      height="100%"
      :buffer="6"
      role="log"
      :aria-live="autoScroll ? 'polite' : 'off'"
      aria-relevant="additions"
      :aria-label="labels.list.label"
      @scroll="handleVirtualScroll"
    >
      <template #default="{ item, index }">
        <slot
          name="message"
          :message="item"
          :index="index"
          :isLast="index === messages.length - 1"
          :itemProps="messagePropsFor(item)"
        >
          <ChatMessageRow v-bind="messagePropsFor(item)" v-on="rowListeners">
            <template v-if="$slots['message-content']" #content="p">
              <slot name="message-content" v-bind="p" />
            </template>
            <template v-if="$slots['tool-result']" #tool-result="p">
              <slot name="tool-result" v-bind="p" />
            </template>
            <template v-if="$slots['tool-args']" #tool-args="p">
              <slot name="tool-args" v-bind="p" />
            </template>
          </ChatMessageRow>
        </slot>
      </template>
    </EbVirtualList>
    <div v-else class="eb-chat-list__messages">
      <slot name="header" />
      <template v-for="(msg, i) in messages" :key="msg.id">
        <!--
          #message  整条接管（默认内容就是下面这颗 ChatMessage）
          #message-content  只接管正文，保留消息外壳；与 #message 同时给时以 #message 为准
        -->
        <slot
          name="message"
          :message="msg"
          :index="i"
          :isLast="i === messages.length - 1"
          :itemProps="messagePropsFor(msg)"
        >
          <ChatMessageRow v-bind="messagePropsFor(msg)" v-on="rowListeners">
            <template v-if="$slots['message-content']" #content="p">
              <slot name="message-content" v-bind="p" />
            </template>
            <template v-if="$slots['tool-result']" #tool-result="p">
              <slot name="tool-result" v-bind="p" />
            </template>
            <template v-if="$slots['tool-args']" #tool-args="p">
              <slot name="tool-args" v-bind="p" />
            </template>
          </ChatMessageRow>
        </slot>
      </template>
      <div ref="bottomRef" class="eb-chat-list__bottom" />
    </div>
    <transition name="eb-chat-list__backtop-fade">
      <button 
        v-show="showBackToBottom"
        class="eb-chat-list__backtop"
        type="button"
        :title="labels.list.backToBottom"
        :aria-label="labels.list.backToBottom"
        @click="scrollToBottom(true)"
      >
        <eb-icon name="arrow-down" />
      </button>
    </transition>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
import { ref, watch, nextTick, onMounted, computed } from "vue";
import EbEmpty from "../empty/index.vue";
import EbVirtualList from "../virtual-list/index.vue";
import ChatMessageRow from "./ChatMessageRow.vue";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  messages: { type: Array, required: false, default: () => [] },
  showThinking: { type: Boolean, required: false, default: true },
  avatarUser: { type: String, required: false, default: "" },
  avatarAssistant: { type: String, required: false, default: "" },
  userName: { type: String, required: false, default: labels.message.user },
  assistantName: { type: String, required: false, default: labels.message.assistant },
  renderMode: { type: String, required: false, default: "markdown" },
  actions: { type: Array, required: false, default: () => [] },
  autoScroll: { type: Boolean, required: false, default: true },
  editable: { type: Boolean, required: false, default: false },
  editMaxLength: { type: Number, required: false, default: 0 },
  feedback: { type: Boolean, required: false, default: false },
  feedbackReasons: { type: Array, required: false, default: () => [] },
  toolRetryable: { type: Boolean, required: false, default: true },
  speech: { type: Boolean, required: false, default: false },
  traceUrl: { type: String, required: false, default: "" },
  /** 超过 virtualThreshold 条时启用虚拟滚动（万级历史只渲染可视窗口） */
  virtual: { type: Boolean, required: false, default: false },
  virtualThreshold: { type: Number, required: false, default: 60 },
  /** 虚拟模式的估算行高（px）；滚动中会按实测收敛，给个接近的值能少跳几次 */
  estimatedItemSize: { type: Number, required: false, default: 120 }
});
const emit = defineEmits(["copy", "regenerate", "action", "edit", "feedback", "suggestion-click", "citation-click", "tool-retry", "plan-toggle", "plan-step-click", "confirm-respond", "artifact-open", "artifact-copy", "file-select", "scroll"]);
const listRef = ref();
const virtualRef = ref();
const bottomRef = ref();
const userPinned = ref(false);
const forceFollow = ref(false);
const showBackToBottom = ref(false);
let scrollScheduled = false;
const isVirtual = computed(() => props.virtual && props.messages.length > props.virtualThreshold);
/**
 * 两个分支的滚动层：普通模式是组件根，虚拟模式是虚拟列表的根。
 * 把它统一到一个取值口，贴底 / 近底判定 / 回到底部就都不必分叉。
 */
const scrollEl = computed(() => (isVirtual.value ? virtualRef.value?.$el : listRef.value) || null);

function nearBottomOf(el) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
}
function handleScrollEvent(e) {
  emit("scroll", e);
  const el = scrollEl.value;
  if (!el) return;
  const nearBottom = nearBottomOf(el);
  showBackToBottom.value = !nearBottom;
  if (nearBottom) {
    userPinned.value = false;
  } else {
    userPinned.value = true;
    forceFollow.value = false;
  }
}
// 虚拟列表只抛 scrollTop，这里补上元素再走同一套判定
function handleVirtualScroll() {
  handleScrollEvent({ target: scrollEl.value });
}
function scrollToBottom(smooth = false) {
  userPinned.value = false;
  forceFollow.value = false;
  nextTick(() => {
    requestAnimationFrame(() => {
      // rAF 触发时组件可能已卸载，refs 已置空
      const el = scrollEl.value;
      if (!el) return;
      if (smooth) {
        el.scrollTo?.({ top: el.scrollHeight, behavior: "smooth" });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    });
  });
}
function smartScroll() {
  if (!props.autoScroll) return;
  if (userPinned.value && !forceFollow.value) return;
  // 流式回写每来一片段就触发一次，这里按帧合并，避免逐 token 强制布局
  if (scrollScheduled) return;
  scrollScheduled = true;
  nextTick(() => {
    requestAnimationFrame(() => {
      scrollScheduled = false;
      const el = scrollEl.value;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
      userPinned.value = false;
    });
  });
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
/**
 * 逐条消息的事件束：与 props 束一起交给 ChatMessageRow，
 * 两个分支（普通 / 虚拟化）各一行即可，不重复列十几条绑定
 */
const rowListeners = {
  copy: handleCopy,
  regenerate: handleRegenerate,
  action: handleAction,
  edit: handleEdit,
  feedback: handleFeedback,
  "suggestion-click": handleSuggestionClick,
  "citation-click": handleCitationClick,
  "tool-retry": handleToolRetry,
  "plan-toggle": (plan) => emit("plan-toggle", plan),
  "plan-step-click": (step, i, m) => emit("plan-step-click", step, i, m),
  "confirm-respond": (c, k, m) => emit("confirm-respond", c, k, m),
  "artifact-open": (art, m) => emit("artifact-open", art, m),
  "artifact-copy": (art, m) => emit("artifact-copy", art, m),
  "file-select": (f, path, m) => emit("file-select", f, path, m)
};

/**
 * 逐条消息的 props 束：默认渲染与 #message 接管态共用同一份，
 * 宿主只画某几类消息时不必自己把头像/昵称/actions 重新接一遍
 */
function messagePropsFor(msg) {
  return {
    message: msg,
    showThinking: props.showThinking,
    avatarUser: props.avatarUser,
    avatarAssistant: props.avatarAssistant,
    userName: props.userName,
    assistantName: props.assistantName,
    renderMode: props.renderMode,
    actions: props.actions,
    editable: props.editable,
    editMaxLength: props.editMaxLength,
    feedback: props.feedback,
    feedbackReasons: props.feedbackReasons,
    toolRetryable: props.toolRetryable,
    speech: props.speech,
    traceUrl: props.traceUrl
  };
}
// 单一深监听：内容增量与新增消息都覆盖（此前 length 与深监听双触发，逐 token 滚两次）
watch(() => props.messages, () => {
  smartScroll();
}, { deep: true });
onMounted(() => {
  nextTick(() => {
    scrollToBottom(false);
  });
});
defineExpose({
  scrollToBottom,
  smartScroll
});

</script>

<style scoped>

.eb-chat-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 var(--eb-space-6);
  position: relative;
  scroll-behavior: auto;
}

.eb-chat-list__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.eb-chat-list__messages {
  padding: var(--eb-space-4) 0;
}

.eb-chat-list__bottom {
  height: 1px;
  width: 100%;
}

.eb-chat-list__backtop {
  position: absolute;
  bottom: var(--eb-space-4);
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--eb-bg-color-overlay);
  border-radius: 50%;
  box-shadow: var(--eb-shadow-2);
  cursor: pointer;
  color: var(--eb-text-color-secondary);
  transition: all var(--eb-duration-fast) var(--eb-ease-out);
  padding: 0;
  z-index: 10;
}

.eb-chat-list__backtop:hover {
  color: var(--eb-color-primary);
  box-shadow: var(--eb-shadow-3);
  transform: translateX(-50%) translateY(-2px);
}

.eb-chat-list__backtop-fade-enter-active,
.eb-chat-list__backtop-fade-leave-active {
  transition: all var(--eb-duration-base) var(--eb-ease-out);
}

.eb-chat-list__backtop-fade-enter-from,
.eb-chat-list__backtop-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
