# 仪表盘 gauge

单指标的"当前值 + 量程"表达：进度弧按当前值落点着色，一眼判断健康状态。CPU 使用率、完成率、水位线等 KPI 的标准形态。

## 何时使用

- 单指标、有明确量程与健康线（如 0-100，超过 85 报警）；
- 想给指标加"状态灯"语义（绿=正常 / 黄=预警 / 红=告警），而不只是读数；
- 一屏多个 KPI 且要带目标线时改用[子弹图](/chart/bullet)。

## 示例

`type: 'gauge'` 配合专属 `gauge` 对象：`value` 当前值，`min` / `max` 量程（默认 0-100），`unit` 单位文字，`showProgress` 控制进度弧（默认开启）。

`color` 传单色字符串；或传 `{ from, to, color }` 分段区间数组，按当前值落点自动取色——"状态灯"式健康度（绿/黄/红分段）的常用做法。

<DemoBlock>
  <ec-chart
    :options="{
      type: 'gauge',
      title: 'CPU 使用率',
      gauge: {
        value: 68,
        min: 0,
        max: 100,
        unit: '%',
        color: [
          { from: 0, to: 60, color: '#16a34a' },
          { from: 60, to: 85, color: '#d97706' },
          { from: 85, to: 100, color: '#dc2626' },
        ],
      },
    }"
    :height="280"
  />
</DemoBlock>

## 配置要点

- `gauge.startAngle` / `endAngle` 可调整弧的起止角度做半盘仪表；
- `showProgress: false` 关闭进度弧只留指针与刻度；
- 数据更新时进度弧自动补间过渡；
- 多 KPI 带目标线的场景改用[子弹图](/chart/bullet)。

## 相关

- [子弹图](/chart/bullet) · [迷你趋势图](/chart/sparkline)
- [API 参考](/chart/api)
