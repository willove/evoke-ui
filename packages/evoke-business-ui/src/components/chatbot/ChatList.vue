<template>
  <div 
    ref="listRef"
    class="eb-chat-list"
    @scroll="handleScroll"
  >
    <div v-if="!messages || messages.length === 0" class="eb-chat-list__empty">
      <slot name="empty">
        <EbEmpty description="暂无对话消息" />
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
        @copy="handleCopy"
        @regenerate="handleRegenerate"
        @action="handleAction"
      />
      <div ref="bottomRef" class="eb-chat-list__bottom" />
    </div>
    <transition name="eb-chat-list__backtop-fade">
      <button 
        v-show="showBackToBottom"
        class="eb-chat-list__backtop"
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
import { getIconByNameSync } from "../icon/iconRegistry";
const props = defineProps({
  messages: { type: Array, required: false, default: () => [] },
  showThinking: { type: Boolean, required: false, default: true },
  avatarUser: { type: String, required: false, default: "" },
  avatarAssistant: { type: String, required: false, default: "" },
  userName: { type: String, required: false, default: "\u6211" },
  assistantName: { type: String, required: false, default: "AI\u52A9\u624B" },
  renderMode: { type: String, required: false, default: "markdown" },
  actions: { type: Array, required: false, default: () => [] },
  autoScroll: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["copy", "regenerate", "action", "scroll"]);
const ArrowDown = getIconByNameSync("arrow-down");
const listRef = ref();
const bottomRef = ref();
const userPinned = ref(false);
const forceFollow = ref(false);
const showBackToBottom = ref(false);
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
  scrollToBottom(false);
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
watch(() => props.messages, () => {
  smartScroll();
}, { deep: true });
watch(() => props.messages?.length, () => {
  nextTick(() => {
    smartScroll();
  });
});
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
