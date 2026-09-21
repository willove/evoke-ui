export { matchesAccept, validateAttachment, formatBytes, filesFromDataTransfer } from "../../utils/files";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function simpleMarkdown(text) {
  const codeBlocks = [];
  let html = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) => {
    const idx = codeBlocks.length;
    const escapedCode = escapeHtml(code.replace(/\n$/, ""));
    codeBlocks.push(`<pre><code>${escapedCode}</code></pre>`);
    return `@@CODEBLOCK_${idx}@@`;
  });
  html = escapeHtml(html);
  const lines = html.split("\n");
  const result = [];
  let listType = null;
  let paragraphs = [];
  function flushParagraphs() {
    if (paragraphs.length > 0) {
      result.push(`<p>${paragraphs.join("<br>")}</p>`);
      paragraphs = [];
    }
  }
  function flushList() {
    if (listType) {
      result.push(`</${listType}>`);
      listType = null;
    }
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^### /.test(trimmed)) {
      flushParagraphs();
      flushList();
      result.push(`<h3>${trimmed.slice(4)}</h3>`);
    } else if (/^## /.test(trimmed)) {
      flushParagraphs();
      flushList();
      result.push(`<h2>${trimmed.slice(3)}</h2>`);
    } else if (/^# /.test(trimmed)) {
      flushParagraphs();
      flushList();
      result.push(`<h1>${trimmed.slice(2)}</h1>`);
    } else if (/^- /.test(trimmed)) {
      flushParagraphs();
      if (listType !== "ul") {
        flushList();
        result.push("<ul>");
        listType = "ul";
      }
      result.push(`<li>${trimmed.slice(2)}</li>`);
    } else if (/^\d+\. /.test(trimmed)) {
      flushParagraphs();
      if (listType !== "ol") {
        flushList();
        result.push("<ol>");
        listType = "ol";
      }
      result.push(`<li>${trimmed.replace(/^\d+\. /, "")}</li>`);
    } else if (/^&gt; /.test(trimmed)) {
      flushParagraphs();
      flushList();
      result.push(`<blockquote><p>${trimmed.slice(5)}</p></blockquote>`);
    } else if (/^---+$/.test(trimmed)) {
      flushParagraphs();
      flushList();
      result.push("<hr>");
    } else if (trimmed === "") {
      flushParagraphs();
      flushList();
    } else if (/^@@CODEBLOCK_\d+@@$/.test(trimmed)) {
      flushParagraphs();
      flushList();
      result.push(trimmed);
    } else {
      flushList();
      paragraphs.push(trimmed);
    }
  }
  flushParagraphs();
  flushList();
  html = result.join("\n");
  const inlineCodes = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code>${code}</code>`);
    return `@@INLINECODE_${idx}@@`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/@@INLINECODE_(\d+)@@/g, (_, idx) => inlineCodes[parseInt(idx)]);
  html = html.replace(/@@CODEBLOCK_(\d+)@@/g, (_, idx) => codeBlocks[parseInt(idx)]);
  return html;
}
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}
export {
  copyToClipboard,
  escapeHtml,
  formatFileSize,
  generateId,
  simpleMarkdown
};
