<template>
  <div class="eb-chat-terminal" :class="[`is-${status}`]">
    <div class="eb-chat-terminal__head">
      <button
        v-if="collapsible"
        type="button"
        class="eb-chat-terminal__toggle"
        :aria-expanded="String(open)"
        :aria-controls="panelId"
        @click="toggle"
      >
        <eb-icon :name="open ? 'arrow-down' : 'arrow-right'" :size="12" />
      </button>
      <span class="eb-chat-terminal__prompt" aria-hidden="true">$</span>
      <span class="eb-chat-terminal__cmd">{{ command || labels.terminal.group }}</span>
      <span v-if="statusText" class="eb-chat-terminal__status">{{ statusText }}</span>
      <button
        v-if="output"
        type="button"
        class="eb-chat-terminal__act"
        :title="copied ? labels.terminal.copied : labels.terminal.copy"
        :aria-label="copied ? labels.terminal.copied : labels.terminal.copy"
        @click="copyOutput"
      >
        <eb-icon :name="copied ? 'check' : 'copy-document'" :size="12" />
      </button>
    </div>

    <div v-show="open" :id="panelId" class="eb-chat-terminal__body" :style="bodyStyle">
      <p v-if="omitted > 0 && !showAll" class="eb-chat-terminal__omitted">
        {{ labels.terminal.truncated(omitted) }}
        <button type="button" class="eb-chat-terminal__more" @click="showAll = true">
          {{ labels.terminal.expand }}
        </button>
      </p>
      <pre class="eb-chat-terminal__out"><span v-html="outputHtml" /><span v-if="status === 'running'" class="eb-chat-terminal__caret" aria-hidden="true" /></pre>
      <p v-if="!output && status === 'running'" class="eb-chat-terminal__empty">{{ labels.terminal.empty }}</p>
    </div>
  </div>
</template>

<script setup>
import EbIcon from "@wil-works/evoke-business-ui/icon"
import { ref, computed } from "vue";
import { ansiToHtml, stripAnsi } from "./ansi";
import { copyToClipboard } from "./utils";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** 命令行本身，显示在头部 */
  command: { type: String, required: false, default: "" },
  /** 输出原文（可带 ANSI SGR） */
  output: { type: String, required: false, default: "" },
  /** running / done / error */
  status: { type: String, required: false, default: "done" },
  /** 退出码；给了就显示 */
  exitCode: { type: [Number, String], required: false, default: null },
  collapsible: { type: Boolean, required: false, default: true },
  defaultOpen: { type: Boolean, required: false, default: true },
  maxHeight: { type: [String, Number], required: false, default: "320px" },
  /** 超过这个行数只渲染尾部——命令输出动辄上千行，全渲染会拖垮消息列 */
  tailLines: { type: Number, required: false, default: 40 }
});
const emit = defineEmits(["toggle", "copy"]);
const open = ref(props.defaultOpen);
const showAll = ref(false);
const copied = ref(false);
const panelId = `eb-chat-terminal-${Math.random().toString(36).slice(2, 9)}`;

// 复制用纯文本；渲染必须拿原文——先 strip 再转换等于把颜色全剥掉
const plain = computed(() => stripAnsi(props.output));
const lines = computed(() => (props.output ? props.output.replace(/\n$/, "").split("\n") : []));
const omitted = computed(() => (props.tailLines > 0 ? Math.max(0, lines.value.length - props.tailLines) : 0));

// 截行在原文上做（SGR 序列不含换行，按 \n 切是安全的），
// 先截行再做 ANSI 转换：转换有状态（span 跨行继承样式），先转再截会切坏未闭合的 span
const visibleRaw = computed(() => {
  if (omitted.value === 0 || showAll.value) return props.output;
  return lines.value.slice(-props.tailLines).join("\n");
});
const outputHtml = computed(() => ansiToHtml(visibleRaw.value));

const statusText = computed(() => {
  if (props.status === "running") return labels.terminal.group;
  if (props.exitCode !== null && props.exitCode !== undefined && props.exitCode !== "") {
    return `exit ${props.exitCode}`;
  }
  return "";
});
const bodyStyle = computed(() => ({
  maxHeight: typeof props.maxHeight === "number" ? `${props.maxHeight}px` : props.maxHeight
}));

