/**
 * 主题与常量 — 颜色令牌槽位、内置明暗结构色、i18n
 *
 * 与 evoke 生态共用 --ev-* 命名空间：系列色逐槽尝试 --ev-color-series-N
 * （槽 1 回落 --ev-color-primary 跟随品牌主色），任一槽无令牌时回落内置色板。
 * 换肤信号与生态一致：documentElement 上的 ev-theme-change 事件 + html.dark。
 */
import { readToken, isDarkMode } from './core/color.js'

/** 语义色：涨/跌结论共用默认值，可被配置覆写 */
export const UP_COLOR = '#dc2626'
export const DOWN_COLOR = '#16a34a'

/** 结构色（非数据元素）——明暗两套，与缺省色板同源 */
export const STRUCTURE_LIGHT = {
  backgroundColor: 'transparent',
  textColor: '#1f2937',
  textColorSecondary: '#6b7280',
  gridColor: 'rgba(31, 41, 55, 0.10)',
  wallColor: 'rgba(31, 41, 55, 0.035)',
  borderColor: 'rgba(31, 41, 55, 0.16)',
  highlightColor: 'rgba(23, 93, 255, 0.16)',
}

export const STRUCTURE_DARK = {
  backgroundColor: 'transparent',
  textColor: '#e5e7eb',
  textColorSecondary: '#9ca3af',
  gridColor: 'rgba(229, 231, 235, 0.12)',
  wallColor: 'rgba(229, 231, 235, 0.05)',
  borderColor: 'rgba(229, 231, 235, 0.20)',
  highlightColor: 'rgba(77, 139, 255, 0.24)',
}

/** 数据色静态兜底（SSR / 无 DOM 环境）；浏览器内以 --ev-color-series-* 令牌优先 */
export const CHART_COLORS = {
  primary: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  dark: ['#4d8bff', '#5ad8a6', '#f6bd16', '#6dc8ec', '#f08568', '#a585e8', '#ff9d4d', '#8da3bf'],
}

/** 系列色令牌槽位 — 语义与 evoke-charts 完全一致，两库共享同一套换肤配置 */
export const SERIES_COLOR_SLOTS = [
  ['--ev-color-series-1', '--ev-color-primary'],
  ['--ev-color-series-2'],
  ['--ev-color-series-3'],
  ['--ev-color-series-4'],
  ['--ev-color-series-5'],
  ['--ev-color-series-6'],
  ['--ev-color-series-7'],
  ['--ev-color-series-8'],
]

export function getSeriesColors(fallbackColors) {
  return SERIES_COLOR_SLOTS.map((tokens, i) => {
    for (const t of tokens) {
      const v = readToken(t, '')
      if (v) return v
    }
    return fallbackColors[i]
  })
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
  const theme = {
    isDark,
    ...structure,
    backgroundColor: readToken('--ev-bg-color', structure.backgroundColor),
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
