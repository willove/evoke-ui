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

### 校招招聘漏斗

HR 的年度复盘图：从简历到 Offer 每一层的「漏损率」直接暴露招聘瓶颈在筛简历还是在终面。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'funnel',
      title: '2026 校招转化',
      funnelData: [
        { label: '收到简历', value: 4860 },
        { label: '笔试通过', value: 1620 },
        { label: '初面通过', value: 760 },
        { label: '终面通过', value: 285 },
        { label: '接受 Offer', value: 212 },
      ],
    }"
    :height="280"
  />
</DemoBlock>

### 线索到回款

销售运营的结算口径：市场线索一路走到财务回款，用漏斗对齐市场、销售、财务三个团队的共同语言——每层转化率就是团队的 KPI。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'funnel',
      title: 'Q3 线索到回款（个）',
      funnelData: [
        { label: '市场线索', value: 2400 },
        { label: '有效商机', value: 980 },
        { label: '方案报价', value: 460 },
        { label: '签约', value: 238 },
        { label: '财务回款', value: 205 },
      ],
    }"
    :height="280"
  />
</DemoBlock>

## 配置要点

- 段内两行标签（名称 + 数值占比）在梯形与层高放得下时自动内嵌；放不下自动转
  右侧引线标签，纵向 36px 最小步进防重叠；
- 标签随进度平滑淡入，形状展开带缓动收尾；
- `funnelData` 按流程顺序排列，漏斗形状自动生成；
- 悬浮显示每层数值，配合图例交互；
- 相邻层差值即"流失"，需要更强对比时可两条漏斗并排放。

## 相关

- [环形图](/chart/doughnut) · [柱状图](/chart/bar)
- [API 参考](/chart/api)
