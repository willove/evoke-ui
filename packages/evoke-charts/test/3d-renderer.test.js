import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render3d } from '../src/3d/renderer/index.js'
import { createSvgRecorder } from '../src/3d/renderer/svgRecorder.js'
import { pointInPolygon } from '../src/3d/core/scene.js'

/** 纯 ctx 存根：记录调用次数，measureText 给固定宽度 */
function stubCtx() {
  const calls = new Map()
  const target = {
    measureText: () => ({ width: 24 }),
    canvas: { width: 600, height: 400 },
  }
  const proxy = new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop]
      if (!calls.has(prop)) calls.set(prop, vi.fn())
      return calls.get(prop)
    },
    set(obj, prop, value) {
      obj[prop] = value
      return true
    },
  })
  proxy.__calls = calls
  return proxy
}

function fakeCanvas(ctx) {
  return { width: 600, height: 400, getContext: () => ctx }
}

const THEME = {
  isDark: false,
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: 'transparent',
  textColor: '#1f2937',
  textColorSecondary: '#6b7280',
  gridColor: 'rgba(31,41,55,0.10)',
  wallColor: 'rgba(31,41,55,0.035)',
  borderColor: 'rgba(31,41,55,0.16)',
  highlightColor: 'rgba(23,93,255,0.16)',
  fontFamily: 'sans-serif',
}

const BAR_OPTIONS = () => ({
  type: 'bar3d',
  labels: ['一月', '二月', '三月', '四月'],
  series: [
    { name: '华东', data: [120, 200, 150, 80] },
    { name: '华南', data: [90, 60, 130, 170] },
  ],
})

function renderParams(overrides = {}) {
  return {
    options: BAR_OPTIONS(),
    dpr: 1,
    progress: 1,
    hiddenSeries: new Set(),
    hoverKey: null,
    theme: THEME,
    ...overrides,
  }
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.classList.remove('dark')
})

