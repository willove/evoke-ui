# 矩形树图 treemap

层级构成的面积表达：矩形面积即数值，有子节点的矩形继续下钻拆分。一层看总量、多层看构成，组织成本拆解、预算结构、流量来源分解的常用图。

## 何时使用

- 数据是**树形层级**（父节点 → 子节点），且想用面积直觉表达量级；
- 空间利用率高，适合维度多的构成拆解；
- 更强调"从根到叶的路径"时改用[旭日图](/chart/sunburst)。

## 示例

专属数据字段 `treemapData`：每项 `{ name, value?, children? }`，`children` 存在时自动递归拆分。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'treemap',
      title: '成本结构拆解',
      treemapData: [
        {
          name: '人力',
          children: [
            { name: '研发', value: 420 },
            { name: '运营', value: 180 },
          ],
        },
        {
          name: '市场',
          children: [
            { name: '投放', value: 260 },
            { name: '活动', value: 120 },
          ],
        },
        { name: '云资源', value: 150 },
      ],
    }"
    :height="280"
  />
</DemoBlock>

### 扁平大类目

没有层级也能用：十几个类目的量级排布，矩形面积一望即知谁是大头——这是饼图做不到的（八片以上已难判读），也是它和[旭日图](/chart/sunburst)分工的差异：**量值对比 + 空间效率选树图，路径感 + 角度份额选旭日**。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'treemap',
      title: '全球市场份额',
      treemapData: [
        { name: '中国大陆', value: 3120 },
        { name: '北美', value: 2840 },
        { name: '欧洲', value: 1980 },
        { name: '东南亚', value: 1260 },
        { name: '印度', value: 1040 },
        { name: '日韩', value: 860 },
        { name: '中东', value: 520 },
        { name: '拉美', value: 470 },
        { name: '非洲', value: 310 },
        { name: '大洋洲', value: 180 },
      ],
    }"
    :height="300"
  />
</DemoBlock>

### 与旭日图怎么选

同一份层级数据两种表达，分野在读者要什么：要「各部分占总盘多少 + 沿路径下钻」用旭日图（角度份额、路径感强）；要「谁的盘子大 + 空间塞得下更多类目」用树图（面积即数值、天然排序）。层级只有一层时两者都不如[条形图](/chart/horizontal-bar)诚实。

## 配置要点

- 叶子节点给 `value`，父节点可省略（由子节点汇总）也可显式给定；
- 层级过深（> 3 层）可读性下降，建议拆成两张图；
- 悬浮读取节点名称与数值，点击语义见[交互与联动](/chart/interaction)。

## 相关

- [旭日图](/chart/sunburst) · [堆叠柱状图](/chart/stacked-bar)
- [API 参考](/chart/api)
