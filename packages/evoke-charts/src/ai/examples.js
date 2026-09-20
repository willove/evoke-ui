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
  {
    requirement: "按周汇总看打卡活跃度",
    spec: {
      type: "calendar-heatmap",
      title: "打卡活跃度（按周聚合）",
      calendarData: [
        { date: "2026-06-01", value: 3 },
        { date: "2026-06-02", value: 5 },
        { date: "2026-06-05", value: 8 },
      ],
      calendar: { start: "2026-06-01", end: "2026-08-31", granularity: "week" },
    },
  },
  {
    requirement: "服务间调用关系，环形布局更好看出闭环",
    spec: {
      type: "arc",
      title: "服务间调用拓扑",
      arcCircular: true,
      arcData: {
        nodes: [{ name: "网关" }, { name: "订单服务" }, { name: "支付服务" }, { name: "消息中心" }],
        links: [
          { source: "网关", target: "订单服务", value: 46 },
          { source: "订单服务", target: "支付服务", value: 38 },
          { source: "支付服务", target: "消息中心", value: 22 },
        ],
      },
    },
  },
  {
    requirement: "各渠道投放费用和转化效果的关系，看分界和走向",
    spec: {
      type: "scatter",
      title: "投放-转化四象限",
      scatterData: [
        { x: 120, y: 32, label: "搜索" },
        { x: 260, y: 58, label: "信息流" },
        { x: 90, y: 18, label: "社群" },
        { x: 340, y: 71, label: "直播" },
      ],
      quadrant: { labels: ["低投高转", "高投高转", "低投低转", "高投低转"] },
      scatterTrendline: "linear",
      pointLabels: true,
    },
  },
];

export function formatExamples(maxCount = SPEC_EXAMPLES.length) {
  return SPEC_EXAMPLES.slice(0, maxCount)
    .map((e) => `需求：${e.requirement}\nSpec：${JSON.stringify(e.spec)}`)
    .join("\n\n");
}

// ─── 三维篇章 few-shot（buildChartPrompt mode: '3d' 使用）───
// 契约与 /3d/ 篇章一致：bar3d/line3d = labels + series；scatter3d = 三元组；
// surface3d = x/y/z 高度场；pie3d = pieData。每条都要过 validateOptions3d。
export const SPEC_EXAMPLES_3D = [
  {
    requirement: "三维看温度、湿度与设备故障率的关系",
    spec: {
      type: "scatter3d",
      title: "温度-湿度-故障率空间分布",
      scatterData: [
        { x: 22, y: 40, z: 1.2, label: "产线 A" },
        { x: 28, y: 55, z: 2.8, label: "产线 B" },
        { x: 31, y: 62, z: 4.5, label: "产线 C" },
        { x: 25, y: 48, z: 1.9, label: "产线 D" },
      ],
      xAxis: { name: "温度（℃）" },
      yAxis: { name: "湿度（%）" },
      zAxis: { name: "故障率（%）" },
    },
  },
  {
    requirement: "转速和扭矩共同影响下的产出效率曲面",
    spec: {
      type: "surface3d",
      title: "转速-扭矩-效率高度场",
      surfaceData: {
        x: [800, 1200, 1600, 2000],
        y: [100, 150, 200],
        z: [
          [61, 64, 66, 63],
          [67, 72, 75, 70],
          [64, 69, 71, 66],
        ],
      },
      xAxis: { name: "转速（rpm）" },
      yAxis: { name: "扭矩（N·m）" },
      zAxis: { name: "效率（%）" },
    },
  },
  {
    requirement: "三维柱林对比四个季度的区域销量",
    spec: {
      type: "bar3d",
      title: "区域季度销量柱林",
      labels: ["一季度", "二季度", "三季度", "四季度"],
      series: [
        { name: "华东", data: [320, 356, 401, 388] },
        { name: "华南", data: [280, 302, 346, 331] },
        { name: "华北", data: [240, 262, 288, 305] },
      ],
      legend: { show: true },
      zAxis: { name: "销量（万）" },
    },
  },
];

export function formatExamples3d(maxCount = SPEC_EXAMPLES_3D.length) {
  return SPEC_EXAMPLES_3D.slice(0, maxCount)
    .map((e) => `需求：${e.requirement}\nSpec：${JSON.stringify(e.spec)}`)
    .join("\n\n");
}
