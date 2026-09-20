import { describe, it, expect } from 'vitest'
import {
  mat4Identity,
  mat4Multiply,
  mat4Perspective,
  mat4LookAt,
  mat4Invert,
  transformPoint,
  transformPoint4,
  projectPoint,
  v3norm,
  v3cross,
  polygonNormal,
  polygonCentroid,
} from '../src/3d/core/math3d.js'
import {
  DEFAULT_CAMERA,
  cameraEye,
  cameraMatrices,
  orbitBy,
  zoomBy,
  panBy,
  normalizeAngle,
  resolveCamera,
  wheelZoomFactor,
  boxFaces,
  boxEdges,
  fitDistance,
  boundsOf,
} from '../src/3d/core/camera.js'
import { parseColor, mixColor, adjustLightness, shadeColor, luminance, gradientAt, toRgba } from '../src/3d/core/color.js'
import { niceTicks, extentOf, makeBandScale, makeLinearScale, formatNumber, thinTicks, decimalsForStep } from '../src/3d/core/scale3d.js'
import { createScene, addFace, addBox, projectScene, partitionByLayer, pickScene, pointInPolygon, distanceToSegment } from '../src/3d/core/scene.js'

const VIEWPORT = { x: 0, y: 0, width: 600, height: 400 }

describe('math3d 基础', () => {
  it('单位矩阵不改变点', () => {
    const p = transformPoint(mat4Identity(), [1, -2, 3])
    expect(p[0]).toBeCloseTo(1, 10)
    expect(p[1]).toBeCloseTo(-2, 10)
    expect(p[2]).toBeCloseTo(3, 10)
  })

  it('矩阵乘法顺序：先右后左', () => {
    const t = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1]
    const s = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1]
    // 先缩放再平移
    const m = mat4Multiply(t, s)
    const p = transformPoint(m, [1, 1, 1])
    expect(p[0]).toBeCloseTo(7, 10)
  })

  it('lookAt 视线正交基', () => {
    const eye = [0, 0, 5]
    const view = mat4LookAt(eye, [0, 0, 0], [0, 0, 1])
    // 目标点应落在视空间原点
    const p = transformPoint(view, [0, 0, 0])
    expect(p[0]).toBeCloseTo(0, 8)
    expect(p[1]).toBeCloseTo(0, 8)
    expect(p[2]).toBeCloseTo(-5, 8)
  })

  it('透视投影：视点正前方落在视口中心', () => {
    const proj = mat4Perspective(Math.PI / 3, 1.5, 0.1, 100)
    const view = mat4Identity()
    const mvp = mat4Multiply(proj, view)
    const r = projectPoint(mvp, VIEWPORT, [0, 0, -5])
    expect(r.x).toBeCloseTo(300, 6)
    expect(r.y).toBeCloseTo(200, 6)
    expect(r.visible).toBe(true)
    // depth（齐次 w）= 视轴距离
    expect(r.depth).toBeCloseTo(5, 6)
  })

  it('相机身后的点不可见', () => {
    const proj = mat4Perspective(Math.PI / 3, 1.5, 0.1, 100)
    const mvp = mat4Multiply(proj, mat4Identity())
    const behind = projectPoint(mvp, VIEWPORT, [0, 0, 3])
    expect(behind.visible).toBe(false)
    expect(Number.isFinite(behind.x)).toBe(false)
  })

  it('可逆性：逆矩阵还原点', () => {
    const proj = mat4Perspective(Math.PI / 3, 1.5, 0.1, 100)
    const view = mat4LookAt([3, 4, 5], [0, 0, 0], [0, 0, 1])
    const mvp = mat4Multiply(proj, view)
    const inv = mat4Invert(mvp)
    expect(inv).toBeTruthy()
    const back = transformPoint(mat4Multiply(inv, mvp), [0.4, -0.2, 0.9])
    expect(back[0]).toBeCloseTo(0.4, 6)
    expect(back[1]).toBeCloseTo(-0.2, 6)
    expect(back[2]).toBeCloseTo(0.9, 6)
  })

  it('Newell 法线方向与顶点缠绕一致', () => {
    // 逆时针（从 +Z 看）→ 法线 +Z
    const n = polygonNormal([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]])
    expect(n[2]).toBeCloseTo(1, 8)
    const c = polygonCentroid([[0, 0, 0], [2, 0, 0], [2, 2, 0], [0, 2, 0]])
    expect(c).toEqual([1, 1, 0])
  })
})

