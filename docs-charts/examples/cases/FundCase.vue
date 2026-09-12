<template>
  <div class="case-fund">
    <header class="case-fund__header">
      <div>
        <h3 class="case-fund__title">我的持仓 · 体检报告</h3>
        <p class="case-fund__sub">8 只基金 · 今年以来 · 数据截至最近收盘</p>
      </div>
    </header>

    <table class="case-fund__table">
      <thead>
        <tr>
          <th>基金</th>
          <th class="is-num">持有收益</th>
          <th class="is-num">今年以来</th>
          <th class="is-chart">近 7 日净值</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in funds" :key="f.code">
          <td class="case-fund__name">
            <div>{{ f.name }}</div>
            <div class="case-fund__code">{{ f.code }}</div>
          </td>
          <td class="is-num">{{ f.holding }}</td>
          <td class="is-num">
            <span :class="f.ytd > 0 ? 'is-up' : 'is-down'">{{ f.ytd > 0 ? '+' : '' }}{{ f.ytd }}%</span>
          </td>
          <td class="is-chart">
            <EvChart type="sparkline" :options="f.spark" :height="52" />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="case-fund__grid">
      <EvChart :options="ytdRank" :height="280" />
      <EvChart :options="riskReturn" :height="280" />
    </div>

    <EvChart :options="assetMix" :height="240" />
  </div>
</template>

<script setup>
import { EvChart } from '@wil-works/evoke-charts'

const raw = [
  { name: '半导体主题C', code: '012414', holding: '+6,420', ytd: 18.9, risk: 25.4, ret: 18.9, trend: [1.98, 2.02, 1.99, 2.06, 2.08, 2.11, 2.14] },
  { name: '新能源车A', code: '013805', holding: '+3,180', ytd: 12.4, risk: 22.1, ret: 11.4, trend: [1.52, 1.49, 1.55, 1.58, 1.56, 1.61, 1.63] },
  { name: '沪深300指数A', code: '510300', holding: '+2,940', ytd: 9.8, risk: 12.4, ret: 9.8, trend: [1.41, 1.43, 1.42, 1.45, 1.46, 1.47, 1.48] },
  { name: '消费主题C', code: '006611', holding: '+1,220', ytd: 6.1, risk: 15.3, ret: 12.6, trend: [1.21, 1.23, 1.2, 1.24, 1.22, 1.25, 1.26] },
  { name: '红利低波A', code: '512890', holding: '-460', ytd: -2.3, risk: 16.8, ret: 6.2, trend: [1.14, 1.13, 1.14, 1.13, 1.12, 1.13, 1.12] },
  { name: '中短债C', code: '006968', holding: '+96', ytd: 0.4, risk: 5.1, ret: 2.8, trend: [1.035, 1.035, 1.036, 1.035, 1.036, 1.036, 1.036] },
]

const funds = raw.map((f) => ({
  ...f,
  spark: { type: 'sparkline', labels: f.trend.map((_, i) => String(i + 1)), series: [{ name: f.name, data: f.trend }] },
}))

const ytdRank = {
  type: 'horizontal-bar',
  title: '今年以来收益排行（%）',
  labels: raw.map((f) => f.name),
  series: [{ name: '收益率', data: raw.map((f) => f.ytd) }],
}

const riskReturn = {
  type: 'scatter',
  title: '风险与收益（波动率 % / 年化 %）',
  scatterData: raw.map((f) => ({ x: f.risk, y: f.ret, label: f.name })),
}

const assetMix = {
  type: 'doughnut',
  title: '资产配置',
  innerRadius: 0.68,
  pieData: [
    { name: '股票型', value: 62 },
    { name: '债券型', value: 18 },
    { name: '现金', value: 12 },
    { name: '黄金', value: 8 },
  ],
  piePercentMode: true,
}
</script>

<style scoped>
/* minimal：demo-block 已是唯一外框；表格行发丝线，图表去自带底色 */
.case-fund {
  padding: 4px 0 0;
}
.case-fund :deep(.ev-chart) {
  background: transparent;
}
.case-fund__header {
  margin-bottom: 12px;
}
.case-fund__title {
  margin: 0;
  font-size: 17px;
  color: var(--ev-text-color-primary);
}
.case-fund__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-fund__table {
  width: 100%;
  border-collapse: collapse;
}
.case-fund__table th {
  padding: 10px 12px;
  border-bottom: 1px solid var(--ev-border-color);
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: var(--ev-text-color-secondary);
}
.case-fund__table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--ev-border-color-light);
  font-size: 13px;
  color: var(--ev-text-color-primary);
  vertical-align: middle;
}
.case-fund__table tbody tr:last-child td {
  border-bottom: none;
}
.case-fund__name {
  font-weight: 500;
}
.case-fund__code {
  font-size: 11px;
  color: var(--ev-text-color-secondary);
}
.case-fund__table .is-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.case-fund__table .is-chart {
  width: 170px;
}
.is-up {
  color: var(--ev-color-danger);
}
.is-down {
  color: var(--ev-color-success);
}
.case-fund__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 8px;
  margin-top: 20px;
}
.case-fund > :last-child {
  margin-top: 6px;
}
@media (max-width: 720px) {
  .case-fund__table .is-chart {
    width: 110px;
  }
}
</style>
