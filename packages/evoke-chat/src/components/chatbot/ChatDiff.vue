<template>
  <div
    v-if="parsed.files.length"
    class="eb-chat-diff"
    role="group"
    :aria-label="groupLabel"
  >
    <section v-for="(file, fi) in parsed.files" :key="fi" class="eb-chat-diff__file">
      <div class="eb-chat-diff__head">
        <button
          v-if="collapsible"
          type="button"
          class="eb-chat-diff__toggle"
          :aria-expanded="String(isOpen(fi))"
          :aria-controls="panelId(fi)"
          @click="toggle(fi)"
        >
          <eb-icon :name="isOpen(fi) ? 'arrow-down' : 'arrow-right'" :size="12" />
        </button>
        <span class="eb-chat-diff__path">{{ file.path || file.oldPath || labels.diff.untitled }}</span>
        <span class="eb-chat-diff__stats" :aria-label="statsLabel(file)">
          <span class="eb-chat-diff__add">+{{ file.additions }}</span>
          <span class="eb-chat-diff__del">−{{ file.deletions }}</span>
        </span>
        <button
          type="button"
          class="eb-chat-diff__copy"
          :title="copied ? labels.diff.copied : labels.diff.copy"
          :aria-label="copied ? labels.diff.copied : labels.diff.copy"
          @click="copyRaw"
        >
          <eb-icon :name="copied ? 'check' : 'copy-document'" :size="12" />
        </button>
      </div>

      <div v-show="isOpen(fi)" :id="panelId(fi)" class="eb-chat-diff__body" :style="bodyStyle">
        <div
          v-for="(line, li) in file.lines"
          :key="li"
          class="eb-chat-diff__line"
          :class="`is-${line.type}`"
        >
          <template v-if="line.type === 'hunk'">
            <span class="eb-chat-diff__hunk">{{ line.text }}<template v-if="line.heading"> {{ line.heading }}</template></span>
          </template>
          <template v-else-if="line.type === 'meta' || line.type === 'note'">
            <span class="eb-chat-diff__meta">{{ line.text }}</span>
          </template>
          <template v-else>
            <span class="eb-chat-diff__gutter" aria-hidden="true">
              <span class="eb-chat-diff__old">{{ line.oldNo ?? '' }}</span>
              <span class="eb-chat-diff__new">{{ line.newNo ?? '' }}</span>
            </span>
            <span class="eb-chat-diff__sign" aria-hidden="true">{{ signOf(line.type) }}</span>
            <span class="eb-chat-diff__text">{{ line.text || ' ' }}</span>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import EbIcon from "@wil-works/evoke-business-ui/icon"
import { ref, computed } from "vue";
import { parseDiff } from "./diff";
import { copyToClipboard } from "./utils";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** 原始统一 diff 文本（git diff / agent 输出的那种） */
  diff: { type: String, required: false, default: "" },
  /** 是否显示行号栅格 */
  showLineNumbers: { type: Boolean, required: false, default: true },
  collapsible: { type: Boolean, required: false, default: true },
  defaultOpen: { type: Boolean, required: false, default: true },
  /** 内容区最大高度，超出滚动 */
  maxHeight: { type: [String, Number], required: false, default: "360px" }
});
const emit = defineEmits(["toggle", "copy"]);
const parsed = computed(() => parseDiff(props.diff));
const copied = ref(false);
const closed = ref(new Set());

const groupLabel = computed(
  () => `${labels.diff.group}：${parsed.value.files.length} 个文件，新增 ${parsed.value.additions} 行，删除 ${parsed.value.deletions} 行`
);
const bodyStyle = computed(() => ({
  maxHeight: typeof props.maxHeight === "number" ? `${props.maxHeight}px` : props.maxHeight
}));

