/**
 * 三维散点图 — 空间点云
 *
 * 两种数据形态自动识别：
 *   · 三元组模式  scatterData / series[].data 为 [x,y,z] —— 三轴全数值
 *   · 类目模式    labels + series[].data 为标量 —— X 类目、Y 系列、Z 数值
 *
 * colorScale 开启后把 Z 值映射到连续色带上（第四维信息编码），
 * 图例区相应换成色标。
 */
import { addPoint, addSegment, createScene } from '../../core/scene.js'
import { Z_HEIGHT, WORLD_HALF, buildFrame, categoryAxis, valueAxis, isMissing } from '../../frame.js'
import { buildAxes3d, categoryTicks, valueTicks } from '../axes3d.js'
import { normalizeSeries } from '../shared.js'
import { gradientAt, toRgba } from '../../core/color.js'
import { resolveChartRamp } from '../../palette.js'

function isTriple(v) {
  return Array.isArray(v) && v.length >= 3 && Number.isFinite(Number(v[0])) && Number.isFinite(Number(v[2]))
}

export function buildScatter3dScene(rc) {
  const { options, theme, hiddenSeries, progress } = rc
  const scene = createScene()

  const labels = Array.isArray(options.labels) ? options.labels.map(String) : []
  const series = normalizeSeries(options, theme, hiddenSeries)

  const freeData = Array.isArray(options.scatterData)
    ? options.scatterData.filter(isTriple)
    : []
  const tripleMode = freeData.length > 0 || series.some((s) => s.data.some(isTriple))

  const cfg = options.scatter && typeof options.scatter === 'object' ? options.scatter : {}
  const baseSize = Number.isFinite(cfg.size) ? cfg.size : 5
  const dropLines = cfg.dropLines !== false
  const sizeAttenuation = cfg.depthScale !== false

  // ── 色带（第四维编码）──
  let ramp = null
  let zDomain = null
  let colorScaleOn = false
  if (cfg.colorScale) {
    const rampId = typeof cfg.colorScale === 'string' ? cfg.colorScale : 'classic'
    ramp = resolveChartRamp(rampId, theme.isDark) || resolveChartRamp('classic', theme.isDark)
    colorScaleOn = !!ramp
  }

  let frame
  const points = [] // {world, meta, color, size}

  if (tripleMode) {
    const triples = []
    series.forEach((s) => {
      for (const raw of s.data) {
        if (!isTriple(raw)) continue
        triples.push({ s, v: [Number(raw[0]), Number(raw[1]), Number(raw[2])] })
      }
    })
    for (const d of freeData) triples.push({ s: null, v: d.map(Number) })

    const xs = triples.map((t) => t.v[0])
    const ys = triples.map((t) => t.v[1])
    const zs = triples.map((t) => t.v[2])
    frame = buildFrame(
      valueAxis(xs, [-WORLD_HALF, WORLD_HALF], { ...(options.xAxis || {}), headroom: 0.06 }),
      valueAxis(ys, [-WORLD_HALF, WORLD_HALF], { ...(options.yAxis || {}), headroom: 0.06 }),
      valueAxis(zs, [0, Z_HEIGHT], { includeZero: false, ...(options.zAxis || {}), headroom: 0.06 }),
    )
    frame.x.ticks = valueTicks(frame.x)
    frame.y.ticks = valueTicks(frame.y)
    frame.z.ticks = valueTicks(frame.z)

    if (colorScaleOn) {
      zDomain = [Math.min(...zs), Math.max(...zs)]
    }
    triples.forEach((t, idx) => {
      const s = t.s
      const zNorm = zDomain && zDomain[1] > zDomain[0]
        ? (t.v[2] - zDomain[0]) / (zDomain[1] - zDomain[0])
        : 0.5
      points.push({
        world: [frame.x.scale.map(t.v[0]), frame.y.scale.map(t.v[1]), frame.z.scale.map(t.v[2]) * progress],
        color: colorScaleOn ? gradientAt(ramp, zNorm) : s ? s.color : theme.colors[0],
        size: baseSize,
        meta: {
          key: `pt:${idx}`,
          type: 'scatter3d',
          seriesName: s ? s.name : '散点',
          seriesIndex: s ? s.__index : -1,
          dataIndex: idx,
          x: t.v[0],
          y: t.v[1],
          z: t.v[2],
          value: t.v[2],
          name: null,
          color: colorScaleOn ? gradientAt(ramp, zNorm) : s ? s.color : theme.colors[0],
        },
      })
    })
  } else {
    const values = []
    for (const s of series) {
      for (const v of s.data) {
        const n = Number(v)
        if (Number.isFinite(n)) values.push(n)
      }
    }
    frame = buildFrame(
      categoryAxis(labels, [-WORLD_HALF, WORLD_HALF], { ...(options.xAxis || {}), padding: 0.24 }),
      categoryAxis(series.map((s) => s.name), [-WORLD_HALF, WORLD_HALF], { ...(options.yAxis || {}), padding: 0.24 }),
      valueAxis(values, [0, Z_HEIGHT], { includeZero: true, ...(options.zAxis || {}) }),
    )
    frame.x.ticks = categoryTicks(frame.x)
    frame.y.ticks = categoryTicks(frame.y)
    frame.z.ticks = valueTicks(frame.z)

    if (colorScaleOn && values.length) {
      zDomain = [Math.min(...values), Math.max(...values)]
    }
    series.forEach((s) => {
      const y = frame.y.scale.center(s.__index)
      for (let i = 0; i < frame.x.scale.count; i++) {
        const v = Number(s.data[i])
        if (isMissing(v)) continue
        const zNorm = zDomain && zDomain[1] > zDomain[0] ? (v - zDomain[0]) / (zDomain[1] - zDomain[0]) : 0.5
        const color = colorScaleOn ? gradientAt(ramp, zNorm) : s.color
        points.push({
          world: [frame.x.scale.center(i), y, frame.z.scale.map(v) * progress],
          color,
          size: baseSize,
          meta: {
            key: `pt:${s.__index}:${i}`,
            type: 'scatter3d',
            seriesName: s.name,
            seriesIndex: s.__index,
            dataIndex: i,
            name: labels[i] !== undefined ? labels[i] : String(i + 1),
            value: v,
            color,
          },
        })
      }
    })
  }

  buildAxes3d(scene, frame, rc)

  for (const p of points) {
    if (dropLines) {
      addSegment(scene, p.world, [p.world[0], p.world[1], 0.0015], {
        color: toRgba(p.color, 0.22),
        layer: 'back',
        lineWidth: 1,
        dash: [2, 4],
        pickable: false,
      })
    }
    addPoint(scene, p.world, {
      color: p.color,
      radius: p.size,
      pickRadius: Math.max(10, p.size * 2.4),
      depthScale: sizeAttenuation,
      stroke: theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.85)',
      strokeWidth: 1,
      alpha: Math.min(1, 0.35 + progress * 0.65),
      meta: p.meta,
    })
  }

  return {
    scene,
    frame,
    colorScale: colorScaleOn && zDomain ? { min: zDomain[0], max: zDomain[1], colors: ramp, label: (options.zAxis && options.zAxis.name) || '' } : null,
  }
}
