# 三维折线图 line3d

每条系列是一条悬浮在各自进深层上的空间折线。三维折线没有共同的基线参照，落地投影线
（竖直虚线 + 地面折线）随图内建，解决「一眼看不出高度」的读数问题。

## 何时使用

- 多测点、多组序列的走势对比，希望在一张图里保持空间分区；
- 展示「高度差」本身是信息的一部分（温度、水位、负载）；
- 单序列看趋势用[二维折线图](https://evoke-charts.wil-works.com/chart/line)更直接。

## 示例

多测点温度曲线，面带 + 落地投影默认开启：

<DemoBlock>
  <ev-chart3d
    :options="{
      type: 'line3d',
      title: '车间室温监测',
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      series: [
        { name: '车间 A', data: [18, 17.5, 21, 26, 27, 23] },
        { name: '车间 B', data: [16, 16.5, 19, 23, 24.5, 21] },
        { name: '库房', data: [12, 12, 13, 15, 16, 14] }
      ],
      line: { area: true, width: 2.6 },
      zAxis: { name: '温度 °C' }
    }"
    :height="360"
  />
</DemoBlock>

纯线条形态（关面带与投影，突出线本身）：

<DemoBlock>
  <ev-chart3d
    :options="{
      type: 'line3d',
      title: '三条响应时间序列',
      labels: ['P10', 'P25', 'P50', 'P75', 'P90', 'P99'],
      series: [
        { name: '网关', data: [12, 18, 26, 34, 48, 88] },
        { name: '服务', data: [8, 12, 19, 27, 39, 70] },
        { name: '存储', data: [4, 6, 9, 14, 22, 41] }
      ],
      line: { area: false, dropLines: false, width: 3 },
      zAxis: { name: '耗时 ms' }
    }"
    :height="340"
  />
</DemoBlock>

## 配置要点

- `line.dropLines`（默认开）：竖直虚线 + 地面折线，读数辅助；点太密时再关；
- `line.area`（默认关）：折线垂直落地形成的半透明面带；
- `line.points`（默认开）：数据点圆点，悬浮拾取的主要目标；
- 缺失值断线但不占位。

## 相关

- 相机与事件：[相机与交互](/guide/camera)
- 点云形态：[三维散点图](/chart/scatter3d)
- 字段细节：[API 参考](/chart/api)
