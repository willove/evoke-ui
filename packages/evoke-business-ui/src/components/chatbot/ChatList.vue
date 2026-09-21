<template>
  <div 
    ref="listRef"
    class="eb-chat-list"
    role="log"
    :aria-live="autoScroll ? 'polite' : 'off'"
    aria-relevant="additions"
    :aria-label="labels.list.label"
    @scroll="handleScroll"
  >
    <div v-if="!messages || messages.length === 0" class="eb-chat-list__empty">
      <slot name="empty">
        <EbEmpty :description="labels.list.empty" />
      </slot>
    </div>
    <div v-else class="eb-chat-list__messages">
      <slot name="header" />
      <ChatMessage
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :show-thinking="showThinking"
        :avatar-user="avatarUser"
        :avatar-assistant="avatarAssistant"
        :user-name="userName"
        :assistant-name="assistantName"
        :render-mode="renderMode"
        :actions="actions"
        :editable="editable"
        :edit-max-length="editMaxLength"
        :feedback="feedback"
        :feedback-reasons="feedbackReasons"
        @copy="handleCopy"
        @regenerate="handleRegenerate"
        @action="handleAction"
        @edit="handleEdit"
        @feedback="handleFeedback"
        @suggestion-click="handleSuggestionClick"
        @citation-click="handleCitationClick"
      />
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
import ChatMessage from "./ChatMessage.vue";
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
  feedbackReasons: { type: Array, required: false, default: () => [] }
});
const emit = defineEmits(["copy", "regenerate", "action", "edit", "feedback", "suggestion-click", "citation-click", "scroll"]);
const listRef = ref();
const bottomRef = ref();
const userPinned = ref(false);
const forceFollow = ref(false);
const showBackToBottom = ref(false);
let scrollScheduled = false;
const isNearBottom = computed(() => {
  if (!listRef.value) return true;
  const { scrollTop, scrollHeight, clientHeight } = listRef.value;
  return scrollHeight - scrollTop - clientHeight < 100;
});
function handleScroll(e) {
  emit("scroll", e);
  if (!listRef.value) return;
  const nearBottom = isNearBottom.value;
  showBackToBottom.value = !nearBottom;
  if (nearBottom) {
    userPinned.value = false;
  } else {
    userPinned.value = true;
    forceFollow.value = false;
  }
}
function scrollToBottom(smooth = false) {
  if (!listRef.value || !bottomRef.value) return;
  userPinned.value = false;
  forceFollow.value = false;
  nextTick(() => {
    requestAnimationFrame(() => {
      // rAF 触发时组件可能已卸载，refs 已置空
      if (!listRef.value) return;
      if (smooth) {
        bottomRef.value?.scrollIntoView({ behavior: "smooth", block: "end" });
      } else {
        listRef.value.scrollTop = listRef.value.scrollHeight;
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
      if (!listRef.value) return;
      listRef.value.scrollTop = listRef.value.scrollHeight;
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
