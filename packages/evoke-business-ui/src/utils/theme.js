/**
 * 运行时主题工具 — 换主色 / 语义色 / 暗色自适应 / 持久化 / 切密度
 *
 * 设计要点：
 * - 色阶派生与 variables.css 中手调梯度同一算法（sRGB 线性插值）：
 *   亮色模式 light-N = 主色向白混合 N×10%，dark-2 = 向黑混 20%；
 *   暗色模式反向（light-N 向黑混、dark-2 向白混），与 dark.css 手调梯度同向，
 *   保证 setPrimaryColor / setSemanticColors 后的视觉梯度与默认主题一致。
 * - 暗色自适应：运行时注入过主色/语义色后，监听 html.dark 切换并按新模式
 *   自动重注入（单例 MutationObserver，resetTheme 时断开）。
 * - 全部 DOM 访问在函数内守卫（SSR / Electron 安全）。
 * - 换色会派发全局 'ev-theme-change' 事件（detail 携带 { dark }），
 *   图表组件监听该事件重绘，色板随即跟随新主色。
 * - 持久化：saveThemeConfig / loadThemeConfig / clearThemeConfig，
 *   存取 localStorage 'ev-theme-config'（{ primary, semantic }）。
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
// 外接图表库监听的令牌变更事件（--ec-* 命名空间），换色时一并派发
const CHART_THEME_CHANGE_EVENT = 'ec-theme-change'
export const THEME_STORAGE_KEY = 'ev-theme-config'

function isDarkMode() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

/** 归一化第二参数：兼容旧签名 setPrimaryColor(hex, targetElement) */
function normalizeOptions(options) {
  if (options == null) return {}
  if (typeof options === 'object' && 'nodeType' in options) return { target: options }
  return options
}

/**
 * 生成任意颜色的完整梯度（8 令牌）
 * @param {string} hex 基色
 * @param {{ dark?: boolean, prefix?: string }} [options]
 *   dark 缺省自动探测 html.dark；prefix 默认主色令牌前缀，语义色传 '--ev-color-success' 等
 * @returns {Record<string, string>|null}
 */
export function generateColorRamp(hex, options = {}) {
  const base = normalizeHex(hex)
  if (!base) return null
  const dark = typeof options.dark === 'boolean' ? options.dark : isDarkMode()
  const prefix = options.prefix ?? '--ev-color-primary'
  const { r, g, b } = hexToRgb(base)
  const ramp = {
    [`${prefix}`]: base,
    [`${prefix}-rgb`]: `${r}, ${g}, ${b}`,
  }
  // 亮色：light-N 趋白 / dark-2 趋黑；暗色：反向（与 dark.css 手调梯度同向）
  const toward = dark ? '#000000' : '#ffffff'
  const away = dark ? '#ffffff' : '#000000'
  for (const [name, t] of RAMP_LIGHT_STEPS) {
    ramp[`${prefix}-${name}`] = mixHex(base, toward, t)
  }
  for (const [name, t] of RAMP_DARK_STEPS) {
    ramp[`${prefix}-${name}`] = mixHex(base, away, t)
  }
  return ramp
}

/**
 * 生成主色完整梯度（兼容入口，等同 generateColorRamp(hex, options)）
 */
export function generatePrimaryRamp(hex, options) {
  return generateColorRamp(hex, options)
}

// ─── 运行时注入状态（暗色自适应跟随用） ───
let appliedPrimary = null
let appliedSemantic = null
let darkObserver = null
let lastDark = false

const SEMANTIC_KEYS = ['success', 'warning', 'danger', 'info']
const RAMP_TOKEN_NAMES = ['', '-rgb', '-light-3', '-light-5', '-light-7', '-light-8', '-light-9', '-dark-2']

function injectRamp(ramp, target) {
  const el = target ?? (typeof document !== 'undefined' ? document.documentElement : null)
  if (!el) return
  for (const [name, value] of Object.entries(ramp)) {
    el.style.setProperty(name, value)
  }
}

function dispatchThemeChange(dark) {
  if (typeof document === 'undefined') return
  // 派发在 documentElement 上并冒泡：兼容监听 documentElement 与 document 的两方（图表）
  document.documentElement.dispatchEvent(
    new CustomEvent(THEME_CHANGE_EVENT, { bubbles: true, detail: { dark } }),
  )
  document.documentElement.dispatchEvent(
    new CustomEvent(CHART_THEME_CHANGE_EVENT, { bubbles: true, detail: { dark } }),
  )
}

