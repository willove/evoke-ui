/**
 * 主题与常量 — 内置明暗结构色、i18n
 *
 * 系列色与令牌读取直接复用 evoke-charts 主体系的实现（../types.js）：
 * 同一套 --ev-color-series-N 槽位、同一套静态兜底色板，二维与三维必然同色。
 * 本文件只补三维独有部分：结构色（墙面/网格）与三维图型清单。
 */
import { isDarkMode, parseColor, readToken } from './core/color.js'
import { CHART_COLORS as SHARED_CHART_COLORS, getSeriesColors as sharedGetSeriesColors } from '../types.js'

/** 语义色：涨/跌结论共用默认值，可被配置覆写 */
export const UP_COLOR = '#dc2626'
export const DOWN_COLOR = '#16a34a'

/** 结构色（非数据元素）——明暗两套，与缺省色板同源 */
export const STRUCTURE_LIGHT = {
  backgroundColor: 'transparent',
  /** 雾化基准色：背景透明时远景向它混合（空气透视的目标色） */
  backdropColor: '#ffffff',
  textColor: '#1f2937',
  textColorSecondary: '#6b7280',
  gridColor: 'rgba(31, 41, 55, 0.10)',
  wallColor: 'rgba(31, 41, 55, 0.035)',
  borderColor: 'rgba(31, 41, 55, 0.16)',
  highlightColor: 'rgba(23, 93, 255, 0.16)',
}

export const STRUCTURE_DARK = {
  backgroundColor: 'transparent',
  backdropColor: '#1f2937',
  textColor: '#e5e7eb',
  textColorSecondary: '#9ca3af',
  gridColor: 'rgba(229, 231, 235, 0.12)',
  wallColor: 'rgba(229, 231, 235, 0.05)',
  borderColor: 'rgba(229, 231, 235, 0.20)',
  highlightColor: 'rgba(77, 139, 255, 0.24)',
}

/** 共享主体系的色板与槽位读取（兼容别名，三维内部引用不动） */
export const CHART_COLORS = SHARED_CHART_COLORS

export function getSeriesColors(fallbackColors) {
  return sharedGetSeriesColors(fallbackColors)
}

export const DEFAULT_I18N_ZH = {
  tooltip: { x: 'X', y: 'Y', z: 'Z', value: '数值', total: '总计', percent: '占比' },
  legend: { show: '显示', hide: '隐藏' },
  noData: '暂无数据',
}

export const DEFAULT_I18N_EN = {
  tooltip: { x: 'X', y: 'Y', z: 'Z', value: 'Value', total: 'Total', percent: 'Share' },
  legend: { show: 'Show', hide: 'Hide' },
  noData: 'No Data',
}

export function resolveI18n(options, isDark) {
  void isDark
  const i18n = options && typeof options.i18n === 'object' ? options.i18n : null
  const base = options && options.lang === 'en' ? DEFAULT_I18N_EN : DEFAULT_I18N_ZH
  if (!i18n) return base
  return {
    ...base,
    ...i18n,
    tooltip: { ...base.tooltip, ...(i18n.tooltip || {}) },
    legend: { ...base.legend, ...(i18n.legend || {}) },
  }
}

/** 支持的图型清单 — schema 枚举与运行时分发的唯一事实源 */
export const CHART3D_TYPES = ['bar3d', 'line3d', 'scatter3d', 'surface3d', 'pie3d']

/** 进场/补间缓动 — 与 evoke-charts 的 easings 同名同义 */
export const easings = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  easeOutBack: (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
  },
  easeOutExpo: (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
}

export function resolveEasing(name) {
  return easings[name] || easings.easeOut
}

/**
 * 组装主题
 * 优先级与 evoke-charts 一致：customTheme > options.palette > --ev-* 令牌 > 内置
 * （colors 字段单独裁定：customTheme.colors > paletteColors > 令牌槽位 > 内置色板）
 */
export function getTheme(options = {}, customTheme = null, paletteColors = null) {
  const isDark = isDarkMode()
  const structure = isDark ? STRUCTURE_DARK : STRUCTURE_LIGHT
  let colors
  if (customTheme && Array.isArray(customTheme.colors) && customTheme.colors.length) {
    colors = customTheme.colors
  } else if (Array.isArray(paletteColors) && paletteColors.length) {
    colors = paletteColors
  } else {
    colors = getSeriesColors(isDark ? CHART_COLORS.dark : CHART_COLORS.primary)
  }
  // 雾化基准色：背景色本身不透明就用它；透明底（默认）时读浮层底色令牌、回落内置明暗底
  const bgRaw = readToken('--ev-bg-color', structure.backgroundColor)
  const bgParsed = parseColor(bgRaw)
  const backdropColor = bgParsed && bgParsed.a >= 0.9
    ? bgRaw
    : readToken('--ev-bg-color-overlay', structure.backdropColor)
  const theme = {
    isDark,
    ...structure,
    backgroundColor: bgRaw,
    backdropColor,
    textColor: readToken('--ev-text-color-primary', structure.textColor),
    textColorSecondary: readToken('--ev-text-color-secondary', structure.textColorSecondary),
    gridColor: readToken('--ev-border-color-lighter', structure.gridColor),
    borderColor: readToken('--ev-border-color', structure.borderColor),
    highlightColor: structure.highlightColor,
    fontFamily: readToken(
      '--ev-font-family',
      "'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif",
    ),
    colors,
  }
  // 覆写仅取显式给出的字段，避免 undefined 把已裁定值抹掉
  if (customTheme) {
    for (const [k, v] of Object.entries(customTheme)) {
      if (v !== undefined) theme[k] = v
    }
  }
  return theme
}
