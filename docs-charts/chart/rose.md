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

### 量级倍差场景

数值间存在数倍差距时，玫瑰图的优势才真正显出来：半径按面积公平编码（√ 缩放），头部项的花瓣明显撑开——同样这组数据放饼图里，只角度差几十度，冲击力全无。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'rose',
      title: '各区域装机量',
      pieData: [
        { name: '华东', value: 8200 },
        { name: '华南', value: 4100 },
        { name: '华北', value: 2300 },
        { name: '西南', value: 1100 },
        { name: '东北', value: 640 },
        { name: '西北', value: 380 },
      ],
    }"
    :height="300"
  />
</DemoBlock>

### 类目偏多时的饼图替代

类目到七八个时饼图开始拥挤、小扇区难以辨认；玫瑰图每瓣自带半径差，类目多且名字短时仍保持可读。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'rose',
      title: '内容品类播放量',
      pieData: [
        { name: '剧集', value: 5200 },
        { name: '电影', value: 4300 },
        { name: '综艺', value: 3100 },
        { name: '动漫', value: 2400 },
        { name: '纪录片', value: 1800 },
        { name: '体育', value: 1500 },
        { name: '少儿', value: 1200 },
        { name: '知识', value: 900 },
      ],
    }"
    :height="300"
  />
</DemoBlock>

### 与饼图 / 环形图的边界

一句话：**要读占比用环，要比大小用玫瑰**。玫瑰图的半径不是从圆心按比例起算的，扇区角度也不与数值对齐——任何「A 占百分之几」的判读都不该发生在玫瑰图上；它擅长的是让读者三秒内记住「华东远超其他区域」这件事。

## 配置要点

- 数值差距小时玫瑰图的"花瓣"长度接近，反而失去表达力；
- 悬浮与图例交互同饼系其他类型；
- 严格的占比判读场景请回退[环形图](/chart/doughnut)。

## 相关

- [饼图](/chart/pie) · [环形图](/chart/doughnut)
- [API 参考](/chart/api)
