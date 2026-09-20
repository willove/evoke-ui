/**
 * 三维数学内核 — 向量与 4×4 齐次矩阵
 *
 * 约定：
 *   · 向量是普通数组 [x, y, z]，不引入类实例，便于序列化与测试断言
 *   · 矩阵是长度 16 的扁平数组，**列主序**（元素下标 = 列 * 4 + 行），与 WebGL 同构，
 *     这样 perspective / lookAt 的经典公式可以逐字套用，不必做转置心算
 *   · 世界坐标系为 Z 轴向上（图表语义：X 类目、Y 系列、Z 数值即高度），
 *     因此相机 up 向量取 [0,0,1]
 */

export function v3(x = 0, y = 0, z = 0) {
  return [x, y, z]
}

export function v3add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function v3sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

export function v3scale(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s]
}

export function v3dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function v3cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

export function v3len(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
}

export function v3dist(a, b) {
  return v3len(v3sub(a, b))
}

export function v3norm(a) {
  const l = v3len(a)
  if (l < 1e-12) return [0, 0, 0]
  return [a[0] / l, a[1] / l, a[2] / l]
}

export function v3lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/** 有限性检查 — 投影后出现 NaN/Infinity 的图元必须被丢弃，否则污染整条绘制链 */
export function v3finite(a) {
  return Number.isFinite(a[0]) && Number.isFinite(a[1]) && Number.isFinite(a[2])
}

export function mat4Identity() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}

/**
 * 矩阵乘法 out = a · b（几何语义：先施加 b 的变换，再施加 a）
 * 列主序下 out[c*4+r] = Σ a[k*4+r] * b[c*4+k]
 */
export function mat4Multiply(a, b) {
  const out = new Array(16)
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3]
    }
  }
  return out
}

/**
 * 透视投影矩阵（右手系，相机看向 -Z）
 * @param {number} fovY 垂直视场角（弧度）
 * @param {number} aspect 宽高比
 */
export function mat4Perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2)
  const nf = 1 / (near - far)
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]
}

/**
 * 视图矩阵 — 把世界变换到相机空间（相机在原点看向 -Z）
 */
export function mat4LookAt(eye, center, up) {
  let z = v3sub(eye, center)
  z = v3norm(z)
  if (v3len(z) < 1e-12) z = [0, 0, 1]
  let x = v3cross(up, z)
  if (v3len(x) < 1e-12) {
    // 视线与 up 共线（俯仰贴到极点）时退化：换一根参考轴，保证基向量仍然正交
    x = v3cross([0, 1, 0], z)
    if (v3len(x) < 1e-12) x = v3cross([1, 0, 0], z)
  }
  x = v3norm(x)
  const y = v3cross(z, x)
  return [
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -v3dot(x, eye), -v3dot(y, eye), -v3dot(z, eye), 1,
  ]
}

export function mat4Translate(t) {
  const m = mat4Identity()
  m[12] = t[0]
  m[13] = t[1]
  m[14] = t[2]
  return m
}

export function mat4Scale(s) {
  const m = mat4Identity()
  m[0] = s[0]
  m[5] = s[1]
  m[10] = s[2]
  return m
}

export function mat4RotateX(rad) {
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]
}

export function mat4RotateY(rad) {
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]
}

export function mat4RotateZ(rad) {
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}

export function mat4Transpose(m) {
  return [
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15],
  ]
}

/**
 * 逆矩阵（伴随矩阵法）。奇异矩阵返回 null，由调用方决定降级策略。
 */
