<template>
  <div
    ref="containerRef"
    class="ev-chart"
    :style="[containerStyle, { cursor: cursorStyle }]"
    role="img"
    :aria-label="props.options.ariaLabel || ariaLabelText"
  >
    <canvas
      v-if="!isEmpty && !internalError"
      ref="canvasRef"
      class="ev-chart__canvas"
      :style="canvasStyle"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @dblclick="handleDblClick"
      @pointerleave="handlePointerLeave"
    />

    <!-- HTML 覆盖层：富文本旁白 / 自定义标记（默认不拦截鼠标，内容可自行开启） -->
    <div v-if="!isEmpty && !props.options.loading && !internalError && $slots.overlay" class="ev-chart__overlay">
      <slot name="overlay" :plot-area="overlayInfo.plotArea" :theme="overlayInfo.theme" :options="props.options" />
    </div>

    <!-- 空数据占位 -->
    <Transition name="ev-chart-fade">
      <div v-if="isEmpty && !props.options.loading && !internalError" class="ev-chart__empty">
        <div class="ev-chart__empty-icon-wrap">
          <component :is="DataLine" class="ev-chart__empty-img" />
        </div>
        <span class="ev-chart__empty-text">{{ emptyTextI18n }}</span>
      </div>
    </Transition>

    <!-- 加载中骨架 -->
    <Transition name="ev-chart-fade">
      <div v-if="props.options.loading && !internalError" class="ev-chart__loading">
        <div class="ev-chart__loading-bars">
          <div v-for="i in 6" :key="i" class="ev-chart__loading-bar" :style="{ animationDelay: `${i * 80}ms` }" />
        </div>
      </div>
    </Transition>

    <!-- 错误边界 -->
    <Transition name="ev-chart-fade">
      <div v-if="internalError" class="ev-chart__error">
        <span class="ev-chart__error-icon">
          <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="7.5" x2="12" y2="13" />
            <line x1="12" y1="16.5" x2="12" y2="16.51" />
          </svg>
        </span>
        <span class="ev-chart__error-text">{{ internalError }}</span>
      </div>
    </Transition>

    <Transition name="ev-chart-tooltip">
      <div
        v-if="tooltipVisible && tooltipContent"
        ref="tooltipRef"
        class="ev-chart__tooltip"
        :class="`ev-chart__tooltip--${tooltipPlacement}`"
        :style="tooltipStyle"
        role="tooltip"
        v-html="tooltipContent"
      />
    </Transition>

    <!-- aria-live 区域，供屏幕阅读器读出hover信息 -->
    <div class="ev-chart__sr-only" role="status" aria-live="polite">
      {{ ariaLiveText }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, h } from "vue";
import { INTERACTION, applyWheelZoom, resolveCursor, pickTooltipRows } from "./interactions";
import { maxOf, minOf } from "./extent";
import {
  renderChart,
  createAnimation,
  updateAnimation,
  getTheme,
  getLegendBounds,
  getPadding,
  resolveTickExtendedRange,
  buildPieSlices,
  computeBins,
  squarifyTreemap,
  getHeatmapCategories,
  xToCategoryIndex,
  zoomToSlice,
  getDataZoomConfig,
  getSliderGeometry,
  windowToX,
  xToPercent,
  computeSunburstGeometry,
  sunburstValue,
  funnelStepColor,
  computePieMaxRadius,
  getToolboxBounds,
  createSvgRecorder,
  isMissingValue,
  sankeyHitTest,
  vennHitTest,
  chordHitTest,
  arcHitTest,
  ganttHitTest,
  boxplotHitTest,
  computeBoxplotGeometry,
  computeFacetGrids,
  computeMatrixCells,
  matrixFieldExtent,
  scatterPointPositions,
  scatterGroupColors,
  calendarHitTest
} from "./renderer";
import { DEFAULT_I18N_ZH } from "./types";
import { registerConnector, broadcastConnect } from "./connect";
import { validateOptions } from "./schema";
// 空态占位图标（折线）— 内联 SVG，保持本库零跨库依赖
const DataLine = () =>
  h("svg", { viewBox: "0 0 24 24", width: "1em", height: "1em", "aria-hidden": "true" }, [
    h("path", {
      fill: "currentColor",
      d: "M5 3V19H21V21H3V3H5ZM20.2929 6.29289L21.7071 7.70711L16 13.4142L13 10.415L8.70711 14.7071L7.29289 13.2929L13 7.58579L16 10.585L20.2929 6.29289Z"
    })
  ]);
