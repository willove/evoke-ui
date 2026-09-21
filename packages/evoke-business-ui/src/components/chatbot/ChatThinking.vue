<template>
  <div class="eb-chat-thinking">
    <button
      class="eb-chat-thinking__header"
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      @click="expanded = !expanded"
    >
      <div class="eb-chat-thinking__icon">
        <span v-if="thinking" class="eb-chat-thinking__dot"></span>
        <eb-icon v-else :name="expanded ? 'arrow-down' : 'arrow-right'" />
      </div>
      <span class="eb-chat-thinking__label">
        {{ thinking ? thinkingLabel : doneLabel }}
        <span v-if="duration" class="eb-chat-thinking__duration">（用时 {{ formatDuration(duration) }}）</span>
      </span>
    </button>
    <transition name="eb-chat-thinking-collapse">
      <div
        v-show="isOpen"
        :id="panelId"
        class="eb-chat-thinking__content"
        :aria-busy="thinking ? 'true' : void 0"
      >
        <ChatMarkdown v-if="content" :content="content" :streaming="thinking" />
        <div v-else class="eb-chat-thinking__placeholder">{{ placeholderLabel }}</div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
import { ref, computed } from "vue";
import ChatMarkdown from "./ChatMarkdown.vue";
import { getIconByNameSync } from "../icon/iconRegistry";
const props = defineProps({
  content: { type: String, required: false, default: "" },
  thinking: { type: Boolean, required: false, default: false },
  duration: { type: Number, required: false, default: 0 }
});
const ArrowDown = getIconByNameSync("arrow-down");
const ArrowRight = getIconByNameSync("arrow-right");
const thinkingLabel = "\u601D\u8003\u4E2D...";
const doneLabel = "\u5DF2\u6DF1\u5EA6\u601D\u8003";
const placeholderLabel = "\u6B63\u5728\u601D\u8003\u4E2D...";
const expanded = ref(true);
// 思考进行中强制展开，结束后回到用户可控的折叠态
const isOpen = computed(() => expanded.value || props.thinking);
const panelId = `eb-chat-thinking-${Math.random().toString(36).slice(2, 9)}`;
function formatDuration(ms) {
  if (ms < 1e3) return `${ms}ms`;
  return `${(ms / 1e3).toFixed(1)}s`;
}

</script>

<style scoped>

.eb-chat-thinking {
  background: var(--eb-fill-color-light);
  border-radius: var(--eb-radius-md);
  margin-bottom: var(--eb-space-3);
  overflow: hidden;
}

.eb-chat-thinking__header {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  width: 100%;
  padding: var(--eb-space-2) var(--eb-space-3);
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  user-select: none;
  transition: background var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-thinking__header:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
}

.eb-chat-thinking__header:hover {
  background: var(--eb-fill-color);
}

.eb-chat-thinking__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--eb-color-info);
  font-size: 12px;
}

.eb-chat-thinking__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--eb-color-primary);
  animation: eb-chat-thinking-pulse 1.4s ease-in-out infinite;
}

@keyframes eb-chat-thinking-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.eb-chat-thinking__label {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
}

.eb-chat-thinking__duration {
  color: var(--eb-text-color-placeholder);
}

.eb-chat-thinking__content {
  padding: 0 var(--eb-space-3) var(--eb-space-3);
  border-top: 1px solid var(--eb-border-color-lighter);
  padding-top: var(--eb-space-3);
}

.eb-chat-thinking__placeholder {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-placeholder);
  font-style: italic;
}

.eb-chat-thinking__content :deep(.eb-chat-markdown) {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
}

.eb-chat-thinking-collapse-enter-active,
.eb-chat-thinking-collapse-leave-active {
  transition: all var(--eb-duration-base) var(--eb-ease-out);
  overflow: hidden;
}

.eb-chat-thinking-collapse-enter-from,
.eb-chat-thinking-collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
}

.eb-chat-thinking-collapse-enter-to,
.eb-chat-thinking-collapse-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
