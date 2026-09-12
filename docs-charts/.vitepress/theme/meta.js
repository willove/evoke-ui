/**
 * 站点目录 — 侧边栏 / 站内搜索共用
 */
export const GUIDE_NAV = [
  {
    name: '指南',
    key: 'guide',
    components: [
      { name: '安装与引入', zh: '', path: '/guide/install' },
      { name: '主题接入', zh: '', path: '/guide/theme' },
      { name: 'AI 生成', zh: '', path: '/guide/ai' },
      { name: '设计规范', zh: '', path: '/guide/design' },
      { name: '内嵌于组件库', zh: 'eb-chart', path: '/guide/integration' },
    ],
  },
]

/** 图表分区导航 — 侧栏在 /chart 路由下展示（按图表类型细分，参考 G2 风格） */
export const CHART_NAV = [
  {
    name: '图表',
    key: 'chart-basics',
    components: [
      { name: '总览与快速上手', zh: '', path: '/chart' },
      { name: 'API 参考', zh: '', path: '/chart/api' },
    ],
  },
  {
    name: '折线与面积',
    key: 'chart-line',
    components: [
      { name: '折线图', zh: 'line', path: '/chart/line' },
      { name: '面积图', zh: 'area', path: '/chart/area' },
      { name: '迷你趋势图', zh: 'sparkline', path: '/chart/sparkline' },
    ],
  },
  {
    name: '柱状与条形',
    key: 'chart-bar',
    components: [
      { name: '柱状图', zh: 'bar', path: '/chart/bar' },
      { name: '堆叠柱状图', zh: 'stacked-bar', path: '/chart/stacked-bar' },
      { name: '条形图', zh: 'horizontal-bar', path: '/chart/horizontal-bar' },
      { name: '瀑布图', zh: 'waterfall', path: '/chart/waterfall' },
    ],
  },
  {
    name: '占比与转化',
    key: 'chart-pie',
    components: [
      { name: '饼图', zh: 'pie', path: '/chart/pie' },
      { name: '环形图', zh: 'doughnut', path: '/chart/doughnut' },
      { name: '玫瑰图', zh: 'rose', path: '/chart/rose' },
      { name: '漏斗图', zh: 'funnel', path: '/chart/funnel' },
    ],
  },
  {
    name: '指标与目标',
    key: 'chart-kpi',
    components: [
      { name: '仪表盘', zh: 'gauge', path: '/chart/gauge' },
      { name: '子弹图', zh: 'bullet', path: '/chart/bullet' },
    ],
  },
  {
    name: '分布与关系',
    key: 'chart-distribution',
    components: [
      { name: '散点图', zh: 'scatter', path: '/chart/scatter' },
      { name: '直方图', zh: 'bin', path: '/chart/bin' },
      { name: '热力图', zh: 'heatmap', path: '/chart/heatmap' },
      { name: '箱线图', zh: 'boxplot', path: '/chart/boxplot' },
      { name: 'K 线图', zh: 'candle', path: '/chart/candle' },
    ],
  },
  {
    name: '层级与多维',
    key: 'chart-hierarchy',
    components: [
      { name: '矩形树图', zh: 'treemap', path: '/chart/treemap' },
      { name: '旭日图', zh: 'sunburst', path: '/chart/sunburst' },
      { name: '雷达图', zh: 'radar', path: '/chart/radar' },
    ],
  },
  {
    name: '组合与进阶',
    key: 'chart-advanced',
    components: [
      { name: '混合图', zh: 'mixed', path: '/chart/mixed' },
      { name: '交互与联动', zh: '', path: '/chart/interaction' },
    ],
  },
]

/** 案例分区导航 — 侧栏在 /examples 路由下展示 */
export const EXAMPLES_NAV = [
  {
    name: '案例',
    key: 'examples',
    components: [
      { name: '案例总览', zh: '', path: '/examples/' },
      { name: '运营数据看板', zh: '', path: '/examples/dashboard' },
      { name: '服务器指标监控', zh: '', path: '/examples/monitor' },
      { name: '报表嵌入', zh: '', path: '/examples/report' },
    ],
  },
]

/** 扁平指南清单（搜索用） */
export const ALL_GUIDE_PAGES = GUIDE_NAV.flatMap((c) =>
  c.components.map((comp) => ({ ...comp, category: '指南' })),
)

/** 扁平图表章节清单（搜索用） */
export const ALL_CHART_PAGES = CHART_NAV.flatMap((c) =>
  c.components.map((comp) => ({ ...comp, category: '图表' })),
)

/** 扁平案例清单（搜索用） */
export const ALL_EXAMPLES = EXAMPLES_NAV.flatMap((c) =>
  c.components
    .filter((comp) => comp.path !== '/examples/')
    .map((comp) => ({ ...comp, category: '案例' })),
)

/** 主题色与品牌 */
export const BRAND = {
  name: 'Evoke Charts',
  primary: '#175DFF',
  version: '0.3.0',
}
