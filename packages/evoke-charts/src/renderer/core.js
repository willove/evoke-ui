import { CHART_COLORS, formatValue, getSeriesColors, readChartToken } from "../types";
import { resolveChartPalette } from "../palettes";
import { INTERACTION } from "../interactions";
import { maxOf } from "../extent";
function estimateTextWidth(text, fontSize = 12) {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) || 0;
    const isFullWidth = code >= 11904 && code <= 40959 || code >= 63744 && code <= 64255 || code >= 65280 && code <= 65376 || code >= 12288 && code <= 12351;
    width += isFullWidth ? fontSize : fontSize * 0.62;
  }
  return width;
}
/** 解析 `#rgb` / `#rrggbb` / `rgb()` / `rgba()` 为通道数组；无法识别返回 null */
function parseColorChannels(color) {
  if (typeof color !== "string") return null;
  const text = color.trim();
  const hex = text.replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return [0, 1, 2].map((i) => parseInt(hex[i] + hex[i], 16));
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  const rgbMatch = text.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgbMatch) return [1, 2, 3].map((i) => Math.round(parseFloat(rgbMatch[i])));
  return null;
}
/** 浅色底判断（YIQ）：底色可能来自令牌、混合出的 `rgb()` 或自定义主题 */
function isLightColor(color) {
  const ch = parseColorChannels(color);
  if (!ch) return true;
  return (ch[0] * 299 + ch[1] * 587 + ch[2] * 114) / 1e3 >= 150;
}
function relativeLuminance(ch) {
  const [r, g, b] = ch.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** 底色上的文字取反色：白字/深字谁对比度高用谁——中间调底色（如逐层提亮后的蓝）
 *  用亮度阈值会误判成白字，导致浅底白字看不清 */
function getContrastText(bgColor) {
  const ch = parseColorChannels(bgColor);
  if (!ch) return "#111827";
  const luminance = relativeLuminance(ch);
  const againstWhite = 1.05 / (luminance + 0.05);
  const againstInk = (luminance + 0.05) / (relativeLuminance([17, 24, 39]) + 0.05);
  return againstInk >= againstWhite ? "#111827" : "#ffffff";
}
/** 颜色向 target 混合（ratio 0-1），返回 `#rrggbb`：同色系逐层提亮/压暗用 */
function mixColor(color, ratio, target) {
  const from = parseColorChannels(color);
  const to = parseColorChannels(target);
  if (!from || !to) return color;
  const r = Math.max(0, Math.min(1, ratio));
  const ch = from.map((v, i) => Math.round(v + (to[i] - v) * r));
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function isMissingValue(v) {
  return v === null || v === void 0 || Number.isNaN(v);
}
// 标签超宽截断（二分找最长可容纳前缀 + 省略号）：轴标签 / 图例 / 关系图族共用一份
function truncateLabel(canvasCtx, label, maxWidth) {
  if (canvasCtx.measureText(label).width <= maxWidth) return label;
  let lo = 0, hi = label.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const truncated = label.slice(0, mid) + "\u2026";
    if (canvasCtx.measureText(truncated).width > maxWidth) hi = mid - 1;
    else lo = mid;
  }
  return label.slice(0, lo) + "\u2026";
}
// 瀑布图累计口径（渲染 / 轴量程 / tooltip 命中共用这一份）：
// totalIndices 列画全高（from 0 → v 并重置累计），其余从当前累计增减
function waterfallSteps(deltas, totalIndices) {
  const totalIdx = new Set(totalIndices || []);
  const steps = [];
  let cumulative = 0;
  (deltas || []).forEach((raw, i) => {
    const missing = isMissingValue(raw);
    const v = missing ? 0 : raw;
    if (totalIdx.has(i)) {
      steps.push({ value: v, from: 0, to: v, isTotal: true, missing });
      cumulative = v;
    } else {
      steps.push({ value: v, from: cumulative, to: cumulative + v, isTotal: false, missing });
      cumulative += v;
    }
  });
  return steps;
}
// 折线大数据抽稀（DESIGN §16）：像素点数显著超绘图区像素列时按列做 min-max
// 抽稀——每列保首/末/最小/最大四个代表点，峰谷与断段像素级不丢，绘制调用从
// O(点数) 降到 O(宽度)。返回 [{p, i}]：p 为像素坐标（整列缺失时以 null 作段
// 标记），i 为原始数据索引——命中 / 悬浮 / 标签映射不受抽稀影响。
function minMaxDecimatePoints(points, columns) {
  const out = [];
  const per = points.length / columns;
  let pendingGap = false;
  for (let b = 0; b < columns; b++) {
    const start = Math.floor(b * per);
    const end = Math.min(points.length, Math.max(start + 1, Math.floor((b + 1) * per)));
    let first = -1;
    let last = -1;
    let minI = -1;
    let maxI = -1;
    for (let i = start; i < end; i++) {
      const p = points[i];
      if (!p) continue;
      if (first < 0) first = i;
      last = i;
      if (minI < 0 || p[1] < points[minI][1]) minI = i;
      if (maxI < 0 || p[1] > points[maxI][1]) maxI = i;
    }
    if (first < 0) {
      if (out.length > 0) pendingGap = true;
      continue;
    }
    if (pendingGap) {
      out.push({ p: null, i: first });
      pendingGap = false;
    }
    const picks = [...new Set([first, minI, maxI, last])].sort((a, b) => a - b);
    for (const idx of picks) out.push({ p: points[idx], i: idx });
  }
  return out;
}
function resolveConnectNulls(options, series) {
  return series?.connectNulls ?? options.connectNulls ?? false;
}
function focusAlpha(ctx, seriesName) {
  if (!ctx.focusSeries || ctx.focusSeries === seriesName) return 1;
  // 焦点淡化随 focusAnimProgress 缓入（图例悬浮 180ms；缺省 1 = 即时，兼容无壳渲染）
  const t = ctx.focusAnimProgress === undefined ? 1 : ctx.focusAnimProgress;
  return 1 - (1 - INTERACTION.focusDimAlpha) * t;
}
function drawSymbol(canvasCtx, symbol, x, y, r) {
  canvasCtx.beginPath();
  switch (symbol) {
    case "rect":
      canvasCtx.rect(x - r, y - r, r * 2, r * 2);
      break;
    case "diamond":
      canvasCtx.moveTo(x, y - r);
      canvasCtx.lineTo(x + r, y);
      canvasCtx.lineTo(x, y + r);
      canvasCtx.lineTo(x - r, y);
      canvasCtx.closePath();
      break;
    case "triangle":
      canvasCtx.moveTo(x, y - r);
      canvasCtx.lineTo(x + r, y + r);
      canvasCtx.lineTo(x - r, y + r);
      canvasCtx.closePath();
      break;
    default:
      canvasCtx.arc(x, y, r, 0, Math.PI * 2);
  }
}
function resolveLineDash(series) {
  const style = series?.lineStyle?.type;
  if (!style || style === "solid") return [];
  if (series?.lineStyle?.dash) return series.lineStyle.dash;
  return style === "dashed" ? [6, 4] : [2, 3];
}
function toLog(v, base) {
  if (v === null || v === void 0 || Number.isNaN(v) || v <= 0) return null;
  return Math.log(v) / Math.log(base);
}
const TIME_UNITS = [
  { name: "minute", ms: 6e4 },
  { name: "hour", ms: 36e5 },
  { name: "day", ms: 864e5 },
  { name: "month", ms: 2592e6 },
  { name: "year", ms: 31536e6 }
];
function parseTimeLabels(labels) {
  return labels.map((l) => {
    const t = Date.parse(l);
    return Number.isNaN(t) ? NaN : t;
  });
}
function calculateTimeTicks(min, max, targetCount = 6) {
  const span = Math.max(1, max - min);
  const unitRank = { minute: 0, hour: 1, day: 2, month: 3, year: 4 };
  const candidates = [];
  for (const u of TIME_UNITS) {
    for (const m of [1, 2, 5, 10, 15, 30]) {
      candidates.push({ unit: u.name, step: u.ms * m });
    }
  }
  candidates.sort((a, b) => a.step - b.step || unitRank[b.unit] - unitRank[a.unit]);
  let chosen = candidates[candidates.length - 1];
  for (const c of candidates) {
    if (Math.floor(span / c.step) + 1 <= targetCount + 2) {
      chosen = c;
      break;
    }
  }
  const values = [];
  if (chosen.unit === "month" || chosen.unit === "year") {
    const stepMonths = chosen.unit === "year" ? chosen.step / 31536e6 : chosen.step / 2592e6;
    const d = new Date(min);
    d.setMinutes(0, 0, 0);
    if (chosen.unit === "year") d.setMonth(0);
    else d.setDate(1);
    while (d.getTime() < min) d.setMonth(d.getMonth() + stepMonths);
    let guard = 0;
    while (d.getTime() <= max && guard++ < 200) {
      values.push(d.getTime());
      d.setMonth(d.getMonth() + stepMonths);
    }
  } else {
    const step = chosen.step;
    const start = Math.ceil(min / step) * step;
    for (let t = start; t <= max; t += step) values.push(t);
  }
  if (values.length < 2) values.push(max);
  return { values, unit: chosen.unit };
}
function formatTimeTick(ts, unit) {
  const d = new Date(ts);
  const pad = (n) => n.toString().padStart(2, "0");
  switch (unit) {
    case "year":
      return `${d.getFullYear()}`;
    case "month":
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    case "day":
      return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
    case "hour":
      return `${pad(d.getDate())} ${pad(d.getHours())}:00`;
    case "minute":
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
function estimateLegendRows(options, availableWidth) {
  const legend = options.legend || {};
  if (legend.show === false) return 1;
  let names = [];
  if (options.type === "pie" || options.type === "doughnut" || options.type === "rose") {
    names = (options.pieData || []).map((d) => d.label || "");
  } else if (options.type === "radar") {
    names = (options.radarSeries || []).map((s) => s.name);
  } else if (options.type === "funnel") {
    names = (options.funnelData || []).map((d) => d.label || "");
  } else if (options.type === "sankey" || options.type === "chord" || options.type === "arc") {
    names = ((options.sankeyData || options.chordData || options.arcData || {}).nodes || []).map((n) => n.name);
  } else if (options.type === "venn") {
    names = (options.vennData || []).filter((d) => !d.sets || d.sets.length <= 1).map((d) => d.name);
  } else {
    names = (options.series || []).map((s) => s.name);
  }
  if (names.length === 0) return 1;
  const itemWidths = names.map((name) => estimateTextWidth(name, 12) + 28);
  const totalWidth = itemWidths.reduce((sum, w) => sum + w, 0) + (names.length - 1) * 12;
  if (totalWidth <= availableWidth) return 1;
  let rows = 1;
  let lineWidth = 0;
  itemWidths.forEach((w, i) => {
    const need = w + (i === 0 ? 0 : 12);
    if (lineWidth + need > availableWidth && lineWidth > 0) {
      rows++;
      lineWidth = w;
    } else {
      lineWidth += need;
    }
  });
  return Math.max(1, rows);
}
/** 该类型是否存在图例内容（boxplot/treemap 等用专属数据字段、无 series，不应预留图例区） */
function hasLegendContent(options) {
  if (options.type === "pie" || options.type === "doughnut" || options.type === "rose") {
    return (options.pieData || []).length > 0;
  }
  if (options.type === "radar") {
    return (options.radarSeries || []).length > 0;
  }
  if (options.type === "funnel") {
    return (options.funnelData || []).length > 0;
  }
  if (options.type === "sankey" || options.type === "chord" || options.type === "arc") {
    return ((options.sankeyData || options.chordData || options.arcData || {}).nodes || []).length > 0;
  }
  if (options.type === "venn") {
    return (options.vennData || []).length > 0;
  }
  if (options.type === "candle") {
    return (options.volumeData || []).length > 0 || Array.isArray(options.candleMa);
  }
  return (options.series || []).length > 0;
}
/** 标题+副标题在画布顶部占用的纵向空间 */
function titleBlockHeight(options) {
  return (options.title ? 26 : 0) + (options.subtitle ? 18 : 0);
}
/** options.padding 覆写：数字（四边一致）或 { top, right, bottom, left }（未提供的边回落默认值） */
function resolveUserPadding(options) {
  const p = options.padding;
  if (!p) return {};
  if (typeof p === "number") return { top: p, right: p, bottom: p, left: p };
  return p;
}
/**
 * y 轴左侧留白按刻度标签实测宽度自适应（替代固定 65）：
 * 取数据范围 → nice 刻度值 → 逐个测宽，留 26px（10 间隙 + 刻度短横 + 余量）。
 * 对数轴/自定义 formatter 场景不可预估时回落 65；结果夹在 [40, 140]。
 */
function estimateYAxisLeft(options) {
  const axisConfig = options.yAxis || {};
  if (axisConfig.type === "log") return 65;
  try {
    // 横向条形图 / 横向箱线的左列是分类标签（非数值刻度），按最宽分类名估宽，同一 [40, 140] 契约
    if (options.type === "horizontal-bar" || (options.type === "boxplot" && options.boxHorizontal === true)) {
      const names = options.type === "horizontal-bar"
        ? options.labels || []
        : [...new Set((options.boxData || []).map((b) => b.label))];
      const formatter = axisConfig.formatter;
      const maxW = names.reduce((m, l) => {
        const label = formatter ? String(formatter(l)) : String(l);
        return Math.max(m, estimateTextWidth(label, 12));
      }, 0);
      if (!maxW) return 65;
      return Math.max(40, Math.min(140, Math.round(maxW + 26)));
    }
    const range = calculateRange(options, new Set(), false);
    const min = axisConfig.min ?? range?.min;
    const max = axisConfig.max ?? range?.max;
    if (!Number.isFinite(min) || !Number.isFinite(max)) return 65;
    const { tickValues } = resolveTickExtendedRange(min, max, axisConfig.ticks || 5);
    const maxW = tickValues.reduce((m, t) => {
      const label = axisConfig.formatter ? axisConfig.formatter(t) : Number.isInteger(t) ? t.toString() : parseFloat(t.toFixed(6)).toString();
      return Math.max(m, estimateTextWidth(String(label), 12));
    }, 0);
    if (!maxW) return 65;
    return Math.max(40, Math.min(140, Math.round(maxW + 26)));
  } catch {
    return 65;
  }
}
function getPadding(options, containerWidth = 600) {
  const legend = options.legend || {};
  const legendEnabled = legend.show !== false && hasLegendContent(options);
  const legendPosition = legendEnabled ? legend.position || "bottom" : "none";
  const hasXAxis = [
    "line",
    "bar",
    "stacked-bar",
    "area",
    "scatter",
    "horizontal-bar",
    "waterfall",
    "boxplot",
    "mixed"
  ].includes(options.type);
  const hasXAxisTitle = !!options.xAxis?.title;
  const hasYAxisRight = !!options.yAxisRight && (options.series || []).some((s) => s.yAxis === "right");
  const zoom = options.dataZoom;
  const hasDataZoom = !!zoom?.enabled && hasXAxis;
  const zoomHeight = (zoom?.height || 40) + 14;
  if (options.type === "sparkline") {
    // 迷你图默认无chrome；带 title 时为其留出绘制空间
    const sparkPad = resolveUserPadding(options);
    return {
      top: sparkPad.top ?? (options.title ? 32 : 6),
      right: sparkPad.right ?? 6,
      bottom: sparkPad.bottom ?? 6,
      left: sparkPad.left ?? 6
    };
  }
  const legendRowsExtra = (() => {
    if (legendPosition !== "top" && legendPosition !== "bottom") return 0;
    const rows = estimateLegendRows(options, containerWidth);
    return (rows - 1) * 20;
  })();
  const LEGEND_BAND = 26;
  const noAxisTypes = [
    "pie",
    "doughnut",
    "rose",
    "funnel",
    "gauge",
    "heatmap",
    "radar",
    "treemap",
    "bullet",
    "bin",
    "sunburst",
    "sankey",
    "venn",
    "chord",
    "arc",
    "scatter-matrix"
  ];
  if (options.type === "calendar-heatmap") {
    // 日历热力：左列星期标签带 + 顶部月份带 + 右下色阶行
    const pad2 = resolveUserPadding(options);
    return {
      top: (pad2.top ?? 12) + titleBlockHeight(options),
      right: pad2.right ?? 18,
      bottom: pad2.bottom ?? 44,
      left: pad2.left ?? 36
    };
  }
  if (options.type === "gantt") {
    // 甘特：左侧任务名列按最宽任务名实测（夹 80–180），底部时间轴 46
    const pad2 = resolveUserPadding(options);
    const names2 = (options.ganttData || []).map((t) => t.name || "");
    const labelW = names2.length
      ? Math.max(80, Math.min(180, Math.round(maxOf(names2.map((n) => estimateTextWidth(n, 12))) + 16)))
      : 100;
    const top2 = (pad2.top ?? 18) + titleBlockHeight(options) + (legendPosition === "top" ? LEGEND_BAND + legendRowsExtra : 0);
    const bottom2 = (pad2.bottom ?? 46) + (legendPosition === "bottom" ? LEGEND_BAND + legendRowsExtra : 0);
    const left2 = pad2.left ?? labelW;
    const right2 = pad2.right ?? 24;
    return {
      top: top2,
      right: right2,
      bottom: bottom2,
      left: legendPosition === "left" ? left2 + 80 : left2
    };
  }
  if (noAxisTypes.includes(options.type)) {
    const pad = resolveUserPadding(options);
    let top2 = (pad.top ?? 18) + titleBlockHeight(options);
    let bottom2 = pad.bottom ?? 18;
    let left2 = pad.left ?? 20;
    let right2 = pad.right ?? 20;
    // 关系图族节点标签贴近绘图区下缘，图例带压字：底部默认余量加大
    if (options.type === "sankey" || options.type === "chord" || options.type === "arc" || options.type === "venn") {
      bottom2 = pad.bottom ?? 34;
    }
    if (options.type === "heatmap") {
      const yCats = Array.from(new Set((options.heatmapData || []).map((d) => d.y)));
      const maxYLabel = yCats.reduce((m, s) => Math.max(m, estimateTextWidth(s, 11)), 0);
      left2 = pad.left ?? Math.min(130, Math.max(24, maxYLabel + 14));
      bottom2 = Math.max(bottom2, 26);
      if (options.heatmap?.colorBar === true || options.heatmapColorBar === true) {
        right2 += 44;
      }
    }
    if (options.type === "bin") {
      // 只需要非缺失个数：直接计数，不物化数组（push(...arr) 展开大样本会 RangeError）
      let maxFreq = 0;
      (options.series || []).forEach((s) => {
        const data = s.data || [];
        for (let i = 0; i < data.length; i++) {
          if (!isMissingValue(data[i])) maxFreq++;
        }
      });
      const tickLabelWidth = String(maxFreq).length * 7;
      left2 = pad.left ?? Math.min(90, Math.max(36, tickLabelWidth + 16));
      bottom2 = Math.max(bottom2, 30);
    }
    if (options.type === "bullet") {
      bottom2 = Math.max(bottom2, 30);
      right2 += 76;
    }
    if (options.toolbox?.show) top2 = Math.max(top2, 36);
    if (legendPosition === "top") top2 += LEGEND_BAND;
    if (legendPosition === "bottom") bottom2 += LEGEND_BAND;
    if (legendPosition === "left") left2 += 80;
    if (legendPosition === "right") right2 += 80;
    top2 += legendRowsExtra;
    bottom2 += legendRowsExtra;
    return { top: top2, right: right2, bottom: bottom2, left: left2 };
  }
  // 轴类图表：padding 覆写静态留白（标题/图例/缩放条等 chrome 带照常叠加）；
  // x 轴整体隐藏时回收底部 46px 的轴位预留。
  // yAxis.width / yAxisRight.width 显式定轴槽宽——列表场景多图统一绘图区起点
  const pad = resolveUserPadding(options);
  const xAxisHidden = options.xAxis?.show === false;
  const yAxisWidth = options.yAxis?.width;
  const yAxisRightWidth = options.yAxisRight?.width;
  let top = (pad.top ?? 18) + titleBlockHeight(options) + (legendPosition === "top" ? LEGEND_BAND + legendRowsExtra : 0);
  let bottom = (pad.bottom ?? (xAxisHidden ? 12 : 46)) + (legendPosition === "bottom" ? LEGEND_BAND + legendRowsExtra : 0);
  let left = pad.left ?? (typeof yAxisWidth === "number" && yAxisWidth > 0 ? yAxisWidth : estimateYAxisLeft(options));
  let right = pad.right ?? (typeof yAxisRightWidth === "number" && yAxisRightWidth > 0 ? yAxisRightWidth : hasYAxisRight ? 65 : 24);
  if (legendPosition === "left") left += 80;
  if (legendPosition === "right") right += 80;
  if (hasXAxis && hasXAxisTitle) {
    return { top, right, bottom: bottom + 15, left };
  }
  const xRotate = options.xAxis?.rotate || 0;
  if (hasXAxis && xRotate) {
    const maxLabelWidth = (options.labels || []).reduce((m, s) => Math.max(m, estimateTextWidth(String(s), 12)), 0);
    return { top, right, bottom: bottom + Math.min(90, 12 + maxLabelWidth * Math.sin(Math.min(60, Math.abs(xRotate)) * Math.PI / 180)), left };
  }
  if (hasDataZoom) {
    if ((zoom?.position || "bottom") === "top") return { top: top + zoomHeight, right, bottom, left };
    return { top, right, bottom: bottom + zoomHeight, left };
  }
  return { top, right, bottom, left };
}
const easings = {
  linear: (t) => t,
  // 三次缓入 — 起步沉重，越往后越快
  easeIn: (t) => t * t * t,
  // 五次缓出 — 起步迅猛，末段细腻减速，更有"惯性停下"的物理感
  easeOut: (t) => 1 - Math.pow(1 - t, 5),
  // 三次缓入缓出 — 对称型曲线
  easeInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  // back ease-out — 末段有轻微过冲回弹，有"弹性到位"的物理感
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  // elastic — 真实的弹簧震荡曲线
  elastic: (t) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },
  // bounce — 落地弹跳，模拟自由落体物理
  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    else return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  // expo ease-out — 指数缓出，快速到位后精细减速
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
};
function getTheme(isDark, customTheme, paletteId) {
  // 颜色优先从 --ev-* 令牌实时读取（跟随主题/暗色/换肤），
  // 无 DOM（SSR/jsdom）时回落到与令牌对齐的静态值；
  // options.palette 指定内置色系时系列色固定（不再读令牌），
  // theme.colors 手工数组仍最高优先
  const paletteColors =
    paletteId && !(customTheme && customTheme.colors)
      ? resolveChartPalette(paletteId, isDark)
      : null;
  const primaryRgb = readChartToken(
    "--ev-color-primary-rgb",
    isDark ? "77, 139, 255" : "23, 93, 255"
  );
  const base = isDark ? {
    colors: paletteColors || getSeriesColors(CHART_COLORS.dark),
    backgroundColor: readChartToken("--ev-bg-color", "#111827"),
    textColor: readChartToken("--ev-text-color-primary", "#f3f4f6"),
    textColorSecondary: readChartToken("--ev-text-color-secondary", "#9ca3af"),
    gridColor: readChartToken("--ev-border-color", "#1f2937"),
    borderColor: readChartToken("--ev-border-color-dark", "#374151"),
    highlightColor: `rgba(${primaryRgb}, 0.12)`,
    crosshairColor: `rgba(${primaryRgb}, 0.55)`
  } : {
    colors: paletteColors || getSeriesColors(CHART_COLORS.primary),
    backgroundColor: readChartToken("--ev-bg-color", "#ffffff"),
    textColor: readChartToken("--ev-text-color-primary", "#111827"),
    textColorSecondary: readChartToken("--ev-text-color-secondary", "#6b7280"),
    gridColor: readChartToken("--ev-border-color-light", "#eff0f3"),
    borderColor: readChartToken("--ev-border-color", "#e0e2e7"),
    highlightColor: `rgba(${primaryRgb}, 0.06)`,
    crosshairColor: `rgba(${primaryRgb}, 0.5)`
  };
  return { ...base, ...customTheme };
}
function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, Math.min(Math.abs(width), Math.abs(height)) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function drawLabelWithBg(ctx, text, x, y, theme, textAlign = "center") {
  ctx.save();
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = textAlign;
  ctx.textBaseline = "bottom";
  const metrics = ctx.measureText(text);
  const padding = 4;
  const bgWidth = metrics.width + padding * 2;
  const bgHeight = 16;
  const bgX = textAlign === "center" ? x - bgWidth / 2 : textAlign === "right" ? x - bgWidth : x;
  const bgY = y - bgHeight - 2;
  roundRect(ctx, bgX, bgY, bgWidth, bgHeight, 4);
  ctx.fillStyle = theme.backgroundColor + "e6";
  ctx.fill();
  ctx.strokeStyle = theme.gridColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = theme.textColor;
  ctx.fillText(text, x, y - 2);
  ctx.restore();
}
function createValueFormatter(options) {
  if (options.valueFormatter) return options.valueFormatter;
  return (value, opts) => formatValue(value, { ...options.valueFormat, ...opts });
}
function calculateTicks(min, max, count) {
  if (min === max) {
    return [min, min + 1];
  }
  const range = max - min;
  const roughStep = range / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;
  let step;
  if (residual <= 1.5) step = magnitude;
  else if (residual <= 3) step = 2 * magnitude;
  else if (residual <= 7) step = 5 * magnitude;
  else step = 10 * magnitude;
  const ticks = [];
  const start = Math.ceil(min / step) * step;
  for (let tick = start; tick <= max + step * 1e-3; tick += step) {
    ticks.push(parseFloat(tick.toPrecision(12)));
  }
  return ticks;
}
function calculateRange(options, hiddenSeries, useRightAxis) {
  let max = -Infinity;
  let min = Infinity;
  const seriesList = (options.series || []).filter(
    (s) => !hiddenSeries.has(s.name) && (useRightAxis ? s.yAxis === "right" : s.yAxis !== "right")
  );
  if (options.type === "waterfall") {
    const wf = options.waterfall || {};
    const deltas = (options.series || []).filter((s) => !hiddenSeries.has(s.name))[0]?.data || [];
    for (const step of waterfallSteps(deltas, wf.totalIndices)) {
      // 合计列只计列高本身，增量列计两端
      const points = step.isTotal ? [step.to] : [step.from, step.to];
      for (const p of points) {
        if (p > max) max = p;
        if (p < min) min = p;
      }
    }
  } else if (options.type === "boxplot") {
    const boxData = options.boxData || [];
    boxData.forEach((b) => {
      if (b.group && hiddenSeries.has(b.group)) return;
      if (b.max > max) max = b.max;
      if (b.min < min) min = b.min;
      b.outliers?.forEach((o) => {
        if (o > max) max = o;
        if (o < min) min = o;
      });
    });
  } else if (options.type === "area" && options.stackAreas === true) {
    ;
    (options.labels || []).forEach((_, labelIndex) => {
      let stackTotal = 0;
      seriesList.forEach((s) => {
        stackTotal += s.data[labelIndex] || 0;
      });
      if (stackTotal > max) max = stackTotal;
      if (stackTotal < min) min = stackTotal;
    });
  } else if (options.type === "stacked-bar") {
    const groups = resolveStackGroups(seriesList);
    (options.labels || []).forEach((_, labelIndex) => {
      groups.forEach((group) => {
        let stackTotal = 0;
        group.series.forEach((s) => {
          stackTotal += s.data[labelIndex] || 0;
        });
        if (stackTotal > max) max = stackTotal;
        if (stackTotal < min) min = stackTotal;
      });
    });
  } else if (options.type === "scatter") {
    const scatterData = options.scatterData || [];
    scatterData.forEach((d) => {
      if (d.y > max) max = d.y;
      if (d.y < min) min = d.y;
    });
  } else {
    seriesList.forEach((s) => {
      s.data.forEach((v) => {
        if (isMissingValue(v)) return;
        if (v > max) max = v;
        if (v < min) min = v;
      });
    });
  }
  if (max === -Infinity) max = 0;
  if (min === Infinity) min = 0;
  if (!useRightAxis && options.__logBase) {
    if (min === max) return { min: min - 1, max: min + 1 };
    return { min: Math.floor(min), max: Math.ceil(max) };
  }
  const range = max - min || 1;
  // 余量取「数据极差 10%」与「幅值 5%」的较大者：极差相对幅值很小的平直数据
  // （内存 580±6 这类）在零基线轴上不再顶满绘图区上缘
  if (min >= 0) {
    return { min: 0, max: max + Math.max(range * 0.1, max * 0.05) };
  } else {
    const pad = Math.max(range * 0.1, Math.max(Math.abs(max), Math.abs(min)) * 0.05);
    return { min: min - pad, max: max + pad };
  }
}
function applyLogTransform(options) {
  if (options.yAxis?.type !== "log") return options;
  if (!["line", "area", "bar", "stacked-bar", "mixed"].includes(options.type)) return options;
  const base = options.yAxis.logBase || 10;
  const log = (v) => isMissingValue(v) ? null : toLog(v, base);
  const transformed = {
    ...options,
    __logBase: base,
    // 仅左轴系列进入 log 空间；右轴系列保持线性（yAxisRight 不支持 log）
    series: (options.series || []).map((s) => s.yAxis === "right" ? s : { ...s, data: s.data.map(log) }),
    markLines: options.markLines?.map((m) => m.y !== void 0 ? { ...m, y: log(m.y) ?? m.y } : m),
    yAxis: {
      ...options.yAxis,
      min: options.yAxis.min !== void 0 ? log(options.yAxis.min) ?? options.yAxis.min : void 0,
      max: options.yAxis.max !== void 0 ? log(options.yAxis.max) ?? options.yAxis.max : void 0
    }
  };
  if (options.annotation) {
    const ann = options.annotation;
    transformed.annotation = {
      ...ann,
      texts: ann.texts?.map((t) => ({ ...t, y: log(t.y) ?? t.y })),
      arrows: ann.arrows?.map((a) => ({ ...a, fromY: log(a.fromY) ?? a.fromY, toY: log(a.toY) ?? a.toY }))
    };
  }
  return transformed;
}
function formatLogTick(tick, base) {
  const v = Math.pow(base, tick);
  if (Number.isInteger(v)) return v.toString();
  return parseFloat(v.toPrecision(4)).toString();
}
function layoutLabelsAvoidOverlap(rects) {
  const placed = [];
  return rects.map((r) => {
    const overlaps = placed.some(
      (p) => r.x < p.x + p.width && r.x + r.width > p.x && r.y < p.y + p.height && r.y + r.height > p.y
    );
    if (overlaps) return false;
    placed.push(r);
    return true;
  });
}
function groupSeriesByStack(seriesList) {
  const groups = [];
  seriesList.forEach((s) => {
    const existing = s.stack !== void 0 ? groups.find((g) => g.stack === s.stack) : void 0;
    if (existing) {
      existing.series.push(s);
    } else {
      groups.push({ stack: s.stack, series: [s] });
    }
  });
  return groups;
}
function resolveStackGroups(seriesList) {
  if (seriesList.length > 0 && !seriesList.some((s) => s.stack !== void 0)) {
    return [{ stack: void 0, series: [...seriesList] }];
  }
  return groupSeriesByStack(seriesList);
}
function buildSeriesColorIndex(seriesList) {
  const map = /* @__PURE__ */ new Map();
  seriesList.forEach((s, i) => map.set(s, i));
  return map;
}
function resolveTickExtendedRange(min, max, ticks = 5) {
  const tickValues = calculateTicks(min, max, ticks);
  const actualMin = Math.min(min, tickValues[0] || min);
  const actualMax = Math.max(max, tickValues[tickValues.length - 1] || max);
  return { min: actualMin, max: actualMax, tickValues };
}
function createAnimation(config) {
  return {
    startTime: 0,
    duration: config?.duration || INTERACTION.animation.duration,
    easing: config?.easing || INTERACTION.animation.easing,
    progress: 0,
    isAnimating: config?.enabled !== false
  };
}
function updateAnimation(state) {
  if (!state.isAnimating) {
    state.progress = 1;
    return false;
  }
  if (state.startTime === 0) {
    state.startTime = Date.now();
  }
  const elapsed = Date.now() - state.startTime;
  const t = Math.min(elapsed / state.duration, 1);
  // easing 名拼写错误回落默认曲线，不让动画逐帧抛错
  state.progress = (easings[state.easing] || easings.easeOut)(t);
  return t < 1;
}
export {
  CHART_COLORS,
  applyLogTransform,
  buildSeriesColorIndex,
  calculateRange,
  calculateTicks,
  calculateTimeTicks,
  createAnimation,
  createValueFormatter,
  drawLabelWithBg,
  drawSymbol,
  easings,
  estimateTextWidth,
  focusAlpha,
  formatLogTick,
  formatTimeTick,
  getContrastText,
  getPadding,
  getTheme,
  groupSeriesByStack,
  isLightColor,
  isMissingValue,
  layoutLabelsAvoidOverlap,
  mixColor,
  minMaxDecimatePoints,
  parseColorChannels,
  parseTimeLabels,
  resolveConnectNulls,
  resolveLineDash,
  resolveStackGroups,
  resolveTickExtendedRange,
  roundRect,
  toLog,
  truncateLabel,
  updateAnimation,
  waterfallSteps
};
