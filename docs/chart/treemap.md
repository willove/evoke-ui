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

## 配置要点

- 叶子节点给 `value`，父节点可省略（由子节点汇总）也可显式给定；
- 层级过深（> 3 层）可读性下降，建议拆成两张图；
- 悬浮读取节点名称与数值，点击语义见[交互与联动](/chart/interaction)。

## 相关

- [旭日图](/chart/sunburst) · [堆叠柱状图](/chart/stacked-bar)
- [API 参考](/chart/api)
