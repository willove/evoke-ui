<template>
  <div class="ev-chat-thinking">
    <div class="ev-chat-thinking__header" @click="expanded = !expanded">
      <div class="ev-chat-thinking__icon">
        <span v-if="thinking" class="ev-chat-thinking__dot"></span>
        <ev-icon v-else :name="expanded ? 'arrow-down' : 'arrow-right'" />
      </div>
      <span class="ev-chat-thinking__label">
        {{ thinking ? '思考中...' : '已深度思考' }}
        <span v-if="duration" class="ev-chat-thinking__duration">（用时 {{ formatDuration(duration) }}）</span>
      </span>
    </div>
    <transition name="ev-chat-thinking-collapse">
      <div v-show="expanded || thinking" class="ev-chat-thinking__content">
        <ChatMarkdown v-if="content" :content="content" />
        <div v-else class="ev-chat-thinking__placeholder">正在思考中...</div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import EvIcon from "../icon/index.vue"
import { ref } from "vue";
import ChatMarkdown from "./ChatMarkdown.vue";
import { getIconByNameSync } from "../icon/iconRegistry";
const props = defineProps({
  content: { type: String, required: false, default: "" },
  thinking: { type: Boolean, required: false, default: false },
  duration: { type: Number, required: false, default: 0 }
});
const ArrowDown = getIconByNameSync("arrow-down");
const ArrowRight = getIconByNameSync("arrow-right");
const expanded = ref(true);
function formatDuration(ms) {
  if (ms < 1e3) return `${ms}ms`;
  return `${(ms / 1e3).toFixed(1)}s`;
}

</script>

<style scoped>

.ev-chat-thinking {
  background: var(--ev-fill-color-light);
  border-radius: var(--ev-radius-md);
  margin-bottom: var(--ev-space-3);
  overflow: hidden;
}

.ev-chat-thinking__header {
  display: flex;
  align-items: center;
  gap: var(--ev-space-2);
  padding: var(--ev-space-2) var(--ev-space-3);
  cursor: pointer;
  user-select: none;
  transition: background var(--ev-duration-fast) var(--ev-ease-out);
}

.ev-chat-thinking__header:hover {
  background: var(--ev-fill-color);
}

.ev-chat-thinking__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--ev-color-info);
  font-size: 12px;
}

.ev-chat-thinking__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ev-color-primary);
  animation: ev-chat-thinking-pulse 1.4s ease-in-out infinite;
}

@keyframes ev-chat-thinking-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.ev-chat-thinking__label {
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-secondary);
}

.ev-chat-thinking__duration {
  color: var(--ev-text-color-placeholder);
}

.ev-chat-thinking__content {
  padding: 0 var(--ev-space-3) var(--ev-space-3);
  border-top: 1px solid var(--ev-border-color-lighter);
  padding-top: var(--ev-space-3);
}

.ev-chat-thinking__placeholder {
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-placeholder);
  font-style: italic;
}

.ev-chat-thinking__content :deep(.ev-chat-markdown) {
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-secondary);
}

.ev-chat-thinking-collapse-enter-active,
.ev-chat-thinking-collapse-leave-active {
  transition: all var(--ev-duration-base) var(--ev-ease-out);
  overflow: hidden;
}

.ev-chat-thinking-collapse-enter-from,
.ev-chat-thinking-collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
}

.ev-chat-thinking-collapse-enter-to,
.ev-chat-thinking-collapse-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
