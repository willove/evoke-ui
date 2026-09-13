import { estimateTextWidth, getContrastText, isLightColor, mixColor, buildSeriesColorIndex, isMissingValue, focusAlpha } from "./core";
import { INTERACTION } from "../interactions";
import { renderLineChart } from "./charts-basic";
function renderWaterfallChart(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, valueFormatter, hiddenSeries } = ctx;
  const wf = options.waterfall || {};
  const labels = options.labels || [];
  const deltas = (options.series || []).filter((s) => !hiddenSeries.has(s.name))[0]?.data || [];
  if (labels.length === 0 || deltas.length === 0) return;
  const totalIdx = new Set(wf.totalIndices || []);
  const increaseColor = wf.increaseColor || "#dc2626";
  const decreaseColor = wf.decreaseColor || "#16a34a";
  const totalColor = wf.totalColor || theme.colors[0];
  const categoryWidth = plotArea.width / labels.length;
  const barWidth = Math.min(categoryWidth * 0.6, 64);
  const yFor = (v) => plotArea.y + plotArea.height - (v - yRange.min) / (yRange.max - yRange.min) * plotArea.height;
  let cumulative = 0;
  let prevEdgeX = null;
  let prevExitY = null;
  labels.forEach((_, i) => {
    const raw = deltas[i];
    if (isMissingValue(raw)) return;
    const v = raw;
    const isTotal = totalIdx.has(i);
    let from;
    let to;
    let color;
    if (isTotal) {
      from = 0;
      to = v;
      cumulative = v;
      color = totalColor;
    } else {
      from = cumulative;
      to = cumulative + v;
      cumulative = to;
      color = v >= 0 ? increaseColor : decreaseColor;
    }
    const cx = plotArea.x + (i + 0.5) * categoryWidth;
    const x = cx - barWidth / 2;
    const isHover = i === hoverIndex;
    if (wf.showConnector !== false && prevEdgeX !== null && prevExitY !== null) {
      canvasCtx.save();
      canvasCtx.strokeStyle = theme.borderColor;
      canvasCtx.lineWidth = 1;
      canvasCtx.setLineDash([3, 3]);
      canvasCtx.beginPath();
      canvasCtx.moveTo(prevEdgeX, prevExitY);
      canvasCtx.lineTo(x, prevExitY);
      canvasCtx.stroke();
      canvasCtx.restore();
    }
    const animTo = from + (to - from) * progress;
    const yTop = yFor(Math.max(from, animTo));
    const yBottom = yFor(Math.min(from, animTo));
    const top = Math.min(yTop, yBottom);
    const height = Math.abs(yTop - yBottom);
    canvasCtx.save();
    if (height > 0.5) {
      const r = Math.min(2, barWidth / 2, height / 2);
      canvasCtx.beginPath();
      canvasCtx.moveTo(x, top + height);
      canvasCtx.lineTo(x, top + r);
      canvasCtx.quadraticCurveTo(x, top, x + r, top);
      canvasCtx.lineTo(x + barWidth - r, top);
      canvasCtx.quadraticCurveTo(x + barWidth, top, x + barWidth, top + r);
      canvasCtx.lineTo(x + barWidth, top + height);
      canvasCtx.closePath();
      canvasCtx.fillStyle = isHover ? color + "dd" : color;
      canvasCtx.fill();
    }
    if (isHover && height > 0.5) {
      canvasCtx.fillStyle = "rgba(255, 255, 255, 0.3)";
      canvasCtx.fillRect(x, top, barWidth, Math.min(6, height));
    }
    canvasCtx.restore();
    if (options.showValues && progress > 0.9 && height > 0.5) {
      canvasCtx.save();
      canvasCtx.fillStyle = theme.textColor;
      canvasCtx.font = "11px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "bottom";
      canvasCtx.fillText(valueFormatter(v), cx, top - 4);
      canvasCtx.restore();
    }
    prevEdgeX = x + barWidth;
    prevExitY = yFor(cumulative);
  });
}
function renderBoxplotChart(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex } = ctx;
  const boxData = options.boxData || [];
  if (boxData.length === 0) return;
  const categoryWidth = plotArea.width / boxData.length;
  const boxWidth = Math.min(categoryWidth * 0.5, 44);
  const capWidth = boxWidth * 0.55;
  const yFor = (v) => plotArea.y + plotArea.height - (v - yRange.min) / (yRange.max - yRange.min) * plotArea.height;
  boxData.forEach((b, i) => {
    const cx = plotArea.x + (i + 0.5) * categoryWidth;
    const color = b.color || theme.colors[i % theme.colors.length];
    const isHover = i === hoverIndex;
    const grow = (v) => b.median + (v - b.median) * progress;
    const yMin = yFor(grow(b.min));
    const yQ1 = yFor(grow(b.q1));
    const yMed = yFor(b.median);
    const yQ3 = yFor(grow(b.q3));
    const yMax = yFor(grow(b.max));
    canvasCtx.save();
    canvasCtx.strokeStyle = color;
    canvasCtx.fillStyle = color;
    canvasCtx.lineWidth = isHover ? 2 : 1.5;
    canvasCtx.beginPath();
    canvasCtx.moveTo(cx, yMin);
    canvasCtx.lineTo(cx, yQ1);
    canvasCtx.moveTo(cx, yQ3);
    canvasCtx.lineTo(cx, yMax);
    canvasCtx.stroke();
    canvasCtx.beginPath();
    canvasCtx.moveTo(cx - capWidth / 2, yMin);
    canvasCtx.lineTo(cx + capWidth / 2, yMin);
    canvasCtx.moveTo(cx - capWidth / 2, yMax);
    canvasCtx.lineTo(cx + capWidth / 2, yMax);
    canvasCtx.stroke();
    canvasCtx.fillStyle = color + (isHover ? "55" : "33");
    canvasCtx.fillRect(cx - boxWidth / 2, yQ3, boxWidth, Math.max(1, yQ1 - yQ3));
    canvasCtx.strokeRect(cx - boxWidth / 2, yQ3, boxWidth, Math.max(1, yQ1 - yQ3));
    canvasCtx.lineWidth = isHover ? 2.5 : 2;
    canvasCtx.beginPath();
    canvasCtx.moveTo(cx - boxWidth / 2, yMed);
    canvasCtx.lineTo(cx + boxWidth / 2, yMed);
    canvasCtx.stroke();
    b.outliers?.forEach((o) => {
      const oy = yFor(grow(o));
      canvasCtx.beginPath();
      canvasCtx.arc(cx, oy, isHover ? 3.5 : 2.5, 0, Math.PI * 2);
      canvasCtx.fillStyle = color;
      canvasCtx.fill();
    });
    if (isHover) {
      canvasCtx.strokeStyle = theme.textColor;
      canvasCtx.lineWidth = 1;
      canvasCtx.setLineDash([3, 3]);
      canvasCtx.strokeRect(cx - boxWidth / 2 - 6, yMax - 6, boxWidth + 12, yMin - yMax + 12);
      canvasCtx.setLineDash([]);
    }
    canvasCtx.restore();
    canvasCtx.save();
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.font = "12px Inter, sans-serif";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "top";
    let label = b.label;
    const maxWidth = categoryWidth - 8;
    if (canvasCtx.measureText(label).width > maxWidth) {
      let lo = 0, hi = label.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (canvasCtx.measureText(label.slice(0, mid) + "\u2026").width > maxWidth) hi = mid - 1;
        else lo = mid;
      }
      label = label.slice(0, lo) + "\u2026";
    }
    canvasCtx.fillText(label, cx, plotArea.y + plotArea.height + 8);
    canvasCtx.restore();
  });
}
function computeSunburstDepth(nodes) {
  if (nodes.length === 0) return 0;
  let max = 1;
  nodes.forEach((n) => {
    if (n.children && n.children.length > 0) {
      max = Math.max(max, 1 + computeSunburstDepth(n.children));
    }
  });
  return max;
}
// 中心留白占半径比例；同色系逐层混合步长与上限（浅色主题向白、深色主题向黑）
const SUNBURST_HOLE_RATIO = 0.22;
const SUNBURST_LIGHT_STEP = 0.26;
const SUNBURST_LIGHT_MAX = 0.6;
const SUNBURST_DARK_STEP = 0.14;
const SUNBURST_DARK_MAX = 0.34;
/** 父节点可省略 value（由子孙汇总）；直接读 n.value 会得到 NaN，
 *  让后续兄弟分支的角度全部失效、只剩第一个分支可见 */
