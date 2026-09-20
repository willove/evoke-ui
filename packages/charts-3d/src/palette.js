/**
 * 内置色系注册表 — options.palette 填 id 即整图固定该色系
 *
 * 色值与 evoke-charts 同名色系逐位一致：两库并排时同一 id 出来的系列色相同，
 * 混排的二维图与三维图才不会各说各话。生效后系列色不再读 --ev-color-* 令牌，
 * 宿主换主色 / 换肤不影响；明暗两套随暗色模式内建换挡。
 */

export const CHART3D_PALETTES = [
  {
    id: 'classic',
    name: '经典',
    scene: '当前缺省色板的固化版，品牌蓝锚定；想保住默认观感不随换肤时用',
    light: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
    dark: ['#4d8bff', '#5ad8a6', '#f6bd16', '#6dc8ec', '#f08568', '#a585e8', '#ff9d4d', '#8da3bf'],
  },
  {
    id: 'aurora',
    name: '极光',
    scene: '科技 SaaS / 数据产品——冷调现代，蓝绿紫主打的仪表盘观感',
    light: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#64748B'],
    dark: ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#22D3EE', '#FB923C', '#94A3B8'],
  },
  {
    id: 'sunset',
    name: '落日',
    scene: '消费零售 / 生活方式 / 营销复盘——暖橙珊瑚主导，热情有温度',
    light: ['#F97316', '#E11D48', '#EAB308', '#14B8A6', '#8B5CF6', '#FB7185', '#0EA5E9', '#A8A29E'],
    dark: ['#FB923C', '#FB7185', '#FACC15', '#2DD4BF', '#A78BFA', '#FDA4AF', '#38BDF8', '#BDB4AC'],
  },
  {
    id: 'morandi',
    name: '莫兰迪',
    scene: '人文 / 咨询报告 / 印刷排版——低饱和灰调，长文配图不抢字',
    light: ['#A3AEBB', '#C2A878', '#B08890', '#86A69D', '#9A8FA8', '#B7C4A0', '#C98F6B', '#8A8F98'],
    dark: ['#B4BEC9', '#D4BC8E', '#C29AA3', '#97B5AC', '#ACA2BC', '#C5D0AF', '#D8A685', '#9CA1A9'],
  },
  {
    id: 'forest',
    name: '林间',
    scene: '健康 / 环保 / 农业供应链——自然绿主导，ESG 与可持续叙事',
    light: ['#16A34A', '#0EA5E9', '#CA8A04', '#7C3AED', '#DC2626', '#0D9488', '#D97706', '#64748B'],
    dark: ['#22C55E', '#38BDF8', '#EAB308', '#8B5CF6', '#EF4444', '#14B8A6', '#F59E0B', '#94A3B8'],
  },
  {
    id: 'ink',
    name: '墨蓝',
    scene: '金融 / 政企 / 严肃年报——克制深稳，深蓝为骨、暖色点缀',
    light: ['#1E40AF', '#0F766E', '#B45309', '#6D28D9', '#BE123C', '#0369A1', '#4D7C0F', '#6B7280'],
    dark: ['#6E9BF7', '#2DD4BF', '#D97706', '#8B5CF6', '#FB7185', '#38BDF8', '#84CC16', '#9CA3AF'],
  },
  {
    id: 'candy',
    name: '糖果',
    scene: '营销活动 / 年轻品牌 / 大屏展示——高饱和明快，视觉抓人',
    light: ['#EC4899', '#8B5CF6', '#F59E0B', '#22C55E', '#06B6D4', '#EF4444', '#6366F1', '#9CA3AF'],
    dark: ['#F472B6', '#A78BFA', '#FBBF24', '#4ADE80', '#22D3EE', '#F87171', '#818CF8', '#A1A1AA'],
  },
]

/** 曲面高度映射色带 — 每套色系配一条低→高的连续色带，供 surface3d 取样 */
export const CHART3D_RAMPS = {
  classic: { light: ['#e8f0ff', '#8ab0ff', '#4d86ff', '#175DFF', '#00329b'], dark: ['#12244d', '#26417f', '#4d8bff', '#9ec2ff', '#e5eeff'] },
  aurora: { light: ['#dbeafe', '#93c5fd', '#38bdf8', '#10b981', '#047857'], dark: ['#0b2545', '#155e75', '#0ea5e9', '#34d399', '#d1fae5'] },
  sunset: { light: ['#fff7ed', '#fdba74', '#f97316', '#e11d48', '#881337'], dark: ['#3b1109', '#9a3412', '#f97316', '#fb7185', '#ffe4e6'] },
  viridis: { light: ['#440154', '#31688e', '#35b779', '#fde725'], dark: ['#440154', '#31688e', '#35b779', '#fde725'] },
  heat: { light: ['#fff5eb', '#fdd0a2', '#fd8d3c', '#d94801', '#7f2704'], dark: ['#2b0f00', '#8c2d04', '#d94801', '#fdd0a2', '#fff5eb'] },
  mono: { light: ['#f3f4f6', '#9ca3af', '#4b5563', '#111827'], dark: ['#111827', '#4b5563', '#9ca3af', '#f3f4f6'] },
}

/** 按 id 取色系在指定明暗模式下的 8 槽色值；未知 id 返回 null */
export function resolveChartPalette(id, isDark) {
  const palette = CHART3D_PALETTES.find((p) => p.id === id)
  if (!palette) return null
  return (isDark ? palette.dark : palette.light).slice(0, 8)
}

/** 按 id 取曲面色带；未指定时随色系联动，未知 id 返回 null */
export function resolveChartRamp(id, isDark) {
  const ramp = CHART3D_RAMPS[id]
  if (!ramp) return null
  return (isDark ? ramp.dark : ramp.light).slice()
}

/** 色系 id 清单 — 供文档与校验使用 */
export const CHART3D_PALETTE_IDS = CHART3D_PALETTES.map((p) => p.id)
