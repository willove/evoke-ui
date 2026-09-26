<template>
  <div class="eb-chat-changes">
    <button
      type="button"
      class="eb-chat-changes__header"
      :aria-expanded="String(open)"
      :aria-controls="panelId"
      :disabled="!foldable"
      @click="toggle"
    >
      <eb-icon name="file-edit" :size="14" />
      <span class="eb-chat-changes__title">{{ titleText }}</span>
      <span v-if="totals.added" class="eb-chat-changes__added">+{{ totals.added }}</span>
      <span v-if="totals.deleted" class="eb-chat-changes__deleted">-{{ totals.deleted }}</span>
      <eb-icon
        v-if="foldable"
        class="eb-chat-changes__chevron"
        :name="open ? 'arrow-down' : 'arrow-right'"
        :size="12"
      />
    </button>

    <ul :id="panelId" class="eb-chat-changes__list">
      <li v-for="(file, i) in visibleFiles" :key="file.path || i" class="eb-chat-changes__row">
        <button type="button" class="eb-chat-changes__file" :title="file.display || file.path" @click="emit('select', file)">
          {{ file.display || file.path }}
        </button>
        <span v-if="file.binary" class="eb-chat-changes__flag">{{ labels.changes.binary }}</span>
        <span v-else-if="file.oversized" class="eb-chat-changes__flag">{{ labels.changes.oversized }}</span>
        <template v-else>
          <span v-if="file.added" class="eb-chat-changes__added">+{{ file.added }}</span>
          <span v-if="file.deleted" class="eb-chat-changes__deleted">-{{ file.deleted }}</span>
        </template>
      </li>
      <li v-if="hiddenCount && !open" class="eb-chat-changes__more">
        <button type="button" class="eb-chat-changes__more-btn" @click="open = true">
          {{ labels.changes.more(hiddenCount) }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import EbIcon from "@wil-works/evoke-business-ui/icon";
import { useChatLabels } from "./labels";

const labels = useChatLabels();
const props = defineProps({
  /** [{ path, display?, added?, deleted?, binary?, oversized? }] */
  files: { type: Array, required: false, default: () => [] },
  /** 汇总可不传：缺了按文件列表自己加 */
  summary: { type: Object, required: false, default: null },
  /** 折叠时先露几行（超出给「全部 N 个文件」） */
  collapsedRows: { type: Number, required: false, default: 4 },
  /** 是否默认展开全部（否则只露 collapsedRows 行，其余收在「全部 N 个文件」后） */
  defaultOpen: { type: Boolean, required: false, default: false }
});
const emit = defineEmits(["select"]);

const open = ref(props.defaultOpen);
const panelId = `eb-chat-changes-${Math.random().toString(36).slice(2, 9)}`;

const totals = computed(() => {
  const source = props.summary || props.files.reduce(
    (acc, f) => ({ added: acc.added + (Number(f.added) || 0), deleted: acc.deleted + (Number(f.deleted) || 0) }),
    { added: 0, deleted: 0 },
  );
  return { added: Number(source.added) || 0, deleted: Number(source.deleted) || 0 };
});
const total = computed(() => Number(props.summary?.total) || props.files.length);
const titleText = computed(() => {
  if (total.value === 1 && props.files[0]) return labels.changes.single(props.files[0].display || props.files[0].path);
  return labels.changes.title(total.value);
});
const hiddenCount = computed(() => Math.max(0, props.files.length - props.collapsedRows));
/** 折叠时只露前 N 行；「全部 N 个文件」点开后平铺 */
const visibleFiles = computed(() => (open.value ? props.files : props.files.slice(0, props.collapsedRows)));
const foldable = computed(() => hiddenCount.value > 0);

function toggle() {
  if (!foldable.value) return;
  open.value = !open.value;
}
</script>

<style scoped>
.eb-chat-changes {
  border: 0;
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-blank);
  box-shadow: 0 0 0 1px var(--eb-border-color-extra-light) inset;
  overflow: hidden;
}

.eb-chat-changes__header {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  width: 100%;
  padding: var(--eb-space-2) var(--eb-space-3);
  border: 0;
  background: transparent;
  color: var(--eb-text-color-regular);
  font-family: inherit;
  font-size: var(--eb-font-size-sm);
  text-align: left;
  cursor: pointer;
}

.eb-chat-changes__header:disabled {
  cursor: default;
}

.eb-chat-changes__header:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -1px;
}

.eb-chat-changes__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* 标题是扫读锚点：字重 + 主色，比加边框更省视觉预算 */
  color: var(--eb-text-color-primary);
  font-weight: var(--eb-font-weight-medium);
}

.eb-chat-changes__chevron {
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
}

.eb-chat-changes__added {
  flex-shrink: 0;
  color: var(--eb-color-success);
  font-size: var(--eb-font-size-xs);
  font-variant-numeric: tabular-nums;
}

.eb-chat-changes__deleted {
  flex-shrink: 0;
  color: var(--eb-color-danger);
  font-size: var(--eb-font-size-xs);
  font-variant-numeric: tabular-nums;
}

.eb-chat-changes__list {
  margin: 0;
  padding: 0 0 var(--eb-space-1);
  list-style: none;
  border-top: 1px solid var(--eb-border-color-extra-light);
}

.eb-chat-changes__row {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  padding: 2px var(--eb-space-3);
}

/* 路径不折行：保住目录层级可读性，过长省略并留 title */
.eb-chat-changes__file {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--eb-text-color-regular);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
  text-align: left;
  cursor: pointer;
}

.eb-chat-changes__file:hover {
  color: var(--eb-color-primary);
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}

.eb-chat-changes__file:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-changes__flag {
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
  font-size: var(--eb-font-size-xs);
}

.eb-chat-changes__more {
  padding: 2px var(--eb-space-3);
}

.eb-chat-changes__more-btn {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--eb-color-primary);
  font-family: inherit;
  font-size: var(--eb-font-size-xs);
  cursor: pointer;
}

.eb-chat-changes__more-btn:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}
</style>