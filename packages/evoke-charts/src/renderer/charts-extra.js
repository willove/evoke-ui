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
/**
 * 箱型几何（DESIGN：渲染与命中共用一份口径）：支持竖向（默认）/横向
 * （boxHorizontal）/ 分组（boxData[].group 出现即启用，同类目内并排），
 * showOutliers: false 隐藏异常点。
 */
function computeBoxplotGeometry(plotArea, options, theme, hiddenSeries, valueRange) {
  const horizontal = options.boxHorizontal === true;
  const showOutliers = options.showOutliers !== false;
  const raw = options.boxData || [];
  if (raw.length === 0) return null;
  const hidden = hiddenSeries || /* @__PURE__ */ new Set();
  const visible = raw.filter((b) => !(b.group && hidden.has(b.group)) && !hidden.has(b.label));
  if (visible.length === 0) return null;
  const groupedMode = raw.some((b) => b.group);
  const groupNames = [];
  raw.forEach((b) => {
    if (b.group && !groupNames.includes(b.group)) groupNames.push(b.group);
  });
  const categories = [];
  visible.forEach((b) => {
    if (!categories.includes(b.label)) categories.push(b.label);
  });
  const groupCount = groupedMode ? Math.max(1, groupNames.length) : 1;
  const yFor = (v) => plotArea.y + plotArea.height - (v - valueRange.min) / (valueRange.max - valueRange.min) * plotArea.height;
  const xFor = (v) => plotArea.x + (v - valueRange.min) / (valueRange.max - valueRange.min) * plotArea.width;
  const boxes = [];
  const categoryBand = horizontal ? plotArea.height / categories.length : plotArea.width / categories.length;
  const slotW = groupedMode ? categoryBand * 0.7 / groupCount : categoryBand;
  const thicknessBase = groupedMode ? slotW : categoryBand * 0.5;
  const thickness = Math.min(thicknessBase, 44);
  const capWidth = thickness * 0.55;
  visible.forEach((b) => {
    const catIndex = categories.indexOf(b.label);
    const gi = groupedMode ? Math.max(0, groupNames.indexOf(b.group)) : 0;
    const offset = (gi - (groupCount - 1) / 2) * slotW;
    const boxCenterBand = horizontal
      ? plotArea.y + plotArea.height - (catIndex + 0.5) * categoryBand
      : plotArea.x + (catIndex + 0.5) * categoryBand;
    const center = boxCenterBand + offset;
    const grow = (v) => b.median + (v - b.median) * 1; // 静态几何（动画在渲染层）
    if (horizontal) {
      boxes.push({
        b,
        index: boxes.length,
        catIndex,
        color: b.color || (groupedMode ? theme.colors[(groupNames.indexOf(b.group) || 0) % theme.colors.length] : theme.colors[boxes.length % theme.colors.length]),
        cy: center,
        cx: (xFor(grow(b.q1)) + xFor(grow(b.q3))) / 2,
        thickness,
        capWidth,
        wLo: xFor(grow(b.min)),
        wHi: xFor(grow(b.max)),
        qLo: xFor(grow(b.q1)),
        qHi: xFor(grow(b.q3)),
        med: xFor(grow(b.median)),
        outliers: showOutliers ? (b.outliers || []).map((o) => xFor(grow(o))) : [],
      });
    } else {
      boxes.push({
        b,
        index: boxes.length,
        catIndex,
        color: b.color || (groupedMode ? theme.colors[(groupNames.indexOf(b.group) || 0) % theme.colors.length] : theme.colors[boxes.length % theme.colors.length]),
        cx: center,
        cy: (yFor(grow(b.q1)) + yFor(grow(b.q3))) / 2,
        thickness,
        capWidth,
        wLo: yFor(grow(b.max)),
        wHi: yFor(grow(b.min)),
        qLo: yFor(grow(b.q3)),
        qHi: yFor(grow(b.q1)),
        med: yFor(grow(b.median)),
        outliers: showOutliers ? (b.outliers || []).map((o) => yFor(grow(o))) : [],
      });
    }
  });
  return { boxes, categories, groupNames, groupedMode, horizontal, thickness, categoryWidth: categoryBand };
}

