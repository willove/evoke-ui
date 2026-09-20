/**
 * 场景层 — 三维图元的描述、投影、着色、排序与拾取
 *
 * 渲染管线分三段，段与段之间是纯数据，便于单测逐段断言：
 *   1) 建景  charts/*.js 往 scene 里塞 face / line / point / text 图元（世界坐标）
 *   2) 投影  projectScene(scene, camera, viewport) → 屏幕坐标 + 视深 + 面法线 + 着色
 *   3) 绘制  drawScene(ctx, projected) 按层分三趟画：back（网格墙）→ data（深度排序）→ front（轴与标签）
 *
 * 为什么分三层而不是全局排序：文字与轴线若参与深度排序，会被柱子切成碎片，
 * 可读性崩坏；而网格必须永远在数据之下。分层是确定性的，排序只在数据层内部做。
 *
 * 拾取不走「反投影射线求交」，而是复用同一套投影把图元投到屏幕再判距离。
 * 好处是拾取结果与肉眼所见严格一致（同一份数学、同一份视口），
 * 不会出现「看着命中却选不中」的偏移。
 */
import { cameraMatrices, worldPerPixel } from './camera.js'
import {
  polygonCentroid,
  polygonNormal,
  projectPoint,
  v3add,
  v3cross,
  v3len,
  v3norm,
  v3scale,
  v3sub,
} from './math3d.js'
import { shadeColor } from './color.js'

export const LAYER_BACK = 'back'
export const LAYER_DATA = 'data'
export const LAYER_FRONT = 'front'

/** 默认光照：跟随相机的肩后主光（左上前方），保证任意视角都有稳定的立体感 */
const DEFAULT_LIGHT = {
  ambient: 0.56,
  intensity: 0.88,
  follow: true,
  /** 相机相对光照方向（right, up, back 三分量） */
  offset: [-0.45, 0.6, 0.66],
}

export function createScene() {
  return { items: [], order: 0 }
}

function push(scene, item) {
  item.order = scene.order++
  scene.items.push(item)
  return item
}

/**
 * 面图元
 * @param {Array<Array<number>>} points 世界坐标顶点，逆时针缠绕时法线朝外
 */
export function addFace(scene, points, options = {}) {
  if (!Array.isArray(points) || points.length < 3) return null
  return push(scene, {
    kind: 'face',
    layer: options.layer || LAYER_DATA,
    points,
    color: options.color || '#888888',
    alpha: options.alpha,
    stroke: options.stroke,
    strokeWidth: options.strokeWidth,
    /** 关闭光照，用于需要绝对准确色值的面（如语义色标） */
    flat: !!options.flat,
    /** 允许剔除背向相机的面；仅在顶点缠绕方向可信时开启 */
    cull: !!options.cull,
    /** 双面可见：曲面、带状面必须开，否则从下方看会整片消失 */
    doubleSided: options.doubleSided !== false ? true : false,
    pickable: options.pickable !== false,
    meta: options.meta || null,
    visible: true,
    depth: 0,
    screen: null,
    normal: null,
    fill: options.color || '#888888',
  })
}

/** 线图元（折线；closed 时首尾相连） */
export function addLine(scene, points, options = {}) {
  if (!Array.isArray(points) || points.length < 2) return null
  return push(scene, {
    kind: 'line',
    layer: options.layer || LAYER_DATA,
    points,
    color: options.color || '#888888',
    alpha: options.alpha,
    lineWidth: Number.isFinite(options.lineWidth) ? options.lineWidth : 1.5,
    dash: options.dash || null,
    closed: !!options.closed,
    smooth: !!options.smooth,
    cull: false,
    pickable: options.pickable !== false,
    tolerance: Number.isFinite(options.tolerance) ? options.tolerance : 6,
    meta: options.meta || null,
    visible: true,
    depth: 0,
    screen: null,
  })
}

