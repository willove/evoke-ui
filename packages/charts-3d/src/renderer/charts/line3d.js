/**
 * 三维折线图 — 空间折线 + 落地投影
 *
 * 每条系列是一条悬浮在各自进深层上的空间折线；向下落到地面的虚线投影
 * 与地面投影线解决「一眼看不出高度」的读数问题 —— 三维折线没有共同的
 * 基线参照，投影参照线不是装饰而是必需的读数辅助。
 */
import { addFace, addLine, addPoint, addSegment, createScene } from '../../core/scene.js'
import { Z_HEIGHT, WORLD_HALF, buildFrame, categoryAxis, valueAxis, isMissing } from '../../frame.js'
import { buildAxes3d, categoryTicks, valueTicks } from '../axes3d.js'
import { normalizeSeries } from '../shared.js'
import { toRgba } from '../../core/color.js'

export function buildLine3dScene(rc) {
  const { options, theme, hiddenSeries, progress } = rc
  const scene = createScene()

  const labels = Array.isArray(options.labels) ? options.labels.map(String) : []
  const series = normalizeSeries(options, theme, hiddenSeries)

  const values = []
  for (const s of series) {
    for (const v of s.data) {
      const n = Number(v)
      if (Number.isFinite(n)) values.push(n)
    }
  }

  const frame = buildFrame(
    categoryAxis(labels, [-WORLD_HALF, WORLD_HALF], { ...(options.xAxis || {}), padding: 0.24 }),
    categoryAxis(series.map((s) => s.name), [-WORLD_HALF, WORLD_HALF], { ...(options.yAxis || {}), padding: 0.24 }),
    valueAxis(values, [0, Z_HEIGHT], { includeZero: true, ...(options.zAxis || {}) }),
  )
  frame.x.ticks = categoryTicks(frame.x)
  frame.y.ticks = categoryTicks(frame.y)
  frame.z.ticks = valueTicks(frame.z)
  buildAxes3d(scene, frame, rc)

  const cfg = options.line && typeof options.line === 'object' ? options.line : {}
  const area = !!cfg.area
  const dropLines = cfg.dropLines !== false
  const lineWidth = Number.isFinite(cfg.width) ? cfg.width : 2.4
  const pointRadius = Number.isFinite(cfg.pointRadius) ? cfg.pointRadius : 3.6
  const showPoints = cfg.points !== false

  series.forEach((s) => {
    const y = frame.y.scale.center(s.__index)
    const pts = []
    for (let i = 0; i < frame.x.scale.count; i++) {
      const v = Number(s.data[i])
      if (isMissing(v)) continue
      pts.push({ i, v, world: [frame.x.scale.center(i), y, frame.z.scale.map(v) * progress] })
    }
    if (!pts.length) return

    // 落地投影：竖直虚线 + 地面折线（读数参照，先画且不可拾取）
    if (dropLines) {
      for (const p of pts) {
        addSegment(scene, p.world, [p.world[0], p.world[1], 0.0015], {
          color: toRgba(s.color, 0.28),
          layer: 'back',
          lineWidth: 1,
          dash: [3, 4],
          pickable: false,
        })
      }
      addLine(scene, pts.map((p) => [p.world[0], p.world[1], 0.0015]), {
        color: toRgba(s.color, 0.22),
        layer: 'back',
        lineWidth: 1.2,
        pickable: false,
      })
    }

    // 面带：折线垂直落地形成的 curtain（可选）
    if (area) {
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k].world
        const b = pts[k + 1].world
        addFace(scene, [
          [a[0], a[1], a[2]], [b[0], b[1], b[2]], [b[0], b[1], 0.002], [a[0], a[1], 0.002],
        ], {
          color: s.color,
          alpha: 0.20 * progress,
          layer: 'back',
          flat: true,
          doubleSided: true,
          pickable: false,
        })
      }
    }

    addLine(scene, pts.map((p) => p.world), {
      color: s.color,
      lineWidth,
      alpha: progress < 1 ? Math.min(1, 0.25 + progress) : 1,
      meta: { key: `line:${s.__index}`, type: 'line3d', seriesName: s.name, seriesIndex: s.__index, color: s.color, name: s.name, value: null, dataIndex: -1 },
      pickable: false,
    })

    if (showPoints) {
      pts.forEach((p, k) => {
        addPoint(scene, p.world, {
          color: s.color,
          radius: pointRadius,
          pickRadius: Math.max(9, pointRadius * 2.4),
          stroke: theme.isDark ? 'rgba(0,0,0,0.35)' : '#ffffff',
          strokeWidth: 1.2,
          alpha: Math.min(1, 0.3 + progress),
          meta: {
            key: `line:${s.__index}:${p.i}`,
            type: 'line3d',
            seriesName: s.name,
            seriesIndex: s.__index,
            dataIndex: p.i,
            name: labels[p.i] !== undefined ? labels[p.i] : String(p.i + 1),
            value: p.v,
            color: s.color,
          },
        })
        void k
      })
    }
  })

  return { scene, frame }
}