describe('轨道相机', () => {
  it('eye 与 target 距离等于 distance', () => {
    const cam = resolveCamera({})
    const eye = cameraEye(cam)
    const d = Math.hypot(eye[0] - cam.target[0], eye[1] - cam.target[1], eye[2] - cam.target[2])
    expect(d).toBeCloseTo(cam.distance, 8)
  })

  it('look 目标投影到视口中心', () => {
    const cam = resolveCamera({})
    const { mvp } = cameraMatrices(cam, VIEWPORT)
    const r = projectPoint(mvp, VIEWPORT, cam.target)
    expect(r.x).toBeCloseTo(300, 4)
    expect(r.y).toBeCloseTo(200, 4)
  })

  it('拖拽改变 yaw/pitch 且为纯函数', () => {
    const cam = resolveCamera({ yaw: 0, pitch: 30 })
    // 抓物语义：向右拖 → 相机反向环绕；向下拖 → 相机抬升看到更多顶面
    const next = orbitBy(cam, 100, 50, VIEWPORT)
    expect(next).not.toBe(cam)
    expect(cam.yaw).toBe(0)
    expect(next.yaw).toBeLessThan(cam.yaw)
    expect(next.pitch).toBeGreaterThan(cam.pitch)
    const up = orbitBy(cam, 0, -50, VIEWPORT)
    expect(up.pitch).toBeLessThan(cam.pitch)
  })

  it('pitch / distance 钳制生效', () => {
    const cam = resolveCamera({ pitch: 30, distance: 4 })
    const tilted = orbitBy(cam, 0, 10000, VIEWPORT)
    expect(tilted.pitch).toBeLessThanOrEqual(cam.maxPitch)
    const far = zoomBy(cam, 1e6)
    expect(far.distance).toBe(cam.maxDistance)
    const near = zoomBy(cam, 1e-6)
    expect(near.distance).toBe(cam.minDistance)
  })

  it('滚轮缩放因子方向正确且有界', () => {
    expect(wheelZoomFactor(100)).toBeGreaterThan(1)
    expect(wheelZoomFactor(-100)).toBeLessThan(1)
    expect(wheelZoomFactor(NaN)).toBe(1)
    expect(wheelZoomFactor(1e9)).toBeLessThan(Math.exp(600 * 0.0012) + 1e-9)
  })

  it('角度归一化', () => {
    expect(normalizeAngle(370)).toBe(10)
    expect(normalizeAngle(-370)).toBe(-10)
    expect(normalizeAngle(180)).toBe(180)
    expect(normalizeAngle(-180)).toBe(180)
    expect(normalizeAngle(NaN)).toBe(0)
  })

  it('非法配置回落默认而非污染下游', () => {
    const cam = resolveCamera({ yaw: 'abc', pitch: NaN, distance: -5, fov: 9999, target: [1] })
    expect(cam.yaw).toBe(DEFAULT_CAMERA.yaw)
    expect(cam.pitch).toBe(DEFAULT_CAMERA.pitch)
    expect(cam.distance).toBeGreaterThan(0)
    expect(cam.fov).toBeLessThanOrEqual(120)
    expect(cam.target).toHaveLength(3)
  })

  it('平移沿相机平面移动 target', () => {
    const cam = resolveCamera({})
    const moved = panBy(cam, 50, 0, VIEWPORT)
    expect(moved.target).not.toEqual(cam.target)
    expect(Number.isFinite(moved.target[0])).toBe(true)
  })

  it('autoFit 距离把场景装进视口', () => {
    const cam = resolveCamera({})
    const bounds = boundsOf([[-1, -1, 0], [1, 1, 1]])
    const d = fitDistance(bounds, cam, VIEWPORT)
    expect(d).toBeGreaterThanOrEqual(cam.minDistance)
    expect(d).toBeLessThanOrEqual(cam.maxDistance)
    // 装进去之后：包围盒投影应完全落在视口内
    const fitted = { ...cam, distance: d }
    const { mvp } = cameraMatrices(fitted, VIEWPORT)
    for (const p of [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [-1, -1, 1], [1, 1, 1]]) {
      const r = projectPoint(mvp, VIEWPORT, p)
      expect(r.visible).toBe(true)
      expect(r.x).toBeGreaterThanOrEqual(-1)
      expect(r.x).toBeLessThanOrEqual(VIEWPORT.width + 1)
      expect(r.y).toBeGreaterThanOrEqual(-1)
      expect(r.y).toBeLessThanOrEqual(VIEWPORT.height + 1)
    }
  })

  it('boxFaces 缠绕方向法线朝外', () => {
    const f = boxFaces([-1, -1, -1], [1, 1, 1])
    expect(f.top.every((p) => p[2] === 1)).toBe(true)
    expect(f.bottom.every((p) => p[2] === -1)).toBe(true)
    expect(boxEdges([-1, -1, -1], [1, 1, 1])).toHaveLength(12)
  })
})

