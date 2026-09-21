<template>
  <div
    class="eb-chat-markdown"
    :class="{ 'is-streaming': streaming }"
    v-html="out"
    @click="handleClick"
    @keydown="handleKeydown"
  />
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from "vue";
import { renderChatMarkdown, getChatMarkdownConfig } from "./chatMarkdown";
import { copyToClipboard } from "./utils";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  content: { type: String, required: false, default: "" },
  /** 流式中：末尾补光标，且重解析按帧合并 */
  streaming: { type: Boolean, required: false, default: false }
});
// 拖尾样式在 styles/base.css（.eb-chat-shimmer），纯文本模式共用同一条规则
const SHIMMER_TAIL = 16;
// 可承载拖尾文字的块级收尾标签
const TRAILING_BLOCK_RE = /<\/(?:p|li|h[1-6]|blockquote|td|th|pre)>/g;
const out = ref("");
let frame = 0;
/**
 * 把最后一个文字块末尾若干字套上拖尾。
 * 倒着收字：别人的闭合标签（`</em>`）跳过继续收，撞到本元素的开标签
 * （`<p>` / `<em>` / `<br>`）就停——否则文字不足 n 个时会越过边界把整段包进去。
 */
function wrapTail(html, endIdx, n) {
  let i = endIdx;
  let taken = 0;
  while (i > 0 && taken < n) {
    const ch = html[i - 1];
    if (ch === ">") {
      const open = html.lastIndexOf("<", i - 1);
      if (open < 0) return null;
      if (html[open + 1] !== "/") break;
      i = open;
      continue;
    }
    if (ch === "<") break;
    i -= 1;
    taken += 1;
  }
  let cut = i;
  // 实体（&amp;）不能从中间切开
  const amp = html.lastIndexOf("&", cut - 1);
  const semi = amp >= 0 ? html.indexOf(";", amp) : -1;
  if (amp >= 0 && semi !== -1 && semi < cut) cut = amp;
  // 代理对（emoji）不能切开
  const prev = html.charCodeAt(cut - 1);
  if (prev >= 0xd800 && prev <= 0xdbff) cut += 1;
  if (cut >= endIdx) return null;
  return `${html.slice(0, cut)}<span class="eb-chat-shimmer">${html.slice(cut, endIdx)}</span>${html.slice(endIdx)}`;
}
function render() {
  const raw = renderChatMarkdown(props.content || "");
  if (!props.streaming) return raw;
  let last = null;
  for (const m of raw.matchAll(TRAILING_BLOCK_RE)) last = m;
  // 以代码块/表格之外的结构收尾时没有可套的文字块，就不显示拖尾
  return last ? wrapTail(raw, last.index, SHIMMER_TAIL) || raw : raw;
}
function dropFrame() {
  if (!frame) return;
  cancelAnimationFrame(frame);
  frame = 0;
}
function schedule() {
  // 非流式（历史消息、思考块收起）必须同步出结果，否则闪一下空
  if (!props.streaming) {
    dropFrame();
    out.value = render();
    return;
  }
  // 流式回写每个 token 都会进来；逐 token 整篇重解析的代价随文本长度平方增长，这里合并到帧
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    out.value = render();
  });
}
watch(() => [props.content, props.streaming], schedule, { immediate: true });
onBeforeUnmount(dropFrame);
const emit = defineEmits(["citation-click"]);
function emitCitation(el) {
  const id = el?.dataset?.refId;
  if (id === undefined) return false;
  emit("citation-click", id);
  return true;
}
/**
 * 把 mermaid 代码块换成宿主渲染的图。
 * 这里直接改 v-html 出来的 DOM——流式期间重渲染会覆盖掉，所以按钮只在
 * 已经渲染完成的块上有意义；失败时把按钮恢复并改文案，不静默。
 */
async function renderDiagram(btn) {
  const block = btn.closest(".eb-chat-code");
  const code = block?.querySelector("code");
  const renderer = getChatMarkdownConfig().mermaid;
  if (!code || !renderer) return;
  btn.disabled = true;
  try {
    const svg = await renderer(code.textContent ?? "");
    const host = document.createElement("div");
    host.className = "eb-chat-mermaid";
    host.innerHTML = typeof svg === "string" ? svg : "";
    block.replaceWith(host);
  } catch {
    btn.disabled = false;
    btn.textContent = labels.markdown.diagramFailed;
  }
}

function handleKeydown(e) {
  // 上标是 role=button 的 sup，键盘要能触发
  if (e.key !== "Enter" && e.key !== " ") return;
  if (emitCitation(e.target?.closest?.(".eb-chat-citation"))) e.preventDefault();
}
function handleClick(e) {
  if (emitCitation(e.target?.closest?.(".eb-chat-citation"))) return;
  const mermaidBtn = e.target?.closest?.(".eb-chat-mermaid__render");
  if (mermaidBtn) {
    renderDiagram(mermaidBtn);
    return;
  }
  const btn = e.target?.closest?.(".eb-chat-code__copy");
  if (!btn) return;
  // 复制文本从渲染后的 <code> 读，避免把原文塞进 data-* 撑大 HTML
  const code = btn.closest(".eb-chat-code")?.querySelector("code");
  if (!code) return;
  copyToClipboard(code.textContent ?? "").then(() => {
    const label = btn.querySelector(".eb-chat-code__copy-text");
    if (!label || label.dataset.copied === "1") return;
    label.dataset.copied = "1";
    const prev = label.textContent;
    label.textContent = labels.markdown.copied;
    setTimeout(() => {
      label.textContent = prev;
      delete label.dataset.copied;
    }, 2000);
  }).catch(() => {});
}

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

