<template>
  <ev-app-layout
    title="云眠家居 · 运营中台"
    logo-text="云"
    :collapsed="collapsed"
    @update:collapsed="collapsed = $event"
    :is-dark="isDark"
    @toggle="toggleDark"
    :active-menu="activeMenu"
    :active-title="activeTitle"
  >
    <template #menu>
      <ev-menu-item index="dashboard" @click="switchView('dashboard')">
        <ev-icon name="dashboard" />
        <span>运营工作台</span>
      </ev-menu-item>
      <ev-menu-item index="orders" @click="switchView('orders')">
        <ev-icon name="bill" />
        <span>订单管理</span>
      </ev-menu-item>
      <ev-sub-menu index="goods">
        <template #title>
          <ev-icon name="goods" />
          <span>商品管理</span>
        </template>
        <ev-menu-item index="goods-list" @click="switchView('goods-list')">
          <ev-icon name="orderedlist" />
          <span>商品列表</span>
        </ev-menu-item>
        <ev-menu-item index="goods-category" @click="switchView('goods-category')">
          <ev-icon name="tags" />
          <span>分类管理</span>
        </ev-menu-item>
      </ev-sub-menu>
      <ev-menu-item index="members" @click="switchView('members')">
        <ev-icon name="customer" />
        <span>会员管理</span>
      </ev-menu-item>
      <ev-menu-item index="marketing" @click="switchView('marketing')">
        <ev-icon name="marketing" />
        <span>营销中心</span>
      </ev-menu-item>
    </template>

    <template #topbar-right>
      <div class="dash-topbar">
        <ev-badge :value="5" :max="99">
          <ev-icon name="bell" :size="18" />
        </ev-badge>
        <ev-avatar :size="28">运</ev-avatar>
      </div>
    </template>

    <!-- 工作台主视图 -->
    <div v-if="activeMenu === 'dashboard'" class="dash-page">
      <ev-page-header title="运营工作台" subtitle="数据截至 2026-09-06 12:00">
        <template #actions>
          <ev-button size="small" @click="refresh">
            <ev-icon name="refresh" :size="14" />
            刷新数据
          </ev-button>
          <ev-button type="primary" size="small">
            <ev-icon name="plus" :size="14" />
            新建活动
          </ev-button>
        </template>
      </ev-page-header>

      <!-- KPI 指标卡 -->
      <ev-row :gutter="16" class="dash-block" :key="refreshTick">
        <ev-col v-for="k in kpis" :key="k.label" :xs="24" :sm="12" :lg="6">
          <ev-stat-card :label="k.label" :value="k.value" :suffix="k.unit" :icon="k.icon" :type="k.type" :trend="k.trend" />
        </ev-col>
      </ev-row>

      <!-- 图表区 -->
      <ev-row :gutter="16" class="dash-block">
        <ev-col :xs="24" :lg="16">
          <ev-section-card title="近 7 日 GMV 趋势">
            <ev-chart :options="gmvOptions" :height="280" />
          </ev-section-card>
        </ev-col>
        <ev-col :xs="24" :lg="8">
          <ev-section-card title="销售渠道占比">
            <ev-chart :options="channelOptions" :height="280" />
          </ev-section-card>
        </ev-col>
      </ev-row>

      <!-- 明细区 -->
      <ev-row :gutter="16">
        <ev-col :xs="24" :lg="16">
          <ev-section-card title="最新订单" :padding="false">
            <ev-data-table
              :columns="orderColumns"
              :data="recentOrders"
              :show-pagination="false"
              :show-total="false"
            >
              <template #status="{ row }">
                <ev-status-tag :value="row.status" :statuses="ORDER_STATUS" />
              </template>
            </ev-data-table>
          </ev-section-card>
        </ev-col>
        <ev-col :xs="24" :lg="8">
          <ev-section-card title="待办事项">
            <div v-for="t in todos" :key="t.id" class="dash-todo">
              <span class="dash-todo__title">
                <i v-if="t.urgent" class="dash-todo__dot" />
                {{ t.title }}
              </span>
              <ev-tag size="small" effect="plain">{{ t.tag }}</ev-tag>
            </div>
          </ev-section-card>
          <ev-section-card title="平台公告" class="dash-block--top">
            <div v-for="n in notices" :key="n.id" class="dash-notice">
              <ev-link type="primary">{{ n.title }}</ev-link>
              <span class="dash-notice__time">{{ n.time }}</span>
            </div>
          </ev-section-card>
        </ev-col>
      </ev-row>
    </div>

    <!-- 业务模块视图 -->
    <template v-else-if="activeMenu === 'orders'">
      <OrderListPage />
    </template>
    <template v-else-if="activeMenu === 'goods-list'">
      <GoodsListPage />
    </template>
    <template v-else-if="activeMenu === 'goods-category'">
      <CategoryPage />
    </template>
    <template v-else-if="activeMenu === 'members'">
      <MemberListPage />
    </template>
    <template v-else-if="activeMenu === 'marketing'">
      <MarketingPage />
    </template>
  </ev-app-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDarkMode } from '@wil-works/evoke-business-ui'
