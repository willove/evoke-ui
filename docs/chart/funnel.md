# 漏斗图 funnel

流程逐层转化：从上到下逐层收窄，每层宽度即该环节数值。注册转化、成交流程、招聘漏斗的标准表达。

## 何时使用

- 有明确的**流程顺序**（访问 → 注册 → 激活 → 付费）；
- 关心相邻环节的转化效率，哪一层"漏"得最厉害；
- 无顺序关系的占比对比不该用漏斗，改用[环形图](/chart/doughnut)。

## 示例

专属数据字段 `funnelData`（`{ label, value }` 数组），按数组顺序自上而下排列。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'funnel',
      title: '注册转化漏斗',
      funnelData: [
        { label: '访问', value: 1000 },
        { label: '注册', value: 620 },
        { label: '激活', value: 380 },
        { label: '付费', value: 160 },
      ],
    }"
    :height="260"
  />
</DemoBlock>

## 配置要点

- `funnelData` 按流程顺序排列，漏斗形状自动生成；
- 悬浮显示每层数值，配合图例交互；
- 相邻层差值即"流失"，需要更强对比时可两条漏斗并排放。

## 相关

- [环形图](/chart/doughnut) · [柱状图](/chart/bar)
- [API 参考](/chart/api)
