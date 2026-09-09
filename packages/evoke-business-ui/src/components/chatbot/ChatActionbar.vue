<template>
  <div class="ev-chat-actionbar">
    <button 
      v-if="showCopy"
      class="ev-chat-actionbar__btn"
      :title="copied ? '已复制' : '复制'"
      @click="handleCopy"
    >
      <ev-icon :name="copied ? 'check' : 'copy-document'" />
    </button>
    <button 
      v-if="showRegenerate && message?.role === 'assistant'"
      class="ev-chat-actionbar__btn"
      title="重新生成"
      @click="handleRegenerate"
    >
      <ev-icon name="refresh-right" />
    </button>
    <button 
      v-for="action in actions" 
      :key="action.key"
      class="ev-chat-actionbar__btn"
      :title="action.label"
      @click="handleCustomAction(action)"
    >
      <ev-icon v-if="action.icon" :name="String(action.icon)" />
      <span v-else>{{ action.label }}</span>
    </button>
  </div>
</template>

<script setup>
import EvIcon from "../icon/index.vue"
import { ref } from "vue";
import { copyToClipboard } from "./utils";
import { getIconByNameSync } from "../icon/iconRegistry";
const props = defineProps({
  message: { type: null, required: false },
  actions: { type: Array, required: false, default: () => [] },
  showCopy: { type: Boolean, required: false, default: true },
  showRegenerate: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["copy", "regenerate", "action"]);
const Check = getIconByNameSync("check");
const CopyDocument = getIconByNameSync("copy-document");
const RefreshRight = getIconByNameSync("refresh-right");
const copied = ref(false);
function getIconComponent(iconName) {
  return getIconByNameSync(iconName);
}
async function handleCopy() {
  if (!props.message) return;
  try {
    await copyToClipboard(props.message.content);
    copied.value = true;
    emit("copy", props.message);
    setTimeout(() => {
      copied.value = false;
    }, 2e3);
  } catch {
  }
}
function handleRegenerate() {
  if (props.message) {
    emit("regenerate", props.message);
  }
}
function handleCustomAction(action) {
  if (props.message) {
    emit("action", action.key, props.message);
  }
}

</script>

<style scoped>

.ev-chat-actionbar {
  display: flex;
  gap: var(--ev-space-1);
  margin-top: var(--ev-space-2);
  opacity: 0;
  transform: translateY(-2px);
  pointer-events: none;
  will-change: opacity, transform;
  transition: opacity 0.15s var(--ev-ease-out), transform 0.15s var(--ev-ease-out);
}

.ev-chat-actionbar.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.ev-chat-actionbar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--ev-radius-md);
  cursor: pointer;
  color: var(--ev-text-color-secondary);
  transition: background-color 0.15s var(--ev-ease-out), color 0.15s var(--ev-ease-out);
  padding: 0;
  font-size: 14px;
  will-change: background-color;
}

.ev-chat-actionbar__btn:hover {
  background: var(--ev-fill-color);
  color: var(--ev-text-color-primary);
}
</style>
