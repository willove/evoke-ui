<template>
  <div class="po-page">
    <ev-page-header title="项目总览" subtitle="研发项目组合与交付进度">
      <template #actions>
        <ev-button type="primary" size="small" @click="EvMessage.info('示例：进入项目立项向导')">
          <ev-icon name="plus" :size="14" />
          新建立项
        </ev-button>
      </template>
    </ev-page-header>

    <ev-row :gutter="16" class="po-block">
      <ev-col :xs="24" :sm="12" :lg="6">
        <ev-stat-card label="进行中项目" :value="activeCount" unit="个" icon="workorder" type="primary" />
      </ev-col>
      <ev-col :xs="24" :sm="12" :lg="6">
        <ev-stat-card label="本周到期里程碑" :value="2" unit="个" icon="time-circle" type="warning" />
      </ev-col>
      <ev-col :xs="24" :sm="12" :lg="6">
        <ev-stat-card label="团队成员" :value="12" unit="人" icon="customer" type="success" />
      </ev-col>
      <ev-col :xs="24" :sm="12" :lg="6">
        <ev-stat-card label="平均交付进度" :value="avgProgress" unit="%" icon="percentage" type="info" />
      </ev-col>
    </ev-row>

    <ev-section-card class="po-card">
      <ev-data-table
        title="项目列表"
        :operations-width="150"
        :columns="columns"
        :data="projects"
        :show-pagination="false"
      >
        <template #name="{ row }">
          <ev-cell-stack :main="row.name" :sub="row.code + ' · 负责人 ' + row.owner" />
        </template>
        <template #status="{ row }">
          <ev-status-tag :value="row.status" :statuses="PROJECT_STATUS" />
        </template>
        <template #progress="{ row }">
          <ev-progress :percentage="row.progress" :stroke-width="8" />
        </template>
        <template #deadline="{ row }">
          <span :class="{ 'po-deadline--near': isNear(row) }">{{ row.deadline }}</span>
        </template>
        <template #operations="{ row }">
          <ev-button text type="primary" size="small" @click="$emit('open-plan', row.id)">进度计划</ev-button>
          <ev-button text size="small" @click="EvMessage.info('示例：进入项目详情')">详情</ev-button>
        </template>
      </ev-data-table>
    </ev-section-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'
import { projects, PROJECT_STATUS } from '../mock.js'

defineEmits(['open-plan'])

const activeCount = computed(() => projects.filter((p) => p.status === 'active').length)
const avgProgress = computed(() => {
  const sum = projects.reduce((acc, p) => acc + p.progress, 0)
  return Math.round(sum / projects.length)
})

const columns = [
  { prop: 'name', label: '项目', slot: 'name', minWidth: 230 },
  { prop: 'status', label: '状态', slot: 'status', width: 96 },
  { prop: 'progress', label: '交付进度', slot: 'progress', width: 190 },
  { prop: 'deadline', label: '交付截止', slot: 'deadline', width: 120 },
]

function isNear(row) {
  return row.status === 'active' && row.deadline.startsWith('2026-10')
}
</script>

<style scoped>
.po-page {
  padding: 16px;
}
.po-block {
  margin-top: 16px;
}
.po-card {
  margin-top: 16px;
}
.po-deadline--near {
  color: var(--ev-color-warning, #e67e17);
  font-weight: 600;
}
</style>
