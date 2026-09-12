/**
 * 配色方案应用工具 — 中性契约的官方实现
 *
 * 把一套数据色板写入 --ev-color-series-1..8 槽位令牌并派发 'ev-theme-change'，
 * 页面上的全部图表即时重绘。任何宿主（组件库 / 站点 / 独立页面）都可直接调用，
 * 不必各自实现令牌写入与事件广播。
 *
 * palette 两种形态：
 * - string[]            单套色值，明暗模式共用；
 * - { light, dark }     浅/暗两组，随 html.dark 自动换挡（经注入样式表实现）。
 *
 * clearSeriesPalette() 移除覆写（内联属性 + 注入样式表），回到内置成套色板。
 */
const SLOT_COUNT = 8
const PALETTE_EVENT = 'ev-theme-change'
const STYLE_ID = 'data-ev-series-palette'

let paletteStyleEl = null

function dispatchPaletteChange(dark) {
  if (typeof document === 'undefined') return
  const isDark = typeof dark === 'boolean' ? dark : document.documentElement.classList.contains('dark')
  document.documentElement.dispatchEvent(
    new CustomEvent(PALETTE_EVENT, { bubbles: true, detail: { dark: isDark } }),
  )
}

function removeInlineSlots() {
  if (typeof document === 'undefined') return
  for (let i = 1; i <= SLOT_COUNT; i++) {
    document.documentElement.style.removeProperty(`--ev-color-series-${i}`)
  }
}

function ensurePaletteStyleEl() {
  if (typeof document === 'undefined') return null
  if (!paletteStyleEl || !paletteStyleEl.isConnected) {
    paletteStyleEl = document.createElement('style')
    paletteStyleEl.setAttribute(STYLE_ID, '')
    document.head.appendChild(paletteStyleEl)
  }
  return paletteStyleEl
}

function normalizeSlots(colors) {
  const out = {}
  if (!Array.isArray(colors)) return out
  colors.slice(0, SLOT_COUNT).forEach((color, i) => {
    if (color) out[`--ev-color-series-${i + 1}`] = color
  })
  return out
}

/**
 * 应用一套数据色板
 * @param {string[] | { light: string[], dark: string[] }} palette
 *   数组：写入内联槽位（明暗共用）；{ light, dark }：注入样式表，随 html.dark 自动换挡
 * @param {{ dark?: boolean, target?: HTMLElement }} [options]
 *   dark 手动指定当前暗色态（默认探测 html.dark）；target 改写注入目标
 * @returns {boolean} 是否写入成功
 */
export function applySeriesPalette(palette, options = {}) {
  if (typeof document === 'undefined') return false
  const el = options.target ?? document.documentElement
  if (!el || !palette) return false

  if (Array.isArray(palette)) {
    paletteStyleEl?.remove()
    paletteStyleEl = null
    for (const [name, value] of Object.entries(normalizeSlots(palette))) {
      el.style.setProperty(name, value)
    }
    dispatchPaletteChange(options.dark)
    return true
  }

  const { light, dark } = palette
  if (!Array.isArray(light) && !Array.isArray(dark)) return false
  removeInlineSlots()
  const styleEl = ensurePaletteStyleEl()
  if (styleEl) {
    const vars = (colors) => colors.map((c, i) => `--ev-color-series-${i + 1}: ${c}`).join(';')
    styleEl.textContent = `${light ? `:root { ${vars(light)}; }` : ''}${dark ? ` html.dark { ${vars(dark)}; }` : ''}`
  }
  dispatchPaletteChange(options.dark)
  return true
}

/**
 * 清除配色方案覆写（内联槽位 + 注入样式表），回到内置成套色板
 */
export function clearSeriesPalette(options = {}) {
  if (typeof document === 'undefined') return false
  paletteStyleEl?.remove()
  paletteStyleEl = null
  removeInlineSlots()
  dispatchPaletteChange(options.dark)
  return true
}
