# 迷你趋势图 sparkline

去掉轴、图例与 tooltip 的"趋势指纹"，一条线表达最近在涨还是在跌。为嵌入而生：指标卡、表格单元格、列表行尾。

## 何时使用

- 空间紧张，只回答"趋势方向与波动幅度"；
- 与数字 KPI 搭配出现，不独立承担读数职责。

## 示例

沿用 `labels` + `series` 数据模型；画布高度压小即可直接嵌入卡片。

<DemoBlock>
  <ec-chart
    :options="{
      type: 'sparkline',
      title: '近 7 日活跃',
      labels: ['一', '二', '三', '四', '五', '六', '日'],
      series: [{ name: '活跃', data: [102, 118, 96, 134, 121, 88, 76] }],
    }"
    :height="120"
  />
</DemoBlock>

## 配置要点

- 嵌入指标卡时 `height` 建议 60-120；
- 只传一条 `series`，多系列在迷你尺寸下没有意义；
- 需要看具体数值再点开大图（大图用[折线图](/chart/line)），迷你图不设 tooltip。

## 相关

- [折线图](/chart/line) · [仪表盘](/chart/gauge)（另一个 KPI 好搭档）
- [API 参考](/chart/api)
