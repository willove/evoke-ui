import {
  roundRect,
  drawLabelWithBg,
  calculateTicks,
  getContrastText,
  mixColor,
  buildSeriesColorIndex,
  isMissingValue
} from "./core";
import { INTERACTION } from "../interactions";
function sturgesBinCount(n) {
  return Math.max(3, Math.ceil(Math.log2(n) + 1));
}
function computeBins(options, hiddenSeries) {
  const binConfig = options.binConfig || {};
  const visibleSeries = (options.series || []).filter((s) => !hiddenSeries.has(s.name));
  const allValues = [];
  visibleSeries.forEach((s) => allValues.push(...s.data.filter((v) => !isMissingValue(v))));
  if (allValues.length === 0) return null;
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const range = dataMax - dataMin || 1;
  let bins;
  if (binConfig.bins && binConfig.bins.length > 1) {
    bins = binConfig.bins;
  } else {
    const count = binConfig.binCount || sturgesBinCount(allValues.length);
    const step = range / count;
    bins = [];
    for (let i = 0; i <= count; i++) bins.push(dataMin + i * step);
  }
  const frequencies = new Array(bins.length - 1).fill(0);
  allValues.forEach((v) => {
    for (let i = 0; i < bins.length - 1; i++) {
      if (v >= bins[i] && (v < bins[i + 1] || i === bins.length - 2 && v <= bins[i + 1])) {
        frequencies[i]++;
        break;
      }
    }
  });
  const density = binConfig.density;
  const displayValues = density ? frequencies.map((f, i) => f / (bins[i + 1] - bins[i])) : frequencies;
  return { bins, frequencies, displayValues };
}
function renderBinChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, valueFormatter } = ctx;
  const result = computeBins(options, ctx.hiddenSeries);
  if (!result) return;
  const { bins, frequencies, displayValues } = result;
  const dataMin = bins[0];
  const dataMax = bins[bins.length - 1];
  const range = dataMax - dataMin || 1;
  const maxFreq = Math.max(...displayValues, 1);
  const binCount = bins.length - 1;
  const barGap = 2;
  const barWidth = (plotArea.width - barGap * (binCount - 1)) / binCount;
  const yTicks = calculateTicks(0, maxFreq, 5);
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "12px Inter, sans-serif";
  canvasCtx.textAlign = "right";
  canvasCtx.textBaseline = "middle";
  canvasCtx.strokeStyle = theme.gridColor;
  yTicks.forEach((tick) => {
    const y = plotArea.y + plotArea.height - tick / maxFreq * plotArea.height;
    canvasCtx.setLineDash([4, 4]);
    canvasCtx.beginPath();
    canvasCtx.moveTo(plotArea.x, y);
    canvasCtx.lineTo(plotArea.x + plotArea.width, y);
    canvasCtx.stroke();
    canvasCtx.fillText(
      Number.isInteger(tick) ? tick.toString() : parseFloat(tick.toFixed(2)).toString(),
      plotArea.x - 10,
      y
    );
  });
  canvasCtx.setLineDash([]);
  canvasCtx.restore();
  displayValues.forEach((freq, i) => {
    const x = plotArea.x + i * (barWidth + barGap);
    const barHeight = freq / maxFreq * plotArea.height * progress;
    const y = plotArea.y + plotArea.height - barHeight;
    const isHover = i === hoverIndex;
    const color = theme.colors[0];
    canvasCtx.save();
    roundRect(canvasCtx, x, y, barWidth, Math.max(0, barHeight), 2);
    canvasCtx.fillStyle = isHover ? color + "dd" : color;
    canvasCtx.fill();
    if (isHover) {
      canvasCtx.fillStyle = "rgba(255,255,255,0.3)";
      canvasCtx.fillRect(x, y, barWidth, Math.min(6, barHeight));
    }
    canvasCtx.restore();
    if (i % Math.max(1, Math.floor(binCount / 10)) === 0 || i === binCount - 1) {
      canvasCtx.save();
      canvasCtx.fillStyle = theme.textColorSecondary;
      canvasCtx.font = "11px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "top";
      const labelDecimals = Math.max(0, Math.min(4, Math.ceil(-Math.log10(range / binCount))));
      canvasCtx.fillText(bins[i].toFixed(labelDecimals), x, plotArea.y + plotArea.height + 6);
      if (i === binCount - 1) {
        canvasCtx.fillText(bins[i + 1].toFixed(labelDecimals), x + barWidth, plotArea.y + plotArea.height + 6);
      }
      canvasCtx.restore();
    }
    if (isHover && progress > 0.9) {
      drawLabelWithBg(canvasCtx, valueFormatter(frequencies[i]), x + barWidth / 2, y, theme);
    }
  });
}
function renderBulletChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, valueFormatter } = ctx;
  const bulletData = options.bulletData || [];
  if (bulletData.length === 0) return;
  const allValues = [];
  bulletData.forEach((b) => {
    allValues.push(b.value);
    if (b.target !== void 0) allValues.push(b.target);
    b.ranges?.forEach((r) => {
      allValues.push(r.from, r.to);
    });
  });
  const maxVal = Math.max(...allValues, 0);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;
  const padMin = minVal >= 0 ? 0 : minVal - range * 0.1;
  const padMax = maxVal + range * 0.1;
  const rowHeight = plotArea.height / bulletData.length;
  const bulletHeight = Math.min(40, rowHeight * 0.45);
  const labelWidth = 80;
  bulletData.forEach((bullet, idx) => {
    const yCenter = plotArea.y + (idx + 0.5) * rowHeight;
    const isHover = idx === hoverIndex;
    const drawLeft = plotArea.x + labelWidth;
    const drawWidth = plotArea.width - labelWidth - 20;
    if (bullet.ranges && bullet.ranges.length > 0) {
      const rangeColors = ["#e8f0ff", "#d0e1ff", "#b9d2ff"];
      bullet.ranges.forEach((r, ri) => {
        const x1 = drawLeft + (r.from - padMin) / (padMax - padMin) * drawWidth;
        const x2 = drawLeft + (r.to - padMin) / (padMax - padMin) * drawWidth;
        canvasCtx.save();
        canvasCtx.fillStyle = r.color || rangeColors[ri % rangeColors.length];
        roundRect(canvasCtx, x1, yCenter - bulletHeight / 2, Math.max(0, x2 - x1), bulletHeight, 3);
        canvasCtx.fill();
        canvasCtx.restore();
      });
    } else {
      canvasCtx.save();
      canvasCtx.fillStyle = theme.gridColor;
      roundRect(canvasCtx, drawLeft, yCenter - bulletHeight / 2, drawWidth, bulletHeight, 3);
      canvasCtx.fill();
      canvasCtx.restore();
    }
    const valueWidth = (bullet.value - padMin) / (padMax - padMin) * drawWidth * progress;
    const barH = bulletHeight * 0.4;
    canvasCtx.save();
    const valueColor = bullet.color || theme.colors[0];
    canvasCtx.fillStyle = isHover ? valueColor : valueColor + "dd";
    roundRect(canvasCtx, drawLeft, yCenter - barH / 2, Math.max(0, valueWidth), barH, 2);
    canvasCtx.fill();
    canvasCtx.restore();
    if (bullet.target !== void 0) {
      const targetX = drawLeft + (bullet.target - padMin) / (padMax - padMin) * drawWidth * Math.min(progress * 1.5, 1);
      canvasCtx.save();
      canvasCtx.strokeStyle = "#dc2626";
      canvasCtx.lineWidth = 2;
      canvasCtx.beginPath();
      canvasCtx.moveTo(targetX, yCenter - bulletHeight / 2 - 4);
      canvasCtx.lineTo(targetX, yCenter + bulletHeight / 2 + 4);
      canvasCtx.stroke();
      canvasCtx.restore();
    }
    canvasCtx.save();
    canvasCtx.fillStyle = isHover ? theme.textColor : theme.textColorSecondary;
    canvasCtx.font = isHover ? "bold 12px Inter, sans-serif" : "12px Inter, sans-serif";
    canvasCtx.textAlign = "right";
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText(bullet.name, drawLeft - 8, yCenter);
    canvasCtx.restore();
    if (progress > 0.8) {
      canvasCtx.save();
      canvasCtx.fillStyle = theme.textColor;
      canvasCtx.font = "bold 12px Inter, sans-serif";
      canvasCtx.textAlign = "left";
      const valText = valueFormatter(bullet.value) + (bullet.target !== void 0 ? ` / ${valueFormatter(bullet.target)}` : "");
      canvasCtx.fillText(valText, drawLeft + drawWidth + 8, yCenter);
      canvasCtx.restore();
    }
    if (idx === bulletData.length - 1) {
      canvasCtx.save();
      canvasCtx.fillStyle = theme.textColorSecondary;
      canvasCtx.font = "11px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "top";
      const ticks = calculateTicks(padMin, padMax, 5);
      ticks.forEach((tick) => {
        const x = drawLeft + (tick - padMin) / (padMax - padMin) * drawWidth;
        canvasCtx.fillText(valueFormatter(tick), x, plotArea.y + plotArea.height + 4);
      });
      canvasCtx.restore();
    }
  });
}
/** 父节点 value 缺省时由子节点（递归）汇总 */
function treemapValueOf(node) {
  if (typeof node.value === "number" && Number.isFinite(node.value)) return node.value;
  if (Array.isArray(node.children) && node.children.length > 0) {
    return node.children.reduce((s, c) => s + treemapValueOf(c), 0);
  }
  return 0;
}
function normalizeTreemapNode(node) {
  const children = Array.isArray(node.children) && node.children.length > 0
    ? node.children.map(normalizeTreemapNode)
    : node.children;
  return { ...node, value: treemapValueOf(node), ...(children ? { children } : {}) };
}
function squarifyTreemap(nodes, x, y, w, h, depth, result) {
  if (nodes.length === 0) return result;
  // 入口处归一化：父节点 value 缺省时按子节点汇总，否则 total 为 NaN、整图空白
  if (depth === 0) {
    nodes = nodes.map(normalizeTreemapNode);
  }
  const total = nodes.reduce((s, n) => s + n.value, 0);
  if (total <= 0) return result;
  const sorted = [...nodes].sort((a, b) => b.value - a.value);
  const horizontal = w >= h;
  let offset = 0;
  sorted.forEach((n) => {
    const ratio = n.value / total;
    const colorSeed = depth === 0 ? sorted.indexOf(n) : (n._colorSeed ?? 0);
    if (horizontal) {
      const childW = w * ratio;
      result.push({ x: x + offset, y, w: childW, h, node: n, depth, colorSeed });
      if (n.children && n.children.length > 0) {
        squarifyTreemap(n.children.map((c) => ({ ...c, _colorSeed: colorSeed })), x + offset + 2, y + 2, childW - 4, h - 4, depth + 1, result);
      }
      offset += childW;
    } else {
      const childH = h * ratio;
      result.push({ x, y: y + offset, w, h: childH, node: n, depth, colorSeed });
      if (n.children && n.children.length > 0) {
        squarifyTreemap(n.children.map((c) => ({ ...c, _colorSeed: colorSeed })), x + 2, y + offset + 2, w - 4, childH - 4, depth + 1, result);
      }
      offset += childH;
    }
  });
  return result;
}
// 与旭日图同一套层级强调：悬浮时自身与子孙原色、其余淡出（档位见 interactions.js）
const TREEMAP_DIM_ALPHA = INTERACTION.hierarchyDimAlpha;
function isRectWithinFocus(rect, focus) {
  return (
    rect.depth >= focus.depth &&
    rect.x >= focus.x - 0.5 &&
    rect.y >= focus.y - 0.5 &&
    rect.x + rect.w <= focus.x + focus.w + 0.5 &&
    rect.y + rect.h <= focus.y + focus.h + 0.5
  );
}
function renderTreemapChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, valueFormatter, hoverAnimProgress = 1 } = ctx;
  const rootData = options.treemapData || [];
  if (rootData.length === 0) return;
  const rects = [];
  squarifyTreemap(rootData, plotArea.x, plotArea.y, plotArea.width, plotArea.height, 0, rects);
  const totalValue = rootData.reduce((s, n) => s + treemapValueOf(n), 0);
  const scale = progress;
  const focus = hoverIndex >= 0 && hoverIndex < rects.length ? rects[hoverIndex] : null;
  const dimAlpha = 1 - (1 - TREEMAP_DIM_ALPHA) * hoverAnimProgress;
  function drawRect(rect, isFocusRoot) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const aw = rect.w * scale;
    const ah = rect.h * scale;
    const ax = cx - aw / 2;
    const ay = cy - ah / 2;
    const base = rect.node.color || theme.colors[(rect.colorSeed + rect.depth) % theme.colors.length];
    // 被悬浮块加深一档；非焦块淡出——不画阴影、不加描边
    const color = isFocusRoot ? mixColor(base, 0.08, "#000000") : base;
    canvasCtx.save();
    canvasCtx.globalAlpha = !focus || isRectWithinFocus(rect, focus) ? 1 : dimAlpha;
    canvasCtx.fillStyle = isFocusRoot ? color : color + (rect.depth === 0 ? "" : "cc");
    roundRect(canvasCtx, ax, ay, Math.max(0, aw), Math.max(0, ah), 3);
    canvasCtx.fill();
    canvasCtx.strokeStyle = theme.backgroundColor;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
    canvasCtx.restore();
    if (progress > 0.8 && aw > 50 && ah > 24) {
      canvasCtx.save();
      canvasCtx.globalAlpha = !focus || isRectWithinFocus(rect, focus) ? 1 : dimAlpha;
      canvasCtx.fillStyle = getContrastText(color);
      if (rect.node.children && rect.node.children.length > 0) {
        canvasCtx.font = "bold 11px Inter, sans-serif";
        canvasCtx.textAlign = "left";
        canvasCtx.textBaseline = "top";
        canvasCtx.fillText(rect.node.name, ax + 8, ay + 6);
      } else {
        canvasCtx.font = rect.depth === 0 ? "bold 15px Inter, sans-serif" : "11px Inter, sans-serif";
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "middle";
        canvasCtx.fillText(rect.node.name, ax + aw / 2, ay + ah / 2 - 6);
        if (ah > 36) {
          canvasCtx.font = rect.depth === 0 ? "12px Inter, sans-serif" : "10px Inter, sans-serif";
          const percentage = (rect.node.value / totalValue * 100).toFixed(1);
          canvasCtx.fillText(`${valueFormatter(rect.node.value)} (${percentage}%)`, ax + aw / 2, ay + ah / 2 + 10);
        }
      }
      canvasCtx.restore();
    }
  }
  rects.forEach((rect) => drawRect(rect, focus === rect));
}
function renderSparklineChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex } = ctx;
  const visibleSeries = (options.series || []).filter((s) => !ctx.hiddenSeries.has(s.name));
  if (visibleSeries.length === 0) return [];
  const allPoints = [];
  const seriesColorIdx = buildSeriesColorIndex(options.series || []);
  visibleSeries.forEach((series) => {
    const color = series.color || theme.colors[(seriesColorIdx.get(series) ?? 0) % theme.colors.length];
    const data = series.data;
    if (data.length === 0) return;
    const valid = data.filter((v) => !isMissingValue(v));
    if (valid.length === 0) return;
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const range = max - min || 1;
    const points = [];
    const pointByIndex = [];
    data.forEach((v, i) => {
      if (isMissingValue(v)) {
        pointByIndex.push(null);
        return;
      }
      const x = plotArea.x + i / (data.length - 1 || 1) * plotArea.width;
      const y = plotArea.y + plotArea.height - (v - min) / range * (plotArea.height - 10) - 5;
      const p = [x, y];
      points.push(p);
      pointByIndex.push(p);
    });
    if (points.length === 0) return;
    allPoints.push(pointByIndex.map((p) => p || [NaN, NaN]));
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.rect(plotArea.x, plotArea.y, plotArea.width * progress, plotArea.height);
    canvasCtx.clip();
    const showArea = options.sparklineArea !== false;
    if (showArea) {
      canvasCtx.save();
      canvasCtx.beginPath();
      canvasCtx.moveTo(points[0][0], plotArea.y + plotArea.height);
      canvasCtx.lineTo(points[0][0], points[0][1]);
      if (options.sparklineSmooth && points.length > 2) {
        for (let i = 0; i < points.length - 1; i++) {
          const cp1x = points[i][0] + (points[i + 1][0] - points[i][0]) / 3;
          const cp1y = points[i][1];
          const cp2x = points[i + 1][0] - (points[i + 1][0] - points[i][0]) / 3;
          const cp2y = points[i + 1][1];
          canvasCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1][0], points[i + 1][1]);
        }
      } else {
        for (let i = 1; i < points.length; i++) {
          canvasCtx.lineTo(points[i][0], points[i][1]);
        }
      }
      canvasCtx.lineTo(points[points.length - 1][0], plotArea.y + plotArea.height);
      canvasCtx.closePath();
      const gradient = canvasCtx.createLinearGradient(0, plotArea.y, 0, plotArea.y + plotArea.height);
      gradient.addColorStop(0, color + "50");
      gradient.addColorStop(1, color + "05");
      canvasCtx.fillStyle = gradient;
      canvasCtx.fill();
      canvasCtx.restore();
    }
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.strokeStyle = color;
    canvasCtx.lineWidth = series.lineWidth || 1.5;
    canvasCtx.lineJoin = "round";
    canvasCtx.lineCap = "round";
    if (options.sparklineSmooth && points.length > 2) {
      canvasCtx.moveTo(points[0][0], points[0][1]);
      for (let i = 0; i < points.length - 1; i++) {
        const cp1x = points[i][0] + (points[i + 1][0] - points[i][0]) / 3;
        const cp1y = points[i][1];
        const cp2x = points[i + 1][0] - (points[i + 1][0] - points[i][0]) / 3;
        const cp2y = points[i + 1][1];
        canvasCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1][0], points[i + 1][1]);
      }
    } else {
      points.forEach((p, i) => {
        if (i === 0) canvasCtx.moveTo(p[0], p[1]);
        else canvasCtx.lineTo(p[0], p[1]);
      });
    }
    canvasCtx.stroke();
    canvasCtx.restore();
    canvasCtx.restore();
    if (progress > 0.95) {
      const last = points[points.length - 1];
      canvasCtx.save();
      canvasCtx.beginPath();
      canvasCtx.arc(last[0], last[1], 3, 0, Math.PI * 2);
      canvasCtx.fillStyle = color;
      canvasCtx.fill();
      if (hoverIndex >= 0 && hoverIndex < pointByIndex.length && pointByIndex[hoverIndex]) {
        const hp = pointByIndex[hoverIndex];
        canvasCtx.beginPath();
        canvasCtx.strokeStyle = color + "60";
        canvasCtx.lineWidth = 1;
        canvasCtx.setLineDash([3, 3]);
        canvasCtx.moveTo(hp[0], plotArea.y);
        canvasCtx.lineTo(hp[0], plotArea.y + plotArea.height);
        canvasCtx.stroke();
        canvasCtx.setLineDash([]);
        canvasCtx.beginPath();
        canvasCtx.arc(hp[0], hp[1], 4, 0, Math.PI * 2);
        canvasCtx.fillStyle = theme.backgroundColor;
        canvasCtx.strokeStyle = color;
        canvasCtx.lineWidth = 2;
        canvasCtx.fill();
        canvasCtx.stroke();
      }
      canvasCtx.restore();
    }
  });
  return allPoints;
}
export {
  computeBins,
  renderBinChart,
  renderBulletChart,
  renderSparklineChart,
  renderTreemapChart,
  squarifyTreemap
};
