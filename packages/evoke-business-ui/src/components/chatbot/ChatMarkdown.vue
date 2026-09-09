<template>
  <div class="ev-chat-markdown" v-html="renderedContent" />
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

.ev-chat-markdown {
  font-size: var(--ev-font-size-base);
  line-height: 1.7;
  color: var(--ev-text-color-regular);
  word-break: break-word;
}

.ev-chat-markdown > :first-child {
  margin-top: 0;
}

.ev-chat-markdown > :last-child {
  margin-bottom: 0;
}

.ev-chat-markdown :deep(p) {
  margin: 4px 0;
}

.ev-chat-markdown :deep(pre) {
  background: var(--ev-fill-color-light);
  border-radius: var(--ev-radius-md);
  padding: 12px 16px;
  margin: 8px 0;
  overflow-x: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--ev-font-size-sm);
  line-height: 1.6;
}

.ev-chat-markdown :deep(code) {
  background: var(--ev-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
}

.ev-chat-markdown :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
}

.ev-chat-markdown :deep(h1),
.ev-chat-markdown :deep(h2),
.ev-chat-markdown :deep(h3),
.ev-chat-markdown :deep(h4),
.ev-chat-markdown :deep(h5),
.ev-chat-markdown :deep(h6) {
  margin: 16px 0 8px;
  font-weight: var(--ev-font-weight-semibold);
  color: var(--ev-text-color-primary);
  line-height: 1.4;
}

.ev-chat-markdown :deep(h1) {
  font-size: var(--ev-font-size-lg);
}

.ev-chat-markdown :deep(h2) {
  font-size: var(--ev-font-size-md);
}

.ev-chat-markdown :deep(h3) {
  font-size: var(--ev-font-size-base);
}

.ev-chat-markdown :deep(h4) {
  font-size: var(--ev-font-size-base);
}

.ev-chat-markdown :deep(h5),
.ev-chat-markdown :deep(h6) {
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-secondary);
}

.ev-chat-markdown :deep(a) {
  color: var(--ev-color-primary);
  text-decoration: none;
}

.ev-chat-markdown :deep(a:hover) {
  text-decoration: underline;
}

.ev-chat-markdown :deep(ul),
.ev-chat-markdown :deep(ol) {
  margin: 4px 0;
  padding-left: 0;
}

.ev-chat-markdown :deep(ul) {
  list-style: none;
}

.ev-chat-markdown :deep(ol) {
  list-style: none;
  counter-reset: ev-chat-ol;
}

.ev-chat-markdown :deep(li) {
  position: relative;
  margin: 2px 0;
  padding-left: 22px;
  line-height: 1.7;
}

.ev-chat-markdown :deep(ul > li::before) {
  content: '';
  position: absolute;
  left: 6px;
  top: 10px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ev-text-color-regular);
}

.ev-chat-markdown :deep(ol > li) {
  counter-increment: ev-chat-ol;
}

.ev-chat-markdown :deep(ol > li::before) {
  content: counter(ev-chat-ol) '.';
  position: absolute;
  left: 0;
  top: 0;
  width: 18px;
  text-align: right;
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.ev-chat-markdown :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 12px;
  border-left: 3px solid var(--ev-color-primary-light-5);
  background: var(--ev-fill-color-lighter);
  border-radius: 0 var(--ev-radius-md) var(--ev-radius-md) 0;
  color: var(--ev-text-color-secondary);
}

.ev-chat-markdown :deep(blockquote > p) {
  margin: 0;
}

.ev-chat-markdown :deep(strong) {
  font-weight: var(--ev-font-weight-semibold);
  color: var(--ev-text-color-primary);
}

.ev-chat-markdown :deep(em) {
  font-style: italic;
}

.ev-chat-markdown :deep(del) {
  text-decoration: line-through;
  color: var(--ev-text-color-secondary);
}

.ev-chat-markdown :deep(hr) {
  border: none;
  border-top: 1px solid var(--ev-border-color-lighter);
  margin: 12px 0;
}

/* ── GFM 表格 ── */
.ev-chat-markdown :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: var(--ev-font-size-sm);
  border-radius: var(--ev-radius-md);
  overflow: hidden;
  border: 1px solid var(--ev-border-color-lighter);
}

.ev-chat-markdown :deep(th),
.ev-chat-markdown :deep(td) {
  padding: 6px 12px;
  border: 1px solid var(--ev-border-color-lighter);
  text-align: left;
}

.ev-chat-markdown :deep(th) {
  background: var(--ev-fill-color-light);
  font-weight: var(--ev-font-weight-semibold);
  color: var(--ev-text-color-primary);
}

.ev-chat-markdown :deep(tr:nth-child(2n) td) {
  background: var(--ev-fill-color-lighter);
}

/* ── 任务列表 ── */
.ev-chat-markdown :deep(li:has(> input[type="checkbox"])) {
  list-style: none;
  padding-left: 4px;
}