describe('render3d 管线', () => {
  it('柱状图：产生可见图元、可拾取目标与图例', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams())
    expect(result.stats.total).toBeGreaterThan(0)
    expect(result.stats.pickable).toBe(8) // 2 系列 × 4 类目
    expect(result.legend.items).toHaveLength(2)
    expect(result.viewport.width).toBeGreaterThan(0)
    // 有实际绘制调用发生；轴标签（类目/系列/刻度/轴名）必须真实出画，
    // 只数 fillText 总量会被标题图例掩盖，这里给到明确下限
    expect(ctx.__calls.get('fill')?.mock.calls.length ?? 0).toBeGreaterThan(0)
    expect(ctx.__calls.get('fillText')?.mock.calls.length ?? 0).toBeGreaterThan(8)
  })

  it('柱状图：拾取命中柱体并带完整元数据', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams())
    const faces = result.projected.items.filter((i) => i.visible !== false && i.pickable && i.kind === 'face')
    expect(faces.length).toBeGreaterThan(0)
    const target = faces[0]
    const cx = target.screen.reduce((s, p) => s + p[0], 0) / target.screen.length
    const cy = target.screen.reduce((s, p) => s + p[1], 0) / target.screen.length
    const hit = result.pickAt(cx, cy)
    expect(hit).toBeTruthy()
    expect(hit.meta.type).toBe('bar3d')
    expect(hit.meta.seriesName).toBe('华东')
    expect(hit.meta.value).toBe(120)
    expect(hit.meta.key).toBe('bar:0:0')
  })

  it('隐藏系列：不参与绘制与拾取，图例保留隐藏项（半透明态）', () => {
    const ctx = stubCtx()
    const full = render3d(fakeCanvas(ctx), renderParams())
    const hidden = render3d(fakeCanvas(ctx), renderParams({ hiddenSeries: new Set(['华南']) }))
    expect(hidden.stats.total).toBeLessThan(full.stats.total)
    // 图例保留全量项并带隐藏标记，用户能再点回来
    expect(hidden.legend.items.map((i) => i.name)).toEqual(['华东', '华南'])
    expect(hidden.legend.items.find((i) => i.name === '华南').hidden).toBe(true)
    expect(hidden.stats.pickable).toBe(4)
  })

  it('悬浮强调：hoverKey 透传到绘制', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams({ hoverKey: 'bar:0:1' }))
    expect(result.stats.pickable).toBe(8)
  })

  it('折线图：数据点可拾取且带投影参照线', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams({
      options: {
        type: 'line3d',
        labels: ['Q1', 'Q2', 'Q3'],
        series: [{ name: '营收', data: [10, 40, 25] }],
        line: { area: true },
      },
    }))
    const points = result.projected.items.filter((i) => i.kind === 'point' && i.pickable)
    expect(points).toHaveLength(3)
    expect(result.pickAt(points[0].screen.x, points[0].screen.y)).toBeTruthy()
    // 投影参照线存在（back 层虚线）
    const backLines = result.projected.items.filter((i) => i.kind === 'line' && i.layer === 'back')
    expect(backLines.length).toBeGreaterThan(0)
  })

  it('散点图：三元组模式走数值三轴', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams({
      options: {
        type: 'scatter3d',
        scatterData: [[1, 2, 3], [2, 3, 6], [3, 1, 4.5], [4, 4, 9]],
        scatter: { size: 6 },
      },
    }))
    const points = result.projected.items.filter((i) => i.kind === 'point' && i.pickable)
    expect(points).toHaveLength(4)
    expect(result.colorScale).toBe(null)
    const hit = result.pickAt(points[0].screen.x, points[0].screen.y)
    expect(hit.meta.x).toBe(1)
    expect(hit.meta.z).toBe(3)
  })

  it('散点图：colorScale 开启后返回色标并给点着色带色', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams({
      options: {
        type: 'scatter3d',
        scatterData: [[1, 1, 1], [2, 2, 5], [3, 3, 9]],
        scatter: { colorScale: true },
      },
    }))
    expect(result.colorScale).toBeTruthy()
    expect(result.colorScale.min).toBe(1)
    expect(result.colorScale.max).toBe(9)
    const points = result.projected.items.filter((i) => i.kind === 'point' && i.pickable)
    const colors = new Set(points.map((p) => p.color))
    expect(colors.size).toBeGreaterThan(1)
  })

  it('散点图：类目模式（labels + 标量系列）', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams({
      options: {
        type: 'scatter3d',
        labels: ['A', 'B', 'C'],
        series: [{ name: 'S', data: [1, 2, 3] }],
      },
    }))
    const points = result.projected.items.filter((i) => i.kind === 'point' && i.pickable)
    expect(points).toHaveLength(3)
    expect(points[0].meta.name).toBe('A')
  })

  it('曲面图：面片 + 线框 + 色标，可拾取', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams({
      options: {
        type: 'surface3d',
        surfaceData: {
          x: [0, 1, 2],
          y: [0, 1, 2],
          z: [
            [0, 1, 2],
            [1, 2, 3],
            [2, 3, 8],
          ],
        },
      },
    }))
    const faces = result.projected.items.filter((i) => i.kind === 'face' && i.pickable)
    expect(faces).toHaveLength(4) // 2×2 网格
    expect(result.colorScale).toBeTruthy()
    const hit = result.pickAt(faces[0].screen[0][0], faces[0].screen[0][1])
    expect(hit).toBeTruthy()
    expect(hit.meta.type).toBe('surface3d')
  })

  it('饼图：扇区可拾取，占比与总计入元数据', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams({
      options: {
        type: 'pie3d',
        pieData: [
          { name: 'A', value: 60 },
          { name: 'B', value: 30 },
          { name: 'C', value: 10 },
        ],
      },
    }))
    const faces = result.projected.items.filter((i) => i.kind === 'face' && i.pickable)
    expect(faces.length).toBeGreaterThan(0)
    const target = faces[0]
    const cx = target.screen.reduce((s, p) => s + p[0], 0) / target.screen.length
    const cy = target.screen.reduce((s, p) => s + p[1], 0) / target.screen.length
    const hit = result.pickAt(cx, cy)
    expect(hit.meta.name).toBeTruthy()
    expect(hit.meta.percent).toBeGreaterThan(0)
    expect(hit.meta.total).toBe(100)
  })

  it('饼图：环形（innerRadius）产生内侧弧面', () => {
    const ctx = stubCtx()
    const solid = render3d(fakeCanvas(ctx), renderParams({
      options: { type: 'pie3d', pieData: [{ name: 'A', value: 1 }, { name: 'B', value: 1 }] },
    }))
    const ring = render3d(fakeCanvas(ctx), renderParams({
      options: { type: 'pie3d', pieData: [{ name: 'A', value: 1 }, { name: 'B', value: 1 }], pie: { innerRadius: 0.2 } },
    }))
    const countItems = (r) => r.projected.items.filter((i) => i.visible !== false).length
    expect(countItems(ring)).toBeGreaterThan(countItems(solid))
  })

  it('未知图型：不抛错且给出 unknownType 标记', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams({ options: { type: 'nope' } }))
    expect(result.stats.unknownType).toBe('nope')
    expect(result.pickAt(10, 10)).toBe(null)
  })

  it('进度动画：progress=0 时柱体压扁为贴地薄片', () => {
    const ctx = stubCtx()
    const full = render3d(fakeCanvas(ctx), renderParams())
    const zero = render3d(fakeCanvas(ctx), renderParams({ progress: 0 }))
    // 场景 bbox 由柱底足迹的地面分布主导，压扁不会归零；
    // 真正该收敛的是「单个面片的竖向跨度」——侧立面在满高时纵贯整根柱子
    const metrics = (r) => {
      const faces = r.projected.items.filter((i) => i.visible !== false && i.kind === 'face' && i.pickable)
      expect(faces.length).toBeGreaterThan(0)
      let minY = Infinity
      let maxY = -Infinity
      let maxFaceSpan = 0
      for (const f of faces) {
        let fMin = Infinity
        let fMax = -Infinity
        for (const p of f.screen) {
          minY = Math.min(minY, p[1])
          maxY = Math.max(maxY, p[1])
          fMin = Math.min(fMin, p[1])
          fMax = Math.max(fMax, p[1])
        }
        maxFaceSpan = Math.max(maxFaceSpan, fMax - fMin)
      }
      return { sceneSpan: maxY - minY, maxFaceSpan }
    }
    const mFull = metrics(full)
    const mZero = metrics(zero)
    // 柱体生长确实增加了场景高度
    expect(mFull.sceneSpan).toBeGreaterThan(mZero.sceneSpan * 1.15)
    // 单面片竖向跨度：贴地薄片远小于满高侧立面
    expect(mZero.maxFaceSpan).toBeLessThan(mFull.maxFaceSpan * 0.35)
  })
})

