# 面积图 area

折线图的"强调量感"变体：折线下方填充渐变面，适合表达累计量、体量随时间的膨胀趋势。

## 何时使用

- 看趋势的同时想强调**数值规模**（如 DAU 总量、营收体量）；
- 单系列面积最清晰；多系列面积叠加时注意遮挡，系列多建议改用折线图。

## 示例

数据模型与折线图完全一致：`labels` + `series`，把 `type` 换成 `area` 即可。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'area',
      title: '周活趋势',
      labels: ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月'],
      series: [
        { name: '移动端', data: [820, 932, 901, 1090, 1290, 1330] },
        { name: '桌面端', data: [620, 711, 688, 820, 881, 932] },
      ],
      legend: { show: true },
    }"
    :height="260"
  />
</DemoBlock>

## 配置要点

- `series` 项同样支持 `color` 指定主色，面积渐变随主色生成；
- 系列多、互相遮挡时回退[折线图](/chart/line)；
- 固定量纲对比：`yAxis: { min: 0, max: n }`。

## 相关

- [折线图](/chart/line) · [堆叠柱状图](/chart/stacked-bar)（构成对比）
- [API 参考](/chart/api)
