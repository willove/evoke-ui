/**
 * 颜色基元 — TypeScript 模块
 *
 * 约定：类型只存在于源码层，esbuild 编译后产物仍是纯 JS。
 */

/** 十六进制色：#RGB / #RRGGBB / #RRGGBBAA */
export type HexColor = string

export interface Rgb {
  r: number
  g: number
  b: number
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/** 规范化为 #RRGGBB；非法输入返回 null */
export function normalizeHex(hex: unknown): HexColor | null {
  if (typeof hex !== 'string') return null
  let h = hex.trim()
  if (!HEX_RE.test(h)) return null
  h = h.slice(1)
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  else if (h.length === 8) h = h.slice(0, 6)
  return '#' + h.toLowerCase()
}

export function hexToRgb(hex: HexColor): Rgb | null {
  const n = normalizeHex(hex)
  if (!n) return null
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): HexColor {
  const clamp = (v: number) => Math.round(Math.min(255, Math.max(0, v)))
  const c = (v: number) => clamp(v).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** sRGB 线性混合：t = 0 → a，t = 1 → b */
export function mixHex(a: HexColor, b: HexColor, t: number): HexColor | null {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  if (!ca || !cb) return null
  return rgbToHex(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t,
  )
}