function isOpen(index) {
  return props.defaultOpen ? !closed.value.has(index) : closed.value.has(index);
}
function panelId(index) {
  return `eb-chat-diff-${index}`;
}
function toggle(index) {
  const next = new Set(closed.value);
  if (isOpen(index)) next.add(index);
  else next.delete(index);
  closed.value = next;
  emit("toggle", index, isOpen(index));
}
function signOf(type) {
  if (type === "add") return "+";
  if (type === "del") return "−";
  return " ";
}
function statsLabel(file) {
  return `新增 ${file.additions} 行，删除 ${file.deletions} 行`;
}
async function copyRaw() {
  try {
    await copyToClipboard(props.diff);
    copied.value = true;
    emit("copy", props.diff);
    setTimeout(() => {
      copied.value = false;
    }, 2e3);
  } catch {
    // 剪贴板被拒时不提示成功
  }
}

</script>

<style scoped>

.eb-chat-diff {
  display: flex;
  flex-direction: column;
  gap: var(--eb-space-2);
  margin-top: var(--eb-space-2);
}

.eb-chat-diff__file {
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  overflow: hidden;
  background: var(--eb-fill-color-light);
}

.eb-chat-diff__head {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  padding: 4px var(--eb-space-2) 4px var(--eb-space-1);
  background: var(--eb-fill-color);
  border-bottom: 1px solid var(--eb-border-color-lighter);
}

.eb-chat-diff__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-secondary);
  cursor: pointer;
}

.eb-chat-diff__toggle:hover {
  background: var(--eb-fill-color-dark);
}

.eb-chat-diff__toggle:focus-visible,
.eb-chat-diff__copy:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-diff__path {
  flex: 1;
  min-width: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: left;
}

.eb-chat-diff__stats {
  display: inline-flex;
  gap: var(--eb-space-1);
  flex-shrink: 0;
  font-size: var(--eb-font-size-xs);
  font-variant-numeric: tabular-nums;
}

.eb-chat-diff__add {
  color: var(--eb-color-success);
}

.eb-chat-diff__del {
  color: var(--eb-color-danger);
}

.eb-chat-diff__copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-secondary);
  cursor: pointer;
}

.eb-chat-diff__copy:hover {
  background: var(--eb-fill-color-dark);
  color: var(--eb-text-color-primary);
}

.eb-chat-diff__body {
  overflow: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
  line-height: 1.7;
}

.eb-chat-diff__line {
  display: flex;
  align-items: flex-start;
  white-space: pre;
  min-width: max-content;
}

.eb-chat-diff__line.is-add {
  background: var(--eb-color-success-light-9);
}

.eb-chat-diff__line.is-del {
  background: var(--eb-color-danger-light-9);
}

.eb-chat-diff__line.is-hunk {
  padding: 2px var(--eb-space-2);
  background: var(--eb-fill-color);
  color: var(--eb-color-info);
}

.eb-chat-diff__hunk {
  white-space: pre-wrap;
  word-break: break-all;
}

.eb-chat-diff__line.is-meta,
.eb-chat-diff__line.is-note {
  padding: 0 var(--eb-space-2);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-diff__meta {
  white-space: pre-wrap;
  word-break: break-all;
}

.eb-chat-diff__gutter {
  display: inline-flex;
  flex-shrink: 0;
  user-select: none;
  color: var(--eb-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.eb-chat-diff__old,
.eb-chat-diff__new {
  display: inline-block;
  width: 34px;
  padding: 0 var(--eb-space-1);
  text-align: right;
}

.eb-chat-diff__sign {
  display: inline-block;
  width: 14px;
  flex-shrink: 0;
  text-align: center;
  user-select: none;
}

.eb-chat-diff__line.is-add .eb-chat-diff__sign {
  color: var(--eb-color-success);
}

.eb-chat-diff__line.is-del .eb-chat-diff__sign {
  color: var(--eb-color-danger);
}

.eb-chat-diff__text {
  flex: 1;
  padding-right: var(--eb-space-3);
  color: var(--eb-text-color-regular);
}

.eb-chat-diff__line.is-add .eb-chat-diff__text {
  color: var(--eb-color-success);
}

.eb-chat-diff__line.is-del .eb-chat-diff__text {
  color: var(--eb-color-danger);
}
</style>
