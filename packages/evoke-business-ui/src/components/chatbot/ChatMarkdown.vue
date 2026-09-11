<template>
  <div class="eb-chat-markdown" v-html="renderedContent" />
</template>

<script setup>
import { computed } from "vue";
import { renderChatMarkdown } from "./chatMarkdown";
const props = defineProps({
  content: { type: String, required: false, default: "" }
});
const renderedContent = computed(() => renderChatMarkdown(props.content || ""));

</script>

<style scoped>

.eb-chat-markdown {
  font-size: var(--eb-font-size-base);
  line-height: 1.7;
  color: var(--eb-text-color-regular);
  word-break: break-word;
}

.eb-chat-markdown > :first-child {
  margin-top: 0;
}

.eb-chat-markdown > :last-child {
  margin-bottom: 0;
}

.eb-chat-markdown :deep(p) {
  margin: 4px 0;
}

.eb-chat-markdown :deep(pre) {
  background: var(--eb-fill-color-light);
  border-radius: var(--eb-radius-md);
  padding: 12px 16px;
  margin: 8px 0;
  overflow-x: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-sm);
  line-height: 1.6;
}

.eb-chat-markdown :deep(code) {
  background: var(--eb-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
}

.eb-chat-markdown :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
}

.eb-chat-markdown :deep(h1),
.eb-chat-markdown :deep(h2),
.eb-chat-markdown :deep(h3),
.eb-chat-markdown :deep(h4),
.eb-chat-markdown :deep(h5),
.eb-chat-markdown :deep(h6) {
  margin: 16px 0 8px;
  font-weight: var(--eb-font-weight-semibold);
  color: var(--eb-text-color-primary);
  line-height: 1.4;
}

.eb-chat-markdown :deep(h1) {
  font-size: var(--eb-font-size-lg);
}

.eb-chat-markdown :deep(h2) {
  font-size: var(--eb-font-size-md);
}

.eb-chat-markdown :deep(h3) {
  font-size: var(--eb-font-size-base);
}

.eb-chat-markdown :deep(h4) {
  font-size: var(--eb-font-size-base);
}

.eb-chat-markdown :deep(h5),
.eb-chat-markdown :deep(h6) {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
}

.eb-chat-markdown :deep(a) {
  color: var(--eb-color-primary);
  text-decoration: none;
}

.eb-chat-markdown :deep(a:hover) {
  text-decoration: underline;
}

.eb-chat-markdown :deep(ul),
.eb-chat-markdown :deep(ol) {
  margin: 4px 0;
  padding-left: 0;
}

.eb-chat-markdown :deep(ul) {
  list-style: none;
}

.eb-chat-markdown :deep(ol) {
  list-style: none;
  counter-reset: eb-chat-ol;
}

.eb-chat-markdown :deep(li) {
  position: relative;
  margin: 2px 0;
  padding-left: 22px;
  line-height: 1.7;
}

.eb-chat-markdown :deep(ul > li::before) {
  content: '';
  position: absolute;
  left: 6px;
  top: 10px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--eb-text-color-regular);
}

.eb-chat-markdown :deep(ol > li) {
  counter-increment: eb-chat-ol;
}

.eb-chat-markdown :deep(ol > li::before) {
  content: counter(eb-chat-ol) '.';
  position: absolute;
  left: 0;
  top: 0;
  width: 18px;
  text-align: right;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.eb-chat-markdown :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 12px;
  border-left: 3px solid var(--eb-color-primary-light-5);
  background: var(--eb-fill-color-lighter);
  border-radius: 0 var(--eb-radius-md) var(--eb-radius-md) 0;
  color: var(--eb-text-color-secondary);
}

.eb-chat-markdown :deep(blockquote > p) {
  margin: 0;
}

.eb-chat-markdown :deep(strong) {
  font-weight: var(--eb-font-weight-semibold);
  color: var(--eb-text-color-primary);
}

.eb-chat-markdown :deep(em) {
  font-style: italic;
}

.eb-chat-markdown :deep(del) {
  text-decoration: line-through;
  color: var(--eb-text-color-secondary);
}

.eb-chat-markdown :deep(hr) {
  border: none;
  border-top: 1px solid var(--eb-border-color-lighter);
  margin: 12px 0;
}

/* ── GFM 表格 ── */
.eb-chat-markdown :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: var(--eb-font-size-sm);
  border-radius: var(--eb-radius-md);
  overflow: hidden;
  border: 1px solid var(--eb-border-color-lighter);
}

.eb-chat-markdown :deep(th),
.eb-chat-markdown :deep(td) {
  padding: 6px 12px;
  border: 1px solid var(--eb-border-color-lighter);
  text-align: left;
}

.eb-chat-markdown :deep(th) {
  background: var(--eb-fill-color-light);
  font-weight: var(--eb-font-weight-semibold);
  color: var(--eb-text-color-primary);
}

.eb-chat-markdown :deep(tr:nth-child(2n) td) {
  background: var(--eb-fill-color-lighter);
}