/** 暗色切换跟随：单例观察者，注入过主题后按新模式重注入全部梯度 */
function ensureDarkObserver() {
  if (darkObserver || typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
  lastDark = isDarkMode()
  darkObserver = new MutationObserver(() => {
    const dark = isDarkMode()
    if (dark === lastDark) return
    lastDark = dark
    if (appliedPrimary) injectRamp(generateColorRamp(appliedPrimary, { dark }), document.documentElement)
    if (appliedSemantic) {
      for (const key of SEMANTIC_KEYS) {
        const hex = appliedSemantic[key]
        if (hex) injectRamp(generateColorRamp(hex, { dark, prefix: `--ev-color-${key}` }), document.documentElement)
      }
    }
    dispatchThemeChange(dark)
  })
  darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

function stopDarkObserver() {
  darkObserver?.disconnect()
  darkObserver = null
}

/**
 * 运行时换主色：一条语句完成全部 7 档梯度 + rgb 三元组注入；
 * 暗色模式下梯度自动反向，且后续 html.dark 切换会跟随重注入
 * @param {string} hex 任意合法十六进制色（#RGB / #RRGGBB / #RRGGBBAA）
 * @param {{ dark?: boolean, target?: HTMLElement }} [options] 兼容旧签名直接传 HTMLElement（视为 target）
 * @returns {Record<string, string>|null} 实际注入的令牌表（非法输入返回 null）
 */
export function setPrimaryColor(hex, options) {
  const opts = normalizeOptions(options)
  const dark = typeof opts.dark === 'boolean' ? opts.dark : isDarkMode()
  const ramp = generateColorRamp(hex, { dark })
  if (!ramp) return null
  injectRamp(ramp, opts.target)
  appliedPrimary = normalizeHex(hex)
  appliedSemantic = appliedSemantic || {}
  ensureDarkObserver()
  dispatchThemeChange(dark)
  return ramp
}

/**
 * 运行时配置语义色（success / warning / danger / info），规则同主色；
 * 只更新传入的键，其余语义色保持不变
 * @param {{ success?: string, warning?: string, danger?: string, info?: string }} colors
 * @param {{ dark?: boolean, target?: HTMLElement }} [options]
 */
export function setSemanticColors(colors, options) {
  if (!colors || typeof colors !== 'object') return null
  const opts = normalizeOptions(options)
  const dark = typeof opts.dark === 'boolean' ? opts.dark : isDarkMode()
  const injected = {}
  for (const key of SEMANTIC_KEYS) {
    const ramp = generateColorRamp(colors[key], { dark, prefix: `--ev-color-${key}` })
    if (!ramp) continue
    injectRamp(ramp, opts.target)
    injected[key] = normalizeHex(colors[key])
  }
  if (Object.keys(injected).length === 0) return null
  appliedSemantic = { ...(appliedSemantic || {}), ...injected }
  ensureDarkObserver()
  dispatchThemeChange(dark)
  return injected
}

/**
 * 重置运行时主题：移除全部注入的内联令牌（主色 + 语义色），回到样式表默认值；
 * 默认保留持久化存档，传 { clearStorage: true } 一并清除
 */
export function resetTheme(options = {}) {
  appliedPrimary = null
  appliedSemantic = null
  stopDarkObserver()
  if (typeof document === 'undefined') return
  const prefixes = ['--ev-color-primary', ...SEMANTIC_KEYS.map((k) => `--ev-color-${k}`)]
  for (const prefix of prefixes) {
    for (const suffix of RAMP_TOKEN_NAMES) {
      document.documentElement.style.removeProperty(`${prefix}${suffix}`)
    }
  }
  dispatchThemeChange(isDarkMode())
  if (options.clearStorage) clearThemeConfig()
}

/** 当前运行时主色（未注入过返回 null） */
export function getPrimaryColor() {
  return appliedPrimary
}

// ─── 主题持久化 ───

/** 保存主题配置到 localStorage（SSR / 无 storage 环境静默跳过） */
export function saveThemeConfig(config) {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config ?? {}))
    return true
  } catch {
    return false
  }
}

/** 读取持久化的主题配置；无存档返回 null */
export function loadThemeConfig() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** 清除持久化的主题配置 */
export function clearThemeConfig() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(THEME_STORAGE_KEY)
  } catch {
    /* 忽略 */
  }
}

/** 常用主题色预设（{ name, value }），可直接生成换色选项 */
export const EV_THEME_PRESETS = [
  { name: '湛蓝', value: '#175dff' },
  { name: '翡翠绿', value: '#0fa968' },
  { name: '琥珀橙', value: '#f08c00' },
  { name: '绛红', value: '#f5222d' },
  { name: '紫罗兰', value: '#7b2ff2' },
  { name: '石墨黑', value: '#111827' },
]

const DENSITY_MODES = new Set(['compact', 'default', 'loose'])

/**
 * 全局密度切换：html[data-ev-density]
 * @param {'compact'|'default'|'loose'} mode
 */
/** 全局磨砂开关：html[data-ev-glass]，容器类组件的 is-glass 态据此生效 */
export function setGlass(on) {
  if (typeof document === 'undefined') return false
  if (on) document.documentElement.setAttribute('data-ev-glass', 'on')
  else document.documentElement.removeAttribute('data-ev-glass')
  return true
}

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
