<template>
  <div class="case-hr">
    <header class="case-hr__header">
      <div>
        <h3 class="case-hr__title">人力资源 · 年度盘点</h3>
        <p class="case-hr__sub">编制 486 人 · 覆盖招聘 / 薪酬 / 结构 / 人效四个切面</p>
      </div>
      <div class="case-hr__kpis">
        <div class="case-hr__kpi">
          <span class="case-hr__kpi-label">年内入职</span>
          <span class="case-hr__kpi-value">+96</span>
        </div>
        <div class="case-hr__kpi">
          <span class="case-hr__kpi-label">主动流失</span>
          <span class="case-hr__kpi-value">-41</span>
        </div>
        <div class="case-hr__kpi">
          <span class="case-hr__kpi-label">人均工时</span>
          <span class="case-hr__kpi-value">156h/月</span>
        </div>
      </div>
    </header>

    <EvChart :options="hiringFunnel" :height="280" />

    <div class="case-hr__grid">
      <EvChart :options="salaryBox" :height="280" />
      <EvChart :options="ageBin" :height="280" />
    </div>

    <EvChart :options="efficiency" :height="280" />
  </div>
</template>

<script setup>
import { EvChart } from '@wil-works/evoke-charts'

const hiringFunnel = {
  type: 'funnel',
  title: '年度招聘漏斗',
  funnelData: [
    { label: '收到简历', value: 4860 },
    { label: '笔试通过', value: 1620 },
    { label: '初面通过', value: 760 },
    { label: '终面通过', value: 285 },
    { label: '接受 Offer', value: 212 },
  ],
}

const salaryBox = {
  type: 'boxplot',
  title: '各岗位年薪分布（万）',
  boxData: [
    { label: '后端研发', min: 18, q1: 26, median: 34, q3: 45, max: 68 },
    { label: '前端研发', min: 16, q1: 24, median: 30, q3: 40, max: 58 },
    { label: '产品经理', min: 15, q1: 22, median: 29, q3: 38, max: 55 },
    { label: '市场营销', min: 12, q1: 17, median: 22, q3: 30, max: 46 },
    { label: '职能支持', min: 10, q1: 14, median: 18, q3: 24, max: 35 },
  ],
}

const ageBin = {
  type: 'bin',
  title: '全员年龄结构（岁）',
  labels: ['年龄'],
  series: [
    { name: '年龄', data: [24, 26, 27, 28, 28, 29, 30, 30, 31, 31, 32, 32, 33, 33, 34, 34, 35, 35, 36, 36, 37, 38, 39, 40, 41, 42, 27, 29, 30, 32, 33, 35, 37, 38, 26, 28, 31, 34, 36, 39, 25, 33, 40, 43] },
  ],
}

const efficiency = {
  type: 'scatter',
  title: '部门人效（人均工时 / 人均产出）',
  scatterData: [
    { x: 152, y: 86, label: '研发·甲组' },
    { x: 168, y: 92, label: '研发·乙组' },
    { x: 140, y: 74, label: '产品' },
    { x: 175, y: 60, label: '运营' },
    { x: 132, y: 68, label: '设计' },
    { x: 160, y: 80, label: '测试' },
  ],
}
</script>

<style scoped>
/* minimal：demo-block 已是唯一外框；图表去自带底色，令牌随宿主明暗 */
.case-hr {
  padding: 4px 0 0;
}
.case-hr :deep(.ev-chart) {
  background: transparent;
}
.case-hr__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}
.case-hr__title {
  margin: 0;
  font-size: 17px;
  color: var(--ev-text-color-primary);
}
.case-hr__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-hr__kpis {
  display: flex;
  gap: 22px;
}
.case-hr__kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.case-hr__kpi-label {
  font-size: 11px;
  color: var(--ev-text-color-secondary);
}
.case-hr__kpi-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--ev-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.case-hr__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 8px;
  margin-top: 6px;
}
.case-hr > :last-child {
  margin-top: 6px;
}
</style>
