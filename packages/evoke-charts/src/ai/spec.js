// ─── Spec 合成：数据 + 意图 → EvChart options ───
// 确定性推断（离线可用），同时是「模型生成」路径的兜底与示例基线。

import { chartOptionsSchema } from "../schema";
import { maxOf, minOf } from "../extent";
import { parseDataTable, inferColumns, distinctCount } from "./table";

const INTENT_KEYWORDS = {
  trend: ["趋势", "走势", "变化", "随时间", "增长", "trend"],
  share: ["占比", "构成", "份额", "比例", "组成", "share"],
  rank: ["排行", "排名", "前几", "highest", "rank"],
  compare: ["对比", "比较", "对照", "相比", "compare"],
  relation: ["关系", "相关", "散点", "分布", "relation", "scatter"],
  stack: ["叠加", "堆叠", "累计", "stack"],
};

// 从自然语言短语里识别意图关键词（命中即返回，供规则与演示用；语义级理解交给模型）
export function detectIntent(text) {
  if (!text || typeof text !== "string") return null;
  const order = ["trend", "stack", "share", "rank", "relation", "compare"];
  for (const intent of order) {
    if (INTENT_KEYWORDS[intent].some((kw) => text.includes(kw))) return intent;
  }
  return null;
}

function fmtValue(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return String(v);
  if (Math.abs(v) >= 1e8) return `${(v / 1e8).toFixed(1)}亿`;
  if (Math.abs(v) >= 1e4) return `${(v / 1e4).toFixed(1)}万`;
  return `${Math.round(v * 100) / 100}`;
}

function buildNarrative(spec, labels, seriesList) {
  const annotations = [];
  // 全局峰值：所有系列里最大的单点
  let best = null;
  seriesList.forEach((s, si) => {
    s.data.forEach((v, di) => {
      if (typeof v === "number" && Number.isFinite(v) && (!best || v > best.value)) {
        best = { value: v, label: labels[di], series: s.name, si, di };
      }
    });
  });
  if (best) {
    annotations.push({
      type: "callout",
      x: best.label,
      y: best.value,
      series: best.series,
      label: `峰值 ${fmtValue(best.value)}`,
      anchor: "top-right",
    });
  }
  // 首系列末点环比（幅度 ≥1% 才值得说）
  const first = seriesList[0];
  if (first && first.data.length >= 2) {
    const prev = first.data[first.data.length - 2];
    const last = first.data[first.data.length - 1];
    if (typeof prev === "number" && typeof last === "number" && prev !== 0) {
      const pct = (last - prev) / Math.abs(prev);
      if (Math.abs(pct) >= 0.01) {
        annotations.push({
          type: "delta",
          x: labels[labels.length - 1],
          y: last,
          series: first.name,
          direction: pct >= 0 ? "up" : "down",
          text: `环比 ${pct >= 0 ? "+" : ""}${(pct * 100).toFixed(0)}%`,
        });
      }
    }
  }
  if (annotations.length > 0) spec.annotations = annotations.slice(0, 3);
}