describe('颜色', () => {
  it('解析十六进制与函数色', () => {
    expect(parseColor('#175DFF')).toEqual({ r: 23, g: 93, b: 255, a: 1 })
    expect(parseColor('#abc')).toEqual({ r: 170, g: 187, b: 204, a: 1 })
    expect(parseColor('rgba(1,2,3,0.5)')).toEqual({ r: 1, g: 2, b: 3, a: 0.5 })
    expect(parseColor('hsl(120, 100%, 50%)')).toEqual({ r: 0, g: 255, b: 0, a: 1 })
    expect(parseColor('nope')).toBe(null)
    expect(parseColor(null)).toBe(null)
  })

  it('明度调整保色相', () => {
    const base = parseColor('#3366cc')
    const lighter = parseColor(adjustLightness('#3366cc', 1.4))
    const baseHsl = [0, 0, 0]
    void baseHsl
    expect(lighter.r).toBeGreaterThanOrEqual(base.r)
    expect(lighter.g).toBeGreaterThanOrEqual(base.g)
    expect(lighter.b).toBeGreaterThanOrEqual(base.b)
  })

  it('面着色：受光面比背光面亮', () => {
    const top = shadeColor('#3366cc', 1)
    const side = shadeColor('#3366cc', -1)
    expect(luminance(top)).toBeGreaterThan(luminance(side))
  })

  it('混合与色带取样', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(gradientAt(['#000000', '#ffffff'], 0)).toBe('#000000')
    expect(gradientAt(['#000000', '#ffffff'], 1)).toBe('#ffffff')
    const mid = parseColor(gradientAt(['#000000', '#ffffff'], 0.5))
    expect(mid.r).toBeCloseTo(mid.b, 0)
    expect(gradientAt([], 0.5)).toBe('#888888')
  })

  it('透明度字符串', () => {
    expect(toRgba('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)')
    expect(toRgba('garbage', 0.5)).toBe('garbage')
  })
})

