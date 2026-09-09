/** 运营工作台示例 — 模拟数据（reactive 包裹，页面内操作可驱动视图联动） */

import { reactive } from 'vue'

/* ---------------- 工作台 ---------------- */

export const kpis = [
  { label: '今日 GMV（元）', value: 1286934, unit: '', trend: 12.6, icon: 'income', type: 'primary' },
  { label: '有效订单', value: 3245, unit: '单', trend: 8.2, icon: 'orderedlist', type: 'success' },
  { label: '支付转化率', value: 4.7, unit: '%', trend: -0.4, icon: 'percentage', type: 'warning' },
  { label: '活跃会员', value: 28617, unit: '人', trend: 3.1, icon: 'customer', type: 'info' },
]

export const gmvTrend = {
  labels: ['08-31', '09-01', '09-02', '09-03', '09-04', '09-05', '09-06'],
  series: [
    { name: 'GMV（万元）', data: [86.2, 92.5, 88.1, 105.4, 118.9, 109.3, 128.7] },
    { name: '退款额（万元）', data: [4.1, 5.3, 3.9, 6.8, 7.2, 5.1, 4.4] },
  ],
}

export const channelShare = {
  pieData: [
    { name: '小程序商城', value: 52 },
    { name: 'App', value: 23 },
    { name: '天猫旗舰店', value: 15 },
    { name: '抖音直播间', value: 10 },
  ],
}

export const recentOrders = [
  { orderNo: 'SO-2026-0906-00874', buyer: '顾清一', channel: '小程序商城', amount: 2198, status: 'paid' },
  { orderNo: 'SO-2026-0906-00873', buyer: '周予安', channel: '抖音直播间', amount: 359, status: 'unpaid' },
  { orderNo: 'SO-2026-0906-00872', buyer: '林一诺', channel: 'App', amount: 5699, status: 'shipped' },
  { orderNo: 'SO-2026-0906-00871', buyer: '陈默', channel: '天猫旗舰店', amount: 1299, status: 'completed' },
  { orderNo: 'SO-2026-0906-00870', buyer: '赵星野', channel: '小程序商城', amount: 89, status: 'cancelled' },
]

export const ORDER_STATUS = [
  { value: 'unpaid', label: '待付款', type: 'warning' },
  { value: 'paid', label: '已支付', type: 'primary' },
  { value: 'shipped', label: '已发货', type: 'info' },
  { value: 'completed', label: '已完成', type: 'success' },
  { value: 'cancelled', label: '已取消', type: 'danger' },
]

export const todos = [
  { id: 1, title: '12 笔待审核退货单', tag: '售后', urgent: true },
  { id: 2, title: '「国庆大促」活动页待提审', tag: '运营', urgent: true },
  { id: 3, title: '3 款商品库存低于安全线', tag: '库存', urgent: false },
  { id: 4, title: '9 月会员日方案待评审', tag: '运营', urgent: false },
]

export const notices = [
  { id: 1, title: '9.6 凌晨 02:00-04:00 仓配系统升级', time: '昨天 16:20' },
  { id: 2, title: '新版《商家结算规则》10 月 1 日生效', time: '09-04' },
  { id: 3, title: '抖音渠道 API 接入文档已更新至 v3', time: '09-02' },
]

/* ---------------- 订单管理模块 ---------------- */

export const CHANNELS = ['小程序商城', 'App', '天猫旗舰店', '抖音直播间']

const BUYERS = ['顾清一', '周予安', '林一诺', '陈默', '赵星野', '沈之南', '韩梅梅', '李长歌']
const STATUSES = ['unpaid', 'paid', 'paid', 'shipped', 'shipped', 'completed', 'completed', 'cancelled']

function pad(n) {
  return String(n).padStart(2, '0')
}

