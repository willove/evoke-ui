# 环形图 doughnut

中后台最常用的占比图：中间留白降低视觉压迫，整体比饼图更收敛现代。与饼图同源，`pieData` 驱动。

## 何时使用

- 同饼图：类目少、构成占比之和有意义；
- 看板空间紧凑、多张占比图并排时的默认选择；
- 中间留白还可叠放总量数字（绝对定位文本）。

## 示例

把 `type` 从 `pie` 换成 `doughnut`，其余配置完全一致。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'doughnut',
      title: '渠道分布',
      pieData: [
        { name: '直接访问', value: 335 },
        { name: '搜索引擎', value: 410 },
        { name: '外部引流', value: 274 },
        { name: '社群裂变', value: 189 },
      ],
    }"
    :height="260"
  />
</DemoBlock>

### 中心 KPI 环

环形图的留白不该浪费：`innerRadius` 调整环厚，配合 `#overlay` 作用域插槽在正中放结论数字——一眼看到「总量 + 构成」两层信息。这是环形图相对饼图最实用的形态。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'doughnut',
      pieData: [
        { name: '研发', value: 420 },
        { name: '市场', value: 380 },
        { name: '运营', value: 180 },
        { name: '行政', value: 120 },
      ],
      innerRadius: 0.72,
      legend: { show: false },
      piePercentMode: true,
    }"
    :height="260"
  >
    <template #overlay>
      <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: 600; color: var(--ev-text-color-primary, #111827);">¥1,100万</div>
          <div style="font-size: 12px; color: var(--ev-text-color-secondary, #6b7280);">Q2 预算执行</div>
        </div>
      </div>
    </template>
  </ev-chart>
</DemoBlock>

### 聚焦主分片

汇报里只需要读者记住一件事时，用 `emphasis` 把主分片以外的部分压暗——结论不用讲，图自己会说。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'doughnut',
      title: '会员构成',
      pieData: [
        { name: '连续包年', value: 6200 },
        { name: '年费会员', value: 3100 },
        { name: '季费会员', value: 1400 },
        { name: '月费会员', value: 900 },
      ],
      emphasis: { series: '连续包年', dimOthers: true },
    }"
    :height="260"
  />
</DemoBlock>

### 与饼图怎么选

两者读数方式完全一致，差异只在形态：环形图中心留白能承载 KPI 数字、多张并排更收敛，是中后台默认；饼图扇区面积更大，投影或印刷场景读起来更清楚。**环画不了两层**——数据有父子层级时请改用[旭日图](/chart/sunburst)。

## 配置要点

- 悬浮扇区放大强调，图例点选显隐；
- 需要放大占比差距的对比感时用[玫瑰图](/chart/rose)；
- 构成随时间变化用[堆叠柱状图](/chart/stacked-bar)更有信息量。

## 相关

- [饼图](/chart/pie) · [玫瑰图](/chart/rose) · [漏斗图](/chart/funnel)
- [API 参考](/chart/api)
