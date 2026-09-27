/**
 * 站点目录数据 — 顶栏 / 侧栏 / 站内搜索共用。
 *
 * 组件目录**不再手写**：直接读包内分类单一来源
 * （packages/evoke-tools-ui/src/taxonomy.js），两层（common / office）与
 * 用途分类（壳 / 工具区 / 命令 / 面板 / 反馈 / 输入 / 基础）在那边定义一次，
 * 这里只做展示形态的适配。分类漂移由包的 G9 分类门 + taxonomy.test.js 守。
 */
import {
  LAYERS,
  CATEGORIES,
  GRANULARITIES,
  COMPONENT_TAXONOMY,
  groupedByCategory,
} from '../../../packages/evoke-tools-ui/src/taxonomy.js'

/** 指南分组（/guide/* 的侧栏） */
export const GUIDE_NAV = [
  {
    name: '指南',
    key: 'guide',
    components: [
      { name: '快速开始', zh: '', path: '/guide/getting-started' },
      { name: '命令驱动', zh: '', path: '/guide/commands' },
      { name: '工作台布局', zh: '', path: '/guide/workbench' },
      { name: '风格体系', zh: '', path: '/guide/style' },
      { name: '组合契约（槽位）', zh: '', path: '/guide/composition' },
      { name: '主题与画布桥', zh: '', path: '/guide/theme' },
      { name: '键盘优先', zh: '', path: '/guide/keyboard' },
      { name: '配方：日志分析器', zh: '', path: '/guide/recipe-log-analyzer' },
    ],
  },
  {
    name: '契约',
    key: 'contract',
    components: [{ name: '设计规范（--et-* 全量）', zh: '', path: '/guide/design' }],
  },
]

/** 案例分组（/examples/* 的侧栏） */
export const EXAMPLES_NAV = [
  {
    name: '案例',
    key: 'examples',
    components: [
      { name: '案例总览', zh: '', path: '/examples/' },
      { name: '电子表格工作台', zh: '', path: '/examples/sheet-workbench' },
      { name: '日志分析器', zh: '', path: '/examples/log-analyzer' },
      { name: '数据库查询台', zh: '', path: '/examples/sql-console' },
      { name: '文件资源管理器', zh: '', path: '/examples/file-explorer' },
      { name: '代码编辑器', zh: '', path: '/examples/code-editor' },
      { name: '运维监控台', zh: '', path: '/examples/ops-monitor' },
      { name: '邮件工作台', zh: '', path: '/examples/mail-workspace' },
      { name: '设置中心（Backstage）', zh: '', path: '/examples/settings-backstage' },
    ],
  },
]

/** 组件条目的展示形态：中文短名 + 子路径名（英文）+ 分类/粒度标签 */
function toSidebarItems(components) {
  return components.map((c) => ({
    name: c.zh,
    suffix: c.id,
    path: `/components/${c.id}`,
    id: c.id,
    layer: c.layer,
    category: c.category,
    granularity: c.granularity,
    summary: c.summary,
  }))
}

/** 两层 × 用途分类的侧栏树（/components/* 与两个概览页共用） */
export const TOOLS_LAYERS = Object.values(LAYERS).map((layer) => ({
  ...layer,
  groups: groupedByCategory(layer.key).map(({ category, components }) => ({
    key: `${layer.key}-${category.key}`,
    name: category.zh,
    desc: category.desc,
    components: toSidebarItems(components),
  })),
}))

/** 概览页与抽屉用：层 → 分类 → 条目（含中文摘要） */
export { LAYERS, CATEGORIES, GRANULARITIES, COMPONENT_TAXONOMY }

/** 站内搜索的扁平索引（指南 + 组件 + 案例，带分类） */
export const ALL_PAGES = [
  ...GUIDE_NAV.flatMap((g) => g.components.map((c) => ({ ...c, category: g.name }))),
  ...COMPONENT_TAXONOMY.map((c) => ({
    name: c.zh,
    zh: c.id,
    path: `/components/${c.id}`,
    category: `${LAYERS[c.layer].zh} · ${CATEGORIES[c.category].zh}`,
  })),
  ...EXAMPLES_NAV.flatMap((g) => g.components.map((c) => ({ ...c, category: g.name }))),
]

/** 主题色与品牌（家族三站同一枚 #175DFF） */
export const BRAND = {
  name: 'Evoke Tools UI',
  primary: '#175DFF',
}