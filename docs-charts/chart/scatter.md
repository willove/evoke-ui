# 散点图 scatter

自由坐标的表达：每个点是独立的 `(x, y)`，看**两个变量的相关性**与点云形态。广告投入 vs 转化、房价 vs 距离等关系问题的首选。

## 何时使用

- 两轴都不是类目，而是自由的数值坐标；
- 关心点云的整体走向（线性相关、聚簇、离群）；
- 需要第三个维度时用点色（`color`）区分，或改[热力图](/chart/heatmap)看密度。

## 示例

专属数据字段 `scatterData`（`{ x, y, label?, color? }`），不依赖 `labels` 类目基线。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'scatter',
      title: '广告投入与转化关系',
      scatterData: [
        { x: 20, y: 32 }, { x: 35, y: 48 }, { x: 48, y: 60 }, { x: 52, y: 55 },
        { x: 66, y: 84 }, { x: 73, y: 90 }, { x: 81, y: 96 }, { x: 90, y: 118 },
        { x: 28, y: 40 }, { x: 44, y: 66 }, { x: 59, y: 71 }, { x: 78, y: 88 },
      ],
    }"
    :height="260"
  />
</DemoBlock>

## 配置要点

- 点数上万时散点会互相重叠，此时改[热力图](/chart/heatmap)看密度更有效；
- `color` 可给点着色分组，配合图例判读；
- 悬浮 tooltip 展示点的坐标与 `label`。

## 相关

- [热力图](/chart/heatmap) · [直方图](/chart/bin)
- [API 参考](/chart/api)