/* ── 任务列表 ── */
.eb-chat-markdown :deep(li:has(> input[type="checkbox"])) {
  list-style: none;
  padding-left: 4px;
}

.eb-chat-markdown :deep(input[type="checkbox"]) {
  margin-right: 6px;
  vertical-align: middle;
}

/* ── 图片 ── */
.eb-chat-markdown :deep(img) {
  max-width: 100%;
  border-radius: var(--eb-radius-md);
  margin: 8px 0;
}

/* ── 引用芯片（entity: concept: product: doc: ... 等自定义协议链接） ── */
.eb-chat-markdown :deep(.eb-ref-chip) {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  margin: 0 2px;
  border-radius: 10px;
  font-size: var(--eb-font-size-sm, 13px);
  font-weight: 500;
  line-height: 1.6;
  cursor: pointer;
  transition: all 0.15s var(--eb-ease-out, ease);
  user-select: none;
  vertical-align: baseline;
}

.eb-chat-markdown :deep(.eb-ref-chip::before) {
  content: attr(data-protocol);
  margin-right: 4px;
  padding: 0 4px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  opacity: 0.7;
  background: currentColor;
  color: var(--eb-bg-color, #fff);
  line-height: 1.4;
}

.eb-chat-markdown :deep(.eb-ref-chip:hover) {
  transform: translateY(-1px);
  filter: brightness(0.95);
}

.eb-chat-markdown :deep(.eb-ref-chip:active) {
  transform: translateY(0);
}

/* 主题色：primary */
.eb-chat-markdown :deep(.eb-ref-chip--primary) {
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
  border: 1px solid var(--eb-color-primary-light-7);
}
.eb-chat-markdown :deep(.eb-ref-chip--primary:hover) {
  background: var(--eb-color-primary-light-8);
  border-color: var(--eb-color-primary-light-5);
}

/* 主题色：success */
.eb-chat-markdown :deep(.eb-ref-chip--success) {
  color: var(--eb-color-success);
  background: var(--eb-color-success-light-9);
  border: 1px solid var(--eb-color-success-light-7);
}
.eb-chat-markdown :deep(.eb-ref-chip--success:hover) {
  background: var(--eb-color-success-light-8);
  border-color: var(--eb-color-success-light-5);
}

/* 主题色：warning */
.eb-chat-markdown :deep(.eb-ref-chip--warning) {
  color: var(--eb-color-warning);
  background: var(--eb-color-warning-light-9);
  border: 1px solid var(--eb-color-warning-light-7);
}
.eb-chat-markdown :deep(.eb-ref-chip--warning:hover) {
  background: var(--eb-color-warning-light-8);
  border-color: var(--eb-color-warning-light-5);
}

/* 主题色：danger */
.eb-chat-markdown :deep(.eb-ref-chip--danger) {
  color: var(--eb-color-danger);
  background: var(--eb-color-danger-light-9);
  border: 1px solid var(--eb-color-danger-light-7);
}
.eb-chat-markdown :deep(.eb-ref-chip--danger:hover) {
  background: var(--eb-color-danger-light-8);
  border-color: var(--eb-color-danger-light-5);
}

/* 主题色：info */
.eb-chat-markdown :deep(.eb-ref-chip--info) {
  color: var(--eb-color-info);
  background: var(--eb-color-info-light-9);
  border: 1px solid var(--eb-color-info-light-7);
}
.eb-chat-markdown :deep(.eb-ref-chip--info:hover) {
  background: var(--eb-color-info-light-8);
  border-color: var(--eb-color-info-light-5);
}

/* 暗色模式适配 */
html.dark .eb-chat-markdown :deep(.eb-ref-chip) {
  border-color: transparent;
}
html.dark .eb-chat-markdown :deep(.eb-ref-chip--primary) {
  background: rgba(var(--eb-color-primary-rgb, 23, 93, 255), 0.15);
  border: 1px solid rgba(var(--eb-color-primary-rgb, 23, 93, 255), 0.3);
}
html.dark .eb-chat-markdown :deep(.eb-ref-chip--success) {
  background: rgba(var(--eb-color-success-rgb, 103, 194, 58), 0.15);
  border: 1px solid rgba(var(--eb-color-success-rgb, 103, 194, 58), 0.3);
}
html.dark .eb-chat-markdown :deep(.eb-ref-chip--warning) {
  background: rgba(var(--eb-color-warning-rgb, 230, 162, 60), 0.15);
  border: 1px solid rgba(var(--eb-color-warning-rgb, 230, 162, 60), 0.3);
}
html.dark .eb-chat-markdown :deep(.eb-ref-chip--danger) {
  background: rgba(var(--eb-color-danger-rgb, 245, 108, 108), 0.15);
  border: 1px solid rgba(var(--eb-color-danger-rgb, 245, 108, 108), 0.3);
}
html.dark .eb-chat-markdown :deep(.eb-ref-chip--info) {
  background: rgba(var(--eb-color-info-rgb, 144, 147, 153), 0.15);
  border: 1px solid rgba(var(--eb-color-info-rgb, 144, 147, 153), 0.3);
}
</style>
