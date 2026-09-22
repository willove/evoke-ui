import { Marked, marked } from "marked";
import hljs from "highlight.js/lib/common";
import { chatLabels } from "./labels";
// 渲染器是模块级的，进不去参数：渲染期间把当前文案挂在这里。
// md.parse 是同步的，不存在跨渲染串台；真在渲染中切语言也是下一帧的事
let activeLabels = chatLabels;
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
    // 数学公式：宿主注入渲染函数才启用（例如 katex.renderToString）。
    // 不内置实现——katex 的 CSS 与字体要宿主自己引，打进包里是替所有人做选择
    math: null,
    // Mermaid：宿主注入异步渲染函数才给「渲染图表」按钮
    mermaid: null,
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
function stripTags(html) {
  return String(html ?? "").replace(/<[^>]*>/g, "");
}
function schemeOf(href) {
  const idx = href.indexOf(":");
  return idx > 0 ? href.slice(0, idx).toLowerCase() : "";
}
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
  if ("math" in options) {
    config.math = options.math;
  }
  if ("mermaid" in options) {
    config.mermaid = options.mermaid;
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
    protocolThemes: { ...config.protocolThemes },
    math: config.math,
    mermaid: config.mermaid
  };
}
const md = new Marked();
md.setOptions({ breaks: true, gfm: true });
const renderer = new marked.Renderer();