/** 点图元 */
export function addPoint(scene, position, options = {}) {
  return push(scene, {
    kind: 'point',
    layer: options.layer || LAYER_DATA,
    position,
    color: options.color || '#888888',
    alpha: options.alpha,
    radius: Number.isFinite(options.radius) ? options.radius : 4,
    /** 拾取半径（像素）：细点/细线需要比视觉更大的命中目标 */
    pickRadius: Number.isFinite(options.pickRadius) ? options.pickRadius : null,
    symbol: options.symbol || 'circle',
    stroke: options.stroke,
    strokeWidth: options.strokeWidth,
    /** 按视深缩放点半径（透视感），关闭后所有点等大 */
    depthScale: !!options.depthScale,
    pickable: options.pickable !== false,
    meta: options.meta || null,
    visible: true,
    depth: 0,
    screen: null,
  })
}

/** 文字图元 — 位置锚定在三维空间，但绘制时永远正向、永远在最上层 */
export function addText(scene, position, text, options = {}) {
  if (text === null || text === undefined || text === '') return null
  return push(scene, {
    kind: 'text',
    layer: options.layer || LAYER_FRONT,
    position,
    text: String(text),
    color: options.color || '#666666',
    alpha: options.alpha,
    fontSize: Number.isFinite(options.fontSize) ? options.fontSize : 11,
    fontWeight: options.fontWeight || 'normal',
    fontFamily: options.fontFamily || null,
    align: options.align || 'center',
    baseline: options.baseline || 'middle',
    /** 文字底衬（保证压在网格上也可读） */
    background: options.background || null,
    /** 相对锚点的屏幕像素偏移，用于刻度标签外推 */
    offset: Array.isArray(options.offset) ? options.offset : [0, 0],
    pickable: false,
    meta: options.meta || null,
    visible: true,
    depth: 0,
    screen: null,
  })
}

/** 立方体六面 — 顶点缠绕已在 camera.boxFaces 中校验为法线朝外，故开启背面剔除 */
export function addBox(scene, faces, options = {}) {
  const out = []
  for (const key of Object.keys(faces)) {
    const f = addFace(scene, faces[key], { ...options, cull: options.cull !== false })
    if (f) out.push(f)
  }
  return out
}

/** 世界空间线段（网格、轴线、投影辅助线共用） */
export function addSegment(scene, a, b, options = {}) {
  return addLine(scene, [a, b], options)
}

/**
 * 解析光照方向 — 返回指向光源的单位向量
 * follow=true 时按相机基向量构造，视角旋转时光影跟着转，形体永远处于受光面；
 * 显式给 direction 时固定在世界上，旋转物体能看到明暗变化（更"物理"，但可能转到暗面）。
 */
export function resolveLight(lighting, basis) {
  const cfg = { ...DEFAULT_LIGHT, ...(lighting && typeof lighting === 'object' ? lighting : {}) }
  let dir
  if (Array.isArray(cfg.direction) && cfg.direction.length >= 3 && v3len(cfg.direction) > 1e-9) {
    dir = v3norm([cfg.direction[0], cfg.direction[1], cfg.direction[2]])
  } else {
    const off = Array.isArray(cfg.offset) && cfg.offset.length >= 3 ? cfg.offset : DEFAULT_LIGHT.offset
    dir = v3norm(v3add(
      v3add(v3scale(basis.right, off[0]), v3scale(basis.up, off[1])),
      v3scale(basis.forward, -off[2]),
    ))
  }
  return {
    direction: dir,
    ambient: Number.isFinite(cfg.ambient) ? cfg.ambient : DEFAULT_LIGHT.ambient,
    intensity: Number.isFinite(cfg.intensity) ? cfg.intensity : DEFAULT_LIGHT.intensity,
    flat: !!cfg.flat,
  }
}

