/**
 * 轨道相机 — 球坐标环绕 + 拖拽/滚轮/平移/自动旋转
 *
 * 世界为 Z 轴向上，相机始终看向 target，位置由三个量决定：
 *   yaw    方位角（度），从 +X 轴起算、绕 +Z 逆时针为正，取模到 (-180, 180]
 *   pitch  仰角（度），0 为与地面平齐、90 为正上方俯视
 *   distance 相机到 target 的距离（世界单位）
 *
 * 全部控制函数都是**纯函数**：接收相机对象、返回新对象，不改写入参。
 * 组件侧把相机放在 ref 里整体替换即可自然触发响应式，测试也可以直接断言前后快照。
 */
import { mat4LookAt, mat4Multiply, mat4Perspective, v3add, v3cross, v3norm, v3scale, v3sub } from './math3d.js'

const DEG = Math.PI / 180

/** 默认相机 — 经典的「左前上方俯视」三轴透视构图 */
export const DEFAULT_CAMERA = {
  yaw: -52,
  pitch: 27,
  distance: 3.6,
  target: [0, 0, 0.3],
  fov: 42,
  minPitch: 2,
  maxPitch: 88,
  minDistance: 1.4,
  maxDistance: 10,
  autoRotate: false,
  /** 自动旋转角速度（度/秒），正负决定方向 */
  autoRotateSpeed: 10,
  /** 惯性衰减系数：每帧速度乘以 (1 - damping)，0 表示无惯性 */
  damping: 0.14,
}

export function clamp(v, min, max) {
  if (!Number.isFinite(v)) return min
  if (v < min) return min
  if (v > max) return max
  return v
}

/** 角度归一化到 (-180, 180]，避免长时间拖拽后 yaw 无限增长 */
export function normalizeAngle(deg) {
  if (!Number.isFinite(deg)) return 0
  let a = ((deg + 180) % 360 + 360) % 360 - 180
  if (a === -180) a = 180
  return a
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}

/**
 * 合并用户配置为完整相机对象，并做一次钳制
 * 非法值（NaN / 字符串 / 越界）一律回落默认，保证下游投影不会拿到脏数据
 */
export function resolveCamera(config) {
  const c = config && typeof config === 'object' ? config : {}
  const base = { ...DEFAULT_CAMERA }
  const minPitch = num(c.minPitch, base.minPitch)
  const maxPitch = num(c.maxPitch, base.maxPitch)
  const minDistance = num(c.minDistance, base.minDistance)
  const maxDistance = num(c.maxDistance, base.maxDistance)
  const target = Array.isArray(c.target) && c.target.length >= 3
    ? [num(c.target[0], 0), num(c.target[1], 0), num(c.target[2], 0)]
    : base.target.slice()

  return {
    ...base,
    ...c,
    target,
    // 上下界本身可能被用户写反，这里强制排序，避免钳制后落在一个空区间
    minPitch: Math.min(minPitch, maxPitch),
    maxPitch: Math.max(minPitch, maxPitch),
    minDistance: Math.min(minDistance, maxDistance),
    maxDistance: Math.max(minDistance, maxDistance),
    yaw: normalizeAngle(num(c.yaw, base.yaw)),
    pitch: clamp(num(c.pitch, base.pitch), Math.min(minPitch, maxPitch), Math.max(minPitch, maxPitch)),
    distance: clamp(num(c.distance, base.distance), Math.min(minDistance, maxDistance), Math.max(minDistance, maxDistance)),
    fov: clamp(num(c.fov, base.fov), 10, 120),
    autoRotateSpeed: num(c.autoRotateSpeed, base.autoRotateSpeed),
    damping: clamp(num(c.damping, base.damping), 0, 1),
  }
}

/** 相机在世界空间的位置 */
export function cameraEye(camera) {
  const yaw = camera.yaw * DEG
  const pitch = camera.pitch * DEG
  const cp = Math.cos(pitch)
  return [
    camera.target[0] + camera.distance * cp * Math.cos(yaw),
    camera.target[1] + camera.distance * cp * Math.sin(yaw),
    camera.target[2] + camera.distance * Math.sin(pitch),
  ]
}

/** 相机基向量：right / up 取自视图矩阵的旋转行，forward 为视线方向 */
export function cameraBasis(camera) {
  const eye = cameraEye(camera)
  const view = mat4LookAt(eye, camera.target, [0, 0, 1])
  return {
    eye,
    right: [view[0], view[4], view[8]],
    up: [view[1], view[5], view[9]],
    forward: [-view[2], -view[6], -view[10]],
  }
}

/**
 * 视图 × 投影矩阵
 * near/far 随 distance 联动：距离拉远时近平面同步外推，避免远处几何被近平面裁掉；
 * 贴太近时又不至于让 near 退化成 0 造成深度精度塌陷。
 */
export function cameraMatrices(camera, viewport) {
  const eye = cameraEye(camera)
  const view = mat4LookAt(eye, camera.target, [0, 0, 1])
  const aspect = viewport.height > 0 ? viewport.width / viewport.height : 1
  const near = Math.max(0.02, camera.distance * 0.02)
  const far = camera.distance * 12 + 10
  const projection = mat4Perspective(camera.fov * DEG, aspect, near, far)
  return { view, projection, mvp: mat4Multiply(projection, view), eye }
}

/** 屏幕一个像素在 target 所在平面上对应的世界长度 — 平移与拾取容差共用 */
export function worldPerPixel(camera, viewport) {
  if (!(viewport.height > 0)) return 0
  return (2 * camera.distance * Math.tan((camera.fov * DEG) / 2)) / viewport.height
}

/**
 * 拖拽 → 新相机
 * 灵敏度按视口尺寸归一：窄容器里同样的手势不该转得更猛。
 */
