import { estimateTextWidth, mixColor, getContrastText, drawLabelWithBg, calculateTimeTicks, formatTimeTick } from "./core";
import { maxOf, minOf } from "../extent";

// ─── 甘特图（DESIGN §3.8）───
// 行带 + 时间轴：条高 = 行高 × 0.52 圆角 4；进度实心、剩余 @25%；里程碑菱形；
// 依赖正交折线；今日线主色虚线。渲染与命中共用 computeGanttLayout 一份口径。

const BAR_HEIGHT_RATIO = 0.52;
const BAR_RADIUS = 4;
const LABEL_MIN = 80;
const LABEL_MAX = 180;
const AXIS_BAND = 30;

function toTs(v) {
  if (v instanceof Date) return v.getTime();
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

/**
 * 甘特布局：左侧任务名列按最宽任务名实测（夹 80–180），
 * 时间范围取全部起止的极值；行高均分（上限 44）。
 */
function computeGanttLayout(plotArea, options, theme, hiddenSeries, valueFormatter) {
  const tasks = (options.ganttData || []).filter((t) => !hiddenSeries?.has(t.name));
  if (tasks.length === 0) return null;
  const parsed = tasks
    .map((t, i) => ({ ...t, row: i, startTs: toTs(t.start), endTs: toTs(t.end) }))
    .filter((t) => t.startTs !== null && t.endTs !== null);
  if (parsed.length === 0) return null;
  const labelW = Math.max(
    LABEL_MIN,
    Math.min(LABEL_MAX, Math.round(maxOf(parsed.map((t) => estimateTextWidth(t.name || "", 12))) + 16))
  );
  // padding.left 已预留标签列（getPadding gantt 分支），绘图区即条带区
  const chartX = plotArea.x;
  const chartW = plotArea.width;
  let tmin = minOf(parsed.map((t) => Math.min(t.startTs, t.endTs)));
  let tmax = maxOf(parsed.map((t) => Math.max(t.startTs, t.endTs)));
  if (options.ganttToday) {
    const today = toTs(options.ganttToday);
    if (today !== null) {
      tmin = Math.min(tmin, today);
      tmax = Math.max(tmax, today);
    }
  }
  if (tmax === tmin) tmax = tmin + 864e5;
  const xFor = (ts) => chartX + ((ts - tmin) / (tmax - tmin)) * chartW;
  const rowsHeight = Math.max(40, plotArea.height - AXIS_BAND);
  const rowH = Math.min(44, rowsHeight / parsed.length);
  const barH = rowH * BAR_HEIGHT_RATIO;
  const rows = parsed.map((t, i) => {
    const y = plotArea.y + i * rowH + (rowH - barH) / 2;
    const x1 = xFor(Math.min(t.startTs, t.endTs));
    const x2 = xFor(Math.max(t.startTs, t.endTs));
    const progress = Math.max(0, Math.min(1, t.progress ?? 0));
    return {
      ...t,
      y,
      x: x1,
      w: Math.max(3, x2 - x1),
      h: barH,
      cy: y + barH / 2,
      progress,
      color: t.color || theme.colors[i % theme.colors.length],
      isMilestone: t.milestone === true,
    };
  });
  const byName = new Map(rows.map((r) => [r.name, r]));
  const deps = [];
  rows.forEach((r) => {
    (r.dependsOn || []).forEach((depName) => {
      const dep = byName.get(depName);
      if (dep && dep !== r) deps.push({ from: dep, to: r });
    });
  });
  const tickCount = Math.max(3, Math.min(8, Math.floor(chartW / 90)));
  const { values: tickTs, unit } = calculateTimeTicks(tmin, tmax, tickCount);
  return {
    rows,
    deps,
    labelW,
    chartX,
    chartW,
    tmin,
    tmax,
    xFor,
    rowH,
    barH,
    tickTs,
    tickUnit: unit,
    todayX: options.ganttToday ? xFor(toTs(options.ganttToday)) : null,
    valueFormatter,
  };
}

function renderGanttChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1, hiddenSeries } = ctx;
  const layout = computeGanttLayout(plotArea, options, theme, hiddenSeries);
  if (!layout) return;
  const { rows, deps, chartX, chartW, rowH, barH } = layout;
  // 斑马隔行（极淡灰底）+ 行悬浮高亮带
  rows.forEach((r, i) => {
    if (i % 2 === 1) {
      canvasCtx.save();
      canvasCtx.globalAlpha = 0.45;
      canvasCtx.fillStyle = theme.gridColor;
      canvasCtx.fillRect(chartX, plotArea.y + i * rowH, chartW, rowH);
      canvasCtx.restore();
    }
  });
  if (hoverIndex >= 0 && hoverIndex < rows.length) {
    // 行悬浮高亮随 hoverAnimProgress 缓动淡入
    canvasCtx.save();
    canvasCtx.globalAlpha = hoverAnimProgress;
    canvasCtx.fillStyle = theme.highlightColor;
    canvasCtx.fillRect(chartX, plotArea.y + hoverIndex * rowH, chartW, rowH);
    canvasCtx.restore();
  }
  // 时间刻度（底部，自动抽稀）+ 轴线
  canvasCtx.save();
  canvasCtx.strokeStyle = theme.gridColor;
  canvasCtx.fillStyle = theme.textColorSecondary;
  canvasCtx.lineWidth = 1;
  canvasCtx.font = "11px Inter, sans-serif";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "top";
  const axisY = plotArea.y + rows.length * rowH;
  layout.tickTs.forEach((ts) => {
    const x = layout.xFor(ts);
    canvasCtx.beginPath();
    canvasCtx.moveTo(x, axisY);
    canvasCtx.lineTo(x, axisY + 5);
    canvasCtx.stroke();
    canvasCtx.fillText(formatTimeTick(ts, layout.tickUnit), x, axisY + 8);
  });
  canvasCtx.beginPath();
  canvasCtx.moveTo(chartX, axisY);
  canvasCtx.lineTo(chartX + chartW, axisY);
  canvasCtx.strokeStyle = theme.borderColor;
  canvasCtx.stroke();
  canvasCtx.restore();
  // 今日线：主色虚线 + 顶部标注
  if (layout.todayX !== null && layout.todayX >= chartX && layout.todayX <= chartX + chartW) {
    canvasCtx.save();
    canvasCtx.strokeStyle = theme.colors[0];
    canvasCtx.globalAlpha = 0.5;
    canvasCtx.setLineDash([4, 4]);
    canvasCtx.beginPath();
    canvasCtx.moveTo(layout.todayX, plotArea.y);
    canvasCtx.lineTo(layout.todayX, axisY);
    canvasCtx.stroke();
    canvasCtx.setLineDash([]);
    canvasCtx.globalAlpha = 1;
    canvasCtx.fillStyle = theme.colors[0];
    canvasCtx.font = "10px Inter, sans-serif";
    canvasCtx.textAlign = "left";
    canvasCtx.textBaseline = "top";
    canvasCtx.fillText("今日", layout.todayX + 4, plotArea.y + 2);
    canvasCtx.restore();
  }
  // 依赖箭头：正交折线（完成缘中点 → 下游条左缘中点）
  deps.forEach(({ from, to }) => {
    const emphasized = hoverIndex >= 0 && (rows[hoverIndex] === from || rows[hoverIndex] === to);
    canvasCtx.save();
    canvasCtx.strokeStyle = emphasized ? theme.textColor : theme.textColorSecondary;
    canvasCtx.fillStyle = canvasCtx.strokeStyle;
    canvasCtx.globalAlpha = emphasized ? 1 : 0.55;
    canvasCtx.lineWidth = 1;
    const x1 = from.x + from.w + 2;
    const y1 = from.cy;
    const x2 = to.x - 5;
    const y2 = to.cy;
    const midX = x1 + Math.max(8, (x2 - x1) / 2);
    canvasCtx.beginPath();
    canvasCtx.moveTo(x1, y1);
    canvasCtx.lineTo(midX, y1);
    canvasCtx.lineTo(midX, y2);
    canvasCtx.lineTo(x2, y2);
    canvasCtx.stroke();
    canvasCtx.beginPath();
    canvasCtx.moveTo(x2 + 5, y2);
    canvasCtx.lineTo(x2 - 1, y2 - 3);
    canvasCtx.lineTo(x2 - 1, y2 + 3);
    canvasCtx.closePath();
    canvasCtx.fill();
    canvasCtx.restore();
  });
  // 任务条 / 里程碑
  const grow = Math.min(1, progress * 1.2);
  rows.forEach((r, i) => {
    const isHover = i === hoverIndex;
    canvasCtx.save();
    if (r.isMilestone) {
      const s = 10 * grow;
      const cxp = r.x + 2;
      canvasCtx.translate(cxp, r.cy);
      canvasCtx.rotate(Math.PI / 4);
      canvasCtx.fillStyle = isHover ? mixColor(r.color, 0.1, "#000000") : r.color;
      canvasCtx.fillRect(-s / 2, -s / 2, s, s);
      canvasCtx.restore();
      return;
    }
    const w = r.w * grow;
    const rr = Math.min(BAR_RADIUS, w / 2, r.h / 2);
    canvasCtx.beginPath();
    canvasCtx.moveTo(r.x + rr, r.y);
    canvasCtx.lineTo(r.x + w - rr, r.y);
    canvasCtx.quadraticCurveTo(r.x + w, r.y, r.x + w, r.y + rr);
    canvasCtx.lineTo(r.x + w, r.y + r.h - rr);
    canvasCtx.quadraticCurveTo(r.x + w, r.y + r.h, r.x + w - rr, r.y + r.h);
    canvasCtx.lineTo(r.x + rr, r.y + r.h);
    canvasCtx.quadraticCurveTo(r.x, r.y + r.h, r.x, r.y + r.h - rr);
    canvasCtx.lineTo(r.x, r.y + rr);
    canvasCtx.quadraticCurveTo(r.x, r.y, r.x + rr, r.y);
    canvasCtx.closePath();
    canvasCtx.globalAlpha = 0.25;
    canvasCtx.fillStyle = r.color;
    canvasCtx.fill();
    // 进度段：左起实心（随 progress 剪裁）
    if (r.progress > 0) {
      canvasCtx.save();
      canvasCtx.beginPath();
      canvasCtx.rect(r.x, r.y, w, r.h);
      canvasCtx.clip();
      canvasCtx.globalAlpha = 1;
      canvasCtx.fillStyle = isHover ? mixColor(r.color, 0.1, "#000000") : r.color;
      canvasCtx.fillRect(r.x, r.y, w, r.h);
      canvasCtx.restore();
    }
    canvasCtx.restore();
    // 行内进度标签：宽条内嵌（按条底色取对比色），窄条/里程碑外挂底色胶囊，不与线条打架
    if (r.progress > 0 && rowH >= 22 && progress > 0.9) {
      const text = `${Math.round(r.progress * 100)}%`;
      if (!r.isMilestone && r.w * grow >= 46) {
        canvasCtx.save();
        canvasCtx.font = "600 10px Inter, sans-serif";
        canvasCtx.textAlign = "right";
        canvasCtx.textBaseline = "middle";
        canvasCtx.fillStyle = getContrastText(r.color);
        canvasCtx.fillText(text, r.x + w - 7, r.cy);
        canvasCtx.restore();
      } else {
        drawLabelWithBg(canvasCtx, text, r.x + w + 22, r.cy + 8, theme, "center");
      }
    }
  });
  // 左侧任务名
  rows.forEach((r, i) => {
    if (progress < 0.9) return;
    canvasCtx.save();
    canvasCtx.font = "12px Inter, sans-serif";
    canvasCtx.fillStyle = i === hoverIndex ? theme.textColor : theme.textColorSecondary;
    canvasCtx.textAlign = "right";
    canvasCtx.textBaseline = "middle";
    let label = r.name || "";
    const maxW = layout.labelW - 16;
    if (canvasCtx.measureText(label).width > maxW) {
      let lo = 0, hi = label.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (canvasCtx.measureText(label.slice(0, mid) + "…").width > maxW) hi = mid - 1;
        else lo = mid;
      }
      label = label.slice(0, lo) + "…";
    }
    canvasCtx.fillText(label, chartX - 10, plotArea.y + i * rowH + rowH / 2);
    canvasCtx.restore();
  });
}

function ganttHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries) {
  const layout = computeGanttLayout(plotArea, options, theme, hiddenSeries);
  if (!layout) return null;
  const { rows } = layout;
  const relY = canvasY - plotArea.y;
  if (relY < 0 || relY > rows.length * layout.rowH) return null;
  const i = Math.floor(relY / layout.rowH);
  if (i < 0 || i >= rows.length) return null;
  const r = rows[i];
  return {
    index: i,
    params: {
      seriesName: r.name,
      name: r.name,
      value: r.progress,
      color: r.color,
      dataIndex: i,
      seriesIndex: 0,
      extra: {
        start: r.start,
        end: r.end,
        progress: r.progress,
        milestone: r.isMilestone,
      },
    },
  };
}

export {
  AXIS_BAND,
  BAR_HEIGHT_RATIO,
  computeGanttLayout,
  ganttHitTest,
  renderGanttChart,
  toTs
};
