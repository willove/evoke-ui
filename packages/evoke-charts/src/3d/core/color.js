/**
 * 颜色工具 — 解析 / 明度调整 / 插值 / 面着色 / 设计令牌读取
 *
 * 面着色走 HSL 明度缩放而非「向白色混合」：混合白色会同时拉低饱和度，
 * 同一根柱子的顶面与侧面容易糊成一片灰；只动明度则色相与饱和度守恒，
 * 深色系色板上也能保住辨识度。
 */

/** 解析 #rgb / #rrggbb / #rrggbbaa / rgb() / rgba() / hsl() 为通道对象；失败返回 null */
export function parseColor(color) {
  if (typeof color !== 'string') return null
  const s = color.trim()
  if (!s) return null

  if (s.charCodeAt(0) === 35 /* # */) {
    const hex = s.slice(1)
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1
      if ([r, g, b].some(Number.isNaN)) return null
      return { r, g, b, a }
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      if ([r, g, b].some(Number.isNaN)) return null
      return { r, g, b, a }
    }
    return null
  }

  const fn = s.match(/^(rgba?|hsla?)\(([^)]+)\)$/i)
  if (!fn) return null
  const parts = fn[2].split(/[,\s/]+/).filter(Boolean)
  if (parts.length < 3) return null
  const nums = parts.map((p) => (p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p)))
  if (nums.slice(0, 3).some((n) => !Number.isFinite(n))) return null
  const alpha = parts.length > 3 ? clamp01(Number.isFinite(nums[3]) ? nums[3] : 1) : 1

  if (fn[1].toLowerCase().startsWith('hsl')) {
    // hslToRgb 约定 hue 为角度制（0–360），这里不再除 360
    const rgb = hslToRgb(nums[0], clamp01(nums[1]), clamp01(nums[2]))
    return { ...rgb, a: alpha }
  }
  return {
    r: clampByte(nums[0]),
    g: clampByte(nums[1]),
    b: clampByte(nums[2]),
    a: alpha,
  }
}

function clampByte(v) {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(255, Math.round(v)))
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function rgbToHex(r, g, b) {
  const to = (v) => clampByte(v).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

/** 转为带透明度的 rgba() 字符串；无法解析时原样返回，避免画布拿到非法 fillStyle */
export function toRgba(color, alpha = 1) {
  const c = parseColor(color)
  if (!c) return color
  return `rgba(${c.r},${c.g},${c.b},${clamp01(alpha) * c.a})`
}

export function rgbToHsl(r, g, b) {
  const rn = clampByte(r) / 255
  const gn = clampByte(g) / 255
  const bn = clampByte(b) / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d < 1e-9) return { h: 0, s: 0, l }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return { h: h * 360, s, l }
}

export function hslToRgb(h, s, l) {
  const hh = (((h % 360) + 360) % 360) / 360
  const ss = clamp01(s)
  const ll = clamp01(l)
  if (ss < 1e-9) {
    const v = clampByte(ll * 255)
    return { r: v, g: v, b: v }
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
  const p = 2 * ll - q
  const channel = (t) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  return {
    r: clampByte(channel(hh + 1 / 3) * 255),
    g: clampByte(channel(hh) * 255),
    b: clampByte(channel(hh - 1 / 3) * 255),
  }
}

/**
 * 明度缩放：factor > 1 提亮、< 1 压暗，色相与饱和度守恒
 * 结果明度钳制在 [0.06, 0.94]，防止出现纯黑面或纯白面导致形体感丢失
 */
export function adjustLightness(color, factor) {
  const c = parseColor(color)
  if (!c) return color
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b)
  const next = Math.max(0.06, Math.min(0.94, l * (Number.isFinite(factor) ? factor : 1)))
  const rgb = hslToRgb(h, s, next)
  if (c.a < 1) return toRgba(rgbToHex(rgb.r, rgb.g, rgb.b), c.a)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

/** 线性混合：t=0 取 a，t=1 取 b */
export function mixColor(a, b, t) {
  const ca = parseColor(a)
  const cb = parseColor(b)
  if (!ca) return b
  if (!cb) return a
  const k = clamp01(t)
  return rgbToHex(
    ca.r + (cb.r - ca.r) * k,
    ca.g + (cb.g - ca.g) * k,
    ca.b + (cb.b - ca.b) * k,
  )
}

/**
 * 向目标色混色相但保留自身透明度 — 雾化专用：
 * 墙面这类半透明薄纱只换色相，不会因为混入不透明的背景色而变实。
 */
export function mixHue(color, target, t) {
  const c = parseColor(color)
  const g = parseColor(target)
  if (!c || !g) return color
  const k = clamp01(t)
  const hex = rgbToHex(
    c.r + (g.r - c.r) * k,
    c.g + (g.g - c.g) * k,
    c.b + (g.b - c.b) * k,
  )
  return c.a < 1 ? toRgba(hex, c.a) : hex
}

export function lighten(color, amount) {
  return adjustLightness(color, 1 + clamp01(amount))
}

export function darken(color, amount) {
  return adjustLightness(color, 1 - clamp01(amount))
}

/** 相对亮度（WCAG 公式，含 sRGB 反伽马），用于对比度判定 */
export function luminance(color) {
  const c = parseColor(color)
  if (!c) return 1
  const lin = (v) => {
    const n = v / 255
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
}

export function isLightColor(color) {
  return luminance(color) > 0.45
}

/** 在给定底色上选一个可读的文字色 */
export function contrastText(bg) {
  return isLightColor(bg) ? '#111827' : '#ffffff'
}

/**
 * 面着色 — 兰伯特余弦驱动明度缩放
 * lambert 为法线与光线的点积（已由调用方归一）。
 * ambient 是暗面下限，intensity 是明暗落差；两者共同决定形体的立体感强度。
 */
export function shadeColor(color, lambert, options = {}) {
  const ambient = Number.isFinite(options.ambient) ? options.ambient : 0.58
  const intensity = Number.isFinite(options.intensity) ? options.intensity : 0.82
  const t = clamp01((lambert + 1) / 2)
  return adjustLightness(color, ambient + intensity * t)
}

/** 多色阶取样：colors 为色带、t ∈ [0,1]，用于曲面高度映射 */
export function gradientAt(colors, t) {
  if (!Array.isArray(colors) || !colors.length) return '#888888'
  if (colors.length === 1) return colors[0]
  const k = clamp01(t)
  const pos = k * (colors.length - 1)
  const i = Math.min(colors.length - 2, Math.floor(pos))
  return mixColor(colors[i], colors[i + 1], pos - i)
}

/**
 * 读取设计令牌 — 与 evoke 生态共用 --ev-* 命名空间，换肤自动跟随
 * 无 DOM（SSR / 无头测试）时直接回落，绝不抛错
 */
export function readToken(name, fallback) {
  try {
    if (typeof document === 'undefined' || !document.documentElement) return fallback
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || fallback
  } catch {
    return fallback
  }
}

/** 判断当前是否暗色主题 — 与 evoke 生态一致，以 html.dark 为准 */
export function isDarkMode() {
  try {
    if (typeof document === 'undefined' || !document.documentElement) return false
    return document.documentElement.classList.contains('dark')
  } catch {
    return false
  }
}
