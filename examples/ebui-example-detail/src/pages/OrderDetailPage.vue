<template>
  <div class="od-page">
    <!-- 页头：返回 + 状态 + 操作区 -->
    <ev-page-header title="订单详情" :subtitle="order.orderNo">
      <template #actions>
        <ev-status-tag :value="order.status" :statuses="ORDER_STATUS" size="default" />
        <ev-button size="small" @click="EvMessage.info('示例：返回订单列表')">
          <ev-icon name="back" :size="14" />
          返回列表
        </ev-button>
        <ev-button size="small" @click="openRemark">
          <ev-icon name="edit" :size="14" />
          修改备注
        </ev-button>
        <ev-button size="small" @click="urgeShip">提醒发货</ev-button>
        <ev-popconfirm
          title="取消后订单将终止流转，确认取消该订单？"
          icon-type="danger"
          @confirm="cancelOrder"
        >
          <ev-button size="small" type="danger" plain :disabled="!canCancel">取消订单</ev-button>
        </ev-popconfirm>
      </template>
    </ev-page-header>

    <!-- 订单进度 -->
    <ev-section-card class="od-block">
      <ev-steps :active="progressActive" align-center finish-status="success">
        <ev-step title="提交订单" :description="order.createdAt" :status="order.status === 'cancelled' ? 'error' : undefined" />
        <ev-step title="付款成功" :description="order.paidAt" />
        <ev-step title="商品出库" description="仓配拣货中" />
        <ev-step title="完成" description="确认收货后结算" />
      </ev-steps>
    </ev-section-card>

    <ev-row :gutter="16">
      <!-- 主信息区 -->
      <ev-col :xs="24" :lg="17">
        <ev-section-card title="基础信息" class="od-block">
          <ev-detail-descriptions :column="3" border :data="order" :items="baseItems">
            <template #status="{ value }">
              <ev-status-tag :value="value" :statuses="ORDER_STATUS" />
            </template>
            <template #payStatus="{ value }">
              <ev-status-tag :value="value" :statuses="PAY_STATUS" />
            </template>
          </ev-detail-descriptions>
        </ev-section-card>

        <ev-section-card title="商品与履约" :padding="false" class="od-block">
          <ev-tabs v-model="activeTab" class="od-tabs">
            <ev-tab-pane label="商品明细" name="goods">
              <ev-data-table
                :columns="goodsColumns"
                :data="goods"
                :show-pagination="false"
                :show-total="false"
              >
                <template #name="{ row }">
                  <ev-cell-stack :main="row.name" :sub="row.spec" />
                </template>
              </ev-data-table>
              <div class="od-goods-summary">
                商品金额 ¥{{ order.goodsAmount.toLocaleString() }}
                + 运费 ¥{{ order.freight }}
                {{ order.discount }} 优惠
                =
                <span class="od-goods-summary__pay">实付 ¥{{ order.payAmount.toLocaleString() }}</span>
              </div>
            </ev-tab-pane>

            <ev-tab-pane label="发货记录" name="shipments">
              <ev-data-table
                :columns="shipColumns"
                :data="shipments"
                :show-pagination="false"
                :show-total="false"
              >
                <template #trackingNo="{ row }">
                  <ev-link type="primary">{{ row.trackingNo }}</ev-link>
                </template>
                <template #status="{ row }">
                  <ev-tag type="info" effect="plain">{{ row.status }}</ev-tag>
                </template>
              </ev-data-table>
              <div v-if="!shipments.length" class="od-empty">
                <ev-empty description="暂无发货记录" />
              </div>
            </ev-tab-pane>

            <ev-tab-pane label="审计日志" name="audit" lazy>
              <div class="od-audit">
                <ev-audit-timeline :items="auditLogs" />
              </div>
            </ev-tab-pane>
          </ev-tabs>
        </ev-section-card>
      </ev-col>

      <!-- 侧栏 -->
      <ev-col :xs="24" :lg="7">
        <ev-section-card title="买家信息" class="od-block">
          <div class="od-buyer">
            <ev-avatar :size="40">{{ order.buyer.nickname.slice(0, 1) }}</ev-avatar>
            <div class="od-buyer__meta">
              <div class="od-buyer__name">{{ order.buyer.nickname }}</div>
              <div class="od-buyer__phone">{{ order.buyer.phone }}</div>
            </div>
          </div>
          <ev-detail-descriptions class="od-buyer__extra" :column="1" :border="false" :data="order" :items="buyerItems" />
          <ev-link type="primary">查看会员档案</ev-link>
        </ev-section-card>

        <ev-section-card title="收货信息" class="od-block">
          <ev-detail-descriptions :column="1" :border="false" :data="order.receiver" :items="receiverItems" />
        </ev-section-card>

        <ev-section-card title="结算摘要" class="od-block">
          <div class="od-summary-row">
            <span>商品金额</span><span>¥{{ order.goodsAmount.toLocaleString() }}</span>
          </div>
          <div class="od-summary-row">
            <span>运费</span><span>{{ order.freight ? `¥${order.freight}` : '免运费' }}</span>
          </div>
          <div class="od-summary-row">
            <span>优惠</span><span class="od-summary-row__discount">{{ order.discount }}</span>
          </div>
          <ev-divider />
          <div class="od-summary-row od-summary-row--pay">
            <span>实付金额</span><span>¥{{ order.payAmount.toLocaleString() }}</span>
          </div>
          <div class="od-summary-row od-summary-row__hint">
            <span>支付方式</span><span>{{ order.payMethod }}</span>
          </div>
        </ev-section-card>
      </ev-col>
    </ev-row>

    <!-- 修改备注弹窗 -->
    <ev-dialog v-model="remarkVisible" title="修改订单备注" width="480px">
      <ev-form :model="remarkForm" label-width="72px">
        <ev-form-item label="备注">
          <ev-textarea v-model="remarkForm.remark" :rows="4" maxlength="200" show-word-limit placeholder="备注对买家不可见，仅内部协作使用" />
        </ev-form-item>
      </ev-form>
      <template #footer>
        <ev-button @click="remarkVisible = false">取消</ev-button>
        <ev-button type="primary" @click="saveRemark">保存</ev-button>
      </template>
    </ev-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'
