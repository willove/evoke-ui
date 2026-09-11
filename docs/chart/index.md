# 图表总览与快速上手

EvChart 是 Evoke 生态的 Canvas 自绘图表引擎，来自独立包 `@wil-works/evoke-charts`（本站收录其文档，与组件库样式已打通主题适配）：零图表库依赖，ECharts 风格的 `options` 配置式声明，内置图例点选、tooltip、dataZoom 缩放、框选、联动与暗色模式；高清屏自动按 devicePixelRatio 渲染，数据变化时自动做数值补间动画，空数据、加载中与渲染错误均有内置占位。

> 在 evoke-business-ui 中使用时无需单独安装：组件库依赖本包并以 `<eb-chart>` 组件名提供，样式随 `@wil-works/evoke-charts/styles` 引入，主题/暗色自动跟随组件库。

<script setup>
import { ref, computed } from 'vue'

const dynType = ref('line')
const dynRound = ref(0)
const dynPool = [
  [
    { name: '自然流量', data: [120, 132, 101, 134, 90] },
    { name: '广告投放', data: [80, 92, 91, 94, 70] },
  ],
  [
    { name: '自然流量', data: [98, 156, 122, 168, 141] },
    { name: '广告投放', data: [65, 88, 130, 102, 117] },
  ],
  [
    { name: '自然流量', data: [140, 110, 166, 128, 152] },
    { name: '广告投放', data: [110, 76, 98, 143, 84] },
  ],
]
const dynOptions = computed(() => ({
  type: dynType.value,
  title: '运行时更新',
  labels: ['周一', '周二', '周三', '周四', '周五'],
  series: dynPool[dynRound.value % dynPool.length],
  legend: { show: true },
}))
function switchData() {
  dynRound.value++
}
function switchType() {
  dynType.value = dynType.value === 'line' ? 'bar' : 'line'
}
</script>

## 心智模型

一张图 = **选类型 → 给数据 → 调配置** 三步，全部收敛在一个 `options` 对象里：

```vue
<ev-chart
  :options="{
    type: 'bar',              // 1. 选类型
    title: '季度营收',
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],          // 2. 给数据（按类型选字段）
    series: [{ name: '营收（万）', data: [320, 402, 361, 490] }],
    legend: { show: true },   // 3. 调配置（图例 / tooltip / 轴 / 缩放…）
  }"
  :height="260"
/>
```

- **直角坐标系家族**（line / bar / area / stacked-bar / horizontal-bar / waterfall / mixed 等）共用 `labels` + `series` 数据模型；
- **饼系、雷达、仪表盘、散点、热力等**各有专属数据字段（`pieData`、`radarSeries`、`gauge`…），见[选型指南](#选型指南)；
- 所有类型共享图例、tooltip、动画、值格式化、主题等顶层配置。

## 选型指南

按"想回答什么问题"选图：

| 想回答的问题 | 推荐类型 |
| --- | --- |
| 趋势怎么走？多组趋势对比？ | [折线图](/chart/line) / [面积图](/chart/area) / [迷你趋势图](/chart/sparkline) |
| 分类之间比大小？构成怎么堆叠？ | [柱状图](/chart/bar) / [堆叠柱状图](/chart/stacked-bar) / [条形图](/chart/horizontal-bar) |
| 增减瀑布 / 多指标混合坐标？ | [瀑布图](/chart/waterfall) / [混合图](/chart/mixed) |
| 占比构成？部分与整体？ | [饼图](/chart/pie) / [环形图](/chart/doughnut) / [玫瑰图](/chart/rose) / [漏斗图](/chart/funnel) |
| 单指标完成得怎么样？ | [仪表盘](/chart/gauge) / [子弹图](/chart/bullet) |
| 两/三个变量有没有关系？密度在哪？ | [散点图](/chart/scatter) / [热力图](/chart/heatmap) |
| 数据分布、离群值？金融波动？ | [直方图](/chart/bin) / [箱线图](/chart/boxplot) / [K 线图](/chart/candle) |
| 层级构成怎么拆？多维能力对比？ | [矩形树图](/chart/treemap) / [旭日图](/chart/sunburst) / [雷达图](/chart/radar) |

每个类型都有独立的说明页（何时使用、示例、配置要点），从左侧导航或上表直达。

## 快速上手

一个最简单的折线图，`labels` 是 x 轴类目，`series` 每项是一条线：

<DemoBlock>
  <ev-chart
    :options="{
      type: 'line',
      title: '渠道转化',
      labels: ['周一', '周二', '周三', '周四', '周五'],
      series: [
        { name: '自然流量', data: [120, 132, 101, 134, 90] },
        { name: '广告投放', data: [80, 92, 91, 94, 70] },
      ],
    }"
    :height="260"
  />
</DemoBlock>

多系列自动出现图例，点击图例可显隐对应系列；悬浮出现 tooltip。

## 运行时更新

`options` 响应式变化后图表自动增量合并重绘：同结构数据走数值补间动画，而不是闪屏重绘；改 `type` 只需换一个字段，`labels` + `series` 数据模型完全复用——这是直角坐标系家族的通用红利。容器尺寸变化默认自动重绘（`responsive`，默认开启）。

<DemoBlock>
<div style="display:flex;gap:12px;margin-bottom:12px;">
  <ev-button @click="switchData">切换一组数据</ev-button>
  <ev-button type="primary" @click="switchType">line / bar 切换</ev-button>
</div>
<ev-chart :options="dynOptions" :height="260" />
</DemoBlock>

## 下一步

- 按数据形态挑图：左侧「图表类型」四个章节
- 图例、tooltip、缩放、联动、导出：[交互与联动](/chart/interaction)
- 完整字段与实例方法：[API 参考](/chart/api)
