# K 线图 candle

金融时序的标准表达：每根蜡烛由**开、收、高、低**四个价构成，涨跌配色一眼可读。行情、股价、以及任何"开-收-高-低"四元组数据。

## 何时使用

- 数据天然有开盘/收盘/最高/最低四个值；
- 关心周期内的涨跌方向与波动区间；
- 一般时序趋势看[折线图](/chart/line)更简洁。

## 示例

专属数据字段 `candleData`（`{ label, open, close, high, low }`），涨跌自动着色。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'candle',
      title: '近期行情',
      candleData: [
        { label: '周一', open: 120, close: 132, high: 136, low: 118 },
        { label: '周二', open: 132, close: 128, high: 140, low: 124 },
        { label: '周三', open: 128, close: 145, high: 148, low: 126 },
        { label: '周四', open: 145, close: 141, high: 152, low: 138 },
        { label: '周五', open: 141, close: 155, high: 158, low: 139 },
      ],
    }"
    :height="280"
  />
</DemoBlock>

## 配置要点

- 字段语义固定：`open` 开、`close` 收、`high` 高、`low` 低；
- 悬浮 tooltip 展示四价明细；
- 长周期序列配合 `dataZoom` 缩放浏览，见[交互与联动](/chart/interaction)。

## 相关

- [箱线图](/chart/boxplot) · [折线图](/chart/line)
- [API 参考](/chart/api)