describe('render3d 相机契约', () => {
  it('params.camera 优先于 options.camera — 交互态相机必须出画', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams({
      options: { ...BAR_OPTIONS(), camera: { yaw: 10, pitch: 20, distance: 5 } },
      camera: { yaw: 120, pitch: 45, distance: 2.5, target: [0, 0, 0.31], fov: 42 },
    }))
    expect(result.camera.yaw).toBe(120)
    expect(result.camera.pitch).toBe(45)
    expect(result.camera.distance).toBe(2.5)
  })

  it('autoFit 只反解距离，不动方位与 target', () => {
    const ctx = stubCtx()
    const camera = { yaw: 120, pitch: 45, distance: 5, target: [0.2, 0, 0.31], fov: 42 }
    const result = render3d(fakeCanvas(ctx), renderParams({ camera, autoFit: true }))
    expect(result.camera.yaw).toBe(120)
    expect(result.camera.pitch).toBe(45)
    expect(result.camera.target).toEqual([0.2, 0, 0.31])
    expect(result.camera.distance).toBeLessThan(5)
  })
})

describe('坐标框棱线分层', () => {
  /** 按世界端点找线段图元（同端点的轴线/棱线取第一条即可，二者同层） */
  const findSegment = (result, a, b) => result.projected.items.find((i) => i.kind === 'line'
    && i.points.length === 2
    && i.points.some((p) => p.every((v, k) => Math.abs(v - a[k]) < 1e-9))
    && i.points.some((p) => p.every((v, k) => Math.abs(v - b[k]) < 1e-9)))

  /** 沿屏幕折线按步长采样：只看端点会漏掉「中段从柱体里穿过」这类回归 */
  const sampleAlong = (item, step = 3) => {
    const pts = item.kind === 'line' ? item.screen : [item.screen]
    const out = []
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i]
      const [bx, by] = pts[i + 1]
      const steps = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / step))
      for (let s = 0; s <= steps; s++) out.push([ax + ((bx - ax) * s) / steps, ay + ((by - ay) * s) / steps])
    }
    if (pts.length === 1) out.push([pts[0].x, pts[0].y])
    return out
  }

  /** 压顶层里仍有采样点落在「更近的数据面」之内的图元（应当为空） */
  const frontOffenders = (result) => {
    const faces = result.projected.items.filter((i) => i.visible !== false && i.layer === 'data' && i.kind === 'face' && i.meta)
    const offenders = []
    for (const item of result.projected.items) {
      if (item.visible === false || item.layer !== 'front' || item.kind === 'text') continue
      if (!item.screen) continue
      const pts = sampleAlong(item)
      const covered = pts.filter(([x, y]) => faces.some((f) => f.depth < item.depth - 1e-4 && pointInPolygon(f.screen, x, y)))
      if (covered.length) offenders.push({ points: item.points, ratio: covered.length / pts.length })
    }
    return offenders
  }

  it('远侧棱线垫底、近侧棱线压顶（默认相机在 +X / -Y 侧）', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams())
    // 远侧底边：背墙基座（y = +0.5）与远侧（x = -0.5）
    expect(findSegment(result, [-0.5, 0.5, 0], [0.5, 0.5, 0]).layer).toBe('back')
    expect(findSegment(result, [-0.5, 0.5, 0], [-0.5, -0.5, 0]).layer).toBe('back')
    // 近侧底边：X 轴基线（y = -0.5）与 Y 轴基线（x = +0.5）
    expect(findSegment(result, [-0.5, -0.5, 0], [0.5, -0.5, 0]).layer).toBe('front')
    expect(findSegment(result, [0.5, -0.5, 0], [0.5, 0.5, 0]).layer).toBe('front')
  })

  it('远角 Z 轴与远侧墙顶垫底，避免切过柱身', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams())
    expect(findSegment(result, [-0.5, 0.5, 0], [-0.5, 0.5, 0.62]).layer).toBe('back')
    expect(findSegment(result, [-0.5, 0.5, 0.62], [0.5, 0.5, 0.62]).layer).toBe('back')
  })

  it('相机退回中轴面（yaw = 0）时近侧取到的是侧棱：它连同轴基线一起垫底', () => {
    const ctx = stubCtx()
    const result = render3d(fakeCanvas(ctx), renderParams({ camera: { yaw: 0, pitch: 24, distance: 3.6, target: [0, 0, 0.31] } }))
    // x = +0.5 是真正的近侧（相机在 +X 外侧）→ 压顶
    expect(findSegment(result, [0.5, -0.5, 0], [0.5, 0.5, 0]).layer).toBe('front')
    // y = ±0.5 两条同距，都是侧棱（柱体在它们前面）→ 垫底
    expect(findSegment(result, [-0.5, -0.5, 0], [0.5, -0.5, 0]).layer).toBe('back')
    expect(findSegment(result, [-0.5, 0.5, 0], [0.5, 0.5, 0]).layer).toBe('back')
  })

  it('压顶层不再有位于数据后方的图元（棱线与 Z 轴都已被前排柱体遮住）', () => {
    // 中轴视角（yaw 0/±90/180）是取边判据的退化点，必须与斜视角一起守住
    for (const yaw of [-52, 0, 90, 180, -90]) {
      const ctx = stubCtx()
      const result = render3d(fakeCanvas(ctx), renderParams({ camera: { yaw, pitch: 24, distance: 3.6, target: [0, 0, 0.31] } }))
      expect(frontOffenders(result), `yaw=${yaw}`).toEqual([])
    }
  })
})

