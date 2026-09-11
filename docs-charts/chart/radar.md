# 雷达图 radar

多维能力的框架化对比：每个维度一条轴，多系列叠在同一框架上直接比"形状"。团队能力评估、产品多维打分、版本能力对比的标准用图。

## 何时使用

- 维度 4-8 个、各有独立量纲但可归一到可比尺度；
- **多系列叠放对比**是核心用法（对比团队/方案/版本）；
- 单系列无对比时表达力有限，配合对比对象使用更好。

## 示例

`radarIndicators` 声明维度（`name` 维度名、`max` 上限、`min` 可选下限），`radarSeries` 声明系列（`data` 与 indicators 顺序对应，`area: false` 可关闭填充面）。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'radar',
      title: '团队能力评估',
      radarIndicators: [
        { name: '销售', max: 100 },
        { name: '技术', max: 100 },
        { name: '运营', max: 100 },
        { name: '服务', max: 100 },
        { name: '财务', max: 100 },
      ],
      radarSeries: [
        { name: '团队 A', data: [85, 70, 90, 78, 66] },
        { name: '团队 B', data: [70, 88, 72, 85, 74] },
      ],
      legend: { show: true },
    }"
    :height="300"
  />
</DemoBlock>

## 配置要点

- 各维度的 `max` 按业务合理设定，量纲不一致是雷达图最常见的失真来源；
- 维度超过 8 个会互相穿插，先做归并；
- 某个系列只要轮廓不要填充面：该系列传 `area: false`。

## 相关

- [柱状图](/chart/bar)（维度少时更精确） · [混合图](/chart/mixed)
- [API 参考](/chart/api)