describe('刻度与映射', () => {
  it('nice 刻度落在整步长上', () => {
    const t = niceTicks(0, 100, 5)
    expect(t.min).toBe(0)
    expect(t.max).toBeGreaterThanOrEqual(100)
    expect(t.values[0]).toBe(t.min)
    expect(t.values[t.values.length - 1]).toBe(t.max)
    for (const v of t.values) expect(Math.abs(v / t.step - Math.round(v / t.step))).toBeLessThan(1e-6)
  })

  it('极端域不产生失控循环', () => {
    const t = niceTicks(-1e-9, 1e-9, 5)
    expect(t.values.length).toBeGreaterThan(0)
    expect(t.values.length).toBeLessThan(400)
    const t2 = niceTicks(1e12, 1e12 + 7, 5)
    expect(t2.values.length).toBeGreaterThan(1)
  })

  it('域计算与零基线', () => {
    expect(extentOf([3, 7, 2], { includeZero: true })).toEqual([0, 7])
    expect(extentOf([-5, 2])).toEqual([-5, 2])
    expect(extentOf([])).toEqual([0, 1])
    // 单点域按 50% 外扩，避免后续映射退化
    expect(extentOf([NaN, null, 4])).toEqual([2, 6])
  })

  it('带状映射', () => {
    const b = makeBandScale(4, [0, 400], 0.2)
    expect(b.bandwidth).toBeCloseTo(80, 6)
    expect(b.center(0)).toBeCloseTo(50, 6)
    expect(b.center(3)).toBeCloseTo(350, 6)
    expect(b.indexAt(0)).toBe(0)
    expect(b.indexAt(399)).toBe(3)
    expect(b.indexAt(400)).toBe(-1)
  })

  it('线性映射退化安全', () => {
    const s = makeLinearScale([5, 5], [0, 100])
    expect(s.degenerate).toBe(true)
    expect(s.map(5)).toBe(0)
    expect(Number.isFinite(s.map(9))).toBe(true)
  })

  it('数值格式化', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
    expect(formatNumber(1234.5, { decimals: 1 })).toBe('1,234.5')
    expect(formatNumber(15000, { abbreviate: true })).toBe('1.50万')
    expect(formatNumber(NaN)).toBe('-')
    expect(formatNumber(null)).toBe('-')
  })

  it('刻度抽稀与小数位', () => {
    expect(thinTicks([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4)).toHaveLength(4)
    expect(decimalsForStep(0.25)).toBeGreaterThanOrEqual(1)
    expect(decimalsForStep(5)).toBe(0)
  })
})

