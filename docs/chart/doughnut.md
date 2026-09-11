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

## 配置要点

- 悬浮扇区放大强调，图例点选显隐；
- 需要放大占比差距的对比感时用[玫瑰图](/chart/rose)；
- 构成随时间变化用[堆叠柱状图](/chart/stacked-bar)更有信息量。

## 相关

- [饼图](/chart/pie) · [玫瑰图](/chart/rose) · [漏斗图](/chart/funnel)
- [API 参考](/chart/api)
