<template>
  <div
    class="eb-chat-tool-call"
    :class="[`is-${toolCall?.status || 'pending'}`]"
  >
    <button
      type="button"
      class="eb-chat-tool-call__header"
      :aria-expanded="String(open)"
      :aria-controls="panelId"
      :disabled="!expandable"
      @click="toggle"
    >
      <span class="eb-chat-tool-call__marker" :class="{ 'is-spinning': running }">
        <eb-icon v-if="failed" name="warning-filled" :size="12" />
        <eb-icon v-else-if="succeeded" name="check" :size="12" />
        <span v-else class="eb-chat-tool-call__dot" />
      </span>
      <span class="eb-chat-tool-call__name">{{ toolCall?.label || toolCall?.name || labels.tool.fallback }}</span>
      <span class="eb-chat-tool-call__status">{{ statusText }}</span>
      <span v-if="succeeded && toolCall?.duration" class="eb-chat-tool-call__duration">{{ formatDuration(toolCall.duration) }}</span>
      <eb-icon
        v-if="expandable"
        class="eb-chat-tool-call__chevron"
        :name="open ? 'arrow-down' : 'arrow-right'"
        :size="12"
      />
    </button>

    <div v-if="running" class="eb-chat-tool-call__stream">
      <span class="eb-chat-shimmer">{{ labels.tool.running }}</span>
    </div>

    <div v-show="open && expandable" :id="panelId" class="eb-chat-tool-call__body">
      <section v-if="hasArgs" class="eb-chat-tool-call__section">
        <p class="eb-chat-tool-call__section-title">{{ labels.tool.args }}</p>
        <slot name="args" :tool-call="toolCall">
          <pre class="eb-chat-tool-call__pre">{{ stringify(toolCall.args) }}</pre>
        </slot>
      </section>
      <section v-if="failed" class="eb-chat-tool-call__section">
        <p class="eb-chat-tool-call__section-title">{{ labels.tool.error }}</p>
        <pre class="eb-chat-tool-call__pre eb-chat-tool-call__pre--error">{{ toolCall.error || labels.tool.error }}</pre>
      </section>
      <section v-else-if="hasResult" class="eb-chat-tool-call__section">
        <p class="eb-chat-tool-call__section-title">{{ labels.tool.result }}</p>
        <slot name="result" :tool-call="toolCall">
          <pre class="eb-chat-tool-call__pre">{{ stringify(toolCall.result) }}</pre>
        </slot>
      </section>
      <div v-if="retryable && failed" class="eb-chat-tool-call__actions">
        <button type="button" class="eb-chat-tool-call__retry" @click="emit('retry', toolCall)">
          {{ labels.tool.retry }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import EbIcon from "@wil-works/evoke-business-ui/icon"
import { ref, computed } from "vue";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** { id, name, label?, args?, result?, status, duration?, error? } */
  toolCall: { type: Object, required: false, default: () => ({}) },
  /** 未显式指定时，有参数或结果才允许展开 */
  expanded: { type: Boolean, required: false, default: undefined },
  /** 失败态是否给重试钮 */
  retryable: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["toggle", "retry"]);
const open = ref(props.expanded ?? false);
const panelId = `eb-chat-tool-call-${Math.random().toString(36).slice(2, 9)}`;
const running = computed(() => props.toolCall?.status === "running");
const succeeded = computed(() => props.toolCall?.status === "done");
const failed = computed(() => props.toolCall?.status === "error");
const hasArgs = computed(() => props.toolCall?.args !== undefined && props.toolCall?.args !== null);
const hasResult = computed(() => props.toolCall?.result !== undefined && props.toolCall?.result !== null);
const expandable = computed(() => hasArgs.value || hasResult.value || failed.value);
const statusText = computed(() => {
  const s = props.toolCall?.status || "pending";
  return labels.tool[s] || s;
});
function stringify(value) {
  if (typeof value === "string") return value;
  try {
    // 宿主 transport 塞进来的参数常带循环引用，直接 stringify 会抛
    const seen = new WeakSet();
    return JSON.stringify(value, (_key, val) => {
      if (val && typeof val === "object") {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    }, 2);
  } catch {
    return String(value);
  }
}
function formatDuration(ms) {
  if (ms < 1e3) return `${ms}ms`;
  return `${(ms / 1e3).toFixed(1)}s`;
}
function toggle() {
  if (!expandable.value) return;
  open.value = !open.value;
  emit("toggle", props.toolCall, open.value);
}

</script>

<style scoped>

.eb-chat-tool-call {
  margin-top: var(--eb-space-2);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-lighter);
  overflow: hidden;
}