describe('背景面固定侧与淡出', () => {
  const at = (yaw, options = BAR_OPTIONS()) => render3d(fakeCanvas(stubCtx()), renderParams({
    options, camera: { yaw, pitch: 26, distance: 3.6, target: [0, 0, 0.31] },
  }))
  /** 背墙 = 整片落在 y = 0.5 的大四边形；alpha 为 0 时不存在 */
  const backWall = (result) => result.projected.items.find((i) => i.kind === 'face' && i.visible !== false
    && i.points.length === 4 && i.points.every((p) => Math.abs(p[1] - 0.5) < 1e-9))
  const wallAt = (result, y) => result.projected.items.find((i) => i.kind === 'face' && i.visible !== false
    && i.points.length === 4 && i.points.every((p) => Math.abs(p[1] - y) < 1e-9))
  /** 墙面网格线：按网格色筛（几何同形的远角立柱 / Z 轴是轴色，不会混入） */
  const wallGrid = (result, y = 0.5) => result.projected.items.filter((i) => i.kind === 'line'
    && i.color === THEME.gridColor && i.points.every((p) => Math.abs(p[1] - y) < 1e-9))
  const rimAt = (result, y) => result.projected.items.find((i) => i.kind === 'line' && i.points.length === 2
    && i.points.every((p) => Math.abs(p[1] - y) < 1e-9 && Math.abs(p[2] - 0.62) < 1e-9))

  it('背墙钉在 +Y 侧：转到镜像视角也不换面（旧行为会翻到 y = -0.5）', () => {
    expect(backWall(at(-52))).toBeTruthy()
    // yaw 150°：相机已到墙背面 → 整组退场，而不是把墙挪到 y = -0.5 继续画
    expect(backWall(at(150))).toBeUndefined()
    expect(wallAt(at(150), -0.5)).toBeUndefined()
  })

  it('墙内网格与墙顶棱跟着墙一起退场，背面视角不留悬空网格/棱线', () => {
    expect(wallGrid(at(-52)).length).toBeGreaterThan(0)
    expect(rimAt(at(-52), 0.5)).toBeTruthy()
    const back = at(30)
    expect(wallGrid(back)).toHaveLength(0)
    expect(rimAt(back, 0.5)).toBeUndefined()
    // 也不该整体挪到另一侧继续画（旧行为：墙组跟随相机换边）
    expect(wallGrid(back, -0.5)).toHaveLength(0)
    expect(rimAt(back, -0.5)).toBeUndefined()
  })

  it('相机越过墙面时按跨距淡出：alpha 单调下降，越过即退场', () => {
    const alphaAt = (yaw) => { const w = backWall(at(yaw)); return w ? w.alpha : 0 }
    expect(alphaAt(-52)).toBe(1)
    const before = alphaAt(-8)
    const onPlane = alphaAt(0)
    const past = alphaAt(8)
    expect(before).toBeGreaterThan(onPlane)
    expect(onPlane).toBeGreaterThan(past)
    expect(past).toBeGreaterThanOrEqual(0)
    expect(alphaAt(30)).toBe(0)
  })

  it('两片墙各自独立判定：walls=all 时侧墙（-X）在 yaw 90° 仍在场', () => {
    const sideWall = (result) => result.projected.items.find((i) => i.kind === 'face' && i.visible !== false
      && i.points.length === 4 && i.points.every((p) => Math.abs(p[0] + 0.5) < 1e-9))
    const options = { ...BAR_OPTIONS(), box: { walls: 'all' } }
    const result = at(90, options)
    expect(backWall(result)).toBeUndefined()      // 相机在 +Y 侧 → 背墙退场
    expect(sideWall(result)).toBeTruthy()         // 相机仍在侧墙正面 → 侧墙保留
  })
})

