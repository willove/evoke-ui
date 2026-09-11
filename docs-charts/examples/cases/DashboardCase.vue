<template>
  <div class="case-dashboard">
    <header class="case-dashboard__header">
      <div>
        <h3 class="case-dashboard__title">运营数据看板</h3>
        <p class="case-dashboard__sub">2026 年 1–12 月 · 数据每小时汇总</p>
      </div>
      <button class="case-btn" type="button" @click="exportPNG">导出趋势图 PNG</button>
    </header>

    <div class="case-dashboard__kpis">
      <div v-for="k in kpis" :key="k.name" class="case-kpi">
        <div class="case-kpi__row">
          <span class="case-kpi__name">{{ k.name }}</span>
          <span class="case-kpi__delta" :class="k.delta > 0 ? 'is-up' : 'is-down'">
            {{ k.delta > 0 ? '↑' : '↓' }} {{ Math.abs(k.delta) }}{{ k.unit }}
          </span>
        </div>
        <strong class="case-kpi__value">{{ k.value }}</strong>
        <EvChart type="sparkline" :options="k.spark" :height="56" />
      </div>
    </div>

    <div class="case-dashboard__grid">
      <div class="case-panel case-panel--wide">
        <EvChart ref="trendRef" :options="trendOptions" :height="300" />
      </div>
      <div class="case-panel">
        <EvChart :options="channelOptions" :height="300" />
      </div>
      <div class="case-panel case-panel--wide">
        <EvChart :options="regionOptions" :height="280" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { EvChart } from '@wil-works/evoke-charts'

const trendRef = ref(null)

const months = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月']
const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']

const kpis = [
  {
    name: '销售额（万）', value: '1,284.6', delta: 12.4, unit: '%',
    spark: {
      type: 'sparkline',
      labels: weeks,
      series: [{ name: '销售额', data: [86, 92, 88, 104, 98, 112, 108, 121] }],
    },
  },
  {
    name: '订单量', value: '8,642', delta: 8.1, unit: '%',
    spark: {
      type: 'sparkline',
      labels: weeks,
      series: [{ name: '订单量', data: [620, 655, 610, 702, 688, 741, 730, 806] }],
    },
  },
  {
    name: '转化率', value: '3.6%', delta: 0.4, unit: 'pt',
    spark: {
      type: 'sparkline',
      labels: weeks,
      series: [{ name: '转化率', data: [4.1, 3.8, 3.9, 3.6, 3.7, 3.5, 3.8, 3.6] }],
    },
  },
  {
    name: '客单价（元）', value: '148.7', delta: 2.3, unit: '%',
    spark: {
      type: 'sparkline',
      labels: weeks,
      series: [{ name: '客单价', data: [138, 141, 139, 145, 142, 147, 144, 149] }],
    },
  },
]

const trendOptions = {
  type: 'area',
  title: '营收趋势（万元）',
  labels: months,
  series: [
    { name: '2026', data: [82, 88, 96, 105, 118, 124, 138, 142, 156, 168, 181, 210] },
    { name: '2025', data: [70, 74, 80, 86, 92, 98, 105, 110, 118, 126, 134, 152] },
  ],
  legend: { show: true },
}

const channelOptions = {
  type: 'doughnut',
  title: '渠道构成',
  pieData: [
    { name: '自然流量', value: 435 },
    { name: '付费投放', value: 310 },
    { name: '社群裂变', value: 234 },
    { name: '线下活动', value: 168 },
  ],
  piePercentMode: true,
  legend: { show: true },
}

const regionOptions = {
  type: 'horizontal-bar',
  title: '区域排行（万元）',
  labels: ['华东', '华南', '华北', '西南', '东北', '西北'],
  series: [{ name: '销售额', data: [412, 356, 298, 187, 142, 96] }],
  legend: { show: false },
}

function exportPNG() {
  const url = trendRef.value?.toDataURL()
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.download = '营收趋势.png'
  link.click()
}
</script>

<style scoped>
.case-dashboard {
  padding: 20px;
  border: 1px solid var(--ev-app-card-border);
  border-radius: 12px;
  background: var(--ev-bg-color);
}
.case-dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.case-dashboard__title {
  margin: 0;
  font-size: 17px;
  color: var(--ev-text-color-primary);
}
.case-dashboard__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-btn {
  padding: 7px 16px;
  border: 1px solid var(--ev-border-color-dark);
  border-radius: 6px;
  background: var(--ev-color-primary);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.case-btn:hover {
  opacity: 0.88;
}
.case-dashboard__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}
.case-kpi {
  padding: 12px 14px 4px;
  border: 1px solid var(--ev-app-card-border);
  border-radius: 10px;
  background: var(--ev-bg-color-overlay);
}
.case-kpi__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.case-kpi__name {
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-kpi__delta.is-up {
  font-size: 12px;
  color: var(--ev-color-success);
}
.case-kpi__delta.is-down {
  font-size: 12px;
  color: var(--ev-color-danger);
}
.case-kpi__value {
  display: block;
  margin: 2px 0 6px;
  font-size: 22px;
  color: var(--ev-text-color-primary);
}
.case-dashboard__grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 12px;
}
.case-panel {
  padding: 8px 10px;
  border: 1px solid var(--ev-app-card-border);
  border-radius: 10px;
  background: var(--ev-bg-color-overlay);
}
.case-panel--wide {
  grid-column: span 1;
}
@media (max-width: 900px) {
  .case-dashboard__grid {
    grid-template-columns: 1fr;
  }
}
</style>
