<template>
  <div v-if="items.length" class="eb-chat-queue" role="group" :aria-label="labels.queue.group">
    <span class="eb-chat-queue__lead">{{ labels.queue.lead(items.length) }}</span>
    <span v-for="(item, i) in items" :key="item.id" class="eb-chat-queue__item">
      <span class="eb-chat-queue__index" aria-hidden="true">{{ i + 1 }}</span>
      <span class="eb-chat-queue__text">{{ item.content || labels.queue.attachmentOnly }}</span>
      <button
        type="button"
        class="eb-chat-queue__remove"
        :title="labels.queue.remove"
        :aria-label="labels.queue.remove"
        @click="emit('remove', item.id)"
      >
        <eb-icon name="close" :size="12" />
      </button>
    </span>
    <button type="button" class="eb-chat-queue__clear" @click="emit('clear')">
      {{ labels.queue.clear }}
    </button>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
import { chatLabels as labels } from "./labels";
defineProps({
  /** 排队中的待发送项 [{ id, content, attachments? }] */
  items: { type: Array, required: false, default: () => [] }
});
const emit = defineEmits(["remove", "clear"]);

</script>

<style scoped>

/* 待发送队列：贴在输入区上方的一条窄带，逐条可撤 */
.eb-chat-queue {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--eb-space-2);
  padding: var(--eb-space-1) var(--eb-space-2);
  margin-bottom: var(--eb-space-1);
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-lighter);
  font-size: var(--eb-font-size-xs);
}

.eb-chat-queue__lead {
  flex-shrink: 0;
  color: var(--eb-text-color-secondary);
}

.eb-chat-queue__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 220px;
  padding: 1px 2px 1px 6px;
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-sm);
  background: var(--eb-bg-color-overlay);
}

.eb-chat-queue__index {
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.eb-chat-queue__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--eb-text-color-regular);
}

.eb-chat-queue__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--eb-text-color-placeholder);
  cursor: pointer;
}

.eb-chat-queue__remove:hover {
  background: var(--eb-fill-color-dark);
  color: var(--eb-text-color-secondary);
}

.eb-chat-queue__remove:focus-visible,
.eb-chat-queue__clear:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-queue__clear {
  margin-left: auto;
  padding: 0 4px;
  border: none;
  background: transparent;
  color: var(--eb-color-primary);
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
}
</style>