describe('render3d 健壮性', () => {
  const cases = [
    ['空 labels + 空系列', { type: 'bar3d', labels: [], series: [] }],
    ['系列 data 缺失', { type: 'bar3d', labels: ['a'], series: [{ name: 'x' }, { data: 'oops' }] }],
    ['全 NaN 数据', { type: 'bar3d', labels: ['a', 'b'], series: [{ name: 'x', data: [NaN, null] }] }],
    ['单类目单系列', { type: 'bar3d', labels: ['唯一'], series: [{ name: 'x', data: [5] }] }],
    ['极端值', { type: 'bar3d', labels: ['a', 'b'], series: [{ name: 'x', data: [1e-12, 1e12] }] }],
    ['负值', { type: 'bar3d', labels: ['a', 'b'], series: [{ name: 'x', data: [-5, 8] }] }],
    ['散点空数组', { type: 'scatter3d', scatterData: [] }],
    ['散点脏数据', { type: 'scatter3d', scatterData: [[1, 2], ['x', 'y', 'z'], [1, 2, 3]] }],
    ['曲面空矩阵', { type: 'surface3d', surfaceData: { z: [] } }],
    ['曲面锯齿矩阵', { type: 'surface3d', surfaceData: { z: [[1, 2, 3], [4], [5, 6]] } }],
    ['曲面全 NaN', { type: 'surface3d', surfaceData: { z: [[NaN, NaN]] } }],
    ['饼空数据', { type: 'pie3d', pieData: [] }],
    ['饼零值', { type: 'pie3d', pieData: [{ name: 'a', value: 0 }, { name: 'b', value: 0 }] }],
    ['饼脏数据', { type: 'pie3d', pieData: [null, { name: 'a' }, { name: 'b', value: '12' }, 7] }],
    ['折线单点', { type: 'line3d', labels: ['a'], series: [{ name: 'x', data: [3] }] }],
    ['相机越界配置', { type: 'bar3d', labels: ['a'], series: [{ name: 'x', data: [1] }], camera: { pitch: 999, distance: -3, fov: NaN } }],
    ['关闭坐标框', { type: 'bar3d', labels: ['a'], series: [{ name: 'x', data: [1] }], box: { show: false }, grid: { show: false } }],
  ]

  for (const [name, options] of cases) {
    it(`不抛错：${name}`, () => {
      const ctx = stubCtx()
      expect(() => {
        const r = render3d(fakeCanvas(ctx), renderParams({ options }))
        expect(Number.isFinite(r.viewport.width)).toBe(true)
      }).not.toThrow()
    })
  }
})

