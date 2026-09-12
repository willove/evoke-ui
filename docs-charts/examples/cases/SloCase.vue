<template>
  <div class="case-slo">
    <header class="case-slo__header">
      <div>
        <h3 class="case-slo__title">核心交易链路 · SLO 看板</h3>
        <div class="case-slo__sub">网关 + 订单 + 支付三段链路 · 数据窗口近 30 天</div>
      </div>
      <div class="case-slo__kpis">
        <div class="case-slo__kpi">
          <span class="case-slo__kpi-label">可用性</span>
          <span class="case-slo__kpi-value">99.966%</span>
        </div>
        <div class="case-slo__kpi">
          <span class="case-slo__kpi-label">P95 延迟</span>
          <span class="case-slo__kpi-value">218ms</span>
        </div>
        <div class="case-slo__kpi">
          <span class="case-slo__kpi-label">错误预算剩余</span>
          <span class="case-slo__kpi-value">62%</span>
        </div>
      </div>
    </header>

    <EvChart :options="latencyTrend" :height="280" />

    <div class="case-slo__grid">
      <EvChart :options="gatewayBin" :height="280" />
      <EvChart :options="sloBullets" :height="280" />
    </div>
  </div>
</template>

<script setup>
import { EvChart } from '@wil-works/evoke-charts'

const latencyTrend = {
  type: 'mixed',
  title: '近 30 日请求量与 P95 延迟',
  labels: ['D-29', 'D-28', 'D-27', 'D-26', 'D-25', 'D-24', 'D-23', 'D-22', 'D-21', 'D-20', 'D-19', 'D-18', 'D-17', 'D-16', 'D-15', 'D-14', 'D-13', 'D-12', 'D-11', 'D-10', 'D-9', 'D-8', 'D-7', 'D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', '今日'],
  series: [
    { name: '请求量（百万）', data: [42, 44, 41, 45, 47, 43, 39, 46, 48, 45, 50, 52, 47, 44, 49, 53, 51, 56, 54, 58, 55, 61, 59, 57, 63, 60, 64, 62, 66, 68], chartType: 'bar' },
    { name: 'P95 延迟（ms）', data: [196, 204, 201, 212, 208, 226, 219, 214, 210, 206, 216, 224, 221, 208, 213, 226, 219, 232, 214, 228, 216, 236, 224, 209, 231, 213, 226, 204, 222, 218] },
  ],
  legend: { show: true },
}

const gatewayBin = {
  type: 'bin',
  title: '网关响应延迟分布（ms）',
  labels: ['网关延迟'],
  series: [
    { name: '延迟', data: [64, 72, 81, 88, 95, 102, 108, 116, 124, 131, 78, 85, 92, 99, 106, 113, 121, 128, 136, 143, 58, 69, 76, 84, 91, 98, 105, 112, 119, 126, 134, 141, 152, 68, 75, 83, 90, 97, 104, 111, 118, 125, 133, 139, 158, 174, 88, 96, 103, 110] },
  ],
}

const sloBullets = {
  type: 'bullet',
  title: 'SLO 达成（当前值 / 目标）',
  bulletData: [
    { name: '月度可用性（%）', value: 99.966, target: 99.95 },
    { name: 'P95 延迟（ms）', value: 218, target: 250 },
    { name: '错误率（‰）', value: 0.32, target: 1 },
    { name: '错误预算剩余（%）', value: 62, target: 25 },
  ],
}
</script>

<style scoped>
/* minimal：demo-block 已是唯一外框；图表去自带底色，令牌随宿主明暗 */
.case-slo {
  padding: 4px 0 0;
}
.case-slo :deep(.ev-chart) {
  background: transparent;
}
.case-slo__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}
.case-slo__title {
  margin: 0;
  font-size: 17px;
  color: var(--ev-text-color-primary);
}
.case-slo__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-slo__kpis {
  display: flex;
  gap: 22px;
}
.case-slo__kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.case-slo__kpi-label {
  font-size: 11px;
  color: var(--ev-text-color-secondary);
}
.case-slo__kpi-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--ev-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.case-slo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 8px;
  margin-top: 6px;
}
</style>
