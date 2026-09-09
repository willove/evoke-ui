/** 项目协作示例 — 模拟数据（reactive 包裹，页面内操作可驱动视图联动） */

import { reactive } from 'vue'

export const PROJECT_STATUS = [
  { value: 'active', label: '进行中', type: 'primary' },
  { value: 'paused', label: '已暂停', type: 'info' },
  { value: 'done', label: '已交付', type: 'success' },
]

export const TASK_STATUS = [
  { value: 'done', label: '已完成', type: 'success' },
  { value: 'doing', label: '进行中', type: 'primary' },
  { value: 'blocked', label: '已阻塞', type: 'danger' },
  { value: 'todo', label: '未开始', type: 'info' },
]

/** 项目及其阶段计划 / 任务分解 */
export const projects = reactive([
  {
    id: 1,
    name: 'CRM 客户管理平台',
    code: 'CRM-2026',
    owner: '沈从文',
    deadline: '2026-10-30',
    progress: 68,
    status: 'active',
    stages: [
      { name: '需求冻结', date: '09-02', status: 'completed' },
      { name: '概要设计', date: '09-10', status: 'completed' },
      { name: '迭代开发', date: '10-15', status: 'active' },
      { name: '集成测试', date: '10-24', status: 'pending' },
      { name: '上线交付', date: '10-30', status: 'pending' },
    ],
    tasks: [
      { id: 101, name: '客户 360 视图', owner: '林晓', start: '09-11', end: '09-28', progress: 100, status: 'done' },
      { id: 102, name: '商机看板', owner: '高翔', start: '09-20', end: '10-12', progress: 62, status: 'doing' },
      { id: 103, name: '工单流转引擎', owner: '宋佳', start: '09-25', end: '10-18', progress: 35, status: 'doing' },
      { id: 104, name: '开放 API 网关', owner: '林晓', start: '10-08', end: '10-20', progress: 0, status: 'blocked' },
    ],
  },
  {
    id: 2,
    name: '数据中台治理专项',
    code: 'DATA-118',
    owner: '高翔',
    deadline: '2026-11-20',
    progress: 41,
    status: 'active',
    stages: [
      { name: '资产盘点', date: '09-15', status: 'completed' },
      { name: '标准制定', date: '10-08', status: 'active' },
      { name: '质量稽核', date: '11-05', status: 'pending' },
      { name: '治理验收', date: '11-20', status: 'pending' },
    ],
    tasks: [
      { id: 201, name: '元数据采集接入', owner: '钱多多', start: '09-16', end: '10-06', progress: 88, status: 'doing' },
      { id: 202, name: '数据标准手册 V1', owner: '高翔', start: '09-28', end: '10-10', progress: 45, status: 'doing' },
      { id: 203, name: '质量规则引擎', owner: '沈从文', start: '10-12', end: '11-02', progress: 0, status: 'todo' },
    ],
  },
  {
    id: 3,
    name: '移动端 App 3.0 重构',
    code: 'APP-300',
    owner: '宋佳',
    deadline: '2026-12-15',
    progress: 12,
    status: 'active',
    stages: [
      { name: '技术选型', date: '09-30', status: 'completed' },
      { name: '框架搭建', date: '10-20', status: 'active' },
      { name: '功能迁移', date: '11-30', status: 'pending' },
      { name: '性能专项', date: '12-08', status: 'pending' },
      { name: '应用市场提审', date: '12-15', status: 'pending' },
    ],
    tasks: [
      { id: 301, name: '组件库 3.0 适配', owner: '周予安', start: '10-01', end: '10-18', progress: 30, status: 'doing' },
      { id: 302, name: '离线包方案 PoC', owner: '宋佳', start: '10-09', end: '10-22', progress: 10, status: 'doing' },
    ],
  },
  {
    id: 4,
    name: '官网视觉升级',
    code: 'WEB-077',
    owner: '林晓',
    deadline: '2026-08-31',
    progress: 100,
    status: 'done',
    stages: [
      { name: '视觉提案', date: '07-20', status: 'completed' },
      { name: '页面重构', date: '08-18', status: 'completed' },
      { name: '上线', date: '08-31', status: 'completed' },
    ],
    tasks: [
      { id: 401, name: '首页改版', owner: '林晓', start: '07-21', end: '08-10', progress: 100, status: 'done' },
      { id: 402, name: '品牌墙更新', owner: '周予安', start: '08-01', end: '08-20', progress: 100, status: 'done' },
    ],
  },
])

/** 团队资源配额（CreditsProgress 数据源） */
export const quotas = reactive([
  { id: 'q-ai', name: 'AI Credits', icon: 'ai', used: 7560, total: 10000, refreshDate: '2026-10-01', refreshLabel: 'AI Credits 额度' },
  { id: 'q-storage', name: '文档存储', icon: 'cloud', used: 212, total: 500, refreshDate: '2026-10-01', refreshLabel: '存储容量（GB）' },
  { id: 'q-api', name: 'API 调用', icon: 'api', used: 184200, total: 200000, refreshDate: '2026-10-01', refreshLabel: '本月 API 调用' },
  { id: 'q-ci', name: '构建时长（分钟）', icon: 'clock', used: 940, total: 1200, refreshDate: '2026-10-01', refreshLabel: '本月 CI 构建时长' },
])

/** 成员用量明细 */
export const memberUsage = reactive([
  { id: 1, name: '沈从文', dept: '平台组', role: '后端', credits: 2130, creditsTotal: 2500, seat: 'active' },
  { id: 2, name: '林晓', dept: '业务组', role: '全栈', credits: 1980, creditsTotal: 2500, seat: 'active' },
  { id: 3, name: '高翔', dept: '数据组', role: '架构师', credits: 1640, creditsTotal: 2500, seat: 'active' },
  { id: 4, name: '宋佳', dept: '移动组', role: '前端', credits: 940, creditsTotal: 2500, seat: 'active' },
  { id: 5, name: '周予安', dept: '移动组', role: '前端', credits: 520, creditsTotal: 2500, seat: 'idle' },
  { id: 6, name: '钱多多', dept: '数据组', role: '数据工程', credits: 350, creditsTotal: 2500, seat: 'idle' },
])

export const SEAT_STATUS = [
  { value: 'active', label: '活跃席位', type: 'success' },
  { value: 'idle', label: '闲置席位', type: 'info' },
]
