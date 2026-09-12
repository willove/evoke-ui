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
  <ev-chart
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

### 百分比直读

汇报场景里读者只关心份额，开启 `piePercentMode` 让每个扇区直接标注百分比，省掉心算。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'pie',
      title: '月度支出构成',
      pieData: [
        { name: '住房', value: 4200 },
        { name: '餐饮', value: 2600 },
        { name: '交通', value: 900 },
        { name: '教育', value: 1500 },
        { name: '娱乐', value: 800 },
      ],
      piePercentMode: true,
    }"
    :height="280"
  />
</DemoBlock>

### 长尾归并

类目一多必然出现碎片小扇区，`pieHideThreshold`（百分比阈值）把小于阈值的项自动归并成「其他」，图面立刻干净——总量与大盘读数不受影响。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'pie',
      title: '各机型激活量占比',
      pieData: [
        { name: '旗舰 A 系列', value: 4820 },
        { name: '旗舰 Pro 系列', value: 2510 },
        { name: '中端 X 系列', value: 1130 },
        { name: '入门 E1', value: 260 },
        { name: '入门 E2', value: 140 },
        { name: '运营商定制', value: 95 },
        { name: '海外特供', value: 60 },
      ],
      pieHideThreshold: 6,
    }"
    :height="280"
  />
</DemoBlock>

### 家族选型

- 只看扁平构成、要精确读占比 → **饼图 / [环形图](/chart/doughnut)**（角度即份额）；
- 类目量级差异大、要视觉冲击 → [玫瑰图](/chart/rose)（半径也编码数值，占比读数会失真）；
- 数据有**父子包含关系** → [旭日图](/chart/sunburst) / [矩形树图](/chart/treemap)；
- 构成要随时间变化对比 → [堆叠柱状图](/chart/stacked-bar)。

## 配置要点

- 悬浮展示单项名称与数值，图例点选可隐藏某一块；
- 需要突出总量、视觉更收敛时用[环形图](/chart/doughnut)；
- 需要放大占比差距时用[玫瑰图](/chart/rose)；
- 值格式化：`valueFormat: { suffix: '%' }` 等对悬浮数值生效。

## 相关

- [环形图](/chart/doughnut) · [玫瑰图](/chart/rose) · [漏斗图](/chart/funnel)
- [API 参考](/chart/api)
