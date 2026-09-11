<template>
  <div class="odm-page">
    <eb-page-header title="订单管理" subtitle="全渠道订单查询与流转">
      <template #actions>
        <eb-button size="small" @click="exporting">
          <eb-icon name="export" :size="14" />
          导出
        </eb-button>
      </template>
    </eb-page-header>

    <eb-section-card class="odm-card">
      <eb-search-filter v-model="query" :fields="fields" :loading="loading" @search="onSearch" />
      <eb-data-table
        title="订单列表"
        show-index
        :operations-width="130"
        :loading="loading"
        :columns="columns"
        :data="pagedRows"
        :show-pagination="false"
        :show-total="false"
      >
        <template #status="{ row }">
          <eb-status-tag :value="row.status" :statuses="ORDER_STATUS" />
        </template>
        <template #operations="{ row }">
          <eb-button text type="primary" size="small" @click="view(row)">查看</eb-button>
          <eb-popconfirm
            v-if="row.status === 'unpaid'"
            title="待付款订单确认取消？"
            icon-type="danger"
            @confirm="cancel(row)"
          >
            <eb-button text type="danger" size="small">取消</eb-button>
          </eb-popconfirm>
        </template>
      </eb-data-table>
      <div class="odm-footer">
        <eb-pagination v-model="page" :total="filteredRows.length" :page-size="pageSize" layout="total, prev, pager, next" />
      </div>
    </eb-section-card>

    <eb-dialog v-model="detailVisible" title="订单详情" width="560px">
      <eb-detail-descriptions :column="2" border :data="current" :items="detailItems">
        <template #status="{ value }">
          <eb-status-tag :value="value" :statuses="ORDER_STATUS" />
        </template>
      </eb-detail-descriptions>
    </eb-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'
import { orders, ORDER_STATUS, CHANNELS } from '../mock.js'

const query = ref({ orderNo: '', status: '', channel: '' })
const fields = [
  { prop: 'orderNo', label: '订单号', placeholder: '请输入订单号' },
  { prop: 'status', label: '订单状态', type: 'select', options: ORDER_STATUS },
  { prop: 'channel', label: '下单渠道', type: 'select', options: CHANNELS.map((c) => ({ label: c, value: c })) },
]

const filteredRows = computed(() =>
  orders.filter((o) => {
    const hitNo = !query.value.orderNo || o.orderNo.includes(query.value.orderNo)
    const hitStatus = !query.value.status || o.status === query.value.status
    const hitChannel = !query.value.channel || o.channel === query.value.channel
    return hitNo && hitStatus && hitChannel
  }),
)

const page = ref(1)
const pageSize = 10
const pagedRows = computed(() => filteredRows.value.slice((page.value - 1) * pageSize, page.value * pageSize))

function onSearch() {
  page.value = 1
}

const columns = [
  { prop: 'orderNo', label: '订单号', width: 175 },
  { prop: 'buyer', label: '买家', width: 90 },
  { prop: 'channel', label: '渠道', width: 115 },
  { prop: 'amount', label: '金额（元）', align: 'right', width: 105 },
  { prop: 'createdAt', label: '下单时间', width: 165 },
  { prop: 'status', label: '状态', slot: 'status', width: 92 },
]

/* ---------------- 详情弹窗 ---------------- */
const detailVisible = ref(false)
const current = reactive({})
const detailItems = [
  { prop: 'orderNo', label: '订单号', span: 2 },
  { prop: 'status', label: '状态', slot: 'status' },
  { prop: 'channel', label: '渠道' },
  { prop: 'buyer', label: '买家' },
  { prop: 'amount', label: '金额（元）' },
  { prop: 'createdAt', label: '下单时间', span: 2 },
]

function view(row) {
  Object.assign(current, row)
  detailVisible.value = true
}

function cancel(row) {
  row.status = 'cancelled'
  EbMessage.warning(`订单 ${row.orderNo} 已取消`)
}

function exporting() {
  EbMessage.success(`已导出 ${filteredRows.value.length} 条订单`)
}
</script>

<style scoped>
.odm-page {
  padding: 16px;
}
.odm-card {
  margin-top: 12px;
}
/* SearchFilter 自带外框，与表格之间只留间距 */
.odm-card :deep(.eb-search-filter) {
  margin-bottom: 16px;
}
.odm-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
</style>
