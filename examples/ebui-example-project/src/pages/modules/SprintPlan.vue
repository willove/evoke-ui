<template>
  <div class="sp-page">
    <ev-page-header title="进度计划" subtitle="项目里程碑推进与任务分解">
      <template #actions>
        <ev-segmented v-model="projectId" :options="projectOptions" size="small" @change="onProjectChange" />
      </template>
    </ev-page-header>

    <ev-section-card :title="`里程碑推进 · ${project.name}`" class="sp-block">
      <ev-gantt-progress :stages="project.stages" />
      <div class="sp-summary">
        <div class="sp-summary__item">
          <span>阶段进度</span><strong>{{ stagePercent }}%</strong>
        </div>
        <div class="sp-summary__item">
          <span>交付截止</span><strong>{{ project.deadline }}</strong>
        </div>
        <div class="sp-summary__item">
          <span>整体进度</span><strong>{{ project.progress }}%</strong>
        </div>
      </div>
    </ev-section-card>

    <ev-section-card class="sp-block">
      <ev-data-table
        title="任务分解"
        show-index
        :operations-width="130"
        :columns="columns"
        :data="project.tasks"
        :show-pagination="false"
      >
        <template #name="{ row }">
          <ev-cell-stack :main="row.name" :sub="'负责人 ' + row.owner" />
        </template>
        <template #range="{ row }">{{ row.start }} ~ {{ row.end }}</template>
        <template #progress="{ row }">
          <ev-progress
            :percentage="row.progress"
            :stroke-width="8"
            :status="row.status === 'blocked' ? 'exception' : undefined"
          />
        </template>
        <template #status="{ row }">
          <ev-status-tag :value="row.status" :statuses="TASK_STATUS" />
        </template>
        <template #operations="{ row }">
          <ev-button
            v-if="row.status !== 'done'"
            text
            type="primary"
            size="small"
            @click="complete(row)"
          >
            标记完成
          </ev-button>
          <span v-else class="sp-done">已交付</span>
        </template>
      </ev-data-table>
    </ev-section-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'
import { projects, TASK_STATUS } from '../mock.js'

const projectId = ref(projects[0].id)
const project = computed(() => projects.find((p) => p.id === projectId.value) ?? projects[0])

const projectOptions = projects.map((p) => ({ label: p.code, value: p.id }))

function onProjectChange() {
  EvMessage.info(`已切换到「${project.value.name}」`)
}

/** 供项目总览「进度计划」按钮调用：切换选中项目 */
function selectProject(id) {
  projectId.value = id
}

defineExpose({ selectProject })

const stagePercent = computed(() => {
  const stages = project.value.stages
  const done = stages.filter((s) => s.status === 'completed').length
  const active = stages.some((s) => s.status === 'active') ? 0.5 : 0
  return Math.round(((done + active) / stages.length) * 100)
})

const columns = [
  { prop: 'name', label: '任务', slot: 'name', minWidth: 210 },
  { prop: 'range', label: '计划区间', slot: 'range', width: 150 },
  { prop: 'progress', label: '进度', slot: 'progress', width: 190 },
  { prop: 'status', label: '状态', slot: 'status', width: 96 },
]

function complete(row) {
  row.status = 'done'
  row.progress = 100
  EvMessage.success(`任务「${row.name}」已完成`)
}
</script>

<style scoped>
.sp-page {
  padding: 16px;
}
.sp-block {
  margin-top: 16px;
}
.sp-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--ev-border-color-extra-light, #f0f1f3);
}
.sp-summary__item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--ev-font-size-sm, 13px);
  color: var(--ev-text-color-secondary, #8a9099);
}
.sp-summary__item strong {
  font-size: 16px;
  color: var(--ev-text-color-primary, #1f2329);
}
.sp-done {
  font-size: 12px;
  color: var(--ev-text-color-secondary, #8a9099);
}
</style>