function renderBoxplotChart(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hiddenSeries } = ctx;
  const geo = computeBoxplotGeometry(plotArea, options, theme, hiddenSeries, yRange);
  if (!geo) return;
  const { boxes, horizontal } = geo;
  boxes.forEach((box) => {
    const b = box.b;
    const isHover = box.index === hoverIndex;
    const color = box.color;
    const lineWidth = isHover ? 2 : 1.5;
    // 生长动画：min/max/q1/q3 从 median 向外展开
    const grow = (v) => b.median + (v - b.median) * progress;
    canvasCtx.save();
    canvasCtx.strokeStyle = color;
    canvasCtx.fillStyle = color;
    canvasCtx.lineWidth = lineWidth;
    if (horizontal) {
      const yLo = box.cy - box.thickness / 2;
      const yMed = box.cy;
      const wLo = box.cx + (box.wLo - box.cx) * progress;
      const wHi = box.cx + (box.wHi - box.cx) * progress;
      const qLo = box.cx + (box.qLo - box.cx) * progress;
      const qHi = box.cx + (box.qHi - box.cx) * progress;
      canvasCtx.beginPath();
      canvasCtx.moveTo(wLo, yMed);
      canvasCtx.lineTo(qLo, yMed);
      canvasCtx.moveTo(qHi, yMed);
      canvasCtx.lineTo(wHi, yMed);
      const cap = box.capWidth;
      canvasCtx.moveTo(wLo, yMed - cap / 2);
      canvasCtx.lineTo(wLo, yMed + cap / 2);
      canvasCtx.moveTo(wHi, yMed - cap / 2);
      canvasCtx.lineTo(wHi, yMed + cap / 2);
      canvasCtx.stroke();
      canvasCtx.fillStyle = color + (isHover ? "55" : "33");
      canvasCtx.fillRect(qLo, yLo, Math.max(1, qHi - qLo), box.thickness);
      canvasCtx.strokeRect(qLo, yLo, Math.max(1, qHi - qLo), box.thickness);
      canvasCtx.lineWidth = isHover ? 2.5 : 2;
      canvasCtx.beginPath();
      canvasCtx.moveTo(box.cx + (box.med - box.cx) * progress, yLo);
      canvasCtx.lineTo(box.cx + (box.med - box.cx) * progress, yLo + box.thickness);
      canvasCtx.stroke();
      box.outliers.forEach((o) => {
        const ox = box.cx + (o - box.cx) * progress;
        canvasCtx.beginPath();
        canvasCtx.arc(ox, yMed, isHover ? 3.5 : 2.5, 0, Math.PI * 2);
        canvasCtx.fillStyle = color;
        canvasCtx.fill();
      });
      if (isHover) {
        canvasCtx.strokeStyle = theme.textColor;
        canvasCtx.lineWidth = 1;
        canvasCtx.setLineDash([3, 3]);
        canvasCtx.strokeRect(qLo - 6, yLo - 6, Math.max(1, qHi - qLo) + 12, box.thickness + 12);
        canvasCtx.setLineDash([]);
      }
    } else {
      const xLo = box.cx - box.thickness / 2;
      const yMin = box.cy + (box.wLo - box.cy) * progress;
      const yQ1 = box.cy + (box.qLo - box.cy) * progress;
      const yMed = box.cy + (box.med - box.cy) * progress;
      const yQ3 = box.cy + (box.qHi - box.cy) * progress;
      const yMax = box.cy + (box.wHi - box.cy) * progress;
      canvasCtx.beginPath();
      canvasCtx.moveTo(box.cx, yMin);
      canvasCtx.lineTo(box.cx, yQ1);
      canvasCtx.moveTo(box.cx, yQ3);
      canvasCtx.lineTo(box.cx, yMax);
      canvasCtx.stroke();
      canvasCtx.beginPath();
      canvasCtx.moveTo(box.cx - box.capWidth / 2, yMin);
      canvasCtx.lineTo(box.cx + box.capWidth / 2, yMin);
      canvasCtx.moveTo(box.cx - box.capWidth / 2, yMax);
      canvasCtx.lineTo(box.cx + box.capWidth / 2, yMax);
      canvasCtx.stroke();
      canvasCtx.fillStyle = color + (isHover ? "55" : "33");
      canvasCtx.fillRect(xLo, yQ3, box.thickness, Math.max(1, yQ1 - yQ3));
      canvasCtx.strokeRect(xLo, yQ3, box.thickness, Math.max(1, yQ1 - yQ3));
      canvasCtx.lineWidth = isHover ? 2.5 : 2;
      canvasCtx.beginPath();
      canvasCtx.moveTo(xLo, yMed);
      canvasCtx.lineTo(xLo + box.thickness, yMed);
      canvasCtx.stroke();
      box.outliers.forEach((o) => {
        const oy = box.cy + (o - box.cy) * progress;
        canvasCtx.beginPath();
        canvasCtx.arc(box.cx, oy, isHover ? 3.5 : 2.5, 0, Math.PI * 2);
        canvasCtx.fillStyle = color;
        canvasCtx.fill();
      });
      if (isHover) {
        canvasCtx.strokeStyle = theme.textColor;
        canvasCtx.lineWidth = 1;
        canvasCtx.setLineDash([3, 3]);
        canvasCtx.strokeRect(xLo - 6, yMin - 6, box.thickness + 12, yMax - yMin + 12);
        canvasCtx.setLineDash([]);
      }
    }
    canvasCtx.restore();
    // 类目标签：竖向在下方居中，横向在左列右对齐（渲染层处理）
  });
  if (!horizontal) {
    canvasCtx.save();
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.font = "12px Inter, sans-serif";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "top";
    const seen = /* @__PURE__ */ new Set();
    boxes.forEach((box) => {
      if (seen.has(box.catIndex)) return;
      seen.add(box.catIndex);
      let label = box.b.label;
      const maxWidth = geo.categoryWidth - 8;
      if (canvasCtx.measureText(label).width > maxWidth) {
        let lo = 0, hi = label.length;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          if (canvasCtx.measureText(label.slice(0, mid) + "\u2026").width > maxWidth) hi = mid - 1;
          else lo = mid;
        }
        label = label.slice(0, lo) + "\u2026";
      }
      const cx = plotArea.x + (box.catIndex + 0.5) * geo.categoryWidth;
      canvasCtx.fillText(label, cx, plotArea.y + plotArea.height + 8);
    });
    canvasCtx.restore();
  } else {
    canvasCtx.save();
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.font = "12px Inter, sans-serif";
    canvasCtx.textAlign = "right";
    canvasCtx.textBaseline = "middle";
    const seen = /* @__PURE__ */ new Set();
    boxes.forEach((box) => {
      if (seen.has(box.catIndex)) return;
      seen.add(box.catIndex);
      let label = box.b.label;
      const maxWidth = plotArea.x - 12;
      if (canvasCtx.measureText(label).width > maxWidth) {
        let lo = 0, hi = label.length;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          if (canvasCtx.measureText(label.slice(0, mid) + "\u2026").width > maxWidth) hi = mid - 1;
          else lo = mid;
        }
        label = label.slice(0, lo) + "\u2026";
      }
      const cy = plotArea.y + plotArea.height - (box.catIndex + 0.5) * geo.categoryWidth;
      canvasCtx.fillText(label, plotArea.x - 10, cy);
    });
    canvasCtx.restore();
  }
}

function boxplotHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries, valueRange) {
  const geo = computeBoxplotGeometry(plotArea, options, theme, hiddenSeries, valueRange);
  if (!geo) return null;
  const { boxes, horizontal, categoryWidth, thickness } = geo;
  for (const box of boxes) {
    if (horizontal) {
      const half = Math.max(categoryWidth / 2, thickness / 2 + 6);
      if (Math.abs(canvasY - box.cy) <= half) {
        return boxHit(box);
      }
    } else {
      const half = Math.max(categoryWidth / 2, thickness / 2 + 6);
      if (Math.abs(canvasX - box.cx) <= half) {
        return boxHit(box);
      }
    }
  }
  return null;
  function boxHit(box) {
    const b = box.b;
    return {
      index: box.index,
      params: {
        seriesName: geo.groupedMode ? `${b.label} · ${b.group}` : b.label,
        name: `${geo.groupedMode ? `${b.label} · ${b.group}` : b.label}（中位数 ${b.median}）`,
        value: [b.min, b.q1, b.median, b.q3, b.max],
        color: box.color,
        dataIndex: box.index,
        seriesIndex: 0
      }
    };
  }
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
  boxplotHitTest,
  computeBoxplotGeometry,
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
