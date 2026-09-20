// ─── 三维篇章的生成接入：选型规划与提示词规则 ───
// 保守原则：二维能讲清的不上三维。只有两种情况进入三维选型——
//   1. 显式意图：需求里带「三维 / 立体 / 3D」；
//   2. 数据天然三维：≥3 个数值列且无类目/时间维度（二维散点必丢一维）。
// 规划失败（维度不足 / 网格过大）返回 spec: null，二维流程继续兜底。

const THREE_HINT = /三维|立体|3d/i;

export function wantsThreed(hint = {}) {
  if (hint.intent === "threed") return true;
  const text = [hint.title, hint.hint].filter(Boolean).join(" ");
  return THREE_HINT.test(text);
}

// 完整数值网格判定：前两个数值列的取值笛卡尔积恰好覆盖全部行（无重复无缺格）
// → 曲面高度场；稀疏则回 null 走三维散点。网格任一边 > 64 视为过大（spec 会爆炸）。
function pivotGrid(cx, cy, cz) {
  const rows = cx.values.length;
  if (rows < 4) return null;
  const xs = [...new Set(cx.values.filter(Number.isFinite))].sort((a, b) => a - b);
  const ys = [...new Set(cy.values.filter(Number.isFinite))].sort((a, b) => a - b);
  if (xs.length < 2 || ys.length < 2) return null;
  if (xs.length * ys.length !== rows) return null;
  if (xs.length > 64 || ys.length > 64) return { tooLarge: true, x: xs.length, y: ys.length };
  const z = Array.from({ length: ys.length }, () => new Array(xs.length).fill(null));
  const seen = new Set();
  for (let i = 0; i < rows; i++) {
    const xi = xs.indexOf(cx.values[i]);
    const yi = ys.indexOf(cy.values[i]);
    if (xi < 0 || yi < 0) return null;
    const key = yi * xs.length + xi;
    if (seen.has(key)) return null;
    seen.add(key);
    z[yi][xi] = cz.values[i];
  }
  return { x: xs, y: ys, z };
}

