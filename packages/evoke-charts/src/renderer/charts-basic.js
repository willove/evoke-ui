import { CHART_COLORS, getSeriesColors } from "../types";
import {
  drawLabelWithBg,
  estimateTextWidth,
  mixColor,
  resolveStackGroups,
  buildSeriesColorIndex,
  isMissingValue,
  resolveConnectNulls,
  focusAlpha,
  drawSymbol,
  resolveLineDash,
  layoutLabelsAvoidOverlap
} from "./core";
import { categoryToX } from "./axes";
import {
  CALLOUT_RADIAL_LEN as PIE_RADIAL_LEN,
  CALLOUT_STUB_LEN as PIE_STUB_LEN,
  CALLOUT_TEXT_GAP as PIE_TEXT_GAP,
  drawCalloutLabels
} from "./calloutLabels";
function computePieMaxRadius(pieData, options, plotArea) {
  const total = pieData.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return 30;
  const percentMode = options.piePercentMode === true;
  const texts = pieData.map((d) => {
    const pct = (d.value / total * 100).toFixed(1);
    return percentMode ? `${pct}%` : `${d.label || ""} (${pct}%)`;
  });
  const maxTextWidth = Math.max(40, ...texts.map((t) => estimateTextWidth(t, 12)));
  const horizNeed = PIE_RADIAL_LEN + PIE_STUB_LEN + PIE_TEXT_GAP + maxTextWidth + 10;
  return Math.max(30, Math.min(Math.min(plotArea.width, plotArea.height) / 2 - 20, plotArea.width / 2 - horizNeed));
}
function alphaHex(opacity) {
  return Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, "0");
}
/** 单调三次插值切线（Fritsch–Carlson 限幅）：平滑但不过冲，曲线必过每个数据点 */
function monotoneTangents(pts) {
  const n = pts.length;
  const m = new Array(n).fill(0);
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tk = 3 / Math.sqrt(s);
      m[i] = tk * a * d[i];
      m[i + 1] = tk * b * d[i];
    }
  }
  return m;
}
function renderLineChart(ctx, yRange, side = "left") {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hiddenSeries, valueFormatter } = ctx;
  const allPoints = [];
  const isStackedArea = options.type === "area" && options.stackAreas === true;
  const stackedSeries = isStackedArea ? options.series.filter(
    (series) => !hiddenSeries.has(series.name) && (series.yAxis === side || side === "left" && series.yAxis !== "right")
  ) : [];
  const entries = options.series.map((series, gi) => ({ series, gi })).filter((e) => {
    const { series } = e;
    if (options.type === "mixed" && (series.chartType || "line") !== "line") return false;
    return !hiddenSeries.has(series.name) && (series.yAxis === side || side === "left" && series.yAxis !== "right");
  }).sort((a, b) => isStackedArea ? 0 : (a.series.z ?? 0) - (b.series.z ?? 0));
  entries.forEach((e, filteredIndex) => {
    const { series, gi } = e;
    const color = series.color || theme.colors[gi % theme.colors.length];
    const alpha = focusAlpha(ctx, series.name);
    const points = [];
    const cumulative = isStackedArea ? stackedSeries.slice(0, filteredIndex + 1).map((s) => s.data) : null;
    series.data.forEach((value, i) => {
      const x = categoryToX(options, plotArea, options.labels || [], i);
      if (isMissingValue(value)) {
        points.push(null);
        return;
      }
      let valueForY = value;
      if (cumulative) {
        valueForY = cumulative.reduce((sum, data) => sum + (data[i] || 0), 0);
      }
      const delta = (valueForY - yRange.min) * (isStackedArea ? progress : 1);
      const animatedValue = isStackedArea ? yRange.min + delta : yRange.min + (value - yRange.min) * progress;
      const y = plotArea.y + plotArea.height - (animatedValue - yRange.min) / (yRange.max - yRange.min) * plotArea.height;
      points.push([x, y]);
    });
    allPoints.push(points.map((p) => p || [NaN, NaN]));
    const connect = resolveConnectNulls(options, series);
    const segments = [];
    let currentPts = [];
    let currentIdxs = [];
    points.forEach((p, i) => {
      if (p) {
        currentPts.push(p);
        currentIdxs.push(i);
      } else if (currentPts.length > 0 && !connect) {
        segments.push({ pts: currentPts, idxs: currentIdxs });
        currentPts = [];
        currentIdxs = [];
      }
    });
    if (currentPts.length > 0) segments.push({ pts: currentPts, idxs: currentIdxs });
    if (segments.length === 0) return;
    const step = series.step || options.step;
    const smooth = !!(series.smooth ?? options.smooth);
    const tracePath = (pts, startMove) => {
      startMove(canvasCtx, pts[0]);
      if (smooth && pts.length > 2) {
        // 单调三次插值：过点、无过冲；控制点横向各取 1/3 段长
        const m = monotoneTangents(pts);
        for (let i = 0; i < pts.length - 1; i++) {
          const x0 = pts[i][0];
          const y0 = pts[i][1];
          const x1 = pts[i + 1][0];
          const y1 = pts[i + 1][1];
          const h = (x1 - x0) / 3;
          canvasCtx.bezierCurveTo(x0 + h, y0 + h * m[i], x1 - h, y1 - h * m[i + 1], x1, y1);
        }
        return;
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const curr = pts[i];
        const next = pts[i + 1];
        if (step) {
          if (step === "start") {
            canvasCtx.lineTo(next[0], curr[1]);
            canvasCtx.lineTo(next[0], next[1]);
          } else if (step === "end") {
            canvasCtx.lineTo(curr[0], next[1]);
            canvasCtx.lineTo(next[0], next[1]);
          } else {
            const midX = (curr[0] + next[0]) / 2;
            canvasCtx.lineTo(midX, curr[1]);
            canvasCtx.lineTo(midX, next[1]);
            canvasCtx.lineTo(next[0], next[1]);
          }
        } else {
          canvasCtx.lineTo(next[0], next[1]);
        }
      }
    };
    canvasCtx.save();
    canvasCtx.globalAlpha = alpha;
    if (series.area || options.type === "area") {
      const clipWidth = plotArea.width * progress;
      canvasCtx.save();
      canvasCtx.beginPath();
      canvasCtx.rect(plotArea.x, plotArea.y - 10, clipWidth, plotArea.height + 20);
      canvasCtx.clip();
      segments.forEach(({ pts: seg, idxs }) => {
        canvasCtx.beginPath();
        const baseValue = isStackedArea && filteredIndex > 0 ? stackedSeries.slice(0, filteredIndex).reduce((sum, s) => sum + (s.data[0] || 0), 0) : yRange.min;
        const baseY = isStackedArea && filteredIndex > 0 ? plotArea.y + plotArea.height - (baseValue - yRange.min) * progress / (yRange.max - yRange.min) * plotArea.height : plotArea.y + plotArea.height;
        canvasCtx.moveTo(seg[0][0], baseY);
        canvasCtx.lineTo(seg[0][0], seg[0][1]);
        tracePath(seg, (c, p) => c.lineTo(p[0], p[1]));
        if (isStackedArea && filteredIndex > 0) {
          for (let i = seg.length - 1; i >= 0; i--) {
            const di = idxs[i];
            const baseVal = stackedSeries.slice(0, filteredIndex).reduce((sum, s) => sum + (s.data[di] || 0), 0);
            const by = plotArea.y + plotArea.height - (baseVal - yRange.min) * progress / (yRange.max - yRange.min) * plotArea.height;
            canvasCtx.lineTo(seg[i][0], by);
          }
        } else {
          canvasCtx.lineTo(seg[seg.length - 1][0], plotArea.y + plotArea.height);
        }
        canvasCtx.closePath();
        if (series.areaOpacity !== void 0) {
          canvasCtx.fillStyle = color + alphaHex(series.areaOpacity);
        } else {
          const gradientTop = seg.reduce((minY, p) => Math.min(minY, p[1]), Infinity);
          const gradient = canvasCtx.createLinearGradient(0, gradientTop, 0, baseY);
          gradient.addColorStop(0, color + (isStackedArea ? "55" : "40"));
          gradient.addColorStop(1, color + "05");
          canvasCtx.fillStyle = gradient;
        }
        canvasCtx.fill();
      });
      canvasCtx.restore();
    }
    if (!series.area && options.type !== "area") {
      canvasCtx.save();
      const clipWidth = plotArea.width * progress;
      canvasCtx.beginPath();
      canvasCtx.rect(plotArea.x, plotArea.y - 10, clipWidth, plotArea.height + 20);
      canvasCtx.clip();
    }
    canvasCtx.beginPath();
    canvasCtx.strokeStyle = color;
    canvasCtx.lineWidth = series.lineWidth || 1.5;
    canvasCtx.lineJoin = "round";
    canvasCtx.lineCap = "round";
    canvasCtx.setLineDash(resolveLineDash(series));
    segments.forEach(({ pts: seg }) => tracePath(seg, (c, p) => c.moveTo(p[0], p[1])));
    canvasCtx.stroke();
    canvasCtx.setLineDash([]);
    if (!series.area && options.type !== "area") {
      canvasCtx.restore();
    }
    // 数据点圆点默认不绘制（大平台折线惯例：平时纯线条，hover 才有反馈），showSymbol: true 显式打开
    if (series.showSymbol === true && series.symbol !== "none") {
      const baseR = series.symbolSize ?? 4;
      points.forEach((p, i) => {
        if (!p) return;
        const isHover = i === hoverIndex;
        const radius = isHover ? baseR + 2 : baseR;
        canvasCtx.beginPath();
        drawSymbol(canvasCtx, series.symbol, p[0], p[1], radius);
        canvasCtx.fillStyle = isHover ? color : theme.backgroundColor;
        canvasCtx.fill();
        canvasCtx.strokeStyle = color;
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
        if (isHover) {
          canvasCtx.beginPath();
          canvasCtx.arc(p[0], p[1], radius + 6, 0, Math.PI * 2);
          canvasCtx.strokeStyle = color + "40";
          canvasCtx.lineWidth = 2;
          canvasCtx.stroke();
        }
      });
    } else if (hoverIndex >= 0 && points[hoverIndex]) {
      // showSymbol 关闭时不画常驻圆点，悬浮点仍以空心圆环标注位置（实时监控小图依赖此反馈）
      const p = points[hoverIndex];
      canvasCtx.beginPath();
      canvasCtx.arc(p[0], p[1], 4.5, 0, Math.PI * 2);
      canvasCtx.fillStyle = theme.backgroundColor;
      canvasCtx.fill();
      canvasCtx.strokeStyle = color;
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    }
    const showValues = series.showValues !== void 0 ? series.showValues : options.showValues;
    if (showValues && progress > 0.9) {
      canvasCtx.save();
      canvasCtx.fillStyle = theme.textColor;
      canvasCtx.font = "11px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "bottom";
      const rects = [];
      const texts = [];
      points.forEach((p, i) => {
        if (!p) {
          rects.push({ x: 0, y: 0, width: 0, height: 0 });
          texts.push("");
          return;
        }
        const text = valueFormatter(series.data[i]);
        const w = canvasCtx.measureText(text).width;
        rects.push({ x: p[0] - w / 2 - 2, y: p[1] - 20, width: w + 4, height: 13 });
        texts.push(text);
      });
      const visible = layoutLabelsAvoidOverlap(rects);
      points.forEach((p, i) => {
        if (p && visible[i]) canvasCtx.fillText(texts[i], p[0], p[1] - 8);
      });
      canvasCtx.restore();
    }
    canvasCtx.restore();
  });
  return allPoints;
}
function renderBarChart(ctx, yRange, stacked = false) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1, hiddenSeries, valueFormatter } = ctx;
  const hovT = hoverAnimProgress;
  const visibleSeries = (options.series || []).filter((s) => !hiddenSeries.has(s.name));
  if (visibleSeries.length === 0) return;
  const labels = options.labels || [];
  const categoryWidth = plotArea.width / (labels.length || 1);
  const barCategoryGap = 0.3;
  const rawZeroY = plotArea.y + plotArea.height - (0 - yRange.min) / (yRange.max - yRange.min) * plotArea.height;
  const zeroY = Math.min(Math.max(rawZeroY, plotArea.y), plotArea.y + plotArea.height);
  const valueLabels = [];
  if (stacked) {
    const groups = resolveStackGroups(visibleSeries);
    const colorIdx = buildSeriesColorIndex(options.series || []);
    const groupWidth = categoryWidth * (1 - barCategoryGap);
    const barWidth = groupWidth / groups.length * 0.8;
    groups.forEach((group, groupIndex) => {
      const groupOffset = (categoryWidth - groupWidth) / 2;
      const seriesOffset = groupIndex * (groupWidth / groups.length) + (groupWidth / groups.length - barWidth) / 2;
      labels.forEach((_, labelIndex) => {
        const isHover = labelIndex === hoverIndex;
        const barX = plotArea.x + labelIndex * categoryWidth + groupOffset + seriesOffset;
        const br = options.borderRadius || 2;
        let positiveCursor = zeroY;
        let negativeCursor = zeroY;
        let positiveTotal = 0;
        let negativeTotal = 0;
        const segments = [];
        group.series.forEach((series) => {
          const raw = series.data[labelIndex];
          if (isMissingValue(raw)) return;
          const value = raw;
          const rawHeight = Math.abs((value - 0) / (yRange.max - yRange.min) * plotArea.height) * progress;
          if (rawHeight < 0.5) return;
          const color = series.color || theme.colors[(colorIdx.get(series) ?? 0) % theme.colors.length];
          const alpha = focusAlpha(ctx, series.name);
          if (value >= 0) {
            const y = positiveCursor - rawHeight;
            segments.push({ value, y, height: rawHeight, color, alpha, isTopPositive: false, isBottomNegative: false });
            positiveCursor = y;
            positiveTotal += value;
          } else {
            segments.push({
              value,
              y: negativeCursor,
              height: rawHeight,
              color,
              alpha,
              isTopPositive: false,
              isBottomNegative: false
            });
            negativeCursor += rawHeight;
            negativeTotal += value;
          }
        });
        const lastPositiveIdx = findLastIndex(segments, (s) => s.value >= 0);
        const lastNegativeIdx = findLastIndex(segments, (s) => s.value < 0);
        if (lastPositiveIdx >= 0) segments[lastPositiveIdx].isTopPositive = true;
        if (lastNegativeIdx >= 0) segments[lastNegativeIdx].isBottomNegative = true;
        segments.forEach((seg) => {
          canvasCtx.save();
          canvasCtx.globalAlpha = seg.alpha;
          if (seg.isTopPositive || seg.isBottomNegative) {
            drawRoundedBarEnd(canvasCtx, barX, seg.y, barWidth, seg.height, br, seg.value >= 0 ? "top" : "bottom");
          } else {
            canvasCtx.beginPath();
            canvasCtx.rect(barX, seg.y, barWidth, seg.height);
          }
          // 悬浮强调随 hoverAnimProgress 缓动（同色加深一档，不位移）
          canvasCtx.fillStyle = isHover ? mixColor(seg.color, 0.12 * hovT, "#000000") : seg.color;
          canvasCtx.fill();
          if (isHover && hovT > 0.01 && (seg.isTopPositive || seg.isBottomNegative)) {
            canvasCtx.globalAlpha = seg.alpha * 0.3 * hovT;
            canvasCtx.fillStyle = "#ffffff";
            const stripY = seg.value >= 0 ? seg.y : seg.y + seg.height - Math.min(6, seg.height);
            canvasCtx.fillRect(barX, stripY, barWidth, Math.min(6, seg.height));
          }
          canvasCtx.restore();
        });
        if (options.showValues && progress > 0.9) {
          const cx = barX + barWidth / 2;
          if (positiveTotal > 0) {
            const topY = zeroY - positiveTotal * progress / (yRange.max - yRange.min) * plotArea.height;
            valueLabels.push({ text: valueFormatter(positiveTotal), cx, anchorY: topY - 4, below: false });
          }
          if (negativeTotal < 0) {
            const bottomY = zeroY + -negativeTotal * progress / (yRange.max - yRange.min) * plotArea.height;
            valueLabels.push({ text: valueFormatter(negativeTotal), cx, anchorY: bottomY + 14, below: true });
          }
        }
      });
    });
  } else {
    const groupWidth = categoryWidth * (1 - barCategoryGap);
    const groupOffset = (categoryWidth - groupWidth) / 2;
    const seriesColorIdx = buildSeriesColorIndex(options.series || []);
    visibleSeries.forEach((series) => {
      const color = series.color || theme.colors[(seriesColorIdx.get(series) ?? 0) % theme.colors.length];
      const alpha = focusAlpha(ctx, series.name);
      const slotWidth = groupWidth / visibleSeries.length;
      const barWidth = slotWidth * (series.barWidth ?? options.series[0]?.barWidth ?? 0.8);
      const seriesOffset = visibleSeries.indexOf(series) * slotWidth + (slotWidth - barWidth) / 2;
      series.data.forEach((raw, i) => {
        if (isMissingValue(raw)) return;
        const value = raw;
        const x = plotArea.x + i * categoryWidth + groupOffset + seriesOffset;
        const valueY = plotArea.y + plotArea.height - (value - yRange.min) / (yRange.max - yRange.min) * plotArea.height * progress;
        const barTop = Math.min(zeroY, valueY);
        const barHeight = Math.abs(zeroY - valueY);
        const isHover = i === hoverIndex;
        const borderRadius = options.borderRadius || 4;
        canvasCtx.save();
        canvasCtx.globalAlpha = alpha;
        if (barHeight > 0.5) {
          drawRoundedBarEnd(canvasCtx, x, barTop, barWidth, barHeight, borderRadius, value >= 0 ? "top" : "bottom");
          // 悬浮强调随 hoverAnimProgress 缓动（同色加深一档，不位移）
          canvasCtx.fillStyle = isHover ? mixColor(color, 0.12 * hovT, "#000000") : color;
          canvasCtx.fill();
          if (isHover && hovT > 0.01) {
            canvasCtx.globalAlpha = 0.3 * hovT;
            canvasCtx.fillStyle = "#ffffff";
            const stripY = value >= 0 ? barTop : barTop + barHeight - Math.min(10, barHeight);
            canvasCtx.fillRect(x, stripY, barWidth, Math.min(10, barHeight));
          }
        }
        if (options.showValues && progress > 0.9) {
          const labelY = value >= 0 ? barTop - 4 : barTop + barHeight + 14;
          valueLabels.push({ text: valueFormatter(value), cx: x + barWidth / 2, anchorY: labelY, below: value < 0 });
        }
        canvasCtx.restore();
      });
    });
  }
  if (valueLabels.length > 0) {
    canvasCtx.save();
    canvasCtx.font = "11px Inter, sans-serif";
    const rects = valueLabels.map((l) => {
      const w = canvasCtx.measureText(l.text).width;
      return { x: l.cx - w / 2 - 4, y: l.below ? l.anchorY - 12 : l.anchorY - 14, width: w + 8, height: 16 };
    });
    const visible = layoutLabelsAvoidOverlap(rects);
    valueLabels.forEach((l, i) => {
      if (!visible[i]) return;
      drawLabelWithBg(canvasCtx, l.text, l.cx, l.anchorY, theme);
    });
    canvasCtx.restore();
  }
}
function findLastIndex(arr, pred) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) return i;
  }
  return -1;
}
function drawRoundedBarEnd(canvasCtx, x, y, width, height, radius, end) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  canvasCtx.beginPath();
  if (end === "top") {
    canvasCtx.moveTo(x, y + height);
    canvasCtx.lineTo(x, y + r);
    canvasCtx.quadraticCurveTo(x, y, x + r, y);
    canvasCtx.lineTo(x + width - r, y);
    canvasCtx.quadraticCurveTo(x + width, y, x + width, y + r);
    canvasCtx.lineTo(x + width, y + height);
  } else {
    canvasCtx.moveTo(x, y);
    canvasCtx.lineTo(x, y + height - r);
    canvasCtx.quadraticCurveTo(x, y + height, x + r, y + height);
    canvasCtx.lineTo(x + width - r, y + height);
    canvasCtx.quadraticCurveTo(x + width, y + height, x + width, y + height - r);
    canvasCtx.lineTo(x + width, y);
  }
  canvasCtx.closePath();
}
function renderHorizontalBarChart(ctx, xRange) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1, hiddenSeries, valueFormatter } = ctx;
  const hovT = hoverAnimProgress;
  const visibleSeries = (options.series || []).filter((s) => !hiddenSeries.has(s.name));
  if (visibleSeries.length === 0) return;
  const seriesCount = visibleSeries.length;
  const barCategoryGap = 0.3;
  const categoryWidth = plotArea.height / (options.labels?.length || 1);
  const groupWidth = categoryWidth * (1 - barCategoryGap);
  const barHeight = groupWidth / seriesCount * 0.8;
  const groupOffset = (categoryWidth - groupWidth) / 2;
  const rawZeroX = plotArea.x + (0 - xRange.min) / (xRange.max - xRange.min) * plotArea.width;
  const zeroX = Math.min(Math.max(rawZeroX, plotArea.x), plotArea.x + plotArea.width);
  const seriesColorIdx = buildSeriesColorIndex(options.series || []);
  visibleSeries.forEach((series) => {
    const color = series.color || theme.colors[(seriesColorIdx.get(series) ?? 0) % theme.colors.length];
    const alpha = focusAlpha(ctx, series.name);
    const seriesOffset = visibleSeries.indexOf(series) * (groupWidth / seriesCount) + (groupWidth / seriesCount - barHeight) / 2;
    series.data.forEach((raw, i) => {
      if (isMissingValue(raw)) return;
      const value = raw;
      const y = plotArea.y + plotArea.height - (i + 1) * categoryWidth + groupOffset + seriesOffset;
      const valueX = zeroX + value / (xRange.max - xRange.min) * plotArea.width * progress;
      const barLeft = Math.min(zeroX, valueX);
      const barWidth = Math.abs(valueX - zeroX);
      const isHover = i === hoverIndex;
      const br = options.borderRadius || 4;
      canvasCtx.save();
      canvasCtx.globalAlpha = alpha;
      if (barWidth > 0.5) {
        canvasCtx.beginPath();
        const r = Math.max(0, Math.min(br, barHeight / 2, barWidth / 2));
        if (value >= 0) {
          canvasCtx.moveTo(barLeft, y);
          canvasCtx.lineTo(barLeft + barWidth - r, y);
          canvasCtx.quadraticCurveTo(barLeft + barWidth, y, barLeft + barWidth, y + r);
          canvasCtx.lineTo(barLeft + barWidth, y + barHeight - r);
          canvasCtx.quadraticCurveTo(barLeft + barWidth, y + barHeight, barLeft + barWidth - r, y + barHeight);
          canvasCtx.lineTo(barLeft, y + barHeight);
        } else {
          canvasCtx.moveTo(barLeft + barWidth, y);
          canvasCtx.lineTo(barLeft + r, y);
          canvasCtx.quadraticCurveTo(barLeft, y, barLeft, y + r);
          canvasCtx.lineTo(barLeft, y + barHeight - r);
          canvasCtx.quadraticCurveTo(barLeft, y + barHeight, barLeft + r, y + barHeight);
          canvasCtx.lineTo(barLeft + barWidth, y + barHeight);
        }
        canvasCtx.closePath();
        // 悬浮强调随 hoverAnimProgress 缓动（同色加深一档，不位移）
        canvasCtx.fillStyle = isHover ? mixColor(color, 0.12 * hovT, "#000000") : color;
        canvasCtx.fill();
        if (isHover && hovT > 0.01) {
          canvasCtx.globalAlpha = 0.3 * hovT;
          canvasCtx.fillStyle = "#ffffff";
          const stripX = value >= 0 ? barLeft + barWidth - Math.min(10, barWidth) : barLeft;
          canvasCtx.fillRect(stripX, y, Math.min(10, barWidth), barHeight);
        }
      }
      if (options.showValues && progress > 0.9) {
        const labelX = value >= 0 ? barLeft + barWidth + 6 : barLeft - 6;
        drawLabelWithBg(
          canvasCtx,
          valueFormatter(value),
          labelX,
          y + barHeight / 2,
          theme,
          value >= 0 ? "left" : "right"
        );
      }
      canvasCtx.restore();
    });
  });
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "12px Inter, sans-serif";
  canvasCtx.textAlign = "right";
  canvasCtx.textBaseline = "middle";
  const maxCatWidth = plotArea.x - 12;
  const labels = options.labels || [];
  labels.forEach((label, i) => {
    const y = plotArea.y + plotArea.height - (i + 0.5) * categoryWidth;
    let formattedLabel = options.yAxis?.formatter ? options.yAxis.formatter(label) : label;
    if (canvasCtx.measureText(formattedLabel).width > maxCatWidth) {
      let lo = 0, hi = formattedLabel.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (canvasCtx.measureText(formattedLabel.slice(0, mid) + "\u2026").width > maxCatWidth) hi = mid - 1;
        else lo = mid;
      }
      formattedLabel = formattedLabel.slice(0, lo) + "\u2026";
    }
    canvasCtx.fillText(formattedLabel, plotArea.x - 10, y);
  });
  canvasCtx.restore();
}
function buildPieSlices(options, hiddenSeries) {
  const rawData = options.pieData || [];
  // pieData 支持 { label, value } 与 { name, value } 两种写法，统一归一为 label
  const visible = rawData
    .map((d, i) => ({ ...d, label: d.label ?? d.name, sourceIndex: i }))
    .filter((d) => !hiddenSeries.has(d.label || ""));
  if (visible.length === 0) return [];
  const threshold = options.pieHideThreshold;
  if (threshold && threshold > 0) {
    const total = visible.reduce((s, d) => s + d.value, 0);
    const big = visible.filter((d) => d.value / total * 100 >= threshold);
    const small = visible.filter((d) => d.value / total * 100 < threshold);
    const result = big.map((d) => ({
      label: d.label,
      value: d.value,
      color: d.color,
      sourceIndex: d.sourceIndex
    }));
    if (small.length > 0) {
      const aggVal = small.reduce((s, d) => s + d.value, 0);
      result.push({
        label: "\u5176\u4ED6",
        value: aggVal,
        color: getSeriesColors(CHART_COLORS.primary)[big.length % CHART_COLORS.primary.length],
        isAggregated: true,
        sourceIndex: small[0].sourceIndex
      });
    }
    return result;
  }
  return visible.map((d) => ({ label: d.label, value: d.value, color: d.color, sourceIndex: d.sourceIndex }));
}
function renderPieChart(ctx, isDoughnut, isRose = false) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress, hiddenSeries } = ctx;
  const pieData = buildPieSlices(options, hiddenSeries);
  if (pieData.length === 0) return;
  const percentMode = options.piePercentMode === true;
  const total = pieData.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return;
  const centerX = plotArea.x + plotArea.width / 2;
  const centerY = plotArea.y + plotArea.height / 2;
  const maxRadius = computePieMaxRadius(pieData, options, plotArea);
  const innerRadius = isDoughnut ? Math.max(0, Math.min(maxRadius - 5, maxRadius * (options.innerRadius || 0.6))) : 0;
  let startAngle = -Math.PI / 2;
  const labelItems = [];
  pieData.forEach((data, index) => {
    const color = data.color || theme.colors[index % theme.colors.length];
    const sliceAngle = data.value / total * Math.PI * 2 * progress;
    const endAngle = startAngle + sliceAngle;
    const isHover = index === hoverIndex;
    const roseRadius = isRose ? maxRadius * Math.sqrt(data.value / Math.max(...pieData.map((d) => d.value))) : maxRadius;
    const hoverDistance = isRose ? Math.max(10, roseRadius * 0.15) : 12;
    const offset = isHover ? hoverDistance * hoverAnimProgress : 0;
    const radius = isRose ? roseRadius * progress : maxRadius;
    const midAngle = startAngle + sliceAngle / 2;
    const offsetX = Math.cos(midAngle) * offset;
    const offsetY = Math.sin(midAngle) * offset;
    canvasCtx.save();
    canvasCtx.beginPath();
    if (isDoughnut) {
      const outerStartX = centerX + offsetX + Math.cos(startAngle) * radius;
      const outerStartY = centerY + offsetY + Math.sin(startAngle) * radius;
      canvasCtx.moveTo(outerStartX, outerStartY);
      canvasCtx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle);
      canvasCtx.arc(centerX + offsetX, centerY + offsetY, innerRadius, endAngle, startAngle, true);
      canvasCtx.closePath();
    } else {
      canvasCtx.moveTo(centerX + offsetX, centerY + offsetY);
      canvasCtx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle);
      canvasCtx.closePath();
    }
    canvasCtx.fillStyle = color;
    canvasCtx.fill();
    canvasCtx.strokeStyle = theme.backgroundColor;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
    if (isHover && hoverAnimProgress > 0.01) {
      canvasCtx.strokeStyle = color;
      canvasCtx.lineWidth = 2 + 2 * hoverAnimProgress;
      canvasCtx.globalAlpha = 0.5 * hoverAnimProgress;
      canvasCtx.stroke();
      canvasCtx.globalAlpha = 1;
    }
    canvasCtx.restore();
    if (progress > 0.9) {
      const percentage = (data.value / total * 100).toFixed(1);
      const text = percentMode ? `${percentage}%` : `${data.label || ""} (${percentage}%)`;
      labelItems.push({
        angle: midAngle,
        r: isRose ? roseRadius : maxRadius,
        text,
      });
    }
    startAngle = endAngle;
  });
  if (labelItems.length > 0 && progress > 0.9) {
    drawCalloutLabels(labelItems, { canvasCtx, centerX, centerY, plotArea, theme });
  }
  if (isDoughnut && options.gauge?.value !== void 0) {
    canvasCtx.save();
    canvasCtx.fillStyle = theme.textColor;
    canvasCtx.font = "bold 24px Inter, sans-serif";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText(options.gauge.value.toString(), centerX, centerY - 8);
    if (options.gauge.unit) {
      canvasCtx.font = "13px Inter, sans-serif";
      canvasCtx.fillStyle = theme.textColorSecondary;
      canvasCtx.fillText(options.gauge.unit, centerX, centerY + 14);
    }
    canvasCtx.restore();
  }
}
function createScatterScale(scatterData, yRange, plotArea) {
  const xValues = scatterData.map((d) => d.x);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const xRange = xMax - xMin || 1;
  const xPadding = xRange * 0.05;
  const yPadding = (yRange.max - yRange.min) * 0.05;
  return {
    xMin,
    xMax,
    toX(x) {
      return plotArea.x + (x - xMin + xPadding) / (xRange + xPadding * 2) * plotArea.width;
    },
    toY(y) {
      const normalizedY = (y - yRange.min + yPadding) / (yRange.max - yRange.min + yPadding * 2);
      return plotArea.y + plotArea.height - normalizedY * plotArea.height;
    }
  };
}

