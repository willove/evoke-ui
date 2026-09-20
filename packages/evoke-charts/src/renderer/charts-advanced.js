import { CHART_COLORS, UP_COLOR, DOWN_COLOR, VOLUME_SERIES_NAME } from "../types";
import { roundRect, getContrastText, isLightColor, mixColor } from "./core";
import { maxOf, minOf } from "../extent";

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
  const maxValue = drawn.length ? maxOf(drawn.map((d) => d.value)) : 0;
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
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1, hiddenSeries } = ctx;
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
    // 悬浮加深一档随 hoverAnimProgress 缓动（同色向黑 8%）：不位移、不引强调色
    canvasCtx.fillStyle = i === hoverIndex ? mixColor(step.color, 0.08 * hoverAnimProgress, "#000000") : step.color;
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
 * 角度为数学角约定（同 ECharts，0° 在右、逆时针为正）：220→-40 呈经典
 * 「进度弧走上方、开口朝下」形态——canvas y 轴朝下，取负号换算。
 */
function renderGaugeChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex } = ctx;
  const rawGauge = options.gauge;
  // schema 允许 number 简写（gauge: 75 即值为 75 的默认表盘）
  const gauge = typeof rawGauge === "number" ? { value: rawGauge } : rawGauge;
  if (!gauge || typeof gauge !== "object") return;
  const min = gauge.min ?? 0;
  const max = gauge.max ?? 100;
  const value = typeof gauge.value === "number" && Number.isFinite(gauge.value)
    ? Math.max(min, Math.min(max, gauge.value))
    : min;
  const toRad = (deg) => -deg * Math.PI / 180;
  const startAngle = toRad(gauge.startAngle ?? 220);
  let normalizedEnd = toRad(gauge.endAngle ?? -40);
  while (normalizedEnd <= startAngle) normalizedEnd += Math.PI * 2;
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
  canvasCtx.arc(centerX, centerY, radius, startAngle, normalizedEnd, false);
  canvasCtx.strokeStyle = theme.gridColor;
  canvasCtx.lineWidth = axisWidth;
  canvasCtx.lineCap = gauge.cornerRadius === "butt" ? "butt" : "round";
  canvasCtx.stroke();
  canvasCtx.restore();
  // min === max（区间为零）时量程退化，进度按 0 处理避免除零
  const valueRatio = max - min !== 0 ? (value - min) / (max - min) : 0;
  const animatedRatio = valueRatio * progress;
  const valueAngle = startAngle + (normalizedEnd - startAngle) * animatedRatio;
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
    canvasCtx.arc(centerX, centerY, radius, startAngle, valueAngle, false);
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
    const angle = startAngle + (normalizedEnd - startAngle) * ratio;
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
    const angle = startAngle + (normalizedEnd - startAngle) * ratio;
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
// ─── 日历热力图（DESIGN §3.12）：GitHub 活动热力同款——列=周、行=星期，
// 顶部月份标签、左侧星期标签、今日主色描边、右下「少—多」色阶。───
const CALENDAR_RAMP_LIGHT = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const CALENDAR_RAMP_DARK = ["#1f2937", "#0e4429", "#006d32", "#26a641", "#39d353"];
const CALENDAR_DAY = 864e5;

