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

## 配置要点

- `target` 是可选项：有目标的 KPI 才传；
- 条带数值可统一用 `valueFormat` 格式化；
- 超额完成与未达成的视觉对比由配色自动处理，无需手工标色。

## 相关

- [仪表盘](/chart/gauge) · [条形图](/chart/horizontal-bar)
- [API 参考](/chart/api)
