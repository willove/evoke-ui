# 柱状图 bar

分类之间比大小的默认选择：x 轴是类目，柱高即数值；多系列自动分组并列，做组内对比。

## 何时使用

- 类目数量有限（< 12 个）且要**精确比较**各分类数值；
- 多系列做分组对比（如各渠道 × 各季度）；
- 类目名很长时改用[条形图](/chart/horizontal-bar)；
- 类目是时间轴且关注趋势时改用[折线图](/chart/line)。

## 示例

<DemoBlock>
  <ec-chart
    :options="{
      type: 'bar',
      title: '季度营收',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [{ name: '营收（万）', data: [320, 402, 361, 490] }],
    }"
    :height="260"
  />
</DemoBlock>

多系列时自动分组并列：

<DemoBlock>
  <ec-chart
    :options="{
      type: 'bar',
      title: '各季度分渠道营收',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        { name: '线上', data: [180, 224, 201, 290] },
        { name: '线下', data: [140, 178, 160, 200] },
      ],
      legend: { show: true },
    }"
    :height="260"
  />
</DemoBlock>

## 配置要点

- 数值格式化：`valueFormat: { thousandSeparator: true, suffix: '万' }`；
- 看构成而不是对比，改[堆叠柱状图](/chart/stacked-bar)；
- 与增长率同图展示，用[混合图](/chart/mixed)。

## 相关

- [堆叠柱状图](/chart/stacked-bar) · [条形图](/chart/horizontal-bar) · [瀑布图](/chart/waterfall)
- [API 参考](/chart/api)
