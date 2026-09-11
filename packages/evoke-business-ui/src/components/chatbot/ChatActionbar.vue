<template>
  <div class="eb-chat-actionbar">
    <button 
      v-if="showCopy"
      class="eb-chat-actionbar__btn"
      :title="copied ? '已复制' : '复制'"
      @click="handleCopy"
    >
      <eb-icon :name="copied ? 'check' : 'copy-document'" />
    </button>
    <button 
      v-if="showRegenerate && message?.role === 'assistant'"
      class="eb-chat-actionbar__btn"
      title="重新生成"
      @click="handleRegenerate"
    >
      <eb-icon name="refresh-right" />
    </button>
    <button 
      v-for="action in actions" 
      :key="action.key"
      class="eb-chat-actionbar__btn"
      :title="action.label"
      @click="handleCustomAction(action)"
    >
      <eb-icon v-if="action.icon" :name="String(action.icon)" />
      <span v-else>{{ action.label }}</span>
    </button>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
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

.eb-chat-actionbar {
  display: flex;
  gap: var(--eb-space-1);
  margin-top: var(--eb-space-2);
  opacity: 0;
  transform: translateY(-2px);
  pointer-events: none;
  will-change: opacity, transform;
  transition: opacity 0.15s var(--eb-ease-out), transform 0.15s var(--eb-ease-out);
}

.eb-chat-actionbar.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.eb-chat-actionbar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--eb-radius-md);
  cursor: pointer;
  color: var(--eb-text-color-secondary);
  transition: background-color 0.15s var(--eb-ease-out), color 0.15s var(--eb-ease-out);
  padding: 0;
  font-size: 14px;
  will-change: background-color;
}

.eb-chat-actionbar__btn:hover {
  background: var(--eb-fill-color);
  color: var(--eb-text-color-primary);
}
</style>
