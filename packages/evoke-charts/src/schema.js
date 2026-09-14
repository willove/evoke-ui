// ─── Options Spec 契约 ───
// chartOptionsSchema 是 options 的 JSON Schema 描述，供宿主与 AI 生成合法 Spec；
// validateOptions 是配套的轻量校验（仅覆盖本 Schema 用到的子集），零依赖。

import { CHART_PALETTES } from "./palettes";

const CHART_TYPES = [
  "line", "area", "bar", "stacked-bar", "horizontal-bar",
  "pie", "doughnut", "rose", "radar", "scatter", "scatter-matrix",
  "funnel", "gauge", "heatmap", "calendar-heatmap", "candle", "bin", "bullet",
  "treemap", "sparkline", "waterfall", "boxplot", "sunburst", "mixed",
  "sankey", "venn", "chord", "arc", "gantt"
];

const seriesSchema = {
  type: "object",
  required: ["name", "data"],
  properties: {
    name: { type: "string" },
    data: { type: "array" },
    color: { type: "string" },
    showSymbol: { type: "boolean" },
    lineWidth: { type: "number" },
    smooth: { type: "boolean" },
    yAxis: { type: "string", enum: ["left", "right"] },
    type: { type: "string" },
    chartType: { type: "string", enum: ["bar", "line"] },
    area: { type: "boolean" }
  }
};

const paddingSchema = {
  oneOf: [
    { type: "number" },
    {
      type: "object",
      properties: {
        top: { type: "number" },
        right: { type: "number" },
        bottom: { type: "number" },
        left: { type: "number" }
      }
    }
  ]
};

const annotationSchema = {
  type: "object",
  oneOf: [
    { required: ["type", "x", "y"], properties: { type: { enum: ["text", "callout", "delta", "point"] } } },
    { required: ["type", "from", "to"], properties: { type: { enum: ["region"] } } }
  ],
  properties: {
    type: { type: "string", enum: ["text", "callout", "region", "delta", "point"] },
    x: {},
    y: { type: "number" },
    from: {},
    to: {},
    at: {},
    label: { type: "string" },
    text: { type: "string" },
    anchor: { type: "string", enum: ["top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"] },
    color: { type: "string" },
    offsetX: { type: "number" },
    offsetY: { type: "number" },
    xPx: { type: "number" },
    yPx: { type: "number" }
  }
};

