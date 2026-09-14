import {
  calculateTicks,
  calculateRange,
  resolveTickExtendedRange,
  formatLogTick,
  parseTimeLabels,
  calculateTimeTicks,
  formatTimeTick
} from "./core";
import { maxOf, minOf } from "../extent";
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
/**
 * 抽稀刻度：保留首末两端覆盖，步长取整数倍使数量 ≤ maxCount。
 * nice 算法的 step 候选会让实际刻度数超出请求数（如 ticks:3 得到 5 档），
 * 显式 ticks 视为硬上限，超出的中间档按均匀步长抽稀（round 值不丢）。
 */
function thinTickValues(values, maxCount) {
  const limit = Math.max(2, maxCount);
  if (values.length <= limit) return values;
  let stride = Math.ceil((values.length - 1) / (limit - 1));
  while (stride < values.length - 1 && (values.length - 1) % stride !== 0) stride += 1;
  const thinned = [];
  for (let i = 0; i < values.length; i += stride) thinned.push(values[i]);
  return thinned;
}
function drawAxisLine(canvasCtx, cfg, theme, x1, y1, x2, y2) {
  if (cfg?.axisLine?.show === false) return;
  canvasCtx.save();
  canvasCtx.strokeStyle = cfg?.axisLine?.color || theme.borderColor;
  canvasCtx.lineWidth = cfg?.axisLine?.width ?? 1;
  canvasCtx.beginPath();
  canvasCtx.moveTo(x1, y1);
  canvasCtx.lineTo(x2, y2);
  canvasCtx.stroke();
  canvasCtx.restore();
}
function drawAxisTick(canvasCtx, cfg, theme, x, y, dx, dy) {
  if (cfg?.axisTick?.show === false) return;
  const len = cfg?.axisTick?.length ?? 5;
  canvasCtx.save();
  canvasCtx.strokeStyle = theme.gridColor;
  canvasCtx.lineWidth = 1;
  canvasCtx.beginPath();
  canvasCtx.moveTo(x, y);
  canvasCtx.lineTo(x + dx * len, y + dy * len);
  canvasCtx.stroke();
  canvasCtx.restore();
}
function renderYAxis(ctx, side = "left", dataRange) {
  const { ctx: canvasCtx, theme, plotArea, options, width } = ctx;
  const axisConfig = side === "left" ? options.yAxis || {} : options.yAxisRight || {};
  // 刻度密度双约束：显式 ticks 视为硬上限；绘图高度不足时按「每档 ≥24px」自适应降密，
  // 避免矮容器（监控长条等）刻度挤压成糊或标签互相截断
  const requestedTicks = axisConfig.ticks || 5;
  const maxByHeight = Math.max(2, Math.floor(plotArea.height / 24) + 1);
  const tickCap = axisConfig.ticks != null ? Math.min(requestedTicks, maxByHeight) : maxByHeight;
  const needsThin = axisConfig.ticks != null || maxByHeight < requestedTicks;
  const isLog = side === "left" && axisConfig.type === "log";
  let computedMax;
  let computedMin;
  if (axisConfig.max === void 0 || axisConfig.min === void 0) {
    if (dataRange) {
      computedMax = dataRange.max;
      computedMin = dataRange.min;
    } else {
      const range = calculateRange(options, ctx.hiddenSeries, side === "right");
      computedMax = range.max;
      computedMin = range.min;
    }
  }
  const max = axisConfig.max ?? computedMax;
  const min = axisConfig.min ?? computedMin;
  const { min: actualMin, max: actualMax, tickValues: niceTicks } = resolveTickExtendedRange(min, max, requestedTicks);
  const tickValues = needsThin ? thinTickValues(niceTicks, tickCap) : niceTicks;
  canvasCtx.save();
  canvasCtx.strokeStyle = theme.gridColor;
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "12px Inter, sans-serif";
  canvasCtx.textAlign = side === "left" ? "right" : "left";
  canvasCtx.textBaseline = "middle";
  const xPos = side === "left" ? plotArea.x - 10 : plotArea.x + plotArea.width + 10;
  const maxLabelWidth = side === "left" ? plotArea.x - 12 : width - plotArea.x - plotArea.width - 12;
  tickValues.forEach((tick) => {
    const y = plotArea.y + plotArea.height - (tick - actualMin) / (actualMax - actualMin) * plotArea.height;
    if (axisConfig.grid?.show !== false && side === "left") {
      canvasCtx.beginPath();
      canvasCtx.setLineDash(axisConfig.grid?.style === "dashed" ? [4, 4] : []);
      canvasCtx.moveTo(plotArea.x, y);
      canvasCtx.lineTo(plotArea.x + plotArea.width, y);
      canvasCtx.stroke();
      canvasCtx.setLineDash([]);
    }
    if (side === "right" && axisConfig.grid?.show === true) {
      canvasCtx.beginPath();
      canvasCtx.setLineDash(axisConfig.grid?.style === "dashed" ? [4, 4] : []);
      canvasCtx.moveTo(plotArea.x, y);
      canvasCtx.lineTo(plotArea.x + plotArea.width, y);
      canvasCtx.stroke();
      canvasCtx.setLineDash([]);
    }
    let label;
    if (axisConfig.formatter) {
      label = axisConfig.formatter(isLog ? Math.pow(axisConfig.logBase || 10, tick) : tick);
    } else if (isLog) {
      label = formatLogTick(tick, axisConfig.logBase || 10);
    } else {
      label = Number.isInteger(tick) ? tick.toString() : parseFloat(tick.toFixed(6)).toString();
    }
    label = truncateLabel(canvasCtx, label, maxLabelWidth);
    canvasCtx.fillText(label, xPos, y);
    // 刻度短横：标签与绘图区之间的「20 –」式对位标记（参考云监控/大厂坐标轴）
    if (side === "left") {
      canvasCtx.strokeStyle = theme.gridColor;
      canvasCtx.lineWidth = 1;
      canvasCtx.beginPath();
      canvasCtx.moveTo(plotArea.x - 6, y);
      canvasCtx.lineTo(plotArea.x, y);
      canvasCtx.stroke();
    }
  });
  drawAxisLine(
    canvasCtx,
    axisConfig,
    theme,
    side === "left" ? plotArea.x : plotArea.x + plotArea.width,
    plotArea.y,
    side === "left" ? plotArea.x : plotArea.x + plotArea.width,
    plotArea.y + plotArea.height
  );
  if (axisConfig.title) {
    canvasCtx.save();
    canvasCtx.translate(side === "left" ? 15 : plotArea.x + plotArea.width + 45, plotArea.y + plotArea.height / 2);
    canvasCtx.rotate(side === "left" ? -Math.PI / 2 : Math.PI / 2);
    canvasCtx.textAlign = "center";
    canvasCtx.font = "13px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColor;
    canvasCtx.fillText(axisConfig.title, 0, 0);
    canvasCtx.restore();
  }
  canvasCtx.restore();
  return { min: actualMin, max: actualMax, tickValues };
}
function renderXAxis(ctx, centerAlign = false) {
  const { ctx: canvasCtx, theme, plotArea, options } = ctx;
  const xAxisConfig = options.xAxis || {};
  const labels = options.labels || [];
  if (xAxisConfig.show === false) return;
  if (xAxisConfig.type === "time") {
    renderTimeXAxis(ctx);
    return;
  }
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "12px Inter, sans-serif";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "top";
  const step = centerAlign ? plotArea.width / labels.length : plotArea.width / (labels.length - 1 || 1);
  const rotate = xAxisConfig.rotate || 0;
  // 拥挤三步策略（DESIGN §4）：显式 interval 是硬步长；否则按标签实测宽抽稀
  // （步距 ≥ 标签宽 + 12，首末必留），全量展示时单标签超步距再省略号截断；
  // 旋转时按旋转后占宽估抽稀，不自动旋转（排版决策归使用方）。
  const slot = centerAlign ? plotArea.width / (labels.length || 1) : plotArea.width / (labels.length - 1 || 1);
  let interval;
  if (typeof xAxisConfig.interval === "number") {
    interval = Math.max(1, Math.round(xAxisConfig.interval));
  } else {
    const maxW = labels.reduce((m, label) => {
      const text = xAxisConfig.formatter ? xAxisConfig.formatter(label) : label;
      return Math.max(m, canvasCtx.measureText(String(text)).width);
    }, 12);
    const usable = rotate !== 0 ? maxW * Math.sin(Math.min(60, Math.abs(rotate)) * Math.PI / 180) : maxW;
    interval = Math.max(1, Math.ceil((usable + 12) / slot));
    interval = Math.min(interval, Math.max(1, labels.length - 1));
  }
  const canTruncate = interval === 1 && rotate === 0 && typeof xAxisConfig.interval !== "number";
  labels.forEach((label, i) => {
    if (i % interval !== 0 && i !== labels.length - 1) return;
    const x = centerAlign ? plotArea.x + (i + 0.5) * step : plotArea.x + i * step;
    drawAxisTick(canvasCtx, xAxisConfig, theme, x, plotArea.y + plotArea.height, 0, 1);
    const formattedLabel = xAxisConfig.formatter ? xAxisConfig.formatter(label) : label;
    const displayLabel = canTruncate ? truncateLabel(canvasCtx, String(formattedLabel), slot - 8) : String(formattedLabel);
    if (rotate !== 0) {
      canvasCtx.save();
      canvasCtx.translate(x, plotArea.y + plotArea.height + 12);
      canvasCtx.rotate(-rotate * Math.PI / 180);
      canvasCtx.textAlign = "right";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(displayLabel, 0, 0);
      canvasCtx.restore();
    } else {
      canvasCtx.fillText(displayLabel, x, plotArea.y + plotArea.height + 10);
    }
  });
  drawAxisLine(
    canvasCtx,
    xAxisConfig,
    theme,
    plotArea.x,
    plotArea.y + plotArea.height,
    plotArea.x + plotArea.width,
    plotArea.y + plotArea.height
  );
  if (xAxisConfig.title) {
    canvasCtx.font = "13px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColor;
    canvasCtx.fillText(xAxisConfig.title, plotArea.x + plotArea.width / 2, plotArea.y + plotArea.height + 35);
  }
  canvasCtx.restore();
}
function renderTimeXAxis(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options } = ctx;
  const xAxisConfig = options.xAxis || {};
  const labels = options.labels || [];
  const timestamps = parseTimeLabels(labels);
  const valid = timestamps.filter((t) => !Number.isNaN(t));
  if (valid.length === 0) return;
  const min = xAxisConfig.min ?? minOf(valid);
  const max = xAxisConfig.max ?? maxOf(valid);
  const span = max - min || 1;
  const { values: tickTs, unit } = calculateTimeTicks(
    min,
    max,
    Math.max(3, Math.min(8, Math.floor(plotArea.width / 90)))
  );
  const toX = (ts) => plotArea.x + (ts - min) / span * plotArea.width;
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "12px Inter, sans-serif";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "top";
  tickTs.forEach((ts) => {
    const x = toX(ts);
    if (xAxisConfig.grid?.show === true) {
      canvasCtx.save();
      canvasCtx.strokeStyle = theme.gridColor;
      canvasCtx.setLineDash(xAxisConfig.grid?.style === "dashed" ? [4, 4] : []);
      canvasCtx.beginPath();
      canvasCtx.moveTo(x, plotArea.y);
      canvasCtx.lineTo(x, plotArea.y + plotArea.height);
      canvasCtx.stroke();
      canvasCtx.restore();
    }
    drawAxisTick(canvasCtx, xAxisConfig, theme, x, plotArea.y + plotArea.height, 0, 1);
    let label;
    if (typeof xAxisConfig.timeFormat === "function") label = xAxisConfig.timeFormat(new Date(ts));
    else if (xAxisConfig.formatter) label = xAxisConfig.formatter(formatTimeTick(ts, unit));
    else label = formatTimeTick(ts, unit);
    canvasCtx.fillText(
      truncateLabel(canvasCtx, label, plotArea.width / tickTs.length + 20),
      x,
      plotArea.y + plotArea.height + 10
    );
  });
  drawAxisLine(
    canvasCtx,
    xAxisConfig,
    theme,
    plotArea.x,
    plotArea.y + plotArea.height,
    plotArea.x + plotArea.width,
    plotArea.y + plotArea.height
  );
  if (xAxisConfig.title) {
    canvasCtx.font = "13px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColor;
    canvasCtx.fillText(xAxisConfig.title, plotArea.x + plotArea.width / 2, plotArea.y + plotArea.height + 35);
  }
  canvasCtx.restore();
}
function timeToX(options, plotArea, index) {
  const timestamps = parseTimeLabels(options.labels || []);
  const valid = timestamps.filter((t) => !Number.isNaN(t));
  if (valid.length === 0) return plotArea.x;
  const min = options.xAxis?.min ?? minOf(valid);
  const max = options.xAxis?.max ?? maxOf(valid);
  const span = max - min || 1;
  const ts = timestamps[index];
  if (Number.isNaN(ts)) return plotArea.x + index / ((options.labels?.length || 1) - 1 || 1) * plotArea.width;
  return plotArea.x + (ts - min) / span * plotArea.width;
}
function xToTimeIndex(options, plotArea, x) {
  const labels = options.labels || [];
  let nearest = -1;
  let minDist = Infinity;
  for (let i = 0; i < labels.length; i++) {
    const dist = Math.abs(timeToX(options, plotArea, i) - x);
    if (dist < minDist) {
      minDist = dist;
      nearest = i;
    }
  }
  return nearest;
}
function renderHorizontalAxis(ctx, dataRange) {
  const { ctx: canvasCtx, theme, plotArea, options } = ctx;
  const xAxisConfig = options.xAxis || {};
  const ticks = xAxisConfig.ticks || 5;
  const max = xAxisConfig.max ?? dataRange.max;
  const min = xAxisConfig.min ?? dataRange.min;
  const tickValues = calculateTicks(min, max, ticks);
  const actualMin = Math.min(min, tickValues[0] || min);
  const actualMax = Math.max(max, tickValues[tickValues.length - 1] || max);
  canvasCtx.save();
  canvasCtx.strokeStyle = theme.gridColor;
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "12px Inter, sans-serif";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "top";
  tickValues.forEach((tick) => {
    const x = plotArea.x + (tick - actualMin) / (actualMax - actualMin) * plotArea.width;
    if (xAxisConfig.grid?.show !== false) {
      canvasCtx.beginPath();
      canvasCtx.setLineDash(xAxisConfig.grid?.style === "dashed" ? [4, 4] : []);
      canvasCtx.moveTo(x, plotArea.y);
      canvasCtx.lineTo(x, plotArea.y + plotArea.height);
      canvasCtx.stroke();
      canvasCtx.setLineDash([]);
    }
    drawAxisTick(canvasCtx, xAxisConfig, theme, x, plotArea.y + plotArea.height, 0, 1);
    const label = xAxisConfig.formatter ? xAxisConfig.formatter(tick) : tick.toString();
    canvasCtx.fillText(label, x, plotArea.y + plotArea.height + 10);
  });
  drawAxisLine(
    canvasCtx,
    xAxisConfig,
    theme,
    plotArea.x,
    plotArea.y + plotArea.height,
    plotArea.x + plotArea.width,
    plotArea.y + plotArea.height
  );
  if (xAxisConfig.title) {
    canvasCtx.font = "13px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColor;
    canvasCtx.fillText(xAxisConfig.title, plotArea.x + plotArea.width / 2, plotArea.y + plotArea.height + 35);
  }
  canvasCtx.restore();
  return { min: actualMin, max: actualMax };
}
function isCategoryCentered(options) {
  return options.type === "bar" || options.type === "stacked-bar" || options.type === "waterfall";
}
function isTimeAxis(options) {
  return options.xAxis?.type === "time";
}
function categoryToX(options, plotArea, labels, index) {
  if (isTimeAxis(options)) return timeToX(options, plotArea, index);
  if (isCategoryCentered(options)) {
    const categoryWidth = plotArea.width / (labels.length || 1);
    return plotArea.x + (index + 0.5) * categoryWidth;
  }
  const step = plotArea.width / (labels.length - 1 || 1);
  return plotArea.x + index * step;
}
function xToCategoryIndex(options, plotArea, labels, x) {
  if (isTimeAxis(options)) return xToTimeIndex(options, plotArea, x);
  if (isCategoryCentered(options)) {
    const categoryWidth = plotArea.width / (labels.length || 1);
    return Math.floor((x - plotArea.x) / categoryWidth);
  }
  const step = plotArea.width / (labels.length - 1 || 1);
  return Math.round((x - plotArea.x) / step);
}
function renderAnnotations(ctx, yRange) {
  renderLegacyAnnotation(ctx, yRange);
  renderNarrativeAnnotations(ctx, yRange);
}
function renderLegacyAnnotation(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options } = ctx;
  const annotation = options.annotation;
  if (!annotation) return;
  const labels = options.labels || [];
  const resolveX = (x) => {
    const idx = typeof x === "number" ? x : labels.indexOf(x);
    if (idx < 0) return NaN;
    return categoryToX(options, plotArea, labels, idx);
  };
  const resolveY = (y) => {
    return plotArea.y + plotArea.height - (y - yRange.min) / (yRange.max - yRange.min) * plotArea.height;
  };
  annotation.texts?.forEach((t) => {
    const x = resolveX(t.x);
    const y = resolveY(t.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    canvasCtx.save();
    canvasCtx.fillStyle = t.color || theme.textColor;
    canvasCtx.font = `${t.fontSize || 12}px Inter, sans-serif`;
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "bottom";
    canvasCtx.fillText(t.content, x + (t.offsetX || 0), y + (t.offsetY || -6));
    canvasCtx.restore();
  });
  annotation.arrows?.forEach((a) => {
    const x1 = resolveX(a.fromX);
    const y1 = resolveY(a.fromY);
    const x2 = resolveX(a.toX);
    const y2 = resolveY(a.toY);
    if (![x1, y1, x2, y2].every(Number.isFinite)) return;
    const color = a.color || theme.colors[0] || "#175DFF";
    const lineWidth = a.lineWidth || 1.5;
    canvasCtx.save();
    canvasCtx.strokeStyle = color;
    canvasCtx.fillStyle = color;
    canvasCtx.lineWidth = lineWidth;
    canvasCtx.beginPath();
    canvasCtx.moveTo(x1, y1);
    canvasCtx.lineTo(x2, y2);
    canvasCtx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 8;
    canvasCtx.beginPath();
    canvasCtx.moveTo(x2, y2);
    canvasCtx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    canvasCtx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    canvasCtx.closePath();
    canvasCtx.fill();
    if (a.label) {
      canvasCtx.font = "11px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "bottom";
      canvasCtx.fillText(a.label, (x1 + x2) / 2, (y1 + y2) / 2 - 4);
    }
    canvasCtx.restore();
  });
}
const ANNOTATION_ANCHORS = {
  top: [0, -1, "center", "bottom"],
  bottom: [0, 1, "center", "top"],
  left: [-1, 0, "end", "middle"],
  right: [1, 0, "start", "middle"],
  "top-left": [-1, -1, "end", "bottom"],
  "top-right": [1, -1, "start", "bottom"],
  "bottom-left": [-1, 1, "end", "top"],
  "bottom-right": [1, 1, "start", "top"]
};
function resolveAnnotationX(ctx, x, xPx) {
  if (typeof xPx === "number") return xPx;
  const { plotArea, options } = ctx;
  const labels = options.labels || [];
  const idx = typeof x === "number" ? x : labels.indexOf(x);
  if (idx < 0) return NaN;
  return categoryToX(options, plotArea, labels, idx);
}
function resolveAnnotationY(ctx, y, yPx, yRange) {
  if (typeof yPx === "number") return yPx;
  if (typeof y !== "number" || !yRange) return NaN;
  const { plotArea } = ctx;
  return plotArea.y + plotArea.height - (y - yRange.min) / (yRange.max - yRange.min) * plotArea.height;
}
function annotationSeriesColor(ctx, ref) {
  const { theme, options } = ctx;
  const series = options.series || [];
  if (typeof ref === "number") {
    return series[ref]?.color || theme.colors[ref] || theme.colors[0] || "#175DFF";
  }
  if (typeof ref === "string") {
    const i = series.findIndex((s) => s.name === ref);
    if (i >= 0) return series[i].color || theme.colors[i] || theme.colors[0] || "#175DFF";
  }
  return theme.colors[0] || "#175DFF";
}
function renderNarrativeAnnotations(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options } = ctx;
  const list = options.annotations || [];
  if (list.length === 0) return;
  const secondary = theme.textColorSecondary;
  list.forEach((a) => {
    if (!a || !a.type) return;
    if (a.type === "region") {
      const x1 = resolveAnnotationX(ctx, a.from);
      const x2 = resolveAnnotationX(ctx, a.to);
      if (!Number.isFinite(x1) || !Number.isFinite(x2)) return;
      const labels = options.labels || [];
      const band = labels.length > 0 ? plotArea.width / labels.length : 0;
      const left = Math.min(x1, x2) - band / 2;
      const width = Math.abs(x2 - x1) + band;
      canvasCtx.save();
      canvasCtx.globalAlpha = 0.06;
      canvasCtx.fillStyle = a.color || theme.colors[0] || "#175DFF";
      canvasCtx.fillRect(left, plotArea.y, width, plotArea.height);
      canvasCtx.restore();
      if (a.label) {
        canvasCtx.save();
        canvasCtx.fillStyle = secondary;
        canvasCtx.font = "italic 400 11px Inter, sans-serif";
        canvasCtx.textAlign = "left";
        canvasCtx.textBaseline = "top";
        canvasCtx.fillText(a.label, left + 4, plotArea.y + 6);
        canvasCtx.restore();
      }
      return;
    }
    const px = resolveAnnotationX(ctx, a.x, a.xPx);
    const py = resolveAnnotationY(ctx, a.y, a.yPx, yRange);
    if (!Number.isFinite(px) || !Number.isFinite(py)) return;
    const color = a.color || annotationSeriesColor(ctx, a.series);
    canvasCtx.save();
    if (a.type === "point") {
      canvasCtx.fillStyle = color;
      canvasCtx.beginPath();
      canvasCtx.arc(px, py, 3, 0, Math.PI * 2);
      canvasCtx.fill();
      canvasCtx.globalAlpha = 0.85;
      canvasCtx.strokeStyle = color;
      canvasCtx.lineWidth = 1.5;
      canvasCtx.beginPath();
      canvasCtx.arc(px, py, 6, 0, Math.PI * 2);
      canvasCtx.stroke();
      canvasCtx.restore();
      return;
    }
    if (a.type === "delta") {
      const up = a.direction !== "down";
      const deltaColor = a.color || (up ? options.candleUpColor || "#dc2626" : options.candleDownColor || "#16a34a");
      const text = a.text || a.label || "";
      canvasCtx.fillStyle = deltaColor;
      canvasCtx.beginPath();
      if (up) {
        canvasCtx.moveTo(px, py - 16);
        canvasCtx.lineTo(px - 5, py - 9);
        canvasCtx.lineTo(px + 5, py - 9);
      } else {
        canvasCtx.moveTo(px, py + 16);
        canvasCtx.lineTo(px - 5, py + 9);
        canvasCtx.lineTo(px + 5, py + 9);
      }
      canvasCtx.closePath();
      canvasCtx.fill();
      if (text) {
        canvasCtx.fillStyle = deltaColor;
        canvasCtx.font = "600 11px Inter, sans-serif";
        canvasCtx.textAlign = "center";
        if (up) {
          canvasCtx.textBaseline = "bottom";
          canvasCtx.fillText(text, px, py - 20);
        } else {
          canvasCtx.textBaseline = "top";
          canvasCtx.fillText(text, px, py + 20);
        }
      }
      canvasCtx.restore();
      return;
    }
    if (a.type === "callout") {
      const [dx, dy, align, baseline] = ANNOTATION_ANCHORS[a.anchor] || ANNOTATION_ANCHORS["top-right"];
      const lx = px + dx * 16 + (a.offsetX || 0);
      const ly = py + dy * 16 + (a.offsetY || 0);
      canvasCtx.fillStyle = color;
      canvasCtx.strokeStyle = color;
      canvasCtx.lineWidth = 1;
      canvasCtx.setLineDash([3, 3]);
      canvasCtx.beginPath();
      canvasCtx.arc(px, py, 2, 0, Math.PI * 2);
      canvasCtx.fill();
      canvasCtx.beginPath();
      canvasCtx.moveTo(px + dx * 2, py + dy * 2);
      canvasCtx.lineTo(lx - dx * 2, ly - dy * 2);
      canvasCtx.stroke();
      canvasCtx.setLineDash([]);
      if (a.label) {
        canvasCtx.fillStyle = a.textColor || secondary;
        canvasCtx.font = "italic 400 11px Inter, sans-serif";
        canvasCtx.textAlign = align;
        canvasCtx.textBaseline = baseline;
        canvasCtx.fillText(a.label, lx + dx * 2, ly + dy * 2);
      }
      canvasCtx.restore();
      return;
    }
    canvasCtx.fillStyle = a.color || secondary;
    canvasCtx.font = `italic ${a.fontWeight || 400} 11px Inter, sans-serif`;
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "bottom";
    canvasCtx.fillText(a.text || a.label || "", px + (a.offsetX || 0), py + (a.offsetY !== undefined ? a.offsetY : -6));
    canvasCtx.restore();
  });
}
function renderHoverHighlight(ctx, points) {
  if (ctx.hoverIndex < 0) return;
  const { ctx: canvasCtx, theme, plotArea } = ctx;
  const firstSeries = points[0];
  if (!firstSeries || ctx.hoverIndex >= firstSeries.length) return;
  const hovered = firstSeries[ctx.hoverIndex];
  if (!Number.isFinite(hovered[0])) return;
  const hx = hovered[0];
  canvasCtx.save();
  canvasCtx.fillStyle = theme.highlightColor;
  canvasCtx.fillRect(hx - 15, plotArea.y, 30, plotArea.height);
  canvasCtx.restore();
}
function renderMarkLines(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options, valueFormatter } = ctx;
  const markLines = options.markLines || [];
  if (markLines.length === 0) return;
  const isLog = options.__logBase;
  markLines.forEach((line) => {
    canvasCtx.save();
    canvasCtx.strokeStyle = line.color || theme.textColorSecondary;
    canvasCtx.lineWidth = line.width || 1;
    canvasCtx.setLineDash(line.style === "dashed" ? [6, 4] : []);
    if (line.y !== void 0) {
      const y = plotArea.y + plotArea.height - (line.y - yRange.min) / (yRange.max - yRange.min) * plotArea.height;
      canvasCtx.beginPath();
      canvasCtx.moveTo(plotArea.x, y);
      canvasCtx.lineTo(plotArea.x + plotArea.width, y);
      canvasCtx.stroke();
      if (line.label) {
        canvasCtx.setLineDash([]);
        canvasCtx.fillStyle = line.color || theme.textColorSecondary;
        canvasCtx.font = "11px Inter, sans-serif";
        canvasCtx.textAlign = "right";
        canvasCtx.textBaseline = "bottom";
        const displayValue = isLog ? Math.pow(isLog, line.y) : line.y;
        canvasCtx.fillText(`${line.label}: ${valueFormatter(displayValue)}`, plotArea.x + plotArea.width - 4, y - 2);
      }
    } else if (line.x !== void 0) {
      const labels = options.labels || [];
      const xIndex = typeof line.x === "number" ? line.x : labels.indexOf(line.x);
      if (xIndex < 0) {
        canvasCtx.restore();
        return;
      }
      const x = categoryToX(options, plotArea, labels, xIndex);
      canvasCtx.beginPath();
      canvasCtx.moveTo(x, plotArea.y);
      canvasCtx.lineTo(x, plotArea.y + plotArea.height);
      canvasCtx.stroke();
      if (line.label) {
        canvasCtx.setLineDash([]);
        canvasCtx.fillStyle = line.color || theme.textColorSecondary;
        canvasCtx.font = "11px Inter, sans-serif";
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "top";
        canvasCtx.fillText(line.label, x, plotArea.y + 2);
      }
    }
    canvasCtx.restore();
  });
}
function renderMarkAreas(ctx) {
  const { ctx: canvasCtx, plotArea, options } = ctx;
  const markAreas = options.markAreas || [];
  if (markAreas.length === 0) return;
  const labels = options.labels || [];
  markAreas.forEach((area) => {
    let startX;
    let endX;
    if (isCategoryCentered(options)) {
      const categoryWidth = plotArea.width / (labels.length || 1);
      startX = plotArea.x + area.startIndex * categoryWidth;
      endX = plotArea.x + (area.endIndex + 1) * categoryWidth;
    } else {
      startX = categoryToX(options, plotArea, labels, area.startIndex);
      endX = categoryToX(options, plotArea, labels, area.endIndex);
    }
    canvasCtx.save();
    canvasCtx.fillStyle = area.color || "rgba(23, 93, 255, 0.08)";
    canvasCtx.fillRect(startX, plotArea.y, endX - startX, plotArea.height);
    if (area.label) {
      canvasCtx.fillStyle = options.theme?.textColorSecondary || "#6b7280";
      canvasCtx.font = "11px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "top";
      canvasCtx.fillText(area.label, (startX + endX) / 2, plotArea.y + 4);
    }
    canvasCtx.restore();
  });
}
function renderCrosshair(ctx, points) {
  if (!ctx.showCrosshair || ctx.hoverIndex < 0) return;
  const { ctx: canvasCtx, theme, plotArea, options } = ctx;
  let hx = NaN;
  let hy = NaN;
  for (const series of points) {
    const p = series[ctx.hoverIndex];
    if (p && Number.isFinite(p[0])) {
      hx = p[0];
      hy = p[1];
      break;
    }
  }
  if (!Number.isFinite(hx)) return;
  const crosshairStyle = options.tooltip?.crosshairStyle || {};
  const color = crosshairStyle.color || theme.crosshairColor;
  canvasCtx.save();
  canvasCtx.strokeStyle = color;
  canvasCtx.lineWidth = crosshairStyle.width || 1;
  canvasCtx.setLineDash(crosshairStyle.style === "solid" ? [] : [4, 4]);
  canvasCtx.beginPath();
  canvasCtx.moveTo(hx, plotArea.y);
  canvasCtx.lineTo(hx, plotArea.y + plotArea.height);
  canvasCtx.stroke();
  if (options.crosshairUnified && Number.isFinite(hy)) {
    canvasCtx.beginPath();
    canvasCtx.moveTo(plotArea.x, hy);
    canvasCtx.lineTo(plotArea.x + plotArea.width, hy);
    canvasCtx.stroke();
  }
  canvasCtx.restore();
}
export {
  categoryToX,
  isCategoryCentered,
  renderAnnotations,
  renderCrosshair,
  renderHorizontalAxis,
  renderHoverHighlight,
  renderMarkAreas,
  renderMarkLines,
  renderXAxis,
  renderYAxis,
  thinTickValues,
  timeToX,
  xToCategoryIndex,
  xToTimeIndex
};
