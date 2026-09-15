<template>
  <eb-table-page
    :title="t('pages.orders')"
    :request="request"
    :fields="[
      { prop: 'keyword', label: t('orders.keyword'), placeholder: t('orders.keywordPlaceholder') },
      {
        prop: 'state',
        label: t('orders.state'),
        type: 'select',
        options: [
          { label: t('orders.statePaid'), value: 'paid' },
          { label: t('orders.statePending'), value: 'pending' },
        ],
      },
    ]"
    :columns="[
      { prop: 'no', label: t('orders.colNo'), width: 150 },
      { prop: 'buyer', label: t('orders.colBuyer') },
      { prop: 'amount', label: t('orders.colAmount'), align: 'right', sortable: true },
      { prop: 'state', label: t('orders.colState'), slot: 'state' },
    ]"
  >
    <template #toolbar>
      <eb-button type="primary" size="small" @click="notify({ type: 'success', title: t('list.new') })">
        {{ t('list.new') }}
      </eb-button>
    </template>
    <template #state="{ row }">
      <eb-status-tag :value="row.state" :statuses="orderStates" />
    </template>
  </eb-table-page>
</template>

<script setup>
import { useSettings } from '../settings'

const { t, notify } = useSettings()

const orders = Array.from({ length: 38 }, (_, i) => ({
  no: `SO-2026${String(1000 + i)}`,
  buyer: `客户 ${String.fromCharCode(65 + (i % 12))}${i}`,
  amount: 1280 + ((i * 617) % 9000),
  state: i % 3 === 0 ? 'pending' : 'paid',
}))

const orderStates = [
  { value: 'paid', label: t('orders.statePaid'), type: 'success' },
  { value: 'pending', label: t('orders.statePending'), type: 'warning' },
]

async function request(params) {
  const { page = 1, pageSize = 10, keyword, state } = params
  let list = orders
  if (keyword) list = list.filter((o) => o.no.includes(keyword) || o.buyer.includes(keyword))
  if (state) list = list.filter((o) => o.state === state)
  await new Promise((r) => setTimeout(r, 200))
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}
</script>
