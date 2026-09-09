<template>
  <div class="tu-page">
    <ev-page-header title="团队用量" subtitle="套餐资源额度与成员消耗明细">
      <template #actions>
        <ev-button size="small" @click="EvMessage.info('示例：跳转套餐管理')">
          <ev-icon name="level" :size="14" />
          升级套餐
        </ev-button>
      </template>
    </ev-page-header>

    <!-- 额度指标组：无外框栅格，四项内部结构一致（资源名 → 刷新头 → 条墙 → 用量脚注），行行对齐 -->
    <div class="tu-quotas">
      <div v-for="q in quotas" :key="q.id" class="tu-quota">
        <div class="tu-quota__title">
          <ev-icon :name="q.icon" :size="14" />
          <span>{{ q.name }}</span>
        </div>
        <ev-credits-progress
          :used="q.used"
          :total="q.total"
          :refresh-date="q.refreshDate"
          :refresh-label="q.refreshLabel"
          size="small"
        />
      </div>
    </div>

    <ev-data-table
      class="tu-table"
      title="成员消耗明细"
      :operations-width="120"
      :columns="columns"
      :data="memberUsage"
      :show-pagination="false"
      stripe
      border
    >
      <template #name="{ row }">
        <ev-cell-stack :main="row.name" :sub="row.dept + ' · ' + row.role" />
      </template>
      <template #credits="{ row }">
        <div class="tu-credits">
          <ev-progress :percentage="Math.round((row.credits / row.creditsTotal) * 100)" :stroke-width="8" />
          <span class="tu-credits__num">{{ row.credits }} / {{ row.creditsTotal }}</span>
        </div>
      </template>
      <template #seat="{ row }">
        <ev-status-tag :value="row.seat" :statuses="SEAT_STATUS" />
      </template>
      <template #operations="{ row }">
        <ev-button
          text
          :type="row.seat === 'idle' ? 'primary' : 'danger'"
          size="small"
          @click="toggleSeat(row)"
        >
          {{ row.seat === 'idle' ? '激活席位' : '释放席位' }}
        </ev-button>
      </template>
    </ev-data-table>
  </div>
</template>

<script setup>
import { EvMessage } from '@wil-works/evoke-business-ui'
import { quotas, memberUsage, SEAT_STATUS } from '../mock.js'

const columns = [
  { prop: 'name', label: '成员', slot: 'name', minWidth: 200 },
  { prop: 'credits', label: '本月 AI Credits 消耗', slot: 'credits', minWidth: 240 },
  { prop: 'seat', label: '席位状态', slot: 'seat', width: 110 },
]

function toggleSeat(row) {
  if (row.seat === 'idle') {
    row.seat = 'active'
    EvMessage.success(`已为「${row.name}」激活席位`)
  } else {
    row.seat = 'idle'
    EvMessage.info(`已释放「${row.name}」的席位，下个计费周期生效`)
  }
}
</script>

<style scoped>
.tu-page {
  padding: 16px;
}
.tu-quotas {
  display: grid;
  /* 260px 下限：常规桌面宽度下一行放下四项，窄屏依次降为 3/2/1 列 */
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px 32px;
  margin: 16px 0 24px;
}
.tu-quota {
  min-width: 0;
}
.tu-quota__title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 6px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--ev-border-color-lighter, #eef1f6);
  font-size: var(--ev-font-size-xs, 12px);
  font-weight: var(--ev-font-weight-semibold, 600);
  color: var(--ev-text-color-primary, #1f2329);
}
.tu-quota__title .ev-icon {
  color: var(--ev-color-primary, #175dff);
}
.tu-credits {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tu-credits__num {
  flex-shrink: 0;
  font-size: var(--ev-font-size-xs, 12px);
  font-variant-numeric: tabular-nums;
  color: var(--ev-text-color-secondary, #8a9099);
}
</style>