.ev-chat-markdown :deep(input[type="checkbox"]) {
  margin-right: 6px;
  vertical-align: middle;
}

/* ── 图片 ── */
.ev-chat-markdown :deep(img) {
  max-width: 100%;
  border-radius: var(--ev-radius-md);
  margin: 8px 0;
}

/* ── 引用芯片（entity: concept: product: doc: ... 等自定义协议链接） ── */
.ev-chat-markdown :deep(.ev-ref-chip) {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  margin: 0 2px;
  border-radius: 10px;
  font-size: var(--ev-font-size-sm, 13px);
  font-weight: 500;
  line-height: 1.6;
  cursor: pointer;
  transition: all 0.15s var(--ev-ease-out, ease);
  user-select: none;
  vertical-align: baseline;
}

.ev-chat-markdown :deep(.ev-ref-chip::before) {
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
  color: var(--ev-bg-color, #fff);
  line-height: 1.4;
}

.ev-chat-markdown :deep(.ev-ref-chip:hover) {
  transform: translateY(-1px);
  filter: brightness(0.95);
}

.ev-chat-markdown :deep(.ev-ref-chip:active) {
  transform: translateY(0);
}

/* 主题色：primary */
.ev-chat-markdown :deep(.ev-ref-chip--primary) {
  color: var(--ev-color-primary);
  background: var(--ev-color-primary-light-9);
  border: 1px solid var(--ev-color-primary-light-7);
}
.ev-chat-markdown :deep(.ev-ref-chip--primary:hover) {
  background: var(--ev-color-primary-light-8);
  border-color: var(--ev-color-primary-light-5);
}

/* 主题色：success */
.ev-chat-markdown :deep(.ev-ref-chip--success) {
  color: var(--ev-color-success);
  background: var(--ev-color-success-light-9);
  border: 1px solid var(--ev-color-success-light-7);
}
.ev-chat-markdown :deep(.ev-ref-chip--success:hover) {
  background: var(--ev-color-success-light-8);
  border-color: var(--ev-color-success-light-5);
}

/* 主题色：warning */
.ev-chat-markdown :deep(.ev-ref-chip--warning) {
  color: var(--ev-color-warning);
  background: var(--ev-color-warning-light-9);
  border: 1px solid var(--ev-color-warning-light-7);
}
.ev-chat-markdown :deep(.ev-ref-chip--warning:hover) {
  background: var(--ev-color-warning-light-8);
  border-color: var(--ev-color-warning-light-5);
}

/* 主题色：danger */
.ev-chat-markdown :deep(.ev-ref-chip--danger) {
  color: var(--ev-color-danger);
  background: var(--ev-color-danger-light-9);
  border: 1px solid var(--ev-color-danger-light-7);
}
.ev-chat-markdown :deep(.ev-ref-chip--danger:hover) {
  background: var(--ev-color-danger-light-8);
  border-color: var(--ev-color-danger-light-5);
}

/* 主题色：info */
.ev-chat-markdown :deep(.ev-ref-chip--info) {
  color: var(--ev-color-info);
  background: var(--ev-color-info-light-9);
  border: 1px solid var(--ev-color-info-light-7);
}
.ev-chat-markdown :deep(.ev-ref-chip--info:hover) {
  background: var(--ev-color-info-light-8);
  border-color: var(--ev-color-info-light-5);
}

/* 暗色模式适配 */
html.dark .ev-chat-markdown :deep(.ev-ref-chip) {
  border-color: transparent;
}
html.dark .ev-chat-markdown :deep(.ev-ref-chip--primary) {
  background: rgba(var(--ev-color-primary-rgb, 23, 93, 255), 0.15);
  border: 1px solid rgba(var(--ev-color-primary-rgb, 23, 93, 255), 0.3);
}
html.dark .ev-chat-markdown :deep(.ev-ref-chip--success) {
  background: rgba(var(--ev-color-success-rgb, 103, 194, 58), 0.15);
  border: 1px solid rgba(var(--ev-color-success-rgb, 103, 194, 58), 0.3);
}
html.dark .ev-chat-markdown :deep(.ev-ref-chip--warning) {
  background: rgba(var(--ev-color-warning-rgb, 230, 162, 60), 0.15);
  border: 1px solid rgba(var(--ev-color-warning-rgb, 230, 162, 60), 0.3);
}
html.dark .ev-chat-markdown :deep(.ev-ref-chip--danger) {
  background: rgba(var(--ev-color-danger-rgb, 245, 108, 108), 0.15);
  border: 1px solid rgba(var(--ev-color-danger-rgb, 245, 108, 108), 0.3);
}
html.dark .ev-chat-markdown :deep(.ev-ref-chip--info) {
  background: rgba(var(--ev-color-info-rgb, 144, 147, 153), 0.15);
  border: 1px solid rgba(var(--ev-color-info-rgb, 144, 147, 153), 0.3);
}
</style>
