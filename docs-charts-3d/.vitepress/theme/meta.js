/**
 * 站点目录 — 侧边栏 / 站内搜索共用
 */
export const GUIDE_NAV = [
  {
    name: '指南',
    key: 'guide',
    components: [
      { name: '安装与引入', zh: '', path: '/guide/install' },
      { name: '相机与交互', zh: '', path: '/guide/camera' },
      { name: '主题接入', zh: '', path: '/guide/theme' },
      { name: '设计规范', zh: '', path: '/guide/design' },
      { name: '更新记录', zh: '', path: '/guide/changelog' },
    ],
  },
]

/** 图型导航 — 侧栏在 /chart 路由下展示 */
export const CHART_NAV = [
  {
    name: '三维图型',
    key: 'chart-basics',
    components: [
      { name: '总览与快速上手', zh: '', path: '/chart' },
      { name: 'API 参考', zh: '', path: '/chart/api' },
    ],
  },
  {
    name: '直角坐标',
    key: 'chart-cartesian',
    components: [
      { name: '三维柱状图', zh: 'bar3d', path: '/chart/bar3d' },
      { name: '三维折线图', zh: 'line3d', path: '/chart/line3d' },
      { name: '三维散点图', zh: 'scatter3d', path: '/chart/scatter3d' },
    ],
  },
  {
    name: '曲面与占比',
    key: 'chart-surface',
    components: [
      { name: '三维曲面图', zh: 'surface3d', path: '/chart/surface3d' },
      { name: '三维饼图 / 环形图', zh: 'pie3d', path: '/chart/pie3d' },
    ],
  },
]

/** 扁平指南清单（搜索用） */
export const ALL_GUIDE_PAGES = GUIDE_NAV.flatMap((c) =>
  c.components.map((comp) => ({ ...comp, category: '指南' })),
)

/** 扁平图型章节清单（搜索用） */
export const ALL_CHART_PAGES = CHART_NAV.flatMap((c) =>
  c.components.map((comp) => ({ ...comp, category: '图型' })),
)

/** 主题色与品牌 */
export const BRAND = {
  name: 'Charts 3D',
  primary: '#175DFF',
  version: '0.1.0',
}
