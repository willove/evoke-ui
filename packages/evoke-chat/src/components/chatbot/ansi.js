/**
 * 最小 ANSI SGR 解析（终端输出上色用）
 *
 * 只认 8/16 色前景与加粗——这三样覆盖了命令输出里绝大多数着色。
 * 安全性：先把文本分块转义，再只把**自己构造的 span** 拼进去，
 * 绝不把原文里的任何字符当标记透传（否则终端输出就是一条注入通道）。
 */

const FG_CLASS = {
  30: "is-fg-black",
  31: "is-fg-red",
  32: "is-fg-green",
  33: "is-fg-yellow",
  34: "is-fg-blue",
  35: "is-fg-magenta",
  36: "is-fg-cyan",
  37: "is-fg-white",
  90: "is-fg-bright-black",
  91: "is-fg-bright-red",
  92: "is-fg-bright-green",
  93: "is-fg-bright-yellow",
  94: "is-fg-bright-blue",
  95: "is-fg-bright-magenta",
  96: "is-fg-bright-cyan",
  97: "is-fg-bright-white"
};

const SGR = /\u001b\[([0-9;]*)m/g;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 把带 SGR 的文本转成安全 HTML；无 SGR 时原样转义返回 */
export function ansiToHtml(text) {
  const src = String(text ?? "");
  SGR.lastIndex = 0;
  if (!SGR.test(src)) return escapeHtml(src);

  const classes = new Set();
  let out = "";
  let cursor = 0;
  SGR.lastIndex = 0;
  let match;

  const wrap = (chunk) => {
    if (!chunk) return "";
    const safe = escapeHtml(chunk);
    if (!classes.size) return safe;
    return `<span class="${[...classes].join(" ")}">${safe}</span>`;
  };

  while ((match = SGR.exec(src))) {
    out += wrap(src.slice(cursor, match.index));
    cursor = match.index + match[0].length;
    const codes = match[1] === "" ? ["0"] : match[1].split(";");
    for (const code of codes) {
      const n = Number(code);
      if (n === 0) {
        classes.clear();
      } else if (n === 1) {
        classes.add("is-bold");
      } else if (n === 22) {
        classes.delete("is-bold");
      } else if (n === 39) {
        for (const cls of Object.values(FG_CLASS)) classes.delete(cls);
      } else if (FG_CLASS[n]) {
        for (const cls of Object.values(FG_CLASS)) classes.delete(cls);
        classes.add(FG_CLASS[n]);
      }
      // 其余码（背景色、下划线等）忽略：不认识的样式宁可不染
    }
  }
  out += wrap(src.slice(cursor));
  return out;
}

/** 去掉全部 ANSI 序列，用于需要纯文本的场景（复制、截行统计） */
export function stripAnsi(text) {
  return String(text ?? "").replace(/\u001b\[[0-9;]*m/g, "");
}
