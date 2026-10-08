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
        <eb-icon v-else-if="cancelled" name="stop" :size="12" />
        <eb-icon v-else-if="succeeded" name="check" :size="12" />
        <span v-else class="eb-chat-tool-call__dot" />
      </span>
      <span class="eb-chat-tool-call__name">{{ toolCall?.label || toolCall?.name || labels.tool.fallback }}</span>
      <span v-if="subCount" class="eb-chat-tool-call__subcount" :title="labels.tool.subCalls(subCount)">{{ subCount }}</span>
      <span v-if="errorHint" class="eb-chat-tool-call__hint">{{ errorHint }}</span>
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
          <pre ref="argsRef" class="eb-chat-tool-call__pre">{{ stringify(toolCall.args) }}<span v-if="argsStreaming" class="eb-chat-tool-call__caret" aria-hidden="true" /></pre>
        </slot>
      </section>
      <section v-if="failed" class="eb-chat-tool-call__section">
        <p class="eb-chat-tool-call__section-title">{{ labels.tool.error }}</p>
        <pre class="eb-chat-tool-call__pre eb-chat-tool-call__pre--error">{{ toolCall.error || labels.tool.error }}</pre>
      </section>
      <section v-else-if="hasResult" class="eb-chat-tool-call__section">
        <p class="eb-chat-tool-call__section-title">{{ labels.tool.result }}</p>
        <slot name="result" :tool-call="toolCall">
          <img
            v-if="resultKind === 'image' && imageSrc"
            class="eb-chat-tool-call__image"
            :src="imageSrc"
            :alt="imageAlt"
            loading="lazy"
            referrerpolicy="no-referrer"
          >
          <!-- URL 协议不在白名单：不留破图，退成文本（与正文图片同款纪律） -->
          <a
            v-else-if="resultKind === 'file' && fileName && fileHref"
            class="eb-chat-tool-call__file"
            :href="fileHref"
            target="_blank"
            rel="noopener noreferrer"
            :title="fileName"
          >
            <eb-icon :name="fileIcon" :size="14" />
            <span class="eb-chat-tool-call__file-name">{{ fileName }}</span>
            <span v-if="fileSize" class="eb-chat-tool-call__file-size">{{ fileSize }}</span>
          </a>
          <div v-else-if="resultKind === 'file' && fileName" class="eb-chat-tool-call__file" :title="fileName">
            <eb-icon :name="fileIcon" :size="14" />
            <span class="eb-chat-tool-call__file-name">{{ fileName }}</span>
            <span v-if="fileSize" class="eb-chat-tool-call__file-size">{{ fileSize }}</span>
          </div>
          <pre v-else ref="resultRef" class="eb-chat-tool-call__pre">{{ stringify(toolCall.result) }}<span v-if="streaming" class="eb-chat-tool-call__caret" aria-hidden="true" /></pre>
        </slot>
      </section>
      <!-- 子调用（并行派发 / PTC 子步）：同一种卡递归渲染，深度到顶就停 -->
      <section v-if="subCalls.length" class="eb-chat-tool-call__section">
        <p class="eb-chat-tool-call__section-title">{{ labels.tool.subCalls(subCalls.length) }}</p>
        <div class="eb-chat-tool-call__subcalls">
          <ChatToolCall
            v-for="child in subCalls"
            :key="child.id"
            :tool-call="child"
            :depth="depth + 1"
            :retryable="retryable"
            @retry="(call) => emit('retry', call)"
          />
        </div>
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
import { ref, computed, watch } from "vue";
import { fileIconFor } from "./fileIcons";
import { formatFileSize } from "./utils";
import { useChatLabels } from "./labels";

/** 子调用嵌套上限：挡住异常/自引用数据造成的无限递归（引擎侧同样设了 16 层） */
const MAX_TOOL_DEPTH = 16;