export const chartOptionsSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "EvChart Options",
  type: "object",
  required: ["type"],
  properties: {
    type: { type: "string", enum: CHART_TYPES },
    title: { type: "string" },
    subtitle: { type: "string" },
    labels: { type: "array" },
    series: { type: "array", items: seriesSchema },
    legend: {
      type: "object",
      properties: {
        show: { type: "boolean" },
        position: { type: "string", enum: ["top", "bottom", "left", "right"] },
        interactive: { type: "boolean" },
        hoverEmphasis: { type: "boolean" }
      }
    },
    tooltip: {
      type: "object",
      properties: {
        show: { type: "boolean" },
        trigger: { type: "string", enum: ["hover", "click"] },
        showAllSeries: { type: "boolean" },
        formatter: { type: "function" }
      }
    },
    animation: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        duration: { type: "number" },
        easing: { type: "string" }
      }
    },
    xAxis: {
      type: "object",
      properties: {
        show: { type: "boolean" },
        // "time" 启用时间轴（labels 解析为时间戳，刻度按时间跨度取档）；"category" 为默认类目轴
        type: { type: "string", enum: ["category", "time"] },
        min: { type: "number" },
        max: { type: "number" },
        ticks: { type: "integer" },
        grid: {
          type: "object",
          properties: { show: { type: "boolean" }, style: { type: "string", enum: ["solid", "dashed"] } }
        }
      }
    },
    yAxis: {
      type: "object",
      properties: {
        show: { type: "boolean" },
        // "log" 启用对数值轴（大跨度数据的量级压缩）
        type: { type: "string", enum: ["value", "log"] },
        min: { type: "number" },
        max: { type: "number" },
        ticks: { type: "integer" },
        width: { type: "number" },
        grid: {
          type: "object",
          properties: { show: { type: "boolean" }, style: { type: "string", enum: ["solid", "dashed"] } }
        }
      }
    },
    yAxisRight: { $ref: "#/properties/yAxis" },
    padding: paddingSchema,
    dataZoom: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        start: { type: "number" },
        end: { type: "number" },
        position: { type: "string", enum: ["bottom", "top"] },
        height: { type: "number" },
        mouseWheel: { type: "boolean" }
      }
    },
    toolbox: {
      type: "object",
      properties: { show: { type: "boolean" }, filename: { type: "string" } }
    },
    theme: { type: "object" },
    palette: { type: "string", enum: CHART_PALETTES.map((p) => p.id) },
    layers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          at: { type: "string", enum: ["back", "after-series", "front"] },
          draw: { type: "function" }
        }
      }
    },
    emphasis: {
      type: "object",
      properties: {
        series: { oneOf: [{ type: "string" }, { type: "integer" }] },
        dimOthers: { type: "boolean" }
      }
    },
    annotations: { type: "array", items: annotationSchema },
    annotation: { type: "object" },
    markLines: { type: "array" },
    markAreas: { type: "array" },
    markLine: { type: "array" },
    markArea: { type: "array" },
    scenes: {
      type: "object",
      properties: {
        autoplay: { type: "boolean" },
        loop: { type: "boolean" },
        items: {
          type: "array",
          items: {
            type: "object",
            required: ["patch"],
            properties: {
              patch: { type: "object" },
              duration: { type: "number" },
              hold: { type: "number" }
            }
          }
        }
      }
    },
    // 按类型数据字段
    pieData: { type: "array" },
    // 饼图百分比分母模式（值即百分比，不按合计归一）
    piePercentMode: { type: "boolean" },
    // 数值占合计比低于该阈值的扇区合并为「其他」
    pieHideThreshold: { type: "number" },
    // 环形内半径占比（0–1，doughnut 默认 0.6）
    innerRadius: { type: "number" },
    radarSeries: { type: "array" },
    radarIndicators: { type: "array" },
    // 雷达：多系列叠加填充（默认并列）、同心圆环带交替底色、维度标签外扩距离
    radarStacked: { type: "boolean" },
    radarRingFill: { type: "boolean" },
    radarLabelOffset: { type: "number" },
    scatterData: { type: "array" },
    // 散点：四象限参考线（十字虚线 + 角标签，xMid/yMid 缺省取均值，labels 顺序为左上/右上/左下/右下）
    quadrant: {
      type: "object",
      properties: {
        show: { type: "boolean" },
        xMid: { type: "number" },
        yMid: { type: "number" },
        labels: { type: "array" }
      }
    },
    // 散点：趋势线类型（如 "linear"）、按分组各配一条、抖动幅度（像素）
    scatterTrendline: { type: "string" },
    trendlinePerGroup: { type: "boolean" },
    jitter: { type: "number" },
    // 散点：直接在每个点上标注 label
    pointLabels: { type: "boolean" },
    // 散点分面（按 group 拆格子，每格自带迷你刻度）
    facet: { type: "boolean" },
    funnelData: { type: "array" },
    // 漏斗尾段最小宽度占比（0–0.5，0 = 严格等比）：极差悬殊时压缩尾段保可读
    funnelMinRatio: { type: "number" },
    // 漏斗倒金字塔（从上到下递增）
    pyramid: { type: "boolean" },
    gauge: { oneOf: [{ type: "number" }, { type: "object" }] },
    heatmapData: { type: "array" },
    // 热力：色阶数组、右侧色条开关、排序视角（name 按名称 / value 按行合计）
    heatmap: {
      type: "object",
      properties: {
        colorScale: { type: "array" },
        colorBar: { type: "boolean" }
      }
    },
    heatmapColorBar: { type: "boolean" },
    heatmapSortBy: { type: "string", enum: ["name", "value"] },
    candleData: { type: "array" },
    volumeData: { type: "array" },
    // K 线 MA 均线周期数组（如 [5, 10]），按收盘价简单移动平均
    candleMa: { type: "array" },
    // K 线 MA 均线配色（与 candleMa 周期一一对应）与涨跌色
    candleMaColors: { type: "array" },
    candleUpColor: { type: "string" },
    candleDownColor: { type: "string" },
    calendarData: { type: "array" },
    // 日历热力：日期范围与外观，granularity 切聚合视角（day 每日 / week 每周求和 / month 每月求和）
    calendar: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
        weekStart: { type: "integer" },
        today: { type: "string" },
        granularity: { type: "string", enum: ["day", "week", "month"] },
        colors: { type: "array" },
        cellGap: { type: "number" },
        showScale: { type: "boolean" },
        weekdayLabels: { type: "array" },
        showAllWeekdays: { type: "boolean" }
      }
    },
    bulletData: { type: "array" },
    boxData: { type: "array" },
    // 箱线：横向布局、离群点显示开关
    boxHorizontal: { type: "boolean" },
    showOutliers: { type: "boolean" },
    // 直方图分箱：显式 bins 边界数组、箱数、密度视角（频率/组距）
    binConfig: {
      type: "object",
      properties: {
        bins: { type: "array" },
        binCount: { type: "integer" },
        density: { type: "boolean" }
      }
    },
    treemapData: { type: "array" },
    sunburstData: { type: "array" },
    // 数值格式化：小数位、千分位、前后缀、万/亿缩写（valueFormatter 函数的快捷方式）
    valueFormat: {
      type: "object",
      properties: {
        decimals: { type: "integer" },
        thousandSeparator: { type: "string" },
        prefix: { type: "string" },
        suffix: { type: "string" },
        abbreviate: { type: "boolean" }
      }
    },
    showValues: { type: "boolean" },
    // 柱圆角（像素）与折线阶梯步进
    borderRadius: { type: "number" },
    step: { type: "boolean" },
    smooth: { type: "boolean" },
    // 面积堆叠（type: "area"）
    stackAreas: { type: "boolean" },
    // 断点连线（null 值处跨接而非断开）
    connectNulls: { type: "boolean" },
    // 十字准线纵向联动（多系列同列对齐读数）
    crosshairUnified: { type: "boolean" },
    // 瀑布图：totalIndices 标记合计列（该列画全高而不是增量）
    waterfall: {
      type: "object",
      properties: {
        totalIndices: { type: "array" }
      }
    },
    sankeyData: {
      type: "object",
      properties: {
        nodes: { type: "array" },
        links: { type: "array" }
      }
    },
    // 桑基列对齐：justify 末端节点贴右缘（默认） / left 按拓扑深度自然排布
    sankey: {
      type: "object",
      properties: {
        nodeAlign: { type: "string", enum: ["justify", "left"] }
      }
    },
    chordData: {
      type: "object",
      properties: {
        nodes: { type: "array" },
        links: { type: "array" }
      }
    },
    arcData: {
      type: "object",
      properties: {
        nodes: { type: "array" },
        links: { type: "array" }
      }
    },
    vennData: { type: "array" },
    // 韦恩：空心圆形态（只描边不填充）
    vennHollow: { type: "boolean" },
    ganttData: { type: "array" },
    // 甘特今日线（日期字符串或时间戳）
    ganttToday: { type: "string" },
    // arc 环形弧长形态：复用弦图弧形环状渲染（节点圆点 + 过圆心弧线），数据仍走 arcData
    arcCircular: { type: "boolean" },
    matrixFields: { type: "array" },
    matrixData: { type: "array" },
    // 行为与辅助
    loading: { type: "boolean" },
    emptyText: { type: "string" },
    ariaLabel: { type: "string" },
    i18n: { type: "object" },
    connectGroup: { type: "string" },
    brush: {
      type: "object",
      properties: { enabled: { type: "boolean" } }
    },
    logAxis: { type: "boolean" },
    valueFormatter: { type: "function" },
    timeAxis: { type: "boolean" },
    // 迷你线：平滑与面积开关（面积默认开）
    sparklineSmooth: { type: "boolean" },
    sparklineArea: { type: "boolean" }
  }
};

