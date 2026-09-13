import { CHART_COLORS } from "../types";
import { roundRect, getContrastText, isLightColor, mixColor } from "./core";

// 漏斗是同一个流程的逐层收窄（不是并列类目）：段色按层序向背景方向混合，
// 与旭日图「分支同色系」同一机制（旭日按深度、漏斗按层序）
const FUNNEL_LIGHT_STEP = 0.15;
const FUNNEL_LIGHT_MAX = 0.6;
const FUNNEL_DARK_STEP = 0.12;
const FUNNEL_DARK_MAX = 0.45;

/** 段色：显式 color 即定色，否则主题首色按层序向背景方向混合 */
export function funnelStepColor(data, index, theme) {
  if (data?.color) return data.color;
  const base = theme.colors?.[0] || CHART_COLORS[0];
  if (index <= 0) return base;
  const darker = !isLightColor(theme.backgroundColor);
  const step = darker ? FUNNEL_DARK_STEP : FUNNEL_LIGHT_STEP;
  const cap = darker ? FUNNEL_DARK_MAX : FUNNEL_LIGHT_MAX;
  return mixColor(base, Math.min(cap, index * step), darker ? "#000000" : "#ffffff");
}

/**
 * 漏斗几何：渲染、图例与悬浮命中共用一份口径。
 * 宽度即数值（末层下宽取自身宽度，底部收成平边而不是针尖）；
 * funnelMinRatio 压缩尾段（0 = 严格等比，单调性不变）。
 */
export function computeFunnelGeometry(plotArea, options, theme) {
  const all = options.funnelData || [];
  const drawn = options.pyramid === true ? [...all].reverse() : all;
  const maxValue = drawn.length ? Math.max(...drawn.map((d) => d.value)) : 0;
  const maxWidth = plotArea.width * 0.8;
  const centerX = plotArea.x + plotArea.width / 2;
  const topY = plotArea.y + 8;
  const totalHeight = plotArea.height - 16;
  const stepHeight = drawn.length ? totalHeight / drawn.length : 0;
  const rawMin = Number(options.funnelMinRatio);
  const minRatio = Number.isFinite(rawMin) ? Math.max(0, Math.min(0.5, rawMin)) : 0;
  const widthOf = (value) => {
    if (!maxValue) return maxWidth;
    return maxWidth * (minRatio + (1 - minRatio) * (value / maxValue));
  };
  const steps = drawn.map((data, slot) => {
    const found = all.indexOf(data);
    const index = found < 0 ? slot : found;
    const next = drawn[slot + 1];
    const topWidth = widthOf(data.value);
    const bottomWidth = next ? widthOf(next.value) : topWidth;
    return {
      data,
      index,
      slot,
      color: funnelStepColor(data, index, theme),
      y: topY + slot * stepHeight,
      height: stepHeight,
      topWidth,
      bottomWidth,
      bandWidth: (topWidth + bottomWidth) / 2,
    };
  });
  return { steps, maxValue, maxWidth, centerX, topY, totalHeight, stepHeight };
}

/** 占比文本：按最大值（漏斗首层）折算，整数不补小数位 */
function funnelPercent(value, maxValue) {
  if (!maxValue) return "0%";
  return `${Math.round((value / maxValue) * 1000) / 10}%`;
}

function renderFunnelChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hiddenSeries } = ctx;
  const allData = options.funnelData || [];
  const funnelData = allData.filter((d) => !hiddenSeries.has(d.label || ""));
  if (funnelData.length === 0) return;
  const geo = computeFunnelGeometry(plotArea, { ...options, funnelData }, theme);
  const { centerX, stepHeight } = geo;
  // 标签在进度后段平滑淡入，不硬蹦
  const labelAlpha = Math.min(1, Math.max(0, (progress - 0.72) / 0.28));
  const easedWidth = 1 - Math.pow(1 - progress, 3);
  const outsideLabels = [];
  geo.steps.forEach((step, i) => {
    const topW = step.topWidth * easedWidth;
    const bottomW = step.bottomWidth * easedWidth;
    const y = step.y;
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.moveTo(centerX - topW / 2, y);
    canvasCtx.lineTo(centerX + topW / 2, y);
    canvasCtx.lineTo(centerX + bottomW / 2, y + stepHeight);
    canvasCtx.lineTo(centerX - bottomW / 2, y + stepHeight);
    canvasCtx.closePath();
    // 悬浮加深一档（同色向黑 8%）：不位移、不引强调色
    canvasCtx.fillStyle = i === hoverIndex ? mixColor(step.color, 0.08, "#000000") : step.color;
    canvasCtx.fill();
    canvasCtx.strokeStyle = theme.backgroundColor;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
    canvasCtx.restore();
    if (labelAlpha <= 0) return;
    const labelY = y + stepHeight / 2;
    const label = `${step.data.label}`;
    const valueText = `${step.data.value} (${funnelPercent(step.data.value, geo.maxValue)})`;
    canvasCtx.save();
    canvasCtx.font = "bold 13px Inter, sans-serif";
    const labelWidth = canvasCtx.measureText(label).width;
    canvasCtx.font = "11px Inter, sans-serif";
    const valueWidth = canvasCtx.measureText(valueText).width;
    const minTextWidth = Math.max(labelWidth, valueWidth) + 28;
    // 段内两行：名称与数值行距 18px；梯形放不下（两侧各留 14px）或层高不足时转外侧引线
    if (step.bandWidth >= minTextWidth && stepHeight >= 36) {
      // 逐层提亮后中间调底色上白字会糊，按段底色取对比度更高的一方
      canvasCtx.globalAlpha = labelAlpha;
      canvasCtx.fillStyle = getContrastText(step.color);
      canvasCtx.font = "bold 13px Inter, sans-serif";
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(label, centerX, labelY - 9);
      canvasCtx.font = "11px Inter, sans-serif";
      canvasCtx.fillText(valueText, centerX, labelY + 9);
    } else {
      outsideLabels.push({
        labelY,
        lineEndX: centerX + topW / 2,
        label,
        valueText,
        labelTextWidth: Math.max(labelWidth, valueWidth),
      });
    }
    canvasCtx.restore();
  });
  // 外侧引线标签：右对齐两行，纵向最小间距 36px 防重叠
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
/**
 * 仪表盘（DESIGN §3.11）：指针 opt-in（gauge.pointer.show），外观定制面
 * axisWidth / tickCount / showTicks / valueFontSize / progressDim；默认值
 * 维持既有形态。指针开启时进度环默认淡化 @60%，中心数值下移避让针根。
 */
function renderGaugeChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex } = ctx;
  const gauge = options.gauge;
  if (!gauge || typeof gauge !== "object") return;
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
  const pointer = gauge.pointer;
  const pointerOn = !!(pointer && pointer.show);
  const axisWidth = Math.max(4, Math.min(60, gauge.axisWidth ?? 20));
  // 指针开启时进度环默认淡化 @60%，progressDim: false 保持原样（DESIGN §3.11）
  const progressDim = pointerOn && gauge.progressDim !== false ? 0.6 : 1;
  canvasCtx.save();
  canvasCtx.beginPath();
  canvasCtx.arc(centerX, centerY, radius, startAngle, normalizedEnd, true);
  canvasCtx.strokeStyle = theme.gridColor;
  canvasCtx.lineWidth = axisWidth;
  canvasCtx.lineCap = gauge.cornerRadius === "butt" ? "butt" : "round";
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
    canvasCtx.globalAlpha = progressDim;
    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, radius, startAngle, valueAngle, true);
    canvasCtx.strokeStyle = progressColor;
    canvasCtx.lineWidth = axisWidth;
    canvasCtx.lineCap = gauge.cornerRadius === "butt" ? "butt" : "round";
    canvasCtx.stroke();
    if (isHover) {
      canvasCtx.shadowColor = progressColor;
      canvasCtx.shadowBlur = 12;
      canvasCtx.stroke();
    }
    canvasCtx.restore();
  }
  // 数字刻度沿用既有形态（showTicks: false 可关）；短刻度线伴随指针出现
  if (gauge.showTicks !== false) {
    drawGaugeTickNumbers(canvasCtx, gauge, theme, centerX, centerY, radius, startAngle, normalizedEnd, min, max);
  }
  if (pointerOn || gauge.tickMarks === true) {
    drawGaugeTickMarks(canvasCtx, gauge, theme, centerX, centerY, radius, startAngle, normalizedEnd);
  }
  if (pointerOn) {
    drawGaugePointer(canvasCtx, gauge, theme, progressColor, centerX, centerY, radius, axisWidth, valueAngle, progress);
  }
  const valueFont = Math.max(12, Math.min(72, gauge.valueFontSize ?? 32));
  canvasCtx.save();
  canvasCtx.fillStyle = isHover ? progressColor : theme.textColor;
  canvasCtx.font = `bold ${isHover ? valueFont + 4 : valueFont}px Inter, sans-serif`;
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "middle";
  const animatedValue = min + (value - min) * progress;
  // 指针开启时数值下移到盘心下方空档（随半径走），避让针根与针身
  const valueY = pointerOn ? centerY + Math.max(26, radius * 0.45) : centerY - 5;
  canvasCtx.fillText(Math.round(animatedValue).toString(), centerX, valueY);
  if (gauge.unit) {
    canvasCtx.font = "14px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.fillText(gauge.unit, centerX, valueY + Math.max(27, valueFont * 0.75));
  }
  canvasCtx.restore();
}

