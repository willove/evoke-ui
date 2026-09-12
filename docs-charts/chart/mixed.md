# 混合图 mixed · 双轴

同一张图里线柱混排、双轴对照：量画柱、率画线，一眼同时看「规模」与「变化率」，营销复盘、经营月报的常客。

## 何时使用

- 两个指标的**量纲不同**（营收万元 vs 增长率 %）或**量级悬殊**（销售额百万 vs 客单价几十）但想对齐同一时间轴；
- 一个指标看量、一个指标看趋势率；
- 两指标量纲与量级都相近时，直接用[柱状图](/chart/bar)或[折线图](/chart/line)即可，不必强开双轴。

## 双轴怎么开

三个字段：系列各自声明柱线形态与归侧，顶层开右轴——

```vue
<ev-chart
  :options="{
    type: 'mixed',
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      { name: '营收（万）', data: [320, 402, 361, 490], chartType: 'bar', yAxis: 'left' },
      { name: '增长率（%）', data: [12, 26, -10, 36], chartType: 'line', yAxis: 'right' },
    ],
    yAxisRight: { show: true },
  }"
  :height="260"
/>
```

- `series[].chartType`：`'bar'`（柱）或 `'line'`（线，默认）；
- `series[].yAxis`：`'left'`（默认）/ `'right'`；
- `yAxisRight`：顶层开启右值轴，配置结构同 `yAxis`。

不设 `yAxisRight` 时所有系列都落在左轴——线柱混排但仍是一根轴，量级悬殊时小量度的线会被压扁。[折线图](/chart/line)与[面积图](/chart/area)同样支持 `series[].yAxis: 'right'` + `yAxisRight` 开双轴，不止 mixed。值轴以左、右两根为限，暂不支持更多轴。

数据表粘贴给 [AI 生成](/guide/ai)时，多度量峰值相差百倍以上会自动切双轴，无需手动指定。

## 示例

沿用 `labels` + `series`：`chartType` 定柱线，`yAxis` 定归侧，系列命名带单位避免读图歧义。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'mixed',
      title: '营收与增长率',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        { name: '营收（万）', data: [320, 402, 361, 490], chartType: 'bar', yAxis: 'left' },
        { name: '增长率（%）', data: [12, 26, -10, 36], chartType: 'line', yAxis: 'right' },
      ],
      yAxisRight: { show: true },
      legend: { show: true },
    }"
    :height="260"
  />
</DemoBlock>

### 基金规模与收益率

基金季报的经典组合：份额规模画柱、期间收益率画线——规模涨是「钱进来」，收益率升是「钱赚到了」，两件事同看才能判断是申购推动还是业绩推动。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'mixed',
      title: '沪深300指数基金 · 近四季',
      labels: ['2025Q4', '2026Q1', '2026Q2', '2026Q3'],
      series: [
        { name: '基金份额（亿份）', data: [86, 102, 118, 135], chartType: 'bar', yAxis: 'left' },
        { name: '期间收益率（%）', data: [4.2, -2.8, 6.5, 9.1], chartType: 'line', yAxis: 'right' },
      ],
      yAxisRight: { show: true },
      legend: { show: true },
    }"
    :height="280"
  />
</DemoBlock>

### 月度经营例会：销售额与毛利率

办公月报的另一个高频组合：柱子看卖了多少，线看赚得厚不厚——毛利率下滑而销售额上涨的月份，往往是促销换量，图上一眼可见。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'mixed',
      title: '销售额与毛利率',
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      series: [
        { name: '销售额（万）', data: [168, 142, 195, 210, 265, 248], chartType: 'bar', yAxis: 'left' },
        { name: '毛利率（%）', data: [32, 28, 31, 26, 22, 29], chartType: 'line', yAxis: 'right' },
      ],
      yAxisRight: { show: true },
      legend: { show: true },
    }"
    :height="280"
  />
</DemoBlock>

## 配置要点

- 系列命名带单位（「营收（万）」「增长率（%）」），读图不歧义；
- 左轴给量、右轴给率是约定俗成的位次，读者不用对图例猜轴；
- 固定量纲可用 `yAxis: { min, max }` 与 `yAxisRight: { min, max }` 各自定标，避免正负率把量的柱子压扁；
- 交互（图例点选、tooltip、缩放）与其他直角坐标系图一致，见[交互与联动](/chart/interaction)。

## 相关

- [柱状图](/chart/bar) · [折线图](/chart/line) · [瀑布图](/chart/waterfall)
- [AI 生成](/guide/ai)（量级悬殊自动切双轴）
- [API 参考](/chart/api)
