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
  <ev-chart
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

### 年度预算执行率

办公场景：Q4 最重要的数字之一。半盘仪表（`startAngle` / `endAngle` 调成 180°）更省纵向空间，红色预警段压在 95% 以上——超支前一眼可见。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'gauge',
      title: '年度预算执行率',
      gauge: {
        value: 78,
        min: 0,
        max: 100,
        unit: '%',
        showProgress: true,
        startAngle: Math.PI,
        endAngle: 0,
        color: [
          { from: 0, to: 80, color: '#16a34a' },
          { from: 80, to: 95, color: '#d97706' },
          { from: 95, to: 100, color: '#dc2626' },
        ],
      },
    }"
    :height="220"
  />
</DemoBlock>

### 房贷还款进度

生活场景：三十年贷款还了多少年、多少本金，进度弧本身就是一种安慰——搭配中心数字更有掌控感。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'gauge',
      title: '房贷还款进度',
      gauge: {
        value: 6.5,
        min: 0,
        max: 30,
        unit: '年',
        color: '#175DFF',
      },
    }"
    :height="260"
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