renderer.code = function({ text, lang }) {
  // mermaid 例外：hljs 没有该语言，但渲染按钮与后续替换都靠这个语言名认人
  const language = lang === "mermaid" ? "mermaid" : lang && hljs.getLanguage(lang) ? lang : "plaintext";
  let highlighted;
  try {
    highlighted = hljs.highlight(text, { language }).value;
  } catch {
    highlighted = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // 代码工具条：语言标签 + 复制。复制文本由 ChatMarkdown 事件委托从 <code> 读，
  // 不把原文塞进 data-* （大段代码会让 HTML 体积翻倍）
  // mermaid 只能异步渲染，塞不进同步管线：保留代码块 + 给一个渲染按钮，
  // 点击后由 ChatMarkdown 调宿主注入的渲染器替换（Streamdown 也是这个做法）
  const renderBtn = lang === "mermaid" && config.mermaid
    ? `<button type="button" class="eb-chat-mermaid__render">${escapeHtml(activeLabels.markdown.renderDiagram)}</button>`
    : "";
  const bar = `<div class="eb-chat-code__bar">` +
    `<span class="eb-chat-code__lang">${escapeHtml(language)}</span>` +
    renderBtn +
    `<button type="button" class="eb-chat-code__copy" aria-label="${escapeHtml(activeLabels.markdown.copyCode)}">` +
    `<span class="eb-chat-code__copy-text">${escapeHtml(activeLabels.markdown.copyCode)}</span>` +
    `</button></div>`;
  return `<div class="eb-chat-code">${bar}` +
    `<pre><code class="hljs language-${language}">${highlighted}</code></pre></div>`;
};
// 原文 raw HTML 一律转义为纯文本展示：marked 默认放行内联/块级 HTML，聊天消息属不可信输入，
// 不拦截等价于 v-html 直出 <img onerror>/<script> 注入
renderer.html = function({ text }) {
  return escapeHtml(text);
};
// 图片 src 只放行这三个协议：javascript:/file: 等一律不出网、不落属性。
// data: 保留是因为宿主普遍用它传内联缩略图，且 img 的 data: 不执行脚本。
const imageProtocols = /* @__PURE__ */ new Set(["http", "https", "data"]);
renderer.image = function({ href, title, text }) {
  const alt = escapeHtml(text || "");
  if (!href || !imageProtocols.has(schemeOf(href))) {
    // 协议不允许时退回可读纯文本，而不是留下一个点不动的破图
    return alt ? `[${alt}]` : "";
  }
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
  return `<img src="${escapeHtml(href)}" alt="${alt}"${titleAttr} loading="lazy" referrerpolicy="no-referrer">`;
};
renderer.link = function({ href, title, tokens }) {
  const text = this.parser.parseInline(tokens) || href || "";
  // 脚注形态（[^1]）不是链接：marked v18 无脚注扩展，误解析会产出一个指向
  // 定义文本的假链接。退回原样文本，等真正接脚注扩展时再改
  const footnoteId = /^\^[\w-]+$/.test(stripTags(text).trim()) ? stripTags(text).trim().slice(1) : "";
  if (footnoteId) {
    return escapeHtml(`[^${footnoteId}]`);
  }
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
  // source: 协议——行内引用上标。用显式协议而非裸 [1] 自动识别，
  // 后者会和有序列表、脚注、代码里的方括号打架
  if (protocol === "source") {
    const refId = href.slice(colonIdx + 1);
    const plain = String(text).replace(/<[^>]*>/g, "").trim();
    // 链接文字本身是数字就沿用它作序号，否则按本次渲染递增分配
    const num = /^\d+$/.test(plain) ? plain : String(++citationSeq);
    return `<sup class="eb-chat-citation" data-ref-id="${escapeHtml(refId)}" data-cite-num="${num}" role="button" tabindex="0" aria-label="${escapeHtml(activeLabels.markdown.citation(num))}"${titleAttr}>${num}</sup>`;
  }
  if (protocol) {
    const refId = href.slice(colonIdx + 1);
    const theme = config.protocolThemes[protocol] || "primary";
    return `<span class="eb-ref-chip eb-ref-chip--${theme}" data-protocol="${escapeHtml(protocol)}" data-ref-id="${escapeHtml(refId)}" data-ref-href="${escapeHtml(href)}"${titleAttr}>${text}</span>`;
  }
  return `<a href="${escapeHtml(href)}"${titleAttr}>${text}</a>`;
};
let citationSeq = 0;

// ── 脚注 ──
// marked v18 不带脚注扩展。定义体不在原地渲染，先收集，解析完再统一附尾注；
// 编号按定义出现顺序，与 GFM 一致。
let footnoteDefs = new Map();

const footnoteRefExt = {
  name: "footnoteRef",
  level: "inline",
  start(src) {
    const i = src.indexOf("[^");
    return i < 0 ? void 0 : i;
  },
  tokenizer(src) {
    const m = /^\[\^([\w-]+)\]/.exec(src);
    if (!m) return void 0;
    return { type: "footnoteRef", raw: m[0], id: m[1] };
  },
  renderer(token) {
    const def = footnoteDefs.get(token.id);
    // 没有对应定义的引用不猜，退回原样文本
    if (!def) return escapeHtml(`[^${token.id}]`);
    def.referenced = true;
    return `<sup class="eb-chat-citation" data-ref-id="${escapeHtml(token.id)}" data-cite-num="${def.index}" role="button" tabindex="0" aria-label="${escapeHtml(activeLabels.markdown.footnote(def.index))}">${def.index}</sup>`;
  }
};

const footnoteDefExt = {
  name: "footnoteDef",
  level: "block",
  start(src) {
    const m = /^\[\^[\w-]+\]:/m.exec(src);
    return m ? m.index : void 0;
  },
  tokenizer(src) {
    // 定义体允许续行：直到下一个定义或空行
    const m = /^\[\^([\w-]+)\]:[ \t]*([^\n]*(?:\n(?![ \t]*\n|\[\^[\w-]+\]:)[^\n]*)*)/.exec(src);
    if (!m) return void 0;
    // 词法阶段登记：编号按定义出现顺序，正文引用在渲染时回填 referenced
    if (!footnoteDefs.has(m[1])) {
      footnoteDefs.set(m[1], { id: m[1], text: m[2].trim(), index: footnoteDefs.size + 1, referenced: false });
    }
    return { type: "footnoteDef", raw: m[0], id: m[1], text: m[2].trim() };
  },
  renderer() {
    return "";
  }
};

// 数学公式：宿主注入 math(tex, displayMode) => html 才生效。
// 字符串按 HTML 原样插入，转义由宿主渲染器负责（katex.renderToString 自带）
const mathInlineExt = {
  name: "mathInline",
  level: "inline",
  start(src) {
    const i = src.indexOf("$");
    return i < 0 ? void 0 : i;
  },
  tokenizer(src) {
    if (!config.math) return void 0;
    const m = /^\$(?!\s)([^\n$]+?)(?<!\s)\$/.exec(src);
    if (!m) return void 0;
    // `$100 与 $200` 这类金额写法别被当成公式吃掉
    if (/^[\d,.\s]+$/.test(m[1])) return void 0;
    return { type: "mathInline", raw: m[0], tex: m[1] };
  },
  renderer(token) {
    try {
      return `<span class="eb-chat-math eb-chat-math--inline">${config.math(token.tex, false)}</span>`;
    } catch {
      return escapeHtml(token.raw);
    }
  }
};

const mathBlockExt = {
  name: "mathBlock",
  level: "block",
  start(src) {
    const i = src.indexOf("$$");
    return i < 0 ? void 0 : i;
  },
  tokenizer(src) {
    if (!config.math) return void 0;
    const m = /^\$\$[ \t]*\n?([\s\S]+?)\n?\$\$[ \t]*(?:\n|$)/.exec(src);
    if (!m) return void 0;
    return { type: "mathBlock", raw: m[0], tex: m[1].trim() };
  },
  renderer(token) {
    try {
      return `<div class="eb-chat-math eb-chat-math--block">${config.math(token.tex, true)}</div>`;
    } catch {
      return escapeHtml(token.raw);
    }
  }
};

md.use({ extensions: [footnoteDefExt, footnoteRefExt, mathBlockExt, mathInlineExt] });
md.use({ renderer });
/**
 * 默认高亮走 highlight.js/lib/common（36 种语言，避免整包 193 种进产物）。
 * 需要冷门语言时由宿主注册，返回 false 表示注册失败（如定义不是函数）
 */
function registerHighlightLanguage(name, definition) {
  // 自己先挡一层：hljs 对非函数定义会抛 TypeError 并往 stderr 打日志，
  // 调用方拿到的只是 false，不该为此污染输出
  if (typeof name !== "string" || !name || typeof definition !== "function") return false;
  try {
    hljs.registerLanguage(name, definition);
    return true;
  } catch {
    return false;
  }
}
/**
 * 渲染消息 Markdown。
 * `labels` 由组件把自己的响应式文案传进来（语言切换后重渲染即换文案）；
 * 不传则用基准包静态文案，供非组件调用方使用。
 */
function renderChatMarkdown(content, labels = chatLabels) {
  if (!content) return "";
  activeLabels = labels;
  citationSeq = 0;
  footnoteDefs = new Map();
  const html = md.parse(content, { async: false });
  return html + renderFootnotes();
}

/** 尾注列表：只有被引用过的定义才出现，避免正文里的死条目 */
function renderFootnotes() {
  const used = [...footnoteDefs.values()].filter((d) => d.referenced);
  if (!used.length) return "";
  const items = used
    .map((d) => `<li id="eb-fn-${escapeHtml(d.id)}">${md.parseInline(d.text, { async: false })}</li>`)
    .join("");
  return `<ol class="eb-chat-footnotes">${items}</ol>`;
}
export {
  configureChatMarkdown,
  registerHighlightLanguage,
  getChatMarkdownConfig,
  renderChatMarkdown
};
