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
 * 系列色令牌表 — 图表分类色板从 CSS 令牌实时读取（换主题/暗色即跟随），
 * CHART_COLORS 仅作为 SSR / 无 DOM 环境的静态兜底。
 */
const SERIES_COLOR_TOKENS = [
  "--ev-color-primary",
  "--ev-color-success",
  "--ev-color-warning",
  "--ev-color-ext-violet",
  "--ev-color-ext-cyan",
  "--ev-color-danger",
  "--ev-color-ext-magenta",
  "--ev-color-info"
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
  const live = SERIES_COLOR_TOKENS.map((t) => readChartToken(t, ""));
  const missing = live.some((v) => !v);
  return missing ? [...fallbackColors] : live;
}
const CHART_COLORS = {
  /**
   * 主色板 — 对齐 evoke 设计令牌：
   * 前位使用功能色（primary/success/warning/danger/info），
   * 扩展色选取与深蓝体系协调的色相；相邻色相拉开对比度。
   */
  primary: [
    "#175DFF",
    // primary 天亮蓝
    "#16a34a",
    // success 翠绿
    "#d97706",
    // warning 琥珀
    "#8b5cf6",
    // 紫罗兰（扩展）
    "#0891b2",
    // 青（扩展）
    "#dc2626",
    // danger 红
    "#db2777",
    // 玫红（扩展）
    "#64748b"
    // info 石板灰
  ],
  /** 浅色系列 — primary 的 light-9/light-8/light-7 阶梯 */
  light: ["#e8f0ff", "#d0e1ff", "#b9d2ff"],
  /** 暗色模式系列 — 对齐 evoke 暗色功能色令牌 */
  dark: [
    "#4d8bff",
    // primary（暗色）
    "#4ade80",
    // success（暗色）
    "#fbbf24",
    // warning（暗色）
    "#a78bfa",
    // 紫罗兰（暗色）
    "#22d3ee",
    // 青（暗色）
    "#f87171",
    // danger（暗色）
    "#f472b6",
    // 玫红（暗色）
    "#94a3b8"
    // info（暗色）
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
  SERIES_COLOR_TOKENS,
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
