/** 移动工作台示例 — 模拟数据（reactive 包裹） */

import { reactive } from 'vue'

export const stats = reactive([
  { label: '今日 GMV（元）', value: '128.7万', trend: '+12.6%' },
  { label: '新订单', value: '128', trend: '+8.2%' },
  { label: '待办事项', value: '6', trend: '2 个紧急' },
  { label: '未读消息', value: '5', trend: '' },
])

export const todos = reactive([
  { id: 1, title: '审批：张三的差旅报销单', time: '10:24 前处理', urgent: true },
  { id: 2, title: '跟进：CRM 商机「华东连锁」', time: '今天 18:00', urgent: false },
  { id: 3, title: '确认：9 月迭代提测清单', time: '明天 10:00', urgent: false },
])

export const orders = reactive([
  { id: 'SO-00874', buyer: '顾清一', channel: '小程序商城', amount: 2198, status: 'paid', progress: 60 },
  { id: 'SO-00873', buyer: '周予安', channel: '抖音直播间', amount: 359, status: 'unpaid', progress: 0 },
  { id: 'SO-00872', buyer: '林一诺', channel: 'App', amount: 5699, status: 'shipped', progress: 100 },
  { id: 'SO-00871', buyer: '陈默', channel: '天猫旗舰店', amount: 1299, status: 'paid', progress: 80 },
  { id: 'SO-00870', buyer: '赵星野', channel: '小程序商城', amount: 89, status: 'unpaid', progress: 0 },
  { id: 'SO-00869', buyer: '沈之南', channel: 'App', amount: 899, status: 'shipped', progress: 90 },
  { id: 'SO-00868', buyer: '韩梅梅', channel: '抖音直播间', amount: 2680, status: 'completed', progress: 100 },
  { id: 'SO-00867', buyer: '李长歌', channel: '小程序商城', amount: 1580, status: 'paid', progress: 45 },
])

export const ORDER_STATUS = [
  { value: 'unpaid', label: '待付款', type: 'warning' },
  { value: 'paid', label: '已支付', type: 'primary' },
  { value: 'shipped', label: '已发货', type: 'info' },
  { value: 'completed', label: '已完成', type: 'success' },
]

export const usage = reactive([
  { label: 'AI Credits', used: 756, total: 1000, refreshDate: '2026-10-01', refreshLabel: '套餐内 AI Credits' },
  { label: '存储空间（GB）', used: 46, total: 200, refreshDate: '', refreshLabel: '存储容量（GB）' },
])

export const approvalStages = reactive([
  { name: '提交', date: '09-05', status: 'completed' },
  { name: '经理审批', date: '09-06', status: 'active' },
  { name: '财务打款', status: 'pending' },
])

export const TABS = [
  { key: 'home', label: '首页', icon: 'home' },
  { key: 'orders', label: '订单', icon: 'bill' },
  { key: 'message', label: '消息', icon: 'message' },
  { key: 'mine', label: '我的', icon: 'user' },
]

/** 消息中心 */
export const messages = reactive([
  { id: 1, type: 'approve', title: '报销单待你审批', desc: '宋佳提交了深圳渠道商差旅报销 ¥5,240', time: '10 分钟前', unread: true },
  { id: 2, type: 'approve', title: '你的报销单已通过财务审核', desc: 'BX-202609-0004 进入出纳打款环节', time: '2 小时前', unread: true },
  { id: 3, type: 'system', title: '仓配系统升级通知', desc: '9.6 凌晨 02:00-04:00 升级，期间暂停发货', time: '昨天 16:20', unread: true },
  { id: 4, type: 'system', title: '新版《商家结算规则》发布', desc: '10 月 1 日生效，请及时查阅', time: '09-04', unread: false },
  { id: 5, type: 'approve', title: '你的报销单已通过', desc: 'BX-202609-0003 打款完成', time: '09-03', unread: false },
])

export const MESSAGE_TYPE = {
  approve: { label: '审批', icon: 'audit' },
  system: { label: '系统', icon: 'notification' },
}

/** 我的 */
export const profile = reactive({
  name: '林晓',
  dept: '业务组',
  role: '全栈工程师',
  creditsUsed: 756,
  creditsTotal: 1000,
  expenseCount: 3,
})