export function mat4Invert(m) {
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3]
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7]
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11]
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15]

  const b00 = a00 * a11 - a01 * a10
  const b01 = a00 * a12 - a02 * a10
  const b02 = a00 * a13 - a03 * a10
  const b03 = a01 * a12 - a02 * a11
  const b04 = a01 * a13 - a03 * a11
  const b05 = a02 * a13 - a03 * a12
  const b06 = a20 * a31 - a21 * a30
  const b07 = a20 * a32 - a22 * a30
  const b08 = a20 * a33 - a23 * a30
  const b09 = a21 * a32 - a22 * a31
  const b10 = a21 * a33 - a23 * a31
  const b11 = a22 * a33 - a23 * a32

  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
  if (Math.abs(det) < 1e-12) return null
  const d = 1 / det

  return [
    (a11 * b11 - a12 * b10 + a13 * b09) * d,
    (a02 * b10 - a01 * b11 - a03 * b09) * d,
    (a31 * b05 - a32 * b04 + a33 * b03) * d,
    (a22 * b04 - a21 * b05 - a23 * b03) * d,
    (a12 * b08 - a10 * b11 - a13 * b07) * d,
    (a00 * b11 - a02 * b08 + a03 * b07) * d,
    (a32 * b02 - a30 * b05 - a33 * b01) * d,
    (a20 * b05 - a22 * b02 + a23 * b01) * d,
    (a10 * b10 - a11 * b08 + a13 * b06) * d,
    (a01 * b08 - a00 * b10 - a03 * b06) * d,
    (a30 * b04 - a31 * b02 + a33 * b00) * d,
    (a21 * b02 - a20 * b04 - a23 * b00) * d,
    (a11 * b07 - a10 * b09 - a12 * b06) * d,
    (a00 * b09 - a01 * b07 + a02 * b06) * d,
    (a31 * b01 - a30 * b03 - a32 * b00) * d,
    (a20 * b03 - a21 * b01 + a22 * b00) * d,
  ]
}

/** 齐次变换 — 返回未做透视除法的 [x, y, z, w] */
export function transformPoint4(m, p) {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
    m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15],
  ]
}

/** 仿射变换（w 恒为 1）— 仅适用于平移/旋转/缩放矩阵 */
export function transformPoint(m, p) {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ]
}

/** 方向向量变换 — 忽略平移分量 */
export function transformDirection(m, d) {
  return [
    m[0] * d[0] + m[4] * d[1] + m[8] * d[2],
    m[1] * d[0] + m[5] * d[1] + m[9] * d[2],
    m[2] * d[0] + m[6] * d[1] + m[10] * d[2],
  ]
}

/**
 * 裁剪空间 → 屏幕坐标
 *
 * depth 取齐次 w：透视投影下 w 恒等于「相机轴向上的视深」，
 * 这正是画家算法需要的排序键（近处小、远处大），比欧氏距离更适合排序，
 * 且天然处理了透视缩放。
 *
 * w ≤ 0 表示顶点落在相机身后，直接判为不可见 —— 若照常除法则坐标会翻折到
 * 画面另一侧，出现「穿透」的鬼影线条。
 */
export function projectPoint(mvp, viewport, p) {
  const c = transformPoint4(mvp, p)
  const w = c[3]
  if (!(w > 1e-6) || !Number.isFinite(w)) {
    return { x: NaN, y: NaN, z: NaN, depth: Infinity, visible: false }
  }
  const inv = 1 / w
  const ndcX = c[0] * inv
  const ndcY = c[1] * inv
  const ndcZ = c[2] * inv
  return {
    x: viewport.x + (ndcX * 0.5 + 0.5) * viewport.width,
    y: viewport.y + (1 - (ndcY * 0.5 + 0.5)) * viewport.height,
    z: ndcZ,
    depth: w,
    visible: Number.isFinite(ndcX) && Number.isFinite(ndcY),
  }
}

/** 多边形质心（顶点算术平均，用于深度排序键与法线取点） */
export function polygonCentroid(points) {
  if (!points.length) return [0, 0, 0]
  let x = 0
  let y = 0
  let z = 0
  for (const p of points) {
    x += p[0]
    y += p[1]
    z += p[2]
  }
  const n = points.length
  return [x / n, y / n, z / n]
}

/**
 * 多边形法线（Newell 法）
 * 相比任取两条边的叉乘，Newell 法对非严格平面多边形与顶点缠绕误差更稳，
 * 且顺带给出面积加权的方向 —— 曲面上大量小面片时这点很关键。
 */
export function polygonNormal(points) {
  let nx = 0
  let ny = 0
  let nz = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const a = points[i]
    const b = points[(i + 1) % n]
    nx += (a[1] - b[1]) * (a[2] + b[2])
    ny += (a[2] - b[2]) * (a[0] + b[0])
    nz += (a[0] - b[0]) * (a[1] + b[1])
  }
  return v3norm([nx, ny, nz])
}
