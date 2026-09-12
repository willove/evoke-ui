// ─── 提示词示例库（few-shot）───
// 示例与库的真实行为保持一致：每条 spec 都要通过 validateOptions 与
// lintChartSpec（有自一致性测试把关），模型照着抄不会抄出不合格配置。

export const SPEC_EXAMPLES = [
  {
    requirement: "看上半年各渠道销售额走势",
    spec: {
      type: "line",
      title: "渠道月度销售额",
      labels: ["1月", "2月", "3月", "4月", "5月", "6月"],
      series: [
        { name: "线上商城", data: [320, 356, 401, 388, 520, 560] },
        { name: "线下门店", data: [280, 302, 346, 331, 352, 428] },
      ],
      legend: { show: true },
    },
  },
  {
    requirement: "各渠道销售额占比",
    spec: {
      type: "pie",
      title: "渠道销售额占比",
      pieData: [
        { name: "线上商城", value: 2545 },
        { name: "线下门店", value: 2039 },
        { name: "社群团购", value: 844 },
      ],
    },
  },
  {
    requirement: "各门店销量排行",
    spec: {
      type: "horizontal-bar",
      title: "门店销量排行",
      labels: ["线下体验店", "线上旗舰店", "社群团购点", "仓储会员店", "社区便利店"],
      series: [{ name: "销量", data: [120, 98, 80, 60, 52] }],
    },
  },
  {
    requirement: "广告投放与成交金额的关系",
    spec: {
      type: "scatter",
      title: "投放-成交关系",
      scatterData: [
        { x: 100, y: 12, label: "华东" },
        { x: 200, y: 26, label: "华南" },
        { x: 300, y: 31, label: "华北" },
      ],
    },
  },
  {
    requirement: "营收和增长率一起看",
    spec: {
      type: "mixed",
      title: "营收与增长率",
      labels: ["1月", "2月", "3月", "4月", "5月", "6月"],
      series: [
        { name: "营收（万）", data: [168, 142, 195, 210, 265, 248], chartType: "bar", yAxis: "left" },
        { name: "增长率（%）", data: [12, 26, -10, 36, 18, 24], chartType: "line", yAxis: "right", smooth: true },
      ],
      yAxisRight: { show: true },
      legend: { show: true },
    },
  },
];

export function formatExamples(maxCount = SPEC_EXAMPLES.length) {
  return SPEC_EXAMPLES.slice(0, maxCount)
    .map((e) => `需求：${e.requirement}\nSpec：${JSON.stringify(e.spec)}`)
    .join("\n\n");
}
