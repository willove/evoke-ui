# 散点图 scatter

自由坐标的表达：每个点是独立的 `(x, y)`，看**两个变量的相关性**与点云形态。广告投入 vs 转化、房价 vs 距离等关系问题的首选；本页同时覆盖四象限、回归线、分面与散点矩阵等进阶形态。

## 何时使用

- 两轴都不是类目，而是自由的数值坐标；
- 关心点云的整体走向（线性相关、聚簇、离群）；
- 需要第三个维度时用 `group` / `color` 通道区分，或改[热力图](/chart/heatmap)看密度。

## 示例

专属数据字段 `scatterData`（`{ x, y, label?, color?, group?, size? }`），不依赖 `labels` 类目基线。

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

### 基金风险-收益分布（回归线 + 点标注）

选基的经典一图：横轴波动率（风险）、纵轴年化收益——**左上角的基金最优秀**。`scatterTrendline: 'linear'` 画线性回归线并标注 R²，`pointLabels: true` 让每只基金署名。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'scatter',
      title: '候选基金 · 风险与收益',
      scatterTrendline: 'linear',
      pointLabels: true,
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

### 四象限：各部门人效分布

`quadrant` 以数据均值（或显式 `xMid` / `yMid`）画十字参考线，四角标签随 `labels` 数组落位——「高效区 / 加麻加不动区」直接写在图上。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'scatter',
      title: '各部门人效（近一季）',
      quadrant: { labels: ['高效产出', '高投入高产出', '低投入观察', '投入回报待改善'] },
      scatterData: [
        { x: 152, y: 86, label: '研发·甲组', group: '研发' },
        { x: 168, y: 92, label: '研发·乙组', group: '研发' },
        { x: 140, y: 74, label: '产品', group: '职能' },
        { x: 175, y: 60, label: '运营', group: '职能' },
        { x: 132, y: 68, label: '设计', group: '职能' },
        { x: 160, y: 80, label: '测试', group: '研发' },
      ],
    }"
    :height="300"
  />
</DemoBlock>

### 颜色通道分组 + 分组回归线

点带 `group` 字段时自动按组取系列色、图例按组聚合（点选整组显隐）；`trendlinePerGroup: true` 时每组各画一条回归线、各标各的 R²。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'scatter',
      title: '投放渠道 · 花费与转化（分渠道回归）',
      scatterTrendline: 'linear',
      trendlinePerGroup: true,
      scatterData: [
        { x: 12, y: 32, group: '信息流' }, { x: 25, y: 58, group: '信息流' },
        { x: 40, y: 92, group: '信息流' }, { x: 55, y: 121, group: '信息流' },
        { x: 10, y: 22, group: '搜索' }, { x: 24, y: 48, group: '搜索' },
        { x: 38, y: 70, group: '搜索' }, { x: 52, y: 95, group: '搜索' },
      ],
    }"
    :height="300"
  />
</DemoBlock>

### 抖动防重叠

同值点挤在一起时加 `jitter`（0–20px）做确定性偏移：同数据同偏移、刷新不跳，点云分布立刻清晰。适合问卷评分、考试成绩这类大量重合的整数数据。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'scatter',
      title: '两个班 · 数学成绩分布（jitter 前后对比）',
      jitter: 9,
      scatterData: [
        { x: 1, y: 72 }, { x: 1, y: 72 }, { x: 1, y: 72 }, { x: 1, y: 75 },
        { x: 2, y: 80 }, { x: 2, y: 80 }, { x: 2, y: 83 }, { x: 2, y: 83 },
        { x: 3, y: 88 }, { x: 3, y: 90 }, { x: 3, y: 90 }, { x: 3, y: 92 },
        { x: 4, y: 60 }, { x: 4, y: 65 }, { x: 4, y: 66 }, { x: 4, y: 66 },
      ],
    }"
    :height="280"
  />
</DemoBlock>

## 分面散点

`facet: true` + `group` 字段：按组切成小倍数网格，**每格独立量程**、自带迷你刻度与格标题，组间对比不用再挪视线对齐坐标。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'scatter',
      title: '新旧两版落地页 · 停留与转化',
      facet: true,
      scatterData: [
        { x: 8, y: 2.1, group: '旧版' }, { x: 15, y: 3.4, group: '旧版' },
        { x: 22, y: 4.2, group: '旧版' }, { x: 30, y: 3.8, group: '旧版' },
        { x: 8, y: 3.6, group: '新版' }, { x: 15, y: 5.8, group: '新版' },
        { x: 22, y: 6.4, group: '新版' }, { x: 30, y: 5.2, group: '新版' },
      ],
    }"
    :height="300"
  />
</DemoBlock>

## 散点矩阵

`type: 'scatter-matrix'`：`matrixFields` 的每个字段对生成一格散点（对角格为字段名），一图看完**多变量两两相关性**——强相关的格子自然呈线性带。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'scatter-matrix',
      title: '二手房数据 · 变量相关性矩阵',
      matrixFields: ['面积', '总价', '距地铁'],
      matrixData: [
        { 面积: 58, 总价: 305, 距地铁: 1.2, label: '甲小区' },
        { 面积: 76, 总价: 420, 距地铁: 0.6, label: '乙小区' },
        { 面积: 92, 总价: 540, 距地铁: 1.8, label: '丙小区' },
        { 面积: 108, 总价: 610, 距地铁: 0.9, label: '丁小区' },
        { 面积: 64, 总价: 330, 距地铁: 2.4, label: '戊小区' },
        { 面积: 120, 总价: 760, 距地铁: 0.3, label: '己小区' },
        { 面积: 88, 总价: 498, 距地铁: 1.5, label: '庚小区' },
        { 面积: 70, 总价: 372, 距地铁: 3.0, label: '壬小区' },
      ],
    }"
    :height="420"
  />
</DemoBlock>

## 配置要点

- 点数上万时散点会互相重叠，此时改[热力图](/chart/heatmap)看密度更有效；
- `color` 可给点着色分组；带 `group` 字段时图例自动按组聚合、点选整组显隐；
- 每个点的 `label` 进入点标注（`pointLabels: true`）与图例，悬浮 tooltip 展示坐标；
- `scatterTrendline` 支持 `'linear' | 'poly' | 'exp'`；线性回归自动标注 R²；
- `quadrant.labels` 顺序为 左上 / 右上 / 左下 / 右下；中线缺省取数据均值。

## 相关

- [热力图](/chart/heatmap) · [直方图](/chart/bin) · [箱线图](/chart/boxplot)
- [API 参考](/chart/api)
