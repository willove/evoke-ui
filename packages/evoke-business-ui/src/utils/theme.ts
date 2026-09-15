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
 * - 换色会派发全局 'eb-theme-change' 与 'ev-theme-change'（图表库读取面）事件，
 *   detail 均携带 { dark }；图表组件监听后者重绘，色板随即跟随新主色。
 * - 持久化：saveThemeConfig / loadThemeConfig / clearThemeConfig，
 *   存取 localStorage 'eb-theme-config'（{ primary, semantic }）。
 * - 颜色基元实现在 utils/color.ts（TS 试点模块）。
 */
import { normalizeHex, hexToRgb, rgbToHex, mixHex } from './color'
import type { HexColor } from './color'

export { normalizeHex, hexToRgb, rgbToHex, mixHex }

export type SemanticColorKey = 'success' | 'warning' | 'danger' | 'info'

/** 持久化主题配置（localStorage 'eb-theme-config' 的结构） */
export interface EbThemeConfig {
  primary?: string
  semantic?: Partial<Record<SemanticColorKey, string>>
}

export interface ThemeRampOptions {
  /** 缺省自动探测 html.dark */
  dark?: boolean
  /** 默认主色令牌前缀，语义色传 '--eb-color-success' 等 */
  prefix?: string
}

interface RuntimeThemeOptions extends ThemeRampOptions {
  target?: HTMLElement
}

export interface EbThemePreset {
  name: string
  value: string
}

const RAMP_LIGHT_STEPS: Array<[string, number]> = [
  ['light-3', 0.3],
  ['light-5', 0.5],
  ['light-7', 0.7],
  ['light-8', 0.8],
  ['light-9', 0.9],
]
const RAMP_DARK_STEPS: Array<[string, number]> = [['dark-2', 0.2]]

const THEME_CHANGE_EVENT = 'eb-theme-change'
// 外接图表库（evoke-charts）监听的令牌变更事件，换色时一并派发
const CHART_THEME_CHANGE_EVENT = 'ev-theme-change'
export const THEME_STORAGE_KEY = 'eb-theme-config'

function isDarkMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

/** 归一化第二参数：兼容旧签名 setPrimaryColor(hex, targetElement) */
function normalizeOptions(options?: RuntimeThemeOptions | HTMLElement | null): RuntimeThemeOptions {
  if (options == null) return {}
  if (typeof options === 'object' && 'nodeType' in options) return { target: options }
  return options
}

/**
 * 生成任意颜色的完整梯度（8 令牌）
 * @param hex 基色（非法输入返回 null）
 */
export function generateColorRamp(
  hex: unknown,
  options: ThemeRampOptions = {},
): Record<string, string> | null {
  const base = normalizeHex(hex)
  if (!base) return null
  const dark = typeof options.dark === 'boolean' ? options.dark : isDarkMode()
  const prefix = options.prefix ?? '--eb-color-primary'
  const { r, g, b } = hexToRgb(base)!
  const ramp: Record<string, string> = {
    [`${prefix}`]: base,
    [`${prefix}-rgb`]: `${r}, ${g}, ${b}`,
  }
  // 亮色：light-N 趋白 / dark-2 趋黑；暗色：反向（与 dark.css 手调梯度同向）
  const toward = dark ? '#000000' : '#ffffff'
  const away = dark ? '#ffffff' : '#000000'
  for (const [name, t] of RAMP_LIGHT_STEPS) {
    ramp[`${prefix}-${name}`] = mixHex(base, toward, t)!
  }
  for (const [name, t] of RAMP_DARK_STEPS) {
    ramp[`${prefix}-${name}`] = mixHex(base, away, t)!
  }
  return ramp
}

/**
 * 生成主色完整梯度（兼容入口，等同 generateColorRamp(hex, options)）
 */
export function generatePrimaryRamp(hex: unknown, options?: ThemeRampOptions) {
  return generateColorRamp(hex, options)
}

// ─── 运行时注入状态（暗色自适应跟随用） ───
let appliedPrimary: HexColor | null = null
let appliedSemantic: Partial<Record<SemanticColorKey, string>> | null = null
let appliedSeries: Record<number, string> | null = null
let darkObserver: MutationObserver | null = null
let lastDark = false

