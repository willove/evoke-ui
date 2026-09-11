<template>
  <div ref="shellRef" class="mb-shell">
    <!-- 顶部应用栏 -->
    <header class="mb-appbar">
      <div>
        <div class="mb-appbar__hello">
          {{ activeTab === 'home' ? '早上好，林晓' : TABS.find((t) => t.key === activeTab)?.label }}
        </div>
        <div class="mb-appbar__sub">云眠研发 · 移动工作台</div>
      </div>
      <div class="mb-appbar__right">
        <eb-badge v-if="activeTab === 'home'" :value="unreadCount" :max="99">
          <eb-icon name="bell" :size="18" />
        </eb-badge>
        <eb-avatar :size="30">林</eb-avatar>
      </div>
    </header>

    <main class="mb-body">
      <!-- ═══════ 首页 ═══════ -->
      <template v-if="activeTab === 'home'">
        <div class="mb-stats">
          <div v-for="s in stats" :key="s.label" class="mb-stat">
            <span class="mb-stat__label">{{ s.label }}</span>
            <strong class="mb-stat__value">{{ s.value }}</strong>
            <span v-if="s.trend" class="mb-stat__trend">{{ s.trend }}</span>
          </div>
        </div>

        <div class="mb-simple">
          <span>简单模式</span>
          <eb-switch v-model="simpleMode" size="small" />
        </div>

        <div v-if="!simpleMode" class="mb-card">
          <div class="mb-card__title">本月用量</div>
          <div class="mb-usage">
            <eb-credits-progress
              v-for="u in usage"
              :key="u.label"
              :used="u.used"
              :total="u.total"
              :refresh-date="u.refreshDate"
              :refresh-label="u.refreshLabel"
              size="small"
            />
          </div>
        </div>

        <div v-if="!simpleMode" class="mb-card">
          <div class="mb-card__title">差旅报销审批</div>
          <eb-steps :active="1" align-center>
            <eb-step v-for="s in approvalStages" :key="s.name" :title="s.name" :description="s.date" />
          </eb-steps>
        </div>

        <div class="mb-card">
          <div class="mb-card__title">快速登记</div>
          <eb-config-provider platform="mobile">
            <div class="mb-form">
              <div class="mb-form__item">
                <label class="mb-form__label">费用类型</label>
                <eb-select v-model="form.type" placeholder="请选择费用类型" style="width: 100%">
                  <eb-option label="差旅费" value="travel" />
                  <eb-option label="交通费" value="transport" />
                  <eb-option label="餐饮招待" value="meal" />
                </eb-select>
              </div>
              <div class="mb-form__item">
                <label class="mb-form__label">发生日期</label>
                <eb-date-picker v-model="form.date" type="date" placeholder="选择日期" style="width: 100%" />
              </div>
            </div>
          </eb-config-provider>
        </div>

        <div class="mb-card">
          <eb-segmented
            v-model="homeTab"
            block
            :options="[
              { label: `待办（${todos.length}）`, value: 'todo' },
              { label: '订单', value: 'order' },
            ]"
          />
          <div class="mb-list">
            <template v-if="homeTab === 'todo'">
              <div v-for="t in todos" :key="t.id" class="mb-row">
                <div class="mb-row__main">
                  <span class="mb-row__title">{{ t.title }}</span>
                  <span class="mb-row__sub" :class="{ 'is-urgent': t.urgent }">{{ t.time }}</span>
                </div>
                <eb-button size="small" type="primary" plain @click="handleTodo(t)">处理</eb-button>
              </div>
              <div v-if="!todos.length" class="mb-list__empty">待办已清空</div>
            </template>
            <template v-else>
              <div v-for="o in orders.slice(0, 3)" :key="o.id" class="mb-row mb-row--col">
                <div class="mb-row__top">
                  <span class="mb-row__title">{{ o.id }} · {{ o.buyer }}</span>
                  <eb-status-tag :value="o.status" :statuses="ORDER_STATUS" />
                </div>
                <div class="mb-row__bottom">
                  <span class="mb-row__channel">{{ o.channel }}</span>
                  <strong class="mb-row__amount">¥{{ o.amount.toLocaleString() }}</strong>
                </div>
                <eb-progress :percentage="o.progress" :stroke-width="6" />
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- ═══════ 订单 ═══════ -->
      <template v-else-if="activeTab === 'orders'">
        <div class="mb-card">
          <div class="mb-filter">
            <eb-input v-model="orderKeyword" placeholder="搜索订单号 / 客户" style="flex: 1">
              <template #prefix>
                <eb-icon name="search" :size="14" />
              </template>
            </eb-input>
          </div>
          <eb-segmented
            v-model="orderStatus"
            block
            :options="[{ label: '全部', value: 'all' }, ...ORDER_STATUS]"
          />
          <div class="mb-list">
            <div v-for="o in filteredOrders" :key="o.id" class="mb-row mb-row--col">
              <div class="mb-row__top">
                <span class="mb-row__title">{{ o.id }} · {{ o.buyer }}</span>
                <eb-status-tag :value="o.status" :statuses="ORDER_STATUS" />
              </div>
              <div class="mb-row__bottom">
                <span class="mb-row__channel">{{ o.channel }}</span>
                <strong class="mb-row__amount">¥{{ o.amount.toLocaleString() }}</strong>
              </div>
              <eb-progress :percentage="o.progress" :stroke-width="6" />
              <div class="mb-row__actions">
                <eb-button size="small" @click="EbMessage.info(`示例：查看订单 ${o.id} 详情`)">查看详情</eb-button>
              </div>
            </div>
            <div v-if="!filteredOrders.length" class="mb-list__empty">没有匹配的订单</div>
          </div>
        </div>
      </template>

      <!-- ═══════ 消息 ═══════ -->
      <template v-else-if="activeTab === 'message'">
        <div class="mb-card">
          <div class="mb-filter">
            <eb-segmented
              v-model="messageType"
              block
              :options="[{ label: '全部', value: 'all' }, { label: '审批', value: 'approve' }, { label: '系统', value: 'system' }]"
            />
          </div>
          <div class="mb-list">
            <div
              v-for="msg in filteredMessages"
              :key="msg.id"
              class="mb-msg"
              :class="{ 'is-unread': msg.unread }"
              @click="msg.unread = false"
            >
              <span class="mb-msg__icon" :class="`is-${msg.type}`">
                <eb-icon :name="MESSAGE_TYPE[msg.type].icon" :size="15" />
              </span>
              <div class="mb-msg__main">
                <div class="mb-msg__title">
                  {{ msg.title }}
                  <i v-if="msg.unread" class="mb-msg__dot" />
                </div>
                <div class="mb-msg__desc">{{ msg.desc }}</div>
              </div>
              <span class="mb-msg__time">{{ msg.time }}</span>
            </div>
          </div>
          <div class="mb-list__actions">
            <eb-button size="small" text type="primary" :disabled="!unreadCount" @click="clearUnread">
              全部标为已读
            </eb-button>
          </div>
        </div>
      </template>

      <!-- ═══════ 我的 ═══════ -->
      <template v-else-if="activeTab === 'mine'">
        <div class="mb-card mb-profile">
          <eb-avatar :size="52">林</eb-avatar>
          <div class="mb-profile__meta">
            <div class="mb-profile__name">林晓</div>
            <div class="mb-profile__desc">业务组 · 全栈工程师</div>
          </div>
          <eb-button size="small" text type="primary" @click="EbMessage.info('示例：编辑资料')">编辑</eb-button>
        </div>

        <div class="mb-card">
          <div class="mb-card__title">本月概要</div>
          <div class="mb-mine-usage">
            <span>AI Credits</span>
            <eb-progress :percentage="Math.round((profile.creditsUsed / profile.creditsTotal) * 100)" :stroke-width="8" />
            <span class="mb-mine-usage__num">{{ profile.creditsUsed }} / {{ profile.creditsTotal }}</span>
          </div>
          <div class="mb-mine-usage">
            <span>报销单</span>
            <eb-progress :percentage="100" :stroke-width="8" status="success" />
            <span class="mb-mine-usage__num">{{ profile.expenseCount }} 单</span>
          </div>
        </div>

        <div class="mb-card">
          <div
            v-for="m in mineMenus"
            :key="m.label"
            class="mb-menu-row"
            @click="EbMessage.info(`示例：${m.label}`)"
          >
            <span class="mb-menu-row__left">
              <eb-icon :name="m.icon" :size="16" />
              {{ m.label }}
            </span>
            <eb-icon name="arrow-right" :size="14" />
          </div>
        </div>

        <div class="mb-card">
          <div class="mb-menu-row" @click="EbMessage.info('示例：退出登录（需二次确认）')">
            <span class="mb-menu-row__left is-danger">
              <eb-icon name="signout" :size="16" />
              退出登录
            </span>
          </div>
        </div>

        <div class="mb-version">Evoke Business UI · v0.1.0</div>
      </template>
    </main>

    <!-- 底部标签栏 -->
    <nav class="mb-tabbar">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        class="mb-tab"
        :class="{ 'is-active': activeTab === t.key }"
        @click="switchTab(t.key)"
      >
        <span class="mb-tab__icon-wrap">
          <eb-icon :name="t.icon" :size="19" />
          <i v-if="t.key === 'message' && unreadCount" class="mb-tab__dot">{{ unreadCount }}</i>
        </span>
        <span>{{ t.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'
import {
  stats,
  todos,
  orders,
  ORDER_STATUS,
  usage,
  approvalStages,
  TABS,
  messages,
  MESSAGE_TYPE,
  profile,
} from './mock.js'

/* 简单模式：首页隐藏用量 / 审批 / 登记，仅保留核心数据与待办 */
const simpleMode = ref(false)
const activeTab = ref('home')
const homeTab = ref('todo')

/* ── 页签滚动记忆：新页签滚到顶部，切回访问过的页签恢复原位置 ── */
const shellRef = ref(null)
const scrollMemories = reactive({})

function scrollEl() {
  // 就近找 overflow 滚动容器（文档站为 .example-live__stage），独立运行时回退到窗口
  let el = shellRef.value?.parentElement
  while (el && el !== document.body) {
    const ov = getComputedStyle(el).overflowY
    if (ov === 'auto' || ov === 'scroll') return el
    el = el.parentElement
  }
  return document.scrollingElement || document.documentElement
}

function currentScrollTop() {
  const el = scrollEl()
  return el === document.scrollingElement || el === document.documentElement
    ? window.scrollY
    : el.scrollTop
}

function applyScrollTop(top) {
  const el = scrollEl()
  if (el === document.scrollingElement || el === document.documentElement) {
    window.scrollTo(0, top)
  } else {
    el.scrollTop = top
  }
}

function switchTab(key) {
  if (activeTab.value === key) return
  scrollMemories[activeTab.value] = currentScrollTop()
  activeTab.value = key
  nextTick(() => applyScrollTop(scrollMemories[key] ?? 0))
}

/* ── 首页：快速登记 ── */
const form = reactive({ type: '', date: '' })

/* ── 订单页 ── */
const orderKeyword = ref('')
const orderStatus = ref('all')

const filteredOrders = computed(() =>
  orders.filter((o) => {
    const hitStatus = orderStatus.value === 'all' || o.status === orderStatus.value
    const kw = orderKeyword.value.trim()
    const hitKeyword = !kw || o.id.includes(kw) || o.buyer.includes(kw)
    return hitStatus && hitKeyword
  }),
)

/* ── 消息页 ── */
const messageType = ref('all')
const unreadCount = computed(() => messages.filter((m) => m.unread).length)

const filteredMessages = computed(() =>
  messages.filter((m) => messageType.value === 'all' || m.type === messageType.value),
)

function clearUnread() {
  messages.forEach((m) => (m.unread = false))
  EbMessage.success('已全部标为已读')
}

/* ── 我的 ── */
const mineMenus = [
  { label: '我的报销单', icon: 'file-text' },
  { label: '消息设置', icon: 'notification' },
  { label: '账号与安全', icon: 'safety-certificate-fill' },
]

/* 切回首页时清掉简单模式对其他页签的困惑：简单模式仅作用于首页 */
watch(activeTab, () => {})
</script>

<style scoped>
/* 移动壳：桌面预览时居中为手机列宽，真机 375 全宽 */
.mb-shell {
  display: flex;
  flex-direction: column;
  max-width: 420px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--eb-bg-color-page, #f5f6f8);
}

/* ── 应用栏 ── */
.mb-appbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--eb-bg-color, #fff);
  border-bottom: 1px solid var(--eb-border-color-light, #e5e7eb);
}
.mb-appbar__hello {
  font-size: 16px;
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
}
.mb-appbar__sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--eb-text-color-secondary, #8a9099);
}
.mb-appbar__right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mb-body {
  flex: 1;
  padding: 12px 12px 16px;
}

/* ── 快捷数据 ── */
.mb-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.mb-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 14px;
  background: var(--eb-bg-color, #fff);
  border: 1px solid var(--eb-border-color-light, #e5e7eb);
  border-radius: 10px;
}
.mb-stat__label {
  font-size: 12px;
  color: var(--eb-text-color-secondary, #8a9099);
}
.mb-stat__value {
  font-size: 20px;
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
}
.mb-stat__trend {
  font-size: 12px;
  color: var(--eb-color-success, #22a45d);
}

/* ── 简单模式 ── */
.mb-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--eb-text-color-regular, #4e545c);
  background: var(--eb-bg-color, #fff);
  border: 1px solid var(--eb-border-color-light, #e5e7eb);
  border-radius: 10px;
}

/* ── 卡片 ── */
.mb-card {
  margin-top: 12px;
  padding: 14px;
  background: var(--eb-bg-color, #fff);
  border: 1px solid var(--eb-border-color-light, #e5e7eb);
  border-radius: 10px;
}
.mb-card__title {
  margin-bottom: 12px;
  padding-left: 8px;
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
  border-left: 3px solid var(--eb-color-primary, #175dff);
}
.mb-usage {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── 自适应表单 ── */
.mb-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mb-form__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.mb-form__label {
  font-size: 12px;
  color: var(--eb-text-color-secondary, #8a9099);
}

/* ── 通用行 / 列表 ── */
.mb-filter {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.mb-list {
  margin-top: 12px;
}
.mb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 2px;
}
.mb-row + .mb-row {
  border-top: 1px solid var(--eb-border-color-extra-light, #f0f1f3);
}
.mb-row--col {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}
.mb-row__top,
.mb-row__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mb-row__main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.mb-row__title {
  font-size: 14px;
  color: var(--eb-text-color-primary, #1f2329);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mb-row__sub {
  font-size: 12px;
  color: var(--eb-text-color-secondary, #8a9099);
}
.mb-row__sub.is-urgent {
  color: var(--eb-color-danger, #e34d59);
}
.mb-row__channel {
  font-size: 12px;
  color: var(--eb-text-color-secondary, #8a9099);
}
.mb-row__amount {
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
}
.mb-row__actions {
  display: flex;
  justify-content: flex-end;
}
.mb-list__empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--eb-text-color-secondary, #8a9099);
}
.mb-list__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

/* ── 消息 ── */
.mb-msg {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 4px;
  border-radius: 8px;
  cursor: pointer;
}
.mb-msg + .mb-msg {
  border-top: 1px solid var(--eb-border-color-extra-light, #f0f1f3);
}
.mb-msg__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--eb-color-primary-light-9, rgba(23, 93, 255, 0.08));
  color: var(--eb-color-primary, #175dff);
}
.mb-msg__icon.is-system {
  background: var(--eb-fill-color, #f2f3f5);
  color: var(--eb-text-color-secondary, #8a9099);
}
.mb-msg__main {
  flex: 1;
  min-width: 0;
}
.mb-msg__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--eb-text-color-primary, #1f2329);
}
.mb-msg__dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--eb-color-danger, #e34d59);
}
.mb-msg__desc {
  margin-top: 3px;
  font-size: 12px;
  color: var(--eb-text-color-secondary, #8a9099);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mb-msg__time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--eb-text-color-secondary, #8a9099);
}

/* ── 我的 ── */
.mb-profile {
  display: flex;
  align-items: center;
  gap: 14px;
}
.mb-profile__meta {
  flex: 1;
}
.mb-profile__name {
  font-size: 17px;
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
}
.mb-profile__desc {
  margin-top: 3px;
  font-size: 12px;
  color: var(--eb-text-color-secondary, #8a9099);
}
.mb-mine-usage {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}
.mb-mine-usage > span:first-child {
  flex-shrink: 0;
  width: 76px;
  font-size: 13px;
  color: var(--eb-text-color-regular, #4e545c);
}
.mb-mine-usage .eb-progress,
.mb-mine-usage [class*="progress"] {
  flex: 1;
}
.mb-mine-usage__num {
  flex-shrink: 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--eb-text-color-secondary, #8a9099);
}
.mb-menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 2px;
  font-size: 14px;
  color: var(--eb-text-color-primary, #1f2329);
  cursor: pointer;
}
.mb-menu-row + .mb-menu-row {
  border-top: 1px solid var(--eb-border-color-extra-light, #f0f1f3);
}
.mb-menu-row__left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.mb-menu-row__left.is-danger {
  color: var(--eb-color-danger, #e34d59);
}
.mb-version {
  margin-top: 16px;
  text-align: center;
  font-size: 11px;
  color: var(--eb-text-color-secondary, #8a9099);
}

/* ── 底部标签栏 ── */
.mb-tabbar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  background: var(--eb-bg-color, #fff);
  border-top: 1px solid var(--eb-border-color-light, #e5e7eb);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.mb-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 7px 0 8px;
  font-size: 11px;
  color: var(--eb-text-color-secondary, #8a9099);
  background: transparent;
  border: none;
  cursor: pointer;
}
.mb-tab.is-active {
  color: var(--eb-color-primary, #175dff);
}
.mb-tab__icon-wrap {
  position: relative;
  display: inline-flex;
}
.mb-tab__dot {
  position: absolute;
  top: -3px;
  right: -8px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  font-size: 10px;
  font-style: normal;
  line-height: 14px;
  text-align: center;
  color: #fff;
  background: var(--eb-color-danger, #e34d59);
  border-radius: 999px;
}
</style>
