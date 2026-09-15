<template>
  <eb-table-page
    :title="t('pages.members')"
    :request="request"
    :fields="[
      { prop: 'keyword', label: t('members.keyword'), placeholder: t('members.keywordPlaceholder') },
      {
        prop: 'role',
        label: t('members.role'),
        type: 'select',
        options: [
          { label: t('members.roleAdmin'), value: 'admin' },
          { label: t('members.roleMember'), value: 'member' },
        ],
      },
    ]"
    :columns="[
      { prop: 'name', label: t('members.colName'), stack: (row) => row.email },
      { prop: 'role', label: t('members.colRole') },
      { prop: 'status', label: t('members.colStatus'), slot: 'status' },
      { prop: 'lastActive', label: t('members.colLast') },
    ]"
    selectable
    @selection-change="(rows) => (selection = rows)"
  >
    <template #toolbar="{ selectionCount }">
      <eb-button type="primary" size="small" @click="notify({ type: 'success', title: t('list.new') })">
        {{ t('list.new') }}
      </eb-button>
      <eb-button
        size="small"
        :disabled="!selectionCount"
        @click="notify({ type: 'info', title: `${t('list.export')} × ${selectionCount}` })"
      >
        {{ t('list.export') }}
      </eb-button>
    </template>
    <template #operations>
      <eb-button text type="primary" size="small">{{ t('list.edit') }}</eb-button>
      <eb-button text type="danger" size="small" @click="confirmDelete">
        {{ t('list.delete') }}
      </eb-button>
    </template>
    <template #status="{ row }">
      <eb-status-tag :value="row.status" :statuses="statuses" />
    </template>
  </eb-table-page>
</template>

<script setup>
/** EbTablePage 实战：查询区 + 远程分页 + 工具栏 + 操作列 + 状态列插槽 */
import { ref } from 'vue'
import { EbMsgbox } from '@wil-works/evoke-business-ui'
import { useSettings } from '../settings'

const { t, notify } = useSettings()
const selection = ref([])

const ROLES = ['admin', 'member']
const NAMES = ['张三', '李四', '王五', '赵六', '陈七', '周八']

const members = Array.from({ length: 46 }, (_, i) => ({
  id: i + 1,
  name: `${NAMES[i % NAMES.length]}-${String(i + 1).padStart(2, '0')}`,
  email: `user${i + 1}@example.com`,
  role: ROLES[i % ROLES.length],
  status: i % 7 === 0 ? 'disabled' : 'active',
  lastActive: `09-${String((i % 28) + 1).padStart(2, '0')} 1${i % 4}:${String((i * 13) % 60).padStart(2, '0')}`,
}))

const statuses = [
  { value: 'active', label: t('members.statusActive'), type: 'success' },
  { value: 'disabled', label: t('members.statusDisabled'), type: 'danger' },
]

async function request(params) {
  const { page = 1, pageSize = 10, keyword, role } = params
  let list = members
  if (keyword) list = list.filter((m) => m.name.includes(keyword) || m.email.includes(keyword))
  if (role) list = list.filter((m) => m.role === role)
  await new Promise((r) => setTimeout(r, 250))
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

function confirmDelete() {
  EbMsgbox.confirm(t('list.deleteConfirm'), t('list.delete')).then(
    () => notify({ type: 'success', title: t('list.deleted') }),
    () => {},
  )
}
</script>
