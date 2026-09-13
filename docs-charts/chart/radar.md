# 雷达图 radar

多维能力的框架化对比：每个维度一条轴，多系列叠在同一框架上直接比"形状"。团队能力评估、产品多维打分、版本能力对比的标准用图。

## 何时使用

- 维度 4-8 个、各有独立量纲但可归一到可比尺度；
- **多系列叠放对比**是核心用法（对比团队/方案/版本）；
- 单系列无对比时表达力有限，配合对比对象使用更好。

## 示例

`radarIndicators` 声明维度（`name` 维度名、`max` 上限、`min` 可选下限），`radarSeries` 声明系列（`data` 与 indicators 顺序对应，`area: false` 可关闭填充面）。

各维度同 `max` 时，最上轴旁自动标注环刻度数值，每环代表多少一望即知。

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

### 版本能力对比

雷达图最典型的场景：同一套维度比前后两个版本。填充用纵向浅渐变、叠加处不糊；需要强调关键顶点时给系列开 `showSymbol`。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'radar',
      title: 'v2.4 vs v2.5 能力评分',
      radarIndicators: [
        { name: '性能', max: 100 },
        { name: '易用性', max: 100 },
        { name: '文档', max: 100 },
        { name: '生态', max: 100 },
        { name: '稳定性', max: 100 },
        { name: '安全', max: 100 },
      ],
      radarSeries: [
        { name: 'v2.4', data: [72, 80, 64, 58, 90, 76], area: false, showSymbol: true },
        { name: 'v2.5', data: [88, 86, 82, 70, 92, 85] },
      ],
      legend: { show: true },
    }"
    :height="320"
  />
</DemoBlock>

### 轮廓线框版

只比形状不比量值时，关掉填充面就是干净的线框对照——六条边的高低走势一目了然，打印和深浅色背景下都清楚。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'radar',
      title: '三个候选方案画像',
      radarIndicators: [
        { name: '成本', max: 100 },
        { name: '周期', max: 100 },
        { name: '风险', max: 100 },
        { name: '收益', max: 100 },
        { name: '扩展性', max: 100 },
      ],
      radarSeries: [
        { name: '自建', data: [40, 30, 55, 88, 90], area: false },
        { name: '采购', data: [85, 90, 30, 60, 45], area: false },
        { name: '混合', data: [65, 70, 50, 75, 70], area: false },
      ],
      legend: { show: true },
    }"
    :height="320"
  />
</DemoBlock>

### 环底色与轴线联动

`radarRingFill: true` 在环带内交替铺极淡底色，「由内到外」的层次立刻可读。悬浮任一维度标签或轴顶点：该轴线点亮、维度名加粗、各系列在该维度的顶点画实心点——「这个维度谁强」顺着高亮轴一眼比对。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'radar',
      title: '三家供应商交付画像',
      radarRingFill: true,
      radarIndicators: [
        { name: '价格', max: 100 },
        { name: '交期', max: 100 },
        { name: '质量', max: 100 },
        { name: '售后', max: 100 },
        { name: '产能', max: 100 },
      ],
      radarSeries: [
        { name: '供应商 A', data: [82, 70, 90, 64, 88] },
        { name: '供应商 B', data: [68, 88, 72, 82, 60] },
      ],
      legend: { show: true },
    }"
    :height="320"
  />
</DemoBlock>

### 与条形图怎么选

维度 **≤ 4 个**或读者需要精确读数排序时，[条形图](/chart/horizontal-bar)更诚实——雷达图的角度占用不均、面积随维度数变化，天然不适合精确判读；它的价值在 5–8 个维度时「整体形状」的一眼对比。维度各自量纲差异大且无法归一时，也请回退条形图分面。

## 配置要点

- 各维度的 `max` 按业务合理设定，量纲不一致是雷达图最常见的失真来源；
- 维度超过 8 个会互相穿插，先做归并；
- 某个系列只要轮廓不要填充面：该系列传 `area: false`；
- `radarRingFill: true` 开环底色；悬浮维度标签 / 轴顶点 / 图例项均触发对应高亮（图例悬浮走全局焦点淡化）。

## 相关

- [柱状图](/chart/bar)（维度少时更精确） · [混合图](/chart/mixed)
- [API 参考](/chart/api)