/** 确定性抖动：同数据同偏移（重渲染不跳），只在绘制/命中坐标上散开重叠点 */
function jitterOffset(index, amount) {
  const s1 = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  const s2 = Math.sin(index * 269.5 + 183.3) * 28001.8384;
  const fx = s1 - Math.floor(s1);
  const fy = s2 - Math.floor(s2);
  return [(fx - 0.5) * 2 * amount, (fy - 0.5) * 2 * amount];
}

/** 颜色通道分组：group 字段出现即按组聚合取系列色（首现顺序） */
function scatterGroupColors(scatterData, theme) {
  const map = /* @__PURE__ */ new Map();
  scatterData.forEach((d) => {
    if (!d.group || map.has(d.group)) return;
    map.set(d.group, theme.colors[map.size % theme.colors.length]);
  });
  return map;
}

function scatterPointColor(point, index, groupColors, theme) {
  if (point.color) return point.color;
  if (point.group && groupColors.has(point.group)) return groupColors.get(point.group);
  return theme.colors[index % theme.colors.length];
}

/**
 * 散点全量点位（含隐藏点，索引与 scatterData 对齐）：渲染与命中测试共用，
 * 抖动在这一层叠加，保证看到的和命中的是同一批坐标。
 */
function scatterPointPositions(scatterData, yRange, plotArea, options) {
  const scale = createScatterScale(scatterData, yRange, plotArea);
  const jitter = Math.max(0, Math.min(20, Number(options.jitter) || 0));
  return scatterData.map((d, i) => {
    const [dx, dy] = jitter > 0 ? jitterOffset(i, jitter) : [0, 0];
    return [scale.toX(d.x) + dx, scale.toY(d.y) + dy];
  });
}

