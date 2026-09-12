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
  // 父节点可省略 value（由子孙汇总）；直接读 n.value 会得到 NaN，
  // 让后续兄弟分支的角度全部失效、只剩第一个分支可见
  const val = (n) => {
    if (typeof n.value === "number" && Number.isFinite(n.value)) return n.value;
    if (n.children && n.children.length > 0) return n.children.reduce((s, c) => s + val(c), 0);
    return 0;
  };
  const total = nodes.reduce((s, n) => s + val(n), 0);
  if (total <= 0) return result;
  let a = startAngle;
  nodes.forEach((n, i) => {
    const span = val(n) / total * Math.PI * 2;
    result.push({
      startAngle: a,
      endAngle: a + span,
      midAngle: a + span / 2,
      r0,
      r1: r0 + ringWidth,
      node: n,
      value: val(n),
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
// 向白色混合（比例 0-1）：旭日图分支同色系逐层提亮用
function mixToWhite(hex, ratio) {
  const r = Math.min(0.85, Math.max(0, ratio));
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * r));
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}
function renderSunburstChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, valueFormatter } = ctx;
  const data = options.sunburstData || [];
  if (data.length === 0) return;
  const centerX = plotArea.x + plotArea.width / 2;
  const centerY = plotArea.y + plotArea.height / 2;
  // 半径为外置叶子标签预留水平 45px / 纵向 24px
  const maxR = Math.max(40, Math.min((plotArea.width - 90) / 2, (plotArea.height - 48) / 2));
  const innerHole = Math.max(0, maxR * 0.22);
  const depthCount = computeSunburstDepth(data);
  // 层级 ≥ 2 时基础环带只占半径预算 66%，其余留给最外层叶子按数值延伸成花瓣
  const hasSpread = depthCount >= 2;
  const ringBudget = hasSpread ? (maxR - innerHole) * 0.66 : maxR - innerHole;
  const ringWidth = ringBudget / depthCount;
  const spreadRange = hasSpread ? maxR - innerHole - ringBudget : 0;
  const segments = layoutSunburst(data, innerHole, ringWidth, 0, -Math.PI / 2, 0, []);
  const maxLeaf = segments
    .filter((s) => s.depth === depthCount - 1)
    .reduce((m, s) => Math.max(m, s.value), 0);
  const sweep = -Math.PI / 2 + Math.PI * 2 * progress;
  const showValues = options.showValues === true;
  const insideLabels = [];
  const outerLabels = [];
  canvasCtx.save();
  canvasCtx.beginPath();
  canvasCtx.moveTo(centerX, centerY);
  canvasCtx.arc(centerX, centerY, maxR + 4, -Math.PI / 2, sweep);
  canvasCtx.closePath();
  canvasCtx.clip();
  segments.forEach((seg, i) => {
    const base = seg.node.color || theme.colors[seg.colorIndex % theme.colors.length];
    const isPetal = hasSpread && seg.depth === depthCount - 1;
    // 分支同色系：每深一层向白提亮约 26%，高饱和只留在内环
    const color = mixToWhite(base, isPetal ? Math.min(0.6, (seg.depth - 1) * 0.26 + 0.2) : seg.depth * 0.26);
    const isHover = i === hoverIndex;
    const petalR = isPetal ? seg.r1 + spreadRange * (seg.value / (maxLeaf || 1)) : seg.r1;
    const r1 = Math.min(maxR, petalR * (0.9 + 0.1 * progress));
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, r1, seg.startAngle, seg.endAngle);
    canvasCtx.arc(centerX, centerY, seg.r0, seg.endAngle, seg.startAngle, true);
    canvasCtx.closePath();
    if (isPetal) {
      // 花瓣端部圆角：同色宽描边（round join）+ 填充
      canvasCtx.lineJoin = "round";
      canvasCtx.strokeStyle = color;
      canvasCtx.lineWidth = 8;
      canvasCtx.stroke();
    }
    canvasCtx.fillStyle = color;
    if (isHover) canvasCtx.globalAlpha = 0.8;
    canvasCtx.fill();
    canvasCtx.strokeStyle = theme.backgroundColor;
    canvasCtx.lineWidth = isPetal ? 1.5 : 2;
    canvasCtx.stroke();
    if (isHover) {
      canvasCtx.strokeStyle = theme.textColor;
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    }
    canvasCtx.restore();
    if (progress <= 0.9) return;
    const span = seg.endAngle - seg.startAngle;
    const midR = (seg.r0 + seg.r1) / 2;
    const chord = midR * span;
    const name = seg.node.name || "";
    const isLeafRing = depthCount > 1 && seg.depth === depthCount - 1;
    if (isLeafRing) {
      // 最外层叶子：标签外置到花瓣尖端外侧，避免往窄环带里塞字
      if (span > 0.05 && name) {
        outerLabels.push({ midAngle: seg.midAngle, r: r1 + 6, name, value: seg.value });
      }
      return;
    }
    if (seg.depth === 0) {
      // 内环：水平加粗，弦长放得下才画
      if (span > 0.14 && chord > estimateTextWidth(name, 12) + 10) {
        const lx = centerX + Math.cos(seg.midAngle) * midR;
        const ly = centerY + Math.sin(seg.midAngle) * midR;
        insideLabels.push({
          x: lx,
          y: ly - (showValues ? 6 : 0),
          name,
          value: showValues && seg.r1 - seg.r0 > 26 ? valueFormatter(seg.value) : null,
          bold: true,
          fill: getContrastText(color),
          radial: false,
          midAngle: seg.midAngle,
        });
      }
      return;
    }
    // 中间环：沿半径方向旋转排布，径向空间即环带厚度，永不相撞
    if (span > 0.08 && ringWidth > 13 && name && estimateTextWidth(name, 10) <= ringWidth + 12) {
      const lx = centerX + Math.cos(seg.midAngle) * midR;
      const ly = centerY + Math.sin(seg.midAngle) * midR;
      insideLabels.push({
        x: lx,
        y: ly,
        name,
        value: null,
        bold: false,
        fill: getContrastText(color),
        radial: true,
        midAngle: seg.midAngle,
      });
    }
  });
  canvasCtx.restore();
  // 段内标签（不受圆盘裁剪影响，本身就在盘内）
  insideLabels.forEach((l) => {
    canvasCtx.save();
    canvasCtx.fillStyle = l.fill;
    canvasCtx.font = l.radial ? "10px Inter, sans-serif" : l.bold ? "bold 12px Inter, sans-serif" : "11px Inter, sans-serif";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    if (l.radial) {
      canvasCtx.translate(l.x, l.y);
      let rot = l.midAngle;
      if (rot > Math.PI / 2 || rot < -Math.PI / 2) rot += Math.PI;
      canvasCtx.rotate(rot);
      canvasCtx.fillText(l.name, 0, 0);
    } else {
      canvasCtx.fillText(l.name, l.x, l.y);
      if (l.value) {
        canvasCtx.font = "10px Inter, sans-serif";
        canvasCtx.fillText(l.value, l.x, l.y + 14);
      }
    }
    canvasCtx.restore();
  });
  // 外置叶子标签：按角度左右取向，纵向 13px 最小间距防重叠
  outerLabels.sort((a, b) => a.midAngle - b.midAngle);
  const placed = [];
  outerLabels.forEach((l) => {
    const cos = Math.cos(l.midAngle);
    const px = centerX + Math.cos(l.midAngle) * l.r;
    const py = centerY + Math.sin(l.midAngle) * l.r;
    const text = showValues ? `${l.name} ${valueFormatter(l.value)}` : l.name;
    const align = cos >= 0 ? "left" : "right";
    placed.push({
      x: px,
      y: py,
      align,
      text,
    });
  });
  placed.sort((a, b) => a.y - b.y);
  let lastY = -Infinity;
  placed.forEach((l) => {
    if (l.y < lastY + 13) l.y = lastY + 13;
    lastY = l.y;
  });
  placed.forEach((l) => {
    canvasCtx.save();
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.font = "11px Inter, sans-serif";
    canvasCtx.textAlign = l.align;
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText(l.text, l.x, l.y);
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
  computeSunburstDepth,
  layoutSunburst,
  renderBoxplotChart,
  renderMixedChart,
  renderSunburstChart,
  renderWaterfallChart
};
