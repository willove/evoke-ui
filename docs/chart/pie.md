# 饼图 pie

构成占比的经典表达：扇区角度即占比，悬浮扇区自动放大强调，配合图例点选可看单项。

## 何时使用

- 类目少（建议 ≤ 6 个）、占比之和有意义（构成整体）；
- 想突出"某一块占了大头"的直觉印象；
- 类目多、彼此占比接近时饼图判读困难，改用[条形图](/chart/horizontal-bar)排序对比；
- 中后台看板更常用的收敛形态是[环形图](/chart/doughnut)。

## 示例

饼系专属数据字段 `pieData`（`{ name, value }` 数组），角度与百分比自动计算。

<DemoBlock>
  <ec-chart
    :options="{
      type: 'pie',
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

- 悬浮展示单项名称与数值，图例点选可隐藏某一块；
- 需要突出总量、视觉更收敛时用[环形图](/chart/doughnut)；
- 需要放大占比差距时用[玫瑰图](/chart/rose)；
- 值格式化：`valueFormat: { suffix: '%' }` 等对悬浮数值生效。

## 相关

- [环形图](/chart/doughnut) · [玫瑰图](/chart/rose) · [漏斗图](/chart/funnel)
- [API 参考](/chart/api)