/** 刻度数字（指针模式下刻度线照画、数字照标） */
function drawGaugeTickNumbers(canvasCtx, gauge, theme, centerX, centerY, radius, startAngle, normalizedEnd, min, max) {
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "11px Inter, sans-serif";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "middle";
  const ticks = gauge.tickCount ?? 5;
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
}

/** 短刻度线：主刻度 + 半程小刻度（指针模式下伴生，tickMarks: true 可单独开启） */
function drawGaugeTickMarks(canvasCtx, gauge, theme, centerX, centerY, radius, startAngle, normalizedEnd) {
  canvasCtx.save();
  canvasCtx.strokeStyle = theme.textColorSecondary;
  canvasCtx.lineWidth = 1;
  const ticks = gauge.tickCount ?? 5;
  const tickLen = Math.min(8, radius * 0.08);
  for (let i = 0; i <= ticks * 2; i++) {
    const ratio = i / (ticks * 2);
    const angle = startAngle - (startAngle - normalizedEnd) * ratio;
    const inner = radius - 4;
    const outer = radius - 4 - (i % 2 === 0 ? tickLen : tickLen * 0.5);
    canvasCtx.globalAlpha = i % 2 === 0 ? 0.8 : 0.4;
    canvasCtx.beginPath();
    canvasCtx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
    canvasCtx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
    canvasCtx.stroke();
  }
  canvasCtx.restore();
}

