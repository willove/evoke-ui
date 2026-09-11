# 旭日图 sunburst

层级构成的环形表达：内圈是上层、外圈是下层，同一份数据同时看到**层级路径**与**占比**。与矩形树图同源，`sunburstData` 驱动。

## 何时使用

- 强调"从根到叶"的层级路径与各级占比；
- 层级 2-3 层、每层类目 3-6 个时效果最好；
- 只看最末级构成、不需要路径感时，[矩形树图](/chart/treemap)更省空间。

## 示例

数据结构与 treemap 一致：`{ name, value?, children? }` 嵌套数组。

<DemoBlock>
  <ec-chart
    :options="{
      type: 'sunburst',
      title: '销售额构成',
      sunburstData: [
        {
          name: '线上',
          children: [
            { name: '自营', value: 320 },
            { name: '第三方', value: 210 },
          ],
        },
        {
          name: '线下',
          children: [
            { name: '直销', value: 180 },
            { name: '分销', value: 90 },
          ],
        },
      ],
    }"
    :height="280"
  />
</DemoBlock>

## 配置要点

- 内圈角宽由子节点汇总决定，叶子节点必须有 `value`；
- 悬浮读取节点路径与数值；
- 层级深、类目多的数据先做归并，否则外圈切片过碎。

## 相关

- [矩形树图](/chart/treemap) · [饼图](/chart/pie)
- [API 参考](/chart/api)
