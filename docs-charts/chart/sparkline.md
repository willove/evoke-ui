# 迷你趋势图 sparkline

去掉轴、图例与 tooltip 的"趋势指纹"，一条线表达最近在涨还是在跌。为嵌入而生：指标卡、表格单元格、列表行尾。

## 何时使用

- 空间紧张，只回答"趋势方向与波动幅度"；
- 与数字 KPI 搭配出现，不独立承担读数职责。

## 示例

沿用 `labels` + `series` 数据模型；画布高度压小即可直接嵌入卡片。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'sparkline',
      title: '近 7 日活跃',
      labels: ['一', '二', '三', '四', '五', '六', '日'],
      series: [{ name: '活跃', data: [102, 118, 96, 134, 121, 88, 76] }],
    }"
    :height="120"
  />
</DemoBlock>

### 自选基金列表

股票基金场景的标配：行情列表里每行一个迷你走势 + 现价与涨跌幅，几行代码就能拼出「自选页」。用表格行尾嵌入时 `height` 压到 40–60。

<script setup>
const funds = [
  { name: '沪深300指数A', code: '510300', nav: '1.4820', chg: 1.23, trend: [1.41, 1.43, 1.42, 1.45, 1.46, 1.47, 1.48] },
  { name: '半导体主题C', code: '012414', nav: '2.1350', chg: 3.41, trend: [1.98, 2.02, 1.99, 2.06, 2.08, 2.11, 2.14] },
  { name: '红利低波A', code: '512890', nav: '1.1240', chg: -0.62, trend: [1.14, 1.13, 1.14, 1.13, 1.12, 1.13, 1.12] },
  { name: '中短债C', code: '006968', nav: '1.0360', chg: 0.03, trend: [1.035, 1.035, 1.036, 1.035, 1.036, 1.036, 1.036] },
]
</script>

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 0; border: 1px solid var(--cd-border, #e5e7eb); border-radius: 8px; overflow: hidden;">
    <div v-for="f in funds" :key="f.name" style="display: flex; align-items: center; gap: 16px; padding: 10px 16px; border-bottom: 1px solid var(--cd-border-light, #eff0f1);">
      <div style="width: 200px;">
        <div style="font-size: 13px; font-weight: 500;">{{ f.name }}</div>
        <div style="font-size: 11px; color: #94a3b8;">{{ f.code }}</div>
      </div>
      <ev-chart
        :options="{ type: 'sparkline', series: [{ name: f.name, data: f.trend }], labels: f.trend.map((_, i) => String(i + 1)) }"
        :height="44"
        style="flex: 1;"
      />
      <div style="width: 90px; text-align: right;">
        <div style="font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums;">{{ f.nav }}</div>
        <div style="font-size: 11px; font-weight: 600;" :style="{ color: f.chg >= 0 ? '#dc2626' : '#16a34a' }">{{ f.chg >= 0 ? '+' : '' }}{{ f.chg }}%</div>
      </div>
    </div>
  </div>
</DemoBlock>

## 配置要点

- 嵌入指标卡时 `height` 建议 60-120；
- 只传一条 `series`，多系列在迷你尺寸下没有意义；
- 需要看具体数值再点开大图（大图用[折线图](/chart/line)），迷你图不设 tooltip。

## 相关

- [折线图](/chart/line) · [仪表盘](/chart/gauge)（另一个 KPI 好搭档）
- [API 参考](/chart/api)
