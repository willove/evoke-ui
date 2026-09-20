import { getTheme, createValueFormatter, getPadding, applyLogTransform } from "./core";
import { maxOf, minOf } from "../extent";
import {
  renderYAxis,
  renderXAxis,
  renderHorizontalAxis,
  renderMarkLines,
  renderMarkAreas,
  renderHoverHighlight,
  renderCrosshair,
  renderAnnotations
} from "./axes";
import { renderTitle, renderLegend, renderToolbox } from "./legend";
import {
  renderLineChart,
  renderBarChart,
  renderHorizontalBarChart,
  renderPieChart,
  renderScatterChart,
  renderRadarChart,
  renderScatterTrendline,
  renderScatterFacetChart,
  renderScatterMatrixChart,
  computeFacetGrids,
  computeMatrixCells,
  matrixFieldExtent,
  createScatterScale,
  doughnutInnerRadius,
  scatterPointPositions,
  scatterGroupColors,
  linearFit
} from "./charts-basic";
import {
  renderFunnelChart,
  renderGaugeChart,
  renderHeatmapChart,
  renderCandleChart,
  renderCalendarHeatmapChart,
  calendarHitTest,
  computeCalendarLayout,
  candleVolumeLayout,
  renderVolumeBand,
  computeFunnelGeometry,
  funnelStepColor
} from "./charts-advanced";
import { renderBinChart, renderBulletChart, renderTreemapChart, renderSparklineChart } from "./charts-special";
import { renderWaterfallChart, renderBoxplotChart, renderSunburstChart, renderMixedChart, computeBoxplotGeometry, boxplotHitTest } from "./charts-extra";
import { renderSankeyChart, renderVennChart, renderChordChart, renderArcChart, sankeyHitTest, vennHitTest, chordHitTest, arcHitTest, computeSankeyLayout, computeVennLayout, computeChordLayout, computeArcLayout } from "./charts-relation";
import { renderGanttChart, computeGanttLayout, ganttHitTest } from "./charts-gantt";
import { renderDataZoomSlider } from "./dataZoom";
import { calculateRange } from "./core";
import { easings, getTheme as getTheme2, createAnimation, updateAnimation, getPadding as getPadding2 } from "./core";
import {
  calculateTicks,
  calculateRange as calculateRange2,
  groupSeriesByStack,
  resolveStackGroups,
  resolveTickExtendedRange,
  estimateTextWidth,
  getContrastText
} from "./core";
import {
  isMissingValue,
  resolveConnectNulls,
  focusAlpha,
  drawSymbol,
  resolveLineDash,
  toLog,
  applyLogTransform as applyLogTransform2,
  formatLogTick,
  parseTimeLabels,
  calculateTimeTicks,
  formatTimeTick,
  layoutLabelsAvoidOverlap
} from "./core";
import { getLegendBounds, computeLegendLayout, getToolboxBounds } from "./legend";
import { xToCategoryIndex, categoryToX, isCategoryCentered, timeToX, xToTimeIndex } from "./axes";
import { buildPieSlices, renderScatterTrendline as renderScatterTrendline2, computePieMaxRadius } from "./charts-basic";
import { getHeatmapCategories } from "./charts-advanced";
import { computeBins, squarifyTreemap } from "./charts-special";
import { layoutSunburst, computeSunburstDepth, computeSunburstGeometry, sunburstValue } from "./charts-extra";
import { getDataZoomConfig, getSliderGeometry, zoomToSlice, windowToX, xToPercent } from "./dataZoom";
import { createSvgRecorder } from "./svgRecorder";
// 图层逃逸口：宿主/AI 的自定义绘制按锚点插入渲染管线（draw(ctx, renderCtx)）
function runLayers(renderCtx, at) {
  const layers = renderCtx.options.layers;
  if (!Array.isArray(layers)) return;
  layers.forEach((layer) => {
    if (layer && typeof layer.draw === "function" && (layer.at || "front") === at) {
      layer.draw(renderCtx.ctx, renderCtx);
    }
  });
}
function renderChart(canvas, params) {
  const {
    options: rawOptions,
    ctx: externalCtx,
    dpr = window.devicePixelRatio || 1,
    progress = 1,
    hoverIndex = -1,
    hoverAnimProgress = 1,
    focusAnimProgress = 1,
    hiddenSeries = /* @__PURE__ */ new Set(),
    mouseX = -1,
    mouseY = -1,
    showCrosshair = false,
    zoomRange,
    brushRect,
    focusSeries = null,
    hoveredToolbox = null
  } = params;
  const logApplied = applyLogTransform(rawOptions);
  // 缺 data 的系列按空系列渲染（不改用户对象），不让渲染管线直接抛进错误态
  const options = (logApplied.series || []).some((s) => !s.data)
    ? { ...logApplied, series: logApplied.series.map((s) => s.data ? s : { ...s, data: [] }) }
    : logApplied;
  const ctx = externalCtx || canvas.getContext("2d");
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const isDark = document.documentElement.classList.contains("dark");
  const theme = getTheme(isDark, options.theme, options.palette);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = theme.backgroundColor;
  ctx.fillRect(0, 0, width, height);
  const padding = getPadding(options, width);
  const plotArea = {
    x: padding.left,
    y: padding.top,
    width: width - padding.left - padding.right,
    height: height - padding.top - padding.bottom
  };
  const valueFormatter = createValueFormatter(rawOptions);
  const renderCtx = {
    ctx,
    width,
    height,
    dpr,
    theme,
    options,
    plotArea,
    progress,
    hoverIndex,
    hoverAnimProgress,
    focusAnimProgress,
    hiddenSeries,
    valueFormatter,
    mouseX,
    mouseY,
    showCrosshair,
    focusSeries
  };
  renderTitle(renderCtx, options.subtitle ? 12 : 15);
  runLayers(renderCtx, "back");
  let points = [];
  let leftRange;
  switch (options.type) {
    case "pie":
    case "doughnut":
      renderPieChart(renderCtx, options.type === "doughnut");
      break;
    case "rose":
      renderPieChart(renderCtx, false, true);
      break;
    case "radar":
      renderRadarChart(renderCtx);
      break;
    case "scatter": {
      const scatterData = options.scatterData || [];
      if (scatterData.length > 0) {
        const facetMode = options.facet === true;
        if (facetMode) {
          // 分面：全局轴退场，每格自带迷你刻度
          points = renderScatterFacetChart(renderCtx, { min: 0, max: 1 });
          break;
        }
        const yValues = scatterData.map((d) => d.y).filter((v) => typeof v === "number" && Number.isFinite(v));
        const yRange = renderYAxis(renderCtx, "left", {
          min: yValues.length ? minOf(yValues) : 0,
          max: yValues.length ? maxOf(yValues) : 1
        });
        renderXAxis(renderCtx);
        points = renderScatterChart(renderCtx, yRange);
        renderScatterTrendline(renderCtx, yRange);
      }
      break;
    }
    case "funnel":
      renderFunnelChart(renderCtx);
      break;
    case "gauge":
      renderGaugeChart(renderCtx);
      break;
    case "heatmap":
      renderHeatmapChart(renderCtx);
      break;
    case "calendar-heatmap": {
      renderCalendarHeatmapChart(renderCtx);
      break;
    }
    case "candle": {
      const candleData = options.candleData || [];
      if (candleData.length > 0) {
        const allValues = candleData.flatMap((d) => [d.high, d.low]);
        // 量带开启时价格轴只量价格区（口径与 renderCandleChart 共用）
        const vol = candleVolumeLayout(plotArea, options, hiddenSeries);
        const axisArea = vol.on ? vol.priceArea : plotArea;
        const yRange = renderYAxis({ ...renderCtx, plotArea: axisArea }, "left", {
          min: minOf(allValues),
          max: maxOf(allValues)
        });
        renderXAxis(renderCtx);
        renderCandleChart(renderCtx, yRange);
      }
      break;
    }
    case "sankey": {
      renderSankeyChart(renderCtx);
      break;
    }
    case "venn": {
      renderVennChart(renderCtx);
      break;
    }
    case "chord": {
      renderChordChart(renderCtx);
      break;
    }
    case "arc": {
      // arcCircular: true 复用弦图的弧形环状渲染（节点圆点 + 过圆心弧线），数据走 arcData
      if (options.arcCircular === true) {
        renderChordChart({
          ...renderCtx,
          options: { ...options, chordData: options.arcData, chordMode: "curve" }
        });
      } else {
        renderArcChart(renderCtx);
      }
      break;
    }
    case "gantt": {
      renderGanttChart(renderCtx);
      break;
    }
    case "scatter-matrix": {
      renderScatterMatrixChart(renderCtx);
      break;
    }
    case "horizontal-bar": {
      const range = calculateRange(options, hiddenSeries);
      renderHorizontalAxis(renderCtx, range);
      renderHorizontalBarChart(renderCtx, range);
      break;
    }
    case "bin": {
      renderBinChart(renderCtx);
      break;
    }
    case "bullet": {
      renderBulletChart(renderCtx);
      break;
    }
    case "treemap": {
      renderTreemapChart(renderCtx);
      break;
    }
    case "sparkline": {
      points = renderSparklineChart(renderCtx);
      break;
    }
    case "waterfall": {
      const range = calculateRange(options, hiddenSeries);
      const yRange = renderYAxis(renderCtx, "left", range);
      leftRange = yRange;
      renderXAxis(renderCtx, true);
      renderMarkAreas(renderCtx);
      renderWaterfallChart(renderCtx, yRange);
      renderMarkLines(renderCtx, yRange);
      break;
    }
    case "boxplot": {
      const boxDataAll = options.boxData || [];
      if (boxDataAll.length > 0) {
        const horizontal = options.boxHorizontal === true;
        const showOutliers = options.showOutliers !== false;
        const boxData = boxDataAll.filter(
          (b) => !(b.group && hiddenSeries.has(b.group)) && !hiddenSeries.has(b.label)
        );
        // 与命中侧同一口径：NaN 离群点不进极值，否则量程 NaN、箱体全部画在 NaN 坐标上
        const allValues = boxData
          .flatMap((b) => [b.min, b.max, ...(showOutliers ? b.outliers || [] : [])])
          .filter((v) => typeof v === "number" && Number.isFinite(v));
        const valueLo = allValues.length ? minOf(allValues) : 0;
        const valueHi = allValues.length ? maxOf(allValues) : 1;
        let range;
        if (horizontal) {
          // 横向：数值轴在底部（竖向网格线），类目走纵轴
          range = renderHorizontalAxis(renderCtx, { min: valueLo, max: valueHi });
        } else {
          range = renderYAxis(renderCtx, "left", { min: valueLo, max: valueHi });
        }
        leftRange = range;
        renderBoxplotChart(renderCtx, range);
        renderMarkLines(renderCtx, range);
      }
      break;
    }
    case "sunburst": {
      renderSunburstChart(renderCtx);
      break;
    }
    case "mixed": {
      const hasRightAxis = !!options.yAxisRight && (options.series || []).some((s) => s.yAxis === "right");
      leftRange = renderYAxis(renderCtx, "left");
      let rightRange;
      if (hasRightAxis) {
        rightRange = renderYAxis(renderCtx, "right");
      }
      renderXAxis(renderCtx);
      renderMarkAreas(renderCtx);
      points = renderMixedChart(renderCtx, leftRange, rightRange);
      renderMarkLines(renderCtx, leftRange);
      break;
    }
    case "stacked-bar": {
      const stackedRange = calculateRange(options, hiddenSeries);
      const yRange = renderYAxis(renderCtx, "left", stackedRange);
      leftRange = yRange;
      renderXAxis(renderCtx, true);
      renderMarkAreas(renderCtx);
      renderBarChart(renderCtx, yRange, true);
      renderMarkLines(renderCtx, yRange);
      break;
    }
    case "bar": {
      const yRange = renderYAxis(renderCtx, "left");
      leftRange = yRange;
      renderXAxis(renderCtx, true);
      renderMarkAreas(renderCtx);
      renderBarChart(renderCtx, yRange, false);
      renderMarkLines(renderCtx, yRange);
      break;
    }
    case "line":
    case "area": {
      const hasRightAxis = !!options.yAxisRight && (options.series || []).some((s) => s.yAxis === "right");
      // 量副图（分时图）：价格/折线量上区，量带下区，轴与网格只量价格区
      const volLayout = candleVolumeLayout(plotArea, options, hiddenSeries);
      const priceCtx = volLayout.on ? { ...renderCtx, plotArea: volLayout.priceArea } : renderCtx;
      leftRange = renderYAxis(priceCtx, "left");
      let rightRange;
      if (hasRightAxis) {
        rightRange = renderYAxis(priceCtx, "right");
      }
      renderXAxis(renderCtx);
      renderMarkAreas(priceCtx);
      points = renderLineChart(priceCtx, leftRange, "left");
      if (hasRightAxis && rightRange) {
        const rightPoints = renderLineChart(priceCtx, rightRange, "right");
        points = points.concat(rightPoints);
      }
      if (volLayout.on) {
        const slot = plotArea.width / (options.labels?.length || 1);
        const series0 = (options.series || []).filter((s) => !hiddenSeries.has(s.name))[0];
        const flags = (options.volumeData || []).map((_, i) => {
          const prev = series0?.data[i - 1];
          const curr = series0?.data[i];
          if (!Number.isFinite(prev) || !Number.isFinite(curr)) return true;
          return curr >= prev;
        });
        renderVolumeBand(
          renderCtx, options.volumeData || [], flags,
          plotArea.y + plotArea.height, volLayout.bandTop,
          Math.min(slot * 0.6, 24), slot, plotArea.width, plotArea.x,
          theme, progress, hoverIndex
        );
      }
      renderMarkLines(priceCtx, leftRange);
      break;
    }
    default:
      break;
  }
  runLayers(renderCtx, "after-series");
  if (leftRange && (options.annotation || (options.annotations && options.annotations.length > 0))) {
    renderAnnotations(renderCtx, leftRange);
  }
  if ((options.type === "line" || options.type === "area") && points.length > 0) {
    renderHoverHighlight(renderCtx, points);
  }
  if (points.length > 0) {
    renderCrosshair(renderCtx, points);
  }
  if (zoomRange) {
    renderDataZoomSlider(renderCtx, zoomRange);
  }
  if (brushRect) {
    const x = Math.min(brushRect.x1, brushRect.x2);
    const y = Math.min(brushRect.y1, brushRect.y2);
    const w = Math.abs(brushRect.x2 - brushRect.x1);
    const h = Math.abs(brushRect.y2 - brushRect.y1);
    ctx.save();
    ctx.fillStyle = theme.highlightColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = theme.crosshairColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
  runLayers(renderCtx, "front");
  if (options.type !== "sparkline") {
    renderLegend(renderCtx);
  }
  if (options.type !== "sparkline") {
    renderToolbox(renderCtx, hoveredToolbox);
  }
  ctx.restore();
  return points;
}
export {
  applyLogTransform2 as applyLogTransform,
  boxplotHitTest,
  buildPieSlices,
  calendarHitTest,
  calculateRange2 as calculateRange,
  calculateTicks,
  calculateTimeTicks,
  candleVolumeLayout,
  categoryToX,
  chordHitTest,
  arcHitTest,
  computeArcLayout,
  computeBins,
  computeBoxplotGeometry,
  computeCalendarLayout,
  computeChordLayout,
  computeFacetGrids,
  computeFunnelGeometry,
  computeGanttLayout,
  computeLegendLayout,
  computeMatrixCells,
  computePieMaxRadius,
  computeSankeyLayout,
  computeSunburstDepth,
  computeSunburstGeometry,
  computeVennLayout,
  createAnimation,
  createScatterScale,
  createSvgRecorder,
  doughnutInnerRadius,
  drawSymbol,
  easings,
  estimateTextWidth,
  focusAlpha,
  formatLogTick,
  formatTimeTick,
  funnelStepColor,
  ganttHitTest,
  getContrastText,
  getDataZoomConfig,
  getHeatmapCategories,
  getLegendBounds,
  getPadding2 as getPadding,
  getSliderGeometry,
  getTheme2 as getTheme,
  getToolboxBounds,
  groupSeriesByStack,
  isCategoryCentered,
  isMissingValue,
  layoutLabelsAvoidOverlap,
  layoutSunburst,
  linearFit,
  matrixFieldExtent,
  parseTimeLabels,
  renderChart,
  renderScatterTrendline2 as renderScatterTrendline,
  resolveConnectNulls,
  resolveLineDash,
  resolveStackGroups,
  resolveTickExtendedRange,
  sankeyHitTest,
  scatterGroupColors,
  scatterPointPositions,
  squarifyTreemap,
  sunburstValue,
  timeToX,
  toLog,
  updateAnimation,
  vennHitTest,
  windowToX,
  xToCategoryIndex,
  xToPercent,
  xToTimeIndex,
  zoomToSlice
};
