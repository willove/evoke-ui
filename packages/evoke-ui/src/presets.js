/**
 * 主题预设 — 供 EvConfigProvider / 定制器与消费方直接取用
 */
import { generatePrimaryRamp } from './utils/color'

/** 主色预设（name → hex） */
export const EV_COLOR_PRESETS = {
  blue:    { label: 'Launch Blue', primary: '#0D70FF' },
  violet:  { label: 'Violet',      primary: '#7C5CFC' },
  emerald: { label: 'Emerald',     primary: '#0FA968' },
  amber:   { label: 'Amber',       primary: '#E8930C' },
  rose:    { label: 'Rose',        primary: '#F04E60' },
  ink:     { label: 'Ink',         primary: '#1A2947' },
}

/**
 * 色系预设 — 按氛围成组的主色候选 + 成套语义色（供定制器选色）
 * 组内每色均可直接作为主色，淡色阶由 generatePrimaryRamp 自动生成；
 * semantic 为该色系配套的 success/warning/danger/info，切色系时整体联动
 */
export const EV_PALETTE_PRESETS = {
  classic: {
    label: '经典',
    description: 'Launch 系高辨识度主色，SaaS 与工具站的稳妥选择',
    colors: Object.values(EV_COLOR_PRESETS).map((c) => ({ label: c.label, value: c.primary })),
    semantic: { success: '#16A34A', warning: '#F97316', danger: '#E5484D', info: '#5D667A' },
  },
  morandi: {
    label: '莫兰迪',
    description: '低饱和灰调，温柔而克制的叙事',
    colors: [
      { label: '豆沙',   value: '#B98A8E' },
      { label: '雾霭蓝', value: '#8FA6BC' },
      { label: '灰绿',   value: '#9BB0A1' },
      { label: '燕麦',   value: '#C2AE92' },
      { label: '藕紫',   value: '#A79BB4' },
      { label: '陶土',   value: '#B89880' },
    ],
    semantic: { success: '#9BB0A1', warning: '#C2AE92', danger: '#B98A8E', info: '#8FA6BC' },
  },
  macaron: {
    label: '马卡龙',
    description: '甜而不腻的粉彩糖壳，甜品店与儿童品牌的语气',
    colors: [
      { label: '樱花粉', value: '#E88FA6' },
      { label: '抹茶',   value: '#85B98C' },
      { label: '天空蓝', value: '#7FB3D9' },
      { label: '柠黄',   value: '#DDB33F' },
      { label: '香芋紫', value: '#A98FD6' },
      { label: '蜜桃橙', value: '#EE9E72' },
    ],
    semantic: { success: '#85B98C', warning: '#DDB33F', danger: '#E2718B', info: '#7FB3D9' },
  },
  earth: {
    label: '大地美拉德',
    description: '焦糖与驼色的层叠，秋冬感与手作质感',
    colors: [
      { label: '焦糖',   value: '#B07B4F' },
      { label: '驼绒',   value: '#C09567' },
      { label: '红棕',   value: '#A05C3B' },
      { label: '橄榄褐', value: '#7E8562' },
      { label: '奶咖',   value: '#B9A085' },
      { label: '深栗',   value: '#7A563E' },
    ],
    semantic: { success: '#7E8562', warning: '#C09567', danger: '#A05C3B', info: '#B9A085' },
  },
  matisse: {
    label: '马蒂斯',
    description: '野兽派剪纸的高纯度撞色，艺术感与表现力优先',
    colors: [
      { label: '剪纸蓝', value: '#2F5D9E' },
      { label: '朱砂',   value: '#D0492C' },
      { label: '铬黄',   value: '#DFA32E' },
      { label: '翠绿',   value: '#3E8E6B' },
      { label: '玫红',   value: '#D06A86' },
      { label: '墨青',   value: '#34506B' },
    ],
    semantic: { success: '#3E8E6B', warning: '#DFA32E', danger: '#D0492C', info: '#2F5D9E' },
  },
  dunhuang: {
    label: '敦煌',
    description: '矿物颜料的壁画色域，土红石青石绿间的大气悠远',
    colors: [
      { label: '土红',   value: '#A9553D' },
      { label: '石青',   value: '#446A93' },
      { label: '石绿',   value: '#55876B' },
      { label: '土黄',   value: '#C89B5A' },
      { label: '绛紫',   value: '#7D5A74' },
      { label: '赭石',   value: '#B07C4F' },
    ],
    semantic: { success: '#55876B', warning: '#C89B5A', danger: '#A9553D', info: '#446A93' },
  },
  dopamine: {
    label: '多巴胺',
    description: '高饱和高能量的快乐色，社交与潮流场景的注意力引擎',
    colors: [
      { label: '活力橙', value: '#F97A3D' },
      { label: '亮黄',   value: '#F5B31C' },
      { label: '荧光绿', value: '#53BE57' },
      { label: '玫红',   value: '#F4587A' },
      { label: '宝蓝',   value: '#3D6BFF' },
      { label: '亮紫',   value: '#9C5CE8' },
    ],
    semantic: { success: '#53BE57', warning: '#F5B31C', danger: '#F4587A', info: '#3D6BFF' },
  },
}

/** 圆角档预设（scale 基准乘数作用于 6/10/14/20/28） */
export const EV_RADIUS_PRESETS = {
  sharp:   { label: '硬朗', scale: 0.55 },
  soft:    { label: '柔和', scale: 0.8 },
  default: { label: '标准', scale: 1 },
  round:   { label: '圆润', scale: 1.3 },
}

