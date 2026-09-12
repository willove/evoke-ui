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

### 个股日 K：两周走势

实战里 label 就是交易日。红涨绿跌（A 股约定）是默认配色，也可用 `candleUpColor` / `candleDownColor` 换成港美股习惯；配合 `dataZoom` 可以在长周期里拖拽浏览。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'candle',
      title: '600519 贵州茅台 · 日 K',
      candleData: [
        { label: '09-01', open: 1680, close: 1702, high: 1715, low: 1668 },
        { label: '09-02', open: 1702, close: 1695, high: 1728, low: 1688 },
        { label: '09-03', open: 1695, close: 1721, high: 1730, low: 1690 },
        { label: '09-04', open: 1721, close: 1710, high: 1742, low: 1702 },
        { label: '09-05', open: 1710, close: 1738, high: 1745, low: 1705 },
        { label: '09-08', open: 1738, close: 1752, high: 1768, low: 1732 },
        { label: '09-09', open: 1752, close: 1746, high: 1770, low: 1738 },
        { label: '09-10', open: 1746, close: 1768, high: 1782, low: 1740 },
        { label: '09-11', open: 1768, close: 1755, high: 1775, low: 1748 },
        { label: '09-12', open: 1755, close: 1786, high: 1798, low: 1750 },
      ],
    }"
    :height="300"
  />
</DemoBlock>

### 场景提示

- **股票 / 期货 / 加密货币行情**：日 K / 周 K / 分时四价；
- **基金**场外净值只有单值，用[折线图](/chart/line)看净值曲线更合适；
- 财务上「预算 vs 决算 vs 上下限」这类开收高低语义的数据，也能复用 K 线表达。

## 配置要点

- 字段语义固定：`open` 开、`close` 收、`high` 高、`low` 低；
- 悬浮 tooltip 展示四价明细；
- 长周期序列配合 `dataZoom` 缩放浏览，见[交互与联动](/chart/interaction)。

## 相关

- [箱线图](/chart/boxplot) · [折线图](/chart/line)
- [API 参考](/chart/api)
