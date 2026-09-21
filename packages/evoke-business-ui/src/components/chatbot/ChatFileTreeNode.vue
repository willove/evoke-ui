<template>
  <li class="eb-chat-file-node">
    <button
      v-if="node.isDir"
      type="button"
      class="eb-chat-file-node__row is-dir"
      :style="indentStyle"
      :aria-expanded="String(isOpen)"
      @click="toggle"
    >
      <eb-icon :name="isOpen ? 'folder-open' : 'folder'" :size="13" class="eb-chat-file-node__icon" />
      <span class="eb-chat-file-node__name">{{ node.name }}</span>
    </button>

    <button
      v-else
      type="button"
      class="eb-chat-file-node__row is-file"
      :style="indentStyle"
      :title="node.path"
      @click="emit('select', node.file, node.path)"
    >
      <eb-icon :name="iconOf(node)" :size="13" class="eb-chat-file-node__icon" />
      <span class="eb-chat-file-node__name">{{ node.name }}</span>
      <span v-if="statusLabel" class="eb-chat-file-node__status" :class="`is-${statusOf(node)}`">{{ statusLabel }}</span>
      <span v-if="hasStats" class="eb-chat-file-node__stats">
        <span v-if="node.file?.additions" class="eb-chat-file-node__add">+{{ node.file.additions }}</span>
        <span v-if="node.file?.deletions" class="eb-chat-file-node__del">−{{ node.file.deletions }}</span>
      </span>
    </button>

    <ul v-if="node.isDir && isOpen && node.children.length" class="eb-chat-file-node__children">
      <ChatFileTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :expanded="expanded"
        @toggle="(p, o) => emit('toggle', p, o)"
        @select="(f, p) => emit('select', f, p)"
      />
    </ul>
  </li>
</template>

<script setup>
import { computed } from "vue";
import EbIcon from "../icon/index.vue"
import { chatLabels as labels } from "./labels";
const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, required: false, default: 0 },
  expanded: { type: Object, required: true }
});
const emit = defineEmits(["toggle", "select"]);

const isOpen = computed(() => props.expanded.has(props.node.path));
const indentStyle = computed(() => ({ paddingLeft: `${props.depth * 14 + 6}px` }));

// 图标名受内置集约束：file-reduce / file-forbid 不在集内，
// 已删除用 close、重命名用 switch（左右箭头语义比 folder 贴）
const ICONS = {
  added: "file-add",
  deleted: "close",
  renamed: "switch",
  modified: "file-text"
};

function statusOf(node) {
  return node.file?.status || "modified";
}
const statusLabel = computed(() => (props.node.isDir ? "" : labels.fileTree[statusOf(props.node)] || ""));

function iconOf(node) {
  const ext = String(node.name).split(".").pop()?.toLowerCase();
  const byExt = { js: "file-code", ts: "file-code", py: "file-code", vue: "file-code", md: "file-text", json: "json", csv: "table", sh: "terminal" };
  if (byExt[ext]) return byExt[ext];
  return ICONS[statusOf(node)] || "document";
}

const hasStats = computed(() => !props.node.isDir && (props.node.file?.additions || props.node.file?.deletions));

function toggle() {
  emit("toggle", props.node.path, !isOpen.value);
}

</script>

<style scoped>

.eb-chat-file-node__row {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  width: 100%;
  padding: 3px var(--eb-space-2) 3px 0;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: var(--eb-font-size-xs);
  text-align: left;
  cursor: pointer;
}

.eb-chat-file-node__row:hover {
  background: var(--eb-fill-color);
}

.eb-chat-file-node__row:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
  border-radius: var(--eb-radius-sm);
}

.eb-chat-file-node__icon {
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
}

.eb-chat-file-node__row.is-dir .eb-chat-file-node__icon {
  color: var(--eb-color-warning);
}

.eb-chat-file-node__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--eb-text-color-regular);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.eb-chat-file-node__row.is-dir .eb-chat-file-node__name {
  color: var(--eb-text-color-primary);
  font-weight: var(--eb-font-weight-medium);
}

.eb-chat-file-node__status {
  flex-shrink: 0;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 3px;
  line-height: 15px;
}

.eb-chat-file-node__status.is-added {
  color: var(--eb-color-success);
  background: var(--eb-color-success-light-9);
}

.eb-chat-file-node__status.is-modified {
  color: var(--eb-color-warning);
  background: var(--eb-color-warning-light-9);
}

.eb-chat-file-node__status.is-deleted {
  color: var(--eb-color-danger);
  background: var(--eb-color-danger-light-9);
}

.eb-chat-file-node__status.is-renamed {
  color: var(--eb-color-info);
  background: var(--eb-color-info-light-9);
}

.eb-chat-file-node__stats {
  display: inline-flex;
  gap: var(--eb-space-1);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.eb-chat-file-node__add {
  color: var(--eb-color-success);
}

.eb-chat-file-node__del {
  color: var(--eb-color-danger);
}

.eb-chat-file-node__children {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
