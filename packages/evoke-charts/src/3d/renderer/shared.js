/**
 * 渲染共享件 — 系列归一化 / 饼数据归一化 / tooltip 转义
 * 隐藏系列只隐藏不重排色：色槽跟随原始下标，点选图例不会引起全图换色跳动。
 */
import { UP_COLOR, DOWN_COLOR } from '../types.js'

function seriesName(s, i) {
  if (s && s.name !== undefined && s.name !== null && String(s.name).length) return String(s.name)
  return `系列 ${i + 1}`
}

/**
 * 归一化 series：补名 / 定色 / 标隐藏，剔除隐藏系列
 * @returns {Array<{__index:number, name:string, data:Array, color:string, raw:object}>}
 */
export function normalizeSeries(options, theme, hiddenSeries) {
  const list = Array.isArray(options && options.series) ? options.series : []
  const colors = Array.isArray(theme.colors) && theme.colors.length ? theme.colors : ['#888888']
  const out = []
  for (let i = 0; i < list.length; i++) {
    const s = list[i] && typeof list[i] === 'object' ? list[i] : {}
    const name = seriesName(s, i)
    if (hiddenSeries && hiddenSeries.has(name)) continue
    out.push({
      __index: i,
      name,
      data: Array.isArray(s.data) ? s.data : [],
      color: typeof s.color === 'string' && s.color ? s.color : colors[i % colors.length],
      raw: s,
    })
  }
  return out
}

/** 饼族数据归一化：剔除非法值、补名、定色、算占比 */
export function normalizePie(options, theme, hiddenSeries) {
  const raw = Array.isArray(options && options.pieData) ? options.pieData : []
  const colors = Array.isArray(theme.colors) && theme.colors.length ? theme.colors : ['#888888']
  const items = []
  for (let i = 0; i < raw.length; i++) {
    const d = raw[i] && typeof raw[i] === 'object' ? raw[i] : { value: raw[i] }
    const value = Number(d.value)
    if (!Number.isFinite(value)) continue
    const name = d.name !== undefined && d.name !== null && String(d.name).length ? String(d.name) : `分项 ${i + 1}`
    if (hiddenSeries && hiddenSeries.has(name)) continue
    items.push({
      __index: i,
      name,
      value,
      color: typeof d.color === 'string' && d.color ? d.color : colors[i % colors.length],
      raw: d,
    })
  }
  const total = items.reduce((s, d) => s + Math.abs(d.value), 0)
  for (const d of items) d.percent = total > 0 ? Math.abs(d.value) / total : 0
  return { items, total }
}

/** 曲面矩阵归一化：支持 {x,y,z} 与裸 matrix 两种入参 */
export function normalizeSurface(options) {
  const sd = options && typeof options.surfaceData === 'object' && options.surfaceData
    ? options.surfaceData
    : null
  const matrix = sd && Array.isArray(sd.z)
    ? sd.z
    : Array.isArray(options && options.matrix)
      ? options.matrix
      : []
  const rows = matrix.length
  let cols = 0
  for (const row of matrix) {
    if (Array.isArray(row)) cols = Math.max(cols, row.length)
  }
  const xValues = sd && Array.isArray(sd.x) && sd.x.length === cols
    ? sd.x.map((v) => Number(v))
    : Array.from({ length: cols }, (_, i) => i)
  const yValues = sd && Array.isArray(sd.y) && sd.y.length === rows
    ? sd.y.map((v) => Number(v))
    : Array.from({ length: rows }, (_, i) => i)
  const values = []
  for (const row of matrix) {
    if (!Array.isArray(row)) continue
    for (const v of row) {
      const n = Number(v)
      if (Number.isFinite(n)) values.push(n)
    }
  }
  return { matrix, rows, cols, xValues, yValues, values }
}

/**
 * 纵深增强默认值 — 立体感三件套，0 即关闭
 * haze 景深雾化（远景向背景色混合）/ edge 实体面描边 / gradient 面内渐变（假 AO）
 */
export const DEPTH_DEFAULTS = { haze: 0.3, edge: 0.06, gradient: 0.08 }

/** 解析 depth 配置，缺省即 DEPTH_DEFAULTS，越界钳到 [0,1] */
export function resolveDepth(options) {
  const cfg = options && typeof options.depth === 'object' ? options.depth : {}
  const pick = (v, fallback) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback)
  return {
    haze: pick(cfg.haze, DEPTH_DEFAULTS.haze),
    edge: pick(cfg.edge, DEPTH_DEFAULTS.edge),
    gradient: pick(cfg.gradient, DEPTH_DEFAULTS.gradient),
  }
}

/** HTML 转义 — tooltip 默认模板必须转义，formatter 返回值由使用方自负 */
export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 涨跌语义色（柱体方向着色等场景的共享默认值） */
export { UP_COLOR, DOWN_COLOR }
