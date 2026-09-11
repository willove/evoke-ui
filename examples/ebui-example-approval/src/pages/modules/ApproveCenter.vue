<template>
  <div class="ac-page">
    <eb-page-header title="审批中心" subtitle="待部门经理处理的报销单据">
      <template #actions>
        <eb-tag size="small" effect="plain">当前身份：部门经理</eb-tag>
      </template>
    </eb-page-header>

    <eb-row :gutter="16" class="ac-block">
      <!-- 左：待审队列 -->
      <eb-col :xs="24" :lg="8">
        <eb-section-card :title="`待审批（${approveQueue.length}）`" :padding="false" class="ac-queue-card">
          <div class="ac-queue">
            <div
              v-for="item in approveQueue"
              :key="item.id"
              class="ac-queue__item"
              :class="{ 'is-active': item.id === selectedId }"
              @click="select(item)"
            >
              <div class="ac-queue__main">
                <span class="ac-queue__no">{{ item.no }}</span>
                <span class="ac-queue__type">{{ TYPE_LABEL[item.type] }}</span>
              </div>
              <div class="ac-queue__meta">
                <span>{{ item.applicant }} · {{ item.dept }}</span>
                <span class="ac-queue__amount">¥{{ item.amount.toLocaleString() }}</span>
              </div>
            </div>
            <div v-if="!approveQueue.length" class="ac-queue__empty">待审批已清空</div>
          </div>
        </eb-section-card>
      </eb-col>

      <!-- 右：审批工作区 -->
      <eb-col :xs="24" :lg="16">
        <eb-section-card :padding="false" class="ac-detail-card">
          <template #header>
            <div class="ac-detail-title">
              <span class="ac-detail-title__no">{{ selected.no }}</span>
              <eb-status-tag :value="selected.status || 'pending'" :statuses="EXPENSE_STATUS" />
            </div>
          </template>
          <template #extra>
            <eb-popconfirm title="确认同意该报销申请？" @confirm="agree">
              <eb-button type="primary" size="small">同意</eb-button>
            </eb-popconfirm>
            <eb-button size="small" type="danger" plain @click="rejectVisible = true">驳回</eb-button>
          </template>

          <div class="ac-detail-body">
            <eb-steps :active="activeStep" align-center :process-status="selected.status === 'rejected' ? 'error' : 'process'">
              <eb-step v-for="node in FLOW_NODES" :key="node" :title="node" />
            </eb-steps>

            <eb-detail-descriptions :column="3" :border="false" :data="selected" :items="detailItems" class="ac-desc" />

            <div class="ac-sub-title">费用明细（{{ selected.items?.length || 0 }} 项）</div>
            <eb-table :data="selected.items || []">
              <eb-table-column prop="type" label="费用类型" width="120">
                <template #default="{ row }">{{ TYPE_LABEL[row.type] }}</template>
              </eb-table-column>
              <eb-table-column prop="note" label="说明" min-width="200" />
              <eb-table-column prop="amount" label="金额（元）" align="right" width="110" />
            </eb-table>

            <div class="ac-sub-title">审批记录</div>
            <eb-audit-timeline :items="auditItems" />
          </div>
        </eb-section-card>
      </eb-col>
    </eb-row>

    <!-- 驳回意见 -->
    <eb-dialog v-model="rejectVisible" title="驳回申请" width="460px">
      <eb-form :model="rejectForm" label-width="72px">
        <eb-form-item label="驳回意见">
          <eb-textarea v-model="rejectForm.reason" :rows="3" maxlength="100" show-word-limit placeholder="请填写驳回意见（必填），将通知申请人" />
        </eb-form-item>
      </eb-form>
      <template #footer>
        <eb-button @click="rejectVisible = false">取消</eb-button>
        <eb-button type="danger" @click="reject">确认驳回</eb-button>
      </template>
    </eb-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'
import { approveQueue, EXPENSE_STATUS, TYPE_LABEL, FLOW_NODES } from '../mock.js'

