/**
 * 沙箱 bootstrap：在 iframe 内注入的最小桥
 *
 * 只做三件事：hook console、捕获未处理错误、上报文档高度。
 * 一切经 postMessage 发出，父侧只转发不解析。
 *
 * 注意：沙箱未给 allow-same-origin，iframe 处于不透明源，所以
 * 目标只能是 '*'，父侧必须靠 event.source 校验来源。
 */
const BOOTSTRAP = `<script>
(function () {
  var send = function (type, payload) {
    try { parent.postMessage({ __ebSandbox: 1, type: type, payload: payload }, '*'); } catch (e) {}
  };
  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    var orig = console[level];
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments).map(function (a) {
        try { return typeof a === 'string' ? a : JSON.stringify(a); } catch (e) { return String(a); }
      });
      send('console', { level: level, args: args });
      if (orig) orig.apply(console, arguments);
    };
  });
  window.addEventListener('error', function (e) {
    send('error', {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: (e.error && e.error.stack) || ''
    });
  });
  window.addEventListener('unhandledrejection', function (e) {
    send('error', { message: String(e.reason) });
  });
  var report = function () {
    var h = Math.max(
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0
    );
    if (h) send('resize', { height: h });
  };
  if (typeof ResizeObserver !== 'undefined') {
    try {
      new ResizeObserver(report).observe(document.documentElement);
    } catch (e) {}
  }
  window.addEventListener('load', report);
  send('ready', {});
})();
<\/script>`;

/** 宿主 HTML 前面拼上 bootstrap；已有 doctype 时插在之后 */
export function withBootstrap(html, enabled) {
  const body = String(html ?? "");
  if (!enabled) return body;
  const match = /^\s*<!doctype[^>]*>/i.exec(body);
  if (match) {
    return `${body.slice(0, match[0].length)}${BOOTSTRAP}${body.slice(match[0].length)}`;
  }
  return BOOTSTRAP + body;
}

/** 允许宿主追加的旗标白名单；allow-same-origin 不在此列且永远不放行 */
const ALLOWED_TOKENS = new Set([
  "allow-forms",
  "allow-modals",
  "allow-popups",
  "allow-popups-to-escape-sandbox",
  "allow-downloads",
  "allow-pointer-lock",
  "allow-presentation",
  "allow-top-navigation-by-user-activation",
]);

export const DANGEROUS_TOKEN = "allow-same-origin";

/**
 * 组装 sandbox 属性值。
 * allow-scripts 必给（不给跑不起来）；allow-same-origin 无论谁传都剔除——
 * 它与 allow-scripts 同开等于没有沙箱：iframe 能拿同源存储并操作父文档。
 */
export function buildSandboxAttr(extra = []) {
  const tokens = new Set(["allow-scripts"]);
  for (const token of extra || []) {
    if (token === DANGEROUS_TOKEN) continue;
    if (ALLOWED_TOKENS.has(token)) tokens.add(token);
  }
  return [...tokens].join(" ");
}

/** 宿主传了危险旗标时给出可追踪的告警（开发期可见，生产不打断） */
export function warnIfDangerous(extra = []) {
  if (!Array.isArray(extra) || !extra.includes(DANGEROUS_TOKEN)) return false;
  if (typeof console !== "undefined" && console.warn) {
    console.warn(
      "[EbChatSandbox] 已忽略 allow-same-origin：它与 allow-scripts 同开会使沙箱失效（iframe 可读取同源存储并操作父文档）",
    );
  }
  return true;
}