const SEMANTIC_KEYS: SemanticColorKey[] = ['success', 'warning', 'danger', 'info']
const RAMP_TOKEN_NAMES = ['', '-rgb', '-light-3', '-light-5', '-light-7', '-light-8', '-light-9', '-dark-2']

function injectRamp(ramp: Record<string, string> | null | undefined, target?: HTMLElement | null): void {
  const el = target ?? (typeof document !== 'undefined' ? document.documentElement : null)
  if (!el || !ramp) return
  for (const [name, value] of Object.entries(ramp)) {
    el.style.setProperty(name, value)
  }
}

function dispatchThemeChange(dark: boolean): void {
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
function ensureDarkObserver(): void {
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
        if (hex) injectRamp(generateColorRamp(hex, { dark, prefix: `--eb-color-${key}` }), document.documentElement)
      }
    }
    dispatchThemeChange(dark)
  })
  darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

function stopDarkObserver(): void {
  darkObserver?.disconnect()
  darkObserver = null
}

/**
 * 运行时换主色：一条语句完成全部 7 档梯度 + rgb 三元组注入；
 * 暗色模式下梯度自动反向，且后续 html.dark 切换会跟随重注入
 * @param options 兼容旧签名直接传 HTMLElement（视为 target）
 * @returns 实际注入的令牌表（非法输入返回 null）
 */
export function setPrimaryColor(
  hex: string,
  options?: RuntimeThemeOptions | HTMLElement | null,
): Record<string, string> | null {
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
 */
export function setSemanticColors(
  colors: Partial<Record<SemanticColorKey, string>> | null | undefined,
  options?: RuntimeThemeOptions | HTMLElement | null,
): Partial<Record<SemanticColorKey, string>> | null {
  if (!colors || typeof colors !== 'object') return null
  const opts = normalizeOptions(options)
  const dark = typeof opts.dark === 'boolean' ? opts.dark : isDarkMode()
  const injected: Partial<Record<SemanticColorKey, string>> = {}
  for (const key of SEMANTIC_KEYS) {
    const ramp = generateColorRamp(colors[key], { dark, prefix: `--eb-color-${key}` })
    if (!ramp) continue
    injectRamp(ramp, opts.target)
    injected[key] = normalizeHex(colors[key])!
  }
  if (Object.keys(injected).length === 0) return null
  appliedSemantic = { ...(appliedSemantic || {}), ...injected }
  ensureDarkObserver()
  dispatchThemeChange(dark)
  return injected
}

/**
 * 图表系列色板（--ev-color-series-1..8）：evoke-charts 按槽读取的专用数据色板，
 * 与状态语义色解耦。colors 传 ≤8 色数组（逐槽应用，未提供的槽保留默认）；
 * 空数组 / null 走 clearSeriesPalette。换色后派发 'ev-theme-change'（图表重绘）。
 */
export function setSeriesPalette(
  colors: (string | undefined | null)[] | null | undefined,
  options?: RuntimeThemeOptions | HTMLElement | null,
): Record<number, string> | null {
  const opts = normalizeOptions(options)
  const el = opts.target ?? (typeof document !== 'undefined' ? document.documentElement : null)
  if (!el || !Array.isArray(colors)) return null
  const injected: Record<number, string> = {}
  colors.slice(0, 8).forEach((hex, i) => {
    const base = normalizeHex(hex)
    if (!base) return
    el.style.setProperty(`--ev-color-series-${i + 1}`, base)
    injected[i + 1] = base
  })
  if (Object.keys(injected).length === 0) return null
  appliedSeries = { ...(appliedSeries || {}), ...injected }
  const dark = typeof opts.dark === 'boolean' ? opts.dark : isDarkMode()
  dispatchThemeChange(dark)
  return injected
}

/**
 * 清除图表系列色板，回到 evoke-charts 内置成套色板
 */
export function clearSeriesPalette(options?: RuntimeThemeOptions | HTMLElement | null): void {
  const opts = normalizeOptions(options)
  const el = opts.target ?? (typeof document !== 'undefined' ? document.documentElement : null)
  if (!el || typeof el.style === 'undefined') return
  for (let i = 1; i <= 8; i++) el.style.removeProperty(`--ev-color-series-${i}`)
  appliedSeries = null
  dispatchThemeChange(isDarkMode())
}

/** 当前运行时图表系列色板（未注入过返回 null） */
export function getSeriesPalette(): Record<number, string> | null {
  return appliedSeries
}

/**
 * 重置运行时主题：移除全部注入的内联令牌（主色 + 语义色），回到样式表默认值；
 * 默认保留持久化存档，传 { clearStorage: true } 一并清除
 */
export function resetTheme(options: { clearStorage?: boolean } = {}): void {
  appliedPrimary = null
  appliedSemantic = null
  appliedSeries = null
  stopDarkObserver()
  if (typeof document === 'undefined') return
  const prefixes = ['--eb-color-primary', ...SEMANTIC_KEYS.map((k) => `--eb-color-${k}`)]
  for (const prefix of prefixes) {
    for (const suffix of RAMP_TOKEN_NAMES) {
      document.documentElement.style.removeProperty(`${prefix}${suffix}`)
    }
  }
  for (let i = 1; i <= 8; i++) {
    document.documentElement.style.removeProperty(`--ev-color-series-${i}`)
  }
  dispatchThemeChange(isDarkMode())
  if (options.clearStorage) clearThemeConfig()
}

/** 当前运行时主色（未注入过返回 null） */
export function getPrimaryColor(): string | null {
  return appliedPrimary
}

// ─── 主题持久化 ───

/** 保存主题配置到 localStorage（SSR / 无 storage 环境静默跳过） */
export function saveThemeConfig(config?: EbThemeConfig | null): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config ?? {}))
    return true
  } catch {
    return false
  }
}