export function orbitBy(camera, dxPixels, dyPixels, viewport) {
  const span = Math.max(240, Math.min(viewport?.width || 0, viewport?.height || 0) || 480)
  const perPx = 170 / span
  return resolveCamera({
    ...camera,
    // 向右拖 → 相机绕 target 反向环绕，视觉上物体跟着手指转（转地球的手感）
    yaw: camera.yaw - dxPixels * perPx,
    // 向下拖 → 抬高相机，看到更多顶面
    pitch: camera.pitch + dyPixels * perPx * 0.8,
  })
}

/** 滚轮 / 捏合 → 新相机；factor < 1 拉近 */
export function zoomBy(camera, factor) {
  const f = Number.isFinite(factor) && factor > 0 ? factor : 1
  return resolveCamera({ ...camera, distance: camera.distance * f })
}

/** 滚轮增量 → 缩放因子（指数映射，保证缩放手感线性且永不越界） */
export function wheelZoomFactor(deltaY, speed = 0.0012) {
  const d = Number.isFinite(deltaY) ? deltaY : 0
  return Math.exp(clamp(d, -600, 600) * speed)
}

/** 平移 → 新相机；target 沿相机的 right/up 平面移动 */
export function panBy(camera, dxPixels, dyPixels, viewport) {
  const { right, up } = cameraBasis(camera)
  const scale = worldPerPixel(camera, viewport)
  // 屏幕 y 向下：指针下移 → 场景跟着下移 → target 上抬
  const offset = v3add(v3scale(right, -dxPixels * scale), v3scale(up, dyPixels * scale))
  return resolveCamera({ ...camera, target: v3add(camera.target, offset) })
}

/** 自动旋转一帧；dtMs 为真实经过毫秒，保证不同刷新率下转速一致 */
export function autoRotateBy(camera, dtMs) {
  const dt = Number.isFinite(dtMs) ? dtMs : 0
  return { ...camera, yaw: normalizeAngle(camera.yaw + (camera.autoRotateSpeed * dt) / 1000) }
}

/** 相机状态签名 — 组件用它判断「这一帧相机是否真的变了」，避免无谓重绘 */
export function cameraSignature(camera) {
  const r = (n) => Math.round(n * 1000) / 1000
  return [
    r(camera.yaw),
    r(camera.pitch),
    r(camera.distance),
    r(camera.target[0]),
    r(camera.target[1]),
    r(camera.target[2]),
  ].join('|')
}

/** 事件载荷：只暴露用户关心的字段，不外泄内部派生量 */
export function cameraPayload(camera) {
  return {
    yaw: camera.yaw,
    pitch: camera.pitch,
    distance: camera.distance,
    target: camera.target.slice(),
  }
}

/**
 * 依据场景包围盒反解相机距离，让几何刚好落在视口内（autoFit）
 * 用垂直视场角与水平视场角中较小的那个来约束，窄容器里也不会溢出。
 */
export function fitDistance(bounds, camera, viewport) {
  if (!bounds || !viewport || !(viewport.width > 0) || !(viewport.height > 0)) return camera.distance
  const size = v3sub(bounds.max, bounds.min)
  const radius = Math.max(1e-3, 0.5 * Math.sqrt(size[0] ** 2 + size[1] ** 2 + size[2] ** 2))
  const fovY = camera.fov * DEG
  const fovX = 2 * Math.atan(Math.tan(fovY / 2) * (viewport.width / viewport.height))
  const limiting = Math.min(fovY, fovX)
  return clamp((radius / Math.sin(limiting / 2)) * 1.05, camera.minDistance, camera.maxDistance)
}

/** 世界包围盒（含 padding），供 autoFit 与场景裁剪使用 */
export function boundsOf(points, padding = 0) {
  if (!points.length) return { min: [0, 0, 0], max: [0, 0, 0], center: [0, 0, 0] }
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const p of points) {
    for (let i = 0; i < 3; i++) {
      if (p[i] < min[i]) min[i] = p[i]
      if (p[i] > max[i]) max[i] = p[i]
    }
  }
  for (let i = 0; i < 3; i++) {
    min[i] -= padding
    max[i] += padding
  }
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
  }
}

/** 立方体 12 条棱（世界坐标线段端点对），柱体/包围框/墙体共用 */
export function boxEdges(min, max) {
  const [x0, y0, z0] = min
  const [x1, y1, z1] = max
  const c = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ]
  return [
    [c[0], c[1]], [c[1], c[2]], [c[2], c[3]], [c[3], c[0]],
    [c[4], c[5]], [c[5], c[6]], [c[6], c[7]], [c[7], c[4]],
    [c[0], c[4]], [c[1], c[5]], [c[2], c[6]], [c[3], c[7]],
  ]
}

/** 立方体 6 个面（顶点按逆时针缠绕，法线朝外）— 柱体着色与背面剔除依赖缠绕方向 */
export function boxFaces(min, max) {
  const [x0, y0, z0] = min
  const [x1, y1, z1] = max
  return {
    // 底面（法线 -Z）
    bottom: [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]],
    // 顶面（法线 +Z）
    top: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    // 前（-Y）
    front: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
    // 后（+Y）
    back: [[x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]],
    // 左（-X）
    left: [[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]],
    // 右（+X）
    right: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]],
  }
}

/** 相机朝向与某点法线的夹角余弦 — 背面剔除与光照都基于它 */
export function facingDot(eye, centroid, normal) {
  const toEye = v3norm(v3sub(eye, centroid))
  const n = v3norm(normal)
  if (v3cross(toEye, n).every((v) => v === 0)) return 0
  return toEye[0] * n[0] + toEye[1] * n[1] + toEye[2] * n[2]
}
