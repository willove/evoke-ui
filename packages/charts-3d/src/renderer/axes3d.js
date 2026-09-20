/**
 * 三维坐标框 — 地面网格 / 背墙 / 轴线 / 刻度标签
 *
 * 关键决策：墙与轴的取边**跟随相机**。
 *   · 背墙永远选在离相机远的那一侧（否则墙会挡在数据前面）
 *   · X/Y 轴线与刻度贴在离相机近的那条底边（标签不与数据重叠）
 *   · Z 轴立在离相机最远的立柱上（不遮挡柱体）
 * 因此任意视角下坐标框都在「衬托」数据而不是「遮挡」数据，
 * 这是二维轴渲染器照搬不过来、必须重做的一层。
 *
 * 标签防碰撞在屏幕空间做：先把刻度锚点投到屏幕，再贪心丢弃与前一个
 * 标签包围盒重叠的候选。三维里标签间距随视角变化，世界空间的等步长
 * 抽稀无法保证不叠字。
 */
import { projectPoint } from '../core/math3d.js'
import { AXIS_X, AXIS_Y, addFace, addLine, addSegment, addText } from '../core/scene.js'
import { darken } from '../core/color.js'
import { estimateTextWidth } from './draw.js'

/** 按 maxCount 求 stride，保证至少 1 */
function strideFor(count, maxCount) {
  if (!(count > maxCount) || maxCount < 1) return 1
  return Math.ceil(count / maxCount)
}

/** 世界方向 → 屏幕像素方向（用于把标签沿「远离盒体」的方向外推） */
function screenDir(mvp, viewport, from, worldDir, pixelDist) {
  const eps = 0.03
  const a = projectPoint(mvp, viewport, from)
  const b = projectPoint(mvp, viewport, [
    from[0] + worldDir[0] * eps,
    from[1] + worldDir[1] * eps,
    from[2] + worldDir[2] * eps,
  ])
  if (!a.visible || !b.visible) return [0, 0]
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) return [0, 0]
  return [(dx / len) * pixelDist, (dy / len) * pixelDist]
}

function rectsOverlap(a, b, pad) {
  return a.x0 - pad < b.x1 && a.x1 + pad > b.x0 && a.y0 - pad < b.y1 && a.y1 + pad > b.y0
}

/**
 * 带防碰撞的刻度标签装配
 * ticks: [{ world:[x,y,z], label:string }]；逐个投影，贪心丢弃与前一个保留标签重叠者
 */
function addAxisLabels(scene, ticks, outDir, options) {
  const { mvp, viewport, color, fontSize = 11, align, pad = 2, dist = 15, anchor } = options
  let last = null
  let kept = 0
  const rects = []
  for (const t of ticks) {
    // anchor 把刻度的世界标量装配回 [x,y,z] 锚点（各轴贴的棱边不同）
    const base = anchor ? anchor(t.world) : t.world
    const off = screenDir(mvp, viewport, base, outDir, dist)
    const proj = projectPoint(mvp, viewport, base)
    if (!proj.visible) continue
    const lx = proj.x + off[0]
    const ly = proj.y + off[1]
    const w = estimateTextWidth(t.label, fontSize)
    const rect = {
      x0: lx - (align === 'right' ? w : align === 'left' ? 0 : w / 2),
      x1: lx + (align === 'right' ? 0 : align === 'left' ? w : w / 2),
      y0: ly - fontSize * 0.7,
      y1: ly + fontSize * 0.7,
    }
    if (last && rectsOverlap(rect, last, pad)) continue
    last = rect
    rects.push(rect)
    addText(scene, base, t.label, {
      color,
      layer: 'front',
      fontSize,
      offset: [off[0], off[1] - 1],
      align,
    })
    kept++
  }
  return rects
}

/**
 * 轴名放置 — 沿外推方向逐步升级距离，与已保留的刻度标签碰撞则退避，
 * 全部撞就放弃（宁可少一个轴名也不叠字）
 */
function addAxisName(scene, base, name, outDir, keptRects, options) {
  if (!name) return
  const { mvp, viewport, color, align = 'center', dists = [38, 54, 70] } = options
  const proj = projectPoint(mvp, viewport, base)
  if (!proj.visible) return
  const w = estimateTextWidth(name, 11)
  for (const dist of dists) {
    const off = screenDir(mvp, viewport, base, outDir, dist)
    const lx = proj.x + off[0]
    const ly = proj.y + off[1]
    const rect = { x0: lx - w / 2, x1: lx + w / 2, y0: ly - 9, y1: ly + 9 }
    if (keptRects.some((r) => rectsOverlap(rect, r, 2))) continue
    addText(scene, base, name, {
      color, layer: 'front', fontSize: 11, offset: [off[0], off[1]], align,
    })
    return
  }
}

/**
 * 装配三维坐标框（往场景里加 back/front 图元）
 * @param {object} scene 目标场景
 * @param {object} frame buildFrame 的标架
 * @param {object} rc 渲染上下文 { theme, options, mvp, eye, viewport }
 */