function sunburstValue(node) {
  if (typeof node.value === "number" && Number.isFinite(node.value)) return node.value;
  if (node.children && node.children.length > 0) return node.children.reduce((s, c) => s + sunburstValue(c), 0);
  return 0;
}
function layoutSunburst(nodes, r0, ringWidth, depth, startAngle, colorOffset, result, sweep = Math.PI * 2, parentIndex = -1) {
  const total = nodes.reduce((s, n) => s + sunburstValue(n), 0);
  if (total <= 0) return result;
  let a = startAngle;
  nodes.forEach((n, i) => {
    // 一级分支各占一个色相槽，子孙继承同一槽——同色系靠深度混合区分
    const slot = depth === 0 ? (colorOffset + i) % 8 : colorOffset % 8;
    // 子节点扇区收敛在父扇区内：整圆占比 × 父扇区扫角，同一射线各层边界对齐
    const span = sweep * sunburstValue(n) / total;
    const selfIndex = result.length;
    result.push({
      startAngle: a,
      endAngle: a + span,
      midAngle: a + span / 2,
      r0,
      r1: r0 + ringWidth,
      node: n,
      value: sunburstValue(n),
      depth,
      colorIndex: slot,
      parentIndex
    });
    if (n.children && n.children.length > 0) {
      layoutSunburst(n.children, r0 + ringWidth, ringWidth, depth + 1, a, slot, result, span, selfIndex);
    }
    a += span;
  });
  return result;
}
// 悬浮聚焦：自身与子孙保持原色，其余段与标签淡出（档位见 interactions.js）
const SUNBURST_DIM_ALPHA = INTERACTION.hierarchyDimAlpha;
function isSunburstDescendant(segments, index, ancestorIndex) {
  let cursor = index;
  while (cursor >= 0) {
    if (cursor === ancestorIndex) return true;
    cursor = segments[cursor].parentIndex;
  }
  return false;
}
/** 环带颜色：同色系按深度向背景方向混合，外圈大面积不刺眼 */
function sunburstDepthColor(base, depth, theme) {
  if (depth <= 0) return base;
  const darker = !isLightColor(theme.backgroundColor);
  const step = darker ? SUNBURST_DARK_STEP : SUNBURST_LIGHT_STEP;
  const cap = darker ? SUNBURST_DARK_MAX : SUNBURST_LIGHT_MAX;
  return mixColor(base, Math.min(cap, depth * step), darker ? "#000000" : "#ffffff");
}
function sunburstNodeColor(seg, theme) {
  const base = seg.node.color || theme.colors[seg.colorIndex % theme.colors.length];
  // 深层节点上显式指定的颜色视为该段的定色，不再参与逐层混合
  if (seg.node.color && seg.depth > 0) return seg.node.color;
  return sunburstDepthColor(base, seg.depth, theme);
}
/** 旭日图几何：渲染与悬浮命中共用一份口径（环厚、留白、半径预算） */
function computeSunburstGeometry(plotArea, options, theme, valueFormatter) {
  const data = options.sunburstData || [];
  const depthCount = computeSunburstDepth(data);
  if (data.length === 0 || depthCount === 0) return null;
  const centerX = plotArea.x + plotArea.width / 2;
  const centerY = plotArea.y + plotArea.height / 2;
  const maxR = Math.max(40, Math.min(plotArea.width, plotArea.height) / 2 - 20);
  const innerHole = Math.max(0, maxR * SUNBURST_HOLE_RATIO);
  const ringWidth = (maxR - innerHole) / depthCount;
  const segments = layoutSunburst(data, innerHole, ringWidth, 0, -Math.PI / 2, 0, []);
  segments.forEach((seg) => {
    seg.color = sunburstNodeColor(seg, theme);
  });
  return {
    centerX,
    centerY,
    maxR,
    innerHole,
    ringWidth,
    depthCount,
    segments,
    showValues: options.showValues === true,
    valueFormatter
  };
}
function renderSunburstChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, valueFormatter, hoverAnimProgress = 1 } = ctx;
  const geo = computeSunburstGeometry(plotArea, options, theme, valueFormatter);
  if (!geo) return;
  const { centerX, centerY, maxR, ringWidth, depthCount, segments, showValues } = geo;
  const sweep = -Math.PI / 2 + Math.PI * 2 * progress;
  // 入场：角度按 progress 扫开 + 半径轻微生长，终态即静态形态
  const grow = 0.94 + 0.06 * progress;
  const focusIndex = hoverIndex >= 0 && hoverIndex < segments.length ? hoverIndex : -1;
  // 悬浮聚焦子树：焦段原色、其余淡出（随 hoverAnimProgress 缓动）
  const dimAlpha = 1 - (1 - SUNBURST_DIM_ALPHA) * hoverAnimProgress;
  const alphaAt = (i) => (focusIndex < 0 || isSunburstDescendant(segments, i, focusIndex) ? 1 : dimAlpha);
  const labels = [];
  canvasCtx.save();
  canvasCtx.beginPath();
  canvasCtx.moveTo(centerX, centerY);
  canvasCtx.arc(centerX, centerY, maxR + 4, -Math.PI / 2, sweep);
  canvasCtx.closePath();
  canvasCtx.clip();
  segments.forEach((seg, i) => {
    // 被悬浮节点再加深一档：同色不引强调色，也不位移
    const color = i === focusIndex ? mixColor(seg.color, 0.08, "#000000") : seg.color;
    canvasCtx.save();
    canvasCtx.globalAlpha = alphaAt(i);
    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, seg.r1 * grow, seg.startAngle, seg.endAngle);
    canvasCtx.arc(centerX, centerY, seg.r0 * grow, seg.endAngle, seg.startAngle, true);
    canvasCtx.closePath();
    canvasCtx.fillStyle = color;
    canvasCtx.fill();
    canvasCtx.strokeStyle = theme.backgroundColor;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
    canvasCtx.restore();
    if (progress <= 0.9) return;
    // 标签：各环一律沿半径方向旋转，居中在自己的环带里
    const name = seg.node.name || "";
    if (!name) return;
    const span = seg.endAngle - seg.startAngle;
    const midR = (seg.r0 + seg.r1) / 2;
    const chord = midR * span;
    if (ringWidth < 12 || chord < 11) return;
    const value = showValues && ringWidth >= 26 ? valueFormatter(seg.value) : null;
    const textWidth = Math.max(estimateTextWidth(name, 11), value ? estimateTextWidth(value, 10) : 0);
    if (textWidth > ringWidth + 20) return;
    labels.push({
      x: centerX + Math.cos(seg.midAngle) * midR,
      y: centerY + Math.sin(seg.midAngle) * midR,
      midAngle: seg.midAngle,
      name,
      value,
      bold: seg.depth === 0,
      fill: getContrastText(color),
      alpha: alphaAt(i),
    });
  });
  canvasCtx.restore();
  // 段内标签（本身就在盘内，不受圆盘裁剪影响）
  labels.forEach((l) => {
    canvasCtx.save();
    canvasCtx.globalAlpha = l.alpha;
    canvasCtx.fillStyle = l.fill;
    canvasCtx.font = l.bold ? "bold 11px Inter, sans-serif" : "11px Inter, sans-serif";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    canvasCtx.translate(l.x, l.y);
    let rot = l.midAngle;
    if (rot > Math.PI / 2 || rot < -Math.PI / 2) rot += Math.PI;
    canvasCtx.rotate(rot);
    canvasCtx.fillText(l.name, 0, l.value ? -7 : 0);
    if (l.value) {
      canvasCtx.font = "10px Inter, sans-serif";
      canvasCtx.fillText(l.value, 0, 7);
    }
    canvasCtx.restore();
  });
}
function renderMixedChart(ctx, leftRange, rightRange) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hiddenSeries } = ctx;
  const labels = options.labels || [];
  const visibleSeries = (options.series || []).filter((s) => !hiddenSeries.has(s.name));
  const barSeries = visibleSeries.filter((s) => (s.chartType || "line") === "bar");
  if (barSeries.length > 0 && labels.length > 0) {
    const categoryWidth = plotArea.width / labels.length;
    const barCategoryGap = 0.3;
    const groupWidth = categoryWidth * (1 - barCategoryGap);
    const slotWidth = groupWidth / barSeries.length;
    const barWidth = slotWidth * 0.8;
    const seriesColorIdx = buildSeriesColorIndex(options.series || []);
    barSeries.forEach((series) => {
      const range = series.yAxis === "right" && rightRange ? rightRange : leftRange;
      const rawZeroY = plotArea.y + plotArea.height - (0 - range.min) / (range.max - range.min) * plotArea.height;
      const zeroY = Math.min(Math.max(rawZeroY, plotArea.y), plotArea.y + plotArea.height);
      const color = series.color || theme.colors[(seriesColorIdx.get(series) ?? 0) % theme.colors.length];
      const seriesOffset = barSeries.indexOf(series) * slotWidth + (slotWidth - barWidth) / 2;
      series.data.forEach((raw, i) => {
        if (isMissingValue(raw)) return;
        const value = raw;
        const x = plotArea.x + i * categoryWidth + (categoryWidth - groupWidth) / 2 + seriesOffset;
        const valueY = plotArea.y + plotArea.height - (value - range.min) / (range.max - range.min) * plotArea.height * progress;
        const barTop = Math.min(zeroY, valueY);
        const barHeight = Math.abs(zeroY - valueY);
        const isHover = i === hoverIndex;
        if (barHeight > 0.5) {
          const r = Math.min(3, barWidth / 2, barHeight / 2);
          canvasCtx.save();
          canvasCtx.globalAlpha = focusAlpha(ctx, series.name);
          canvasCtx.beginPath();
          canvasCtx.moveTo(x, barTop + barHeight);
          canvasCtx.lineTo(x, barTop + r);
          canvasCtx.quadraticCurveTo(x, barTop, x + r, barTop);
          canvasCtx.lineTo(x + barWidth - r, barTop);
          canvasCtx.quadraticCurveTo(x + barWidth, barTop, x + barWidth, barTop + r);
          canvasCtx.lineTo(x + barWidth, barTop + barHeight);
          canvasCtx.closePath();
          canvasCtx.fillStyle = isHover ? color + "dd" : color + "cc";
          canvasCtx.fill();
          canvasCtx.restore();
        }
      });
    });
  }
  let points = renderLineChart(ctx, leftRange, "left");
  if (rightRange) {
    points = points.concat(renderLineChart(ctx, rightRange, "right"));
  }
  return points;
}
export {
  SUNBURST_DIM_ALPHA,
  computeSunburstDepth,
  computeSunburstGeometry,
  isSunburstDescendant,
  layoutSunburst,
  renderBoxplotChart,
  renderMixedChart,
  renderSunburstChart,
  renderWaterfallChart,
  sunburstValue
};