const labels = useChatLabels();
const props = defineProps({
  /** { id, name, label?, args?, result?, status, duration?, error?, streaming?, argsStreaming?, subCalls? } */
  toolCall: { type: Object, required: false, default: () => ({}) },
  /** 未显式指定时，有参数或结果才允许展开 */
  expanded: { type: Boolean, required: false, default: undefined },
  /** 失败态是否给重试钮 */
  retryable: { type: Boolean, required: false, default: true },
  /** 嵌套深度：由父级传入，达上限不再往下渲染 */
  depth: { type: Number, required: false, default: 0 }
});
const emit = defineEmits(["toggle", "retry"]);
const open = ref(props.expanded ?? false);
// 用户手动开合过就尊重用户：流式结束不再自动收起
let userToggled = false;
const resultRef = ref(null);
const argsRef = ref(null);
const panelId = `eb-chat-tool-call-${Math.random().toString(36).slice(2, 9)}`;
const running = computed(() => props.toolCall?.status === "running");
const streaming = computed(() => props.toolCall?.streaming === true);
// 入参流式与输出流式同款待遇：光标、自动展开、贴底
const argsStreaming = computed(() => props.toolCall?.argsStreaming === true);
const succeeded = computed(() => props.toolCall?.status === "done");
const failed = computed(() => props.toolCall?.status === "error");
const cancelled = computed(() => props.toolCall?.status === "cancelled");
/**
 * 失败时把错误首行提到折叠态：不展开也能看见为什么失败
 * （DSH 同款：错误态用结果首行替换折叠摘要）。
 */
const errorHint = computed(() => {
  if (!failed.value) return "";
  const text = String(props.toolCall?.error || "").trim();
  if (!text) return "";
  const firstLine = text.split("\n")[0].trim();
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine;
});
const hasArgs = computed(() => props.toolCall?.args !== undefined && props.toolCall?.args !== null);
const hasResult = computed(() => props.toolCall?.result !== undefined && props.toolCall?.result !== null);
// ── 非文本结果的默认渲染（resultType 元数据，引擎收尾时写入）──
// URL 白名单与正文图片同款：http/https/data 之外退回文本，不留点不动的破图/坏链
const SAFE_URL_SCHEMES = /* @__PURE__ */ new Set(["http", "https", "data"]);
function safeUrl(raw) {
  const href = String(raw || "");
  const colon = href.indexOf(":");
  const scheme = colon > 0 ? href.slice(0, colon).toLowerCase() : "";
  return SAFE_URL_SCHEMES.has(scheme) ? href : "";
}
const resultKind = computed(() => props.toolCall?.resultType || "");
const resultObj = computed(() => {
  const r = props.toolCall?.result;
  return r && typeof r === "object" ? r : null;
});
const imageSrc = computed(() => {
  if (resultKind.value !== "image") return "";
  const raw = typeof props.toolCall?.result === "string" ? props.toolCall.result : resultObj.value?.url;
  return safeUrl(raw);
});
const imageAlt = computed(() => String(resultObj.value?.alt || props.toolCall?.label || props.toolCall?.name || ""));
const fileName = computed(() => (resultKind.value === "file" ? String(resultObj.value?.name || "") : ""));
const fileHref = computed(() => (resultKind.value === "file" ? safeUrl(resultObj.value?.url) : ""));
const fileSize = computed(() => {
  const size = resultObj.value?.size;
  return typeof size === "number" && size > 0 ? formatFileSize(size) : "";
});
const fileIcon = computed(() => fileIconFor({ name: fileName.value }));
/** 子调用：深度到顶就不再往下渲染（数据里若递归自引用，也不会无限展开） */
const subCalls = computed(() => (props.depth < MAX_TOOL_DEPTH ? (props.toolCall?.subCalls || []) : []));
const subCount = computed(() => props.toolCall?.subCalls?.length || 0);
const expandable = computed(() => hasArgs.value || hasResult.value || failed.value || subCalls.value.length > 0);
// 与计划卡同一约定：流式输出期间自动展开（盯着跑），结束后回到用户可控的折叠态。
// immediate 是为了「挂载时就已在流式」的历史/重连场景也能展开。
// 入参与输出任一侧在流式都算「正在跑」，全部停了才回落。
watch([streaming, argsStreaming], ([out, args], [prevOut, prevArgs]) => {
  if (props.expanded !== undefined) return;
  const on = out || args;
  const wasOn = prevOut || prevArgs;
  if (on) open.value = true;
  else if (wasOn && !userToggled) open.value = false;
}, { immediate: true });
// 流式输出贴底：命令边跑边出，新内容不能被折在下面
watch(() => props.toolCall?.result, () => {
  if (!streaming.value) return;
  const el = resultRef.value;
  if (el) el.scrollTop = el.scrollHeight;
});
// 入参流式同样贴底：长 JSON 边收边看，最新的分片不能被折走
watch(() => props.toolCall?.args, () => {
  if (!argsStreaming.value) return;
  const el = argsRef.value;
  if (el) el.scrollTop = el.scrollHeight;
});
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
  userToggled = true;
  emit("toggle", props.toolCall, open.value);
}