/** 读取持久化的主题配置；无存档返回 null */
export function loadThemeConfig(): EbThemeConfig | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as EbThemeConfig) : null
  } catch {
    return null
  }
}

/** 清除持久化的主题配置 */
export function clearThemeConfig(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(THEME_STORAGE_KEY)
  } catch {
    /* 忽略 */
  }
}

/** 常用主题色预设，可直接生成换色选项 */
export const EB_THEME_PRESETS: EbThemePreset[] = [
  { name: '湛蓝', value: '#175dff' },
  { name: '翡翠绿', value: '#0fa968' },
  { name: '琥珀橙', value: '#f08c00' },
  { name: '绛红', value: '#f5222d' },
  { name: '紫罗兰', value: '#7b2ff2' },
  { name: '石墨黑', value: '#111827' },
]

const DENSITY_MODES = new Set(['compact', 'default', 'loose'])

export type DensityMode = 'compact' | 'default' | 'loose'

/** 全局磨砂开关：html[data-eb-glass]，容器类组件的 is-glass 态据此生效 */
export function setGlass(on: boolean): boolean {
  if (typeof document === 'undefined') return false
  if (on) document.documentElement.setAttribute('data-eb-glass', 'on')
  else document.documentElement.removeAttribute('data-eb-glass')
  return true
}

/** 全局密度切换：html[data-eb-density] */
export function setDensity(mode: DensityMode): boolean {
  if (!DENSITY_MODES.has(mode)) return false
  if (typeof document === 'undefined') return false
  if (mode === 'default') document.documentElement.removeAttribute('data-eb-density')
  else document.documentElement.setAttribute('data-eb-density', mode)
  return true
}

export function getDensity(): DensityMode {
  if (typeof document === 'undefined') return 'default'
  return (document.documentElement.getAttribute('data-eb-density') as DensityMode) || 'default'
}

/** 全局激活涟漪开关：html[data-eb-ripple]，关闭后所有输入类组件聚焦不再播放涟漪。
 *  组件级 :ripple="false" / Form 级 :ripple="false" 可局部关闭 */
export function setRipple(enabled: boolean): boolean {
  if (typeof document === 'undefined') return false
  if (enabled) document.documentElement.removeAttribute('data-eb-ripple')
  else document.documentElement.setAttribute('data-eb-ripple', 'off')
  return true
}

export function getRipple(): boolean {
  if (typeof document === 'undefined') return true
  return document.documentElement.getAttribute('data-eb-ripple') !== 'off'
}
