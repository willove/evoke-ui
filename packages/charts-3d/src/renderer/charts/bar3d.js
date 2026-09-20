/**
 * 三维柱状图 — 类目 × 系列 的柱林
 *
 * X 类目、Y 系列（进深）、Z 数值。柱体是封闭长方体：顶面受主光最亮、
 * 侧面随法线背光渐暗，形体感由光照而非描边给出。
 * 缺失值跳过（不占位、不出零高柱），零值柱保留（高度为 0 时仍画顶面封口，
 * 避免出现「看穿地面」的破面）。
 */
import { boxFaces } from '../../core/camera.js'
import { addBox, addFace, createScene } from '../../core/scene.js'
import { Z_HEIGHT, WORLD_HALF, buildFrame, categoryAxis, valueAxis, isMissing } from '../../frame.js'
import { buildAxes3d, categoryTicks, valueTicks } from '../axes3d.js'
import { normalizeSeries } from '../shared.js'

function clamp01(v) {
  return Number.isFinite(v) ? Math.max(0.02, Math.min(1, v)) : 0.62
}

export function buildBar3dScene(rc) {
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

  const bar = options.bar && typeof options.bar === 'object' ? options.bar : {}
  const frame = buildFrame(
    categoryAxis(labels, [-WORLD_HALF, WORLD_HALF], { ...(options.xAxis || {}), padding: 0.24 }),
    categoryAxis(series.map((s) => s.name), [-WORLD_HALF, WORLD_HALF], { ...(options.yAxis || {}), padding: 0.24 }),
    valueAxis(values, [0, Z_HEIGHT], { includeZero: true, ...(options.zAxis || {}) }),
  )
  frame.x.ticks = categoryTicks(frame.x)
  frame.y.ticks = categoryTicks(frame.y)
  frame.z.ticks = valueTicks(frame.z)

  buildAxes3d(scene, frame, rc)

  const xBand = frame.x.scale.bandwidth || 0.1
  const yBand = frame.y.scale.bandwidth || 0.1
  const w = xBand * clamp01(bar.width)
  const d = yBand * clamp01(bar.depth)
  const shadow = bar.shadow !== false

  series.forEach((s, si) => {
    const yStart = frame.y.scale.start(s.__index)
    const y0 = yStart + (yBand - d) / 2
    const y1 = y0 + d

    for (let i = 0; i < frame.x.scale.count; i++) {
      const v = Number(s.data[i])
      if (isMissing(v)) continue
      const xStart = frame.x.scale.start(i)
      const x0 = xStart + (xBand - w) / 2
      const x1 = x0 + w
      const h = Math.max(0.0004, frame.z.scale.map(v) * progress)

      if (shadow) {
        addFace(scene, [
          [x0 - d * 0.12, y0 - d * 0.12, 0.0012],
          [x1 + d * 0.12, y0 - d * 0.12, 0.0012],
          [x1 + d * 0.12, y1 + d * 0.12, 0.0012],
          [x0 - d * 0.12, y1 + d * 0.12, 0.0012],
        ], {
          color: '#000000',
          alpha: 0.10 * progress,
          layer: 'back',
          flat: true,
          pickable: false,
        })
      }

      addBox(scene, boxFaces([x0, y0, 0], [x1, y1, h]), {
        color: s.color,
        cull: true,
        meta: {
          key: `bar:${s.__index}:${i}`,
          type: 'bar3d',
          seriesName: s.name,
          seriesIndex: s.__index,
          dataIndex: i,
          name: labels[i] !== undefined ? labels[i] : String(i + 1),
          value: v,
          color: s.color,
        },
      })
    }
    void si
  })

  return { scene, frame }
}
