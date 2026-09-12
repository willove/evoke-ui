import { getTheme, createValueFormatter, getPadding, applyLogTransform } from "./core";
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
  renderScatterTrendline
} from "./charts-basic";
import { renderFunnelChart, renderGaugeChart, renderHeatmapChart, renderCandleChart } from "./charts-advanced";
import { renderBinChart, renderBulletChart, renderTreemapChart, renderSparklineChart } from "./charts-special";
import { renderWaterfallChart, renderBoxplotChart, renderSunburstChart, renderMixedChart } from "./charts-extra";
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
    hiddenSeries = /* @__PURE__ */ new Set(),
    mouseX = -1,
    mouseY = -1,
    showCrosshair = false,
    hoverAnimProgress = 1,
    zoomRange,
    brushRect,
    focusSeries = null,
    hoveredToolbox = null
  } = params;
  const options = applyLogTransform(rawOptions);
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
        const yValues = scatterData.map((d) => d.y);
        const yRange = renderYAxis(renderCtx, "left", {
          min: Math.min(...yValues),
          max: Math.max(...yValues)
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
    case "candle": {
      const candleData = options.candleData || [];
      if (candleData.length > 0) {
        const allValues = candleData.flatMap((d) => [d.high, d.low]);
        const yRange = renderYAxis(renderCtx, "left", {
          min: Math.min(...allValues),
          max: Math.max(...allValues)
        });
        renderXAxis(renderCtx);
        renderCandleChart(renderCtx, yRange);
      }
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
      const boxData = options.boxData || [];
      if (boxData.length > 0) {
        const allValues = boxData.flatMap((b) => [b.min, b.max, ...b.outliers || []]);
        const yRange = renderYAxis(renderCtx, "left", {
          min: Math.min(...allValues),
          max: Math.max(...allValues)
        });
        leftRange = yRange;
        renderBoxplotChart(renderCtx, yRange);
        renderMarkLines(renderCtx, yRange);
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
      leftRange = renderYAxis(renderCtx, "left");
      let rightRange;
      if (hasRightAxis) {
        rightRange = renderYAxis(renderCtx, "right");
      }
      renderXAxis(renderCtx);
      renderMarkAreas(renderCtx);
      points = renderLineChart(renderCtx, leftRange, "left");
      if (hasRightAxis && rightRange) {
        const rightPoints = renderLineChart(renderCtx, rightRange, "right");
        points = points.concat(rightPoints);
      }
      renderMarkLines(renderCtx, leftRange);
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
  buildPieSlices,
  calculateRange2 as calculateRange,
  calculateTicks,
  calculateTimeTicks,
  categoryToX,
  computeBins,
  computeLegendLayout,
  computePieMaxRadius,
  computeSunburstDepth,
  computeSunburstGeometry,
  createAnimation,
  createSvgRecorder,
  drawSymbol,
  easings,
  estimateTextWidth,
  focusAlpha,
  formatLogTick,
  formatTimeTick,
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
  parseTimeLabels,
  renderChart,
  renderScatterTrendline2 as renderScatterTrendline,
  resolveConnectNulls,
  resolveLineDash,
  resolveStackGroups,
  resolveTickExtendedRange,
  squarifyTreemap,
  sunburstValue,
  timeToX,
  toLog,
  updateAnimation,
  windowToX,
  xToCategoryIndex,
  xToPercent,
  xToTimeIndex,
  zoomToSlice
};
