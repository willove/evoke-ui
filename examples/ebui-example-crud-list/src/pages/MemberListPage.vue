<template>
  <div class="ml-page">
    <ev-page-header title="会员管理" subtitle="统一维护会员档案、等级与状态">
      <template #actions>
        <ev-button size="small" @click="handleRefresh">
          <ev-icon name="refresh" :size="14" />
          刷新
        </ev-button>
      </template>
    </ev-page-header>

    <ev-section-card class="ml-card">
      <!-- 筛选区（SearchFilter 自带外框，无需再加分隔线） -->
      <ev-search-filter
        v-model="query"
        :fields="filterFields"
        :loading="loading"
        @search="onSearch"
      />

      <!-- 列表区 -->
      <ev-data-table
        ref="tableRef"
        title="会员列表"
        selectable
        show-index
        :operations-width="120"
        :loading="loading"
        :columns="visibleColumns"
        :data="rows"
        v-model:page="page"
        v-model:page-size="pageSize"
        :total="total"
        @page-change="load"
        @selection-change="onSelectionChange"
      >
        <template #toolbar>
          <ev-button type="primary" size="small" @click="openCreate">
            <ev-icon name="plus" :size="14" />
            新建会员
          </ev-button>
          <ev-button size="small" :disabled="!selection.length" @click="batchRemove">
            批量删除{{ selection.length ? `（${selection.length}）` : '' }}
          </ev-button>
          <ev-button size="small" @click="ioVisible = true">
            <ev-icon name="swap" :size="14" />
            导入 / 导出
          </ev-button>
          <ev-column-settings v-model="visibleProps" :columns="settingColumns" button-text="列设置" />
        </template>

        <template #level="{ row }">
          <ev-tag :type="row.level === 'platinum' ? 'primary' : row.level === 'gold' ? 'warning' : 'info'" effect="plain">
            {{ LEVEL_LABEL[row.level] }}
          </ev-tag>
        </template>

        <template #balance="{ row }">
          <span class="ml-money">¥{{ row.balance.toLocaleString() }}</span>
        </template>

        <template #status="{ row }">
          <ev-status-tag :value="row.status" :statuses="MEMBER_STATUS" />
        </template>

        <template #operations="{ row }">
          <ev-button text type="primary" size="small" @click="openEdit(row)">编辑</ev-button>
          <ev-popconfirm title="删除后不可恢复，确认删除该会员？" icon-type="danger" @confirm="removeOne(row)">
            <ev-button text type="danger" size="small">删除</ev-button>
          </ev-popconfirm>
        </template>
      </ev-data-table>
    </ev-section-card>

    <!-- 新建 / 编辑弹窗 -->
    <ev-dialog
      v-model="formVisible"
      :title="editing ? `编辑会员 · ${editing.name}` : '新建会员'"
      width="560px"
      :close-on-click-modal="false"
    >
      <ev-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <ev-form-item label="会员姓名" prop="name">
          <ev-input v-model="form.name" placeholder="请输入姓名" maxlength="20" show-word-limit />
        </ev-form-item>
        <ev-form-item label="手机号" prop="phone">
          <ev-input v-model="form.phone" placeholder="11 位手机号" />
        </ev-form-item>
        <ev-form-item label="邮箱" prop="email">
          <ev-input v-model="form.email" placeholder="选填" />
        </ev-form-item>
        <ev-form-item label="会员等级" prop="level">
          <ev-select v-model="form.level" style="width: 100%">
            <ev-option v-for="l in MEMBER_LEVEL" :key="l.value" :label="l.label" :value="l.value" />
          </ev-select>
        </ev-form-item>
        <ev-form-item label="所属部门" prop="dept">
          <ev-select v-model="form.dept" style="width: 100%">
            <ev-option v-for="d in DEPTS" :key="d" :label="d" :value="d" />
          </ev-select>
        </ev-form-item>
        <ev-form-item label="账户状态" prop="status">
          <ev-radio-group v-model="form.status">
            <ev-radio v-for="s in MEMBER_STATUS" :key="s.value" :label="s.value">{{ s.label }}</ev-radio>
          </ev-radio-group>
        </ev-form-item>
        <ev-form-item label="账户余额" prop="balance">
          <ev-input-number v-model="form.balance" :min="0" :step="100" style="width: 200px" />
        </ev-form-item>
      </ev-form>
      <template #footer>
        <ev-button @click="formVisible = false">取消</ev-button>
        <ev-button type="primary" :loading="saving" @click="save">保存</ev-button>
      </template>
    </ev-dialog>

    <!-- 导入 / 导出弹窗 -->
    <ev-dialog v-model="ioVisible" title="导入 / 导出会员" width="640px">
      <ev-import-export-panel
        ref="ioRef"
        template-name="会员导入模板.xlsx"
        import-tip="首列为会员姓名，手机号列必填；单次最多 2000 条。"
        @import-file="onImportFile"
        @export="onExport"
        @download-template="EvMessage.info('示例：下载「会员导入模板.xlsx』')"
      />
    </ev-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'
