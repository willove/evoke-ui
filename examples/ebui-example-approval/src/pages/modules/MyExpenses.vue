<template>
  <div class="me-page">
    <eb-page-header title="我的申请" subtitle="报销单提交、进度跟踪与撤回">
      <template #actions>
        <eb-button type="primary" size="small" @click="openCreate">
          <eb-icon name="plus" :size="14" />
          发起报销
        </eb-button>
      </template>
    </eb-page-header>

    <eb-row :gutter="16" class="me-block">
      <eb-col :xs="24" :sm="12" :lg="6">
        <eb-stat-card label="累计提交" :value="myApplications.length" unit="单" icon="file-text" type="primary" />
      </eb-col>
      <eb-col :xs="24" :sm="12" :lg="6">
        <eb-stat-card label="审批中" :value="countOf('pending')" unit="单" icon="time-circle" type="warning" />
      </eb-col>
      <eb-col :xs="24" :sm="12" :lg="6">
        <eb-stat-card label="已通过" :value="countOf('approved')" unit="单" icon="check-circle" type="success" />
      </eb-col>
      <eb-col :xs="24" :sm="12" :lg="6">
        <eb-stat-card label="被驳回" :value="countOf('rejected')" unit="单" icon="close-circle" type="danger" />
      </eb-col>
    </eb-row>

    <eb-section-card class="me-card">
      <div class="me-filter">
        <eb-segmented
          v-model="statusFilter"
          :options="[{ label: '全部', value: 'all' }, ...EXPENSE_STATUS.map((s) => ({ label: s.label, value: s.value }))]"
          size="small"
        />
      </div>
      <eb-data-table
        title="报销单"
        :operations-width="150"
        :columns="columns"
        :data="filteredRows"
        :show-pagination="false"
      >
        <template #no="{ row }">
          <eb-cell-stack :main="row.no" :sub="TYPE_LABEL[row.type] + ' · ' + row.submittedAt" />
        </template>
        <template #amount="{ row }">
          <span class="me-amount">¥{{ row.amount.toLocaleString() }}</span>
        </template>
        <template #status="{ row }">
          <eb-status-tag :value="row.status" :statuses="EXPENSE_STATUS" />
        </template>
        <template #operations="{ row }">
          <eb-button text type="primary" size="small" @click="view(row)">详情</eb-button>
          <eb-popconfirm
            v-if="row.status === 'pending'"
            title="撤回后需重新提交，确认撤回？"
            icon-type="warning"
            @confirm="withdraw(row)"
          >
            <eb-button text type="danger" size="small">撤回</eb-button>
          </eb-popconfirm>
        </template>
      </eb-data-table>
    </eb-section-card>

    <!-- 详情弹窗 -->
    <eb-dialog v-model="detailVisible" :title="`报销单 · ${current.no}`" width="640px">
      <eb-steps :active="current.currentStep" align-center :process-status="current.status === 'rejected' ? 'error' : 'process'">
        <eb-step v-for="node in FLOW_NODES" :key="node" :title="node" />
      </eb-steps>
      <eb-detail-descriptions :column="2" border :data="current" :items="detailItems" class="me-detail-desc">
        <template #type="{ value }">{{ TYPE_LABEL[value] }}</template>
        <template #amount="{ value }">¥{{ value.toLocaleString() }}</template>
      </eb-detail-descriptions>

      <div class="me-sub-title">费用明细（{{ current.items?.length || 0 }} 项）</div>
      <eb-table :data="current.items || []">
        <eb-table-column prop="type" label="费用类型" width="120">
          <template #default="{ row }">{{ TYPE_LABEL[row.type] }}</template>
        </eb-table-column>
        <eb-table-column prop="note" label="说明" min-width="180" />
        <eb-table-column prop="amount" label="金额（元）" align="right" width="110" />
      </eb-table>

      <div class="me-sub-title">审批记录</div>
      <eb-audit-timeline :items="auditItems" />
    </eb-dialog>

    <!-- 发起报销 -->
    <eb-dialog v-model="createVisible" title="发起报销" width="680px" :close-on-click-modal="false">
      <eb-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <eb-form-item label="费用类型" prop="type">
          <eb-select v-model="form.type" style="width: 240px">
            <eb-option v-for="t in EXPENSE_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </eb-select>
        </eb-form-item>
        <eb-form-item label="费用明细" prop="items">
          <div class="me-items">
            <div v-for="(item, i) in form.items" :key="i" class="me-items__row">
              <eb-select v-model="item.type" style="width: 130px">
                <eb-option v-for="t in EXPENSE_TYPES" :key="t.value" :label="t.label" :value="t.value" />
              </eb-select>
              <eb-input-number v-model="item.amount" :min="0" :step="50" style="width: 130px" />
              <eb-input v-model="item.note" placeholder="费用说明" style="flex: 1" />
              <eb-button
                text
                type="danger"
                size="small"
                :disabled="form.items.length <= 1"
                @click="form.items.splice(i, 1)"
              >
                删除
              </eb-button>
            </div>
            <eb-button size="small" @click="addItem">
              <eb-icon name="plus" :size="12" />
              添加明细
            </eb-button>
          </div>
        </eb-form-item>
        <eb-form-item label="合计金额">
          <span class="me-total">¥{{ totalAmount.toLocaleString() }}</span>
        </eb-form-item>
        <eb-form-item label="事由备注" prop="remark">
          <eb-textarea v-model="form.remark" :rows="2" maxlength="100" show-word-limit placeholder="补充报销事由，帮助审批人理解" />
        </eb-form-item>
      </eb-form>
      <template #footer>
        <eb-button @click="createVisible = false">取消</eb-button>
        <eb-button type="primary" @click="submit">提交审批</eb-button>
      </template>
    </eb-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'
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
  EbMessage.info(`报销单 ${row.no} 已撤回`)
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
        EbMessage.warning('合计金额需大于 0')
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
      EbMessage.success(`报销单 ${app.no} 已提交，等待部门经理审批`)
    })
    .catch(() => {
      EbMessage.warning('请完善费用明细后提交')
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
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
  border-left: 3px solid var(--eb-color-primary, #175dff);
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
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-color-danger, #e34d59);
}
</style>