// 生成结果：{ spec, report }；spec 为 null 表示数据不可用，report 说明缘由
export function generateChartSpec(data, hint = {}) {
  const table = parseDataTable(data);
  if (!table) {
    return {
      spec: null,
      report: [{ level: "error", message: "无法识别的数据格式：支持 CSV/TSV 文本、对象数组、二维数组" }],
    };
  }
  const cols = inferColumns(table);
  const numbers = cols.filter((c) => c.type === "number");
  const times = cols.filter((c) => c.type === "time");
  const cats = cols.filter((c) => c.type === "category" && distinctCount(c.values) > 0);
  const dimension = times[0] || cats[0] || null;
  const labels = dimension ? dimension.values.map((v) => String(v)) : table.rows.map((_, i) => String(i + 1));

  const intent = hint.intent
    || detectIntent([hint.title, hint.hint].filter(Boolean).join(" "))
    || defaultIntent({ times: times.length, numbers: numbers.length, cats: cats.length, labels: labels.length });

  const report = [
    { level: "info", message: `识别到 ${numbers.length} 个数值列、${times.length} 个时间列、${cats.length} 个类目列；意图「${intent}」` },
  ];

  const spec = {};
  if (hint.title) spec.title = hint.title;

  // 双数值列且无类目维度 → 关系（散点）
  if (intent === "relation" && numbers.length >= 2) {
    const cat = cats[0];
    spec.type = "scatter";
    spec.scatterData = table.rows.map((_, i) => ({
      x: numbers[0].values[i],
      y: numbers[1].values[i],
      label: cat ? String(cat.values[i]) : String(i + 1),
    }));
    report.push({ level: "info", message: `散点图：${numbers[0].name} → x，${numbers[1].name} → y` });
    return { spec, report };
  }

  if (numbers.length === 0) {
    return { spec: null, report: [{ level: "error", message: "数据中没有可用的数值列（列需 ≥60% 为可解析数字）" }] };
  }

  const seriesList = numbers.slice(0, 8).map((c) => ({ name: c.name, data: c.values }));
  if (numbers.length > 8) {
    report.push({ level: "warn", message: `数值列超过 8 个，仅取前 8 列（${seriesList.map((s) => s.name).join("、")}）` });
  }

  // 占比意图：单度量按类目切饼；多度量按「度量合计」切饼（如各渠道总销售额占比）
  if (intent === "share") {
    if (seriesList.length === 1 && labels.length <= 8) {
      const pieData = labels
        .map((name, i) => ({ name, value: seriesList[0].data[i] }))
        .filter((d) => typeof d.value === "number" && d.value > 0);
      spec.type = "pie";
      spec.pieData = pieData;
      report.push({ level: "info", message: `饼图：${seriesList[0].name} 按类目占比（${pieData.length} 项）` });
      return { spec, report };
    }
    if (seriesList.length >= 2 && seriesList.length <= 8) {
      const sums = seriesList.map((s) =>
        s.data.reduce((acc, v) => (typeof v === "number" && Number.isFinite(v) ? acc + v : acc), 0)
      );
      if (sums.every((v) => v > 0)) {
        spec.type = "pie";
        spec.pieData = seriesList.map((s, i) => ({ name: s.name, value: sums[i] }));
        report.push({ level: "info", message: `饼图：按度量合计占比（${sums.length} 项）` });
        return { spec, report };
      }
    }
  }

  // 单度量 + 排行意图 / 类目过多 / 类目名偏长 → 横向条形
  const labelWidth = labels.reduce((m, l) => Math.max(m, l.length), 0);
  const wantRank = intent === "rank" || (intent === "compare" && seriesList.length === 1 && labels.length >= 9);
  if (seriesList.length === 1 && (wantRank || labels.length >= 13 || (labelWidth >= 5 && labels.length >= 7))) {
    spec.type = "horizontal-bar";
    spec.labels = labels;
    spec.series = seriesList;
    report.push({ level: "info", message: "横向条形图：单度量分类对比，类目名走纵列更易读" });
    finishCartesian(spec, hint, labels, seriesList, report);
    return { spec, report };
  }

  // 量级悬殊的多度量 → 双轴混合：最大度量柱走左轴，其余线走右轴
  const splitIdx = intent === "trend" ? planDualAxis(seriesList) : -1;
  if (splitIdx >= 0) {
    spec.type = "mixed";
    spec.yAxisRight = { show: true };
    const peakOf = (s) =>
      Math.max(0, maxOf(s.data.filter((v) => typeof v === "number" && Number.isFinite(v)).map(Math.abs)));
    const peakMax = peakOf(seriesList[splitIdx]);
    const peakMin = minOf(seriesList.filter((_, i) => i !== splitIdx).map(peakOf).filter((v) => v > 0));
    const ratioText =
      Number.isFinite(peakMin) && peakMin > 0 ? `（最高约为最低的 ${fmtRatio(peakMax / peakMin)} 倍）` : "";
    report.push({
      level: "info",
      message: `双轴混合图：多度量量级悬殊${ratioText}，「${seriesList[splitIdx].name}」走左轴柱，其余走右轴线`,
    });
  } else if (intent === "stack" && seriesList.length >= 2) {
    spec.type = "stacked-bar";
    report.push({ level: "info", message: "堆叠柱状图：多度量叠加看构成" });
  } else if ((intent === "compare" || intent === "rank") && seriesList.length <= 3 && labels.length <= 12) {
    spec.type = "bar";
    report.push({ level: "info", message: "柱状图：类目间量值对比" });
  } else {
    spec.type = "line";
    report.push({ level: "info", message: "折线图：维度有序（时间/类目），看走势与多系列对比" });
  }
  seriesList.forEach((s, i) => {
    if (splitIdx >= 0) {
      s.chartType = i === splitIdx ? "bar" : "line";
      s.yAxis = i === splitIdx ? "left" : "right";
    }
  });
  spec.labels = labels;
  spec.series = seriesList;
  if (seriesList.length > 1) spec.legend = { show: true };
  finishCartesian(spec, hint, labels, seriesList, report);
  return { spec, report };
}

