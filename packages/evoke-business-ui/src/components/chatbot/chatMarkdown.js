import { Marked, marked } from "marked";
import hljs from "highlight.js";
import { chatLabels as labels } from "./labels";
function createDefaultConfig() {
  return {
    standardProtocols: /* @__PURE__ */ new Set([
      "http",
      "https",
      "mailto",
      "ftp",
      "tel",
      "sms",
      "callto",
      "skype"
      // data: 不进默认白名单——聊天内容不可信，data: 链接降级为 ref-chip；确有需要的宿主经 standardProtocols.add 加回
    ]),
    protocolThemes: {
      entity: "primary",
      concept: "success",
      product: "warning",
      doc: "info",
      document: "info",
      action: "danger",
      knowledge: "info",
      user: "success",
      task: "warning"
    }
  };
}
let config = createDefaultConfig();
// 属性位转义：href/title/data-* 等拼进 HTML 属性前必须过这里，否则引号可逃逸出属性（与 marked 默认渲染器的 encodeURI 语义对齐）
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function configureChatMarkdown(options) {
  if (options.reset) {
    config = createDefaultConfig();
  }
  if (options.protocolThemes) {
    config.protocolThemes = { ...config.protocolThemes, ...options.protocolThemes };
  }
  if (options.standardProtocols) {
    if (options.standardProtocols.add) {
      for (const p of options.standardProtocols.add) {
        config.standardProtocols.add(p.toLowerCase());
      }
    }
    if (options.standardProtocols.remove) {
      for (const p of options.standardProtocols.remove) {
        config.standardProtocols.delete(p.toLowerCase());
      }
    }
  }
}
function getChatMarkdownConfig() {
  return {
    standardProtocols: new Set(config.standardProtocols),
    protocolThemes: { ...config.protocolThemes }
  };
}
const md = new Marked();
md.setOptions({ breaks: true, gfm: true });
const renderer = new marked.Renderer();

renderer.code = function({ text, lang }) {
  const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
  let highlighted;
  try {
    highlighted = hljs.highlight(text, { language }).value;
  } catch {
    highlighted = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // 代码工具条：语言标签 + 复制。复制文本由 ChatMarkdown 事件委托从 <code> 读，
  // 不把原文塞进 data-* （大段代码会让 HTML 体积翻倍）
  const bar = `<div class="eb-chat-code__bar">` +
    `<span class="eb-chat-code__lang">${escapeHtml(language)}</span>` +
    `<button type="button" class="eb-chat-code__copy" aria-label="${escapeHtml(labels.markdown.copyCode)}">` +
    `<span class="eb-chat-code__copy-text">${escapeHtml(labels.markdown.copyCode)}</span>` +
    `</button></div>`;
  return `<div class="eb-chat-code">${bar}` +
    `<pre><code class="hljs language-${language}">${highlighted}</code></pre></div>`;
};
// 原文 raw HTML 一律转义为纯文本展示：marked 默认放行内联/块级 HTML，聊天消息属不可信输入，
// 不拦截等价于 v-html 直出 <img onerror>/<script> 注入
renderer.html = function({ text }) {
  return escapeHtml(text);
};
renderer.link = function({ href, title, tokens }) {
  const text = this.parser.parseInline(tokens) || href || "";
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
  if (!href) {
    return text;
  }
  const colonIdx = href.indexOf(":");
  const protocol = colonIdx > 0 ? href.slice(0, colonIdx).toLowerCase() : "";
  if (protocol && config.standardProtocols.has(protocol)) {
    const isExternal = /^(https?:|mailto:|ftp:)/i.test(href);
    const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${escapeHtml(href)}"${externalAttrs}${titleAttr}>${text}</a>`;
  }
  if (protocol) {
    const refId = href.slice(colonIdx + 1);
    const theme = config.protocolThemes[protocol] || "primary";
    return `<span class="eb-ref-chip eb-ref-chip--${theme}" data-protocol="${escapeHtml(protocol)}" data-ref-id="${escapeHtml(refId)}" data-ref-href="${escapeHtml(href)}"${titleAttr}>${text}</span>`;
  }
  return `<a href="${escapeHtml(href)}"${titleAttr}>${text}</a>`;
};
md.use({ renderer });
function renderChatMarkdown(content) {
  if (!content) return "";
  return md.parse(content, { async: false });
}
export {
  configureChatMarkdown,
  getChatMarkdownConfig,
  renderChatMarkdown
};