import { order, goods, shipments, auditLogs, ORDER_STATUS, PAY_STATUS } from './mock.js'

/* ---------------- 页头操作 ---------------- */
const canCancel = computed(() => ['unpaid', 'processing'].includes(order.status))

function urgeShip() {
  EvMessage.success('已向仓配系统发送催发通知')
}

function cancelOrder() {
  order.status = 'cancelled'
  order.payStatus = 'refunding'
  addAudit('运营小助', '取消了订单', '买家申请取消，原路退款')
  EvMessage.warning('订单已取消，退款将原路退回')
}

/* ---------------- 进度条 ---------------- */
const PROGRESS = { unpaid: 0, processing: 1, shipped: 2, completed: 3 }
const progressActive = computed(() => PROGRESS[order.status] ?? 1)

/* ---------------- 基础信息 / 侧栏配置 ---------------- */
const activeTab = ref('goods')

const baseItems = [
  { prop: 'orderNo', label: '订单号', span: 2 },
  { prop: 'status', label: '订单状态', slot: 'status' },
  { prop: 'payStatus', label: '支付状态', slot: 'payStatus' },
  { prop: 'channel', label: '下单渠道' },
  { prop: 'invoice', label: '发票', span: 3 },
  { prop: 'remark', label: '买家备注', span: 3 },
]

const buyerItems = [
  { prop: 'buyer.nickname', label: '昵称' },
  { prop: 'buyer.phone', label: '手机号' },
  { prop: 'buyer.id', label: '会员 ID' },
  { prop: 'createdAt', label: '下单时间' },
]

const receiverItems = [
  { prop: 'name', label: '收件人' },
  { prop: 'phone', label: '联系电话' },
  { prop: 'region', label: '所在地区' },
  { prop: 'address', label: '详细地址' },
]

/* ---------------- 商品明细 / 发货记录 ---------------- */
const goodsColumns = [
  { prop: 'name', label: '商品', slot: 'name', width: 220 },
  { prop: 'price', label: '单价', align: 'right', width: 90 },
  { prop: 'count', label: '数量', align: 'right', width: 70 },
  { prop: 'subtotal', label: '小计', align: 'right', width: 100 },
]

const shipColumns = [
  { prop: 'batch', label: '包裹', width: 80 },
  { prop: 'company', label: '承运商', width: 100 },
  { prop: 'trackingNo', label: '运单号', slot: 'trackingNo', width: 165 },
  { prop: 'count', label: '件数', align: 'right', width: 64 },
  { prop: 'status', label: '状态', slot: 'status', width: 88 },
  { prop: 'planAt', label: '预计出库', width: 130 },
]

/* ---------------- 修改备注 ---------------- */
const remarkVisible = ref(false)
const remarkForm = reactive({ remark: '' })

function openRemark() {
  remarkForm.remark = order.remark
  remarkVisible.value = true
}

function saveRemark() {
  if (!remarkForm.remark.trim()) {
    EvMessage.warning('备注内容不能为空')
    return
  }
  const before = order.remark || '（空）'
  order.remark = remarkForm.remark.trim()
  addAudit('运营小助', '修改了订单备注', '内部协作备注', [{ field: '备注', before, after: order.remark }])
  remarkVisible.value = false
  EvMessage.success('备注已更新')
}

/* ---------------- 审计日志（稳定 id，保证展开态不错位） ---------------- */
let auditSeq = auditLogs.length

function addAudit(operator, action, detail, diff) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  auditLogs.unshift({
    id: `log-${++auditSeq}`,
    operator,
    action,
    detail,
    diff,
    createdAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
  })
}
</script>

<style scoped>
.od-page {
  padding: 16px;
}
.od-block {
  margin-top: 16px;
}
.od-page > .od-section-card:first-child {
  margin-top: 12px;
}
.od-tabs {
  padding: 0 16px;
}
.od-goods-summary {
  padding: 12px 16px;
  text-align: right;
  color: var(--ev-text-color-secondary, #8a9099);
}
.od-goods-summary__pay {
  margin-left: 4px;
  font-size: 16px;
  font-weight: var(--ev-font-weight-semibold, 600);
  color: var(--ev-color-danger, #e34d59);
}
.od-empty {
  padding: 8px 0 16px;
}
.od-audit {
  padding: 16px 4px;
}
.od-buyer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.od-buyer__name {
  font-weight: var(--ev-font-weight-semibold, 600);
  color: var(--ev-text-color-primary, #1f2329);
}
.od-buyer__phone {
  font-size: var(--ev-font-size-sm, 12px);
  color: var(--ev-text-color-secondary, #8a9099);
}
.od-buyer__extra {
  margin-bottom: 8px;
}
.od-summary-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  color: var(--ev-text-color-regular, #4e545c);
}
.od-summary-row__discount {
  color: var(--ev-color-success, #00b578);
}
.od-summary-row--pay {
  font-size: 16px;
  font-weight: var(--ev-font-weight-semibold, 600);
}
.od-summary-row--pay span:last-child {
  color: var(--ev-color-danger, #e34d59);
}
.od-summary-row__hint {
  margin-top: 4px;
  font-size: var(--ev-font-size-sm, 12px);
  color: var(--ev-text-color-secondary, #8a9099);
}
</style>