/** 指针：针身三角形（根宽 8）+ 针尾圆帽 r5；随进度动画同步扫动 */
function drawGaugePointer(canvasCtx, gauge, theme, progressColor, centerX, centerY, radius, axisWidth, valueAngle, progress) {
  const pointer = gauge.pointer || {};
  const color = pointer.color || progressColor;
  const length = Math.min(pointer.length ?? radius - axisWidth / 2 - 14, radius - axisWidth / 2 - 6);
  const baseHalf = Math.max(2, Math.min(10, pointer.width ? pointer.width / 2 : 4));
  const tipX = centerX + Math.cos(valueAngle) * length;
  const tipY = centerY + Math.sin(valueAngle) * length;
  const perpX = Math.cos(valueAngle + Math.PI / 2);
  const perpY = Math.sin(valueAngle + Math.PI / 2);
  canvasCtx.save();
  canvasCtx.fillStyle = color;
  canvasCtx.beginPath();
  canvasCtx.moveTo(tipX, tipY);
  canvasCtx.lineTo(centerX + perpX * baseHalf, centerY + perpY * baseHalf);
  canvasCtx.lineTo(centerX - perpX * baseHalf, centerY - perpY * baseHalf);
  canvasCtx.closePath();
  canvasCtx.fill();
  // 针尾圆帽：底色填充 + 针色描边
  canvasCtx.beginPath();
  canvasCtx.arc(centerX, centerY, 5, 0, Math.PI * 2);
  canvasCtx.fillStyle = theme.backgroundColor;
  canvasCtx.fill();
  canvasCtx.strokeStyle = color;
  canvasCtx.lineWidth = 2;
  canvasCtx.stroke();
  canvasCtx.restore();
  void progress;
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
/** K线+成交量布局口径：渲染与 y 轴绘制共用（价格区上、量带下） */
function candleVolumeLayout(plotArea, options, hiddenSeries) {
  const candleData = options.candleData || [];
  const volumeData = options.volumeData || [];
  const on = candleData.length > 0
    && volumeData.length === candleData.length
    && !(hiddenSeries && hiddenSeries.has("成交量"));
  const ratio = Math.max(0.15, Math.min(0.4, options.volumeHeight ?? 0.24));
  const priceArea = on
    ? { x: plotArea.x, y: plotArea.y, width: plotArea.width, height: plotArea.height * (1 - ratio) }
    : { x: plotArea.x, y: plotArea.y, width: plotArea.width, height: plotArea.height };
  const bandTop = on ? plotArea.y + priceArea.height + 1 : null;
  return { on, ratio, priceArea, bandTop };
}

/**
 * K 线 + 成交量（DESIGN §3.10）：volumeData 与 candleData 等长时开启副图，
 * 绘图区下部 24% 为量带，K 线压缩到上部；量柱颜色跟随当日涨跌 @55%，
 * 带不画轴（量纲从属）。图例「成交量」点选后量带隐去、K 线回铺全高。
 */
function renderCandleChart(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hiddenSeries } = ctx;
  const candleData = options.candleData || [];
  if (candleData.length === 0) return;
  const upColor = options.candleUpColor || "#dc2626";
  const downColor = options.candleDownColor || "#16a34a";
  const volumeData = options.volumeData || [];
  const vol = candleVolumeLayout(plotArea, options, hiddenSeries);
  const volumeOn = vol.on;
  const priceArea = vol.priceArea;
  const categoryWidth = plotArea.width / candleData.length;
  const candleWidth = Math.min(categoryWidth * 0.6, 24);
  const yFor = (v) => priceArea.y + priceArea.height - (v - yRange.min) / (yRange.max - yRange.min) * priceArea.height * progress;
  candleData.forEach((candle, i) => {
    const x = plotArea.x + (i + 0.5) * categoryWidth;
    const isHover = i === hoverIndex;
    const isUp = candle.close >= candle.open;
    const color = isUp ? upColor : downColor;
    const highY = yFor(candle.high);
    const lowY = yFor(candle.low);
    canvasCtx.save();
    canvasCtx.strokeStyle = color;
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(x, highY);
    canvasCtx.lineTo(x, lowY);
    canvasCtx.stroke();
    const openY = yFor(candle.open);
    const closeY = yFor(candle.close);
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
  // 量带：颜色跟随涨跌 @55%，不画轴；最高量柱顶标 max（10px 次要色）
  if (volumeOn) {
    const volMax = Math.max(...volumeData, 1);
    const bandTop = vol.bandTop;
    const bandHeight = plotArea.y + plotArea.height - bandTop - 1;
    volumeData.forEach((vol, i) => {
      if (!Number.isFinite(vol)) return;
      const candle = candleData[i];
      const isUp = candle.close >= candle.open;
      const color = isUp ? upColor : downColor;
      const h = Math.max(1, vol / volMax * bandHeight * 0.92 * progress);
      const x = plotArea.x + (i + 0.5) * categoryWidth;
      canvasCtx.save();
      canvasCtx.globalAlpha = i === hoverIndex ? 0.85 : 0.55;
      canvasCtx.fillStyle = color;
      canvasCtx.fillRect(x - candleWidth / 2, plotArea.y + plotArea.height - 1 - h, candleWidth, h);
      canvasCtx.restore();
    });
    canvasCtx.save();
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.font = "10px Inter, sans-serif";
    canvasCtx.textAlign = "right";
    canvasCtx.textBaseline = "bottom";
    canvasCtx.fillText(formatCompact(volMax), plotArea.x + plotArea.width - 2, bandTop + 12);
    canvasCtx.restore();
    // 价格/量带分界线
    canvasCtx.save();
    canvasCtx.strokeStyle = theme.gridColor;
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(plotArea.x, bandTop);
    canvasCtx.lineTo(plotArea.x + plotArea.width, bandTop);
    canvasCtx.stroke();
    canvasCtx.restore();
  }
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

/** 量纲紧凑读法：1.2万 / 3.4亿 式（量带 max 标注用） */
function formatCompact(v) {
  if (v >= 1e8) return `${parseFloat((v / 1e8).toFixed(1))}亿`;
  if (v >= 1e4) return `${parseFloat((v / 1e4).toFixed(1))}万`;
  return Number.isInteger(v) ? String(v) : parseFloat(v.toFixed(2)).toString();
}
export {
  candleVolumeLayout,
  formatCompact,
  getHeatmapCategories,
  renderCandleChart,
  renderFunnelChart,
  renderGaugeChart,
  renderHeatmapChart
};