function calendarNoon(ts) {
  const d = new Date(ts);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

function calendarPad(n) {
  return n.toString().padStart(2, "0");
}

/**
 * 日历热力布局：start/end 缺省取数据极值并对齐周边界（weekStart 默认周一）；
 * 数值等宽分 4 档色阶（0/缺测为空档）；granularity: 'day'（列=周 行=星期，
 * 默认）/ 'week' / 'month'（聚合为单行周合计 / 月合计，求和口径）；
 * 格子为矩形，横向铺满绘图区（宽高独立自适应）。
 */
function computeCalendarLayout(plotArea, options, theme) {
  const data = options.calendarData || [];
  if (data.length === 0) return null;
  const cal = options.calendar || {};
  const toTs = (v) => {
    if (v instanceof Date) return calendarNoon(v.getTime());
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : calendarNoon(t);
  };
  const gran = cal.granularity === "week" || cal.granularity === "month" ? cal.granularity : "day";
  const weekStart = cal.weekStart ?? 1;
  const valueMap = /* @__PURE__ */ new Map();
  let minTs = Infinity;
  let maxTs = -Infinity;
  data.forEach((d) => {
    const ts = toTs(d.date);
    if (ts === null) return;
    valueMap.set(ts, d.value);
    if (ts < minTs) minTs = ts;
    if (ts > maxTs) maxTs = ts;
  });
  if (valueMap.size === 0) return null;
  let startTs = toTs(cal.start) ?? minTs;
  let endTs = toTs(cal.end) ?? maxTs;
  if (endTs < startTs) [startTs, endTs] = [endTs, startTs];
  const ramps = cal.colors || (!isLightColor(theme.backgroundColor) ? CALENDAR_RAMP_DARK : CALENDAR_RAMP_LIGHT);
  const todayTs = calendarNoon(cal.today !== undefined ? (toTs(cal.today) ?? Date.now()) : Date.now());
  // 聚合桶：day = 每天一格（列=周）；week = 每周一格求和；month = 每月一格求和
  const buckets = [];
  const pushBucket = (label, tsList, col, row) => {
    let value = null;
    for (const ts of tsList) {
      if (valueMap.has(ts)) {
        const v = valueMap.get(ts);
        value = typeof value === "number" ? value + v : v;
      }
    }
    buckets.push({ label, col, row, value: typeof value === "number" ? value : null, today: tsList.includes(todayTs) });
  };
  if (gran === "day") {
    const shift = (new Date(startTs).getDay() - weekStart + 7) % 7;
    const firstWeek = startTs - shift * CALENDAR_DAY;
    const tailShift = (new Date(endTs).getDay() - weekStart + 7) % 7;
    const lastWeek = endTs + (6 - tailShift) * CALENDAR_DAY;
    const cols = Math.round((lastWeek - firstWeek) / CALENDAR_DAY / 7);
    if (cols <= 0) return null;
    let prevMonth = -1;
    const monthLabels = [];
    for (let col = 0; col < cols; col++) {
      const firstDay = new Date(firstWeek + col * 7 * CALENDAR_DAY);
      if (firstDay.getMonth() !== prevMonth) {
        if (col > 0 || firstDay.getDate() <= 7) monthLabels.push({ label: `${firstDay.getMonth() + 1}月`, col });
        prevMonth = firstDay.getMonth();
      }
      for (let row = 0; row < 7; row++) {
        const ts = firstWeek + (col * 7 + row) * CALENDAR_DAY;
        if (ts < startTs || ts > endTs) continue;
        const d = new Date(ts);
        pushBucket(`${d.getFullYear()}-${calendarPad(d.getMonth() + 1)}-${calendarPad(d.getDate())}`, [ts], col, row);
      }
    }
    var bucketLabels = monthLabels;
    var rows = 7;
  } else {
    // 周 / 月桶：顺序扫描日期区间，按桶键求和
    const order = [];
    const sums = /* @__PURE__ */ new Map();
    for (let ts = startTs; ts <= endTs; ts += CALENDAR_DAY) {
      const d = new Date(ts);
      let key;
      let label;
      if (gran === "week") {
        const shift2 = (d.getDay() - weekStart + 7) % 7;
        const weekTs = ts - shift2 * CALENDAR_DAY;
        key = `w${weekTs}`;
        const wd = new Date(weekTs);
        label = `${wd.getMonth() + 1}月${wd.getDate()}日周`;
      } else {
        key = `m${d.getFullYear()}-${d.getMonth()}`;
        label = `${d.getFullYear()}-${calendarPad(d.getMonth() + 1)}`;
      }
      if (!sums.has(key)) {
        sums.set(key, null);
        order.push({ key, label });
      }
      const v = valueMap.get(ts);
      if (v !== undefined) {
        const prev = sums.get(key);
        sums.set(key, typeof prev === "number" ? prev + v : v);
      }
    }
    order.forEach((b, i) => {
      const value = sums.get(b.key);
      buckets.push({ label: b.label, col: i, row: 0, value: typeof value === "number" ? value : null, today: false });
    });
    bucketLabels = gran === "month"
      ? order.map((b, i) => ({ label: b.label, col: i }))
      : order
          .map((b, i) => ({ label: b.label, col: i, month: parseInt(b.label, 10) }))
          .filter((b, i, arr) => i === 0 || b.month !== arr[i - 1].month);
    rows = 1;
  }
  let vMax = 0;
  buckets.forEach((b) => {
    if (typeof b.value === "number" && b.value > vMax) vMax = b.value;
  });
  const levelOf = (v) => {
    if (typeof v !== "number" || !(v > 0) || !(vMax > 0)) return 0;
    return Math.max(1, Math.min(4, Math.ceil(v / (vMax / 4))));
  };
  const labelTop = 18;
  const leftBand = gran === "day" ? 28 : 6;
  const gap = Math.max(1, Math.min(8, cal.cellGap ?? 3));
  const scaleH = cal.showScale === false ? 0 : 22;
  const cols = Math.max(1, maxOf(buckets.map((b) => b.col + 1)));
  const availW = plotArea.width - leftBand;
  const availH = plotArea.height - labelTop - scaleH;
  // 矩形格子：宽高独立铺满可用空间（横向不再留白）
  const cellW = Math.max(6, (availW - gap * (cols - 1)) / cols);
  const cellH = Math.max(6, (availH - gap * (rows - 1)) / rows);
  const originX = plotArea.x + leftBand;
  const originY = plotArea.y + labelTop;
  const cells = buckets.map((b, i) => ({
    ...b,
    x: originX + b.col * (cellW + gap),
    y: originY + b.row * (cellH + gap),
    w: cellW,
    h: cellH,
    color: ramps[levelOf(b.value)],
    index: i,
  }));
  const weekdayLabels = cal.weekdayLabels || ["日", "一", "二", "三", "四", "五", "六"];
  const showRows = [];
  if (gran === "day") {
    for (let row = 0; row < 7; row++) {
      const name = weekdayLabels[(weekStart + row) % 7];
      if (name === "一" || name === "三" || name === "五" || cal.showAllWeekdays === true) {
        showRows.push({ row, name, y: originY + row * (cellH + gap) + cellH / 2 });
      }
    }
  }
  return {
    cells,
    cols,
    rows,
    cellW,
    cellH,
    gap,
    granularity: gran,
    monthLabels: bucketLabels.map((m) => ({ label: m.label, x: originX + m.col * (cellW + gap) })),
    showRows,
    ramps,
    originX,
    originY,
    scaleH,
  };
}

function renderCalendarHeatmapChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex } = ctx;
  const layout = computeCalendarLayout(plotArea, options, theme);
  if (!layout) return;
  const cal = options.calendar || {};
  // 入场：格子按列序缩放弹出
  layout.cells.forEach((c, i) => {
    const colT = Math.max(0, Math.min(1, progress * 1.8 - (c.col / Math.max(1, layout.cols)) * 0.8));
    const w = c.w * colT;
    const h = c.h * colT;
    const isHover = i === hoverIndex;
    canvasCtx.save();
    roundRect(canvasCtx, c.x + (c.w - w) / 2, c.y + (c.h - h) / 2, w, h, Math.min(3, w / 4, h / 4));
    canvasCtx.fillStyle = isHover ? mixColor(c.color, 0.18 * hoverAnimProgressOf(ctx), "#000000") : c.color;
    canvasCtx.fill();
    if (c.today) {
      canvasCtx.strokeStyle = theme.colors[0];
      canvasCtx.lineWidth = 1.5;
      roundRect(canvasCtx, c.x - 1.5, c.y - 1.5, c.w + 3, c.h + 3, 4);
      canvasCtx.stroke();
    }
    canvasCtx.restore();
  });
  // 月份标签（顶部）与星期标签（贴网格左缘，随网格起点）
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "11px Inter, sans-serif";
  canvasCtx.textAlign = "left";
  canvasCtx.textBaseline = "bottom";
  layout.monthLabels.forEach((m) => canvasCtx.fillText(m.label, m.x, plotArea.y + 15));
  canvasCtx.textAlign = "right";
  canvasCtx.textBaseline = "middle";
  layout.showRows.forEach((r) => canvasCtx.fillText(r.name, layout.originX - 6, r.y));
  canvasCtx.restore();
  // 右下「少 — 多」色阶
  if (cal.showScale !== false && progress > 0.9) {
    canvasCtx.save();
    canvasCtx.font = "10px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColorSecondary;
    canvasCtx.textBaseline = "middle";
    const swatch = 10;
    let x = plotArea.x + plotArea.width - (swatch + 4) * 5 - 30;
    canvasCtx.textAlign = "right";
    canvasCtx.fillText("少", x - 6, plotArea.y + plotArea.height - 8);
    layout.ramps.forEach((color) => {
      roundRect(canvasCtx, x, plotArea.y + plotArea.height - 13, swatch, swatch, 2);
      canvasCtx.fillStyle = color;
      canvasCtx.fill();
      x += swatch + 4;
    });
    canvasCtx.textAlign = "left";
    canvasCtx.fillText("多", x + 2, plotArea.y + plotArea.height - 8);
    canvasCtx.restore();
  }
}

