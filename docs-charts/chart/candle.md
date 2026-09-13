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

### K 线 + 成交量

`volumeData`（与 `candleData` 等长的数值数组）开启副图：绘图区下部 24% 变为成交量带，量柱颜色跟随当日涨跌，价格轴只量价格区。图例出现「成交量」项，点选即隐去量带、K 线回铺全高——价量关系的标准读法。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'candle',
      title: '600519 贵州茅台 · 价量联动',
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
      volumeData: [32000, 28000, 41000, 26000, 35000, 52000, 30000, 44000, 27000, 61000],
    }"
    :height="360"
  />
</DemoBlock>

### 价量 + 均线 + 区间选择

三件套组合：`volumeData` 量副图 + `candleMa` 均线（如 `[5, 10]`，按收盘价画简单移动平均，图例 MA5/MA10/成交量 都可点选显隐）+ `dataZoom` 数据区间选择（拖滑块/滚轮在长周期里缩放浏览）。趋势判断的标准工作台。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'candle',
      title: '600519 贵州茅台 · 均线与区间',
      candleMa: [3, 5],
      dataZoom: { enabled: true, start: 20, end: 100 },
      candleData: [
        { label: '08-01', open: 1650, close: 1668, high: 1675, low: 1642 },
        { label: '08-02', open: 1668, close: 1655, high: 1678, low: 1648 },
        { label: '08-03', open: 1655, close: 1672, high: 1680, low: 1650 },
        { label: '08-04', open: 1672, close: 1688, high: 1695, low: 1666 },
        { label: '08-05', open: 1688, close: 1675, high: 1694, low: 1668 },
        { label: '08-08', open: 1675, close: 1695, high: 1702, low: 1670 },
        { label: '08-09', open: 1695, close: 1710, high: 1718, low: 1688 },
        { label: '08-10', open: 1710, close: 1698, high: 1716, low: 1690 },
        { label: '08-11', open: 1698, close: 1715, high: 1722, low: 1692 },
        { label: '08-12', open: 1715, close: 1732, high: 1740, low: 1708 },
        { label: '08-13', open: 1732, close: 1720, high: 1738, low: 1712 },
        { label: '08-14', open: 1720, close: 1745, high: 1752, low: 1715 },
      ],
      volumeData: [31000, 26000, 29000, 38000, 25000, 42000, 51000, 28000, 36000, 55000, 30000, 62000],
    }"
    :height="400"
  />
</DemoBlock>

### 分时图：分钟 K 线 + 量副图

日内高频视角：`candleData` 换成 5 分钟粒度的四价，量副图照常联动——日内每段拉升都有量柱对应，价量同读。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'candle',
      title: '日内 5 分钟 K 线',
      candleData: [
        { label: '09:30', open: 24.10, close: 24.18, high: 24.22, low: 24.05 },
        { label: '09:35', open: 24.18, close: 24.32, high: 24.35, low: 24.15 },
        { label: '09:40', open: 24.32, close: 24.26, high: 24.36, low: 24.20 },
        { label: '09:45', open: 24.26, close: 24.40, high: 24.44, low: 24.22 },
        { label: '09:50', open: 24.40, close: 24.36, high: 24.45, low: 24.30 },
        { label: '09:55', open: 24.36, close: 24.52, high: 24.56, low: 24.33 },
        { label: '10:00', open: 24.52, close: 24.46, high: 24.58, low: 24.40 },
        { label: '10:05', open: 24.46, close: 24.60, high: 24.64, low: 24.42 },
        { label: '10:10', open: 24.60, close: 24.55, high: 24.65, low: 24.48 },
        { label: '10:15', open: 24.55, close: 24.68, high: 24.72, low: 24.52 },
      ],
      volumeData: [4200, 6800, 3900, 7200, 5100, 8600, 4800, 7400, 4300, 9200],
      volumeHeight: 0.28,
    }"
    :height="360"
  />
</DemoBlock>

偏好折线形态时用 `type: 'area'` 配 `volumeData`（价格线上区、量柱下区，量柱按价格较前一刻涨跌着色），图例「成交量」同样可点选显隐。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'area',
      title: '日内分时 · 均价与成交量',
      smooth: true,
      labels: ['09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00'],
      series: [{ name: '均价', data: [24.1, 24.35, 24.28, 24.52, 24.6, 24.48, 24.66, 24.72, 24.9] }],
      volumeData: [8200, 6400, 5100, 7300, 9200, 6800, 5900, 7600, 11800],
      yAxis: { min: 24 },
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
- `volumeData` 开启成交量副图（K 线 / 折线 / 面积通用），`volumeHeight`（0.15–0.4）调量带占比，默认 0.24；
- `candleMa: [5, 10, 20]` 叠加 MA 均线（收盘价简单移动平均），`candleMaColors` 可覆写线色，图例点选显隐；
- 悬浮 tooltip 展示四价明细，params 里带 `volume` 供自定义 formatter 使用；
- 长周期序列配合 `dataZoom` 缩放浏览，见[交互与联动](/chart/interaction)。

## 相关

- [箱线图](/chart/boxplot) · [折线图](/chart/line)
- [API 参考](/chart/api)