import {
  MEMBER_STATUS,
  MEMBER_LEVEL,
  LEVEL_LABEL,
  DEPTS,
  fetchMembers,
  createMember,
  updateMember,
  removeMembers,
  importMembers,
} from './mock.js'

/* ---------------- 筛选 ---------------- */
// 用 ref 包对象：v-model 在查询时会整体替换值对象，reactive 常量承接不了这种赋值
const query = ref({ keyword: '', level: '', status: '' })
const filterFields = [
  { prop: 'keyword', label: '关键词', placeholder: '姓名 / 手机号 / 邮箱' },
  { prop: 'level', label: '会员等级', type: 'select', options: MEMBER_LEVEL },
  { prop: 'status', label: '账户状态', type: 'select', options: MEMBER_STATUS },
]

/* ---------------- 列配置与列设置 ---------------- */
const allColumns = [
  { prop: 'name', label: '会员姓名', width: 110 },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'level', label: '等级', slot: 'level', width: 92 },
  { prop: 'owner', label: '负责人', stack: (row) => row.dept, width: 110 },
  { prop: 'balance', label: '账户余额', slot: 'balance', align: 'right', width: 100 },
  { prop: 'createdAt', label: '注册时间', width: 165 },
  { prop: 'status', label: '状态', slot: 'status', width: 88 },
]
const settingColumns = allColumns.map(({ prop, label }) => ({ prop, label }))
const visibleProps = ref(settingColumns.map((c) => c.prop))
const visibleColumns = computed(() =>
  visibleProps.value.map((p) => allColumns.find((c) => c.prop === p)).filter(Boolean),
)

/* ---------------- 列表加载（模拟服务端分页） ---------------- */
const tableRef = ref(null)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
let lastQuery = { ...query.value }

async function load() {
  loading.value = true
  try {
    const res = await fetchMembers({ ...lastQuery, page: page.value, pageSize: pageSize.value })
    rows.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function onSearch(values) {
  // 查询条件变化时回到第一页
  lastQuery = { ...values }
  page.value = 1
  load()
}

function handleRefresh() {
  load()
  EvMessage.success('列表已刷新')
}

/* ---------------- 行选择与删除 ---------------- */
const selection = ref([])

function onSelectionChange(rows) {
  selection.value = rows
}

async function removeOne(row) {
  removeMembers([row.id])
  EvMessage.success(`已删除会员「${row.name}」`)
  await load()
}

function batchRemove() {
  const ids = selection.value.map((r) => r.id)
  const count = removeMembers(ids)
  EvMessage.success(`已批量删除 ${count} 位会员`)
  tableRef.value?.clearSelection()
  load()
}

/* ---------------- 新建 / 编辑 ---------------- */
const formVisible = ref(false)
const saving = ref(false)
const editing = ref(null)
const formRef = ref(null)

const emptyForm = () => ({
  name: '',
  phone: '',
  email: '',
  level: 'basic',
  dept: DEPTS[0],
  status: 'active',
  balance: 0,
})
const form = reactive(emptyForm())

const rules = {
  name: [{ required: true, message: '请输入会员姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  level: [{ required: true, message: '请选择会员等级', trigger: 'change' }],
}

function openCreate() {
  editing.value = null
  Object.assign(form, emptyForm())
  formRef.value?.clearValidate()
  formVisible.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, {
    name: row.name,
    phone: row.phone,
    email: row.email,
    level: row.level,
    dept: row.dept,
    status: row.status,
    balance: row.balance,
  })
  formRef.value?.clearValidate()
  formVisible.value = true
}

async function save() {
  let ok = true
  try {
    await formRef.value.validate()
  } catch {
    ok = false
  }
  if (!ok) {
    EvMessage.warning('请先完善表单必填项')
    return
  }
  saving.value = true
  setTimeout(() => {
    if (editing.value) {
      updateMember(editing.value.id, { ...form })
      EvMessage.success('会员信息已更新')
    } else {
      createMember({ ...form })
      EvMessage.success('新建会员成功')
    }
    saving.value = false
    formVisible.value = false
    load()
  }, 400)
}

/* ---------------- 导入 / 导出 ---------------- */
const ioVisible = ref(false)
const ioRef = ref(null)

function onImportFile(file) {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
    EvMessage.error('仅支持 xlsx / xls / csv 文件')
    ioRef.value?.done('import')
    return
  }
  setTimeout(() => {
    const count = importMembers(3)
    EvMessage.success(`导入完成：新增 ${count} 位会员`)
    ioRef.value?.done('import')
    ioVisible.value = false
    load()
  }, 800)
}

function onExport(format) {
  setTimeout(() => {
    EvMessage.success(`已按 ${String(format).toUpperCase()} 格式导出 ${total.value} 条数据`)
    ioRef.value?.done('export')
  }, 800)
}

onMounted(load)
</script>

<style scoped>
.ml-page {
  padding: 16px;
}
.ml-card {
  margin-top: 12px;
}
/* SearchFilter 自带外框，与表格之间只留间距 */
.ml-card :deep(.ev-search-filter) {
  margin-bottom: 16px;
}
.ml-money {
  font-variant-numeric: tabular-nums;
}
</style>
