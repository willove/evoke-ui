<template>
  <div class="page">
    <div class="stat-grid">
      <eb-stat-card :label="t('pages.members')" :value="1284" icon="team" type="primary" :trend="12.4" />
      <eb-stat-card :label="t('pages.orders')" :value="8617" icon="file-list" type="success" :trend="8.1" />
      <eb-stat-card label="GMV" value="¥1,284,650" icon="database" type="warning" :trend="-2.3" />
      <eb-stat-card label="SLA" value="99.97%" icon="star" type="info" :trend="0.4" />
    </div>

    <eb-card :title="t('pages.dashboard')" class="page-card-block">
      <eb-chart :options="options" :height="300" />
    </eb-card>

    <div class="quick">
      <eb-button type="primary" @click="notify({ type: 'success', title: t('list.exported') })">
        {{ t('list.export') }}
      </eb-button>
      <eb-button @click="notify({ type: 'warning', title: t('search.actionNotify') })">
        {{ t('search.actionNotify') }}
      </eb-button>
    </div>
  </div>
</template>

<script setup>
import { useSettings } from '../settings'

const { t, notify } = useSettings()

const options = {
  type: 'line',
  title: '近一周访问趋势',
  labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  series: [
    { name: '访问量', data: [320, 402, 361, 534, 490, 630, 720] },
    { name: '转化', data: [120, 132, 101, 154, 190, 230, 210] },
  ],
  legend: { show: true },
}
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--eb-space-4);
  margin-bottom: var(--eb-space-4);
}
.page-card-block {
  margin-bottom: var(--eb-space-4);
}
.quick {
  display: flex;
  gap: var(--eb-space-2);
}
</style>