function renderScatterChart(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options, hoverIndex, progress } = ctx;
  const scatterData = options.scatterData || [];
  if (scatterData.length === 0) return [];
  const groupColors = scatterGroupColors(scatterData, theme);
  const hiddenByLabel = (point, i) =>
    ctx.hiddenSeries.has(point.label || `P${i + 1}`) || (point.group && ctx.hiddenSeries.has(point.group));
  // 四象限参考线（DESIGN §3.9）：十字虚线 + 角标签，先于数据绘制
  const quadrant = options.quadrant;
  if (quadrant && quadrant.show !== false) {
    const scale = createScatterScale(scatterData, yRange, plotArea);
    const xs = scatterData.map((d) => d.x);
    const ys = scatterData.map((d) => d.y);
    const xMid = quadrant.xMid ?? xs.reduce((s, v) => s + v, 0) / xs.length;
    const yMid = quadrant.yMid ?? ys.reduce((s, v) => s + v, 0) / ys.length;
    const midX = scale.toX(xMid);
    const midY = scale.toY(yMid);
    canvasCtx.save();
    canvasCtx.strokeStyle = theme.textColorSecondary;
    canvasCtx.globalAlpha = 0.55;
    canvasCtx.lineWidth = 1;
    canvasCtx.setLineDash([4, 4]);
    canvasCtx.beginPath();
    canvasCtx.moveTo(midX, plotArea.y);
    canvasCtx.lineTo(midX, plotArea.y + plotArea.height);
    canvasCtx.moveTo(plotArea.x, midY);
    canvasCtx.lineTo(plotArea.x + plotArea.width, midY);
    canvasCtx.stroke();
    canvasCtx.setLineDash([]);
    if (Array.isArray(quadrant.labels)) {
      canvasCtx.font = "italic 11px Inter, sans-serif";
      canvasCtx.fillStyle = theme.textColorSecondary;
      const inset = 8;
      const spots = [
        [plotArea.x + inset, plotArea.y + 14, "left"],
        [plotArea.x + plotArea.width - inset, plotArea.y + 14, "right"],
        [plotArea.x + inset, plotArea.y + plotArea.height - 6, "left"],
        [plotArea.x + plotArea.width - inset, plotArea.y + plotArea.height - 6, "right"],
      ];
      spots.forEach(([x, y, align], li) => {
        const text = quadrant.labels[li];
        if (!text) return;
        canvasCtx.textAlign = align;
        canvasCtx.textBaseline = li < 2 ? "top" : "bottom";
        canvasCtx.fillText(text, x, y);
      });
    }
    canvasCtx.restore();
  }
  const positions = scatterPointPositions(scatterData, yRange, plotArea, options);
  const points = [];
  const yFactor = Math.min(progress * 1.2, 1);
  scatterData.forEach((point, i) => {
    // 图例点选按 label / group 隐藏；占位 NaN 保持返回点数组与 scatterData 索引对齐（命中测试自动跳过）
    if (hiddenByLabel(point, i)) {
      points.push([NaN, NaN]);
      return;
    }
    const [x, finalY] = positions[i];
    const animatedY = plotArea.y + plotArea.height - (plotArea.y + plotArea.height - finalY) * yFactor;
    points.push([x, animatedY]);
    const size = (point.size || 6) * Math.min(yFactor * 1.5, 1);
    const color = scatterPointColor(point, i, groupColors, theme);
    const isHover = i === hoverIndex;
    canvasCtx.save();
    canvasCtx.globalAlpha = focusAlpha(ctx, point.group || point.label || "");
    canvasCtx.beginPath();
    canvasCtx.arc(x, animatedY, isHover ? size + 2 : size, 0, Math.PI * 2);
    canvasCtx.fillStyle = color + (isHover ? "cc" : "80");
    canvasCtx.fill();
    canvasCtx.strokeStyle = color;
    canvasCtx.lineWidth = isHover ? 2 : 1.5;
    canvasCtx.stroke();
    if (isHover) {
      canvasCtx.beginPath();
      canvasCtx.arc(x, animatedY, size + 6, 0, Math.PI * 2);
      canvasCtx.strokeStyle = color + "40";
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    }
    canvasCtx.restore();
  });
  // 点标注（DESIGN §3.9）：11px 次要色右上偏移，重叠的让位不画
  if (options.pointLabels === true && progress > 0.9) {
    canvasCtx.save();
    canvasCtx.font = "11px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColorSecondary;
    const rects = [];
    scatterData.forEach((point, i) => {
      if (hiddenByLabel(point, i) || !point.label) {
        rects.push({ x: 0, y: 0, width: 0, height: 0 });
        return;
      }
      const [x, y] = positions[i];
      const w = canvasCtx.measureText(point.label).width;
      rects.push({ x: x + 4, y: y - 20, width: w + 4, height: 13 });
    });
    const visible = layoutLabelsAvoidOverlap(rects);
    scatterData.forEach((point, i) => {
      if (!visible[i] || hiddenByLabel(point, i) || !point.label) return;
      const [x, y] = positions[i];
      canvasCtx.textAlign = "left";
      canvasCtx.textBaseline = "bottom";
      canvasCtx.fillText(point.label, x + 6, y - 6);
    });
    canvasCtx.restore();
  }
  return [points];
}

