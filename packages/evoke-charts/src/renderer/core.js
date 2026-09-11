import { CHART_COLORS, formatValue, getSeriesColors, readChartToken } from "../types";
function estimateTextWidth(text, fontSize = 12) {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) || 0;
    const isFullWidth = code >= 11904 && code <= 40959 || code >= 63744 && code <= 64255 || code >= 65280 && code <= 65376 || code >= 12288 && code <= 12351;
    width += isFullWidth ? fontSize : fontSize * 0.62;
  }
  return width;
}
function getContrastText(bgColor) {
  const hex = bgColor.replace("#", "");
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length >= 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1e3;
  return yiq >= 150 ? "#111827" : "#ffffff";
}
function isMissingValue(v) {
  return v === null || v === void 0 || Number.isNaN(v);
}
function resolveConnectNulls(options, series) {
  return series?.connectNulls ?? options.connectNulls ?? false;
}
function focusAlpha(ctx, seriesName) {
  if (!ctx.focusSeries || ctx.focusSeries === seriesName) return 1;
  return 0.22;
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
    "sunburst"
  ];
  if (noAxisTypes.includes(options.type)) {
    const pad = resolveUserPadding(options);
    let top2 = (pad.top ?? 18) + titleBlockHeight(options);
    let bottom2 = pad.bottom ?? 18;
    let left2 = pad.left ?? 20;
    let right2 = pad.right ?? 20;
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
      const allValues = [];
      (options.series || []).forEach((s) => allValues.push(...s.data.filter((v) => !isMissingValue(v))));
      const maxFreq = allValues.length;
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
  // x 轴整体隐藏时回收底部 46px 的轴位预留
  const pad = resolveUserPadding(options);
  const xAxisHidden = options.xAxis?.show === false;
  let top = (pad.top ?? 18) + titleBlockHeight(options) + (legendPosition === "top" ? LEGEND_BAND + legendRowsExtra : 0);
  let bottom = (pad.bottom ?? (xAxisHidden ? 12 : 46)) + (legendPosition === "bottom" ? LEGEND_BAND + legendRowsExtra : 0);
  let left = pad.left ?? 65;
  let right = pad.right ?? (hasYAxisRight ? 65 : 24);
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
function getTheme(isDark, customTheme) {
  // 颜色优先从 --ev-* 令牌实时读取（跟随主题/暗色/换肤），
  // 无 DOM（SSR/jsdom）时回落到与令牌对齐的静态值
  const primaryRgb = readChartToken(
    "--ev-color-primary-rgb",
    isDark ? "77, 139, 255" : "23, 93, 255"
  );
  const base = isDark ? {
    colors: getSeriesColors(CHART_COLORS.dark),
    backgroundColor: readChartToken("--ev-bg-color", "#111827"),
    textColor: readChartToken("--ev-text-color-primary", "#f3f4f6"),
    textColorSecondary: readChartToken("--ev-text-color-secondary", "#9ca3af"),
    gridColor: readChartToken("--ev-border-color", "#1f2937"),
    borderColor: readChartToken("--ev-border-color-dark", "#374151"),
    highlightColor: `rgba(${primaryRgb}, 0.12)`,
    crosshairColor: `rgba(${primaryRgb}, 0.55)`
  } : {
    colors: getSeriesColors(CHART_COLORS.primary),
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
    const totalIdx = new Set(wf.totalIndices || []);
    const deltas = (options.series || []).filter((s) => !hiddenSeries.has(s.name))[0]?.data || [];
    let cumulative = 0;
    deltas.forEach((rawV, i) => {
      const v = isMissingValue(rawV) ? 0 : rawV;
      if (totalIdx.has(i)) {
        if (v > max) max = v;
        if (v < min) min = v;
        cumulative = v;
      } else {
        const from = cumulative;
        cumulative = cumulative + v;
        if (Math.max(from, cumulative) > max) max = Math.max(from, cumulative);
        if (Math.min(from, cumulative) < min) min = Math.min(from, cumulative);
      }
    });
  } else if (options.type === "boxplot") {
    const boxData = options.boxData || [];
    boxData.forEach((b) => {
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
  if (min >= 0) {
    return { min: 0, max: max + range * 0.1 };
  } else {
    return { min: min - range * 0.1, max: max + range * 0.1 };
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
    duration: config?.duration || 1200,
    easing: config?.easing || "easeOut",
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
  state.progress = easings[state.easing](t);
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
  isMissingValue,
  layoutLabelsAvoidOverlap,
  parseTimeLabels,
  resolveConnectNulls,
  resolveLineDash,
  resolveStackGroups,
  resolveTickExtendedRange,
  roundRect,
  toLog,
  updateAnimation
};
