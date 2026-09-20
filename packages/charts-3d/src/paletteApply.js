/**
 * 色系注入 — 把色系写到文档根令牌上，二/三维图一起换装
 * API 形状与 evoke-charts 的 applySeriesPalette 完全一致，可无缝替换调用。
 */
import { CHART3D_PALETTES } from './palette.js'

export const SLOT_COUNT = 8
export const PALETTE_EVENT = 'ev-theme-change'
export const STYLE_ID = 'data-charts-3d-palette'

function dispatchPaletteEvent(dark) {
  try {
    if (typeof document === 'undefined' || !document.documentElement) return
    document.documentElement.dispatchEvent(
      new CustomEvent(PALETTE_EVENT, { bubbles: true, detail: { dark: !!dark } }),
    )
  } catch {
    /* 无 DOM 环境（SSR / 无头测试）静默跳过 */
  }
}

function rootTarget(target) {
  if (target) return target
  if (typeof document === 'undefined' || !document.documentElement) return null
  return document.documentElement
}

/**
 * 应用色系
 * @param {string|string[]|{light:string[],dark:string[]}} palette 色系 id / 显式色值数组 / 明暗两套
 * @param {{target?:Element, isDark?:boolean}} options
 * @returns {boolean} 是否有实际写入
 */
export function applySeriesPalette(palette, options = {}) {
  if (!palette) return false
  const target = rootTarget(options.target)
  if (!target) return false

  // 数组：直写内联令牌（明暗跟随宿主换肤由调用方自理）
  if (Array.isArray(palette)) {
    for (let i = 0; i < SLOT_COUNT; i++) {
      target.style.setProperty(`--ev-color-series-${i + 1}`, palette[i] || palette[palette.length - 1] || '')
    }
    dispatchPaletteEvent(options.isDark)
    return true
  }

  // 字符串：按 id 取内置色系
  if (typeof palette === 'string') {
    const found = CHART3D_PALETTES.find((p) => p.id === palette)
    if (!found) return false
    return applySeriesPalette(options.isDark ? found.dark : found.light, options)
  }

  // {light, dark}：注入样式表规则，换肤时由 dark 类自动切换
  if (typeof palette === 'object' && Array.isArray(palette.light) && Array.isArray(palette.dark)) {
    clearSeriesPalette({ target })
    const style = document.createElement('style')
    style.setAttribute(STYLE_ID, '')
    const slots = (colors) => colors
      .slice(0, SLOT_COUNT)
      .map((c, i) => `--ev-color-series-${i + 1}:${c};`)
      .join('')
    style.textContent = `:root{${slots(palette.light)}}html.dark{${slots(palette.dark)}}`
    document.head.appendChild(style)
    dispatchPaletteEvent(options.isDark)
    return true
  }
  return false
}

/** 移除注入的色系，恢复令牌默认 */
export function clearSeriesPalette(options = {}) {
  const target = rootTarget(options.target)
  let removed = false
  if (typeof document !== 'undefined' && document.head) {
    const injected = document.head.querySelector(`style[${STYLE_ID}]`)
    if (injected) {
      injected.remove()
      removed = true
    }
  }
  if (target) {
    for (let i = 0; i < SLOT_COUNT; i++) {
      target.style.removeProperty(`--ev-color-series-${i + 1}`)
    }
  }
  dispatchPaletteEvent(options.isDark)
  return removed
}
