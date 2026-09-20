/**
 * 刻度与映射 — nice 刻度生成、线性/带状映射、数值格式化
 *
 * 刻度算法与 evoke-charts 保持同一口径（1 / 2 / 5 / 10 阶梯），
 * 这样同一个数据集在二维图与三维图里落到的刻度值是一致的。
 */

/** 过滤出可参与统计的有限数值 */
export function finiteValues(values) {
  const out = []
  for (const v of values || []) {
    if (Number.isFinite(v)) out.push(v)
  }
  return out
}

/**
 * 数值域
 * @param {boolean} includeZero 柱状语义必须从 0 起算，否则柱高失真
 */
export function extentOf(values, options = {}) {
  const nums = finiteValues(values)
  if (!nums.length) return [0, 1]
  let min = Math.min(...nums)
  let max = Math.max(...nums)
  if (options.includeZero) {
    min = Math.min(0, min)
    max = Math.max(0, max)
  }
  if (min === max) {
    if (min === 0) return [0, 1]
    const pad = Math.abs(min) * 0.5
    return [min - pad, max + pad]
  }
  const headroom = Number.isFinite(options.headroom) ? options.headroom : 0
  if (headroom > 0) {
    const span = max - min
    min -= span * headroom
    max += span * headroom
  }
  return [min, max]
}

/** 取整到 1 / 2 / 5 / 10 阶梯 */
export function niceNumber(range, round) {
  if (!(range > 0) || !Number.isFinite(range)) return 1
  const exp = Math.floor(Math.log10(range))
  const pow = 10 ** exp
  const f = range / pow
  let nf
  if (round) {
    if (f < 1.5) nf = 1
    else if (f < 3) nf = 2
    else if (f < 7) nf = 5
    else nf = 10
  } else if (f <= 1) nf = 1
  else if (f <= 2) nf = 2
  else if (f <= 5) nf = 5
  else nf = 10
  return nf * pow
}

/**
 * nice 刻度 — 返回覆盖数据域且落在整步长上的刻度序列
 * @returns {{min:number, max:number, step:number, values:number[]}}
 */
export function niceTicks(min, max, count = 5) {
  const target = Number.isFinite(count) ? Math.max(2, Math.min(20, Math.round(count))) : 5
  let lo = Number.isFinite(min) ? min : 0
  let hi = Number.isFinite(max) ? max : 1
  if (lo > hi) [lo, hi] = [hi, lo]
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.5 || 1
    lo -= pad
    hi += pad
  }

  const step = niceNumber(niceNumber(hi - lo, false) / (target - 1), true)
  const niceMin = Math.floor(lo / step) * step
  const niceMax = Math.ceil(hi / step) * step

  // 步长可能被极端数据压到浮点噪声级，这里兜住上限，绝不让刻度循环失控
  const span = niceMax - niceMin
  const guard = Math.min(400, Math.round(span / step) + 1)
  const decimals = Math.max(0, Math.min(12, -Math.floor(Math.log10(step))))
  const values = []
  for (let i = 0; i < guard; i++) {
    const v = niceMin + i * step
    if (v > niceMax + step * 1e-9) break
    values.push(Number(v.toFixed(decimals)))
  }
  if (!values.length) values.push(niceMin, niceMax)
  return { min: niceMin, max: niceMax, step, values }
}

/**
 * 线性映射
 * domain → range，domain 退化为单点时返回常量映射，避免除零把坐标打成 NaN
 */
export function makeLinearScale(domain, range) {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0
  const degenerate = Math.abs(span) < 1e-12
  const k = degenerate ? 0 : (r1 - r0) / span
  return {
    domain: [d0, d1],
    range: [r0, r1],
    degenerate,
    map: (v) => (Number.isFinite(v) ? r0 + (v - d0) * k : r0),
    invert: (t) => (degenerate ? d0 : d0 + (t - r0) / k),
  }
}

/**
 * 带状映射 — 类目轴专用，返回类目中心点与可用带宽
 * paddingRatio 为类目间距占整步长的比例（0 = 紧贴，0.9 = 极稀疏）
 */
export function makeBandScale(count, range, paddingRatio = 0.24) {
  const n = Math.max(0, Math.floor(count) || 0)
  const [r0, r1] = range
  const span = r1 - r0
  const step = n > 0 ? span / n : 0
  const pad = Math.max(0, Math.min(0.95, paddingRatio))
  const bandwidth = step * (1 - pad)
  return {
    count: n,
    step,
    bandwidth,
    range: [r0, r1],
    center: (i) => r0 + step * (i + 0.5),
    /** 反查：给定坐标落在第几个类目；越界返回 -1 */
    indexAt: (t) => {
      if (!(step > 0)) return -1
      const i = Math.floor((t - r0) / step)
      return i >= 0 && i < n ? i : -1
    },
    start: (i) => r0 + step * i + (step - bandwidth) / 2,
  }
}

/**
 * 数值格式化 — 与 evoke-charts 的 formatValue 同口径
 * @param {{decimals?:number, thousandSeparator?:string|false, prefix?:string, suffix?:string, abbreviate?:boolean}} options
 */
export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  const {
    decimals = 0,
    thousandSeparator = ',',
    prefix = '',
    suffix = '',
    abbreviate = false,
  } = options
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'

  let body
  if (abbreviate) {
    const abs = Math.abs(num)
    if (abs >= 1e8) body = `${(num / 1e8).toFixed(2)}亿`
    else if (abs >= 1e4) body = `${(num / 1e4).toFixed(2)}万`
    else if (abs >= 1e3) body = `${(num / 1e3).toFixed(2)}K`
    else body = num.toFixed(decimals)
  } else {
    const fixed = num.toFixed(decimals)
    if (!thousandSeparator) {
      body = fixed
    } else if (decimals === 0) {
      body = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator)
    } else {
      const [intPart, decPart] = fixed.split('.')
      body = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator) + (decPart ? `.${decPart}` : '')
    }
  }
  return `${prefix}${body}${suffix}`
}

/** 依据刻度步长推断合适的小数位，供轴标签使用 */
export function decimalsForStep(step) {
  if (!(step > 0) || !Number.isFinite(step)) return 0
  if (step >= 1) return 0
  return Math.min(4, Math.ceil(-Math.log10(step)))
}

/** 稀疏化刻度：标签过密时按固定步长抽稀，保证首末刻度始终保留 */
export function thinTicks(values, maxCount) {
  if (!Array.isArray(values) || values.length <= maxCount) return values
  const stride = Math.ceil(values.length / maxCount)
  const out = values.filter((_, i) => i % stride === 0)
  const last = values[values.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}
