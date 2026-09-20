/**
 * 渲染入口 — 装配主题/图例/相机，按 type 分发到图型建景器，投影后绘制
 *
 * 与 evoke-charts 同构的外部契约：render3d(canvas, params) 纯函数式渲染一帧，
 * 返回投影结果与拾取闭包；params.ctx 可注入录制器实现 SVG 导出。
 *
 * 相机决策顺序：resolveCamera(默认 + options.camera) → autoFit 时按世界包围盒
 * 反解 distance（只调距离不动方位，用户一旦手动交互即由组件关掉 autoFit）。
 */
import { cameraBasis, cameraMatrices, fitDistance, resolveCamera } from '../core/camera.js'
import { pickScene, projectScene } from '../core/scene.js'
import { clearCanvas, drawScene } from './draw.js'
import { computeLegendItems, computeLegendLayout, drawColorScale, drawLegend } from './legend3d.js'
import { getTheme } from '../types.js'
import { resolveChartPalette } from '../palette.js'
import { buildBar3dScene } from './charts/bar3d.js'
import { buildLine3dScene } from './charts/line3d.js'
import { buildScatter3dScene } from './charts/scatter3d.js'
import { buildSurface3dScene } from './charts/surface3d.js'
import { buildPie3dScene } from './charts/pie3d.js'

export { pickScene }

export const CHART3D_BUILDERS = {
  bar3d: buildBar3dScene,
  line3d: buildLine3dScene,
  scatter3d: buildScatter3dScene,
  surface3d: buildSurface3dScene,
  pie3d: buildPie3dScene,
}

/** 归一化标题配置 */
export function titleInfo(options) {
  const t = options && options.title
  if (!t) return { text: '', subtitle: '', show: false }
  if (typeof t === 'string') return { text: t, subtitle: '', show: true }
  if (typeof t === 'object') {
    return {
      text: t.text ? String(t.text) : '',
      subtitle: t.subtitle ? String(t.subtitle) : '',
      show: t.show !== false && !!(t.text || t.subtitle),
    }
  }
  return { text: '', subtitle: '', show: false }
}

function titleBlockHeight(options) {
  const info = titleInfo(options)
  if (!info.show) return 0
  return info.subtitle ? 40 : 26
}

/** 世界包围盒（建景前的确定性估算，供 autoFit） */
export function worldBoundsFor(options) {
  if (options && options.type === 'pie3d') {
    const pie = options.pie && typeof options.pie === 'object' ? options.pie : {}
    const r = Number.isFinite(pie.radius) ? Math.max(0.12, Math.min(0.5, pie.radius)) : 0.42
    const t = Number.isFinite(pie.thickness) ? Math.max(0.02, Math.min(0.5, pie.thickness)) : 0.18
    return { min: [-r, -r, 0], max: [r, r, t] }
  }
  return { min: [-0.5, -0.5, 0], max: [0.5, 0.5, 0.62] }
}

/** 图型默认相机目标（饼图盘心低、柱体类略高于地面） */
function defaultTargetFor(type) {
  return type === 'pie3d' ? [0, 0, 0.1] : [0, 0, 0.31]
}

/**
 * 预计算 Chrome（标题/图例/内边距/绘图区）—— 建景与绘制共用同一份布局
 */
export function computeChrome(options, width, height, theme, hiddenSeries) {
  const legendCfg = options.legend && typeof options.legend === 'object' ? options.legend : {}
  const items = legendCfg.show === false ? [] : computeLegendItems(options, theme, hiddenSeries)
  const titleH = titleBlockHeight(options)
  const provisional = computeLegendLayout(items, width, options, titleH + 6, height)

  const pad = {
    left: legendCfg.show === false ? 16 : 18,
    right: 20,
    top: 6 + titleH,
    bottom: 14,
  }
  // 连续色标画在右侧（min/max/名称三行文字），必须预留横向空间，
  // 否则场景会按全宽自适应、色标文字被挤出画布
  const needsColorScale = options.type === 'surface3d'
    || (options.type === 'scatter3d' && !!(options.scatter && options.scatter.colorScale))
  if (needsColorScale) pad.right += 48
  if (provisional.rows) {
    if (provisional.position === 'bottom') pad.bottom += provisional.height + 6
    else pad.top += provisional.height + 4
  }

  const viewport = {
    x: pad.left,
    y: pad.top,
    width: Math.max(20, width - pad.left - pad.right),
    height: Math.max(20, height - pad.top - pad.bottom),
  }
  return { legend: provisional, legendItems: items, padding: pad, viewport, titleH }
}