function toggle() {
  open.value = !open.value;
  emit("toggle", open.value);
}
async function copyOutput() {
  try {
    await copyToClipboard(plain.value);
    copied.value = true;
    emit("copy", plain.value);
    setTimeout(() => {
      copied.value = false;
    }, 2e3);
  } catch {
    // 剪贴板被拒时不提示成功
  }
}

</script>

<style scoped>

.eb-chat-terminal {
  margin-top: var(--eb-space-2);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  overflow: hidden;
  background: var(--eb-fill-color-light);
}

.eb-chat-terminal.is-error {
  border-color: var(--eb-color-danger-light-7);
}

.eb-chat-terminal__head {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  padding: 4px var(--eb-space-2) 4px var(--eb-space-1);
  background: var(--eb-fill-color);
  border-bottom: 1px solid var(--eb-border-color-lighter);
}

.eb-chat-terminal__toggle,
.eb-chat-terminal__act {
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

.eb-chat-terminal__toggle:hover,
.eb-chat-terminal__act:hover {
  background: var(--eb-fill-color-dark);
  color: var(--eb-text-color-primary);
}

.eb-chat-terminal__toggle:focus-visible,
.eb-chat-terminal__act:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-terminal__prompt {
  flex-shrink: 0;
  color: var(--eb-color-success);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
  user-select: none;
}

.eb-chat-terminal__cmd {
  flex: 1;
  min-width: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eb-chat-terminal__status {
  flex-shrink: 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.eb-chat-terminal.is-error .eb-chat-terminal__status {
  color: var(--eb-color-danger);
}

.eb-chat-terminal__body {
  overflow: auto;
  padding: var(--eb-space-2) var(--eb-space-3);
}

.eb-chat-terminal__out {
  margin: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
  line-height: 1.7;
  color: var(--eb-text-color-regular);
  white-space: pre-wrap;
  word-break: break-word;
}

.eb-chat-terminal__caret {
  display: inline-block;
  width: 7px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: currentColor;
  animation: eb-chat-terminal-blink 1s steps(2, start) infinite;
}

@keyframes eb-chat-terminal-blink {
  to {
    visibility: hidden;
  }
}

.eb-chat-terminal__omitted,
.eb-chat-terminal__empty {
  margin: 0 0 var(--eb-space-1);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-terminal__more {
  padding: 0 4px;
  border: none;
  background: transparent;
  color: var(--eb-color-primary);
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
}

/* ANSI 8/16 色：用令牌而非硬编码色值，暗色模式下仍可读 */
.eb-chat-terminal__out :deep(.is-bold) {
  font-weight: var(--eb-font-weight-semibold);
}

.eb-chat-terminal__out :deep(.is-fg-black) { color: var(--eb-text-color-primary); }
.eb-chat-terminal__out :deep(.is-fg-red) { color: var(--eb-color-danger); }
.eb-chat-terminal__out :deep(.is-fg-green) { color: var(--eb-color-success); }
.eb-chat-terminal__out :deep(.is-fg-yellow) { color: var(--eb-color-warning); }
.eb-chat-terminal__out :deep(.is-fg-blue) { color: var(--eb-color-primary); }
.eb-chat-terminal__out :deep(.is-fg-magenta) { color: var(--eb-color-ext-violet); }
.eb-chat-terminal__out :deep(.is-fg-cyan) { color: var(--eb-color-info); }
.eb-chat-terminal__out :deep(.is-fg-white) { color: var(--eb-text-color-regular); }
.eb-chat-terminal__out :deep(.is-fg-bright-black) { color: var(--eb-text-color-placeholder); }
.eb-chat-terminal__out :deep(.is-fg-bright-red) { color: var(--eb-color-danger); }
.eb-chat-terminal__out :deep(.is-fg-bright-green) { color: var(--eb-color-success); }
.eb-chat-terminal__out :deep(.is-fg-bright-yellow) { color: var(--eb-color-warning); }
.eb-chat-terminal__out :deep(.is-fg-bright-blue) { color: var(--eb-color-primary); }
.eb-chat-terminal__out :deep(.is-fg-bright-magenta) { color: var(--eb-color-ext-violet); }
.eb-chat-terminal__out :deep(.is-fg-bright-cyan) { color: var(--eb-color-info); }
.eb-chat-terminal__out :deep(.is-fg-bright-white) { color: var(--eb-text-color-primary); }

@media (prefers-reduced-motion: reduce) {
  .eb-chat-terminal__caret {
    animation: none;
  }
}
</style>