/* ── 代码块：工具条（语言标签 + 复制）+ 正文 ── */
.eb-chat-markdown :deep(.eb-chat-code) {
  margin: 8px 0;
  border-radius: var(--eb-radius-md);
  overflow: hidden;
  border: 1px solid var(--eb-border-color-lighter);
  background: var(--eb-fill-color-light);
}

.eb-chat-markdown :deep(.eb-chat-code__bar) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--eb-space-2);
  padding: 4px 8px 4px 12px;
  background: var(--eb-fill-color);
  border-bottom: 1px solid var(--eb-border-color-lighter);
}

.eb-chat-markdown :deep(.eb-chat-code__lang) {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-secondary);
  text-transform: lowercase;
  letter-spacing: 0.2px;
}

.eb-chat-markdown :deep(.eb-chat-code__copy) {
  display: inline-flex;
  align-items: center;
  border: none;
  padding: 2px 8px;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-xs);
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s var(--eb-ease-out), color 0.15s var(--eb-ease-out);
}

.eb-chat-markdown :deep(.eb-chat-code__copy:hover) {
  background: var(--eb-bg-color-overlay);
  color: var(--eb-text-color-primary);
}

.eb-chat-markdown :deep(.eb-chat-code__copy:focus-visible) {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
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

/* 带工具条的代码块：卡片外壳交给 .eb-chat-code，pre 只留正文 */
.eb-chat-markdown :deep(.eb-chat-code pre) {
  background: transparent;
  border-radius: 0;
  padding: 12px 16px;
  margin: 0;
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

/* ── 数学公式（宿主注入渲染器才出现）── */
.eb-chat-markdown :deep(.eb-chat-math--inline) {
  padding: 0 2px;
}

.eb-chat-markdown :deep(.eb-chat-math--block) {
  margin: var(--eb-space-2) 0;
  padding: var(--eb-space-2) 0;
  overflow-x: auto;
  text-align: center;
}

/* ── Mermaid 渲染结果 ── */
.eb-chat-markdown :deep(.eb-chat-mermaid) {
  margin: var(--eb-space-2) 0;
  padding: var(--eb-space-3);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  background: var(--eb-bg-color-overlay);
  overflow-x: auto;
  text-align: center;
}

.eb-chat-markdown :deep(.eb-chat-mermaid svg) {
  max-width: 100%;
  height: auto;
}

.eb-chat-markdown :deep(.eb-chat-mermaid__render) {
  padding: 2px 8px;
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-xs);
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s var(--eb-ease-out), color 0.15s var(--eb-ease-out);
}

.eb-chat-markdown :deep(.eb-chat-mermaid__render:hover:not(:disabled)) {
  background: var(--eb-bg-color-overlay);
  color: var(--eb-text-color-primary);
}

.eb-chat-markdown :deep(.eb-chat-mermaid__render:disabled) {
  cursor: not-allowed;
  opacity: 0.6;
}

.eb-chat-markdown :deep(.eb-chat-mermaid__render:focus-visible) {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
}

/* ── 脚注尾注列表 ── */
.eb-chat-markdown :deep(.eb-chat-footnotes) {
  margin: var(--eb-space-3) 0 0;
  padding: var(--eb-space-2) 0 0 var(--eb-space-4);
  border-top: 1px solid var(--eb-border-color-lighter);
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
}

.eb-chat-markdown :deep(.eb-chat-footnotes > li) {
  margin: 2px 0;
  padding-left: 0;
  line-height: 1.6;
  list-style: decimal;
}

/* 尾注条目不该带正文那种圆点/自定义序号 */
.eb-chat-markdown :deep(.eb-chat-footnotes > li::before) {
  content: none;
}

/* ── 行内引用上标（source: 协议）── */
.eb-chat-markdown :deep(.eb-chat-citation) {
  display: inline-block;
  min-width: 15px;
  padding: 0 4px;
  margin: 0 2px;
  border-radius: 8px;
  background: var(--eb-fill-color);
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-xs);
  font-weight: var(--eb-font-weight-medium);
  line-height: 15px;
  text-align: center;
  vertical-align: baseline;
  cursor: pointer;
  user-select: none;
  transition: background-color var(--eb-duration-fast) var(--eb-ease-out), color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-markdown :deep(.eb-chat-citation:hover),
.eb-chat-markdown :deep(.eb-chat-citation:focus-visible) {
  background: var(--eb-color-primary);
  color: #fff;
}

.eb-chat-markdown :deep(.eb-chat-citation:focus-visible) {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
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
