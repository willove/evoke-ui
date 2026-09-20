# 三维散点图 scatter3d

空间点云看分布。支持两种数据形态：`[x, y, z]` 三元组（三轴全数值）与类目模式
（labels + 标量系列，与柱状图同构）；`colorScale` 可把 Z 值编码到连续色带上，
在三维位置之外再表达一维信息。

## 何时使用

- 样本有两个自变量和一个因变量，要看分布与聚集；
- 想用颜色再编码一个维度（第四维）；
- 聚类、离群点、相关性初探。

## 示例

三元组 + 色带编码 Z 值：

<DemoBlock>
  <ev-chart3d
    :options="{
      type: 'scatter3d',
      title: '样本分布 · 颜色=强度',
      scatterData: [
        [1, 1, 3], [1.6, 2.2, 6], [2.6, 1.4, 4], [3.2, 3, 8],
        [4, 2.4, 5.5], [4.6, 3.4, 9], [5.2, 1.8, 4.8], [6, 2.8, 7],
        [3, 4, 6.4], [5, 4.4, 3.6], [1.8, 3.6, 5], [4.2, 0.8, 6.8],
        [2.2, 0.6, 2.2], [3.8, 1.2, 7.4], [5.6, 2, 8.2], [0.8, 3, 4.2]
      ],
      scatter: { size: 6, colorScale: 'heat' },
      zAxis: { name: '强度' }
    }"
    :height="360"
  />
</DemoBlock>

类目模式（labels + 标量系列，散点按系列分层）：

<DemoBlock>
  <ev-chart3d
    :options="{
      type: 'scatter3d',
      title: '各渠道满意度分布',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        { name: '线上', data: [72, 78, 81, 85] },
        { name: '门店', data: [80, 79, 83, 82] },
        { name: '电话', data: [65, 70, 68, 74] }
      ],
      scatter: { size: 7, dropLines: true }
    }"
    :height="340"
  />
</DemoBlock>

## 配置要点

- `scatter.colorScale`：`true` 用默认色带，或填色带 id；开启后图例区换成连续色标；
- `scatter.dropLines`（默认开）：每个点的落地虚线，帮助定位高度；点数过万建议关闭；
- `scatter.depthScale`（默认开）：远处的点更小，增强透视感；需要等大点时关闭；
- `scatter.size`：点半径（px），悬浮命中区比视觉半径更大，细点也好悬停。

## 相关

- 色带与色标：[主题接入](/guide/theme)
- 曲面形态：[三维曲面图](/chart/surface3d)
- 字段细节：[API 参考](/chart/api)
