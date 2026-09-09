/** 报销审批示例 — 模拟数据（reactive 包裹，操作驱动视图联动） */

import { reactive } from 'vue'

export const EXPENSE_STATUS = [
  { value: 'pending', label: '审批中', type: 'warning' },
  { value: 'approved', label: '已通过', type: 'success' },
  { value: 'rejected', label: '已驳回', type: 'danger' },
  { value: 'withdrawn', label: '已撤回', type: 'info' },
]

export const EXPENSE_TYPES = [
  { label: '差旅费', value: 'travel' },
  { label: '交通费', value: 'transport' },
  { label: '餐饮招待', value: 'meal' },
  { label: '办公用品', value: 'office' },
  { label: '培训费', value: 'training' },
]

export const TYPE_LABEL = Object.fromEntries(EXPENSE_TYPES.map((t) => [t.value, t.label]))

/** 审批流节点定义（所有单据共用） */
export const FLOW_NODES = ['提交申请', '部门经理审批', '财务审核', '出纳打款']

export const APPROVE_STATUS = [
  { value: 'done', label: '已通过', type: 'success' },
  { value: 'rejected', label: '已驳回', type: 'danger' },
]

/** 当前登录人视角：我提交的申请 */
let seq = 4

export const myApplications = reactive([
  {
    id: 1,
    no: 'BX-202609-0004',
    type: 'travel',
    amount: 3860,
    applicant: '林晓',
    dept: '业务组',
    submittedAt: '2026-09-04 10:21',
    status: 'pending',
    currentStep: 2, // 已过部门经理，财务审核中
    remark: '广州客户现场支持差旅（3 天）',
    items: [
      { type: 'travel', amount: 2400, note: '高铁往返 × 2 人' },
      { type: 'transport', amount: 360, note: '市内打车' },
      { type: 'meal', amount: 1100, note: '客户招待餐' },
    ],
    flow: [
      { operator: '林晓', action: '提交了报销申请', at: '2026-09-04 10:21' },
      { operator: '沈从文', action: '部门经理审批通过', at: '2026-09-04 16:40', detail: '客户现场支持属实，同意' },
    ],
  },
  {
    id: 2,
    no: 'BX-202609-0003',
    type: 'office',
    amount: 742.5,
    applicant: '林晓',
    dept: '业务组',
    submittedAt: '2026-09-02 15:03',
    status: 'approved',
    currentStep: 4,
    remark: '工位显示器与键鼠采购',
    items: [{ type: 'office', amount: 742.5, note: '27 寸显示器 × 2' }],
    flow: [
      { operator: '林晓', action: '提交了报销申请', at: '2026-09-02 15:03' },
      { operator: '沈从文', action: '部门经理审批通过', at: '2026-09-02 18:10' },
      { operator: '钱多多', action: '财务审核通过', at: '2026-09-03 09:32', detail: '发票已核验' },
      { operator: '周予安', action: '打款完成', at: '2026-09-03 15:00', detail: '已转账至工资卡' },
    ],
  },
  {
    id: 3,
    no: 'BX-202609-0002',
    type: 'training',
    amount: 2980,
    applicant: '林晓',
    dept: '业务组',
    submittedAt: '2026-08-28 11:47',
    status: 'rejected',
    currentStep: 2,
    remark: '前端性能优化线上课程',
    items: [{ type: 'training', amount: 2980, note: '年度课程会员' }],
    flow: [
      { operator: '林晓', action: '提交了报销申请', at: '2026-08-28 11:47' },
      {
        operator: '沈从文',
        action: '部门经理驳回了申请',
        at: '2026-08-29 10:05',
        detail: '课程类支出需走年度培训预算，请先在培训计划内报备',
        diff: [{ field: '审批结果', before: '审批中', after: '已驳回' }],
      },
    ],
  },
])

/** 审批中心：待我（部门经理）处理的单据 */
export const approveQueue = reactive([
  {
    id: 101,
    no: 'BX-202609-0007',
    type: 'travel',
    amount: 5240,
    applicant: '宋佳',
    dept: '移动组',
    submittedAt: '2026-09-05 14:22',
    remark: '深圳渠道商洽谈差旅（2 人 2 天）',
    items: [
      { type: 'travel', amount: 3600, note: '机票 + 酒店' },
      { type: 'meal', amount: 1240, note: '商务宴请' },
      { type: 'transport', amount: 400, note: '机场接送' },
    ],
    flow: [{ operator: '宋佳', action: '提交了报销申请', at: '2026-09-05 14:22' }],
  },
  {
    id: 102,
    no: 'BX-202609-0006',
    type: 'office',
    amount: 1280,
    applicant: '周予安',
    dept: '移动组',
    submittedAt: '2026-09-05 09:40',
    remark: '测试机配件与转接线材',
    items: [{ type: 'office', amount: 1280, note: '测试机支架 / 线材 / 转接头' }],
    flow: [{ operator: '周予安', action: '提交了报销申请', at: '2026-09-05 09:40' }],
  },
  {
    id: 103,
    no: 'BX-202609-0005',
    type: 'meal',
    amount: 968,
    applicant: '钱多多',
    dept: '数据组',
    submittedAt: '2026-09-04 17:55',
    remark: '数据治理专项阶段汇报工作餐',
    items: [{ type: 'meal', amount: 968, note: '项目组加班餐 12 人' }],
    flow: [{ operator: '钱多多', action: '提交了报销申请', at: '2026-09-04 17:55' }],
  },
])

/** 新建单据工厂 */
export function createApplication({ type, items, remark, applicant, dept }) {
  const amount = items.reduce((acc, it) => acc + it.amount, 0)
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const at = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  const app = {
    id: Date.now(),
    no: `BX-202609-000${++seq}`,
    type,
    amount,
    applicant,
    dept,
    submittedAt: at,
    status: 'pending',
    currentStep: 1,
    remark,
    items,
    flow: [{ operator: applicant, action: '提交了报销申请', at }],
  }
  return app
}
