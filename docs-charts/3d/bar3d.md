# 三维柱状图 bar3d

类目 × 系列的数值矩阵立在网格上：x 轴类目、进深方向堆系列、柱高即数值，转动视角可从
任意角度对比组内与组间。

## 何时使用

- 多系列多类目，既要组内对比又要整体形体感；
- 汇报、大屏等需要「一眼立体」的场景；
- 需要逐格精确读数、类目很多时，[二维柱状图](/chart/bar)通常更合适。

## 示例

基础分组柱林：

<DemoBlock>
  <ev-chart3d
    :options="{
      type: 'bar3d',
      title: '季度出货量',
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      series: [
        { name: '华东', data: [420, 380, 500, 460, 540, 610] },
        { name: '华南', data: [300, 340, 320, 410, 390, 450] },
        { name: '西南', data: [180, 220, 260, 240, 300, 280] }
      ],
      zAxis: { name: '出货量（件）' }
    }"
    :height="360"
  />
</DemoBlock>

柱体瘦一些、配背墙增强深度参照：

<DemoBlock>
  <ev-chart3d
    :options="{
      type: 'bar3d',
      title: '渠道月度签单',
      labels: ['华东', '华南', '华北', '西南', '东北'],
      series: [
        { name: '新签', data: [86, 62, 74, 41, 28] },
        { name: '续约', data: [64, 58, 66, 35, 30] }
      ],
      bar: { width: 0.42, depth: 0.42 },
      box: { walls: 'all' },
      zAxis: { name: '金额（万）' }
    }"
    :height="340"
  />
</DemoBlock>

## 配置要点

- `bar.width` / `bar.depth`：柱体占带位的比例（0–1），多系列密排时调小防拥挤；
- `bar.shadow: false` 关掉柱底贴地阴影；
- 缺失值（null / NaN）不占位，零值柱保留；
- 数值轴名写进 `zAxis.name`，轴名会在防碰撞后贴在刻度外侧。

## 相关

- 相机与事件：[相机与交互](/3d/camera)
- 换色系：[主题接入](/3d/theme)
- 字段细节：[API 参考](/3d/api)
