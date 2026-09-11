# 玫瑰图 rose

南丁格尔玫瑰图：扇区**半径随数值变化**，占比差距被半径放大，视觉冲击强。适合展示"谁显著更大"的分类对比，不适合精确读占比。

## 何时使用

- 各分类数值差距明显，想突出"头部项"的强势；
- 报告封面、大屏展示等需要视觉张力的场景；
- 需要精确对比占比大小时，环形图更诚实。

## 示例

与饼图同源：`pieData` 驱动，`type: 'rose'` 即可。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'rose',
      title: '故障类型分布',
      pieData: [
        { name: '网络', value: 42 },
        { name: '存储', value: 31 },
        { name: '计算', value: 18 },
        { name: '其他', value: 9 },
      ],
    }"
    :height="260"
  />
</DemoBlock>

## 配置要点

- 数值差距小时玫瑰图的"花瓣"长度接近，反而失去表达力；
- 悬浮与图例交互同饼系其他类型；
- 严格的占比判读场景请回退[环形图](/chart/doughnut)。

## 相关

- [饼图](/chart/pie) · [环形图](/chart/doughnut)
- [API 参考](/chart/api)