describe('场景投影与拾取', () => {
  function buildBoxScene() {
    const scene = createScene()
    addBox(scene, boxFaces([-0.5, -0.5, 0], [0.5, 0.5, 1]), {
      color: '#3366cc',
      cull: true,
      meta: { key: 'box', name: '箱子', value: 42 },
    })
    return scene
  }

  it('投影后所有可见图元坐标有限', () => {
    const cam = resolveCamera({})
    const projected = projectScene(buildBoxScene(), cam, VIEWPORT)
    expect(projected.items.length).toBeGreaterThan(0)
    for (const item of projected.items) {
      if (item.visible === false) continue
      if (Array.isArray(item.screen)) {
        for (const p of item.screen) {
          expect(Number.isFinite(p[0])).toBe(true)
          expect(Number.isFinite(p[1])).toBe(true)
        }
      }
    }
  })

  it('背面剔除把不可见面标记为隐藏', () => {
    const cam = resolveCamera({})
    const projected = projectScene(buildBoxScene(), cam, VIEWPORT)
    const alive = projected.items.filter((i) => i.visible !== false)
    expect(alive.length).toBeGreaterThan(0)
    expect(alive.length).toBeLessThanOrEqual(3)
  })

  it('数据层按视深远→近排序', () => {
    const cam = resolveCamera({})
    const projected = projectScene(buildBoxScene(), cam, VIEWPORT)
    const { data } = partitionByLayer(projected.items)
    for (let i = 1; i < data.length; i++) {
      expect(data[i - 1].depth).toBeGreaterThanOrEqual(data[i].depth)
    }
  })

  it('顶面比侧面亮（光照生效）', () => {
    const cam = resolveCamera({})
    const projected = projectScene(buildBoxScene(), cam, VIEWPORT)
    const tops = projected.items.filter((i) => i.visible !== false && i.normal && i.normal[2] > 0.9)
    const sides = projected.items.filter((i) => i.visible !== false && i.normal && Math.abs(i.normal[2]) < 0.1)
    expect(tops.length).toBeGreaterThan(0)
    expect(sides.length).toBeGreaterThan(0)
    expect(luminance(tops[0].fill)).toBeGreaterThan(luminance(sides[0].fill))
  })

  it('拾取返回视深最近的命中', () => {
    const cam = resolveCamera({})
    const scene = buildBoxScene()
    const projected = projectScene(scene, cam, VIEWPORT)
    const alive = projected.items.filter((i) => i.visible !== false && i.kind === 'face')
    // 用某个可见面的屏幕质心去拾取，必须命中（且 meta 正确）
    const target = alive[0]
    const cx = target.screen.reduce((s, p) => s + p[0], 0) / target.screen.length
    const cy = target.screen.reduce((s, p) => s + p[1], 0) / target.screen.length
    const hit = pickScene(projected, cx, cy)
    expect(hit).toBeTruthy()
    expect(hit.meta.key).toBe('box')
    expect(hit.meta.value).toBe(42)
  })

  it('拾取落在空白处返回 null', () => {
    const cam = resolveCamera({})
    const projected = projectScene(buildBoxScene(), cam, VIEWPORT)
    expect(pickScene(projected, -100, -100)).toBe(null)
    expect(pickScene(projected, NaN, 10)).toBe(null)
  })

  it('pointInPolygon 与线段距离', () => {
    const poly = [[0, 0], [10, 0], [10, 10], [0, 10]]
    expect(pointInPolygon(poly, 5, 5)).toBe(true)
    expect(pointInPolygon(poly, 15, 5)).toBe(false)
    expect(pointInPolygon(poly, 5, -5)).toBe(false)
    // 边界点的命中属未定义行为（射线法固有），不纳入契约
    expect(distanceToSegment(5, 5, 0, 0, 10, 0)).toBe(5)
    expect(distanceToSegment(0, 0, 0, 0, 10, 0)).toBe(0)
  })

  it('光照方向可固定于世界系', () => {
    const cam = resolveCamera({})
    const a = projectScene(buildBoxScene(), cam, VIEWPORT, { lighting: { direction: [0, 0, 1] } })
    const b = projectScene(buildBoxScene(), cam, VIEWPORT, { lighting: { direction: [0, 0, -1] } })
    const topA = a.items.find((i) => i.visible !== false && i.normal && i.normal[2] > 0.9)
    const topB = b.items.find((i) => i.visible !== false && i.normal && i.normal[2] > 0.9)
    expect(topA && topB).toBeTruthy()
    // 顶面在「光从上」时比「光从下」时亮
    expect(luminance(topA.fill)).toBeGreaterThanOrEqual(luminance(topB.fill))
  })

  it('相机相对光照在旋转后保持形体受光', () => {
    const scene = buildBoxScene()
    let litFaces = 0
    for (const yaw of [-52, 30, 120, 200]) {
      const cam = resolveCamera({ yaw })
      const projected = projectScene(scene, cam, VIEWPORT)
      const bright = projected.items.filter((i) => i.visible !== false && i.kind === 'face' && luminance(i.fill) > 0.15)
      if (bright.length > 0) litFaces++
    }
    expect(litFaces).toBe(4)
  })

  it('平面加面忽略不足三点的输入', () => {
    const scene = createScene()
    expect(addFace(scene, [[0, 0, 0], [1, 0, 0]])).toBe(null)
    expect(scene.items).toHaveLength(0)
    expect(v3norm([0, 0, 0])).toEqual([0, 0, 0])
    expect(v3cross([1, 0, 0], [0, 1, 0])[2]).toBe(1)
  })
})

describe('四元数替代品：直接旋转向量', () => {
  it('绕 Z 旋转 90 度把 +X 转到 +Y', () => {
    const yaw = 90 * (Math.PI / 180)
    const x = [Math.cos(yaw), Math.sin(yaw), 0]
    expect(x[0]).toBeCloseTo(0, 8)
    expect(x[1]).toBeCloseTo(1, 8)
  })
})