/** 间距档预设（作用于 4px 网格全部间距令牌） */
export const EV_SPACE_PRESETS = {
  compact: { label: '紧凑', scale: 0.85 },
  default: { label: '标准', scale: 1 },
  loose:   { label: '宽松', scale: 1.2 },
}

/** 内容容器宽度档 */
export const EV_CONTAINER_PRESETS = {
  narrow:   { label: '窄', width: 920 },
  default:  { label: '标准', width: 1152 },
  wide:     { label: '宽', width: 1360 },
  full:     { label: '通栏', width: 0 },
}

/** 风格方案预设（站点类型 → 一整套 主色/圆角/间距/容器宽） */
export const EV_STYLE_PRESETS = {
  corporate: {
    label: '企业官网',
    description: '标准蓝 · 均衡节奏，稳重可信的第一印象',
    config: { primary: '#0D70FF', radius: 'default', space: 'default', container: 'default' },
  },
  personal: {
    label: '个人站',
    description: '墨色 · 圆润 · 松弛，安静的个人表达',
    config: { primary: '#1A2947', radius: 'round', space: 'loose', container: 'narrow' },
  },
  studio: {
    label: '设计工作室',
    description: '硬朗紧凑 · 通栏排版，作品优先',
    config: { primary: '#7C5CFC', radius: 'sharp', space: 'compact', container: 'wide' },
  },
  campaign: {
    label: '活动促销',
    description: '玫瑰红 · 高能量，促销季的紧迫感',
    config: { primary: '#F04E60', radius: 'round', space: 'default', container: 'default' },
  },
  lifestyle: {
    label: '生活方式',
    description: '翠绿 · 柔和 · 大留白，呼吸感优先',
    config: { primary: '#0FA968', radius: 'soft', space: 'loose', container: 'default' },
  },
}

const BASE_RADIUS = { sm: 6, md: 10, lg: 14, xl: 20, xxl: 28 }
const BASE_SPACES = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80]

/** 语义色槽位（与主色同构，各生成一整条淡色阶） */
const SEMANTIC_SLOTS = ['success', 'warning', 'danger', 'info']

/** 由配置计算需要写入的 CSS 自定义属性（--ev-*） */
export function resolveThemeVars(config = {}) {
  const vars = {}
  const { primary, semantic, series, radius, space, container } = config

  if (primary) {
    const ramp = generatePrimaryRamp(primary)
    if (ramp) {
      vars['--ev-color-primary'] = ramp.base
      vars['--ev-color-primary-light-3'] = ramp.light3
      vars['--ev-color-primary-light-5'] = ramp.light5
      vars['--ev-color-primary-light-7'] = ramp.light7
      vars['--ev-color-primary-light-8'] = ramp.light8
      vars['--ev-color-primary-light-9'] = ramp.light9
      vars['--ev-color-primary-dark-2'] = ramp.dark2
      vars['--ev-color-primary-rgb'] = ramp.rgb
    }
  }

  // 语义色整套联动（success/warning/danger/info 各生成一整条色阶）
  if (semantic) {
    for (const name of SEMANTIC_SLOTS) {
      const ramp = generatePrimaryRamp(semantic[name] || '')
      if (!ramp) continue
      vars[`--ev-color-${name}`] = ramp.base
      vars[`--ev-color-${name}-light-3`] = ramp.light3
      vars[`--ev-color-${name}-light-5`] = ramp.light5
      vars[`--ev-color-${name}-light-7`] = ramp.light7
      vars[`--ev-color-${name}-light-8`] = ramp.light8
      vars[`--ev-color-${name}-light-9`] = ramp.light9
      vars[`--ev-color-${name}-dark-2`] = ramp.dark2
      vars[`--ev-color-${name}-rgb`] = ramp.rgb
    }
  }

  // 图表系列色板（--ev-color-series-1..8，evoke-charts 按槽读取）
  if (Array.isArray(series)) {
    series.slice(0, 8).forEach((color, i) => {
      if (color) vars[`--ev-color-series-${i + 1}`] = color
    })
  }

  const radiusPreset = EV_RADIUS_PRESETS[radius]
  if (radiusPreset) {
    const s = radiusPreset.scale
    vars['--ev-radius-sm'] = `${Math.round(BASE_RADIUS.sm * s)}px`
    vars['--ev-radius-md'] = `${Math.round(BASE_RADIUS.md * s)}px`
    vars['--ev-radius-lg'] = `${Math.round(BASE_RADIUS.lg * s)}px`
    vars['--ev-radius-xl'] = `${Math.round(BASE_RADIUS.xl * s)}px`
    vars['--ev-radius-2xl'] = `${Math.round(BASE_RADIUS.xxl * s)}px`
  }

  const spacePreset = EV_SPACE_PRESETS[space]
  if (spacePreset) {
    const s = spacePreset.scale
    const names = ['space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6', 'space-8', 'space-10', 'space-12', 'space-16', 'space-20']
    BASE_SPACES.forEach((px, i) => {
      vars[`--ev-${names[i]}`] = `${Math.round(px * s)}px`
    })
  }

  const containerPreset = EV_CONTAINER_PRESETS[container]
  if (containerPreset) {
    vars['--ev-container-width'] = containerPreset.width ? `${containerPreset.width}px` : '100%'
  }

  return vars
}
