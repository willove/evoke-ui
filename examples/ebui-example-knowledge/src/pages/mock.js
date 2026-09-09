/** 知识库示例 — 模拟数据（reactive 包裹） */

import { reactive } from 'vue'

/* ---------------- 知识目录树 ---------------- */
export const docTree = reactive([
  {
    id: 1,
    name: '产品手册',
    children: [
      { id: 11, name: '功能介绍', children: [{ id: 111, name: '数据看板' }, { id: 112, name: '报表中心' }] },
      { id: 12, name: '操作指南', children: [{ id: 121, name: '权限配置' }, { id: 122, name: '消息通知' }] },
    ],
  },
  {
    id: 2,
    name: '接入指南',
    children: [
      { id: 21, name: '快速上手', children: [{ id: 211, name: '环境准备' }, { id: 212, name: '首个应用' }] },
      { id: 22, name: 'API 参考', children: [{ id: 221, name: '认证鉴权' }, { id: 222, name: 'Webhook' }] },
    ],
  },
  { id: 3, name: '常见问题', children: [{ id: 31, name: '账号问题' }, { id: 32, name: '计费问题' }] },
  { id: 4, name: '最佳实践', children: [{ id: 41, name: '性能优化' }, { id: 42, name: '数据安全' }] },
])

/* ---------------- 知识文章 ---------------- */
export const articles = reactive([
  { id: 'KB-101', title: '数据看板配置从入门到精通', category: '数据看板', author: '沈从文', views: 12840, status: 'published', updatedAt: '2026-09-05', tags: ['看板', '入门'] },
  { id: 'KB-102', title: '报表中心常见图表选型指南', category: '报表中心', author: '高翔', views: 8210, status: 'published', updatedAt: '2026-09-03', tags: ['图表'] },
  { id: 'KB-121', title: '权限配置最佳实践：RBAC 落地方案', category: '权限配置', author: '林晓', views: 15930, status: 'published', updatedAt: '2026-09-04', tags: ['权限', 'RBAC'] },
  { id: 'KB-122', title: '消息通知渠道配置详解', category: '消息通知', author: '宋佳', views: 4310, status: 'draft', updatedAt: '2026-09-01', tags: ['通知'] },
  { id: 'KB-211', title: '十分钟完成环境准备与初始化', category: '快速上手', author: '周予安', views: 21600, status: 'published', updatedAt: '2026-09-06', tags: ['上手'] },
  { id: 'KB-221', title: '认证鉴权：Token 刷新与失效处理', category: '认证鉴权', author: '钱多多', views: 9870, status: 'published', updatedAt: '2026-08-30', tags: ['鉴权', 'Token'] },
  { id: 'KB-312', title: '账号被锁定的原因与解锁流程', category: '账号问题', author: '钱多多', views: 6120, status: 'published', updatedAt: '2026-09-02', tags: ['账号'] },
  { id: 'KB-411', title: '大数据量列表的性能优化清单', category: '性能优化', author: '高翔', views: 11340, status: 'review', updatedAt: '2026-09-05', tags: ['性能'] },
])

export const ARTICLE_STATUS = [
  { value: 'published', label: '已发布', type: 'success' },
  { value: 'draft', label: '草稿', type: 'info' },
  { value: 'review', label: '评审中', type: 'warning' },
]

/* ---------------- 问答库 ---------------- */
export const faqs = reactive([
  {
    id: 'F-01',
    question: '数据看板的图表数据最长延迟多久？',
    answer: '标准链路为分钟级：数据写入后经过流式加工，看板缓存 5 分钟自动刷新；也可在卡片右上角手动「立即刷新」拉取最新数据。',
    category: '数据看板',
    author: '高翔',
    helpful: 236,
    accepted: true,
  },
  {
    id: 'F-02',
    question: '子账号如何开通指定模块的访问权限？',
    answer: '管理员在「权限配置」中创建角色并勾选模块菜单，再把子账号加入角色即可；权限变更实时生效，无需重新登录。',
    category: '权限配置',
    author: '林晓',
    helpful: 189,
    accepted: true,
  },
  {
    id: 'F-03',
    question: 'API 调用返回 401 的常见原因有哪些？',
    answer: '依次排查：1) Token 已过期（刷新 Token 重试）；2) 时钟偏移超过 5 分钟；3) 应用被停用。都排除后请携带 RequestId 联系技术支持。',
    category: '认证鉴权',
    author: '钱多多',
    helpful: 154,
    accepted: true,
  },
  {
    id: 'F-04',
    question: '如何把看板导出给未开通账号的同事？',
    answer: '看板支持导出为图片 / PDF（会员版支持定时邮件推送）。路径：看板右上角「分享」→「导出」。',
    category: '数据看板',
    author: '沈从文',
    helpful: 87,
    accepted: false,
  },
  {
    id: 'F-05',
    question: '试用套餐到期后数据会保留多久？',
    answer: '到期后数据保留 30 天，期间升级套餐可无缝恢复；超过 30 天进入冷备，需人工申请恢复。',
    category: '计费问题',
    author: '钱多多',
    helpful: 62,
    accepted: false,
  },
])

/* ---------------- 知识图谱（固定布局的关联图） ---------------- */
export const graphNodes = reactive([
  { id: 'dashboard', label: '数据看板', group: 'core', x: 50, y: 50 },
  { id: 'report', label: '报表中心', group: 'module', x: 15, y: 18 },
  { id: 'alert', label: '消息通知', group: 'module', x: 85, y: 15 },
  { id: 'export', label: '导出分享', group: 'module', x: 10, y: 80 },
  { id: 'rbac', label: '权限配置', group: 'module', x: 88, y: 78 },
  { id: 'chart', label: '图表选型', group: 'topic', x: 34, y: 8 },
  { id: 'cache', label: '缓存刷新', group: 'topic', x: 66, y: 42 },
  { id: 'token', label: '认证鉴权', group: 'topic', x: 60, y: 88 },
  { id: 'share', label: '定时推送', group: 'topic', x: 14, y: 50 },
])

export const graphEdges = reactive([
  { from: 'dashboard', to: 'report' },
  { from: 'dashboard', to: 'alert' },
  { from: 'dashboard', to: 'export' },
  { from: 'dashboard', to: 'rbac' },
  { from: 'report', to: 'chart' },
  { from: 'dashboard', to: 'cache' },
  { from: 'export', to: 'share' },
  { from: 'rbac', to: 'token' },
  { from: 'chart', to: 'cache' },
])
