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

### 基金风险-收益分布

选基的经典一图：横轴波动率（风险）、纵轴年化收益——**左上角的基金最优秀**（低风险高收益），右下角直接排除。每只基金一个点，`label` 写基金名，悬浮即读。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'scatter',
      title: '候选基金 · 风险与收益',
      scatterData: [
        { x: 12.4, y: 9.8, label: '沪深300指数' },
        { x: 18.6, y: 15.2, label: '半导体主题' },
        { x: 8.2, y: 4.6, label: '短债基金' },
        { x: 22.1, y: 11.4, label: '医药主题' },
        { x: 15.3, y: 12.6, label: '消费主题' },
        { x: 5.1, y: 2.8, label: '货币增强' },
        { x: 16.8, y: 6.2, label: '红利低波' },
        { x: 25.4, y: 18.9, label: '新能源车' },
      ],
    }"
    :height="300"
  />
</DemoBlock>

### 团队人效分布

办公场景：横轴人均工时、纵轴人均产出，四个部门各成点簇——哪个部门在「高效区」、哪个在「加麻加不动区」，一图定调。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'scatter',
      title: '各部门人效（近一季）',
      scatterData: [
        { x: 152, y: 86, label: '研发·甲组' },
        { x: 168, y: 92, label: '研发·乙组' },
        { x: 140, y: 74, label: '产品' },
        { x: 175, y: 60, label: '运营' },
        { x: 132, y: 68, label: '设计' },
        { x: 160, y: 80, label: '测试' },
      ],
    }"
    :height="280"
  />
</DemoBlock>

## 配置要点

- 点数上万时散点会互相重叠，此时改[热力图](/chart/heatmap)看密度更有效；
- `color` 可给点着色分组，配合图例判读；
- 悬浮 tooltip 展示点的坐标与 `label`。

## 相关

- [热力图](/chart/heatmap) · [直方图](/chart/bin)
- [API 参考](/chart/api)
