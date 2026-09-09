/**
 * 颜色工具 — 主色淡色阶生成（element 系约定：light-N = 向白混合 N/10，dark-2 = 向黑混 20%）
 */

export function hexToRgb(hex) {
  let value = String(hex || '').replace('#', '').trim()
  if (value.length === 3) {
    value = value.split('').map((c) => c + c).join('')
  }
  const num = parseInt(value, 16)
  if (!Number.isFinite(num) || value.length !== 6) return null
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

export function rgbToHex(r, g, b) {
  const to = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

/** 从 from 向 to 混合比例 t（0~1） */
export function mixHex(from, to, t) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  if (!a || !b) return from
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  )
}

const WHITE = '#ffffff'
const BLACK = '#000000'

/**
 * 生成主色淡色阶（与 variables.css 默认 #0D70FF 的手工色阶同构）：
 * { light3, light5, light7, light8, light9, dark2, rgb: 'r, g, b' }
 */
export function generatePrimaryRamp(primary) {
  const rgb = hexToRgb(primary)
  if (!rgb) return null
  return {
    base: primary,
    light3: mixHex(primary, WHITE, 0.3),
    light5: mixHex(primary, WHITE, 0.5),
    light7: mixHex(primary, WHITE, 0.7),
    light8: mixHex(primary, WHITE, 0.8),
    light9: mixHex(primary, WHITE, 0.9),
    dark2: mixHex(primary, BLACK, 0.2),
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
  }
}