</script>

<style scoped>

.eb-chat-tool-call {
  margin-top: var(--eb-space-2);
  /* 卡片类容器：真边框置 0，最浅一档发丝环写进 box-shadow（不占布局、不叠用边框） */
  border: 0;
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-lighter);
  box-shadow: 0 0 0 1px var(--eb-border-color-extra-light) inset;
  overflow: hidden;
}

.eb-chat-tool-call:hover {
  box-shadow: 0 0 0 1px var(--eb-border-color-lighter) inset;
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

.eb-chat-tool-call.is-cancelled .eb-chat-tool-call__marker,
.eb-chat-tool-call.is-cancelled .eb-chat-tool-call__status {
  color: var(--eb-text-color-placeholder);
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

/* 失败首行：折叠态就能看见失败原因，不抢标题的伸缩位 */
/* 子调用：收进一层缩进 + 左侧细轨，一眼看出从属关系 */
.eb-chat-tool-call__subcalls {
  display: flex;
  flex-direction: column;
  padding-left: var(--eb-space-3);
  border-left: 1px solid var(--eb-border-color-lighter);
}

/* 头部计数：折叠时也知道里面还挂了几个 */
.eb-chat-tool-call__subcount {
  flex-shrink: 0;
  min-width: 18px;
  padding: 0 5px;
  border-radius: var(--eb-radius-sm);
  background: var(--eb-fill-color);
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-xs);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.eb-chat-tool-call__hint {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-color-danger);
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
  border: 0;
  box-shadow: 0 0 0 1px var(--eb-border-color-extra-light) inset;
  color: var(--eb-text-color-regular);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
  line-height: 1.6;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 图片结果：限高不裁内容（object-fit 保比例，禁拉伸），宽度跟容器 */
.eb-chat-tool-call__image {
  display: block;
  max-width: 100%;
  max-height: 240px;
  border-radius: var(--eb-radius-sm);
  object-fit: contain;
}

/* 文件结果：一行紧凑卡（图标 + 名称 + 体积），与 pre 同款发丝环 */
.eb-chat-tool-call__file {
  display: inline-flex;
  align-items: center;
  gap: var(--eb-space-2);
  max-width: 100%;
  padding: var(--eb-space-1) var(--eb-space-2);
  border-radius: var(--eb-radius-sm);
  border: 0;
  box-shadow: 0 0 0 1px var(--eb-border-color-extra-light) inset;
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-xs);
  text-decoration: none;
}

a.eb-chat-tool-call__file:hover {
  box-shadow: 0 0 0 1px var(--eb-border-color-lighter) inset;
  color: var(--eb-text-color-primary);
}

.eb-chat-tool-call__file:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 2px;
}

.eb-chat-tool-call__file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eb-chat-tool-call__file-size {
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.eb-chat-tool-call__pre--error {
  border-color: var(--eb-color-danger-light-7);
  color: var(--eb-color-danger);
}

/* 流式结果光标：与 EbChatTerminal 的同款闪烁，夹在已流出的文本末尾 */
.eb-chat-tool-call__caret {
  display: inline-block;
  width: 7px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: currentColor;
  animation: eb-chat-tool-caret-blink 1s steps(2, start) infinite;
}

@keyframes eb-chat-tool-caret-blink {
  to {
    visibility: hidden;
  }
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
  border: 0;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  box-shadow: 0 0 0 1px var(--eb-border-color-lighter) inset;
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
  .eb-chat-tool-call__marker.is-spinning .eb-chat-tool-call__dot,
  .eb-chat-tool-call__caret {
    animation: none;
  }
}
</style>