function drawTitle(ctx, options, theme, width) {
  const info = titleInfo(options)
  if (!info.show) return
  const cfg = options.title && typeof options.title === 'object' ? options.title : {}
  const x = Number.isFinite(cfg.left) ? cfg.left : 16
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (info.text) {
    ctx.font = `600 13px ${theme.fontFamily || 'sans-serif'}`
    ctx.fillStyle = theme.textColor
    ctx.fillText(info.text, x, 18)
  }
  if (info.subtitle) {
    ctx.font = `400 11px ${theme.fontFamily || 'sans-serif'}`
    ctx.fillStyle = theme.textColorSecondary
    ctx.fillText(info.subtitle, x, info.text ? 34 : 18)
  }
  ctx.restore()
  void width
}

/**
 * 渲染一帧
 * @param {HTMLCanvasElement} canvas
 * @param {object} params { options, dpr, progress, camera, hiddenSeries, hoverKey, theme, ctx, autoFit }
 * @returns {{viewport, camera, projected, legend, colorScale, pickAt, stats, theme}}
 */
export function render3d(canvas, params) {
  const options = (params && params.options) || {}
  const dpr = params && Number.isFinite(params.dpr) && params.dpr > 0 ? params.dpr : 1
  const ctx = (params && params.ctx) || canvas.getContext('2d')
  const width = canvas.width / dpr
  const height = canvas.height / dpr
  const progress = params && Number.isFinite(params.progress) ? Math.max(0, Math.min(1, params.progress)) : 1
  const hiddenSeries = (params && params.hiddenSeries) || new Set()
  const hoverKey = (params && params.hoverKey) || null

  const theme = params && params.theme
    ? params.theme
    : getTheme(options, options.theme, resolveChartPalette(options.palette, false))

  clearCanvas(ctx, canvas.width, canvas.height, theme.backgroundColor)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const chrome = computeChrome(options, width, height, theme, hiddenSeries)
  const viewport = chrome.viewport

  const type = options.type
  const builder = CHART3D_BUILDERS[type]
  if (!builder) {
    return {
      viewport,
      camera: null,
      projected: { items: [], mvp: null, eye: [0, 0, 0], light: null, dropped: 0 },
      legend: chrome.legend,
      colorScale: null,
      pickAt: () => null,
      stats: { total: 0, unknownType: type },
      theme,
    }
  }

  let camera = resolveCamera({
    target: defaultTargetFor(type),
    ...(options.camera && typeof options.camera === 'object' ? options.camera : {}),
  })
  if (params && params.autoFit) {
    camera = { ...camera, distance: fitDistance(worldBoundsFor(options), camera, viewport) }
  }

  const matrices = cameraMatrices(camera, viewport)
  const basis = cameraBasis(camera)

  const rc = {
    options,
    theme,
    hiddenSeries,
    progress,
    hoverKey,
    mvp: matrices.mvp,
    eye: matrices.eye,
    basis,
    viewport,
    width,
    height,
  }

  const built = builder(rc)
  const projected = projectScene(built.scene, camera, viewport, {
    mvp: matrices.mvp,
    eye: matrices.eye,
    basis,
    lighting: options.lighting,
  })

  drawScene(ctx, projected, { hoverKey, theme })
  drawTitle(ctx, options, theme, width)
  drawLegend(ctx, chrome.legend, theme)
  const scaleRect = built.colorScale
    ? drawColorScale(ctx, built.colorScale, theme, width, viewport)
    : null

  const stats = {
    total: projected.items.length,
    dropped: projected.dropped,
    // 可拾取逻辑目标数：一个柱体/扇区由多个面共享同一 meta key，按 key 去重
    pickable: new Set(
      projected.items.filter((i) => i.pickable && i.meta).map((i) => i.meta.key),
    ).size,
  }

  return {
    viewport,
    camera,
    projected,
    legend: chrome.legend,
    colorScale: built.colorScale ? { ...built.colorScale, rect: scaleRect } : null,
    pickAt: (x, y, tolerance) => pickScene(projected, x, y, { tolerance }),
    stats,
    theme,
  }
}
