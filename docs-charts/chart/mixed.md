# 混合图 mixed

同一坐标系里线柱混排（双轴）：量画柱、率画线，一眼同时看"规模"与"变化率"，营销复盘、经营月报的常客。

## 何时使用

- 两个指标的**量纲不同**（营收万元 vs 增长率 %）但想对齐同一时间轴；
- 一个指标看量、一个指标看趋势率；
- 两指标量纲相同时，直接用[柱状图](/chart/bar)或[折线图](/chart/line)即可。

## 示例

沿用 `labels` + `series`：`type: 'mixed'` 时系列项用 `chartType` 指定柱（`bar`）或线（`line`，默认），系列命名带单位避免读图歧义。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'mixed',
      title: '营收与增长率',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        { name: '营收（万）', data: [320, 402, 361, 490], chartType: 'bar' },
        { name: '增长率（%）', data: [12, 26, -10, 36] },
      ],
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
        { name: '基金份额（亿份）', data: [86, 102, 118, 135], chartType: 'bar' },
        { name: '期间收益率（%）', data: [4.2, -2.8, 6.5, 9.1] },
      ],
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
        { name: '销售额（万）', data: [168, 142, 195, 210, 265, 248], chartType: 'bar' },
        { name: '毛利率（%）', data: [32, 28, 31, 26, 22, 29] },
      ],
      legend: { show: true },
    }"
    :height="280"
  />
</DemoBlock>

## 配置要点

- 系列命名带单位（"营收（万）"、"增长率（%）"），读图不歧义；
- 固定量纲可用 `yAxis: { min, max }`，避免正负率把量的柱子压扁；
- 交互（图例点选、tooltip、缩放）与其他直角坐标系图一致，见[交互与联动](/chart/interaction)。

## 相关

- [柱状图](/chart/bar) · [折线图](/chart/line) · [瀑布图](/chart/waterfall)
- [API 参考](/chart/api)
