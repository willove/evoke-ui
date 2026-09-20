/**
 * 数据补间 — 结构不变、仅数值变化时逐帧插值，避免整图重放进场动画
 *
 * 覆盖四种数据形态：series[].data、pieData[].value、scatterData 三元组、surfaceData.z（或 matrix）。
 * 结构（图型 / 类目 / 系列名 / 数组形状）任何一处变了就不再补间，返回 null 由调用方回退到进场动画。
 * 补间按类目序错峰（stagger > 0 时），与进场动画的错峰同向，数据更新看起来是一道波推过去。
 */
import { staggerProgress } from '../../motion.js'

/** 取数值（非有限值记 null，插值时空缺侧原样保留） */
function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function mapDeep(matrix) {
  return Array.isArray(matrix) ? matrix.map((row) => (Array.isArray(row) ? row.map(toNum) : [])) : null
}

/** 数据快照 — 只留参与补间的数值字段，避免把 options 整棵拷下来 */
export function captureChart3dData(options) {
  const o = options && typeof options === 'object' ? options : {}
  const sd = o.surfaceData && typeof o.surfaceData === 'object' ? o.surfaceData : null
  return {
    type: o.type,
    labels: Array.isArray(o.labels) ? o.labels.map(String) : [],
    series: (Array.isArray(o.series) ? o.series : []).map((s) => ({
      name: s && s.name !== undefined ? String(s.name) : '',
      data: Array.isArray(s && s.data) ? s.data.map(toNum) : [],
    })),
    pieData: (Array.isArray(o.pieData) ? o.pieData : []).map((d) => ({
      name: d && d.name !== undefined ? String(d.name) : '',
      value: toNum(d && d.value),
    })),
    scatter: Array.isArray(o.scatterData) ? o.scatterData.map((p) => (Array.isArray(p) ? p.map(toNum) : [toNum(p)])) : null,
    surface: sd ? mapDeep(sd.z) : mapDeep(o.matrix),
    surfaceKey: Array.isArray(sd && sd.z) ? 'surfaceData' : Array.isArray(o.matrix) ? 'matrix' : null,
  }
}

function sameList(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/** 二维矩阵只比形状（数值可以不同，正是补间要抹平的差异） */
function sameDims(a, b) {
  if (a === null || b === null) return a === b
  if (a.length !== b.length) return false
  return a.every((row, i) => Array.isArray(row) && Array.isArray(b[i]) && row.length === b[i].length)
}

/** 结构是否一致（一致才允许补间） */
export function sameChart3dShape(a, b) {
  if (!a || !b || a.type !== b.type) return false
  if (!sameList(a.labels, b.labels)) return false
  if (a.series.length !== b.series.length) return false
  if (!a.series.every((s, i) => s.name === b.series[i].name && s.data.length === b.series[i].data.length)) return false
  if (a.pieData.length !== b.pieData.length) return false
  if (!a.pieData.every((d, i) => d.name === b.pieData[i].name)) return false
  const sa = a.scatter
  const sb = b.scatter
  if ((sa === null) !== (sb === null)) return false
  if (sa && sb && (sa.length !== sb.length || !sa.every((p, i) => p.length === sb[i].length))) return false
  return a.surfaceKey === b.surfaceKey && sameDims(a.surface, b.surface)
}

function lerp(from, to, t) {
  if (from === null || to === null) return to
  return from + (to - from) * t
}

/**
 * 逐帧插值出「中间态 options」——以目标 options 为骨架，只替换数值字段
 * @param {object} from captureChart3dData 的快照
 * @param {object} to 目标 options（props.options）
 * @param {number} progress 全局进度（0..1，通常已按 easing 缓动过）
 * @param {number} stagger 错峰占比（沿类目序）
 */
export function interpolateChart3dOptions(from, to, progress, stagger = 0) {
  if (!sameChart3dShape(from, captureChart3dData(to))) return null
  const cols = Math.max(1, from.labels.length)
  const itemT = (i) => staggerProgress(progress, i, cols, stagger)

  const out = { ...to }
  if (Array.isArray(to.series)) {
    out.series = to.series.map((s, si) => {
      const old = from.series[si]
      return {
        ...s,
        data: (Array.isArray(s.data) ? s.data : []).map((v, i) => lerp(old.data[i], toNum(v), itemT(i))),
      }
    })
  }
  if (Array.isArray(to.pieData)) {
    out.pieData = to.pieData.map((d, i) => {
      const old = from.pieData[i]
      return { ...d, value: lerp(old.value, toNum(d && d.value), itemT(i)) }
    })
  }
  if (Array.isArray(to.scatterData) && from.scatter) {
    out.scatterData = to.scatterData.map((p, i) => {
      const old = from.scatter[i]
      const t = itemT(i)
      return (Array.isArray(p) ? p : [p]).map((v, k) => lerp(old[k], toNum(v), t))
    })
  }
  if (from.surface && from.surfaceKey) {
    const target = from.surfaceKey === 'surfaceData' ? to.surfaceData : to.matrix
    const z = (Array.isArray(target && target.z) ? target.z : Array.isArray(target) ? target : []).map((row, r) => {
      const oldRow = from.surface[r] || []
      const t = itemT(r)
      return (Array.isArray(row) ? row : []).map((v, c) => lerp(oldRow[c], toNum(v), t))
    })
    out[from.surfaceKey] = from.surfaceKey === 'surfaceData' ? { ...to.surfaceData, z } : z
  }
  return out
}