// 入参来自 generateChartSpec 的中间量；返回 { spec, report }，spec 为 null 表示
// 放弃三维（report 说明缘由），调用方继续走二维选型。
export function planThreed({ hint, intent, numbers, times, cats, table, labels }) {
  const asked = wantsThreed(hint);
  const natural = !asked && cats.length === 0 && times.length === 0 && numbers.length >= 3;
  if (!asked && !natural) return null;

  // 三个及以上数值列且无类目/时间维度：三元组空间
  if (cats.length === 0 && times.length === 0) {
    if (numbers.length < 3) {
      return {
        spec: null,
        report: [{ level: "warn", message: "三维散点/曲面需要至少三个数值维度，已回退二维选型" }],
      };
    }
    const [cx, cy, cz] = numbers;
    const grid = pivotGrid(cx, cy, cz);
    if (grid && !grid.tooLarge) {
      return {
        spec: {
          type: "surface3d",
          surfaceData: { x: grid.x, y: grid.y, z: grid.z },
          xAxis: { name: cx.name },
          yAxis: { name: cy.name },
          zAxis: { name: cz.name },
        },
        report: [
          {
            level: "info",
            message: `三维曲面：${cx.name} × ${cy.name} 构成 ${grid.x.length}×${grid.y.length} 完整高度场（${cz.name}）`,
          },
        ],
      };
    }
    const report = [];
    if (grid && grid.tooLarge) {
      report.push({
        level: "warn",
        message: `数值网格 ${grid.x}×${grid.y} 过大（任一边 > 64），曲面 spec 会爆炸，已改用三维散点`,
      });
    }
    return {
      spec: {
        type: "scatter3d",
        scatterData: table.rows.map((_, i) => ({ x: cx.values[i], y: cy.values[i], z: cz.values[i] })),
        xAxis: { name: cx.name },
        yAxis: { name: cy.name },
        zAxis: { name: cz.name },
      },
      report: [
        ...report,
        {
          level: "info",
          message: `三维散点：${cx.name} / ${cy.name} / ${cz.name} 三轴空间（二维散点会丢一维）`,
        },
      ],
    };
  }

  // 有类目/时间维度：仅显式意图进入，labels + series 形态。无数值列交给二维流程报错
  if (numbers.length === 0) return null;

  // 三元组度量 + 关系意图 → 带 label 的三维散点
  if (intent === "relation" && numbers.length >= 3) {
    const [cx, cy, cz] = numbers;
    const cat = cats[0];
    return {
      spec: {
        type: "scatter3d",
        scatterData: table.rows.map((_, i) => ({
          x: cx.values[i],
          y: cy.values[i],
          z: cz.values[i],
          label: cat ? String(cat.values[i]) : String(i + 1),
        })),
        xAxis: { name: cx.name },
        yAxis: { name: cy.name },
        zAxis: { name: cz.name },
      },
      report: [
        {
          level: "info",
          message: `三维散点：${cx.name} / ${cy.name} / ${cz.name} 三轴空间，${cat ? `「${cat.name}」作点标签` : "行号作点标签"}`,
        },
      ],
    };
  }

  // labels + series 形态：意图与图表词决定柱林或空间折线
  const seriesList = numbers.slice(0, 8).map((c) => ({ name: c.name, data: c.values }));
  const report = [];
  if (numbers.length > 8) {
    report.push({ level: "warn", message: `数值列超过 8 个，仅取前 8 列（${seriesList.map((s) => s.name).join("、")}）` });
  }

  // 占比意图：单度量按类目切饼，多度量按列合计切饼（与二维同规则，图型换三维饼）
  if (intent === "share") {
    if (seriesList.length === 1 && labels.length <= 8) {
      const pieData = labels
        .map((name, i) => ({ name, value: seriesList[0].data[i] }))
        .filter((d) => typeof d.value === "number" && d.value > 0);
      return {
        spec: { type: "pie3d", pieData },
        report: [...report, { level: "info", message: `三维饼：${seriesList[0].name} 按类目占比（${pieData.length} 项）` }],
      };
    }
    if (seriesList.length >= 2 && seriesList.length <= 8) {
      const sums = seriesList.map((s) =>
        s.data.reduce((acc, v) => (typeof v === "number" && Number.isFinite(v) ? acc + v : acc), 0)
      );
      if (sums.every((v) => v > 0)) {
        return {
          spec: { type: "pie3d", pieData: seriesList.map((s, i) => ({ name: s.name, value: sums[i] })) },
          report: [...report, { level: "info", message: `三维饼：按度量合计占比（${sums.length} 项）` }],
        };
      }
    }
  }

  // 时间维度 / 趋势意图 / 明确要线 → 空间折线；明确要柱或对比类意图 → 柱林
  const text = [hint.title, hint.hint].filter(Boolean).join("");
  const wantsBars = /柱|条形/.test(text);
  const isTrend = !wantsBars && (times.length > 0 || intent === "trend");
  const type = isTrend ? "line3d" : "bar3d";
  const spec = { type, labels, series: seriesList };
  if (seriesList.length > 1) spec.legend = { show: true };
  if (seriesList.length === 1) spec.zAxis = { name: seriesList[0].name };
  report.push({
    level: "info",
    message: isTrend
      ? "三维空间折线：维度有序看走势，落地投影与面带保留空间形态"
      : "三维柱林：类目 × 系列的空间量值对比",
  });
  return { spec, report };
}

// 三维提示词的硬性规则（与 chart3dOptionsSchema 的数据契约一致）
export const SPEC_RULES_3D = [
  "type 必填，取值限定三维 schema enum：bar3d / line3d / scatter3d / surface3d / pie3d",
  "bar3d / line3d 用 labels（X 类目）+ series（Y 系列，data 为标量数组），series[].data 长度必须与 labels 一致，系列建议 ≤5（过多互相遮挡）",
  "scatter3d 用 scatterData：{ x, y, z, label? } 三元组数组，三轴均为数值",
  "surface3d 用 surfaceData：{ x: 列值数组, y: 行值数组, z: 行×列矩阵 }，z.length 必须等于 y.length 且每行长度等于 x.length",
  "pie3d 用 pieData：{ name, value } 数组，扇区 ≤8 项，正值才参与",
  "渲染组件是 <ev-chart3d>（来自 @wil-works/evoke-charts/3d 子入口）；二维专属字段（annotations / dataZoom / yAxisRight / markLines 等）在三维 schema 中不存在，不要使用",
  "相机交互默认已含拖拽环绕、滚轮缩放与双击复位，一般无需配置 camera；展厅氛围场景才设 camera.autoRotate: true",
  "palette / theme / colors 与二维同一套：色系 id 限定三维 schema enum；theme.colors 与 palette 同时出现时以 theme.colors 为准",
  "数值格式化用 valueFormatter（函数）或 i18n 文案对象；不使用三维 schema 之外的字段",
];
