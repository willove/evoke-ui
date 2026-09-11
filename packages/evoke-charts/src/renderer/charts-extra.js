import { estimateTextWidth, getContrastText, buildSeriesColorIndex, isMissingValue, focusAlpha } from "./core";
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
function layoutSunburst(nodes, r0, ringWidth, depth, startAngle, colorOffset, result) {
  const total = nodes.reduce((s, n) => s + n.value, 0);
  if (total <= 0) return result;
  let a = startAngle;
  nodes.forEach((n, i) => {
    const span = n.value / total * Math.PI * 2;
    result.push({
      startAngle: a,
      endAngle: a + span,
      midAngle: a + span / 2,
      r0,
      r1: r0 + ringWidth,
      node: n,
      depth,
      colorIndex: (colorOffset + i) % 8
    });
    if (n.children && n.children.length > 0) {
      layoutSunburst(n.children, r0 + ringWidth, ringWidth, depth + 1, a, colorOffset + i, result);
    }
    a += span;
  });
  return result;
}
function renderSunburstChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, valueFormatter } = ctx;
  const data = options.sunburstData || [];
  if (data.length === 0) return;
  const centerX = plotArea.x + plotArea.width / 2;
  const centerY = plotArea.y + plotArea.height / 2;
  const maxR = Math.max(40, Math.min(plotArea.width, plotArea.height) / 2 - 10);
  const innerHole = Math.max(0, maxR * 0.18);
  const depthCount = computeSunburstDepth(data);
  const ringWidth = (maxR - innerHole) / depthCount;
  const segments = layoutSunburst(data, innerHole, ringWidth, 0, -Math.PI / 2, 0, []);
  const sweep = -Math.PI / 2 + Math.PI * 2 * progress;
  canvasCtx.save();
  canvasCtx.beginPath();
  canvasCtx.moveTo(centerX, centerY);
  canvasCtx.arc(centerX, centerY, maxR + 4, -Math.PI / 2, sweep);
  canvasCtx.closePath();
  canvasCtx.clip();
  segments.forEach((seg, i) => {
    const color = seg.node.color || theme.colors[seg.colorIndex % theme.colors.length];
    const isHover = i === hoverIndex;
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, seg.r1, seg.startAngle, seg.endAngle);
    canvasCtx.arc(centerX, centerY, seg.r0, seg.endAngle, seg.startAngle, true);
    canvasCtx.closePath();
    canvasCtx.fillStyle = isHover ? color : color + (seg.depth === 0 ? "" : "dd");
    canvasCtx.fill();
    canvasCtx.strokeStyle = theme.backgroundColor;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
    if (isHover) {
      canvasCtx.strokeStyle = theme.textColor;
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    }
    canvasCtx.restore();
    const span = seg.endAngle - seg.startAngle;
    const midR = (seg.r0 + seg.r1) / 2;
    const chord = midR * span;
    const name = seg.node.name || "";
    if (progress > 0.9 && span > 0.12 && chord > estimateTextWidth(name, 11) + 8 && seg.r1 - seg.r0 > 13) {
      const lx = centerX + Math.cos(seg.midAngle) * midR;
      const ly = centerY + Math.sin(seg.midAngle) * midR;
      canvasCtx.save();
      canvasCtx.fillStyle = getContrastText(color);
      canvasCtx.font = seg.depth === 0 ? "bold 12px Inter, sans-serif" : "11px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(name, lx, ly - (options.showValues ? 6 : 0));
      if (options.showValues && seg.r1 - seg.r0 > 26) {
        canvasCtx.font = "10px Inter, sans-serif";
        canvasCtx.fillText(valueFormatter(seg.node.value), lx, ly + 8);
      }
      canvasCtx.restore();
    }
  });
  canvasCtx.restore();
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
  computeSunburstDepth,
  layoutSunburst,
  renderBoxplotChart,
  renderMixedChart,
  renderSunburstChart,
  renderWaterfallChart
};
