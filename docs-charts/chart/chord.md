# 弦图 chord

环形排布的**两两关系**表达：节点均匀分布在圆周，连接带过圆心收束，带宽即关系强度。部门协作网络、供需匹配、航线流量这类「谁和谁有关系、关系有多重」的闭合读法——关系密集时比线性弧长图更省墨。

## 何时使用

- 数据是**成对关系**（A↔B 有往来），不是守恒流动（那用[桑基图](/chart/sankey)）；
- 关心「最强关系是哪几条」——连接带按值定宽，粗细即重要度；
- 节点建议 4–12 个；关系太多时先按值截断取 Top N；
- 节点有天然先后顺序、想沿直线读时改用[弧长连接图](/chart/arc)。

## 示例

数据字段 `chordData`（`{ nodes, links }`，与桑基同构）。节点弧默认均布，`chordByValue: true` 改按出入度占比；连接带颜色继承**源节点**色，同源同色不追色。

### 跨部门协作密度

悬浮某条连接带：强调自身、淡化其余；悬浮节点：与它相连的全部连接一起点亮——「研发到底和谁协作最密」顺着颜色就能读。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'chord',
      title: '跨部门协作密度（次 / 季度）',
      chordData: {
        nodes: [
          { name: '研发' }, { name: '设计' }, { name: '产品' },
          { name: '市场' }, { name: '客服' },
        ],
        links: [
          { source: '研发', target: '设计', value: 46 },
          { source: '研发', target: '产品', value: 38 },
          { source: '研发', target: '客服', value: 12 },
          { source: '设计', target: '产品', value: 30 },
          { source: '产品', target: '市场', value: 26 },
          { source: '市场', target: '客服', value: 34 },
          { source: '产品', target: '客服', value: 18 },
        ],
      },
    }"
    :height="380"
  />
</DemoBlock>

### 城市航线流量

`chordByValue: true` 让枢纽城市的弧段自动变长（弧长按出入度和占比），连接带的粗细对比也更均衡——航线网络里谁枢纽、哪条线最忙，一张图读完。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'chord',
      title: '主要城市航线月度班次',
      chordByValue: true,
      chordData: {
        nodes: [
          { name: '上海' }, { name: '北京' }, { name: '成都' },
          { name: '广州' }, { name: '西安' },
        ],
        links: [
          { source: '上海', target: '北京', value: 520 },
          { source: '上海', target: '成都', value: 310 },
          { source: '上海', target: '广州', value: 280 },
          { source: '北京', target: '成都', value: 260 },
          { source: '北京', target: '西安', value: 190 },
          { source: '成都', target: '广州', value: 175 },
          { source: '广州', target: '西安', value: 120 },
        ],
      },
    }"
    :height="380"
  />
</DemoBlock>

## 配置要点

- `links[].value` 决定带宽，建议先归一或截断极端值；
- `chordByValue: true` 时节点弧长按值占比（默认均布）；
- 节点圆点 + 弧线连接的**环形弧长形态**在 [弧长连接图](/chart/arc#环形弧长连接图)（`arcCircular: true`）；
- 图例点选节点即隐去该节点与全部相连关系，剩余重新布局；
- 节点名沿圆周外侧排布，按角度自动对齐左右；完整关系值在 tooltip。

## 相关

- [弧长连接图](/chart/arc) · [桑基图](/chart/sankey) · [韦恩图](/chart/venn)
- [API 参考](/chart/api)
