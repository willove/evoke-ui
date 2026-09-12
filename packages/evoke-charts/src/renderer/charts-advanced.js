import { CHART_COLORS } from "../types";
import { roundRect, getContrastText } from "./core";
function renderFunnelChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hiddenSeries } = ctx;
  const allData = options.funnelData || [];
  const funnelData = allData.filter((d) => !hiddenSeries.has(d.label || ""));
  if (funnelData.length === 0) return;
  const maxWidth = plotArea.width * 0.8;
  const centerX = plotArea.x + plotArea.width / 2;
  const topY = plotArea.y + 8;
  const bottomY = plotArea.y + plotArea.height - 8;
  const totalHeight = bottomY - topY;
  const stepHeight = totalHeight / funnelData.length;
  const maxValue = Math.max(...funnelData.map((d) => d.value));
  const drawData = options.pyramid === true ? [...funnelData].reverse() : funnelData;
  // 标签在进度后段平滑淡入，不硬蹦
  const labelAlpha = Math.min(1, Math.max(0, (progress - 0.72) / 0.28));
  const outsideLabels = [];
  drawData.forEach((data, i) => {
    const color = data.color || theme.colors[funnelData.indexOf(data) % theme.colors.length];
    const isHover = i === hoverIndex;
    const easedWidth = 1 - Math.pow(1 - progress, 3);
    const currentWidth = data.value / maxValue * maxWidth * easedWidth;
    const nextValue = drawData[i + 1]?.value ?? data.value * 0.5;
    const nextWidth = nextValue / maxValue * maxWidth * easedWidth;
    const y = topY + i * stepHeight;
    const yOffset = isHover ? -3 : 0;
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.moveTo(centerX - currentWidth / 2, y + yOffset);
    canvasCtx.lineTo(centerX + currentWidth / 2, y + yOffset);
    canvasCtx.lineTo(centerX + nextWidth / 2, y + stepHeight + yOffset);
    canvasCtx.lineTo(centerX - nextWidth / 2, y + stepHeight + yOffset);
    canvasCtx.closePath();
    canvasCtx.fillStyle = isHover ? color + "dd" : color;
    canvasCtx.fill();
    canvasCtx.strokeStyle = theme.backgroundColor;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
    canvasCtx.restore();
    if (labelAlpha <= 0) return;
    const labelY = y + stepHeight / 2 + yOffset;
    const percentage = (data.value / drawData[0].value * 100).toFixed(1);
    const label = `${data.label}`;
    const valueText = `${data.value} (${percentage}%)`;
    canvasCtx.save();
    canvasCtx.font = "bold 13px Inter, sans-serif";
    const labelWidth = canvasCtx.measureText(label).width;
    canvasCtx.font = "11px Inter, sans-serif";
    const valueWidth = canvasCtx.measureText(valueText).width;
    const minTextWidth = Math.max(labelWidth, valueWidth) + 28;
    const trapezoidWidth = (currentWidth + nextWidth) / 2;
    // 段内两行：名称与数值行距 18px；梯形放不下（两侧各留 14px）或层高不足时转外侧引线
    if (trapezoidWidth >= minTextWidth && stepHeight >= 36) {
      canvasCtx.globalAlpha = labelAlpha;
      canvasCtx.fillStyle = theme.backgroundColor;
      canvasCtx.font = "bold 13px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(label, centerX, labelY - 9);
      canvasCtx.font = "11px Inter, sans-serif";
      canvasCtx.fillText(valueText, centerX, labelY + 9);
    } else {
      outsideLabels.push({
        labelY,
        lineEndX: centerX + currentWidth / 2,
        label,
        valueText,
        labelTextWidth: Math.max(labelWidth, valueWidth),
      });
    }
    canvasCtx.restore();
  });
  // 外侧引线标签：右对齐两行，纵向最小间距 34px 防重叠
  outsideLabels.sort((a, b) => a.labelY - b.labelY);
  const textX = plotArea.x + plotArea.width - 4;
  let lastBottom = -Infinity;
  const placed = outsideLabels.map((o) => {
    const top = Math.max(o.labelY - 13, lastBottom + 2);
    lastBottom = top + 36;
    return { ...o, top };
  });
  placed.forEach((o) => {
    canvasCtx.save();
    canvasCtx.globalAlpha = labelAlpha;
    canvasCtx.strokeStyle = theme.textColorSecondary;
    canvasCtx.lineWidth = 1;
    canvasCtx.setLineDash([3, 3]);
    canvasCtx.beginPath();
    canvasCtx.moveTo(o.lineEndX, o.labelY);
    canvasCtx.lineTo(textX - o.labelTextWidth - 10, o.top + 12);
    canvasCtx.stroke();
    canvasCtx.setLineDash([]);
    const nameY = o.top + 12;
    canvasCtx.fillStyle = theme.textColor;
    canvasCtx.font = "bold 12px Inter, sans-serif";
    canvasCtx.textAlign = "right";
    canvasCtx.textBaseline = "bottom";
    canvasCtx.fillText(o.label, textX, nameY);
    canvasCtx.font = "11px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.textBaseline = "top";
    canvasCtx.fillText(o.valueText, textX, nameY + 2);
    canvasCtx.restore();
  });
}
function renderGaugeChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex } = ctx;
  const gauge = options.gauge;
  if (!gauge) return;
  const min = gauge.min || 0;
  const max = gauge.max || 100;
  const value = Math.max(min, Math.min(max, gauge.value));
  const startAngle = (gauge.startAngle ?? 220) * Math.PI / 180;
  const endAngle = (gauge.endAngle ?? -40) * Math.PI / 180;
  let normalizedEnd = endAngle;
  while (normalizedEnd > startAngle) normalizedEnd -= Math.PI * 2;
  const centerX = plotArea.x + plotArea.width / 2;
  const centerY = plotArea.y + plotArea.height / 2 + 20;
  const radius = Math.max(40, Math.min(plotArea.width, plotArea.height) / 2 - 20);
  const isHover = hoverIndex === 0;
  canvasCtx.save();
  canvasCtx.beginPath();
  canvasCtx.arc(centerX, centerY, radius, startAngle, normalizedEnd, true);
  canvasCtx.strokeStyle = theme.gridColor;
  canvasCtx.lineWidth = isHover ? 22 : 20;
  canvasCtx.lineCap = "round";
  canvasCtx.stroke();
  canvasCtx.restore();
  const valueRatio = (value - min) / (max - min);
  const animatedRatio = valueRatio * progress;
  const valueAngle = startAngle - (startAngle - normalizedEnd) * animatedRatio;
  let progressColor = theme.colors[0];
  if (Array.isArray(gauge.color)) {
    for (const seg of gauge.color) {
      if (value >= seg.from && value <= seg.to) {
        progressColor = seg.color;
        break;
      }
    }
  } else if (typeof gauge.color === "string") {
    progressColor = gauge.color;
  }
  if (gauge.showProgress !== false && animatedRatio > 0) {
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, radius, startAngle, valueAngle, true);
    canvasCtx.strokeStyle = progressColor;
    canvasCtx.lineWidth = isHover ? 22 : 20;
    canvasCtx.lineCap = "round";
    canvasCtx.stroke();
    if (isHover) {
      canvasCtx.shadowColor = progressColor;
      canvasCtx.shadowBlur = 12;
      canvasCtx.stroke();
    }
    canvasCtx.restore();
  }
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "11px Inter, sans-serif";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "middle";
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const ratio = i / ticks;
    const angle = startAngle - (startAngle - normalizedEnd) * ratio;
    const tickValue = min + (max - min) * ratio;
    const labelRadius = radius + 20;
    const x = centerX + Math.cos(angle) * labelRadius;
    const y = centerY + Math.sin(angle) * labelRadius;
    const display = Number.isInteger(tickValue) ? tickValue.toString() : parseFloat(tickValue.toFixed(2)).toString();
    canvasCtx.fillText(display, x, y);
  }
  canvasCtx.restore();
  canvasCtx.save();
  canvasCtx.fillStyle = isHover ? progressColor : theme.textColor;
  canvasCtx.font = `bold ${isHover ? 36 : 32}px Inter, sans-serif`;
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "middle";
  const animatedValue = min + (value - min) * progress;
  canvasCtx.fillText(Math.round(animatedValue).toString(), centerX, centerY - 5);
  if (gauge.unit) {
    canvasCtx.font = "14px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.fillText(gauge.unit, centerX, centerY + 22);
  }
  canvasCtx.restore();
}
function getHeatmapCategories(options) {
  const heatmapData = options.heatmapData || [];
  let xCategories = Array.from(new Set(heatmapData.map((d) => d.x)));
  let yCategories = Array.from(new Set(heatmapData.map((d) => d.y)));
  const sortBy = options.heatmapSortBy;
  if (sortBy === "name") {
    xCategories = [...xCategories].sort((a, b) => a.localeCompare(b));
    yCategories = [...yCategories].sort((a, b) => a.localeCompare(b));
  } else if (sortBy === "value") {
    const yTotals = /* @__PURE__ */ new Map();
    heatmapData.forEach((d) => yTotals.set(d.y, (yTotals.get(d.y) || 0) + d.value));
    yCategories = [...yCategories].sort((a, b) => (yTotals.get(b) || 0) - (yTotals.get(a) || 0));
  }
  return { xCategories, yCategories };
}
function renderHeatmapChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex } = ctx;
  const heatmapData = options.heatmapData || [];
  if (heatmapData.length === 0) return;
  const heatmapConfig = options.heatmap || {};
  const colorScale = heatmapConfig.colorScale || [...CHART_COLORS.heatmapScale];
  const { xCategories, yCategories } = getHeatmapCategories(options);
  const values = heatmapData.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const cellWidth = plotArea.width / xCategories.length;
  const cellHeight = plotArea.height / yCategories.length;
  function getColor(value, customColor) {
    if (customColor) return customColor;
    const ratio = (value - minValue) / valueRange;
    const index = Math.min(colorScale.length - 1, Math.floor(ratio * colorScale.length));
    return colorScale[index];
  }
  heatmapData.forEach((point, i) => {
    const xIndex = xCategories.indexOf(point.x);
    const yIndex = yCategories.indexOf(point.y);
    if (xIndex < 0 || yIndex < 0) return;
    const x = plotArea.x + xIndex * cellWidth;
    const y = plotArea.y + yIndex * cellHeight;
    const isHover = i === hoverIndex;
    canvasCtx.save();
    const color = getColor(point.value, point.color);
    canvasCtx.fillStyle = color;
    const padding = 1;
    roundRect(canvasCtx, x + padding, y + padding, cellWidth - padding * 2, cellHeight - padding * 2, 3);
    canvasCtx.fill();
    if (isHover) {
      canvasCtx.strokeStyle = theme.textColor;
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    }
    if (heatmapConfig.showValues && progress > 0.8) {
      const formatter = heatmapConfig.formatter || ((v) => Number.isInteger(v) ? v.toString() : parseFloat(v.toFixed(2)).toString());
      canvasCtx.fillStyle = getContrastText(color);
      canvasCtx.font = "11px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(formatter(point.value), x + cellWidth / 2, y + cellHeight / 2);
    }
    canvasCtx.restore();
  });
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "11px Inter, sans-serif";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "top";
  xCategories.forEach((cat, i) => {
    canvasCtx.fillText(cat, plotArea.x + (i + 0.5) * cellWidth, plotArea.y + plotArea.height + 8);
  });
  canvasCtx.restore();
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "11px Inter, sans-serif";
  canvasCtx.textAlign = "right";
  canvasCtx.textBaseline = "middle";
  yCategories.forEach((cat, i) => {
    canvasCtx.fillText(cat, plotArea.x - 8, plotArea.y + (i + 0.5) * cellHeight);
  });
  canvasCtx.restore();
  const colorBarEnabled = heatmapConfig.colorBar === true || options.heatmapColorBar === true;
  if (colorBarEnabled) {
    const barWidth = 12;
    const barX = plotArea.x + plotArea.width + 18;
    const barY = plotArea.y;
    const barHeight = Math.min(plotArea.height, 200);
    const gradient = canvasCtx.createLinearGradient(0, barY + barHeight, 0, barY);
    colorScale.forEach((c, i) => gradient.addColorStop(colorScale.length === 1 ? 0 : i / (colorScale.length - 1), c));
    canvasCtx.save();
    roundRect(canvasCtx, barX, barY, barWidth, barHeight, 3);
    canvasCtx.fillStyle = gradient;
    canvasCtx.fill();
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.font = "10px Inter, sans-serif";
    canvasCtx.textAlign = "left";
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText(formatterOrPlain(maxValue), barX + barWidth + 4, barY + 5);
    canvasCtx.fillText(formatterOrPlain(minValue), barX + barWidth + 4, barY + barHeight - 5);
    canvasCtx.restore();
  }
  function formatterOrPlain(v) {
    return heatmapConfig.formatter ? heatmapConfig.formatter(v) : Number.isInteger(v) ? v.toString() : parseFloat(v.toFixed(2)).toString();
  }
}
function renderCandleChart(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex } = ctx;
  const candleData = options.candleData || [];
  if (candleData.length === 0) return;
  const upColor = options.candleUpColor || "#dc2626";
  const downColor = options.candleDownColor || "#16a34a";
  const categoryWidth = plotArea.width / candleData.length;
  const candleWidth = categoryWidth * 0.6;
  candleData.forEach((candle, i) => {
    const x = plotArea.x + (i + 0.5) * categoryWidth;
    const isHover = i === hoverIndex;
    const isUp = candle.close >= candle.open;
    const color = isUp ? upColor : downColor;
    const highY = plotArea.y + plotArea.height - (candle.high - yRange.min) / (yRange.max - yRange.min) * plotArea.height * progress;
    const lowY = plotArea.y + plotArea.height - (candle.low - yRange.min) / (yRange.max - yRange.min) * plotArea.height * progress;
    canvasCtx.save();
    canvasCtx.strokeStyle = color;
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(x, highY);
    canvasCtx.lineTo(x, lowY);
    canvasCtx.stroke();
    const openY = plotArea.y + plotArea.height - (candle.open - yRange.min) / (yRange.max - yRange.min) * plotArea.height * progress;
    const closeY = plotArea.y + plotArea.height - (candle.close - yRange.min) / (yRange.max - yRange.min) * plotArea.height * progress;
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(1, Math.abs(closeY - openY));
    canvasCtx.fillStyle = isHover ? color + "dd" : color;
    canvasCtx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    if (isHover) {
      canvasCtx.strokeStyle = theme.textColor;
      canvasCtx.lineWidth = 1.5;
      canvasCtx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    }
    canvasCtx.restore();
  });
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "11px Inter, sans-serif";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "top";
  const interval = Math.ceil(candleData.length / 10);
  candleData.forEach((candle, i) => {
    if (i % interval !== 0 && i !== candleData.length - 1) return;
    const x = plotArea.x + (i + 0.5) * categoryWidth;
    canvasCtx.fillText(candle.label, x, plotArea.y + plotArea.height + 8);
  });
  canvasCtx.restore();
}
export {
  getHeatmapCategories,
  renderCandleChart,
  renderFunnelChart,
  renderGaugeChart,
  renderHeatmapChart
};