/**
 * 投影整个场景
 * @param {{items:Array}} scene
 * @param {object} camera 已 resolve 的相机
 * @param {{x:number,y:number,width:number,height:number}} viewport 绘图区
 * @param {{lighting?:object, mvp?:Array, eye?:Array, basis?:object}} options
 * @returns {{items:Array, mvp:Array, eye:Array, light:object, dropped:number}}
 */
export function projectScene(scene, camera, viewport, options = {}) {
  const matrices = options.mvp && options.eye
    ? { mvp: options.mvp, eye: options.eye }
    : cameraMatrices(camera, viewport)
  const { mvp, eye } = matrices
  const basis = options.basis || {
    eye,
    right: [1, 0, 0],
    up: [0, 1, 0],
    forward: [0, 0, -1],
  }
  const light = resolveLight(options.lighting, basis)
  const shade = options.shading !== 'flat' && !light.flat

  const items = []
  let dropped = 0

  for (const item of scene.items) {
    if (item.visible === false) {
      dropped++
      continue
    }
    if (item.kind === 'text' || item.kind === 'point') {
      const p = projectPoint(mvp, viewport, item.position)
      if (!p.visible) {
        dropped++
        continue
      }
      const out = { ...item, screen: { x: p.x, y: p.y }, depth: p.depth }
      if (item.kind === 'point') {
        out.radius = item.depthScale
          ? item.radius * Math.max(0.35, Math.min(2.4, 3.6 / Math.max(0.35, p.depth)))
          : item.radius
      }
      items.push(out)
      continue
    }

    const screen = []
    let sumDepth = 0
    let ok = true
    for (const p of item.points) {
      const proj = projectPoint(mvp, viewport, p)
      if (!proj.visible) {
        ok = false
        break
      }
      screen.push([proj.x, proj.y])
      sumDepth += proj.depth
    }
    if (!ok || !screen.length) {
      dropped++
      continue
    }
    const depth = sumDepth / screen.length
    const out = { ...item, screen, depth }

    if (item.kind === 'face') {
      const normal = polygonNormal(item.points)
      const centroid = polygonCentroid(item.points)
      out.normal = normal
      out.centroid = centroid
      const toEye = v3norm(v3sub(eye, centroid))
      out.facing = normal[0] * toEye[0] + normal[1] * toEye[1] + normal[2] * toEye[2]
      if (item.cull && out.facing <= 0) {
        out.visible = false
        items.push(out)
        continue
      }
      if (shade) {
        const lambert = normal[0] * light.direction[0] + normal[1] * light.direction[1] + normal[2] * light.direction[2]
        // 双面可见的面片背向时法线翻转，否则背面会得到「反向光照」而发黑
        const effective = out.facing < 0 ? -lambert : lambert
        out.fill = shadeColor(item.color, effective, light)
      } else {
        out.fill = item.color
      }
    }
    items.push(out)
  }

  return { items, mvp, eye, light, dropped }
}

/** 深度排序 — 远 → 近（画家算法）；深度相同时保持建景顺序，避免共面闪烁 */
export function sortByDepth(items) {
  return items.slice().sort((a, b) => (b.depth - a.depth) || (a.order - b.order))
}

/** 按层切分：back 与 front 保持建景顺序，只有 data 层参与深度排序 */
export function partitionByLayer(items) {
  const back = []
  const data = []
  const front = []
  for (const item of items) {
    if (item.visible === false) continue
    if (item.layer === LAYER_BACK) back.push(item)
    else if (item.layer === LAYER_FRONT) front.push(item)
    else data.push(item)
  }
  return { back, data: sortByDepth(data), front }
}

