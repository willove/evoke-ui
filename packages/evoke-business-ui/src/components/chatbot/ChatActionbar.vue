<template>
  <div class="eb-chat-actionbar" role="group" :aria-label="labels.actionbar.group">
    <button 
      v-if="showCopy"
      class="eb-chat-actionbar__btn"
      type="button"
      :title="copied ? labels.actionbar.copied : labels.actionbar.copy"
      :aria-label="copied ? labels.actionbar.copied : labels.actionbar.copy"
      @click="handleCopy"
    >
      <eb-icon :name="copied ? 'check' : 'copy-document'" />
    </button>
    <button 
      v-if="showEdit && message?.role === 'user'"
      class="eb-chat-actionbar__btn"
      type="button"
      :title="labels.actionbar.edit"
      :aria-label="labels.actionbar.edit"
      @click="handleEdit"
    >
      <eb-icon name="edit" />
    </button>
    <button 
      v-if="showRegenerate && message?.role === 'assistant'"
      class="eb-chat-actionbar__btn"
      type="button"
      :title="labels.actionbar.regenerate"
      :aria-label="labels.actionbar.regenerate"
      @click="handleRegenerate"
    >
      <eb-icon name="refresh-right" />
    </button>
    <button 
      v-for="action in actions" 
      :key="action.key"
      class="eb-chat-actionbar__btn"
      type="button"
      :title="action.label"
      :aria-label="action.label"
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
import { chatLabels as labels } from "./labels";
const props = defineProps({
  message: { type: null, required: false },
  actions: { type: Array, required: false, default: () => [] },
  showCopy: { type: Boolean, required: false, default: true },
  showRegenerate: { type: Boolean, required: false, default: true },
  /** 用户消息的「编辑并重发」；role 收敛在模板里 */
  showEdit: { type: Boolean, required: false, default: false }
});
const emit = defineEmits(["copy", "regenerate", "edit", "action"]);
const copied = ref(false);
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
function handleEdit() {
  if (props.message) {
    emit("edit", props.message);
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

/* 键盘用户 Tab 进来必须看得见；触屏没有 hover，常显 */
.eb-chat-actionbar:focus-within {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

@media (hover: none) {
  .eb-chat-actionbar {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }
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

.eb-chat-actionbar__btn:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}
</style>