/* ─── 分面散点：按 group 切小倍数网格，每格独立量程（DESIGN §3.9）─── */
function computeFacetGrids(scatterData, plotArea, options) {
  const grouped = /* @__PURE__ */ new Map();
  scatterData.forEach((d) => {
    const key = d.group || "全部";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(d);
  });
  const names = [...grouped.keys()];
  if (names.length <= 1) return null;
  const cols = Math.ceil(Math.sqrt(names.length));
  const rows = Math.ceil(names.length / cols);
  const cellW = plotArea.width / cols;
  const cellH = plotArea.height / rows;
  const pad = { left: 30, right: 8, top: 24, bottom: 22 };
  const facets = names.map((name, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const data = grouped.get(name);
    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xPad = (xMax - xMin || 1) * 0.08;
    const yPad = (yMax - yMin || 1) * 0.08;
    const outer = { x: plotArea.x + col * cellW, y: plotArea.y + row * cellH, width: cellW, height: cellH };
    const area = {
      x: outer.x + pad.left,
      y: outer.y + pad.top,
      width: Math.max(20, cellW - pad.left - pad.right),
      height: Math.max(20, cellH - pad.top - pad.bottom),
    };
    const toX = (v) => area.x + (v - xMin + xPad) / (xMax - xMin + xPad * 2) * area.width;
    const toY = (v) => area.y + area.height - (v - yMin + yPad) / (yMax - yMin + yPad * 2) * area.height;
    return { name, data, outer, area, xMin, xMax, yMin, yMax, toX, toY };
  });
  return { facets, cols, rows, cellW, cellH, options };
}

