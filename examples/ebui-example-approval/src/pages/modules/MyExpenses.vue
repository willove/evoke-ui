<template>
  <div class="me-page">
    <ev-page-header title="我的申请" subtitle="报销单提交、进度跟踪与撤回">
      <template #actions>
        <ev-button type="primary" size="small" @click="openCreate">
          <ev-icon name="plus" :size="14" />
          发起报销
        </ev-button>
      </template>
    </ev-page-header>

    <ev-row :gutter="16" class="me-block">
      <ev-col :xs="24" :sm="12" :lg="6">
        <ev-stat-card label="累计提交" :value="myApplications.length" unit="单" icon="file-text" type="primary" />
      </ev-col>
      <ev-col :xs="24" :sm="12" :lg="6">
        <ev-stat-card label="审批中" :value="countOf('pending')" unit="单" icon="time-circle" type="warning" />
      </ev-col>
      <ev-col :xs="24" :sm="12" :lg="6">
        <ev-stat-card label="已通过" :value="countOf('approved')" unit="单" icon="check-circle" type="success" />
      </ev-col>
      <ev-col :xs="24" :sm="12" :lg="6">
        <ev-stat-card label="被驳回" :value="countOf('rejected')" unit="单" icon="close-circle" type="danger" />
      </ev-col>
    </ev-row>

    <ev-section-card class="me-card">
      <div class="me-filter">
        <ev-segmented
          v-model="statusFilter"
          :options="[{ label: '全部', value: 'all' }, ...EXPENSE_STATUS.map((s) => ({ label: s.label, value: s.value }))]"
          size="small"
        />
      </div>
      <ev-data-table
        title="报销单"
        :operations-width="150"
        :columns="columns"
        :data="filteredRows"
        :show-pagination="false"
      >
        <template #no="{ row }">
          <ev-cell-stack :main="row.no" :sub="TYPE_LABEL[row.type] + ' · ' + row.submittedAt" />
        </template>
        <template #amount="{ row }">
          <span class="me-amount">¥{{ row.amount.toLocaleString() }}</span>
        </template>
        <template #status="{ row }">
          <ev-status-tag :value="row.status" :statuses="EXPENSE_STATUS" />
        </template>
        <template #operations="{ row }">
          <ev-button text type="primary" size="small" @click="view(row)">详情</ev-button>
          <ev-popconfirm
            v-if="row.status === 'pending'"
            title="撤回后需重新提交，确认撤回？"
            icon-type="warning"
            @confirm="withdraw(row)"
          >
            <ev-button text type="danger" size="small">撤回</ev-button>
          </ev-popconfirm>
        </template>
      </ev-data-table>
    </ev-section-card>

    <!-- 详情弹窗 -->
    <ev-dialog v-model="detailVisible" :title="`报销单 · ${current.no}`" width="640px">
      <ev-steps :active="current.currentStep" align-center :process-status="current.status === 'rejected' ? 'error' : 'process'">
        <ev-step v-for="node in FLOW_NODES" :key="node" :title="node" />
      </ev-steps>
      <ev-detail-descriptions :column="2" border :data="current" :items="detailItems" class="me-detail-desc">
        <template #type="{ value }">{{ TYPE_LABEL[value] }}</template>
        <template #amount="{ value }">¥{{ value.toLocaleString() }}</template>
      </ev-detail-descriptions>

      <div class="me-sub-title">费用明细（{{ current.items?.length || 0 }} 项）</div>
      <ev-table :data="current.items || []">
        <ev-table-column prop="type" label="费用类型" width="120">
          <template #default="{ row }">{{ TYPE_LABEL[row.type] }}</template>
        </ev-table-column>
        <ev-table-column prop="note" label="说明" min-width="180" />
        <ev-table-column prop="amount" label="金额（元）" align="right" width="110" />
      </ev-table>

      <div class="me-sub-title">审批记录</div>
      <ev-audit-timeline :items="auditItems" />
    </ev-dialog>

    <!-- 发起报销 -->
    <ev-dialog v-model="createVisible" title="发起报销" width="680px" :close-on-click-modal="false">
      <ev-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <ev-form-item label="费用类型" prop="type">
          <ev-select v-model="form.type" style="width: 240px">
            <ev-option v-for="t in EXPENSE_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </ev-select>
        </ev-form-item>
        <ev-form-item label="费用明细" prop="items">
          <div class="me-items">
            <div v-for="(item, i) in form.items" :key="i" class="me-items__row">
              <ev-select v-model="item.type" style="width: 130px">
                <ev-option v-for="t in EXPENSE_TYPES" :key="t.value" :label="t.label" :value="t.value" />
              </ev-select>
              <ev-input-number v-model="item.amount" :min="0" :step="50" style="width: 130px" />
              <ev-input v-model="item.note" placeholder="费用说明" style="flex: 1" />
              <ev-button
                text
                type="danger"
                size="small"
                :disabled="form.items.length <= 1"
                @click="form.items.splice(i, 1)"
              >
                删除
              </ev-button>
            </div>
            <ev-button size="small" @click="addItem">
              <ev-icon name="plus" :size="12" />
              添加明细
            </ev-button>
          </div>
        </ev-form-item>
        <ev-form-item label="合计金额">
          <span class="me-total">¥{{ totalAmount.toLocaleString() }}</span>
        </ev-form-item>
        <ev-form-item label="事由备注" prop="remark">
          <ev-textarea v-model="form.remark" :rows="2" maxlength="100" show-word-limit placeholder="补充报销事由，帮助审批人理解" />
        </ev-form-item>
      </ev-form>
      <template #footer>
        <ev-button @click="createVisible = false">取消</ev-button>
        <ev-button type="primary" @click="submit">提交审批</ev-button>
      </template>
    </ev-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'