import { kpis, gmvTrend, channelShare, recentOrders, ORDER_STATUS, todos, notices } from './mock.js'
import OrderListPage from './modules/OrderListPage.vue'
import GoodsListPage from './modules/GoodsListPage.vue'
import CategoryPage from './modules/CategoryPage.vue'
import MarketingPage from './modules/MarketingPage.vue'
// 会员管理直接复用 CRUD 列表示例的页面（跨工程源码级复用）
import MemberListPage from '../../../ebui-example-crud-list/src/pages/MemberListPage.vue'

const { isDark, toggleDark } = useDarkMode()

/* ---------------- 侧边导航（无 vue-router，用 index 驱动视图切换） ---------------- */
const collapsed = ref(false)
const activeMenu = ref('dashboard')

const MENU_TITLES = {
  dashboard: '运营工作台',
  orders: '订单管理',
  'goods-list': '商品列表',
  'goods-category': '分类管理',
  members: '会员管理',
  marketing: '营销中心',
}
const activeTitle = computed(() => MENU_TITLES[activeMenu.value] ?? '运营工作台')

function switchView(index) {
  activeMenu.value = index
}

/* ---------------- KPI ---------------- */
const refreshTick = ref(0)

function refresh() {
  refreshTick.value++
}

/* ---------------- 图表 ---------------- */
const gmvOptions = {
  type: 'line',
  labels: gmvTrend.labels,
  series: gmvTrend.series,
  legend: { show: true },
  tooltip: { show: true },
}

const channelOptions = {
  type: 'doughnut',
  pieData: channelShare.pieData,
  legend: { show: true, position: 'bottom' },
}

/* ---------------- 最新订单 ---------------- */
const orderColumns = [
  { prop: 'orderNo', label: '订单号', width: 165 },
  { prop: 'buyer', label: '买家', width: 80 },
  { prop: 'channel', label: '渠道', width: 110 },
  { prop: 'amount', label: '金额（元）', align: 'right', width: 100 },
  { prop: 'status', label: '状态', slot: 'status', width: 88 },
]
</script>

<style scoped>
.dash-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
}
.dash-page {
  padding: 4px 16px 24px;
}
.dash-block {
  margin-top: 16px;
}
/* 行内卡片等高拉伸（如 KPI 卡有无趋势行时以最高者为准） */
.dash-block :deep(.el-col) {
  display: flex;
}
.dash-block :deep(.el-col > *) {
  flex: 1;
  width: 100%;
}
.dash-block--top {
  margin-top: 16px;
}
.dash-todo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 0;
}
.dash-todo + .dash-todo {
  border-top: 1px solid var(--ev-border-color-extra-light, #f0f1f3);
}
.dash-todo__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ev-font-size-base, 14px);
  color: var(--ev-text-color-primary, #1f2329);
}
.dash-todo__dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--ev-color-danger, #e34d59);
}
.dash-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
}
.dash-notice__time {
  flex-shrink: 0;
  font-size: var(--ev-font-size-xs, 12px);
  color: var(--ev-text-color-secondary, #8a9099);
}
</style>
