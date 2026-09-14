# 弧长连接图 arc

线性排布的**两两关系**表达：节点沿横轴均布，关系画成上半椭圆弧，弧越粗关系越重。供应链供需、航线流量、人物关系这类「谁和谁有关系、关系有多重」的平面化读法——比环形弦图更贴近「左右两端」的直觉；需要闭合视角时一键切环形形态。

## 何时使用

- 数据是**成对关系**（A↔B 有往来），不是守恒流动（那用[桑基图](/chart/sankey)）；
- 节点有天然顺序（供应链上下游、流程阶段），线性轴正好承接；
- 关心「最强关系是哪几条」——线宽按关系值映射，粗细即重要度；
- 关系密集、想强调闭合回路时用环形形态（`arcCircular: true`）。

## 示例

数据字段 `arcData`（`{ nodes, links }`，与桑基同构）。节点均布水平轴、名称在轴下，连接为上半椭圆弧，弧高随节点距离自适应；线宽 1.5–6px 按关系值线性映射，颜色继承**源节点**色。

### 供应链供需关系

月度订单量沿「原料 → 总装 → 区域仓 → 门店」流动：跨过中间环节的直达关系（原料 A 直供门店）在弧上一眼可见，最粗的弧就是主干道。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'arc',
      title: '供应链供需关系（月度订单量）',
      arcData: {
        nodes: [
          { name: '原料A' }, { name: '原料B' }, { name: '总装厂' },
          { name: '区域仓' }, { name: '门店' },
        ],
        links: [
          { source: '原料A', target: '总装厂', value: 420 },
          { source: '原料B', target: '总装厂', value: 310 },
          { source: '总装厂', target: '区域仓', value: 520 },
          { source: '区域仓', target: '门店', value: 260 },
          { source: '原料A', target: '门店', value: 90 },
        ],
      },
    }"
    :height="300"
  />
</DemoBlock>

### 团队协作强度

悬浮某条弧：强调自身、淡化其余；悬浮节点：与它相连的全部弧一起点亮，「设计到底和谁协作最密」顺着颜色就能读。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'arc',
      title: '跨团队协作密度（次 / 季度）',
      arcData: {
        nodes: [
          { name: '研发' }, { name: '设计' }, { name: '产品' },
          { name: '市场' }, { name: '客服' },
        ],
        links: [
          { source: '研发', target: '设计', value: 46 },
          { source: '研发', target: '产品', value: 38 },
          { source: '设计', target: '产品', value: 30 },
          { source: '产品', target: '市场', value: 26 },
          { source: '市场', target: '客服', value: 34 },
        ],
      },
    }"
    :height="280"
  />
</DemoBlock>

### 环形弧长连接图

`arcCircular: true` 把节点排成圆周、连接为过圆心的弧线——弧长连接图的环形形态，适合关系密集、想强调闭合回路的网络；线宽同样按关系值映射，颜色继承源节点色。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'arc',
      title: '服务间调用拓扑（环形）',
      arcCircular: true,
      arcData: {
        nodes: [
          { name: '网关' }, { name: '用户服务' }, { name: '订单服务' },
          { name: '支付服务' }, { name: '库存服务' }, { name: '消息中心' },
        ],
        links: [
          { source: '网关', target: '用户服务', value: 52 },
          { source: '网关', target: '订单服务', value: 46 },
          { source: '订单服务', target: '支付服务', value: 38 },
          { source: '订单服务', target: '库存服务', value: 30 },
          { source: '支付服务', target: '消息中心', value: 22 },
          { source: '库存服务', target: '消息中心', value: 14 },
          { source: '用户服务', target: '消息中心', value: 10 },
        ],
      },
    }"
    :height="400"
  />
</DemoBlock>

## 配置要点

- `links[].value` 决定线宽（1.5–6px），建议先归一或截断极端值；
- `arcCircular: true` 切环形形态（节点排圆周、连接过圆心，即弧长连接图的闭环视角）；
- 图例点选节点即隐去该节点与全部相连关系，剩余重新布局；
- 节点名超长自动按列宽省略，完整名在 tooltip。

## 相关

- [弦图](/chart/chord) · [桑基图](/chart/sankey) · [韦恩图](/chart/venn)
- [API 参考](/chart/api)