export function buildAxes3d(scene, frame, rc) {
  const { theme, options, mvp, eye, viewport } = rc
  const box = frame.box
  const [x0, y0, z0] = box.min
  const [x1, y1, z1] = box.max
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2

  const gridCfg = options.grid && typeof options.grid === 'object' ? options.grid : {}
  const gridShow = gridCfg.show !== false
  const boxCfg = options.box && typeof options.box === 'object' ? options.box : {}
  const boxShow = boxCfg.show !== false
  const walls = boxCfg.walls === false ? 'none' : boxCfg.walls || 'back'

  const axisCfg = (axis, fallbackName) => {
    const cfg = axis && typeof axis === 'object' ? axis : {}
    return {
      show: cfg.show !== false,
      labels: cfg.labels !== false,
      grid: cfg.grid !== false,
      line: cfg.line !== false,
      name: cfg.name !== undefined ? cfg.name : fallbackName,
      titleShow: cfg.title !== undefined ? !!cfg.title : true,
    }
  }
  const xc = axisCfg(options.xAxis, frame.x.name)
  const yc = axisCfg(options.yAxis, frame.y.name)
  const zc = axisCfg(options.zAxis, frame.z.name)

  // ── 取边：近边贴轴，远边立墙 ──
  const nearY = eye[1] > cy ? y1 : y0
  const farY = nearY === y1 ? y0 : y1
  const nearX = eye[0] > cx ? x1 : x0
  const farX = nearX === x1 ? x0 : x1

  const gridColor = theme.gridColor
  const wallColor = theme.wallColor
  const lineColor = theme.borderColor
  const tickColor = theme.textColorSecondary

  // ── 背墙（面 + 墙内网格）──
  if (boxShow && walls !== 'none' && gridShow) {
    const wantBack = walls === 'all' || walls === 'back' || walls === true
    const wantSide = walls === 'all' || walls === 'side'
    if (wantBack) {
      addFace(scene, [
        [x0, farY, z0], [x1, farY, z0], [x1, farY, z1], [x0, farY, z1],
      ], { color: wallColor, layer: 'back', flat: true, pickable: false, alpha: 1 })
    }
    if (wantSide) {
      addFace(scene, [
        [farX, y0, z0], [farX, y1, z0], [farX, y1, z1], [farX, y0, z1],
      ], { color: wallColor, layer: 'back', flat: true, pickable: false, alpha: 1 })
    }
  }

  // ── 地面网格：X 刻度纵线 + Y 刻度横线 ──
  if (gridShow && xc.grid && Array.isArray(frame.x.ticks)) {
    const ticks = frame.x.ticks
    const stride = strideFor(ticks.length, 30)
    for (let i = 0; i < ticks.length; i += stride) {
      const gx = ticks[i].world
      addSegment(scene, [gx, y0, z0], [gx, y1, z0], { color: gridColor, layer: 'back', lineWidth: 1, pickable: false })
    }
  }
  if (gridShow && yc.grid && Array.isArray(frame.y.ticks)) {
    const ticks = frame.y.ticks
    const stride = strideFor(ticks.length, 30)
    for (let i = 0; i < ticks.length; i += stride) {
      const gy = ticks[i].world
      addSegment(scene, [x0, gy, z0], [x1, gy, z0], { color: gridColor, layer: 'back', lineWidth: 1, pickable: false })
    }
  }
  // ── 墙内网格：Z 刻度横线 + 墙面竖线 ──
  if (gridShow && zc.grid && Array.isArray(frame.z.ticks) && boxShow && walls !== 'none') {
    for (const t of frame.z.ticks) {
      const gz = t.world
      if (walls === 'all' || walls === 'back' || walls === true) {
        addSegment(scene, [x0, farY, gz], [x1, farY, gz], { color: gridColor, layer: 'back', lineWidth: 1, pickable: false })
      }
      if (walls === 'all' || walls === 'side') {
        addSegment(scene, [farX, y0, gz], [farX, y1, gz], { color: gridColor, layer: 'back', lineWidth: 1, pickable: false })
      }
    }
    if (walls === 'all' || walls === 'back' || walls === true) {
      if (Array.isArray(frame.x.ticks)) {
        const stride = strideFor(frame.x.ticks.length, 30)
        for (let i = 0; i < frame.x.ticks.length; i += stride) {
          const gx = frame.x.ticks[i].world
          addSegment(scene, [gx, farY, z0], [gx, farY, z1], { color: gridColor, layer: 'back', lineWidth: 1, pickable: false })
        }
      }
    }
    if (walls === 'all' || walls === 'side') {
      if (Array.isArray(frame.y.ticks)) {
        const stride = strideFor(frame.y.ticks.length, 30)
        for (let i = 0; i < frame.y.ticks.length; i += stride) {
          const gy = frame.y.ticks[i].world
          addSegment(scene, [farX, gy, z0], [farX, gy, z1], { color: gridColor, layer: 'back', lineWidth: 1, pickable: false })
        }
      }
    }
  }

  // ── 盒体棱线（外框描一圈，收束形体感）──
  if (boxShow && boxCfg.frame !== false) {
    const edges = [
      // 底面四边
      [[x0, y0, z0], [x1, y0, z0]], [[x1, y0, z0], [x1, y1, z0]],
      [[x1, y1, z0], [x0, y1, z0]], [[x0, y1, z0], [x0, y0, z0]],
      // 两片背墙的顶部与远侧立柱
      [[x0, farY, z1], [x1, farY, z1]], [[farX, y0, z1], [farX, y1, z1]],
      [[farX, farY, z0], [farX, farY, z1]],
    ]
    for (const [a, b] of edges) {
      addSegment(scene, a, b, { color: lineColor, layer: 'front', lineWidth: 1, pickable: false })
    }
  }

  // ── 轴线（贴近边）与刻度标签 ──
  const labelColor = tickColor
  const axisLineColor = darken(theme.textColorSecondary, 0.1)

  if (xc.show && Array.isArray(frame.x.ticks)) {
    if (xc.line) {
      addSegment(scene, [x0, nearY, z0], [x1, nearY, z0], { color: axisLineColor, layer: 'front', lineWidth: 1.2, pickable: false })
    }
    const outDir = [0, nearY === y1 ? 1 : -1, 0]
    let xRects = []
    if (xc.labels) {
      xRects = addAxisLabels(scene, frame.x.ticks, outDir, { mvp, viewport, color: labelColor, anchor: (w) => [w, nearY, z0] })
    }
    if (xc.name && xc.titleShow) {
      addAxisName(scene, [(x0 + x1) / 2, nearY, z0], xc.name, outDir, xRects, { mvp, viewport, color: theme.textColorSecondary })
    }
  }

  if (yc.show && Array.isArray(frame.y.ticks)) {
    if (yc.line) {
      addSegment(scene, [nearX, y0, z0], [nearX, y1, z0], { color: axisLineColor, layer: 'front', lineWidth: 1.2, pickable: false })
    }
    const outDir = [nearX === x1 ? 1 : -1, 0, 0]
    let yRects = []
    if (yc.labels) {
      yRects = addAxisLabels(scene, frame.y.ticks, outDir, {
        mvp, viewport, color: labelColor, dist: 17, align: outDir[0] < 0 ? 'right' : 'left',
        anchor: (w) => [nearX, w, z0],
      })
    }
    if (yc.name && yc.titleShow) {
      addAxisName(scene, [nearX, (y0 + y1) / 2, z0], yc.name, outDir, yRects, {
        mvp, viewport, color: theme.textColorSecondary, align: outDir[0] < 0 ? 'right' : 'left', dists: [42, 58, 74],
      })
    }
  }

  if (zc.show && Array.isArray(frame.z.ticks)) {
    // Z 轴立在远角立柱上
    if (zc.line) {
      addSegment(scene, [farX, farY, z0], [farX, farY, z1], { color: axisLineColor, layer: 'front', lineWidth: 1.2, pickable: false })
    }
    const outDir = [farX === x0 ? -1 : 1, farY === y0 ? -1 : 1, 0]
    let zRects = []
    if (zc.labels) {
      zRects = addAxisLabels(scene, frame.z.ticks, outDir, {
        mvp, viewport, color: labelColor, fontSize: 10.5, dist: 18, align: 'right',
        anchor: (w) => [farX, farY, w],
      })
    }
    if (zc.name && zc.titleShow) {
      addAxisName(scene, [farX, farY, (z0 + z1) / 2], zc.name, outDir, zRects, {
        mvp, viewport, color: theme.textColorSecondary, align: 'right', dists: [44, 60, 76],
      })
    }
  }

  void AXIS_X
  void AXIS_Y
}

/**
 * 类目刻度装配 — world 为世界坐标，label 为显示文本
 * 网格与标签共用一份 ticks，保证线与字严格对齐
 */
export function categoryTicks(axis, maxLabels = 16) {
  const { scale, labels, formatter } = axis
  const out = []
  if (!scale || !scale.count) return out
  const stride = strideFor(scale.count, maxLabels)
  for (let i = 0; i < scale.count; i += stride) {
    const raw = labels[i] !== undefined ? labels[i] : String(i + 1)
    out.push({ index: i, world: scale.center(i), label: formatter ? formatter(raw, i) : raw })
  }
  return out
}

/** 数值刻度装配 — 刻度值直接映射到世界坐标 */
export function valueTicks(axis) {
  if (!axis || !Array.isArray(axis.ticks)) return []
  return axis.ticks.map((t) => ({ value: t.value, world: axis.scale.map(t.value), label: t.label }))
}

/** 加线工具再导出，图型模块不必各自深入 scene 内部 */
export { addLine }
