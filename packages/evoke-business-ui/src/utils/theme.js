/**
 * 运行时主题工具 — 换主色 / 切密度
 *
 * 设计要点：
 * - 色阶派生与 variables.css 中手调梯度同一算法（sRGB 线性插值）：
 *   light-N = 主色向白混合 N×10%，dark-2 = 向黑混 20%，
 *   保证 setPrimaryColor 后的视觉梯度与默认主题一致。
 * - 全部 DOM 访问在函数内守卫（SSR / Electron 安全）。
 * - setPrimaryColor 会派发全局 'ev-theme-change' 事件，
 *   图表组件监听该事件重绘，色板随即跟随新主色。
 * - 颜色基元实现在 utils/color.ts（TS 试点模块）。
 */
import { normalizeHex, hexToRgb, rgbToHex, mixHex } from './color'

export { normalizeHex, hexToRgb, rgbToHex, mixHex }

const RAMP_LIGHT_STEPS = [
  ['light-3', 0.3],
  ['light-5', 0.5],
  ['light-7', 0.7],
  ['light-8', 0.8],
  ['light-9', 0.9],
]
const RAMP_DARK_STEPS = [['dark-2', 0.2]]

const THEME_CHANGE_EVENT = 'ev-theme-change'

/**
 * 生成主色完整梯度（7 档 + rgb 三元组）
 * @returns {Record<string, string>} 形如 { '--ev-color-primary': '#...', '--ev-color-primary-light-3': '#...', ... '--ev-color-primary-rgb': 'r, g, b' }
 */
export function generatePrimaryRamp(hex) {
  const base = normalizeHex(hex)
  if (!base) return null
  const { r, g, b } = hexToRgb(base)
  const ramp = {
    '--ev-color-primary': base,
    '--ev-color-primary-rgb': `${r}, ${g}, ${b}`,
  }
  for (const [name, t] of RAMP_LIGHT_STEPS) {
    ramp[`--ev-color-primary-${name}`] = mixHex(base, '#ffffff', t)
  }
  for (const [name, t] of RAMP_DARK_STEPS) {
    ramp[`--ev-color-primary-${name}`] = mixHex(base, '#000000', t)
  }
  return ramp
}

/**
 * 运行时换主色：一条语句完成全部 7 档梯度 + rgb 三元组注入
 * @param {string} hex 任意合法十六进制色（#RGB / #RRGGBB / #RRGGBBAA）
 * @param {HTMLElement} [target] 注入目标，默认 documentElement
 * @returns {Record<string, string>|null} 实际注入的令牌表（非法输入返回 null）
 */
export function setPrimaryColor(hex, target) {
  const ramp = generatePrimaryRamp(hex)
  if (!ramp) return null
  const el = target ?? (typeof document !== 'undefined' ? document.documentElement : null)
  if (el) {
    for (const [name, value] of Object.entries(ramp)) {
      el.style.setProperty(name, value)
    }
    el.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT))
  }
  return ramp
}

const DENSITY_MODES = new Set(['compact', 'default', 'loose'])

/**
 * 全局密度切换：html[data-ev-density]
 * @param {'compact'|'default'|'loose'} mode
 */
export function setDensity(mode) {
  if (!DENSITY_MODES.has(mode)) return false
  if (typeof document === 'undefined') return false
  if (mode === 'default') document.documentElement.removeAttribute('data-ev-density')
  else document.documentElement.setAttribute('data-ev-density', mode)
  return true
}

export function getDensity() {
  if (typeof document === 'undefined') return 'default'
  return document.documentElement.getAttribute('data-ev-density') || 'default'
}
