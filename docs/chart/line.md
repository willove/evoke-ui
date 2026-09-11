# 折线图 line

看指标随时间（或有序类目）的走势，多系列叠在一张图上做趋势对比——最常用的图表类型。

## 何时使用

- 关注**趋势走向**而非单点数值；
- 需要多组指标在同一时间轴上对比（新增 vs 留存等）；
- 时间点连续且有序；数据点稀疏（< 10 个）且强调单独数值时柱状图更合适。

## 示例

`labels` 是 x 轴类目（通常是时间），`series` 每项一条线；多系列自动出现图例，点击图例可显隐对应系列，悬浮出现 tooltip。

<DemoBlock>
  <ec-chart
    :options="{
      type: 'line',
      title: '渠道转化',
      labels: ['周一', '周二', '周三', '周四', '周五'],
      series: [
        { name: '自然流量', data: [120, 132, 101, 134, 90] },
        { name: '广告投放', data: [80, 92, 91, 94, 70] },
      ],
      legend: { show: true },
    }"
    :height="260"
  />
</DemoBlock>

## 配置要点

- 系列颜色可逐项指定：`series` 项传 `color`；
- 需要强调量的填充改用[面积图](/chart/area)；
- 对比两组图时固定量纲：`yAxis: { min, max }`；
- 数据点密集时开 `dataZoom` 缩放，见[交互与联动](/chart/interaction)；
- 数值统一格式化：`valueFormat: { decimals, thousandSeparator }`。

## 相关

- [面积图](/chart/area)（带量的趋势） · [迷你趋势图](/chart/sparkline)（嵌卡片的无轴趋势）
- [API 参考](/chart/api)
