/**
 * stack trace 解析
 *
 * 认三种常见形态：
 *   Chrome/V8 : "    at Object.fn (http://x/y.js:1:2)"
 *               "    at http://x/y.js:1:2"
 *   Node      : "    at fn (/path/file.js:1:2)"
 *   Firefox   : "fn@http://x/y.js:1:2"
 *
 * 只做解析与分类，不做 source map 映射——那要拉 map 文件，宿主映射好再传 frames 进来。
 */

/** 依赖帧的判定特征：这些帧对定位业务问题没用，默认折叠 */
const DEPENDENCY_MARKERS = [
  "node_modules",
  "/vendor/",
  "webpack://",
  "webpack-internal",
  "<anonymous>",
  "node:internal",
  "internal/process",
];

const V8 = /^\s*at\s+(?:(.+?)\s+\()?([^()\s]+?):(\d+):(\d+)\)?\s*$/;
const V8_NO_POS = /^\s*at\s+(.+?)\s*$/;
const FIREFOX = /^\s*(?:(.*?)@)?([^@\s]+?):(\d+):(\d+)\s*$/;

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function classify(file) {
  const f = file || "";
  return DEPENDENCY_MARKERS.some((marker) => f.includes(marker));
}

/** 一串 stack（可能是多行）→ 帧数组 */
/**
 * 只解析，不截断：显示层要几步、要不要折叠依赖帧，由组件决定
 * @param {string|Array} input stack 字符串或已解析的 frames
 */
export function parseStackTrace(input) {
  const frames = [];

  if (Array.isArray(input)) {
    // 已是 frames：只补齐缺失字段与依赖判定，不改宿主给的顺序
    for (const item of input) {
      if (!item) continue;
      const file = String(item.file ?? "");
      frames.push({
        fn: String(item.fn ?? ""),
        file,
        line: item.line ?? null,
        column: item.column ?? null,
        raw: String(item.raw ?? ""),
        isDependency: item.isDependency ?? classify(file),
      });
    }
  } else {
    for (const line of String(input ?? "").split("\n")) {
      const raw = line.replace(/\r$/, "");
      if (!raw.trim()) continue;
      if (!/^\s*at\s|@/.test(raw)) continue;
      const hit = V8.exec(raw) || FIREFOX.exec(raw);
      if (hit) {
        // V8 与 Firefox 的捕获组顺序一致：fn? file line col
        const fn = String(hit[1] ?? "").trim();
        const file = String(hit[2] ?? "").trim();
        frames.push({
          fn,
          file,
          line: toInt(hit[3]),
          column: toInt(hit[4]),
          raw: raw.trim(),
          isDependency: classify(file),
        });
        continue;
      }
      const bare = V8_NO_POS.exec(raw);
      if (bare) {
        const text = String(bare[1]).trim();
        frames.push({
          fn: "",
          file: text,
          line: null,
          column: null,
          raw: raw.trim(),
          isDependency: classify(text),
        });
      }
    }
  }

  return {
    frames,
    appFrames: frames.filter((f) => !f.isDependency),
    dependencyFrames: frames.filter((f) => f.isDependency),
  };
}

/** 单帧的可读位置："file:line:col"，缺项自动省略 */
export function formatFrameLocation(frame) {
  if (!frame) return "";
  const file = frame.file || "";
  if (frame.line == null) return file;
  return `${file}:${frame.line}${frame.column == null ? "" : `:${frame.column}`}`;
}

/** 路径太长时从左侧截断，保留文件名与行号——定位靠尾部 */
export function shortenPath(value, max = 48) {
  const text = String(value ?? "");
  if (text.length <= max) return text;
  return `…${text.slice(text.length - max + 1)}`;
}