function renderScatterFacetChart(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex } = ctx;
  const scatterData = options.scatterData || [];
  const grid = computeFacetGrids(scatterData, plotArea, options);
  if (!grid) return renderScatterChart(ctx, yRange);
  const yFactor = Math.min(progress * 1.2, 1);
  grid.facets.forEach((facet) => {
    const { area } = facet;
    canvasCtx.save();
    // 格边框 + 标题
    canvasCtx.strokeStyle = theme.gridColor;
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeRect(area.x, area.y, area.width, area.height);
    canvasCtx.fillStyle = theme.textColor;
    canvasCtx.font = "600 11px Inter, sans-serif";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "bottom";
    canvasCtx.fillText(facet.name, area.x + area.width / 2, area.y - 5);
    // 迷你刻度：x 3 档 + y 3 档（10px 次要色）
    canvasCtx.font = "10px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColorSecondary;
    for (let k = 0; k <= 2; k++) {
      const v = facet.yMin + (facet.yMax - facet.yMin) * k / 2;
      const y = facet.toY(v);
      canvasCtx.textAlign = "right";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(formatTickShort(v), area.x - 5, y);
      const xv = facet.xMin + (facet.xMax - facet.xMin) * k / 2;
      const x = facet.toX(xv);
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "top";
      canvasCtx.fillText(formatTickShort(xv), x, area.y + area.height + 5);
    }
    // 点
    facet.data.forEach((point, i) => {
      const x = facet.toX(point.x);
      const finalY = facet.toY(point.y);
      const y = area.y + area.height - (area.y + area.height - finalY) * yFactor;
      const globalIdx = scatterData.indexOf(point);
      const size = (point.size || 5) * Math.min(yFactor * 1.5, 1);
      const color = point.color || theme.colors[i % theme.colors.length];
      const isHover = globalIdx === hoverIndex;
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, isHover ? size + 2 : size, 0, Math.PI * 2);
      canvasCtx.fillStyle = color + (isHover ? "cc" : "99");
      canvasCtx.fill();
      canvasCtx.strokeStyle = color;
      canvasCtx.lineWidth = 1;
      canvasCtx.stroke();
    });
    canvasCtx.restore();
  });
  // renderChart 会读返回的 points 数组做准线命中，分面必须回空数组（漏返回曾致整页报错）
  return [];
}