describe('SVG 录制导出', () => {
  it('三维柱状图导出为合法 SVG', () => {
    const real = stubCtx()
    const recorder = createSvgRecorder(real)
    const canvas = fakeCanvas(recorder.ctx)
    canvas.width = 600
    canvas.height = 400
    render3d(canvas, renderParams({ ctx: recorder.ctx }))
    const svg = recorder.toSvg(600, 400, '#ffffff')
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('viewBox="0 0 600 400"')
    expect(svg).toContain('<path')
    expect(svg).toContain('<text')
    // XML 完整性：能用 DOMParser 解开且无 parsererror
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml')
    expect(parsed.querySelector('parsererror')).toBe(null)
    expect(parsed.querySelectorAll('path').length).toBeGreaterThan(10)
  })

  it('饼图与曲面同样可导出', () => {
    for (const options of [
      { type: 'pie3d', pieData: [{ name: 'A', value: 3 }, { name: 'B', value: 2 }] },
      { type: 'surface3d', surfaceData: { z: [[1, 2], [3, 4]] } },
    ]) {
      const real = stubCtx()
      const recorder = createSvgRecorder(real)
      const canvas = fakeCanvas(recorder.ctx)
      canvas.width = 600
      canvas.height = 400
      render3d(canvas, renderParams({ options, ctx: recorder.ctx }))
      const svg = recorder.toSvg(600, 400)
      const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml')
      expect(parsed.querySelector('parsererror')).toBe(null)
    }
  })
})
