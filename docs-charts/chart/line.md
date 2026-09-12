# 折线图 line

看指标随时间（或有序类目）的走势，多系列叠在一张图上做趋势对比——最常用的图表类型。

## 何时使用

- 关注**趋势走向**而非单点数值；
- 需要多组指标在同一时间轴上对比（新增 vs 留存等）；
- 时间点连续且有序；数据点稀疏（< 10 个）且强调单独数值时柱状图更合适。

## 示例

`labels` 是 x 轴类目（通常是时间），`series` 每项一条线；多系列自动出现图例，点击图例可显隐对应系列，悬浮出现 tooltip。

<DemoBlock>
  <ev-chart
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

趋势类数据想要柔和的观感时，给系列加 `smooth: true`：单调三次插值平滑，曲线仍过每个数据点且不过冲。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'line',
      title: '平滑曲线（smooth: true）',
      labels: ['周一', '周二', '周三', '周四', '周五'],
      series: [
        { name: '自然流量', data: [120, 132, 101, 134, 90], smooth: true },
        { name: '广告投放', data: [80, 92, 91, 94, 70], smooth: true },
      ],
      legend: { show: true },
    }"
    :height="260"
  />
</DemoBlock>

## 叙述注解

注解是数据的旁白：交代峰谷原因、圈出关注区间、给出结论数字——读图的人不用悬浮就能拿到叙事。单图注解控制在三处以内，旁白才有重点。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'line',
      title: '新增用户走势',
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'],
      series: [
        { name: '新增用户', data: [320, 356, 401, 388, 425, 520, 486, 560] },
        { name: '活跃用户', data: [280, 302, 346, 331, 352, 428, 405, 466] },
      ],
      annotations: [
        { type: 'region', from: '3月', to: '5月', label: '观察期' },
        { type: 'callout', x: '6月', y: 520, label: '618 活动拉新', anchor: 'top-right' },
        { type: 'delta', x: '8月', y: 560, direction: 'up', text: '环比 +15%' },
      ],
      emphasis: { series: '新增用户', dimOthers: true },
      legend: { show: true },
    }"
    :height="300"
  />
</DemoBlock>

- `region` 圈出关注区间，`callout` 旁注配虚线引线指向数据点，`delta` 给涨跌结论（涨跌色与 K 线同一套约定）；
- 聚焦某一个系列、弱化其余，用 `emphasis`；字段速查见 [API 参考](/chart/api)。

## 配置要点

- 系列颜色可逐项指定：`series` 项传 `color`；
- 需要强调量的填充改用[面积图](/chart/area)；
- 对比两组图时固定量纲：`yAxis: { min, max }`；
- 数据点密集时开 `dataZoom` 缩放，见[交互与联动](/chart/interaction)；
- 折线默认只画线条不画数据点（云监控式纯线条）；点位稀疏、需要强调单点读数时给系列加 `showSymbol: true`；
- 线宽由 `lineWidth` 控制（默认 1.5），监控类小图可压到 1.25；
- 数值统一格式化：`valueFormat: { decimals, thousandSeparator }`。

## 相关

- [面积图](/chart/area)（带量的趋势） · [迷你趋势图](/chart/sparkline)（嵌卡片的无轴趋势）
- [API 参考](/chart/api)
