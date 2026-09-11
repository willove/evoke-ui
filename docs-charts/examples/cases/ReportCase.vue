<template>
  <div class="case-report">
    <header class="case-report__header">
      <div>
        <h3 class="case-report__title">季度经营指标 · 报表嵌入</h3>
        <p class="case-report__sub">近 8 周趋势与目标达成 · 每行一张迷你图</p>
      </div>
    </header>

    <table class="case-report__table">
      <thead>
        <tr>
          <th>指标</th>
          <th class="is-num">本期</th>
          <th class="is-num">环比</th>
          <th class="is-chart">近 8 周趋势</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.name">
          <td class="case-report__name">{{ row.name }}</td>
          <td class="is-num">{{ row.value }}</td>
          <td class="is-num">
            <span :class="row.delta > 0 ? 'is-up' : 'is-down'">{{ row.delta > 0 ? '↑' : '↓' }} {{ Math.abs(row.delta) }}{{ row.unit }}</span>
          </td>
          <td class="is-chart">
            <EvChart type="sparkline" :options="row.spark" :height="56" />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="case-report__bullets">
      <EvChart :options="bulletOptions" :height="260" />
    </div>
  </div>
</template>

<script setup>
import { EvChart } from '@wil-works/evoke-charts'

const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']

function spark(name, data) {
  return { type: 'sparkline', labels: weeks, series: [{ name, data }] }
}

const rows = [
  {
    name: '营收（万元）', value: '1,284.6', delta: 12.4, unit: '%',
    spark: spark('营收', [860, 902, 884, 951, 968, 1024, 1105, 1285]),
    bullet: { value: 1285, target: 1200 },
  },
  {
    name: '新增客户', value: '342', delta: 14.0, unit: '%',
    spark: spark('新增客户', [210, 236, 228, 260, 255, 288, 302, 342]),
    bullet: { value: 342, target: 300 },
  },
  {
    name: '续费率（%）', value: '88.2', delta: 1.6, unit: 'pt',
    spark: spark('续费率', [82, 83, 85, 84, 86, 87, 87, 88]),
    bullet: { value: 88, target: 90 },
  },
  {
    name: '活跃用户（万）', value: '56.8', delta: 6.3, unit: '%',
    spark: spark('活跃用户', [44, 46, 45, 49, 50, 52, 54, 57]),
    bullet: { value: 57, target: 60 },
  },
  {
    name: '客单价（元）', value: '148.7', delta: 2.3, unit: '%',
    spark: spark('客单价', [138, 141, 139, 145, 142, 147, 144, 149]),
    bullet: { value: 149, target: 150 },
  },
  {
    name: '工单量', value: '1,043', delta: 18.5, unit: '%',
    spark: spark('工单量', [620, 688, 712, 755, 812, 890, 964, 1043]),
    bullet: { value: 1043, target: 1400 },
  },
]

const bulletOptions = {
  type: 'bullet',
  title: '目标达成（本期 / 目标）',
  bulletData: rows.map((r) => ({ name: r.name, value: r.bullet.value, target: r.bullet.target })),
}
</script>

<style scoped>
.case-report {
  padding: 20px;
  border: 1px solid var(--ev-app-card-border);
  border-radius: 12px;
  background: var(--ev-bg-color);
}
.case-report__header {
  margin-bottom: 12px;
}
.case-report__title {
  margin: 0;
  font-size: 17px;
  color: var(--ev-text-color-primary);
}
.case-report__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-report__table {
  width: 100%;
  border-collapse: collapse;
}
.case-report__table th {
  padding: 10px 12px;
  border-bottom: 1px solid var(--ev-border-color);
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: var(--ev-text-color-secondary);
}
.case-report__table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--ev-border-color-light);
  font-size: 13px;
  color: var(--ev-text-color-primary);
  vertical-align: middle;
}
.case-report__table tbody tr:last-child td {
  border-bottom: none;
}
.case-report__bullets {
  margin-top: 16px;
  padding: 8px 10px;
  border: 1px solid var(--ev-app-card-border);
  border-radius: 10px;
  background: var(--ev-bg-color-overlay);
}
.case-report__table .is-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.case-report__table .is-chart {
  width: 180px;
}
.case-report__name {
  font-weight: 500;
}
.is-up {
  color: var(--ev-color-success);
}
.is-down {
  color: var(--ev-color-danger);
}
@media (max-width: 720px) {
  .case-report__table .is-chart {
    width: 120px;
  }
}
</style>
