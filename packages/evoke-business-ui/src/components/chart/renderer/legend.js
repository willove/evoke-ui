import { roundRect } from "./core";
const LEGEND_ROW_HEIGHT = 20;
const LEGEND_GAP = 12;
function renderTitle(ctx, paddingTop) {
  const { ctx: canvasCtx, theme, plotArea, options } = ctx;
  if (!options.title) return;
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColor;
  canvasCtx.font = "bold 16px Inter, sans-serif";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "top";
  canvasCtx.fillText(options.title, plotArea.x + plotArea.width / 2, paddingTop);
  if (options.subtitle) {
    canvasCtx.font = "12px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.fillText(options.subtitle, plotArea.x + plotArea.width / 2, paddingTop + 22);
  }
  canvasCtx.restore();
}
function collectLegendItems(options, theme, hiddenSeries) {
  const formatter = options.legend?.formatter;
  const fmt = (name) => formatter ? formatter(name) : name;
  if (options.type === "pie" || options.type === "doughnut" || options.type === "rose") {
    return (options.pieData || []).map((d, i) => ({
      name: d.name || d.label || "",
      label: fmt(d.name || d.label || ""),
      color: d.color || theme.colors[i % theme.colors.length],
      hidden: hiddenSeries.has(d.name || d.label || "")
    }));
  }
  if (options.type === "radar") {
    return (options.radarSeries || []).map((s, i) => ({
      name: s.name,
      label: fmt(s.name),
      color: s.color || theme.colors[i % theme.colors.length],
      hidden: hiddenSeries.has(s.name)
    }));
  }
  if (options.type === "funnel") {
    return (options.funnelData || []).map((d, i) => ({
      name: d.label || "",
      label: fmt(d.label || ""),
      color: d.color || theme.colors[i % theme.colors.length],
      hidden: hiddenSeries.has(d.label || "")
    }));
  }
  return (options.series || []).map((s, i) => ({
    name: s.name,
    label: fmt(s.name),
    color: s.color || theme.colors[i % theme.colors.length],
    hidden: hiddenSeries.has(s.name)
  }));
}
function computeLegendLayout(ctx, options, plotArea, containerWidth, containerHeight, theme, hiddenSeries) {
  const legendConfig = options.legend || {};
  const items = collectLegendItems(options, theme, hiddenSeries);
  const position = legendConfig.position || "bottom";
  const align = legendConfig.align || "center";
  const itemWidths = items.map((item) => {
    let textWidth;
    if (ctx) {
      ctx.save();
      ctx.font = "12px Inter, sans-serif";
      textWidth = ctx.measureText(item.label).width;
      ctx.restore();
    } else {
      textWidth = estimateWidth(item.label);
    }
    return textWidth + 28;
  });
  const availableWidth = position === "left" || position === "right" ? containerWidth : plotArea.width;
  const rowIndices = [];
  let currentRow = [];
  let currentRowWidth = 0;
  items.forEach((_, i) => {
    const need = itemWidths[i] + (currentRow.length > 0 ? LEGEND_GAP : 0);
    if (currentRow.length > 0 && currentRowWidth + need > availableWidth) {
      rowIndices.push(currentRow);
      currentRow = [i];
      currentRowWidth = itemWidths[i];
    } else {
      currentRow.push(i);
      currentRowWidth += need;
    }
  });
  if (currentRow.length > 0) rowIndices.push(currentRow);
  const rowWidths = rowIndices.map(
    (idxs) => idxs.reduce((sum, idx) => sum + itemWidths[idx], 0) + (idxs.length - 1) * LEGEND_GAP
  );
  const rowStartX = rowWidths.map((w) => {
    if (align === "start") return plotArea.x;
    if (align === "end") return plotArea.x + plotArea.width - w;
    return plotArea.x + (plotArea.width - w) / 2;
  });
  // 顶部图例必须排在标题/副标题之下，否则与 renderTitle 的文字重叠
  const titleBlock = (options.title ? 26 : 0) + (options.subtitle ? 18 : 0);
  const baseY = position === "top" ? 10 + titleBlock : containerHeight - 24 - (rowIndices.length - 1) * LEGEND_ROW_HEIGHT;
  const bounds = [];
  rowIndices.forEach((idxs, rowIdx) => {
    let x = rowStartX[rowIdx];
    idxs.forEach((idx) => {
      bounds[idx] = {
        name: items[idx].name,
        x,
        y: baseY + rowIdx * LEGEND_ROW_HEIGHT,
        width: itemWidths[idx],
        height: LEGEND_ROW_HEIGHT
      };
      x += itemWidths[idx] + LEGEND_GAP;
    });
  });
  return { items, bounds, rows: rowIndices.length };
}
function estimateWidth(text) {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) || 0;
    const isFullWidth = code >= 11904 && code <= 40959 || code >= 63744 && code <= 64255 || code >= 65280 && code <= 65376 || code >= 12288 && code <= 12351;
    width += isFullWidth ? 12 : 12 * 0.62;
  }
  return width;
}
function renderLegend(ctx) {
  const { ctx: canvasCtx, theme, options, hiddenSeries, width, height, plotArea } = ctx;
  const legendConfig = options.legend || {};
  if (legendConfig.show === false) return [];
  const layout = computeLegendLayout(canvasCtx, options, plotArea, width, height, theme, hiddenSeries);
  const { items, bounds } = layout;
  canvasCtx.save();
  canvasCtx.font = "12px Inter, sans-serif";
  items.forEach((item, i) => {
    const bound = bounds[i];
    const isHidden = item.hidden;
    const icon = legendConfig.icon || "roundRect";
    canvasCtx.save();
    canvasCtx.globalAlpha = isHidden ? 0.4 : 1;
    canvasCtx.fillStyle = item.color;
    if (icon === "line") {
      canvasCtx.fillRect(bound.x, bound.y + 9, 14, 3);
    } else if (icon === "circle") {
      canvasCtx.beginPath();
      canvasCtx.arc(bound.x + 6, bound.y + 11, 6, 0, Math.PI * 2);
      canvasCtx.fill();
    } else if (icon === "rect") {
      canvasCtx.fillRect(bound.x, bound.y + 5, 12, 12);
    } else {
      roundRect(canvasCtx, bound.x, bound.y + 5, 12, 12, 2);
      canvasCtx.fill();
    }
    canvasCtx.restore();
    canvasCtx.save();
    canvasCtx.fillStyle = isHidden ? theme.textColorSecondary : theme.textColor;
    canvasCtx.globalAlpha = isHidden ? 0.6 : 1;
    canvasCtx.textAlign = "left";
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText(item.label, bound.x + 18, bound.y + 12);
    canvasCtx.restore();
  });
  canvasCtx.restore();
  return items;
}
function getLegendBounds(ctx, options, plotArea, containerWidth, containerHeight, theme, hiddenSeries) {
  const legendConfig = options.legend || {};
  if (legendConfig.show === false) return [];
  const layout = computeLegendLayout(ctx, options, plotArea, containerWidth, containerHeight, theme, hiddenSeries);
  return layout.bounds;
}
const TOOLBOX_SIZE = 22;
const TOOLBOX_GAP = 6;
function getToolboxBounds(options, width) {
  const tb = options.toolbox;
  if (!tb?.show) return [];
  const features = tb.features || ["saveAsImage"];
  const x0 = tb.position === "top-left" ? 10 : width - 10 - (features.length * TOOLBOX_SIZE + (features.length - 1) * TOOLBOX_GAP);
  return features.map((feature, i) => ({
    feature,
    x: x0 + i * (TOOLBOX_SIZE + TOOLBOX_GAP),
    y: 8,
    width: TOOLBOX_SIZE,
    height: TOOLBOX_SIZE
  }));
}
function drawToolboxIcon(canvasCtx, feature, x, y, size, color) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  canvasCtx.save();
  canvasCtx.strokeStyle = color;
  canvasCtx.fillStyle = color;
  canvasCtx.lineWidth = 1.5;
  canvasCtx.lineCap = "round";
  if (feature === "saveAsImage") {
    roundRect(canvasCtx, cx - 8, cy - 5, 16, 12, 2);
    canvasCtx.stroke();
    canvasCtx.beginPath();
    canvasCtx.moveTo(cx - 4, cy - 5);
    canvasCtx.lineTo(cx - 2.5, cy - 8);
    canvasCtx.lineTo(cx + 2.5, cy - 8);
    canvasCtx.lineTo(cx + 4, cy - 5);
    canvasCtx.stroke();
    canvasCtx.beginPath();
    canvasCtx.arc(cx, cy + 1, 3.5, 0, Math.PI * 2);
    canvasCtx.stroke();
  } else {
    canvasCtx.beginPath();
    canvasCtx.arc(cx, cy, 7, -Math.PI * 0.35, Math.PI * 1.35);
    canvasCtx.stroke();
    canvasCtx.beginPath();
    canvasCtx.moveTo(cx + 4.5, cy - 7.5);
    canvasCtx.lineTo(cx + 8, cy - 5.5);
    canvasCtx.lineTo(cx + 5, cy - 2.5);
    canvasCtx.closePath();
    canvasCtx.fill();
  }
  canvasCtx.restore();
}
function renderToolbox(ctx, hoveredFeature) {
  const { ctx: canvasCtx, theme, options, width } = ctx;
  const buttons = getToolboxBounds(options, width);
  if (buttons.length === 0) return;
  const color = options.toolbox?.iconColor || theme.textColorSecondary;
  buttons.forEach((b) => {
    const isHover = hoveredFeature === b.feature;
    canvasCtx.save();
    if (isHover) {
      canvasCtx.fillStyle = theme.highlightColor;
      roundRect(canvasCtx, b.x, b.y, b.width, b.height, 4);
      canvasCtx.fill();
    }
    drawToolboxIcon(canvasCtx, b.feature, b.x, b.y, b.width, isHover ? theme.textColor : color);
    canvasCtx.restore();
  });
}
export {
  computeLegendLayout,
  getLegendBounds,
  getToolboxBounds,
  renderLegend,
  renderTitle,
  renderToolbox
};
