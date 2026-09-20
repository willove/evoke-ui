/**
 * 三维色带注册表 — 曲面 / 色标散点的高度映射色带
 *
 * 系列色系（7 套）直接复用 evoke-charts 主体系的注册表（../palettes.js）：
 * 同 id 同色值、同一处维护，二维与三维并排必然一致。本文件只保留三维独有的
 * 连续色带（低→高）与解析函数。
 */
import { CHART_PALETTES, resolveChartPalette } from '../palettes.js'

/** 系列色系 = 主体系注册表（别名导出，三维内部引用不动） */
export const CHART3D_PALETTES = CHART_PALETTES
export const CHART3D_PALETTE_IDS = CHART_PALETTES.map((p) => p.id)
export { resolveChartPalette }

/** 曲面高度映射色带 — 每套色系配一条低→高的连续色带，供 surface3d 取样 */
export const CHART3D_RAMPS = {
  classic: { light: ['#e8f0ff', '#8ab0ff', '#4d86ff', '#175DFF', '#00329b'], dark: ['#12244d', '#26417f', '#4d8bff', '#9ec2ff', '#e5eeff'] },
  aurora: { light: ['#dbeafe', '#93c5fd', '#38bdf8', '#10b981', '#047857'], dark: ['#0b2545', '#155e75', '#0ea5e9', '#34d399', '#d1fae5'] },
  sunset: { light: ['#fff7ed', '#fdba74', '#f97316', '#e11d48', '#881337'], dark: ['#3b1109', '#9a3412', '#f97316', '#fb7185', '#ffe4e6'] },
  viridis: { light: ['#440154', '#31688e', '#35b779', '#fde725'], dark: ['#440154', '#31688e', '#35b779', '#fde725'] },
  heat: { light: ['#fff5eb', '#fdd0a2', '#fd8d3c', '#d94801', '#7f2704'], dark: ['#2b0f00', '#8c2d04', '#d94801', '#fdd0a2', '#fff5eb'] },
  mono: { light: ['#f3f4f6', '#9ca3af', '#4b5563', '#111827'], dark: ['#111827', '#4b5563', '#9ca3af', '#f3f4f6'] },
}

/** 按 id 取曲面色带；未指定时随色系联动，未知 id 返回 null */
export function resolveChartRamp(id, isDark) {
  const ramp = CHART3D_RAMPS[id]
  if (!ramp) return null
  return (isDark ? ramp.dark : ramp.light).slice()
}