/** 生成 32 条订单（模块级内存库，支持取消操作） */
export const orders = reactive(
  Array.from({ length: 32 }, (_, i) => {
    const d = new Date(Date.now() - i * 3600 * 1000 * 7)
    const t = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(9 + (i % 12))}:${pad((i * 17) % 60)}`
    return {
      id: i + 1,
      orderNo: `SO-2026-0906-00${pad(87 - i)}`,
      buyer: BUYERS[i % BUYERS.length],
      channel: CHANNELS[i % CHANNELS.length],
      amount: Math.round(((i * 977) % 80000) / 10) * 10 + 99,
      status: STATUSES[i % STATUSES.length],
      createdAt: t,
    }
  }),
)

/* ---------------- 商品列表模块 ---------------- */

// categoryId 指向分类树的叶子节点，分类管理页按子树聚合商品
export const goods = reactive([
  { id: 'G-101', name: '云感羽绒被 · 白 200×230cm', spec: '抗菌 95 白鹅绒', categoryId: 21, category: '羽绒被', price: 1299, stock: 46, listed: true },
  { id: 'G-102', name: '抗菌记忆枕（对装）', spec: '慢回弹 / 可水洗', categoryId: 31, category: '记忆枕', price: 549, stock: 8, listed: true },
  { id: 'G-103', name: '天丝四件套 · 雾灰蓝', spec: '60 支兰精天丝', categoryId: 11, category: '四件套', price: 899, stock: 120, listed: true },
  { id: 'G-104', name: '儿童乳胶枕', spec: '泰国进口乳胶 93%', categoryId: 32, category: '乳胶枕', price: 329, stock: 5, listed: false },
  { id: 'G-105', name: '蚕丝夏被 · 月白', spec: '柞蚕丝填充 2 斤', categoryId: 22, category: '蚕丝被', price: 1099, stock: 64, listed: true },
  { id: 'G-106', name: '软管支撑床垫 · 1.8m', spec: '独立袋装弹簧', categoryId: 4, category: '床垫专区', price: 3699, stock: 12, listed: true },
  { id: 'G-107', name: '大豆纤维被 · 冬暖款', spec: '大豆蛋白纤维填充', categoryId: 23, category: '纤维被', price: 459, stock: 88, listed: true },
  { id: 'G-108', name: '决明子保健枕', spec: '天然决明子填充', categoryId: 31, category: '记忆枕', price: 199, stock: 3, listed: false },
  { id: 'G-109', name: '法兰绒多件套 · 暖棕', spec: '四件套 / 起绒工艺', categoryId: 12, category: '多件套', price: 699, stock: 41, listed: true },
  { id: 'G-110', name: '云感乳胶薄垫 · 1.5m', spec: '乳胶含量 90%', categoryId: 4, category: '床垫专区', price: 2199, stock: 26, listed: true },
  { id: 'G-111', name: '抗菌防螨四件套 · 云白', spec: 'A 类母婴级面料', categoryId: 11, category: '四件套', price: 999, stock: 67, listed: true },
])

export const GOODS_CATEGORY = ['床品套件', '枕头专区', '被芯专场', '床垫专区']

/* ---------------- 分类管理模块（树形） ---------------- */

export const categories = reactive([
  {
    id: 1,
    name: '床品套件',
    goodsCount: 128,
    sort: 1,
    status: 'enabled',
    children: [
      { id: 11, name: '四件套', goodsCount: 86, sort: 1, status: 'enabled' },
      { id: 12, name: '多件套', goodsCount: 42, sort: 2, status: 'enabled' },
    ],
  },
  {
    id: 2,
    name: '被芯专场',
    goodsCount: 96,
    sort: 2,
    status: 'enabled',
    children: [
      { id: 21, name: '羽绒被', goodsCount: 31, sort: 1, status: 'enabled' },
      { id: 22, name: '蚕丝被', goodsCount: 28, sort: 2, status: 'enabled' },
      { id: 23, name: '纤维被', goodsCount: 37, sort: 3, status: 'disabled' },
    ],
  },
  {
    id: 3,
    name: '枕头专区',
    goodsCount: 54,
    sort: 3,
    status: 'enabled',
    children: [
      { id: 31, name: '记忆枕', goodsCount: 22, sort: 1, status: 'enabled' },
      { id: 32, name: '乳胶枕', goodsCount: 32, sort: 2, status: 'enabled' },
    ],
  },
  { id: 4, name: '床垫专区', goodsCount: 18, sort: 4, status: 'disabled' },
])

export const CATEGORY_STATUS = [
  { value: 'enabled', label: '已启用', type: 'success' },
  { value: 'disabled', label: '已停用', type: 'info' },
]

/* ---------------- 营销中心模块 ---------------- */

export const campaigns = reactive([
  { id: 1, name: '9 月会员日 · 满减狂欢', type: 'full', start: '2026-09-09', end: '2026-09-11', progress: 62, status: 'running' },
  { id: 2, name: '国庆预售定金膨胀', type: 'presale', start: '2026-09-20', end: '2026-09-30', progress: 0, status: 'pending' },
  { id: 3, name: '超级秒杀 · 每晚 8 点', type: 'seckill', start: '2026-09-01', end: '2026-09-30', progress: 84, status: 'running' },
  { id: 4, name: ' Pillow 夏日清仓 5 折', type: 'discount', start: '2026-08-15', end: '2026-08-31', progress: 100, status: 'ended' },
])

export const CAMPAIGN_TYPE = { full: '满减', discount: '折扣', seckill: '秒杀', presale: '预售' }
export const CAMPAIGN_STATUS = [
  { value: 'pending', label: '未开始', type: 'info' },
  { value: 'running', label: '进行中', type: 'success' },
  { value: 'ended', label: '已结束', type: 'danger' },
]
