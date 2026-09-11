# 混合图 mixed

同一坐标系里线柱混排（双轴）：量画柱、率画线，一眼同时看"规模"与"变化率"，营销复盘、经营月报的常客。

## 何时使用

- 两个指标的**量纲不同**（营收万元 vs 增长率 %）但想对齐同一时间轴；
- 一个指标看量、一个指标看趋势率；
- 两指标量纲相同时，直接用[柱状图](/chart/bar)或[折线图](/chart/line)即可。

## 示例

沿用 `labels` + `series`：`type: 'mixed'` 时引擎自动按语义分配柱与线的表达，多系列图例照常可点选。

<DemoBlock>
  <ec-chart
    :options="{
      type: 'mixed',
      title: '营收与增长率',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        { name: '营收（万）', data: [320, 402, 361, 490] },
        { name: '增长率（%）', data: [12, 26, -10, 36] },
      ],
      legend: { show: true },
    }"
    :height="260"
  />
</DemoBlock>

## 配置要点

- 系列命名带单位（"营收（万）"、"增长率（%）"），读图不歧义；
- 固定量纲可用 `yAxis: { min, max }`，避免正负率把量的柱子压扁；
- 交互（图例点选、tooltip、缩放）与其他直角坐标系图一致，见[交互与联动](/chart/interaction)。

## 相关

- [柱状图](/chart/bar) · [折线图](/chart/line) · [瀑布图](/chart/waterfall)
- [API 参考](/chart/api)