function hoverAnimProgressOf(ctx) {
  return ctx.hoverAnimProgress === undefined ? 1 : ctx.hoverAnimProgress;
}

function calendarHitTest(canvasX, canvasY, plotArea, options, theme) {
  const layout = computeCalendarLayout(plotArea, options, theme);
  if (!layout) return null;
  for (const c of layout.cells) {
    if (canvasX >= c.x && canvasX <= c.x + c.w && canvasY >= c.y && canvasY <= c.y + c.h) {
      return {
        index: c.index,
        params: {
          seriesName: c.label,
          name: c.label,
          value: c.value,
          color: c.color,
          dataIndex: c.index,
          seriesIndex: 0
        }
      };
    }
  }
  return null;
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
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1 } = ctx;
  const hovT = hoverAnimProgress;
  const heatmapData = options.heatmapData || [];
  if (heatmapData.length === 0) return;
  const heatmapConfig = options.heatmap || {};
  const colorScale = heatmapConfig.colorScale || [...CHART_COLORS.heatmapScale];
  const { xCategories, yCategories } = getHeatmapCategories(options);
  // 脏数据含 NaN 时极值会变 NaN：配色比例失效，fillStyle 落空沿用上一帧——求极值前过滤
  const values = heatmapData.map((d) => d.value).filter((v) => typeof v === "number" && Number.isFinite(v));
  const minValue = values.length ? minOf(values) : 0;
  const maxValue = values.length ? maxOf(values) : 1;
  const valueRange = maxValue - minValue || 1;
  const cellWidth = plotArea.width / xCategories.length;
  const cellHeight = plotArea.height / yCategories.length;
  function getColor(value, customColor) {
    if (customColor) return customColor;
    // 单元格值本身非有限：取色阶底色，避免 fillStyle 拿到 undefined
    if (typeof value !== "number" || !Number.isFinite(value)) return colorScale[0];
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
    if (isHover && hovT > 0.01) {
      canvasCtx.globalAlpha = hovT;
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
    && !(hiddenSeries && hiddenSeries.has(VOLUME_SERIES_NAME));
  const ratio = Math.max(0.15, Math.min(0.4, options.volumeHeight ?? 0.24));
  const priceArea = on
    ? { x: plotArea.x, y: plotArea.y, width: plotArea.width, height: plotArea.height * (1 - ratio) }
    : { x: plotArea.x, y: plotArea.y, width: plotArea.width, height: plotArea.height };
  const bandTop = on ? plotArea.y + priceArea.height + 1 : null;
  return { on, ratio, priceArea, bandTop };
}

/**
 * 量带绘制（K 线 / 折线分时共用）：flags 为每根的涨跌布尔（决定颜色），
 * baseY 为量带底、bandTop 为量带顶；不画轴（量纲从属），最高柱顶标 compact max。
 */
function renderVolumeBand(ctx, volumeData, flags, baseY, bandTop, barWidth, slotWidth, plotWidth, plotX, theme, progress, hoverIndex, upColor = UP_COLOR, downColor = DOWN_COLOR) {
  const { ctx: canvasCtx, hiddenSeries } = ctx;
  if (hiddenSeries && hiddenSeries.has(VOLUME_SERIES_NAME)) return;
  const volMax = maxOf(volumeData.filter((v) => Number.isFinite(v)), 1);
  const bandHeight = Math.max(4, baseY - bandTop);
  volumeData.forEach((vol, i) => {
    if (!Number.isFinite(vol)) return;
    const color = flags[i] ? upColor : downColor;
    const h = Math.max(1, vol / volMax * bandHeight * 0.92 * progress);
    const x = plotX + (i + 0.5) * slotWidth;
    canvasCtx.save();
    canvasCtx.globalAlpha = i === hoverIndex ? 0.85 : 0.55;
    canvasCtx.fillStyle = color;
    canvasCtx.fillRect(x - barWidth / 2, baseY - 1 - h, barWidth, h);
    canvasCtx.restore();
  });
  canvasCtx.save();
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.font = "10px Inter, sans-serif";
  canvasCtx.textAlign = "right";
  canvasCtx.textBaseline = "bottom";
  canvasCtx.fillText(formatCompact(volMax), plotX + plotWidth - 2, bandTop + 12);
  canvasCtx.restore();
  // 价格/量带分界线
  canvasCtx.save();
  canvasCtx.strokeStyle = theme.gridColor;
  canvasCtx.lineWidth = 1;
  canvasCtx.beginPath();
  canvasCtx.moveTo(plotX, bandTop);
  canvasCtx.lineTo(plotX + plotWidth, bandTop);
  canvasCtx.stroke();
  canvasCtx.restore();
}

/**
 * K 线 + 成交量（DESIGN §3.10）：volumeData 与 candleData 等长时开启副图，
 * 绘图区下部 24% 为量带，K 线压缩到上部；量柱颜色跟随当日涨跌 @55%，
 * 带不画轴（量纲从属）。图例「成交量」点选后量带隐去、K 线回铺全高。
 */
function renderCandleChart(ctx, yRange) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1, hiddenSeries } = ctx;
  const hovT = hoverAnimProgress;
  const candleData = options.candleData || [];
  if (candleData.length === 0) return;
  const upColor = options.candleUpColor || UP_COLOR;
  const downColor = options.candleDownColor || DOWN_COLOR;
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
    // 悬浮强调随 hoverAnimProgress 缓动（同色加深一档 + 描边淡入，不位移）
    canvasCtx.fillStyle = isHover ? mixColor(color, 0.12 * hovT, "#000000") : color;
    canvasCtx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    if (isHover && hovT > 0.01) {
      canvasCtx.globalAlpha = hovT;
      canvasCtx.strokeStyle = theme.textColor;
      canvasCtx.lineWidth = 1.5;
      canvasCtx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    }
    canvasCtx.restore();
  });
  // 量带：颜色跟随涨跌 @55%，不画轴；最高量柱顶标 max（10px 次要色）
  if (volumeOn) {
    renderVolumeBand(
      ctx, volumeData,
      candleData.map((c) => c.close >= c.open),
      plotArea.y + plotArea.height, vol.bandTop,
      candleWidth, categoryWidth, plotArea.width, plotArea.x,
      theme, progress, hoverIndex, upColor, downColor
    );
  }
  // MA 均线（candleMa: [5, 10, …] 收盘价简单移动平均），图例可点选显隐
  drawCandleMaLines(ctx, candleData, yRange, priceArea, categoryWidth, progress);
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

