<template>
  <div v-if="resolved.length" class="eb-chat-artifacts" role="group" :aria-label="labels.artifact.group">
    <slot
      v-for="(item, i) in resolved"
      :key="item.id ?? i"
      name="artifact"
      :artifact="item"
      :index="i"
      :itemProps="itemPropsFor(item)"
    >
      <div class="eb-chat-artifact">
        <span class="eb-chat-artifact__icon" aria-hidden="true">
          <eb-icon :name="iconOf(item)" :size="16" />
        </span>
        <div class="eb-chat-artifact__info">
          <span class="eb-chat-artifact__title">{{ item.title || labels.artifact.unknownType }}</span>
          <span v-if="metaOf(item)" class="eb-chat-artifact__meta">{{ metaOf(item) }}</span>
        </div>
        <div class="eb-chat-artifact__actions">
          <button
            type="button"
            class="eb-chat-artifact__act"
            @click="emit('open', item)"
          >
            {{ labels.artifact.open }}
          </button>
          <button
            v-if="item.content != null"
            type="button"
            class="eb-chat-artifact__act"
            :title="copiedId === item.id ? labels.artifact.copied : labels.artifact.copy"
            :aria-label="copiedId === item.id ? labels.artifact.copied : labels.artifact.copy"
            @click="handleCopy(item)"
          >
            <eb-icon :name="copiedId === item.id ? 'check' : 'copy-document'" :size="13" />
          </button>
          <a
            v-if="item.url"
            class="eb-chat-artifact__act"
            :href="item.url"
            :download="downloadName(item)"
            :title="labels.artifact.download"
            :aria-label="labels.artifact.download"
          >
            <eb-icon name="download" :size="13" />
          </a>
        </div>
      </div>
    </slot>
  </div>
</template>

<script setup>
import EbIcon from "../icon/index.vue"
import { ref, computed } from "vue";
import { copyToClipboard, formatFileSize } from "./utils";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** [{ id, title, type, language?, content?, url?, size? }] */
  artifacts: { type: Array, required: false, default: () => [] },
  /** 是否给复制钮（有 content 才有意义，这里可整体关掉） */
  copyable: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["open", "copy"]);
const copiedId = ref("");
const resolved = computed(() => props.artifacts.filter(Boolean));

// type 由宿主给（不给就按扩展名猜），命中不了就用通用文件图标
const TYPE_ICONS = {
  code: "file-code",
  text: "file-text",
  markdown: "file-text",
  json: "json",
  table: "table",
  csv: "table",
  image: "file-image",
  pdf: "file-pdf",
  word: "file-word",
  excel: "file-excel",
  zip: "file-zip",
  shell: "terminal",
  folder: "folder"
};

function iconOf(item) {
  if (item.type && TYPE_ICONS[item.type]) return TYPE_ICONS[item.type];
  const ext = String(item.title || "").split(".").pop()?.toLowerCase();
  const byExt = { js: "file-code", ts: "file-code", py: "file-code", vue: "file-code", md: "file-text", json: "json", csv: "table", png: "file-image", jpg: "file-image", svg: "file-image", pdf: "file-pdf", zip: "file-zip", sh: "terminal" };
  return byExt[ext] || "document";
}

function metaOf(item) {
  const parts = [];
  if (item.language) parts.push(item.language);
  if (item.size) parts.push(formatFileSize(item.size));
  else if (item.content) parts.push(formatFileSize(new Blob([item.content]).size));
  return parts.join(' · ');
}

function downloadName(item) {
  return String(item.title || item.id || "artifact").split("/").pop();
}

/**
 * 逐项 props 束：与 ChatList#message / ChatThreads#item 同款约定，
 * 宿主用 v-bind="p.itemProps" 即可回落默认卡片
 */
function itemPropsFor(item) {
  return { artifact: item, copyable: props.copyable };
}

async function handleCopy(item) {
  try {
    await copyToClipboard(String(item.content ?? ""));
    copiedId.value = item.id;
    emit("copy", item);
    setTimeout(() => {
      if (copiedId.value === item.id) copiedId.value = "";
    }, 2e3);
  } catch {
    // 剪贴板被拒时什么都不做：宿主可从 copy 事件自行兜底
  }
}

</script>

<style scoped>

.eb-chat-artifacts {
  display: flex;
  flex-direction: column;
  gap: var(--eb-space-1);
  margin-top: var(--eb-space-2);
}

.eb-chat-artifact {
  display: flex;
  align-items: center;
  gap: var(--eb-space-3);
  padding: var(--eb-space-2) var(--eb-space-3);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  background: var(--eb-bg-color-overlay);
  transition: border-color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-artifact:hover {
  border-color: var(--eb-color-primary-light-5);
}

.eb-chat-artifact__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: var(--eb-radius-sm);
  background: var(--eb-fill-color-light);
  color: var(--eb-color-info);
}

.eb-chat-artifact__info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.eb-chat-artifact__title {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eb-chat-artifact__meta {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-artifact__actions {
  display: flex;
  align-items: center;
  gap: var(--eb-space-1);
  flex-shrink: 0;
}

.eb-chat-artifact__act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 var(--eb-space-2);
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--eb-duration-fast) var(--eb-ease-out), color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-artifact__act:hover {
  background: var(--eb-fill-color);
  color: var(--eb-color-primary);
}

.eb-chat-artifact__act:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}
</style>