// ─── 轻量校验器（仅覆盖本 Schema 用到的关键字） ───
const TYPE_CHECKS = {
  string: (v) => typeof v === "string",
  number: (v) => typeof v === "number" && Number.isFinite(v),
  integer: (v) => typeof v === "number" && Number.isInteger(v),
  boolean: (v) => typeof v === "boolean",
  object: (v) => v !== null && typeof v === "object" && !Array.isArray(v),
  array: (v) => Array.isArray(v),
  function: (v) => typeof v === "function"
};

function typeMatches(node, value) {
  if (Array.isArray(node.type)) return node.type.some((t) => TYPE_CHECKS[t]?.(value));
  const check = TYPE_CHECKS[node.type];
  return check ? check(value) : true;
}

function validateNode(node, value, path, warnings) {
  if (node == null || value === undefined || value === null) return;
  if (node.oneOf) {
    const anyMatch = node.oneOf.some((branch) => {
      const before = warnings.length;
      validateNode(branch, value, path, warnings);
      const ok = warnings.length === before;
      warnings.length = before;
      return ok;
    });
    if (!anyMatch) {
      warnings.push({ path, message: "类型不匹配（应为 oneOf 之一）" });
      return;
    }
  }
  if (node.type && !typeMatches(node, value)) {
    warnings.push({ path, message: `应为 ${node.type}，实际为 ${Array.isArray(value) ? "array" : typeof value}` });
    return;
  }
  if (node.enum && !node.enum.includes(value)) {
    warnings.push({ path, message: `应为 ${node.enum.join(" / ")} 之一，实际为 ${String(value)}` });
    return;
  }
  if (node.type === "object") {
    (node.required || []).forEach((key) => {
      if (value[key] === undefined) warnings.push({ path: `${path}.${key}`, message: "缺少必填字段" });
    });
    if (node.properties) {
      Object.entries(node.properties).forEach(([key, sub]) => {
        if (value[key] !== undefined) validateNode(sub, value[key], `${path}.${key}`, warnings);
      });
    }
  }
  if (node.type === "array" && node.items && Array.isArray(value)) {
    value.forEach((item, i) => validateNode(node.items, item, `${path}[${i}]`, warnings));
  }
}

export function validateOptions(options) {
  const warnings = [];
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    return { ok: false, warnings: [{ path: "options", message: "应为对象" }] };
  }
  validateNode(chartOptionsSchema, options, "options", warnings);
  return { ok: warnings.length === 0, warnings };
}