function formatTickShort(v) {
  if (Number.isInteger(v)) return String(v);
  const abs = Math.abs(v);
  if (abs >= 1000) return `${(v / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return parseFloat(v.toFixed(1)).toString();
}

/* ─── 散点矩阵：matrixFields × matrixData 的 n×n 小倍数（DESIGN §3.9）─── */
function computeMatrixCells(plotArea, fields) {
  const n = fields.length;
  if (n === 0) return [];
  const gap = 8;
  const cellW = (plotArea.width - gap * (n - 1)) / n;
  const cellH = (plotArea.height - gap * (n - 1)) / n;
  const cells = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      cells.push({
        row: r,
        col: c,
        xField: fields[c],
        yField: fields[r],
        x: plotArea.x + c * (cellW + gap),
        y: plotArea.y + r * (cellH + gap),
        width: cellW,
        height: cellH,
      });
    }
  }
  return cells;
}

function matrixFieldExtent(records, field) {
  const values = records.map((r) => r[field]).filter((v) => typeof v === "number" && Number.isFinite(v));
  if (values.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min || 1) * 0.08;
  return { min: min - pad, max: max + pad };
}

function renderScatterMatrixChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, hoverIndex, progress } = ctx;
  const fields = options.matrixFields || [];
  const records = options.matrixData || [];
  if (fields.length === 0 || records.length === 0) return;
  const cells = computeMatrixCells(plotArea, fields);
  const extents = /* @__PURE__ */ new Map();
  fields.forEach((f) => extents.set(f, matrixFieldExtent(records, f)));
  cells.forEach((cell, ci) => {
    canvasCtx.save();
    canvasCtx.strokeStyle = ci === hoverIndex ? theme.textColorSecondary : theme.gridColor;
    canvasCtx.lineWidth = 1;
    roundRectPath(canvasCtx, cell.x, cell.y, cell.width, cell.height, 3);
    canvasCtx.stroke();
    if (cell.row === cell.col) {
      // 对角格：字段名
      canvasCtx.fillStyle = theme.textColor;
      canvasCtx.font = "600 11px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(cell.yField, cell.x + cell.width / 2, cell.y + cell.height / 2);
      canvasCtx.restore();
      return;
    }
    const ext = extents;
    const px = (v) => cell.x + 5 + (v - ext.get(cell.xField).min) / (ext.get(cell.xField).max - ext.get(cell.xField).min) * (cell.width - 10);
    const py = (v) => cell.y + cell.height - 5 - (v - ext.get(cell.yField).min) / (ext.get(cell.yField).max - ext.get(cell.yField).min) * (cell.height - 10);
    records.forEach((record) => {
      const xv = record[cell.xField];
      const yv = record[cell.yField];
      if (typeof xv !== "number" || typeof yv !== "number") return;
      canvasCtx.beginPath();
      canvasCtx.arc(px(xv), py(yv), ci === hoverIndex ? 3.5 : 2.5, 0, Math.PI * 2);
      canvasCtx.fillStyle = record.color || theme.colors[0];
      canvasCtx.globalAlpha = Math.min(1, progress + 0.2) * 0.8;
      canvasCtx.fill();
      canvasCtx.globalAlpha = 1;
    });
    canvasCtx.restore();
  });
}

function roundRectPath(canvasCtx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  canvasCtx.beginPath();
  canvasCtx.moveTo(x + rr, y);
  canvasCtx.arcTo(x + w, y, x + w, y + h, rr);
  canvasCtx.arcTo(x + w, y + h, x, y + h, rr);
  canvasCtx.arcTo(x, y + h, x, y, rr);
  canvasCtx.arcTo(x, y, x + w, y, rr);
  canvasCtx.closePath();
}

/** 线性拟合：返回预测函数与 R²（趋势线标注与按组回归共用） */
function linearFit(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  if (sxx < 1e-12) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const r2 = syy < 1e-12 ? 1 : (sxy * sxy) / (sxx * syy);
  return { predict: (x) => intercept + slope * x, r2 };
}

function renderScatterTrendline(ctx, yRange) {
  const { ctx: canvasCtx, plotArea, options } = ctx;
  const trendType = options.scatterTrendline;
  if (!trendType) return;
  const scatterData = options.scatterData || [];
  if (scatterData.length < 2) return;
  const scale = createScatterScale(scatterData, yRange, plotArea);
  const xs = scatterData.map((d) => d.x);
  const ys = scatterData.map((d) => d.y);
  const n = xs.length;
  function solveLeastSquares(degree) {
    const size = degree + 1;
    const A = [];
    const b = [];
    for (let row = 0; row < size; row++) {
      A.push(new Array(size).fill(0));
      b.push(0);
    }
    for (let i = 0; i < n; i++) {
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          A[row][col] += Math.pow(xs[i], row + col);
        }
        b[row] += ys[i] * Math.pow(xs[i], row);
      }
    }
    for (let col = 0; col < size; col++) {
      let pivot = col;
      for (let row = col + 1; row < size; row++) {
        if (Math.abs(A[row][col]) > Math.abs(A[pivot][col])) pivot = row;
      }
      if (Math.abs(A[pivot][col]) < 1e-12) return null;
      [A[col], A[pivot]] = [A[pivot], A[col]];
      [b[col], b[pivot]] = [b[pivot], b[col]];
      for (let row = col + 1; row < size; row++) {
        const factor = A[row][col] / A[col][col];
        for (let k = col; k < size; k++) A[row][k] -= factor * A[col][k];
        b[row] -= factor * b[col];
      }
    }
    const coeffs = new Array(size).fill(0);
    for (let row = size - 1; row >= 0; row--) {
      let sum = b[row];
      for (let k = row + 1; k < size; k++) sum -= A[row][k] * coeffs[k];
      coeffs[row] = sum / A[row][row];
    }
    return coeffs;
  }
  /** 按组回归（trendlinePerGroup）：每组一条线，颜色跟组色 */
  const groupColors = scatterGroupColors(scatterData, ctx.theme);
  const perGroup = options.trendlinePerGroup === true && groupColors.size > 1;
  const lines = [];
  if (trendType === "linear" && perGroup) {
    const groups = /* @__PURE__ */ new Map();
    scatterData.forEach((d) => {
      const key = d.group || "全部";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(d);
    });
    groups.forEach((pts, name) => {
      if (pts.length < 2) return;
      const fit = linearFit(pts.map((p) => p.x), pts.map((p) => p.y));
      if (fit) lines.push({ predict: fit.predict, r2: fit.r2, color: groupColors.get(name) || groupColors.get([...groups.keys()][0]), count: pts.length });
    });
  } else {
    let fitted = null;
    let r2 = null;
    if (trendType === "linear") {
      const fit = linearFit(xs, ys);
      if (fit) {
        fitted = fit.predict;
        r2 = fit.r2;
      } else {
        const c = solveLeastSquares(1);
        if (c) fitted = (x) => c[0] + c[1] * x;
      }
    } else if (trendType === "poly") {
      if (scatterData.length < 3) return;
      const c = solveLeastSquares(2);
      if (c) fitted = (x) => c[0] + c[1] * x + c[2] * x * x;
    } else if (trendType === "exp") {
      const positive = scatterData.filter((d) => d.y > 0);
      if (positive.length < 2) return;
      const lxs = positive.map((d) => d.x);
      const lys = positive.map((d) => Math.log(d.y));
      const m = lxs.length;
      const sumX = lxs.reduce((s, v) => s + v, 0);
      const sumY = lys.reduce((s, v) => s + v, 0);
      const sumXX = lxs.reduce((s, v) => s + v * v, 0);
      const sumXY = lxs.reduce((s, v, i) => s + v * lys[i], 0);
      const denom = m * sumXX - sumX * sumX;
      if (Math.abs(denom) < 1e-12) return;
      const b = (m * sumXY - sumX * sumY) / denom;
      const a = Math.exp((sumY - b * sumX) / m);
      fitted = (x) => a * Math.exp(b * x);
    }
    if (fitted) lines.push({ predict: fitted, r2, color: "#8b5cf6" });
  }
  if (lines.length === 0) return;
  const xStart = scale.xMin;
  const xEnd = scale.xMax;
  const steps = 60;
  const yFactor = Math.min(ctx.progress * 1.2, 1);
  canvasCtx.save();
  canvasCtx.setLineDash([6, 4]);
  lines.forEach((line) => {
    canvasCtx.strokeStyle = line.color;
    canvasCtx.globalAlpha = 0.9;
    canvasCtx.lineWidth = 1.5;
    canvasCtx.beginPath();
    let started = false;
    let lastX = 0;
    let lastY = 0;
    for (let s = 0; s <= steps; s++) {
      const x = xStart + (xEnd - xStart) * s / steps;
      const y = line.predict(x);
      if (!Number.isFinite(y)) continue;
      const px = scale.toX(x);
      const finalY = scale.toY(y);
      const py = plotArea.y + plotArea.height - (plotArea.y + plotArea.height - finalY) * yFactor;
      if (!started) {
        canvasCtx.moveTo(px, py);
        started = true;
      } else {
        canvasCtx.lineTo(px, py);
      }
      lastX = px;
      lastY = py;
    }
    canvasCtx.stroke();
    // R² 标注（DESIGN §3.9）：10px 次要色缀在线末端上方
    if (line.r2 != null && ctx.progress > 0.9) {
      canvasCtx.font = "10px Inter, sans-serif";
      canvasCtx.fillStyle = ctx.theme.textColorSecondary;
      canvasCtx.textAlign = "right";
      canvasCtx.textBaseline = "bottom";
      canvasCtx.fillText(`R²=${line.r2.toFixed(2)}`, Math.min(lastX, plotArea.x + plotArea.width - 4), Math.max(lastY - 6, plotArea.y + 10));
    }
  });
  canvasCtx.setLineDash([]);
  canvasCtx.restore();
}
function renderRadarChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1 } = ctx;
  const indicators = options.radarIndicators || [];
  const series = options.radarSeries || [];
  if (indicators.length === 0 || series.length === 0) return;
  const centerX = plotArea.x + plotArea.width / 2;
  const centerY = plotArea.y + plotArea.height / 2;
  const radius = Math.max(40, Math.min(plotArea.width, plotArea.height) / 2 - 30);
  const angleStep = Math.PI * 2 / indicators.length;
  // 环底色（DESIGN §3.1）：同心圆环带交替浓淡（参考 AntV 雷达示例），由外向内叠画
  if (options.radarRingFill === true) {
    canvasCtx.save();
    canvasCtx.fillStyle = theme.gridColor;
    for (let level = 5; level >= 1; level--) {
      canvasCtx.globalAlpha = level % 2 === 1 ? 0.5 : 0.22;
      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, radius * level / 5, 0, Math.PI * 2);
      canvasCtx.fill();
    }
    canvasCtx.restore();
  }
  canvasCtx.save();
  canvasCtx.strokeStyle = theme.gridColor;
  canvasCtx.lineWidth = 1;
  for (let level = 1; level <= 5; level++) {
    const levelRadius = radius * level / 5;
    canvasCtx.beginPath();
    for (let i = 0; i <= indicators.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * levelRadius;
      const y = centerY + Math.sin(angle) * levelRadius;
      if (i === 0) canvasCtx.moveTo(x, y);
      else canvasCtx.lineTo(x, y);
    }
    canvasCtx.closePath();
    canvasCtx.stroke();
  }
  for (let i = 0; i < indicators.length; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    canvasCtx.beginPath();
    canvasCtx.moveTo(centerX, centerY);
    canvasCtx.lineTo(x, y);
    canvasCtx.stroke();
  }
  // 轴线悬浮高亮（DESIGN §3.1）：被悬浮的维度轴升至主文字色，随 hoverAnimProgress 缓动
  if (hoverIndex >= 0 && hoverIndex < indicators.length) {
    const angle = hoverIndex * angleStep - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    canvasCtx.save();
    canvasCtx.globalAlpha = 0.4 + 0.6 * hoverAnimProgress;
    canvasCtx.strokeStyle = theme.textColor;
    canvasCtx.lineWidth = 1.5;
    canvasCtx.beginPath();
    canvasCtx.moveTo(centerX, centerY);
    canvasCtx.lineTo(x, y);
    canvasCtx.stroke();
    canvasCtx.restore();
  }
  canvasCtx.restore();
  // 所有维度同 max 时在最上轴旁标环刻度（各维度各自定 max 则省略，避免歧义）
  const sharedMax = indicators[0].max;
  const sharedMin = indicators[0].min || 0;
  const sameScale = sharedMax != null
    && indicators.every((ind) => (ind.max ?? sharedMax) === sharedMax && (ind.min || 0) === sharedMin);
  if (sameScale) {
    canvasCtx.save();
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.font = "10px Inter, sans-serif";
    canvasCtx.textAlign = "left";
    canvasCtx.textBaseline = "middle";
    for (let level = 1; level <= 5; level++) {
      const v = sharedMin + (sharedMax - sharedMin) * level / 5;
      canvasCtx.fillText(Number.isInteger(sharedMax) ? String(Math.round(v)) : v.toFixed(1), centerX + 5, centerY - radius * level / 5);
    }
    canvasCtx.restore();
  }
  canvasCtx.save();
  canvasCtx.font = "12px Inter, sans-serif";
  const labelOffset = options.radarLabelOffset ?? 12;
  indicators.forEach((indicator, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = radius + labelOffset;
    const x = centerX + Math.cos(angle) * labelRadius;
    const y = centerY + Math.sin(angle) * labelRadius;
    const isAxisHover = i === hoverIndex;
    canvasCtx.fillStyle = isAxisHover ? theme.textColor : theme.textColorSecondary;
    canvasCtx.font = isAxisHover ? "600 12px Inter, sans-serif" : "12px Inter, sans-serif";
    canvasCtx.textAlign = Math.cos(angle) > 0.1 ? "left" : Math.cos(angle) < -0.1 ? "right" : "center";
    canvasCtx.textBaseline = Math.sin(angle) > 0.1 ? "top" : Math.sin(angle) < -0.1 ? "bottom" : "middle";
    canvasCtx.fillText(indicator.name, x, y);
  });
  canvasCtx.restore();
  const stacked = options.radarStacked === true;
  const cumulativeData = [];
  if (stacked) {
    series.forEach((s, si) => {
      cumulativeData.push(
        s.data.map((_, i) => {
          let sum = 0;
          for (let k = 0; k <= si; k++) {
            const sk = series[k];
            if (ctx.hiddenSeries.has(sk.name)) continue;
            const ind = indicators[i];
            const min = ind.min || 0;
            sum += Math.max(0, (sk.data[i] || 0) - min);
          }
          return sum;
        })
      );
    });
  }
  series.forEach((s, seriesIndex) => {
    if (ctx.hiddenSeries.has(s.name)) return;
    const color = s.color || theme.colors[seriesIndex % theme.colors.length];
    const alpha = focusAlpha(ctx, s.name);
    const points = [];
    s.data.forEach((value, i) => {
      const indicator = indicators[i];
      const min = indicator.min || 0;
      const max = indicator.max;
      const span = max - min;
      const angle = i * angleStep - Math.PI / 2;
      const targetValue = stacked ? cumulativeData[seriesIndex]?.[i] ?? 0 : value - min;
      const r = radius * Math.min(1, Math.max(0, span > 0 ? targetValue / span : 0)) * progress;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      points.push([x, y]);
    });
    if (s.area !== false) {
      canvasCtx.save();
      canvasCtx.globalAlpha = alpha;
      canvasCtx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) canvasCtx.moveTo(p[0], p[1]);
        else canvasCtx.lineTo(p[0], p[1]);
      });
      canvasCtx.closePath();
      // 与面积图同标准：纵向渐变 @25% → @3%，多系列叠加不糊
      if (/^#[0-9a-fA-F]{6}$/.test(color)) {
        const grad = canvasCtx.createLinearGradient(0, centerY - radius, 0, centerY + radius);
        grad.addColorStop(0, color + (hoverIndex >= 0 ? "59" : "40"));
        grad.addColorStop(1, color + "08");
        canvasCtx.fillStyle = grad;
      } else {
        canvasCtx.fillStyle = color;
        canvasCtx.globalAlpha = alpha * 0.18;
      }
      canvasCtx.fill();
      canvasCtx.restore();
    }
    const isFocus = ctx.focusSeries === s.name;
    canvasCtx.save();
    canvasCtx.globalAlpha = alpha;
    canvasCtx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) canvasCtx.moveTo(p[0], p[1]);
      else canvasCtx.lineTo(p[0], p[1]);
    });
    canvasCtx.closePath();
    canvasCtx.strokeStyle = color;
    canvasCtx.lineWidth = hoverIndex >= 0 || isFocus ? 2.5 : 1.5;
    canvasCtx.stroke();
    canvasCtx.restore();
    canvasCtx.save();
    canvasCtx.globalAlpha = alpha;
    const showSymbol = s.showSymbol === true;
    points.forEach((p, i) => {
      const isHover = i === hoverIndex;
      if (!showSymbol && !isHover) return;
      canvasCtx.beginPath();
      canvasCtx.arc(p[0], p[1], isHover ? 6 : 3, 0, Math.PI * 2);
      canvasCtx.fillStyle = isHover ? theme.backgroundColor : color;
      canvasCtx.fill();
      canvasCtx.strokeStyle = color;
      canvasCtx.lineWidth = 2;
      if (isHover) {
        canvasCtx.beginPath();
        canvasCtx.arc(p[0], p[1], 10, 0, Math.PI * 2);
        canvasCtx.strokeStyle = color + "40";
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
        canvasCtx.beginPath();
        canvasCtx.arc(p[0], p[1], 6, 0, Math.PI * 2);
        canvasCtx.fillStyle = theme.backgroundColor;
        canvasCtx.fill();
        canvasCtx.strokeStyle = color;
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
      }
    });
    canvasCtx.restore();
  });
  // 轴悬浮时的顶点强调（DESIGN §3.1）：各可见系列在该维度的顶点画实心点
  if (hoverIndex >= 0 && hoverIndex < indicators.length) {
    const t = hoverAnimProgress;
    if (t > 0.01) {
      series.forEach((s, seriesIndex) => {
        if (ctx.hiddenSeries.has(s.name)) return;
        const color = s.color || theme.colors[seriesIndex % theme.colors.length];
        const indicator = indicators[hoverIndex];
        const min = indicator.min || 0;
        const span = (indicator.max ?? 0) - min;
        const value = s.data[hoverIndex] || 0;
        const r = radius * Math.min(1, Math.max(0, span > 0 ? (value - min) / span : 0)) * progress;
        const angle = hoverIndex * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        canvasCtx.save();
        canvasCtx.globalAlpha = t;
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 3.5, 0, Math.PI * 2);
        canvasCtx.fillStyle = color;
        canvasCtx.fill();
        canvasCtx.strokeStyle = theme.backgroundColor;
        canvasCtx.lineWidth = 1.5;
        canvasCtx.stroke();
        canvasCtx.restore();
      });
    }
  }
}
export {
  buildPieSlices,
  computeFacetGrids,
  computeMatrixCells,
  computePieMaxRadius,
  createScatterScale,
  linearFit,
  matrixFieldExtent,
  renderBarChart,
  renderHorizontalBarChart,
  renderLineChart,
  renderPieChart,
  renderRadarChart,
  renderScatterChart,
  renderScatterFacetChart,
  renderScatterMatrixChart,
  renderScatterTrendline,
  scatterGroupColors,
  scatterPointPositions
};