.eb-chat-tool-call__header {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  width: 100%;
  padding: var(--eb-space-2) var(--eb-space-3);
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--eb-font-size-sm);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-tool-call__header:hover:not(:disabled) {
  background: var(--eb-fill-color);
}

.eb-chat-tool-call__header:disabled {
  cursor: default;
}

.eb-chat-tool-call__header:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
}

.eb-chat-tool-call__marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--eb-text-color-secondary);
}

.eb-chat-tool-call.is-done .eb-chat-tool-call__marker {
  color: var(--eb-color-success);
}

.eb-chat-tool-call.is-error .eb-chat-tool-call__marker {
  color: var(--eb-color-danger);
}

.eb-chat-tool-call__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--eb-color-primary);
  animation: eb-chat-tool-pulse 1.4s ease-in-out infinite;
}

@keyframes eb-chat-tool-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.eb-chat-tool-call__marker.is-spinning .eb-chat-tool-call__dot {
  animation: eb-rotate 1s linear infinite;
  border-radius: 50%;
  box-shadow: inset 0 0 0 2px var(--eb-color-primary);
  background: transparent;
}

.eb-chat-tool-call__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--eb-text-color-primary);
  font-weight: var(--eb-font-weight-medium);
}

.eb-chat-tool-call__status {
  flex-shrink: 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-secondary);
}

.eb-chat-tool-call.is-error .eb-chat-tool-call__status {
  color: var(--eb-color-danger);
}

.eb-chat-tool-call__duration {
  flex-shrink: 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.eb-chat-tool-call__chevron {
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
}

.eb-chat-tool-call__stream {
  padding: 0 var(--eb-space-3) var(--eb-space-2);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-secondary);
}

.eb-chat-tool-call__body {
  padding: 0 var(--eb-space-3) var(--eb-space-3);
  border-top: 1px solid var(--eb-border-color-lighter);
}

.eb-chat-tool-call__section {
  margin-top: var(--eb-space-2);
}

.eb-chat-tool-call__section-title {
  margin: 0 0 var(--eb-space-1);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

/* 轻量 pre 承载 args/result；宿主可用 #args / #result 插槽换成 JsonViewer 等 */
.eb-chat-tool-call__pre {
  max-height: 220px;
  margin: 0;
  padding: var(--eb-space-2);
  border-radius: var(--eb-radius-sm);
  background: var(--eb-bg-color-overlay);
  border: 1px solid var(--eb-border-color-lighter);
  color: var(--eb-text-color-regular);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
  line-height: 1.6;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.eb-chat-tool-call__pre--error {
  border-color: var(--eb-color-danger-light-7);
  color: var(--eb-color-danger);
}

.eb-chat-tool-call__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--eb-space-2);
}

.eb-chat-tool-call__retry {
  display: inline-flex;
  align-items: center;
  gap: var(--eb-space-1);
  padding: 2px var(--eb-space-3);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  cursor: pointer;
}

.eb-chat-tool-call__retry:hover {
  border-color: var(--eb-color-primary-light-5);
  color: var(--eb-color-primary);
}

.eb-chat-tool-call__retry:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .eb-chat-tool-call__dot,
  .eb-chat-tool-call__marker.is-spinning .eb-chat-tool-call__dot {
    animation: none;
  }
}
</style>
