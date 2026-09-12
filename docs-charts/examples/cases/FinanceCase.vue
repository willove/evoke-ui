<template>
  <div class="case-fin">
    <header class="case-fin__header">
      <div>
        <h3 class="case-fin__title">财务月度结算 · 2026-06</h3>
        <p class="case-fin__sub">单位：万元 · 数据口径与财务系统一致</p>
      </div>
      <div class="case-fin__kpis">
        <div class="case-fin__kpi">
          <span class="case-fin__kpi-label">营业收入</span>
          <span class="case-fin__kpi-value">1,860</span>
        </div>
        <div class="case-fin__kpi">
          <span class="case-fin__kpi-label">净利润</span>
          <span class="case-fin__kpi-value">440</span>
        </div>
        <div class="case-fin__kpi">
          <span class="case-fin__kpi-label">费用率</span>
          <span class="case-fin__kpi-value">48.4%</span>
        </div>
      </div>
    </header>

    <EvChart :options="profitBridge" :height="280" />

    <div class="case-fin__grid">
      <EvChart :options="expenseMix" :height="260" />
      <EvChart :options="reimburse" :height="260" />
    </div>
  </div>
</template>

<script setup>
import { EvChart } from '@wil-works/evoke-charts'

const profitBridge = {
  type: 'waterfall',
  title: '利润桥：营业收入 → 净利润',
  labels: ['营业收入', '原材料', '人力成本', '物流仓储', '营销费用', '净利润'],
  series: [{ name: '损益', data: [1860, -520, -430, -210, -260, 440] }],
}

const expenseMix = {
  type: 'pie',
  title: '费用构成',
  pieData: [
    { name: '原材料', value: 520 },
    { name: '人力成本', value: 430 },
    { name: '营销费用', value: 260 },
    { name: '物流仓储', value: 210 },
    { name: '其他', value: 180 },
  ],
  piePercentMode: true,
}

const reimburse = {
  type: 'stacked-bar',
  title: '部门报销结算（元）',
  labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [
    { name: '差旅费', data: [18600, 15300, 22100, 17800, 24600, 19900] },
    { name: '办公采购', data: [8200, 9100, 7600, 12400, 8800, 15600] },
    { name: '团建活动', data: [5600, 3200, 4800, 3600, 9200, 6800] },
  ],
  legend: { show: true },
}
</script>

<style scoped>
/* minimal：demo-block 已是唯一外框；图表去自带底色，令牌随宿主明暗 */
.case-fin {
  padding: 4px 0 0;
}
.case-fin :deep(.ev-chart) {
  background: transparent;
}
.case-fin__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}
.case-fin__title {
  margin: 0;
  font-size: 17px;
  color: var(--ev-text-color-primary);
}
.case-fin__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-fin__kpis {
  display: flex;
  gap: 22px;
}
.case-fin__kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.case-fin__kpi-label {
  font-size: 11px;
  color: var(--ev-text-color-secondary);
}
.case-fin__kpi-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--ev-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.case-fin__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 8px;
  margin-top: 6px;
}
</style>
