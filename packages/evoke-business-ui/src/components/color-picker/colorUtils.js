/**
 * 颜色工具 — 内部以 HSV 表示，支持 hex / rgb / hsl 输入输出
 */

/** clamp 到 [0, 1] */
function clamp01(v) {
  return Math.min(1, Math.max(0, v))
}

/** HSV(h:0-360, s:0-1, v:0-1) → {r,g,b} 0-255 */
export function hsvToRgb(h, s, v) {
  const c = v * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = v - c
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

/** {r,g,b} 0-255 → HSV h:0-360, s:0-1, v:0-1 */
export function rgbToHsv(r, g, b) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function rgbToHex(r, g, b) {
  const hex = (n) => n.toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/** rgb → hsl (h:0-360, s/l:0-100) */
export function rgbToHsl(r, g, b) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let s = 0
  let h = 0
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === rn) h = (((gn - bn) / d) % 6) * 60
    else if (max === gn) h = ((bn - rn) / d + 2) * 60
    else h = ((rn - gn) / d + 4) * 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

/**
 * 解析颜色字符串 → {h, s, v, a}；解析失败返回 null
 * 支持 #rgb / #rrggbb / #rrggbbaa / rgb() / rgba()；空串返回 null（留空由调用方决定）
 */
export function parseColor(str) {
  if (typeof str !== 'string') return null
  const s = str.trim().toLowerCase()
  if (!s) return null

  let m = s.match(/^#([0-9a-f]{3})$/)
  if (m) {
    const [r, g, b] = m[1].split('').map((c) => parseInt(c + c, 16))
    return { ...rgbToHsv(r, g, b), a: 1 }
  }
  m = s.match(/^#([0-9a-f]{6})$/)
  if (m) {
    const n = parseInt(m[1], 16)
    return { ...rgbToHsv((n >> 16) & 255, (n >> 8) & 255, n & 255), a: 1 }
  }
  m = s.match(/^#([0-9a-f]{8})$/)
  if (m) {
    const n = parseInt(m[1], 16)
    return {
      ...rgbToHsv((n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255),
      a: Math.round(((n & 255) / 255) * 100) / 100,
    }
  }
  m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/)
  if (m) {
    return {
      ...rgbToHsv(Number(m[1]), Number(m[2]), Number(m[3])),
      a: m[4] !== undefined ? clamp01(Number(m[4])) : 1,
    }
  }
  return null
}

/** {h,s,v,a} → 按 format 输出字符串 */
export function formatColor({ h, s, v, a }, format = 'hex') {
  const { r, g, b } = hsvToRgb(h, s, v)
  const alpha = clamp01(a ?? 1)
  switch (format) {
    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`
    case 'rgba':
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    case 'hsl': {
      const hsl = rgbToHsl(r, g, b)
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    }
    case 'hsla': {
      const hsl = rgbToHsl(r, g, b)
      return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`
    }
    case 'hexa':
      return `${rgbToHex(r, g, b)}${alpha < 1 ? Math.round(alpha * 255).toString(16).padStart(2, '0') : ''}`
    case 'hex':
    default:
      return rgbToHex(r, g, b)
  }
}

/** {h,s,v,a} → css 颜色（带透明度时自动 rgba），用于面板背景 */
export function toCssColor(hsv) {
  return formatColor(hsv, (hsv.a ?? 1) < 1 ? 'rgba' : 'hex')
}

/** 默认空色：白色（无色相） */
export function emptyColor() {
  return { h: 0, s: 0, v: 1, a: 1 }
}
