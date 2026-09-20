/**
 * 三维曲面图 — z = f(x, y) 的高度场
 *
 * 数据为矩阵：行对应 Y、列对应 X，X/Y 走数值轴。
 * 着色按高度走连续色带；面片双面可见，从下方看不会消失。
 *
 * 两个刻意的实现取舍：
 *   · 面片数 O(n²)，矩阵按 MAX_GRID 抽稀，否则几万顶点会拖死交互
 *   · 线框不画整条横/纵线 —— 跨全图的线只有一个质心深度，画家算法会把它
 *     整条画到前景或背景，穿帮明显；拆成逐格短段才能正确参与深度排序
 */
import { addFace, addLine, createScene } from '../../core/scene.js'
import { Z_HEIGHT, WORLD_HALF, buildFrame, valueAxis } from '../../frame.js'
import { buildAxes3d, valueTicks } from '../axes3d.js'
import { normalizeSurface } from '../shared.js'
import { gradientAt } from '../../core/color.js'
import { resolveChartRamp } from '../../palette.js'

/** 单边最大面片数 */
const MAX_GRID = 48
/** 线框抽样上限（单边格数） */
const MAX_WIRE = 32

function strideFor(count, max) {
  if (!(count > max) || max < 2) return 1
  return Math.ceil(count / max)
}

export function buildSurface3dScene(rc) {
  const { options, theme, progress } = rc
  const scene = createScene()
  const data = normalizeSurface(options)

  const cfg = options.surface && typeof options.surface === 'object' ? options.surface : {}
  const rampId = typeof cfg.ramp === 'string' ? cfg.ramp : 'classic'
  const ramp = resolveChartRamp(rampId, theme.isDark) || resolveChartRamp('classic', theme.isDark)
  const wireframe = cfg.wireframe !== false
  const opacity = Number.isFinite(cfg.opacity) ? Math.max(0.15, Math.min(1, cfg.opacity)) : 1

  const rows = data.rows
  const cols = data.cols
  const empty = !rows || !cols

  const rowIdx = decimatedIndices(rows, MAX_GRID)
  const colIdx = decimatedIndices(cols, MAX_GRID)

  const cellValues = []
  for (const row of data.matrix) {
    if (!Array.isArray(row)) continue
    for (const v of row) {
      const n = Number(v)
      if (Number.isFinite(n)) cellValues.push(n)
    }
  }
  const zMin = cellValues.length ? Math.min(...cellValues) : 0
  const zMax = cellValues.length ? Math.max(...cellValues) : 1

  const frame = buildFrame(
    valueAxis(data.xValues, [-WORLD_HALF, WORLD_HALF], { ...(options.xAxis || {}), headroom: 0.01, ticks: 6 }),
    valueAxis(data.yValues, [-WORLD_HALF, WORLD_HALF], { ...(options.yAxis || {}), headroom: 0.01, ticks: 6 }),
    valueAxis(cellValues, [0, Z_HEIGHT], { includeZero: false, ...(options.zAxis || {}), headroom: 0.01 }),
  )
  frame.x.ticks = valueTicks(frame.x)
  frame.y.ticks = valueTicks(frame.y)
  frame.z.ticks = valueTicks(frame.z)

  buildAxes3d(scene, frame, rc)

  if (empty) return { scene, frame, colorScale: null }

  const xWorld = (i) => frame.x.scale.map(data.xValues[i])
  const yWorld = (j) => frame.y.scale.map(data.yValues[j])
  const zWorld = (v) => frame.z.scale.map(Number(v)) * progress

  // 顶点网格（抽稀后）
  const grid = []
  for (const j of rowIdx) {
    const line = []
    for (const i of colIdx) {
      const raw = data.matrix[j] ? data.matrix[j][i] : undefined
      const v = Number(raw)
      line.push({
        x: xWorld(i),
        y: yWorld(j),
        z: Number.isFinite(v) ? zWorld(v) : 0,
        value: Number.isFinite(v) ? v : null,
      })
    }
    grid.push(line)
  }

  const norm = (v) => (zMax > zMin ? (v - zMin) / (zMax - zMin) : 0.5)

  for (let r = 0; r < grid.length - 1; r++) {
    for (let c = 0; c < grid[r].length - 1; c++) {
      const a = grid[r][c]
      const b = grid[r][c + 1]
      const d = grid[r + 1][c + 1]
      const e = grid[r + 1][c]
      const vals = [a.value, b.value, d.value, e.value].filter((v) => v !== null)
      const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : zMin
      const color = gradientAt(ramp, norm(avg))
      addFace(scene, [
        [a.x, a.y, a.z], [b.x, b.y, b.z], [d.x, d.y, d.z], [e.x, e.y, e.z],
      ], {
        color,
        flat: true,
        alpha: opacity,
        cull: false,
        doubleSided: true,
        meta: {
          key: `sf:${rowIdx[r]}:${colIdx[c]}`,
          type: 'surface3d',
          seriesName: '曲面',
          seriesIndex: 0,
          dataIndex: rowIdx[r] * cols + colIdx[c],
          x: data.xValues[colIdx[c]],
          y: data.yValues[rowIdx[r]],
          value: avg,
          z: avg,
          color,
        },
      })
    }
  }

  // 线框：逐格短段，抽样到 MAX_WIRE 以控制图元量
  if (wireframe) {
    const lineColor = theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.45)'
    const wireRows = decimatedIndices(grid.length, MAX_WIRE)
    const wireCols = decimatedIndices(grid[0].length, MAX_WIRE)
    const seg = (p, q) => {
      addLine(scene, [[p.x, p.y, p.z + 0.0012], [q.x, q.y, q.z + 0.0012]], {
        color: lineColor,
        lineWidth: 0.7,
        alpha: 0.85,
        pickable: false,
      })
    }
    for (const r of wireRows) {
      if (r >= grid.length - 1) continue
      for (let c = 0; c < grid[r].length - 1; c++) seg(grid[r][c], grid[r][c + 1])
    }
    for (const c of wireCols) {
      if (c >= grid[0].length - 1) continue
      for (let r = 0; r < grid.length - 1; r++) seg(grid[r][c], grid[r + 1][c])
    }
  }

  return {
    scene,
    frame,
    colorScale: {
      min: zMin,
      max: zMax,
      colors: ramp,
      label: (options.zAxis && options.zAxis.name) || '',
    },
  }
}

/** 0..count-1 的等距下标（首末必含），用于矩阵抽稀 */
function decimatedIndices(count, max) {
  const out = []
  if (count <= 0) return out
  const stride = strideFor(count, max)
  for (let i = 0; i < count; i += stride) out.push(i)
  if (out[out.length - 1] !== count - 1) out.push(count - 1)
  return out
}