import {
  myApplications,
  createApplication,
  EXPENSE_STATUS,
  EXPENSE_TYPES,
  TYPE_LABEL,
  FLOW_NODES,
} from '../mock.js'

const emit = defineEmits(['create'])

/* ---------------- KPI 与列表 ---------------- */
const countOf = (status) => myApplications.filter((a) => a.status === status).length

const statusFilter = ref('all')
const filteredRows = computed(() =>
  statusFilter.value === 'all'
    ? myApplications
    : myApplications.filter((a) => a.status === statusFilter.value),
)

const columns = [
  { prop: 'no', label: '单号', slot: 'no', minWidth: 210 },
  { prop: 'amount', label: '金额', slot: 'amount', align: 'right', width: 120 },
  { prop: 'status', label: '状态', slot: 'status', width: 96 },
]

/* ---------------- 撤回 ---------------- */
function withdraw(row) {
  row.status = 'withdrawn'
  EvMessage.info(`报销单 ${row.no} 已撤回`)
}

/* ---------------- 详情弹窗 ---------------- */
const detailVisible = ref(false)
const current = reactive({})

const detailItems = [
  { prop: 'type', label: '费用类型', slot: 'type' },
  { prop: 'amount', label: '合计金额', slot: 'amount' },
  { prop: 'applicant', label: '申请人' },
  { prop: 'submittedAt', label: '提交时间' },
  { prop: 'remark', label: '事由备注', span: 2 },
]

const auditItems = computed(() =>
  (current.flow || []).map((f) => ({
    id: f.at,
    operator: f.operator,
    action: f.action,
    createdAt: f.at,
    detail: f.detail,
  })),
)

function view(row) {
  Object.assign(current, row)
  detailVisible.value = true
}

/* ---------------- 发起报销（动态费用明细） ---------------- */
const createVisible = ref(false)
const formRef = ref(null)
const emptyForm = () => ({
  type: 'travel',
  items: [{ type: 'travel', amount: 0, note: '' }],
  remark: '',
})
const form = reactive(emptyForm())

const rules = {
  type: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  items: [
    {
      required: true,
      validator: (_, value, callback) => {
        const valid = value?.length && value.every((it) => it.amount > 0 && it.note.trim())
        callback(valid ? undefined : new Error('每项明细需填写金额与说明'))
      },
      trigger: 'change',
    },
  ],
}

const totalAmount = computed(() => form.items.reduce((acc, it) => acc + (it.amount || 0), 0))

function addItem() {
  form.items.push({ type: form.type, amount: 0, note: '' })
}

function openCreate() {
  Object.assign(form, emptyForm())
  formRef.value?.clearValidate()
  createVisible.value = true
}

function submit() {
  formRef.value
    .validate()
    .then(() => {
      if (totalAmount.value <= 0) {
        EvMessage.warning('合计金额需大于 0')
        return
      }
      const app = createApplication({
        type: form.type,
        items: form.items.map((it) => ({ ...it })),
        remark: form.remark,
        applicant: '林晓',
        dept: '业务组',
      })
      myApplications.unshift(app)
      emit('create', app)
      createVisible.value = false
      statusFilter.value = 'all'
      EvMessage.success(`报销单 ${app.no} 已提交，等待部门经理审批`)
    })
    .catch(() => {
      EvMessage.warning('请完善费用明细后提交')
    })
}
</script>

<style scoped>
.me-page {
  padding: 16px;
}
.me-block {
  margin-top: 16px;
}
.me-card {
  margin-top: 16px;
}
.me-filter {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
.me-amount {
  font-variant-numeric: tabular-nums;
}
.me-detail-desc {
  margin: 20px 0 4px;
}
.me-sub-title {
  margin: 20px 0 10px;
  padding-left: 8px;
  font-weight: var(--ev-font-weight-semibold, 600);
  color: var(--ev-text-color-primary, #1f2329);
  border-left: 3px solid var(--ev-color-primary, #175dff);
}
.me-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.me-items__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.me-total {
  font-size: 18px;
  font-weight: var(--ev-font-weight-semibold, 600);
  color: var(--ev-color-danger, #e34d59);
}
</style>
