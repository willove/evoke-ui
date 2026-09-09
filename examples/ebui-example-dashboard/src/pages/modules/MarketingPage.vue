<template>
  <div class="mk-page">
    <ev-page-header title="营销中心" subtitle="促销活动与券效概览">
      <template #actions>
        <ev-button type="primary" size="small" @click="EvMessage.info('示例：进入活动创建向导')">
          <ev-icon name="plus" :size="14" />
          创建活动
        </ev-button>
      </template>
    </ev-page-header>

    <ev-row :gutter="16" class="mk-block">
      <ev-col :span="8">
        <ev-stat-card label="进行中活动" :value="runningCount" unit="场" icon="marketing" type="primary" />
      </ev-col>
      <ev-col :span="8">
        <ev-stat-card label="本月券核销" :value="1286" unit="张" icon="ticket" type="success" :trend="5.8" />
      </ev-col>
      <ev-col :span="8">
        <ev-stat-card label="活动带动 GMV" :value="426800" unit="元" icon="turnover" type="warning" :trend="16.2" />
      </ev-col>
    </ev-row>

    <ev-section-card title="促销活动" class="mk-block">
      <ev-data-table
        :columns="columns"
        :data="campaigns"
        :operations-width="110"
        :show-pagination="false"
      >
        <template #type="{ row }">
          <ev-tag :type="row.type === 'seckill' ? 'danger' : row.type === 'full' ? 'primary' : 'warning'" effect="plain">
            {{ CAMPAIGN_TYPE[row.type] }}
          </ev-tag>
        </template>
        <template #time="{ row }">{{ row.start }} ~ {{ row.end }}</template>
        <template #progress="{ row }">
          <ev-progress :percentage="row.progress" :stroke-width="8" />
        </template>
        <template #status="{ row }">
          <ev-status-tag :value="row.status" :statuses="CAMPAIGN_STATUS" />
        </template>
        <template #operations="{ row }">
          <ev-popconfirm
            v-if="row.status === 'running'"
            title="提前结束后不可恢复，确认？"
            icon-type="warning"
            @confirm="finish(row)"
          >
            <ev-button text type="danger" size="small">提前结束</ev-button>
          </ev-popconfirm>
          <ev-button v-else text size="small" disabled>—</ev-button>
        </template>
      </ev-data-table>
    </ev-section-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'
import { campaigns, CAMPAIGN_TYPE, CAMPAIGN_STATUS } from '../mock.js'

const columns = [
  { prop: 'name', label: '活动名称', minWidth: 210 },
  { prop: 'type', label: '类型', slot: 'type', width: 92 },
  { prop: 'time', label: '活动时间', slot: 'time', width: 185 },
  { prop: 'progress', label: '目标完成度', slot: 'progress', width: 190 },
  { prop: 'status', label: '状态', slot: 'status', width: 92 },
]

const runningCount = computed(() => campaigns.filter((c) => c.status === 'running').length)

function finish(row) {
  row.status = 'ended'
  row.progress = 100
  EvMessage.warning(`活动「${row.name}」已提前结束`)
}
</script>

<style scoped>
.mk-page {
  padding: 16px;
}
.mk-block {
  margin-top: 16px;
}
/* KPI 行三张卡等高拉伸（有无趋势行高度不一致时以最高者为准） */
.mk-block :deep(.el-col) {
  display: flex;
}
.mk-block :deep(.el-col > *) {
  flex: 1;
  width: 100%;
}
</style>
