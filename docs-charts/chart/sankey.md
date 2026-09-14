# 桑基图 sankey

能量、资金、流量的**守恒流动**：节点分列排布，流带宽度即流量，一眼看出「从哪来、到哪去、谁是大头」。能源结构分析、成本构成追踪、用户路径转化的首选。

## 何时使用

- 数据是「源 → 转换 → 汇」的多级流动，且**流量守恒**（流出之和 ≈ 流入之和）；
- 关心每条路径的占比与去向，而不是单点数值（那用[柱状图](/chart/bar)）；
- 节点列数建议 2–4 列，流带数量建议 ≤ 30 条，再多读图成本陡增。

## 示例

专属数据字段 `sankeyData`（`{ nodes: [{ name }], links: [{ source, target, value }] }`）。节点 `value` 可省略，自动按链接汇总；流带颜色继承**源节点**色，同源同色不追色。

### 能源流动分析

省级能源结构的经典表达：三类一次能源 → 发电 / 供热两条转换路径 → 居民 / 工业两类终端。悬浮流带强调自身与同源同宿路径、淡化其余；悬浮节点高亮相连全部流带并汇总总流量。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'sankey',
      title: '全省能源流动（折标准煤 · 万吨）',
      sankeyData: {
        nodes: [
          { name: '煤炭' }, { name: '天然气' }, { name: '水电风电' },
          { name: '火力发电' }, { name: '清洁发电' }, { name: '集中供热' },
          { name: '居民用电' }, { name: '工业用电' },
        ],
        links: [
          { source: '煤炭', target: '火力发电', value: 420 },
          { source: '煤炭', target: '集中供热', value: 180 },
          { source: '天然气', target: '火力发电', value: 150 },
          { source: '天然气', target: '集中供热', value: 120 },
          { source: '天然气', target: '工业用电', value: 60 },
          { source: '水电风电', target: '清洁发电', value: 230 },
          { source: '火力发电', target: '工业用电', value: 380 },
          { source: '火力发电', target: '居民用电', value: 190 },
          { source: '清洁发电', target: '居民用电', value: 130 },
          { source: '清洁发电', target: '工业用电', value: 100 },
          { source: '集中供热', target: '居民用电', value: 300 },
        ],
      },
    }"
    :height="380"
  />
</DemoBlock>

### 用户旅程分流

从启动到付费的三步路径：每条流带的宽度就是「走这条路的人有多少」，流失发生在哪一段一图可见。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'sankey',
      title: '月度用户旅程（万人）',
      sankeyData: {
        nodes: [
          { name: '启动' }, { name: '注册' }, { name: '活跃' },
          { name: '付费' }, { name: '流失' },
        ],
        links: [
          { source: '启动', target: '注册', value: 86 },
          { source: '启动', target: '流失', value: 34 },
          { source: '注册', target: '活跃', value: 52 },
          { source: '注册', target: '流失', value: 34 },
          { source: '活跃', target: '付费', value: 18 },
          { source: '活跃', target: '流失', value: 34 },
        ],
      },
    }"
    :height="320"
  />
</DemoBlock>

## 配置要点

- 流带颜色继承源节点槽位色；`nodes[].color` / `links[].color` 可显式定色；
- 图例点选节点即隐去该节点与相连流带，剩余节点重新等比布局；
- 悬浮语义：流带 → 强调自身 + 同源同宿，其余淡出；节点 → 强调相连流带；
- 节点 `value` 缺省时按 `max(入流, 出流)` 自动汇总，一般不用手算；
- `sankey.nodeAlign` 定列对齐：`justify`（默认）末端节点贴右缘，`left` 按拓扑深度自然排布。

## 相关

- [弦图](/chart/chord) · [弧长连接图](/chart/arc)
- [API 参考](/chart/api)
