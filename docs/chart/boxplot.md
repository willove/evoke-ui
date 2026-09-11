# 箱线图 boxplot

统计五分位的紧凑表达：箱体是四分位区间（Q1-Q3）、箱内横线是中位数、须线延伸到正常范围边缘。对比多个群体的"典型值与波动"最严谨的画法。

## 何时使用

- 每个群体已有（或可算出）**min / q1 / median / q3 / max** 统计值；
- 关心中位数、波动范围与分布偏态，而不是单个均值；
- 接口耗时、响应时长、成绩分布等"群体 vs 分布"的对比。

## 示例

专属数据字段 `boxData`（`{ label, min, q1, median, q3, max }`），一箱一个群体。

<DemoBlock>
  <ec-chart
    :options="{
      type: 'boxplot',
      title: '各接口耗时分布',
      boxData: [
        { label: '用户接口', min: 20, q1: 45, median: 60, q3: 85, max: 140 },
        { label: '订单接口', min: 35, q1: 60, median: 78, q3: 110, max: 190 },
        { label: '报表接口', min: 50, q1: 90, median: 130, q3: 180, max: 260 },
      ],
    }"
    :height="260"
  />
</DemoBlock>

## 配置要点

- 统计值由业务侧算好传入（与后端聚合口径一致）；
- 只有原始明细数据时，先看[直方图](/chart/bin)更直接；
- 箱体越"矮"说明群体越稳定，箱体越长波动越大。

## 相关

- [直方图](/chart/bin) · [K 线图](/chart/candle)
- [API 参考](/chart/api)
