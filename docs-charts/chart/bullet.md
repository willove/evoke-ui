# 子弹图 bullet

一条横向条带同时表达**实际值**与**目标线**：条长是实际完成，标记线是目标。比仪表盘省空间，适合一屏铺开多个 KPI 的达成视图。

## 何时使用

- 多个 KPI 同时展示，且每个都有"目标值"；
- 看板空间紧张，横向条带比圆盘仪表盘密度高得多；
- 只有单指标、没有目标概念时，[仪表盘](/chart/gauge)或[迷你趋势图](/chart/sparkline)更合适。

## 示例

专属数据字段 `bulletData`（`{ name, value, target? }`），`target` 缺省时不画目标线。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'bullet',
      title: '季度 KPI 达成',
      bulletData: [
        { name: '营收', value: 860, target: 1000 },
        { name: '新增客户', value: 342, target: 300 },
        { name: '续费率', value: 88, target: 90 },
      ],
    }"
    :height="240"
  />
</DemoBlock>

### 部门季度经营盘

一屏铺开全公司的季度达成：营收、毛利、人效各带目标线——经营会上从上往下扫一遍，哪条线没达标清清楚楚。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'bullet',
      title: 'Q3 部门经营达成',
      bulletData: [
        { name: '销售额（万）', value: 866, target: 800 },
        { name: '毛利（万）', value: 312, target: 350 },
        { name: '新增客户', value: 47, target: 40 },
        { name: '回款率（%）', value: 93, target: 95 },
      ],
    }"
    :height="240"
  />
</DemoBlock>

### 基金定投进度

理财场景：今年的定投计划过半，三条子弹图分别是权益、债券、黄金三笔计划的「已投 vs 全年目标」——不用翻账单就知道哪笔计划落后了。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'bullet',
      title: '2026 定投计划进度（元）',
      bulletData: [
        { name: '权益定投', value: 45600, target: 60000 },
        { name: '债券定投', value: 21800, target: 24000 },
        { name: '黄金积存', value: 9600, target: 12000 },
      ],
    }"
    :height="220"
  />
</DemoBlock>

## 配置要点

- `target` 是可选项：有目标的 KPI 才传；
- 条带数值可统一用 `valueFormat` 格式化；
- 超额完成与未达成的视觉对比由配色自动处理，无需手工标色。

## 相关

- [仪表盘](/chart/gauge) · [条形图](/chart/horizontal-bar)
- [API 参考](/chart/api)
