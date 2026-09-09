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
      "skype",
      "data"
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
renderer.link = function({ href, title, tokens }) {
  const text = this.parser.parseInline(tokens) || href || "";
  const titleAttr = title ? ` title="${title}"` : "";
  if (!href) {
    return text;
  }
  const colonIdx = href.indexOf(":");
  const protocol = colonIdx > 0 ? href.slice(0, colonIdx).toLowerCase() : "";
  if (protocol && config.standardProtocols.has(protocol)) {
    const isExternal = /^(https?:|mailto:|ftp:)/i.test(href);
    const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${href}"${externalAttrs}${titleAttr}>${text}</a>`;
  }
  if (protocol) {
    const refId = href.slice(colonIdx + 1);
    const theme = config.protocolThemes[protocol] || "primary";
    return `<span class="ev-ref-chip ev-ref-chip--${theme}" data-protocol="${protocol}" data-ref-id="${refId}" data-ref-href="${href}"${titleAttr}>${text}</span>`;
  }
  return `<a href="${href}"${titleAttr}>${text}</a>`;
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
