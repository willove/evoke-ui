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
        position: { type: "string", enum: ["top", "bottom"] },
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
    radarSeries: { type: "array" },
    radarIndicators: { type: "array" },
    scatterData: { type: "array" },
    funnelData: { type: "array" },
    // 漏斗尾段最小宽度占比（0–0.5，0 = 严格等比）：极差悬殊时压缩尾段保可读
    funnelMinRatio: { type: "number" },
    gauge: { oneOf: [{ type: "number" }, { type: "object" }] },
    heatmapData: { type: "array" },
    candleData: { type: "array" },
    volumeData: { type: "array" },
    // K 线 MA 均线周期数组（如 [5, 10]），按收盘价简单移动平均
    candleMa: { type: "array" },
    calendarData: { type: "array" },
    calendar: { type: "object" },
    bulletData: { type: "array" },
    boxData: { type: "array" },
    sankeyData: {
      type: "object",
      properties: {
        nodes: { type: "array" },
        links: { type: "array" }
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
    ganttData: { type: "array" },
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
    timeAxis: { type: "boolean" }
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
