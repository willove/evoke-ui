/**
 * 世界标架 — 数据域到三维世界坐标的归一化
 *
 * 所有笛卡尔类图型共用一个标架：地面是 1×1 的方格，高度上限 Z_HEIGHT。
 * 相机参数因此与数据规模解耦 —— 换一套数据不用重新调视角，
 * 拖拽/缩放的手感在 bar3d / line3d / scatter3d / surface3d 之间完全一致。
 *
 * 世界为 Z 轴向上：X 类目、Y 系列（深度）、Z 数值（高度）。
 */
import { makeBandScale, makeLinearScale, niceTicks, extentOf, formatNumber, decimalsForStep, thinTicks } from './core/scale3d.js'

/** 世界地面半宽 */
export const WORLD_HALF = 0.5
/** 世界高度（数据最大刻度映射到这里） */
export const Z_HEIGHT = 0.62

/** 世界包围盒（无顶：盒体只有地面与两片背墙，柱子顶到上刻度线是自然形态） */
export function worldBox() {
  return { min: [-WORLD_HALF, -WORLD_HALF, 0], max: [WORLD_HALF, WORLD_HALF, Z_HEIGHT] }
}

/** 数值轴配置解析（min/max 显式指定优先） */
function valueDomain(values, cfg) {
  const explicitMin = cfg && Number.isFinite(cfg.min) ? cfg.min : null
  const explicitMax = cfg && Number.isFinite(cfg.max) ? cfg.max : null
  if (explicitMin !== null && explicitMax !== null) return [explicitMin, explicitMax]
  const [dMin, dMax] = extentOf(values, { includeZero: !!(cfg && cfg.includeZero) })
  return [explicitMin !== null ? explicitMin : dMin, explicitMax !== null ? explicitMax : dMax]
}

/**
 * 类目轴
 * @returns {{type:'category', labels:string[], scale:object, name:string}}
 */
export function categoryAxis(labels, worldRange, cfg = {}) {
  const list = Array.isArray(labels) ? labels.map((l, i) => (l == null ? String(i + 1) : String(l))) : []
  const scale = makeBandScale(list.length, worldRange, Number.isFinite(cfg.padding) ? cfg.padding : 0.24)
  return {
    type: 'category',
    labels: list,
    scale,
    name: cfg.name || '',
    formatter: typeof cfg.formatter === 'function' ? cfg.formatter : null,
  }
}

/**
 * 数值轴 — 域对齐到 nice 刻度，世界区间首尾对应刻度域首尾
 * @returns {{type:'value', scale:object, ticks:{value:number,label:string}[], min:number, max:number}}
 */
export function valueAxis(values, worldRange, cfg = {}) {
  const [dMin, dMax] = valueDomain(values, cfg)
  const tickCount = Number.isFinite(cfg.ticks) ? cfg.ticks : 5
  const nice = niceTicks(dMin, dMax, tickCount)
  const scale = makeLinearScale([nice.min, nice.max], worldRange)
  const decimals = Number.isFinite(cfg.decimals) ? cfg.decimals : decimalsForStep(nice.step)
  const fmt = typeof cfg.formatter === 'function'
    ? cfg.formatter
    : (v) => formatNumber(v, { decimals, thousandSeparator: ',' })
  const all = nice.values.map((v) => ({ value: v, label: fmt(v) }))
  const maxTicks = Number.isFinite(cfg.maxTicks) ? cfg.maxTicks : 9
  const shown = thinTicks(all, maxTicks)
  return {
    type: 'value',
    scale,
    ticks: shown,
    allTicks: all,
    min: nice.min,
    max: nice.max,
    step: nice.step,
    name: cfg.name || '',
    formatter: fmt,
  }
}

/** 组装笛卡尔标架 */
export function buildFrame(xAxis, yAxis, zAxis, box = worldBox()) {
  return { x: xAxis, y: yAxis, z: zAxis, box }
}

/** 类目取值：索引合法取中心，非法回退地面起点 */
export function xAt(frame, i) {
  const s = frame.x.scale
  if (typeof i !== 'number' || !Number.isFinite(i)) return frame.box.min[0]
  if (s.center) return s.center(i)
  return s.map(i)
}

/** 数值取值：非法值落到地面（z 轴）或域起点，绝不让 NaN 进场景 */
export function zAt(frame, v) {
  const n = Number(v)
  return Number.isFinite(n) ? frame.z.scale.map(n) : frame.box.min[2]
}

export function linearAt(axis, v) {
  const n = Number(v)
  return Number.isFinite(n) && axis.scale.map ? axis.scale.map(n) : axis.scale.range?.[0] ?? 0
}

/** 判断值是否缺失（缺失值跳过绘制但保留占位语义） */
export function isMissing(v) {
  return v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))
}