/** 射线法判断点是否在多边形内（屏幕坐标） */
export function pointInPolygon(poly, x, y) {
  if (!Array.isArray(poly) || poly.length < 3) return false
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0]
    const yi = poly[i][1]
    const xj = poly[j][0]
    const yj = poly[j][1]
    if (yi === yj) continue
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/** 点到线段的距离 */
export function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq < 1e-12) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = t < 0 ? 0 : t > 1 ? 1 : t
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** 折线到点的最近距离 */
export function distanceToPolyline(screen, x, y) {
  let best = Infinity
  for (let i = 0; i < screen.length - 1; i++) {
    const d = distanceToSegment(x, y, screen[i][0], screen[i][1], screen[i + 1][0], screen[i + 1][1])
    if (d < best) best = d
  }
  return best
}

/**
 * 拾取 — 返回离相机最近（视深最小）的命中图元
 *
 * 命中优先级刻意做成「先按视深取最近」而非「先看类型」：
 * 柱林里前排柱子的顶面与后排柱子的侧面在屏幕上可能重叠，
 * 只有视深能给出符合直觉的答案（挡住你的那个）。
 *
 * @returns {{meta:any, item:object, distance:number}|null}
 */
export function pickScene(projected, x, y, options = {}) {
  if (!projected || !Array.isArray(projected.items)) return null
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  const tolerance = Number.isFinite(options.tolerance) ? options.tolerance : 6
  let best = null

  for (const item of projected.items) {
    if (item.visible === false || !item.pickable || !item.meta) continue
    let distance = Infinity

    if (item.kind === 'face') {
      if (!item.screen || !pointInPolygon(item.screen, x, y)) continue
      distance = 0
    } else if (item.kind === 'line') {
      if (!item.screen || item.screen.length < 2) continue
      const d = distanceToPolyline(item.screen, x, y)
      const limit = tolerance + (Number.isFinite(item.tolerance) ? item.tolerance : 0)
      if (d > limit) continue
      distance = d
    } else if (item.kind === 'point') {
      if (!item.screen) continue
      const d = Math.hypot(x - item.screen.x, y - item.screen.y)
      const pickRadius = Number.isFinite(item.pickRadius) ? item.pickRadius : item.radius
      const limit = pickRadius + tolerance
      if (d > limit) continue
      distance = d
    } else {
      continue
    }

    // 面之间比视深；同视深时比屏幕距离（线/点更"精准"的命中优先）
    if (
      !best ||
      item.depth < best.item.depth - 1e-6 ||
      (Math.abs(item.depth - best.item.depth) <= 1e-6 && distance < best.distance)
    ) {
      best = { meta: item.meta, item, distance }
    }
  }
  return best
}

/** 收集场景所有世界坐标点，用于 autoFit 与容器裁剪 */
export function scenePoints(scene) {
  const out = []
  for (const item of scene.items) {
    if (item.kind === 'text' || item.kind === 'point') out.push(item.position)
    else if (Array.isArray(item.points)) out.push(...item.points)
  }
  return out
}

/** 屏幕包围盒 — 用于 autoFit 时判断是否溢出视口 */
export function screenBounds(projected) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const item of projected.items) {
    if (item.visible === false) continue
    const pts = item.kind === 'text' || item.kind === 'point'
      ? [[item.screen.x, item.screen.y]]
      : item.screen || []
    for (const p of pts) {
      if (p[0] < minX) minX = p[0]
      if (p[1] < minY) minY = p[1]
      if (p[0] > maxX) maxX = p[0]
      if (p[1] > maxY) maxY = p[1]
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

/** 屏幕空间容差（像素）— 供拾取与视觉容差统一口径 */
export function pickTolerance(camera, viewport) {
  return Math.max(4, worldPerPixel(camera, viewport) * 6)
}

/** 世界坐标轴方向的单位向量，建景时常量复用 */
export const AXIS_X = [1, 0, 0]
export const AXIS_Y = [0, 1, 0]
export const AXIS_Z = [0, 0, 1]

/** 面法线与视线方向的夹角余弦（背面剔除与光照共用同一口径） */
export function cosineBetween(a, b) {
  const la = v3len(a)
  const lb = v3len(b)
  if (la < 1e-12 || lb < 1e-12) return 0
  return (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb)
}