/* ---------------- 选中单据（默认第一张） ---------------- */
const selectedId = ref(approveQueue[0]?.id)
const selected = computed(
  () => approveQueue.find((a) => a.id === selectedId.value) ?? approveQueue[0] ?? {},
)

function select(item) {
  selectedId.value = item.id
}

const activeStep = computed(() => {
  const idx = FLOW_NODES.indexOf('部门经理审批')
  return selected.value.status === 'rejected' ? idx : idx + 1
})

const detailItems = [
  { prop: 'applicant', label: '申请人' },
  { prop: 'dept', label: '所属部门' },
  { prop: 'amount', label: '合计金额' },
  { prop: 'type', label: '费用类型' },
  { prop: 'submittedAt', label: '提交时间' },
  { prop: 'remark', label: '事由备注', span: 3 },
]

const auditItems = computed(() =>
  (selected.value.flow || []).map((f) => ({
    id: f.at + f.operator,
    operator: f.operator,
    action: f.action,
    createdAt: f.at,
    detail: f.detail,
  })),
)

/* ---------------- 同意 / 驳回 ---------------- */
function pushFlow(operator, action, detail) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  selected.value.flow.push({
    operator,
    action,
    at: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    detail,
  })
}

function agree() {
  // 演示简化：部门经理同意后，财务 / 出纳节点由下游系统自动流转完成（留痕完整）
  selected.value.currentStep = FLOW_NODES.length
  pushFlow('沈从文', '部门经理审批通过', '金额与事由核对无误，同意报销')
  pushFlow('钱多多', '财务审核通过', '发票已核验（演示自动流转）')
  pushFlow('周予安', '打款完成', '已转账至申请人账户（演示自动流转）')
  selected.value.status = 'approved'
  EbMessage.success(`报销单 ${selected.value.no} 审批通过，财务与出纳节点已完成打款`)
}

const rejectVisible = ref(false)
const rejectForm = reactive({ reason: '' })

function reject() {
  if (!rejectForm.reason.trim()) {
    EbMessage.warning('请填写驳回意见')
    return
  }
  selected.value.status = 'rejected'
  pushFlow('沈从文', '部门经理驳回了申请', rejectForm.reason.trim())
  rejectVisible.value = false
  rejectForm.reason = ''
  EbMessage.warning(`报销单 ${selected.value.no} 已驳回`)
}
</script>

<style scoped>
.ac-page {
  padding: 16px;
}
.ac-block {
  margin-top: 16px;
}
.ac-queue-card {
  min-height: 520px;
}
.ac-queue {
  max-height: 460px;
  overflow: auto;
}
.ac-queue__item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--eb-border-color-extra-light, #f0f1f3);
  transition: background-color 0.2s;
}
.ac-queue__item:hover {
  background: var(--eb-fill-color-light, #f5f6f8);
}
.ac-queue__item.is-active {
  background: var(--eb-color-primary-light-9, rgba(23, 93, 255, 0.06));
  box-shadow: inset 3px 0 0 var(--eb-color-primary, #175dff);
}
.ac-queue__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ac-queue__no {
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
}
.ac-queue__type {
  font-size: var(--eb-font-size-xs, 12px);
  color: var(--eb-text-color-secondary, #8a9099);
}
.ac-queue__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  font-size: var(--eb-font-size-xs, 12px);
  color: var(--eb-text-color-secondary, #8a9099);
}
.ac-queue__amount {
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-color-danger, #e34d59);
}
.ac-queue__empty {
  padding: 40px 0;
  text-align: center;
  color: var(--eb-text-color-secondary, #8a9099);
}
.ac-detail-card {
  min-height: 520px;
}
.ac-detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ac-detail-title__no {
  font-size: var(--eb-font-size-base, 14px);
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
}
.ac-detail-body {
  padding: 16px;
}
.ac-desc {
  margin: 20px 0 4px;
}
.ac-sub-title {
  margin: 20px 0 10px;
  padding-left: 8px;
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
  border-left: 3px solid var(--eb-color-primary, #175dff);
}
</style>