// 双轴混合判定：多度量的每系列峰值相差 ≥100 倍时，同轴必然把小度量压成贴地线。
// 返回最大度量所在系列下标，不满足返回 -1。
function planDualAxis(seriesList) {
  const maxes = seriesList.map((s) =>
    s.data.reduce((m, v) => (typeof v === "number" && Number.isFinite(v) ? Math.max(m, Math.abs(v)) : m), 0)
  );
  const valid = maxes.filter((m) => m > 0);
  if (seriesList.length < 2 || valid.length < 2) return -1;
  const max = maxOf(maxes);
  const min = minOf(valid);
  return max / min >= 100 ? maxes.indexOf(max) : -1;
}

function fmtRatio(ratio) {
  if (ratio >= 1e8) return `${(ratio / 1e8).toFixed(1)}亿`;
  if (ratio >= 1e4) return `${(ratio / 1e4).toFixed(1)}万`;
  return `${Math.round(ratio).toLocaleString("en")}`;
}

function finishCartesian(spec, hint, labels, seriesList, report) {
  if (hint.narrative) {
    // 注解统一按左轴坐标落位（渲染器注解只认左轴 range），右轴系列不参与，避免错位
    buildNarrative(spec, labels, seriesList.filter((s) => s.yAxis !== "right"));
    if (spec.annotations) {
      report.push({ level: "info", message: `叙述注解 ${spec.annotations.length} 处（峰值 callout / 末点环比 delta）` });
    }
  }
}

function defaultIntent({ times, numbers, cats, labels }) {
  if (times > 0 && numbers > 0) return "trend";
  if (numbers >= 2 && cats === 0) return "relation";
  if (numbers === 1 && (cats > 0 || labels > 0)) return "compare";
  return "trend";
}

// 供宿主在提示词里附上 schema 与限制（与 lintChartSpec 的硬规则保持一致）
export const SPEC_RULES = [
  "type 必填，取值必须是 schema enum 中的图表类型",
  "series[].data 长度必须与 labels 一致，缺失值用 null",
  "双轴：两个量纲或量级悬殊的度量用 type mixed——大量度 series 用 chartType bar 且 yAxis left，小量度 chartType line 且 yAxis right，并置顶层 yAxisRight",
  "palette 仅在需求要求固定配色（不随宿主主题换肤）时设置，取值限定 schema enum 中的色系 id；与 theme.colors 同时出现时以 theme.colors 为准",
  "弧长连接图关系密集或需要闭合回路视角时置 arcCircular: true，数据仍走 arcData",
  "日历热力需要周/月聚合视角时置 calendar.granularity（day 每日 / week / month，周月为求和聚合）",
  "数值格式化优先用 valueFormat 快捷对象（decimals/thousandSeparator/prefix/suffix/abbreviate），确需函数式定制才用 valueFormatter",
  "散点增强：要看分布分界用 quadrant（均值十字 + 象限标签），看相关走向用 scatterTrendline: 'linear'（多组对比配 trendlinePerGroup: true），同值重叠用 jitter，需逐点标注用 pointLabels: true，多变量按 group 拆格用 facet: true",
  "雷达增强：radarRingFill: true 画同心环带底色；多系列重叠看构成用 radarStacked: true",
  "K 线：volumeData 与 candleData 等长即带量副图，candleMa（如 [5, 10]）叠均线并可配 candleMaColors，涨跌色用 candleUpColor / candleDownColor",
  "桑基列对齐缺省 justify（末端贴右缘），仅按拓扑深度排布的需求才设 sankey: { nodeAlign: 'left' }",
  "箱线横向排布用 boxHorizontal: true；直方图分箱用 binConfig（binCount 或 bins，密度视角 density）；热力排序视角用 heatmapSortBy: 'value'",
  "折线增强：多系列面积构成用 stackAreas: true，阶梯走势用 step: true，null 断点需跨接用 connectNulls: true，逐点标值用 showValues，阈值参考线用 markLines，事件区间强调用 markAreas",
  "瀑布图合计列用 waterfall.totalIndices 标记；漏斗尾段压缩用 funnelMinRatio；饼图环形化用 type: 'doughnut' 配 innerRadius",
  "叙述注解 annotations 单图不超过 3 处，emphasis 焦点最多 1 个系列",
  "不使用 schema 之外的字段",
  `支持的图表类型：${chartOptionsSchema.properties.type.enum.join(" / ")}`,
];