defineOptions({ name: "EvChart" });
// 运行时 props 由 EvChartProps 接口手工还原（esbuild 剥泛型时一并剥掉；默认值并入声明，替代 withDefaults）
const props = defineProps({
  options: { type: Object, required: true },
  width: { type: [String, Number], default: "100%" },
  height: { type: [String, Number], default: 400 },
  responsive: { type: Boolean, default: true },
  devicePixelRatio: { type: Number, default: undefined },
});
const emit = defineEmits([
  "ready",
  "click",
  "legend-click",
  "hover",
  "unhover",
  "animation-end",
  "data-update",
  "brush-select",
  "zoom",
  "scene-change",
]);
const i18n = computed(() => ({
  ...DEFAULT_I18N_ZH,
  ...props.options?.i18n || {}
}));
const emptyTextI18n = computed(() => props.options?.emptyText || i18n.value.noData || "\u6682\u65E0\u6570\u636E");
const ariaLabelText = computed(() => {
  if (props.options?.ariaLabel) return props.options.ariaLabel;
  return `${props.options?.type || "chart"}-${props.options?.title || "chart"}`;
});
const ariaLiveText = ref("");
const isEmpty = computed(() => {
  if (props.options.loading) return false;
  const opt = props.options;
  switch (opt.type) {
    case "pie":
    case "doughnut":
    case "rose":
      return !opt.pieData || opt.pieData.length === 0;
    case "scatter":
      return !opt.scatterData || opt.scatterData.length === 0;
    case "funnel":
      return !opt.funnelData || opt.funnelData.length === 0;
    case "gauge":
      return !opt.gauge;
    case "heatmap":
      return !opt.heatmapData || opt.heatmapData.length === 0;
    case "calendar-heatmap":
      return !opt.calendarData || opt.calendarData.length === 0;
    case "candle":
      return !opt.candleData || opt.candleData.length === 0;
    case "bullet":
      return !opt.bulletData || opt.bulletData.length === 0;
    case "treemap":
      return !opt.treemapData || opt.treemapData.length === 0;
    case "sunburst":
      return !opt.sunburstData || opt.sunburstData.length === 0;
    case "boxplot":
      return !opt.boxData || opt.boxData.length === 0;
    case "waterfall":
    case "mixed":
      return !opt.labels?.length || !opt.series?.length;
    case "bin":
      return !opt.series || opt.series.length === 0 || opt.series.every((s) => !s.data || s.data.length === 0);
    case "sparkline":
      return !opt.series || opt.series.length === 0 || !opt.series[0]?.data?.length;
    case "radar":
      return !opt.radarIndicators?.length || !opt.radarSeries?.length;
    case "sankey":
    case "chord":
    case "arc":
      return !((opt.sankeyData || opt.chordData || opt.arcData)?.nodes?.length);
    case "venn":
      return !opt.vennData || opt.vennData.length === 0;
    case "gantt":
      return !opt.ganttData || opt.ganttData.length === 0;
    case "scatter-matrix":
      return !opt.matrixFields?.length || !opt.matrixData?.length;
    default:
      return !opt.labels?.length || !opt.series?.length;
  }
});
const internalError = ref(null);
const containerRef = ref();
const canvasRef = ref();
const tooltipRef = ref();
const tooltipVisible = ref(false);
const tooltipContent = ref("");
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipPlacement = ref("top");
let tooltipRafId = null;
let lastMouseClientX = 0;
let lastMouseClientY = 0;
let lastWidth = 0;
let lastHeight = 0;
let isEnterAnimating = false;
let animationState = createAnimation();
let animationFrameId = null;
let hoverIndex = -1;
let hoverAnimProgress = 0;
let hoverAnimFrameId = null;
let hoverAnimDone = null;
const hiddenSeries = ref(/* @__PURE__ */ new Set());
const focusSeries = ref(null);
// 显式 emphasis 焦点（系列名或索引）：优先于图例悬浮强调
const emphasisSeriesName = computed(() => {
  const em = props.options.emphasis;
  if (!em || em.series === undefined || em.dimOthers === false) return null;
  if (typeof em.series === "number") {
    return props.options.series?.[em.series]?.name ?? null;
  }
  return em.series || null;
});
const hoveredToolbox = ref(null);
let mouseX = -1;
let mouseY = -1;
let tweenFrameId = null;
let tweenState = null;
let darkModeObserver = null;
let lastIsDark = false;
const initialZoom = getDataZoomConfig(props.options);
const zoomRange = ref({
  start: initialZoom?.start ?? 0,
  end: initialZoom?.end ?? 100
});
let lastZoomKey = initialZoom ? JSON.stringify({
  e: initialZoom.enabled,
  s: initialZoom.start,
  e2: initialZoom.end,
  p: initialZoom.position,
  h: initialZoom.height
}) : "";
let dragMode = "none";
let dragStartX = 0;
let dragStartY = 0;
let dragStartRange = { start: 0, end: 100 };
const brushRect = ref(null);
let suppressClick = false;
let brushDragged = false;
// spec 版本号：宿主可能传非响应式普通对象，computed 需要一个可失效的依赖
const specVersion = ref(0);
// overlay 作用域插槽的入参（render 时刷新）
const overlayInfo = ref({
  plotArea: { x: 0, y: 0, width: 0, height: 0 },
  theme: getTheme(false, undefined),
  options: null,
});
const effectiveOptions = computed(() => {
  specVersion.value;
  const opt = props.options;
  // scenes：当前幕 patch 浅合并（顶层键替换），再走缩放切片
  const scene = opt.scenes?.items?.[sceneIndex.value];
  const base = scene?.patch ? { ...opt, ...scene.patch } : opt;
  const zoom = getDataZoomConfig(base);
  if (!zoom) return base;
  const range = zoomRange.value;
  if (range.start <= 0 && range.end >= 100) return base;
  const sliced = { ...base };
  const n = (base.labels || []).length;
  if (n > 0) {
    const { startIdx, endIdx } = zoomToSlice(range, n);
    sliced.labels = (base.labels || []).slice(startIdx, endIdx);
    if (base.series) {
      sliced.series = base.series.map((s) => ({ ...s, data: s.data.slice(startIdx, endIdx) }));
    }
    if (base.candleData) {
      sliced.candleData = base.candleData.slice(startIdx, endIdx);
    }
    if (base.volumeData) {
      sliced.volumeData = base.volumeData.slice(startIdx, endIdx);
    }
    ;
    sliced.__sliceStart = startIdx;
  } else if (base.candleData) {
    // K 线无 labels 基线：按 candleData 长度切片，volumeData 同步（长度不等长时量带会静默关闭）
    const cn = base.candleData.length;
    if (cn > 0) {
      const { startIdx, endIdx } = zoomToSlice(range, cn);
      sliced.candleData = base.candleData.slice(startIdx, endIdx);
      if (base.volumeData) {
        sliced.volumeData = base.volumeData.slice(startIdx, endIdx);
      }
      sliced.__sliceStart = startIdx;
    }
  } else if (base.scatterData && base.scatterData.length > 0) {
    const xs = base.scatterData.map((d) => d.x);
    const xMin = minOf(xs);
    const xMax = maxOf(xs);
    const span = xMax - xMin || 1;
    const lo = xMin + range.start / 100 * span;
    const hi = xMin + range.end / 100 * span;
    const filtered = base.scatterData.filter((d) => d.x >= lo && d.x <= hi);
    sliced.scatterData = filtered.length > 0 ? filtered : base.scatterData;
  }
  return sliced;
});
// ─── scenes 编排：分幕 reveal（duration 幕过渡时长 / hold 过渡后停留） ───
const sceneIndex = ref(0);
let sceneTimer = null;
let sceneAnimOverride = null;
function stopSceneTimer() {
  if (sceneTimer !== null) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
  }
}
function applyScene(i, opts = {}) {
  const items = props.options.scenes?.items || [];
  if (items.length === 0) return;
  const next = Math.max(0, Math.min(i, items.length - 1));
  if (next === sceneIndex.value && !opts.force) return;
  sceneIndex.value = next;
  const item = items[next];
  sceneAnimOverride = item?.duration
    ? { ...(props.options.animation || {}), duration: item.duration }
    : null;
  emit("scene-change", { index: next, total: items.length });
  render(true, sceneAnimOverride);
  scheduleSceneAdvance();
}
function scheduleSceneAdvance() {
  stopSceneTimer();
  const scenes = props.options.scenes;
  if (!scenes?.autoplay) return;
  const item = scenes.items?.[sceneIndex.value];
  if (!item) return;
  const wait = Math.max(0, (item.duration ?? 1200) + (item.hold ?? 0));
  sceneTimer = setTimeout(() => {
    const total = props.options.scenes?.items?.length ?? 0;
    if (total === 0) return;
    if (sceneIndex.value >= total - 1) {
      if (props.options.scenes?.loop) applyScene(0, { force: true });
    } else {
      applyScene(sceneIndex.value + 1);
    }
  }, wait);
}
function syncScenes() {
  const total = props.options.scenes?.items?.length ?? 0;
  if (total === 0) {
    stopSceneTimer();
    if (sceneIndex.value !== 0) sceneIndex.value = 0;
    return;
  }
  if (sceneIndex.value >= total) sceneIndex.value = 0;
  scheduleSceneAdvance();
}
function sliceStartOffset() {
  return effectiveOptions.value.__sliceStart || 0;
}
function isZoomEnabled() {
  return getDataZoomConfig(props.options) !== null;
}
const containerStyle = computed(() => {
  const width = typeof props.width === "number" ? `${props.width}px` : props.width;
  let height;
  if (typeof props.height === "number") {
    height = `${props.height}px`;
  } else if (/^\d+$/.test(props.height)) {
    height = `${props.height}px`;
  } else {
    height = props.height;
  }
  return {
    width,
    height,
    // 交互常量经 CSS 变量下发（DESIGN 交互规范：单一事实源 interactions.js）
    "--ev-tooltip-pos-transition": INTERACTION.tooltip.posTransition,
    "--ev-tooltip-fade-transition": INTERACTION.tooltip.fadeTransition,
  };
});
const cursorStyle = ref("default");
const dpr = computed(() => props.devicePixelRatio || window.devicePixelRatio || 1);
const tooltipStyle = computed(() => ({
  left: `${tooltipX.value}px`,
  top: `${tooltipY.value}px`
}));
function updateTooltipPosition(clientX, clientY) {
  const container = containerRef.value;
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const relX = clientX - containerRect.left;
  const relY = clientY - containerRect.top;
  const el = tooltipRef.value;
  const tw = el?.offsetWidth || 120;
  const th = el?.offsetHeight || 40;
  const gap = 12;
  const margin = 2;
  let legendBottom = margin;
  const legend = props.options.legend || {};
  if (legend.show !== false && (legend.position || "bottom") === "top") {
    legendBottom = getPadding(props.options, containerRect.width).top;
  }
  const spaceRight = containerRect.width - relX - gap;
  const spaceLeft = relX - gap;
  let left;
  if (spaceRight >= tw) {
    left = relX + gap;
  } else if (spaceLeft >= tw) {
    left = relX - gap - tw;
  } else {
    left = Math.max(margin, Math.min(relX - tw / 2, containerRect.width - tw - margin));
  }
  const spaceBelow = containerRect.height - relY - gap;
  const spaceAbove = relY - gap - legendBottom;
  let top;
  // 容器高度装得下 tooltip：在容器内翻转并钳制；
  // 装不下（监控长条等矮容器）：允许溢出容器边界，按视口剩余空间选边，杜绝被裁切
  const fitsInside = th + margin * 2 <= containerRect.height;
  if (fitsInside) {
    if (spaceBelow >= th) {
      top = relY + gap;
    } else if (spaceAbove >= th) {
      top = relY - gap - th;
    } else {
      top = spaceBelow >= spaceAbove ? containerRect.height - th - margin : legendBottom;
    }
    top = Math.max(legendBottom, Math.min(top, containerRect.height - th - margin));
  } else {
    const pointViewportY = containerRect.top + relY;
    const belowInViewport = pointViewportY + gap + th <= window.innerHeight - 8;
    const aboveInViewport = pointViewportY - gap - th >= 8;
    top = belowInViewport || !aboveInViewport ? relY + gap : relY - gap - th;
  }
  left = Math.max(margin, Math.min(left, containerRect.width - tw - margin));
  tooltipPlacement.value = "top";
  tooltipX.value = left;
  tooltipY.value = top;
}
const canvasStyle = computed(() => ({
  cursor: hoverIndex >= 0 ? "pointer" : "default"
}));
function render(animate = true, animOverride = null) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const container = containerRef.value;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);
  if (width === lastWidth && height === lastHeight && !animate) return;
  if (width <= 0 || height <= 0) return;
  internalError.value = null;
  if (isEmpty.value) {
    canvas.width = 0;
    canvas.height = 0;
    lastWidth = width;
    lastHeight = height;
    return;
  }
  try {
    let animateFrame = function() {
      const isAnimating = updateAnimation(animationState);
      try {
        renderChart(canvas, buildRenderParams(animationState.progress));
      } catch (err) {
        handleRenderError(err);
        return;
      }
      if (isAnimating) {
        animationFrameId = requestAnimationFrame(animateFrame);
      } else {
        isEnterAnimating = false;
        emit("animation-end");
        emit("ready");
      }
    };
    stopAnimation();
    stopHoverAnimation();
    stopTweenAnimation();
    isEnterAnimating = false;
    hoverAnimProgress = 0;
    lastWidth = width;
    lastHeight = height;
    canvas.width = width * dpr.value;
    canvas.height = height * dpr.value;
    const overlayPadding = getPadding(effectiveOptions.value, width);
    overlayInfo.value = {
      plotArea: {
        x: overlayPadding.left,
        y: overlayPadding.top,
        width: width - overlayPadding.left - overlayPadding.right,
        height: height - overlayPadding.top - overlayPadding.bottom,
      },
      theme: getTheme(document.documentElement.classList.contains("dark"), effectiveOptions.value.theme, effectiveOptions.value.palette),
      options: props.options,
    };
    const animCfg = animOverride || props.options.animation;
    const animEnabled = animate && animCfg?.enabled !== false;
    animationState = createAnimation(animCfg);
    animationState.isAnimating = animEnabled;
    if (animEnabled) {
      isEnterAnimating = true;
      animateFrame();
    } else {
      try {
        renderChart(canvas, buildRenderParams(1));
      } catch (err) {
        handleRenderError(err);
        return;
      }
      emit("animation-end");
      emit("ready");
    }
  } catch (err) {
    handleRenderError(err);
  }
}
function buildRenderParams(progress, optionsOverride) {
  return {
    options: optionsOverride || effectiveOptions.value,
    dpr: dpr.value,
    progress,
    hoverIndex,
    hiddenSeries: hiddenSeries.value,
    mouseX,
    mouseY,
    showCrosshair: hoverIndex >= 0,
    hoverAnimProgress,
    focusAnimProgress,
    zoomRange: isZoomEnabled() ? zoomRange.value : void 0,
    brushRect: brushRect.value,
    focusSeries: focusSeries.value,
    hoveredToolbox: hoveredToolbox.value
  };
}
// ─── 焦点淡化缓动：图例悬浮 / emphasis 的 22% 淡化随 180ms 缓入（DESIGN §13.2）───
// 初始值跟 options.emphasis 对齐：挂载即配置焦点时首帧就是终态，不再等第一次交互
let focusAnimProgress = emphasisSeriesName.value ? 1 : 0;
let focusAnimFrameId = null;
function animateFocusProgress() {
  if (focusAnimFrameId !== null) {
    cancelAnimationFrame(focusAnimFrameId);
    focusAnimFrameId = null;
  }
  const target = focusSeries.value ? 1 : 0;
  if (props.options.animation?.enabled === false || target === focusAnimProgress) {
    focusAnimProgress = target;
    redraw();
    return;
  }
  const start = focusAnimProgress;
  const startTime = performance.now();
  const duration = 180;
  function frame(now) {
    const tRaw = Math.min((now - startTime) / duration, 1);
    focusAnimProgress = start + (target - start) * (1 - Math.pow(1 - tRaw, 3));
    redraw();
    if (tRaw < 1) {
      focusAnimFrameId = requestAnimationFrame(frame);
    } else {
      focusAnimFrameId = null;
    }
  }
  focusAnimFrameId = requestAnimationFrame(frame);
}
function stopFocusAnimation() {
  if (focusAnimFrameId !== null) {
    cancelAnimationFrame(focusAnimFrameId);
    focusAnimFrameId = null;
  }
}
function snapshotSeriesData(opt) {
  const map = /* @__PURE__ */ new Map();
  (opt.series || []).forEach(
    (s) => map.set(
      s.name,
      (s.data || []).map((v) => isMissingValue(v) ? 0 : v)
    )
  );
  return map;
}
function sameStructure(a, b) {
  const la = a.labels || [];
  const lb = b.labels || [];
  if (la.length !== lb.length || la.some((v, i) => v !== lb[i])) return false;
  const sa = (a.series || []).map((s) => s.name).join("|");
  const sb = (b.series || []).map((s) => s.name).join("|");
  return sa === sb;
}
function interpolateOptions(prev, next, t) {
  const offset = next.__sliceStart || 0;
  const series = (next.series || []).map((s) => {
    const old = prev.get(s.name);
    if (!old) return s;
    const data = (s.data || []).map((v, i) => {
      if (isMissingValue(v)) return v;
      const from = old[i + offset] ?? 0;
      return from + (v - from) * t;
    });
    return { ...s, data };
  });
  return { ...next, series };
}
function dataSignature(opt) {
  const total = (opt.series || []).reduce(
    (sum, s) => sum + (s.data || []).reduce((acc, v) => acc + (isMissingValue(v) ? 0 : v), 0),
    0
  );
  return `${(opt.series || []).length}\u7CFB\u5217/${(opt.labels || []).length}\u7C7B\u76EE/\u03A3${Math.round(total)}`;
}
function stopTweenAnimation() {
  if (tweenFrameId !== null) {
    cancelAnimationFrame(tweenFrameId);
    tweenFrameId = null;
  }
  tweenState = null;
}
function startTweenIfNeeded(prevOptions) {
  const nextOptions = props.options;
  if (nextOptions.animation?.enabled === false) return false;
  if (!sameStructure(prevOptions, nextOptions)) return false;
  const prevSnapshot = snapshotSeriesData(prevOptions);
  const changed = (nextOptions.series || []).some((s) => {
    const old = prevSnapshot.get(s.name);
    if (!old) return false;
    return (s.data || []).some((v, i) => (isMissingValue(v) ? 0 : v) !== (old[i] ?? 0));
  });
  if (!changed) return false;
  stopAnimation();
  stopHoverAnimation();
  isEnterAnimating = false;
  stopTweenAnimation();
  const canvas = canvasRef.value;
  if (!canvas) return false;
  tweenState = createAnimation(nextOptions.animation);
  const fromSig = dataSignature(prevOptions);
  const toSig = dataSignature(nextOptions);
  function frame() {
    if (!tweenState) return;
    const isAnimating = updateAnimation(tweenState);
    const tweened = interpolateOptions(prevSnapshot, effectiveOptions.value, tweenState.progress);
    try {
      renderChart(canvasRef.value, buildRenderParams(1, tweened));
    } catch (err) {
      handleRenderError(err);
      return;
    }
    if (isAnimating) {
      tweenFrameId = requestAnimationFrame(frame);
    } else {
      tweenFrameId = null;
      tweenState = null;
      emit("data-update", { from: fromSig, to: toSig });
      emit("animation-end");
    }
  }
  tweenFrameId = requestAnimationFrame(frame);
  return true;
}
function handleRenderError(err) {
  const msg = err instanceof Error ? err.message : "Chart render error";
  internalError.value = msg;
  console.error("[EvChart] render error:", err);
}
function redraw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  if (isEnterAnimating) {
    stopAnimation();
    isEnterAnimating = false;
  }
  if (tweenState) stopTweenAnimation();
  if (isEmpty.value) return;
  try {
    renderChart(canvas, buildRenderParams(1));
  } catch (err) {
    handleRenderError(err);
  }
}
function stopAnimation() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
function stopHoverAnimation() {
  if (hoverAnimFrameId !== null) {
    cancelAnimationFrame(hoverAnimFrameId);
    hoverAnimFrameId = null;
  }
  hoverAnimDone = null;
}
// 饼/环/玫瑰是「抽出」动画，旭日图与矩形树图是「聚焦子树」淡化，雷达是
// 「轴线点亮」——都要缓动（DESIGN §13：动画只属于数据与焦点过渡）
function usesHoverAnimation() {
  const t = props.options.type;
  return t === "pie" || t === "doughnut" || t === "rose" || t === "sunburst" || t === "treemap" || t === "radar";
}
// 进出带渐变动画的类型：饼类抽出、雷达轴线点亮、韦恩/桑基/弦/弧透明度聚焦、
// 柱族/箱线/K线/漏斗/热力/甘特的强调加深——全图型强调缓动（用户定则），仅准线/tooltip 即时
function animatesHoverEnter() {
  const t = props.options.type;
  return [
    "pie", "doughnut", "rose", "radar", "venn", "sankey", "chord", "arc",
    "bar", "stacked-bar", "horizontal-bar", "waterfall", "mixed",
    "boxplot", "candle", "heatmap", "calendar-heatmap", "funnel", "gantt",
  ].includes(t);
}
// 清空悬浮焦点：缓动类型保留 hoverIndex 播完出场动画再清索引（透明度随 progress 回落），
// 其余直接回原色（焦点一没就没有淡化对象）
function clearHover() {
  if (hoverIndex === -1) return false;
  if (animatesHoverEnter()) {
    startHoverAnimation(-1, () => {
      hoverIndex = -1;
      redraw();
    });
  } else {
    hoverIndex = -1;
    stopHoverAnimation();
    hoverAnimProgress = 0;
    redraw();
  }
  return true;
}
function startHoverAnimation(dir, onDone) {
  if (!animatesHoverEnter()) {
    return;
  }
  if (props.options.animation?.enabled === false) {
    hoverAnimProgress = dir > 0 ? 1 : 0;
    redraw();
    if (onDone) onDone();
    return;
  }
  stopHoverAnimation();
  hoverAnimDone = onDone || null;
  const duration = 220;
  const startTime = performance.now();
  const startProgress = hoverAnimProgress;
  const targetProgress = dir > 0 ? 1 : 0;
  function frame(now) {
    const elapsed = now - startTime;
    const tRaw = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - tRaw, 3);
    hoverAnimProgress = startProgress + (targetProgress - startProgress) * eased;
    if (isEnterAnimating) {
      stopAnimation();
      isEnterAnimating = false;
    }
    renderChart(canvasRef.value, buildRenderParams(1));
    if (tRaw < 1) {
      hoverAnimFrameId = requestAnimationFrame(frame);
    } else {
      hoverAnimFrameId = null;
      const done = hoverAnimDone;
      hoverAnimDone = null;
      if (done) done();
    }
  }
  hoverAnimFrameId = requestAnimationFrame(frame);
}
let renderTimer = null;
function debouncedRender(animate = true) {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(() => render(animate), 16);
}
const LEGEND_INTERACTIVE_TYPES = [
  "line",
  "bar",
  "area",
  "stacked-bar",
  "horizontal-bar",
  "pie",
  "doughnut",
  "rose",
  "radar",
  "funnel",
  "scatter",
  "sankey",
  "chord",
  "arc",
  "venn",
  "candle"
];
function checkLegendHit(x, y) {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const canvasX = x - rect.left;
  const canvasY = y - rect.top;
  const isDark = document.documentElement.classList.contains("dark");
  const theme = getTheme(isDark, props.options.theme, props.options.palette);
  const width = rect.width;
  const height = rect.height;
  const padding = getPadding(effectiveOptions.value, width);
  const plotArea = {
    x: padding.left,
    y: padding.top,
    width: width - padding.left - padding.right,
    height: height - padding.top - padding.bottom
  };
  const ctx2d = canvas.getContext("2d");
  const bounds = getLegendBounds(ctx2d, effectiveOptions.value, plotArea, width, height, theme, hiddenSeries.value);
  for (const bound of bounds) {
    if (canvasX >= bound.x && canvasX <= bound.x + bound.width && canvasY >= bound.y && canvasY <= bound.y + bound.height) {
      return bound.name;
    }
  }
  return null;
}
function checkToolboxHit(clientX, clientY) {
  if (!props.options.toolbox?.show) return null;
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const buttons = getToolboxBounds(props.options, rect.width);
  for (const b of buttons) {
    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) return b.feature;
  }
  return null;
}
function runToolboxFeature(feature) {
  if (feature === "saveAsImage") {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${props.options.toolbox?.filename || "chart"}.png`;
    link.href = url;
    link.click();
  } else if (feature === "restore") {
    stopTweenAnimation();
    if (isZoomEnabled()) setZoomRange({ start: 0, end: 100 });
    if (hiddenSeries.value.size > 0) {
      hiddenSeries.value = /* @__PURE__ */ new Set();
      render(true);
    } else {
      redraw();
    }
  }
}
function getHoveredData(x, y) {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const canvasX = x - rect.left;
  const canvasY = y - rect.top;
  const options = effectiveOptions.value;
  const width = rect.width;
  const height = rect.height;
  const padding = getPadding(options, width);
  const plotArea = {
    x: padding.left,
    y: padding.top,
    width: width - padding.left - padding.right,
    height: height - padding.top - padding.bottom
  };
  const isPieLike = options.type === "pie" || options.type === "doughnut" || options.type === "rose";
  if (!isPieLike) {
    if (canvasX < plotArea.x || canvasX > plotArea.x + plotArea.width || canvasY < plotArea.y || canvasY > plotArea.y + plotArea.height) {
      return null;
    }
  }
  const isDark = document.documentElement.classList.contains("dark");
  const theme = getTheme(isDark, options.theme, options.palette);
  if (isPieLike) {
    const slices = buildPieSlices(options, hiddenSeries.value);
    if (slices.length === 0) return null;
    const centerX = plotArea.x + plotArea.width / 2;
    const centerY = plotArea.y + plotArea.height / 2;
    const baseRadius = computePieMaxRadius(slices, options, plotArea);
    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const innerRadius = options.type === "doughnut" ? Math.max(0, Math.min(baseRadius - 5, baseRadius * (options.innerRadius || 0.6))) : 0;
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    const total = slices.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;
    const maxVal = maxOf(slices.map((d) => d.value));
    for (let i = 0; i < slices.length; i++) {
      const sliceAngle = slices[i].value / total * Math.PI * 2;
      if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
        const sectorRadius = options.type === "rose" ? baseRadius * Math.sqrt(slices[i].value / maxVal) + 12 : baseRadius + 12;
        if (distance > sectorRadius || distance < innerRadius) return null;
        const slice = slices[i];
        const color = slice.color || theme.colors[i % theme.colors.length];
        return {
          index: i,
          params: {
            seriesName: slice.label,
            name: slice.label,
            value: slice.value,
            color,
            dataIndex: slice.sourceIndex,
            seriesIndex: 0
          }
        };
      }
      currentAngle += sliceAngle;
    }
    return null;
  }
  if (options.type === "funnel") {
    const allFunnel = (options.funnelData || []).filter((d) => !hiddenSeries.value.has(d.label || ""));
    if (allFunnel.length === 0) return null;
    const drawData = options.pyramid === true ? [...allFunnel].reverse() : allFunnel;
    const topY = plotArea.y + 8;
    const bottomY = plotArea.y + plotArea.height - 8;
    const totalHeight = bottomY - topY;
    const stepHeight = totalHeight / drawData.length;
    const relativeY = canvasY - topY;
    if (relativeY < 0 || relativeY > totalHeight) return null;
    const i = Math.floor(relativeY / stepHeight);
    if (i < 0 || i >= drawData.length) return null;
    const data = drawData[i];
    const color = funnelStepColor(data, allFunnel.indexOf(data) < 0 ? i : allFunnel.indexOf(data), theme);
    return {
      index: i,
      params: {
        seriesName: data.label,
        name: data.label,
        value: data.value,
        color,
        dataIndex: allFunnel.indexOf(data),
        seriesIndex: 0
      }
    };
  }
  if (options.type === "waterfall") {
    const labels2 = options.labels || [];
    const deltas = (options.series || []).filter((s) => !hiddenSeries.value.has(s.name))[0]?.data || [];
    if (labels2.length === 0 || deltas.length === 0) return null;
    const categoryWidth = plotArea.width / labels2.length;
    const i = Math.floor((canvasX - plotArea.x) / categoryWidth);
    if (i < 0 || i >= labels2.length) return null;
    const wf = options.waterfall || {};
    const totalIdx = new Set(wf.totalIndices || []);
    const v = deltas[i] || 0;
    let cumulative = 0;
    for (let k = 0; k <= i; k++) {
      const vk = deltas[k] || 0;
      cumulative = totalIdx.has(k) ? vk : cumulative + vk;
    }
    const isTotal = totalIdx.has(i);
    const color = isTotal ? wf.totalColor || theme.colors[0] : v >= 0 ? wf.increaseColor || "#dc2626" : wf.decreaseColor || "#16a34a";
    return {
      index: i,
      params: {
        seriesName: options.series?.[0]?.name || "Waterfall",
        name: isTotal ? `${labels2[i]}\uFF08\u5408\u8BA1 ${cumulative}\uFF09` : `${labels2[i]}\uFF08\u7D2F\u8BA1 ${cumulative}\uFF09`,
        value: v,
        color,
        dataIndex: i + sliceStartOffset(),
        seriesIndex: 0
      }
    };
  }
  if (options.type === "boxplot") {
    const visible = (options.boxData || []).filter(
      (b) => !(b.group && hiddenSeries.value.has(b.group)) && !hiddenSeries.value.has(b.label)
    );
    if (visible.length === 0) return null;
    const showOutliers = options.showOutliers !== false;
    const allValues = visible.flatMap((b) => [b.min, b.max, ...(showOutliers ? b.outliers || [] : [])]);
    const axisCfg = options.boxHorizontal ? options.xAxis || {} : options.yAxis || {};
    const ext = resolveTickExtendedRange(
      axisCfg.min ?? minOf(allValues),
      axisCfg.max ?? maxOf(allValues),
      axisCfg.ticks || 5
    );
    return boxplotHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries.value, { min: ext.min, max: ext.max });
  }
  if (options.type === "calendar-heatmap") {
    return calendarHitTest(canvasX, canvasY, plotArea, options, theme);
  }
  if (options.type === "sankey") {
    return sankeyHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries.value);
  }
  if (options.type === "venn") {
    return vennHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries.value);
  }
  if (options.type === "chord") {
    return chordHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries.value);
  }
  if (options.type === "arc") {
    if (options.arcCircular === true) {
      return chordHitTest(
        canvasX, canvasY, plotArea,
        { ...options, chordData: options.arcData, chordMode: "curve" },
        theme, hiddenSeries.value
      );
    }
    return arcHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries.value);
  }
  if (options.type === "gantt") {
    return ganttHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries.value);
  }
  if (options.type === "scatter-matrix") {
    const fields = options.matrixFields || [];
    const records = options.matrixData || [];
    if (fields.length === 0 || records.length === 0) return null;
    const cells = computeMatrixCells(plotArea, fields);
    const cell = cells.find(
      (c) => canvasX >= c.x && canvasX <= c.x + c.width && canvasY >= c.y && canvasY <= c.y + c.height
    );
    if (!cell || cell.row === cell.col) return null;
    const extX = matrixFieldExtent(records, cell.xField);
    const extY = matrixFieldExtent(records, cell.yField);
    const px = (v) => cell.x + 5 + (v - extX.min) / (extX.max - extX.min) * (cell.width - 10);
    const py = (v) => cell.y + cell.height - 5 - (v - extY.min) / (extY.max - extY.min) * (cell.height - 10);
    let nearest = -1;
    let minDist = Infinity;
    records.forEach((record, ri) => {
      const xv = record[cell.xField];
      const yv = record[cell.yField];
      if (typeof xv !== "number" || typeof yv !== "number") return;
      const dist = Math.sqrt((canvasX - px(xv)) ** 2 + (canvasY - py(yv)) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = ri;
      }
    });
    if (nearest < 0 || minDist > 18) return null;
    const record = records[nearest];
    const cellIndex = cells.indexOf(cell);
    return {
      index: cellIndex,
      params: {
        seriesName: record.label || `${cell.yField} × ${cell.xField}`,
        name: `${cell.xField}=${record[cell.xField]}, ${cell.yField}=${record[cell.yField]}`,
        value: record[cell.yField],
        color: record.color || theme.colors[0],
        dataIndex: cellIndex,
        seriesIndex: 0
      }
    };
  }
  if (options.type === "sunburst") {
    // 命中共用渲染口径的几何（环厚/留白一致），否则外环会点不中
    const geo = computeSunburstGeometry(plotArea, options, theme, formatTooltipValue);
    if (!geo) return null;
    const { centerX, centerY, segments } = geo;
    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let hoverAngle = Math.atan2(dy, dx);
    if (hoverAngle < -Math.PI / 2) hoverAngle += Math.PI * 2;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (distance >= seg.r0 && distance <= seg.r1 && hoverAngle >= seg.startAngle && hoverAngle < seg.endAngle) {
        return {
          index: i,
          params: {
            seriesName: seg.node.name,
            name: seg.node.name,
            value: sunburstValue(seg.node),
            color: seg.color,
            dataIndex: i,
            seriesIndex: 0
          }
        };
      }
    }
    return null;
  }
  if (options.type === "gauge") {
    const gauge = options.gauge;
    if (!gauge) return null;
    return {
      index: 0,
      params: {
        seriesName: options.title || "Gauge",
        name: options.title || "Gauge",
        value: gauge.value,
        color: typeof gauge.color === "string" ? gauge.color : theme.colors[0],
        dataIndex: 0,
        seriesIndex: 0
      }
    };
  }
  if (options.type === "heatmap") {
    const heatmapData = options.heatmapData || [];
    if (heatmapData.length === 0) return null;
    const { xCategories, yCategories } = getHeatmapCategories(options);
    const cellWidth = plotArea.width / xCategories.length;
    const cellHeight = plotArea.height / yCategories.length;
    const xIndex = Math.floor((canvasX - plotArea.x) / cellWidth);
    const yIndex = Math.floor((canvasY - plotArea.y) / cellHeight);
    if (xIndex < 0 || xIndex >= xCategories.length || yIndex < 0 || yIndex >= yCategories.length) return null;
    const point = heatmapData.find((d) => d.x === xCategories[xIndex] && d.y === yCategories[yIndex]);
    if (!point) return null;
    const dataIndex2 = heatmapData.indexOf(point);
    return {
      index: dataIndex2,
      params: {
        seriesName: `${point.x}, ${point.y}`,
        name: `${point.x} / ${point.y}`,
        value: point.value,
        color: point.color || theme.colors[0],
        dataIndex: dataIndex2,
        seriesIndex: 0
      }
    };
  }
  if (options.type === "scatter") {
    const scatterData = options.scatterData || [];
    if (scatterData.length === 0) return null;
    // 分面：先定位所在格，再在格内找最近点
    if (options.facet === true) {
      const grid = computeFacetGrids(scatterData, plotArea, options);
      if (!grid) return null;
      for (const facet of grid.facets) {
        const a = facet.area;
        if (canvasX < a.x || canvasX > a.x + a.width || canvasY < a.y || canvasY > a.y + a.height) continue;
        let nearestLocal = -1;
        let minDistance = Infinity;
        facet.data.forEach((point, i) => {
          const ppx = facet.toX(point.x);
          const ppy = facet.toY(point.y);
          const dist = Math.sqrt((canvasX - ppx) ** 2 + (canvasY - ppy) ** 2);
          if (dist < minDistance) {
            minDistance = dist;
            nearestLocal = i;
          }
        });
        if (nearestLocal < 0 || minDistance > 24) return null;
        const point = facet.data[nearestLocal];
        const globalIdx = scatterData.indexOf(point);
        const color = point.color || theme.colors[globalIdx % theme.colors.length];
        return {
          index: globalIdx,
          params: {
            seriesName: point.group || point.label || `Point ${globalIdx + 1}`,
            name: `(${point.x}, ${point.y})`,
            value: point.y,
            color,
            dataIndex: globalIdx,
            seriesIndex: 0
          }
        };
      }
      return null;
    }
    const yValues = scatterData.map((d) => d.y);
    const axisConfig = options.yAxis || {};
    const rawMin = axisConfig.min ?? minOf(yValues);
    const rawMax = axisConfig.max ?? maxOf(yValues);
    const yExt = resolveTickExtendedRange(rawMin, rawMax, axisConfig.ticks || 5);
    // 点位与渲染同一口径（含抖动），看到的和命中的是同一批坐标
    const positions = scatterPointPositions(scatterData, { min: yExt.min, max: yExt.max }, plotArea, options);
    const groupColors = scatterGroupColors(scatterData, theme);
    let nearestIndex = -1;
    let minDistance = Infinity;
    scatterData.forEach((point, i) => {
      if (hiddenSeries.value.has(point.label || `P${i + 1}`) || (point.group && hiddenSeries.value.has(point.group))) return;
      const [px, py] = positions[i];
      const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    });
    if (nearestIndex >= 0 && minDistance < 30) {
      const point = scatterData[nearestIndex];
      const color = point.color
        || (point.group && groupColors.has(point.group) ? groupColors.get(point.group) : theme.colors[nearestIndex % theme.colors.length]);
      return {
        index: nearestIndex,
        params: {
          seriesName: point.label || point.group || `Point ${nearestIndex + 1}`,
          name: `(${point.x}, ${point.y})`,
          value: point.y,
          color,
          dataIndex: nearestIndex,
          seriesIndex: 0
        }
      };
    }
    return null;
  }
  if (options.type === "candle") {
    const candleData = options.candleData || [];
    if (candleData.length === 0) return null;
    const categoryWidth = plotArea.width / candleData.length;
    const i = Math.floor((canvasX - plotArea.x) / categoryWidth);
    if (i < 0 || i >= candleData.length) return null;
    const candle = candleData[i];
    const isUp = candle.close >= candle.open;
    const color = isUp ? props.options.candleUpColor || "#dc2626" : props.options.candleDownColor || "#16a34a";
    return {
      index: i,
      params: {
        seriesName: candle.label,
        name: candle.label,
        value: [candle.open, candle.close, candle.high, candle.low],
        volume: (options.volumeData || [])[i],
        color,
        dataIndex: i,
        seriesIndex: 0
      }
    };
  }
  if (options.type === "bullet") {
    const bulletData = options.bulletData || [];
    if (bulletData.length === 0) return null;
    const rowHeight = plotArea.height / bulletData.length;
    const i = Math.floor((canvasY - plotArea.y) / rowHeight);
    if (i < 0 || i >= bulletData.length) return null;
    const b = bulletData[i];
    return {
      index: i,
      params: {
        seriesName: b.name,
        name: b.name,
        value: b.value,
        color: b.color || theme.colors[0],
        dataIndex: i,
        seriesIndex: 0
      }
    };
  }
  if (options.type === "bin") {
    const result = computeBins(options, hiddenSeries.value);
    if (!result) return null;
    const { bins, frequencies } = result;
    const binCount = bins.length - 1;
    const step = (bins[binCount] - bins[0]) / binCount || 1;
    const relativeX = canvasX - plotArea.x;
    if (relativeX < 0 || relativeX > plotArea.width) return null;
    const i = Math.min(binCount - 1, Math.floor(relativeX / (plotArea.width / binCount)));
    const fmt = (v) => {
      const decimals = Math.max(0, Math.min(6, Math.ceil(-Math.log10(step))));
      return v.toFixed(decimals);
    };
    return {
      index: i,
      params: {
        seriesName: "\u9891\u6570",
        name: `${fmt(bins[i])} ~ ${fmt(bins[i + 1])}`,
        // 修复：原来恒为 0，tooltip 应显示该箱的真实频数
        value: frequencies[i],
        color: theme.colors[0],
        dataIndex: i,
        seriesIndex: 0
      }
    };
  }
  if (options.type === "treemap") {
    const treemapData = options.treemapData || [];
    if (treemapData.length === 0) return null;
    const rects = squarifyTreemap(treemapData, plotArea.x, plotArea.y, plotArea.width, plotArea.height, 0, []);
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (canvasX >= r.x && canvasX <= r.x + r.w && canvasY >= r.y && canvasY <= r.y + r.h) {
        return {
          index: i,
          params: {
            seriesName: r.node.name,
            name: r.node.name,
            value: r.node.value,
            color: r.node.color || theme.colors[r.depth % theme.colors.length],
            dataIndex: i,
            seriesIndex: 0
          }
        };
      }
    }
    return null;
  }
  if (options.type === "sparkline") {
    const labels2 = options.labels || [];
    const visibleSeries2 = (options.series || []).filter((s) => !hiddenSeries.value.has(s.name));
    if (visibleSeries2.length === 0) return null;
    const count = labels2.length > 0 ? labels2.length : visibleSeries2[0]?.data.length || 0;
    if (count === 0) return null;
    const step = plotArea.width / (count - 1 || 1);
    const i = Math.round((canvasX - plotArea.x) / step);
    if (i < 0 || i >= count) return null;
    const params = visibleSeries2.map((s, sIdx) => ({
      seriesName: s.name,
      name: labels2[i] || `Point ${i + 1}`,
      value: s.data[i],
      color: s.color || theme.colors[options.series.indexOf(s) % theme.colors.length],
      dataIndex: i,
      seriesIndex: sIdx
    }));
    return { index: i, params };
  }
  if (options.type === "horizontal-bar") {
    const labels2 = options.labels || [];
    const visibleSeries2 = (options.series || []).filter((s) => !hiddenSeries.value.has(s.name));
    if (labels2.length === 0 || visibleSeries2.length === 0) return null;
    const categoryWidth = plotArea.height / labels2.length;
    const i = Math.floor((plotArea.y + plotArea.height - canvasY) / categoryWidth);
    if (i < 0 || i >= labels2.length) return null;
    const params = visibleSeries2.map((s, sIdx) => ({
      seriesName: s.name,
      name: labels2[i],
      value: s.data[i],
      color: s.color || theme.colors[options.series.indexOf(s) % theme.colors.length],
      dataIndex: i,
      seriesIndex: sIdx
    }));
    return { index: i, params };
  }
  if (options.type === "radar") {
    const indicators = options.radarIndicators || [];
    const series = (options.radarSeries || []).filter((s) => !hiddenSeries.value.has(s.name));
    if (indicators.length === 0 || series.length === 0) return null;
    const centerX = plotArea.x + plotArea.width / 2;
    const centerY = plotArea.y + plotArea.height / 2;
    const radius = Math.max(40, Math.min(plotArea.width, plotArea.height) / 2 - 30);
    const angleStep = Math.PI * 2 / indicators.length;
    // 维度标签命中：悬到标签上同样激活该轴（DESIGN §3.1 轴线悬浮高亮）
    const labelOffset = options.radarLabelOffset ?? 12;
    let labelHit = -1;
    indicators.forEach((indicator, i) => {
      if (labelHit >= 0) return;
      const angle = i * angleStep - Math.PI / 2;
      const lx = centerX + Math.cos(angle) * (radius + labelOffset);
      const ly = centerY + Math.sin(angle) * (radius + labelOffset);
      if (Math.sqrt((canvasX - lx) ** 2 + (canvasY - ly) ** 2) <= 18) labelHit = i;
    });
    if (labelHit >= 0) {
      return radarAxisHover(labelHit, indicators, series, options, theme);
    }
    let nearestIndex = -1;
    let minDist = Infinity;
    indicators.forEach((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const ind = indicators[i];
      const span = ind.max - (ind.min || 0);
      const maxR = span > 0 ? maxOf(series.map((s) => radius * (Math.max(0, (s.data[i] || 0) - (ind.min || 0)) / span))) : 0;
      const px = centerX + Math.cos(angle) * maxR;
      const py = centerY + Math.sin(angle) * maxR;
      const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    });
    if (nearestIndex < 0 || minDist > 30) return null;
    return radarAxisHover(nearestIndex, indicators, series, options, theme);
  }
  const labels = options.labels || [];
  if (labels.length === 0) return null;
  const dataIndex = xToCategoryIndex(options, plotArea, labels, canvasX);
  if (dataIndex < 0 || dataIndex >= labels.length) return null;
  const visibleSeries = (options.series || []).filter((s) => !hiddenSeries.value.has(s.name));
  if (visibleSeries.length === 0) return null;
  const volume = (options.volumeData || [])[dataIndex];
  const showAllSeries = props.options.tooltip?.showAllSeries !== false;
  if (showAllSeries && visibleSeries.length > 1) {
    if (visibleSeries.every((s) => isMissingValue(s.data[dataIndex]))) return null;
    const params = visibleSeries.map((s, sIdx) => ({
      seriesName: s.name,
      name: labels[dataIndex],
      value: s.data[dataIndex],
      volume,
      color: s.color || theme.colors[options.series.indexOf(s) % theme.colors.length],
      dataIndex: dataIndex + sliceStartOffset(),
      seriesIndex: sIdx
    }));
    return { index: dataIndex, params };
  } else {
    const series = visibleSeries[0];
    if (isMissingValue(series.data[dataIndex])) return null;
    const color = series.color || theme.colors[0];
    return {
      index: dataIndex,
      params: {
        seriesName: series.name,
        name: labels[dataIndex],
        value: series.data[dataIndex],
        volume,
        color,
        dataIndex: dataIndex + sliceStartOffset(),
        seriesIndex: 0
      }
    };
  }
}
/** 雷达轴悬浮：返回该维度上全部可见系列的 tooltip 行 */
function radarAxisHover(axisIndex, indicators, series, options, theme) {
  const params = series.map((s, sIdx) => ({
    seriesName: s.name,
    name: indicators[axisIndex].name,
    value: s.data[axisIndex],
    color: s.color || theme.colors[(options.radarSeries || []).indexOf(s) % theme.colors.length],
    dataIndex: axisIndex,
    seriesIndex: sIdx
  }));
  return { index: axisIndex, params };
}
function setZoomRange(next) {
  const minSpan = INTERACTION.zoom.minSpan;
  let { start, end } = next;
  if (end - start < minSpan) {
    end = start + minSpan;
    if (end > 100) {
      end = 100;
      start = 100 - minSpan;
    }
  }
  zoomRange.value = { start: Math.max(0, start), end: Math.min(100, end) };
  emit("zoom", { ...zoomRange.value });
  const group = props.options.connectGroup;
  if (group) {
    const r = zoomRange.value;
    broadcastConnect(group, connectorSelf, (t) => t.setZoomRange(r.start, r.end));
  }
  redraw();
}
function getSliderGeo() {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const padding = getPadding(effectiveOptions.value, rect.width);
  const plotArea = {
    x: padding.left,
    y: padding.top,
    width: rect.width - padding.left - padding.right,
    height: rect.height - padding.top - padding.bottom
  };
  return getSliderGeometry(effectiveOptions.value, plotArea);
}
let pointerDownTime = 0;
let pointerDownX = 0;
let pointerDownY = 0;
let touchPanStartX = 0;
let touchPanStartRange = { start: 0, end: 100 };
let touchPanning = false;
function handleClickCore(clientX, clientY) {
  const feature = checkToolboxHit(clientX, clientY);
  if (feature) {
    runToolboxFeature(feature);
    return;
  }
  const legendName = checkLegendHit(clientX, clientY);
  if (legendName) {
    if (LEGEND_INTERACTIVE_TYPES.includes(props.options.type) && props.options.legend?.interactive !== false) {
      const newSet = new Set(hiddenSeries.value);
      if (newSet.has(legendName)) {
        newSet.delete(legendName);
      } else {
        newSet.add(legendName);
      }
      hiddenSeries.value = newSet;
      emit("legend-click", legendName, newSet.has(legendName));
      const group = props.options.connectGroup;
      if (group) broadcastConnect(group, connectorSelf, (t) => t.toggleSeries(legendName, newSet.has(legendName)));
      render(true);
    }
    return;
  }
  const result = getHoveredData(clientX, clientY);
  if (result) {
    const params = Array.isArray(result.params) ? result.params[0] : result.params;
    emit("click", params);
    if (props.options.tooltip?.trigger === "click" && props.options.tooltip?.show !== false) {
      applyTooltipContent(result.params);
      lastMouseClientX = clientX;
      lastMouseClientY = clientY;
      if (tooltipRafId === null) {
        tooltipRafId = requestAnimationFrame(() => {
          tooltipRafId = null;
          updateTooltipPosition(lastMouseClientX, lastMouseClientY);
        });
      }
      tooltipVisible.value = true;
    }
  } else if (props.options.tooltip?.trigger === "click") {
    tooltipVisible.value = false;
  }
}
function handlePointerDown(e) {
  pointerDownTime = performance.now();
  pointerDownX = e.clientX;
  pointerDownY = e.clientY;
  if (e.pointerType === "touch" && isZoomEnabled() && props.options.brush?.enabled !== true) {
    const canvas = canvasRef.value;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const padding = getPadding(effectiveOptions.value, rect.width);
      const inPlot = x >= padding.left && x <= padding.left + (rect.width - padding.left - padding.right) && y >= padding.top && y <= padding.top + (rect.height - padding.top - padding.bottom);
      if (inPlot) {
        touchPanning = true;
        touchPanStartX = x;
        touchPanStartRange = { ...zoomRange.value };
      }
    }
  }
  if (e.pointerType === "touch") {
    showTooltipAt(e.clientX, e.clientY);
  }
  if (touchPanning) {
    e.preventDefault();
    return;
  }
  handleZoomMouseDown(e);
}
function handleZoomMouseDown(e) {
  if (!isZoomEnabled() && props.options.brush?.enabled !== true) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (props.options.brush?.enabled === true) {
    const padding = getPadding(effectiveOptions.value, rect.width);
    const plotArea = {
      x: padding.left,
      y: padding.top,
      width: rect.width - padding.left - padding.right,
      height: rect.height - padding.top - padding.bottom
    };
    if (x >= plotArea.x && x <= plotArea.x + plotArea.width && y >= plotArea.y && y <= plotArea.y + plotArea.height) {
      dragMode = "brush";
      brushDragged = false;
      dragStartX = x;
      dragStartY = y;
      brushRect.value = { x1: x, y1: y, x2: x, y2: y };
      e.preventDefault();
      return;
    }
  }
  if (!isZoomEnabled()) return;
  const geo = getSliderGeo();
  if (!geo) return;
  const handleW = 10;
  const { xStart, xEnd } = windowToX(zoomRange.value, geo);
  const withinY = y >= geo.y && y <= geo.y + geo.height;
  if (withinY && x >= xStart - handleW && x <= xStart + handleW) {
    dragMode = "handle-left";
  } else if (withinY && x >= xEnd - handleW && x <= xEnd + handleW) {
    dragMode = "handle-right";
  } else if (withinY && x >= xStart && x <= xEnd) {
    dragMode = "window";
    dragStartX = x;
    dragStartRange = { ...zoomRange.value };
  } else if (withinY && x >= geo.x && x <= geo.x + geo.width) {
    const center = xToPercent(x, geo);
    const span = zoomRange.value.end - zoomRange.value.start;
    setZoomRange({ start: center - span / 2, end: center + span / 2 });
    dragMode = "window";
    dragStartX = x;
    dragStartRange = { ...zoomRange.value };
  }
  if (dragMode !== "none") {
    e.preventDefault();
  }
}
function handleMouseMoveDrag(x, y) {
  if (dragMode === "brush") {
    if (!brushDragged && (Math.abs(x - dragStartX) > 3 || Math.abs(y - dragStartY) > 3)) {
      brushDragged = true;
    }
    if (brushDragged) {
      brushRect.value = { x1: dragStartX, y1: dragStartY, x2: x, y2: y };
      redraw();
    }
    return;
  }
  const geo = getSliderGeo();
  if (!geo) return;
  if (dragMode === "handle-left") {
    setZoomRange({ start: Math.min(xToPercent(x, geo), zoomRange.value.end - 2), end: zoomRange.value.end });
  } else if (dragMode === "handle-right") {
    setZoomRange({ start: zoomRange.value.start, end: Math.max(xToPercent(x, geo), zoomRange.value.start + 2) });
  } else if (dragMode === "window") {
    const dxPercent = (x - dragStartX) / geo.width * 100;
    const span = dragStartRange.end - dragStartRange.start;
    let start = dragStartRange.start + dxPercent;
    if (start < 0) start = 0;
    if (start + span > 100) start = 100 - span;
    setZoomRange({ start, end: start + span });
  }
}
function handlePointerUp(e) {
  const moved = Math.abs(e.clientX - pointerDownX) > 8 || Math.abs(e.clientY - pointerDownY) > 8;
  const longPress = performance.now() - pointerDownTime > 500;
  if (touchPanning) {
    touchPanning = false;
  }
  if (dragMode === "brush") {
    if (brushDragged && brushRect.value) {
      const r = brushRect.value;
      const canvas = canvasRef.value;
      const options = effectiveOptions.value;
      const labels = options.labels || [];
      if (canvas && labels.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const padding = getPadding(options, rect.width);
        const plotArea = {
          x: padding.left,
          y: padding.top,
          width: rect.width - padding.left - padding.right,
          height: rect.height - padding.top - padding.bottom
        };
        const offset = sliceStartOffset();
        let startIdx = xToCategoryIndex(options, plotArea, labels, Math.min(r.x1, r.x2));
        let endIdx = xToCategoryIndex(options, plotArea, labels, Math.max(r.x1, r.x2));
        startIdx = Math.max(0, Math.min(labels.length - 1, startIdx));
        endIdx = Math.max(0, Math.min(labels.length - 1, endIdx));
        emit("brush-select", { startIndex: startIdx + offset, endIndex: endIdx + offset });
      }
      suppressClick = true;
    }
    brushRect.value = null;
    redraw();
  }
  dragMode = "none";
  if (e.pointerType === "touch" && !moved && !longPress) {
    handleClickCore(e.clientX, e.clientY);
  } else if (e.pointerType === "mouse") {
    if (!suppressClick && !moved) handleClickCore(e.clientX, e.clientY);
    suppressClick = false;
  }
}
function handleDblClick() {
  if (isZoomEnabled()) {
    setZoomRange({ start: 0, end: 100 });
  }
}
function handleWheel(e) {
  const zoom = getDataZoomConfig(props.options);
  if (!zoom || zoom.mouseWheel === false) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const padding = getPadding(effectiveOptions.value, rect.width);
  const plotArea = {
    x: padding.left,
    y: padding.top,
    width: rect.width - padding.left - padding.right,
    height: rect.height - padding.top - padding.bottom
  };
  if (x < plotArea.x || x > plotArea.x + plotArea.width || y < plotArea.y || y > plotArea.y + plotArea.height) return;
  e.preventDefault();
  const anchor = (x - plotArea.x) / plotArea.width * 100;
  setZoomRange(applyWheelZoom(zoomRange.value, anchor, e.deltaY));
}
function showTooltipAt(clientX, clientY) {
  tooltipVisible.value = false;
  if (props.options.tooltip?.show === false) return;
  const result = getHoveredData(clientX, clientY);
  if (!result) return;
  hoverIndex = result.index;
  applyTooltipContent(result.params);
  lastMouseClientX = clientX;
  lastMouseClientY = clientY;
  if (tooltipRafId === null) {
    tooltipRafId = requestAnimationFrame(() => {
      tooltipRafId = null;
      updateTooltipPosition(lastMouseClientX, lastMouseClientY);
    });
  }
  tooltipVisible.value = true;
  redraw();
}
function handlePointerMove(e) {
  const canvas = canvasRef.value;
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }
  updateCursor(e);
  if (touchPanning && e.pointerType === "touch" && isZoomEnabled()) {
    const geo = getSliderGeo();
    if (geo) {
      const dxPercent = (mouseX - touchPanStartX) / geo.width * 100;
      const span = touchPanStartRange.end - touchPanStartRange.start;
      let start = touchPanStartRange.start - dxPercent;
      if (start < 0) start = 0;
      if (start + span > 100) start = 100 - span;
      setZoomRange({ start, end: start + span });
    }
    return;
  }
  if (dragMode !== "none") {
    const rect = canvas?.getBoundingClientRect();
    if (rect) {
      handleMouseMoveDrag(e.clientX - rect.left, e.clientY - rect.top);
    }
    return;
  }
  const feature = checkToolboxHit(e.clientX, e.clientY);
  if (feature !== hoveredToolbox.value) {
    hoveredToolbox.value = feature;
    redraw();
  }
  const legendName = checkLegendHit(e.clientX, e.clientY);
  if (emphasisSeriesName.value) {
    // 显式 emphasis 生效期间，图例悬浮不得抢占或清除焦点
  } else {
    const hoverEmphasis = props.options.legend?.hoverEmphasis !== false;
    const nextFocus = hoverEmphasis && legendName ? legendName : null;
    if (nextFocus !== focusSeries.value) {
      focusSeries.value = nextFocus;
      animateFocusProgress();
    }
  }
  if (legendName) {
    clearHover();
    tooltipVisible.value = false;
    return;
  }
  if (e.pointerType === "touch") return;
  const result = getHoveredData(e.clientX, e.clientY);
  const enterAnimated = animatesHoverEnter();
  if (result && props.options.tooltip?.show !== false) {
    const newIndex = result.index;
    if (newIndex !== hoverIndex) {
      const prevIndex = hoverIndex;
      hoverIndex = newIndex;
      if (enterAnimated) {
        if (prevIndex === -1) {
          startHoverAnimation(1);
        } else {
          stopHoverAnimation();
          hoverAnimProgress = 0.35;
          startHoverAnimation(1);
        }
      } else if (usesHoverAnimation()) {
        // 层级图切换焦段不重播淡化：直接停在终值，避免每次移动都闪一下
        stopHoverAnimation();
        hoverAnimProgress = 1;
        redraw();
      } else {
        redraw();
      }
      if (prevIndex === -1) {
        const emitParams = Array.isArray(result.params) ? result.params[0] : result.params;
        emit("hover", {
          seriesName: emitParams.seriesName,
          dataIndex: emitParams.dataIndex,
          value: emitParams.value,
          x: emitParams.x ?? e.clientX,
          y: emitParams.y ?? e.clientY,
          color: emitParams.color
        });
        ariaLiveText.value = `${emitParams.seriesName}: ${formatTooltipValue(emitParams.value)}`;
      }
    } else if (enterAnimated && hoverAnimProgress < 1) {
      // 出场动画进行中指针又回到了同一元素：掉头播入场
      startHoverAnimation(1);
    }
    applyTooltipContent(result.params);
    if (props.options.tooltip?.trigger === "click") return;
    lastMouseClientX = e.clientX;
    lastMouseClientY = e.clientY;
    if (tooltipRafId === null) {
      tooltipRafId = requestAnimationFrame(() => {
        tooltipRafId = null;
        updateTooltipPosition(lastMouseClientX, lastMouseClientY);
      });
    }
    tooltipVisible.value = true;
  } else {
    if (clearHover()) {
      emit("unhover");
      ariaLiveText.value = "";
    }
    tooltipVisible.value = false;
  }
}
function formatTooltipValue(value) {
  if (value === null || value === void 0) return "-";
  if (Array.isArray(value)) {
    const fmtNum = (v) => {
      if (props.options.valueFormatter) return props.options.valueFormatter(v, props.options.valueFormat);
      const f = props.options.valueFormat;
      if (f) {
        const { decimals = 0 } = f;
        return v.toFixed(decimals);
      }
      return v.toString();
    };
    if (value.length === 5) {
      const [min, q1, med, q3, max] = value;
      return `\u6700\u5C0F ${fmtNum(min)}  Q1 ${fmtNum(q1)}  \u4E2D\u4F4D\u6570 ${fmtNum(med)}  Q3 ${fmtNum(q3)}  \u6700\u5927 ${fmtNum(max)}`;
    }
    const [open, close, high, low] = value;
    const i = i18n.value.tooltip;
    return `${i.open} ${fmtNum(open)}  ${i.close} ${fmtNum(close)}  ${i.high} ${fmtNum(high)}  ${i.low} ${fmtNum(low)}`;
  }
  if (props.options.valueFormatter) {
    return props.options.valueFormatter(value, props.options.valueFormat);
  }
  const fmt = props.options.valueFormat;
  if (fmt) {
    const { decimals = 0, thousandSeparator = ",", prefix = "", suffix = "" } = fmt;
    const fixed = value.toFixed(decimals);
    const formatted = thousandSeparator ? fixed.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator) : fixed;
    return prefix + formatted + suffix;
  }
  return Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(4)).toString();
}
// 默认模板整体走 v-html，类目名/系列名等用户数据必须转义后才能进 HTML；
// tooltip.formatter 的返回值是约定好的 HTML 出口（同 ECharts 语义），不做二次转义
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function applyTooltipContent(params) {
  const formatter = props.options.tooltip?.formatter;
  if (formatter) {
    tooltipContent.value = formatter(params);
    return;
  }
  if (Array.isArray(params)) {
    const title = params[0]?.name || "";
    // 空值行不渲染（DESIGN 交互规范 13.5）
    const rows = pickTooltipRows(params).map(
      (p) => `
      <div class="ev-chart__tooltip-item">
        <span class="ev-chart__tooltip-dot" style="background: ${escapeHtml(p.color)}"></span>
        <span class="ev-chart__tooltip-name">${escapeHtml(p.seriesName)}</span>
        <span class="ev-chart__tooltip-value">${escapeHtml(formatTooltipValue(p.value))}</span>
      </div>
    `
    ).join("");
    tooltipContent.value = `
      <div class="ev-chart__tooltip-title">${escapeHtml(title)}</div>
      ${rows}
    `;
  } else {
    const p = params;
    tooltipContent.value = `
      <div class="ev-chart__tooltip-title">${escapeHtml(p.name)}</div>
      <div class="ev-chart__tooltip-item">
        <span class="ev-chart__tooltip-dot" style="background: ${escapeHtml(p.color)}"></span>
        <span class="ev-chart__tooltip-name">${escapeHtml(p.seriesName)}</span>
        <span class="ev-chart__tooltip-value">${escapeHtml(formatTooltipValue(p.value))}</span>
      </div>
    `;
  }
}
// 光标语义（DESIGN 交互规范 13.1）：绘图区 crosshair、图例/工具箱 pointer、滑块 grab
function updateCursor(e) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  let zone = "other";
  if (dragMode === "handle-left" || dragMode === "handle-right" || dragMode === "window") {
    zone = "slider";
  } else if (dragMode === "brush") {
    zone = "plot";
  } else if (checkToolboxHit(e.clientX, e.clientY)) {
    zone = "toolbox";
  } else if (checkLegendHit(e.clientX, e.clientY)) {
    zone = "legend";
  } else {
    const padding = getPadding(effectiveOptions.value, rect.width);
    const inPlot =
      x >= padding.left && x <= rect.width - padding.right &&
      y >= padding.top && y <= rect.height - padding.bottom;
    if (inPlot) {
      zone = "plot";
    } else {
      const slider = getSliderGeo();
      if (slider && y >= slider.y && y <= slider.y + slider.height && x >= slider.x && x <= slider.x + slider.width) {
        zone = "slider";
      }
    }
  }
  const next = resolveCursor(zone, zone === "slider" && dragMode !== "none");
  if (next !== cursorStyle.value) cursorStyle.value = next;
}
function clearTransientState() {
  if (tooltipRafId !== null) {
    cancelAnimationFrame(tooltipRafId);
    tooltipRafId = null;
  }
  tooltipVisible.value = false;
  mouseX = -1;
  mouseY = -1;
  if (focusSeries.value !== null && !emphasisSeriesName.value) focusSeries.value = null;
  if (hoveredToolbox.value !== null) hoveredToolbox.value = null;
  if (dragMode === "brush") {
    brushRect.value = null;
    redraw();
  }
  dragMode = "none";
  cursorStyle.value = "default";
  return clearHover();
}
function handlePointerLeave() {
  if (clearTransientState()) {
    emit("unhover");
    ariaLiveText.value = "";
  }
}
// Esc 清态（DESIGN 交互规范 13.3）：清除悬浮 / tooltip / 框选拖拽
function handleEscapeKey(e) {
  if (e.key !== "Escape") return;
  if (clearTransientState()) {
    emit("unhover");
    ariaLiveText.value = "";
  }
}
let resizeObserver = null;
function setupResizeObserver() {
  if (!props.responsive) return;
  if (!containerRef.value) return;
  // jsdom 等无 ResizeObserver 环境降级跳过（Electron file:// 有）
  if (typeof ResizeObserver === "undefined") return;
  resizeObserver = new ResizeObserver(() => {
    debouncedRender(false);
  });
  resizeObserver.observe(containerRef.value);
}
function cleanupResizeObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
}
function setupDarkModeObserver() {
  lastIsDark = document.documentElement.classList.contains("dark");
  darkModeObserver = new MutationObserver(() => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark !== lastIsDark) {
      lastIsDark = isDark;
      redraw();
    }
  });
  darkModeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"]
  });
  // 运行时换肤派发的全局事件 — 图表重绘以拾取新令牌
  document.addEventListener("ev-theme-change", handleThemeChange);
}
function handleThemeChange() {
  redraw();
}
function cleanupDarkModeObserver() {
  if (darkModeObserver) {
    darkModeObserver.disconnect();
    darkModeObserver = null;
  }
  document.removeEventListener("ev-theme-change", handleThemeChange);
}
function cloneOptionsSnapshot(opt) {
  return {
    ...opt,
    labels: [...opt.labels || []],
    series: (opt.series || []).map((s) => ({ ...s, data: [...(s.data || [])] }))
  };
}
function cloneSpec(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(cloneSpec);
  const out = {};
  Object.keys(value).forEach((k) => {
    out[k] = cloneSpec(value[k]);
  });
  return out;
}
// dev 模式下对 options 做轻量校验，非法配置去重告警（不阻断渲染）
const IS_DEV = typeof import.meta !== "undefined" && !!import.meta.env?.DEV;
const devWarned = new Set();
function runDevValidation() {
  if (!IS_DEV) return;
  const { warnings } = validateOptions(props.options);
  warnings.slice(0, 8).forEach((w) => {
    const key = `${w.path}:${w.message}`;
    if (devWarned.has(key)) return;
    devWarned.add(key);
    console.warn(`[EvChart] ${w.path} ${w.message}`);
  });
}
let prevOptionsSnapshot = null;
watch(
  () => props.options,
  (next) => {
    cachedDataExtent = null;
    cachedPlotArea = null;
    internalError.value = null;
    runDevValidation();
    // 运行中通过 options 增删 emphasis 时补播淡化缓动（无变化不重绘）
    if (focusSeries.value !== emphasisSeriesName.value) {
      focusSeries.value = emphasisSeriesName.value;
      animateFocusProgress();
    }
    syncScenes();
    const zoom = getDataZoomConfig(props.options);
    const zoomKey = zoom ? JSON.stringify({ e: zoom.enabled, s: zoom.start, e2: zoom.end, p: zoom.position, h: zoom.height }) : "";
    if (zoomKey !== lastZoomKey) {
      lastZoomKey = zoomKey;
      zoomRange.value = { start: zoom?.start ?? 0, end: zoom?.end ?? 100 };
    }
    const before = prevOptionsSnapshot;
    prevOptionsSnapshot = cloneOptionsSnapshot(next);
    if (before && startTweenIfNeeded(before)) return;
    debouncedRender(true);
  },
  { deep: true }
);
watch(
  () => [props.width, props.height],
  () => {
    cachedPlotArea = null;
    nextTick(() => debouncedRender(false));
  }
);
watch(
  () => props.options.loading,
  () => {
    internalError.value = null;
    if (!props.options.loading) {
      debouncedRender(false);
    }
  }
);
function onWindowPointerUp(e) {
  if (dragMode !== "none" || touchPanning) handlePointerUp(e);
}
const connectorSelf = {
  setZoomRange(start, end) {
    if (!isZoomEnabled()) return;
    if (zoomRange.value.start === start && zoomRange.value.end === end) return;
    zoomRange.value = { start, end };
    redraw();
  },
  toggleSeries(name, hidden) {
    const newSet = new Set(hiddenSeries.value);
    if (hidden) newSet.add(name);
    else newSet.delete(name);
    if (newSet.size === hiddenSeries.value.size) return;
    hiddenSeries.value = newSet;
    render(true);
  }
};
let unregisterConnector = null;
onMounted(() => {
  // options.emphasis 挂载即生效（watch 非 immediate，首帧前手动对齐一次）
  focusSeries.value = emphasisSeriesName.value;
  render(true);
  syncScenes();
  setupResizeObserver();
  setupDarkModeObserver();
  window.addEventListener("pointerup", onWindowPointerUp);
  window.addEventListener("keydown", handleEscapeKey);
  containerRef.value?.addEventListener("wheel", handleWheel, { passive: false });
  const group = props.options.connectGroup;
  if (group) unregisterConnector = registerConnector(group, connectorSelf);
});
onUnmounted(() => {
  cleanupResizeObserver();
  cleanupDarkModeObserver();
  window.removeEventListener("pointerup", onWindowPointerUp);
  window.removeEventListener("keydown", handleEscapeKey);
  containerRef.value?.removeEventListener("wheel", handleWheel);
  if (unregisterConnector) {
    unregisterConnector();
    unregisterConnector = null;
  }
  stopAnimation();
  stopHoverAnimation();
  stopTweenAnimation();
  stopSceneTimer();
  stopFocusAnimation();
  if (tooltipRafId !== null) {
    cancelAnimationFrame(tooltipRafId);
    tooltipRafId = null;
  }
  if (renderTimer) clearTimeout(renderTimer);
});
let cachedDataExtent = null;
let cachedPlotArea = null;
defineExpose({
  refresh: () => render(true),
  update(newOptions) {
    Object.assign(props.options, newOptions);
    cachedDataExtent = null;
    specVersion.value++;
    debouncedRender(true);
  },
  toDataURL(type = "image/png", quality = 1) {
    return canvasRef.value?.toDataURL(type, quality) || "";
  },
  destroy() {
    // 清理面与 onUnmounted 保持一致：window 监听、连接组、全部 rAF/timer
    cleanupResizeObserver();
    cleanupDarkModeObserver();
    window.removeEventListener("pointerup", onWindowPointerUp);
    window.removeEventListener("keydown", handleEscapeKey);
    containerRef.value?.removeEventListener("wheel", handleWheel);
    if (unregisterConnector) {
      unregisterConnector();
      unregisterConnector = null;
    }
    stopAnimation();
    stopHoverAnimation();
    stopTweenAnimation();
    stopSceneTimer();
    stopFocusAnimation();
    if (tooltipRafId !== null) {
      cancelAnimationFrame(tooltipRafId);
      tooltipRafId = null;
    }
    if (renderTimer) clearTimeout(renderTimer);
  },
  getCanvas() {
    return canvasRef.value;
  },
  toggleSeries(name) {
    const newSet = new Set(hiddenSeries.value);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    hiddenSeries.value = newSet;
    render(true);
  },
  getHiddenSeries() {
    return Array.from(hiddenSeries.value);
  },
  // @since v0.1 — 手动触发尺寸更新
  resize() {
    lastWidth = 0;
    lastHeight = 0;
    debouncedRender(false);
  },
  // @since v0.1 — 高亮某个系列（通过给该系列添加特殊样式）
  highlightSeries(name) {
    const opt = props.options;
    if (opt.series.length > 0) {
      const newSet = /* @__PURE__ */ new Set();
      opt.series.forEach((s) => {
        if (s.name !== name) newSet.add(s.name);
      });
      hiddenSeries.value = newSet;
      render(true);
    }
  },
  // @since v0.1 — 清除系列高亮
  clearHighlight() {
    hiddenSeries.value = /* @__PURE__ */ new Set();
    render(true);
  },
  // @since v0.1 — 获取数据极值
  getDataExtent() {
    if (cachedDataExtent) return cachedDataExtent;
    const opt = props.options;
    let min = Infinity;
    let max = -Infinity;
    const consider = (v) => {
      if (v < min) min = v;
      if (v > max) max = v;
    };
    if (opt.series) {
      opt.series.forEach((s) => s.data.forEach((v) => !isMissingValue(v) && consider(v)));
    }
    if (opt.scatterData) {
      opt.scatterData.forEach((p) => consider(p.y));
    }
    if (opt.candleData) {
      opt.candleData.forEach((c) => {
        consider(c.high);
        consider(c.low);
      });
    }
    if (min === Infinity) {
      min = 0;
      max = 0;
    }
    cachedDataExtent = { min, max };
    return cachedDataExtent;
  },
  // @since v0.1 — 获取实际绘图区域（基于当前 canvas 尺寸与 padding）
  getPlotArea() {
    if (cachedPlotArea) return cachedPlotArea;
    const canvas = canvasRef.value;
    if (!canvas) return { x: 0, y: 0, width: 0, height: 0 };
    const width = canvas.width / dpr.value;
    const height = canvas.height / dpr.value;
    const padding = getPadding(effectiveOptions.value, width);
    cachedPlotArea = {
      x: padding.left,
      y: padding.top,
      width: width - padding.left - padding.right,
      height: height - padding.top - padding.bottom
    };
    return cachedPlotArea;
  },
  // @since v0.1 — 运行时切换主题
  setTheme(theme) {
    props.options.theme = { ...props.options.theme, ...theme };
    specVersion.value++;
    redraw();
  },
  // @since v0.1 — 导出真 SVG（录制渲染指令重放，非 PNG 嵌入）
  exportSVG(options = {}) {
    const canvas = canvasRef.value;
    if (!canvas) return "";
    const { backgroundColor, includeLegend = true } = options;
    const isDark = document.documentElement.classList.contains("dark");
    const bg = backgroundColor || getTheme(isDark, props.options.theme).backgroundColor;
    const width = options.width || canvas.width / dpr.value;
    const height = options.height || canvas.height / dpr.value;
    try {
      const real = canvas.getContext("2d");
      const recorder = createSvgRecorder(real);
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = Math.round(width);
      exportCanvas.height = Math.round(height);
      const exportOptions = includeLegend ? effectiveOptions.value : { ...effectiveOptions.value, legend: { ...effectiveOptions.value.legend, show: false } };
      renderChart(exportCanvas, {
        ...buildRenderParams(1, exportOptions),
        ctx: recorder.ctx,
        dpr: 1,
        hoverIndex: -1,
        mouseX: -1,
        mouseY: -1,
        showCrosshair: false,
        brushRect: null,
        hoveredToolbox: null,
        focusSeries: null
      });
      return recorder.toSvg(Math.round(width), Math.round(height), bg);
    } catch (err) {
      handleRenderError(err);
      return "";
    }
  },
  // @since v0.1 — 获取当前 options
  getOption() {
    return props.options;
  },
  // 获取当前 Spec 的深拷贝（可安全存储 / diff / 回传 setSpec；函数字段按引用保留）
  getSpec() {
    return cloneSpec(props.options);
  },
  // 整体替换 Spec：清掉旧键与交互状态后重绘（区别于 update 的增量合并）
  setSpec(spec) {
    if (spec === null || typeof spec !== "object") return;
    const next = cloneSpec(spec);
    Object.keys(props.options).forEach((k) => delete props.options[k]);
    Object.assign(props.options, next);
    hiddenSeries.value = new Set();
    focusSeries.value = null;
    brushRect.value = null;
    hoverIndex = -1;
    mouseX = -1;
    mouseY = -1;
    stopSceneTimer();
    sceneIndex.value = 0;
    sceneAnimOverride = null;
    const zoom = getDataZoomConfig(next);
    zoomRange.value = { start: zoom?.start ?? 0, end: zoom?.end ?? 100 };
    lastZoomKey = zoom ? JSON.stringify({ e: zoom.enabled, s: zoom.start, e2: zoom.end, p: zoom.position, h: zoom.height }) : "";
    cachedDataExtent = null;
    cachedPlotArea = null;
    // options 可能是非响应式普通对象（computed 无依赖会永久缓存旧值）：
    // 版本号失效 + 显式重绘双兜底
    specVersion.value++;
    debouncedRender(true);
  },
  // ─── scenes 编排 ───
  nextScene() {
    applyScene(sceneIndex.value + 1);
  },
  prevScene() {
    applyScene(sceneIndex.value - 1);
  },
  gotoScene(i) {
    applyScene(i);
  },
  getSceneIndex() {
    return sceneIndex.value;
  },
  // 当前实际生效的 Spec（含缩放切片与场景补丁；剔除 __ 内部键）
  getEffectiveSpec() {
    const spec = cloneSpec(effectiveOptions.value);
    Object.keys(spec).forEach((k) => {
      if (k.startsWith("__")) delete spec[k];
    });
    return spec;
  },
  // @since v0.1 — data zoom 范围
  setDataZoomRange(start, end) {
    if (!isZoomEnabled()) {
      console.warn("[EvChart] setDataZoomRange: dataZoom is not enabled");
      return;
    }
    setZoomRange({ start, end });
  },
  getDataZoomRange() {
    if (!isZoomEnabled()) return null;
    return { ...zoomRange.value };
  }
});

</script>

<style scoped>
.ev-chart {
  position: relative;
  /* 容器不带边框：是否加框、加多粗由宿主决定，图表只负责内容；
     圆角裁剪下沉到 canvas 与浮层自身（border-radius: inherit） */
  overflow: visible;
  border-radius: 8px;
  background: var(--ev-bg-color, #ffffff);
}

/* 关键：canvas 必须能接收鼠标事件 */
.ev-chart__canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  border-radius: inherit;
  /* 触摸：纵向留给页面滚动，横向拖拽由图表接管（dataZoom 平移） */
  touch-action: pan-y;
}

/* HTML 覆盖层：只在内容层，不与 canvas 抢交互（子元素可自行 pointer-events:auto），
   也不压过 tooltip（z-index 100） */
.ev-chart__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
}

.ev-chart__tooltip {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  padding: 9px 12px;
  background: var(--ev-bg-color-overlay, #ffffff);
  border: 1px solid var(--ev-border-color, #e2e8f0);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
  font-size: 13px;
  line-height: 1.6;
  white-space: nowrap;
  /* 定位由 left/top 精确计算（含水平 clamp 与垂直翻转） */
  /* 位置变化平滑过渡：鼠标停下后 tooltip 滑过去，而非实时紧跟（时长曲线见 interactions.js） */
  cursor: default;
  transition: var(--ev-tooltip-pos-transition);
  will-change: left, top;
}

/* tooltip 淡入淡出（仅 opacity，位置由 left/top transition 负责） */
.ev-chart-tooltip-enter-active,
.ev-chart-tooltip-leave-active {
  transition: var(--ev-tooltip-fade-transition);
}

/* 进入期间禁用位置 transition，避免首次出现时从旧位置滑入 */
.ev-chart-tooltip-enter-active {
  transition:
    var(--ev-tooltip-fade-transition),
    left 0s,
    top 0s;
}

.ev-chart-tooltip-enter-from,
.ev-chart-tooltip-leave-to {
  opacity: 0;
}

/* v-html 注入的内容不带 scoped 属性，需用 :deep() 穿透 */
:deep(.ev-chart__tooltip-title) {
  color: var(--ev-text-color-secondary, #6b7280);
  font-size: 12px;
  margin-bottom: 6px;
  font-weight: 500;
}

:deep(.ev-chart__tooltip-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

:deep(.ev-chart__tooltip-dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

:deep(.ev-chart__tooltip-name) {
  color: var(--ev-text-color-primary, #111827);
}

:deep(.ev-chart__tooltip-value) {
  color: var(--ev-text-color-primary, #111827);
  font-weight: 600;
  margin-left: auto;
  padding-left: 12px;
  font-variant-numeric: tabular-nums;
}

/* ══════ 空数据占位 ══════ */
.ev-chart__empty {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--ev-text-color-secondary, #9ca3af);
  font-size: 13px;
  gap: 14px;
  user-select: none;
}

.ev-chart__empty-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--ev-fill-color-light, #f5f7fa);
}

.ev-chart__empty-img {
  width: 32px;
  height: 32px;
  opacity: 0.4;
}

.ev-chart__empty-text {
  letter-spacing: 0.04em;
  font-weight: 500;
  font-size: 13px;
}

/* ══════ 加载中骨架 ══════ */
.ev-chart__loading {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ev-bg-color, #ffffff);
}

.ev-chart__loading-bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 60px;
}

.ev-chart__loading-bar {
  width: 10px;
  height: 40px;
  border-radius: 4px;
  background: var(--ev-border-color, #e2e8f0);
  animation: ev-chart-shimmer 1.2s ease-in-out infinite;
}

@keyframes ev-chart-shimmer {
  0%,
  100% {
    transform: scaleY(0.4);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* ══════ 错误边界 ══════ */
.ev-chart__error {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--ev-text-color-danger, #dc2626);
  background: var(--ev-bg-color, #ffffff);
  gap: 8px;
  padding: 20px;
  text-align: center;
}

.ev-chart__error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}

.ev-chart__error-text {
  font-size: 12px;
  line-height: 1.5;
  max-width: 80%;
  word-break: break-word;
}

/* ══════ 进入/离开淡入淡出 ══════ */
.ev-chart-fade-enter-active,
.ev-chart-fade-leave-active {
  transition: opacity 0.2s ease;
}

.ev-chart-fade-enter-from,
.ev-chart-fade-leave-to {
  opacity: 0;
}

/* ══════ 无障碍：sr-only ══════ */
.ev-chart__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
<style>
html.dark .ev-chart__tooltip {
  background: var(--ev-bg-color-overlay, #1f2937);
  border-color: var(--ev-border-color-dark, #374151);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  color: var(--ev-text-color-primary, #f3f4f6);
}

html.dark .ev-chart__loading {
  background: var(--ev-bg-color, #111827);
}

html.dark .ev-chart__loading-bar {
  background: var(--ev-border-color-dark, #374151);
}

html.dark .ev-chart__empty {
  color: var(--ev-text-color-secondary, #6b7280);
}

html.dark .ev-chart__empty-icon-wrap {
  background: var(--ev-fill-color-dark, #1f2937);
}

html.dark .ev-chart__error {
  background: var(--ev-bg-color, #111827);
  color: var(--ev-color-danger-light-3, #f87171);
}
</style>
