import { Marked, marked } from "marked";
import hljs from "highlight.js";
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
  try {
    const highlighted = hljs.highlight(text, { language }).value;
    return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
  } catch {
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<pre><code class="hljs language-${language}">${escaped}</code></pre>`;
  }
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
