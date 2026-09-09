/** 订单详情页示例 — 模拟数据 */

import { reactive } from 'vue'

export const ORDER_STATUS = [
  { value: 'unpaid', label: '待付款', type: 'warning' },
  { value: 'processing', label: '待发货', type: 'primary' },
  { value: 'shipped', label: '已发货', type: 'info' },
  { value: 'completed', label: '已完成', type: 'success' },
  { value: 'cancelled', label: '已取消', type: 'danger' },
]

export const PAY_STATUS = [
  { value: 'paid', label: '已支付', type: 'success' },
  { value: 'unpaid', label: '未支付', type: 'warning' },
  { value: 'refunding', label: '退款中', type: 'danger' },
]

// reactive 包裹：页面内改状态（改备注 / 取消订单 / 追加审计）才能驱动视图联动更新
export const order = reactive({
  orderNo: 'SO-2026-0906-00871',
  status: 'processing',
  payStatus: 'paid',
  channel: '微信小程序',
  buyer: { nickname: '顾清一', phone: '138****6621', id: 'U-20391' },
  receiver: { name: '顾清一', phone: '13800006621', region: '上海市 上海市 长宁区', address: '愚园路 1280 号 12 楓 301 室' },
  payMethod: '微信支付',
  paidAt: '2026-09-05 21:34:12',
  createdAt: '2026-09-05 21:32:47',
  remark: '工作日白天配送，请勿放驿站。',
  invoice: '电子普通发票（个人）',
  goodsAmount: 2398,
  freight: 0,
  discount: -200,
  payAmount: 2198,
})

export const goods = [
  { id: 'G-101', name: '云感羽绒被 · 白 200×230cm', spec: '抗菌 95 白鹅绒', price: 1299, count: 1, subtotal: 1299 },
  { id: 'G-102', name: '抗菌记忆枕（对装）', spec: '慢回弹 / 可水洗', price: 549.5, count: 2, subtotal: 1099 },
]

export const auditLogs = reactive([
  {
    id: 'log-3',
    operator: '系统',
    action: '订单进入待发货队列',
    createdAt: '2026-09-05 21:35:02',
    detail: '支付回调校验通过，自动流转到仓配系统',
  },
  {
    id: 'log-2',
    operator: '钱多多',
    action: '修改了订单金额',
    createdAt: '2026-09-05 21:34:40',
    detail: '大促满减生效',
    diff: [
      { field: '优惠金额', before: 0, after: -200 },
      { field: '实付金额', before: 2398, after: 2198 },
    ],
  },
  {
    id: 'log-1',
    operator: '顾清一',
    action: '创建了订单',
    createdAt: '2026-09-05 21:32:47',
    detail: '来源：微信小程序「云眠家居旗舰店」',
  },
])

export const shipments = [
  { id: 'S-1', batch: '第一包', company: '顺丰速运', trackingNo: 'SF1390008123456', status: '拣货中', count: 2, planAt: '2026-09-06 18:00 前' },
]