/**
 * MA 均线：candleMa 配置周期数组（如 [5, 10]），按收盘价画简单移动平均；
 * 颜色取系列色板顺序，图例项 MA5/MA10 走 hiddenSeries 点选显隐。
 */
function drawCandleMaLines(ctx, candleData, yRange, priceArea, categoryWidth, progress) {
  const { ctx: canvasCtx, theme, options, hiddenSeries } = ctx;
  const periods = Array.isArray(options.candleMa) ? options.candleMa : [];
  if (periods.length === 0 || candleData.length === 0) return;
  const closes = candleData.map((c) => c.close);
  const yFor = (v) => priceArea.y + priceArea.height - (v - yRange.min) / (yRange.max - yRange.min) * priceArea.height * progress;
  periods.forEach((days, pi) => {
    const name = `MA${days}`;
    if (hiddenSeries.has(name)) return;
    if (!(days >= 2) || closes.length < days) return;
    const color = options.candleMaColors?.[pi] || theme.colors[pi % theme.colors.length];
    canvasCtx.save();
    canvasCtx.strokeStyle = color;
    canvasCtx.lineWidth = 1.25;
    canvasCtx.globalAlpha = 0.9;
    canvasCtx.beginPath();
    let started = false;
    for (let i = days - 1; i < closes.length; i++) {
      let sum = 0;
      for (let k = i - days + 1; k <= i; k++) sum += closes[k];
      const x = priceArea.x + (i + 0.5) * categoryWidth;
      const y = yFor(sum / days);
      if (!started) {
        canvasCtx.moveTo(x, y);
        started = true;
      } else {
        canvasCtx.lineTo(x, y);
      }
    }
    canvasCtx.stroke();
    canvasCtx.restore();
  });
}

/** 量纲紧凑读法：1.2万 / 3.4亿 式（量带 max 标注用） */
function formatCompact(v) {
  if (v >= 1e8) return `${parseFloat((v / 1e8).toFixed(1))}亿`;
  if (v >= 1e4) return `${parseFloat((v / 1e4).toFixed(1))}万`;
  return Number.isInteger(v) ? String(v) : parseFloat(v.toFixed(2)).toString();
}
export {
  CALENDAR_RAMP_DARK,
  CALENDAR_RAMP_LIGHT,
  calendarHitTest,
  candleVolumeLayout,
  computeCalendarLayout,
  drawCandleMaLines,
  formatCompact,
  getHeatmapCategories,
  renderCalendarHeatmapChart,
  renderCandleChart,
  renderFunnelChart,
  renderGaugeChart,
  renderHeatmapChart,
  renderVolumeBand
};
