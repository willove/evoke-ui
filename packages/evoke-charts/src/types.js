// 涨跌语义色：K 线 / 量带 / 瀑布 / 涨跌结论共用默认值，
// 可被 candleUpColor / candleDownColor、waterfall.increaseColor 等配置覆写
const UP_COLOR = "#dc2626";
const DOWN_COLOR = "#16a34a";
// K 线量副图在图例中的系列名（点选该名隐去量带的隐藏键，渲染与图例共用）
const VOLUME_SERIES_NAME = "\u6210\u4EA4\u91CF";

const DEFAULT_I18N_ZH = {
  tooltip: {
    open: "\u5F00",
    close: "\u6536",
    high: "\u9AD8",
    low: "\u4F4E",
    total: "\u603B\u8BA1",
    average: "\u5E73\u5747"
  },
  legend: {
    show: "\u663E\u793A",
    hide: "\u9690\u85CF"
  },
  noData: "\u6682\u65E0\u6570\u636E"
};
const DEFAULT_I18N_EN = {
  tooltip: {
    open: "Open",
    close: "Close",
    high: "High",
    low: "Low",
    total: "Total",
    average: "Avg"
  },
  legend: {
    show: "Show",
    hide: "Hide"
  },
  noData: "No Data"
};

/**
 * 系列色令牌槽位 — 每槽按顺序尝试读取专用数据色令牌（--ev-color-series-N），
 * 槽 1 回退 --ev-color-primary（品牌主色跟随）；
 * 任一槽无令牌时该槽回落内置成套色板（与语义状态色解耦的数据色板）。
 * CHART_COLORS 仅作为 SSR / 无 DOM 环境的静态兜底。
 */
const SERIES_COLOR_SLOTS = [
  ["--ev-color-series-1", "--ev-color-primary"],
  ["--ev-color-series-2"],
  ["--ev-color-series-3"],
  ["--ev-color-series-4"],
  ["--ev-color-series-5"],
  ["--ev-color-series-6"],
  ["--ev-color-series-7"],
  ["--ev-color-series-8"]
];
function readChartToken(name, fallback) {
  try {
    if (typeof document === "undefined") return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch (e) {
    return fallback;
  }
}
function getSeriesColors(fallbackColors) {
  return SERIES_COLOR_SLOTS.map((tokens, i) => {
    for (const t of tokens) {
      const v = readChartToken(t, "");
      if (v) return v;
    }
    return fallbackColors[i];
  });
}
const CHART_COLORS = {
  /**
   * 主色板 — 品牌蓝锚定的成套数据色板（与语义状态色解耦）：
   * 色相按取色顺序相邻差 ≥ 30°，明度带 44–68，青绿/金黄/天蓝/珊瑚/紫/石板
   * 取材 AntV 经典系并经品牌蓝调协调；暗色板同色相提亮。
   */
  primary: [
    "#175DFF",
    // 蓝（品牌主色）
    "#5AD8A6",
    // 青绿
    "#F6BD16",
    // 金黄
    "#6DC8EC",
    // 天蓝
    "#E8684A",
    // 珊瑚红
    "#9270CA",
    // 紫
    "#FF9D4D",
    // 橙
    "#5D7092"
    // 石板灰蓝（中性槽）
  ],
  /** 浅色系列 — primary 的 light-9/light-8/light-7 阶梯 */
  light: ["#e8f0ff", "#d0e1ff", "#b9d2ff"],
  /** 暗色模式系列 — 同色相提亮（对齐 evoke 暗色主色） */
  dark: [
    "#4d8bff",
    // 蓝（暗色）
    "#5ad8a6",
    // 青绿
    "#f6bd16",
    // 金黄
    "#6dc8ec",
    // 天蓝
    "#f08568",
    // 珊瑚红（暗色提亮）
    "#a585e8",
    // 紫（暗色）
    "#ff9d4d",
    // 橙
    "#8da3bf"
    // 石板灰蓝（暗色）
  ],
  /** 热力图默认色阶（天亮蓝由浅到深） */
  heatmapScale: ["#f0f5ff", "#c6d9ff", "#8ab0ff", "#4d86ff", "#175DFF", "#0040c2"]
};
function isPieChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return ["pie", "doughnut", "rose"].includes(opt.type);
}
function isRadarChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "radar";
}
function isFunnelChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "funnel";
}
function isGaugeChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "gauge";
}
function isCandleChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "candle";
}
function isHeatmapChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "heatmap";
}
function isBinChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "bin";
}
function isBulletChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "bullet";
}
function isTreemapChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "treemap";
}
function isSparklineChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "sparkline";
}
function isCartesianChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return ["line", "bar", "area", "stacked-bar", "horizontal-bar", "scatter", "waterfall", "mixed"].includes(
    opt.type
  );
}
function isBoxplotChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "boxplot";
}
function isSunburstChartOptions(opt) {
  if (typeof opt !== "object" || opt === null) return false;
  return opt.type === "sunburst";
}
function createLineChart(labels, series, opts) {
  return { type: "line", labels, series, ...opts };
}
function createBarChart(labels, series, opts) {
  return { type: "bar", labels, series, ...opts };
}
function createPieChart(data, opts) {
  return { pieData: data, type: "pie", ...opts };
}
function createDoughnutChart(data, opts) {
  return { pieData: data, type: "doughnut", ...opts };
}
function createScatterChart(data, opts) {
  return { type: "scatter", labels: [], series: [], scatterData: data, ...opts };
}
function createRadarChart(indicators, series, opts) {
  return { type: "radar", labels: [], series: [], radarIndicators: indicators, radarSeries: series, ...opts };
}
function formatValue(value, options) {
  if (value === null || value === void 0 || Number.isNaN(value)) return "-";
  const { decimals = 0, thousandSeparator = ",", prefix = "", suffix = "", abbreviate = false } = options || {};
  let formatted;
  if (abbreviate) {
    const abs = Math.abs(value);
    if (abs >= 1e8) {
      formatted = (value / 1e8).toFixed(2) + "\u4EBF";
    } else if (abs >= 1e4) {
      formatted = (value / 1e4).toFixed(2) + "\u4E07";
    } else if (abs >= 1e3) {
      formatted = (value / 1e3).toFixed(2) + "K";
    } else {
      formatted = value.toFixed(decimals);
    }
  } else {
    const fixed = value.toFixed(decimals);
    if (thousandSeparator && decimals === 0) {
      formatted = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    } else if (thousandSeparator) {
      const [intPart, decPart] = fixed.split(".");
      formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator) + (decPart ? "." + decPart : "");
    } else {
      formatted = fixed;
    }
  }
  return prefix + formatted + suffix;
}
export {
  CHART_COLORS,
  SERIES_COLOR_SLOTS,
  UP_COLOR,
  DOWN_COLOR,
  VOLUME_SERIES_NAME,
  getSeriesColors,
  readChartToken,
  DEFAULT_I18N_EN,
  DEFAULT_I18N_ZH,
  createBarChart,
  createDoughnutChart,
  createLineChart,
  createPieChart,
  createRadarChart,
  createScatterChart,
  formatValue,
  isBinChartOptions,
  isBoxplotChartOptions,
  isBulletChartOptions,
  isCandleChartOptions,
  isCartesianChartOptions,
  isFunnelChartOptions,
  isGaugeChartOptions,
  isHeatmapChartOptions,
  isPieChartOptions,
  isRadarChartOptions,
  isSparklineChartOptions,
  isSunburstChartOptions,
  isTreemapChartOptions
};
