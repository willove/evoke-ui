<template>
  <div class="case-dev">
    <header class="case-dev__header">
      <div>
        <h3 class="case-dev__title">交付效能看板 · 2026 年度</h3>
        <p class="case-dev__sub">5 条产品线 · 12 条流水线 · 数据窗口近 12 个月</p>
      </div>
      <div class="case-dev__kpis">
        <div class="case-dev__kpi">
          <span class="case-dev__kpi-label">年度发布</span>
          <span class="case-dev__kpi-value">488 次</span>
        </div>
        <div class="case-dev__kpi">
          <span class="case-dev__kpi-label">流水线成功率</span>
          <span class="case-dev__kpi-value">96.8%</span>
        </div>
        <div class="case-dev__kpi">
          <span class="case-dev__kpi-label">平均构建</span>
          <span class="case-dev__kpi-value">6m42s</span>
        </div>
      </div>
    </header>

    <EvChart :options="releaseTrend" :height="280" />

    <div class="case-dev__grid">
      <EvChart :options="buildBox" :height="280" />
      <EvChart :options="deployHeat" :height="280" />
    </div>
  </div>
</template>

<script setup>
import { EvChart } from '@wil-works/evoke-charts'

const releaseTrend = {
  type: 'mixed',
  title: '月度发布次数与变更失败率',
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  series: [
    { name: '发布次数', data: [28, 32, 30, 38, 42, 45, 40, 52, 48, 55, 58, 42], chartType: 'bar' },
    { name: '变更失败率（%）', data: [4.2, 3.8, 5.1, 3.2, 2.9, 3.5, 2.6, 2.2, 3.1, 2.4, 1.9, 3.2] },
  ],
  legend: { show: true },
}

const buildBox = {
  type: 'boxplot',
  title: '各服务构建时长分布（秒）',
  boxData: [
    { label: '前端应用', min: 180, q1: 240, median: 285, q3: 340, max: 460 },
    { label: '网关服务', min: 220, q1: 300, median: 360, q3: 430, max: 580 },
    { label: '订单服务', min: 260, q1: 340, median: 410, q3: 500, max: 690 },
    { label: '支付服务', min: 300, q1: 390, median: 470, q3: 560, max: 760 },
    { label: '数据平台', min: 420, q1: 560, median: 680, q3: 830, max: 1120 },
  ],
}

const deployHeat = {
  type: 'heatmap',
  title: '发布窗口热力（星期 × 时段）',
  heatmapData: [
    { x: '周一', y: '10 点', value: 3 }, { x: '周一', y: '14 点', value: 8 }, { x: '周一', y: '16 点', value: 14 }, { x: '周一', y: '20 点', value: 2 },
    { x: '周二', y: '10 点', value: 5 }, { x: '周二', y: '14 点', value: 22 }, { x: '周二', y: '16 点', value: 31 }, { x: '周二', y: '20 点', value: 4 },
    { x: '周三', y: '10 点', value: 6 }, { x: '周三', y: '14 点', value: 26 }, { x: '周三', y: '16 点', value: 34 }, { x: '周三', y: '20 点', value: 6 },
    { x: '周四', y: '10 点', value: 4 }, { x: '周四', y: '14 点', value: 18 }, { x: '周四', y: '16 点', value: 24 }, { x: '周四', y: '20 点', value: 3 },
    { x: '周五', y: '10 点', value: 2 }, { x: '周五', y: '14 点', value: 4 }, { x: '周五', y: '16 点', value: 1 }, { x: '周五', y: '20 点', value: 0 },
  ],
}
</script>

<style scoped>
/* minimal：demo-block 已是唯一外框；图表去自带底色，令牌随宿主明暗 */
.case-dev {
  padding: 4px 0 0;
}
.case-dev :deep(.ev-chart) {
  background: transparent;
}
.case-dev__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}
.case-dev__title {
  margin: 0;
  font-size: 17px;
  color: var(--ev-text-color-primary);
}
.case-dev__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-dev__kpis {
  display: flex;
  gap: 22px;
}
.case-dev__kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.case-dev__kpi-label {
  font-size: 11px;
  color: var(--ev-text-color-secondary);
}
.case-dev__kpi-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--ev-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.case-dev__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 8px;
  margin-top: 6px;
}
</style>
