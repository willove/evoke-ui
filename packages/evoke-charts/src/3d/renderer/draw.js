/**
 * 绘制层 — 把投影后的图元画到 Canvas 2D 上
 *
 * 三趟绘制顺序（见 scene.partitionByLayer）：
 *   back  网格 / 包围框 / 墙体 —— 建景顺序，不排序（永远垫底）
 *   data  数据几何 —— 视深远 → 近（画家算法）
 *   front 轴线 / 刻度 / 标签 —— 建景顺序，永远压顶
 *
 * hover 强调走「描边 + 提亮」而非压暗其余图元：三维场景里图元互相遮挡，
 * 全局压暗会同时压到被遮挡者，视觉归属反而混乱。
 */
import { LAYER_BACK, LAYER_DATA, LAYER_FRONT, partitionByLayer } from '../core/scene.js'
import { lighten, toRgba } from '../core/color.js'

/** 估算文本宽度（CJK 全宽按字号计，其余按 0.62 折算），与 evoke-charts 同口径 */
export function estimateTextWidth(text, fontSize = 12) {
  const s = String(text ?? '')
  let w = 0
  for (const ch of s) {
    w += ch.charCodeAt(0) > 0xff ? fontSize : fontSize * 0.62
  }
  return w
}

export function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2))
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function applyAlpha(ctx, item, base) {
  const a = Number.isFinite(item.alpha) ? item.alpha : base
  ctx.globalAlpha = Math.max(0, Math.min(1, a))
}

function resetAlpha(ctx) {
  ctx.globalAlpha = 1
}

function fontString(item, theme) {
  const family = item.fontFamily || theme.fontFamily || 'sans-serif'
  return `${item.fontWeight === 'bold' ? '600' : '400'} ${item.fontSize}px ${family}`
}

function drawFace(ctx, item, emphasized) {
  if (!item.screen || item.screen.length < 3) return
  ctx.beginPath()
  ctx.moveTo(item.screen[0][0], item.screen[0][1])
  for (let i = 1; i < item.screen.length; i++) {
    ctx.lineTo(item.screen[i][0], item.screen[i][1])
  }
  ctx.closePath()
  ctx.fillStyle = emphasized ? lighten(item.fill, 0.08) : item.fill
  applyAlpha(ctx, item, 1)
  ctx.fill()
  if (item.stroke || emphasized) {
    ctx.strokeStyle = item.stroke || lighten(item.fill, -0.02)
    ctx.lineWidth = emphasized ? 1.6 : Number.isFinite(item.strokeWidth) ? item.strokeWidth : 1
    ctx.setLineDash([])
    ctx.stroke()
  }
  resetAlpha(ctx)
}

function drawLine(ctx, item, emphasized) {
  if (!item.screen || item.screen.length < 2) return
  ctx.beginPath()
  ctx.moveTo(item.screen[0][0], item.screen[0][1])
  for (let i = 1; i < item.screen.length; i++) {
    ctx.lineTo(item.screen[i][0], item.screen[i][1])
  }
  if (item.closed) ctx.closePath()
  ctx.strokeStyle = item.color
  ctx.lineWidth = emphasized ? item.lineWidth * 1.4 : item.lineWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.setLineDash(Array.isArray(item.dash) ? item.dash : [])
  applyAlpha(ctx, item, 1)
  ctx.stroke()
  ctx.setLineDash([])
  resetAlpha(ctx)
}

function drawPoint(ctx, item, emphasized) {
  if (!item.screen) return
  const r = emphasized ? item.radius * 1.25 : item.radius
  const { x, y } = item.screen
  ctx.beginPath()
  if (item.symbol === 'rect') {
    ctx.rect(x - r, y - r, r * 2, r * 2)
  } else if (item.symbol === 'diamond') {
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r, y)
    ctx.lineTo(x, y + r)
    ctx.lineTo(x - r, y)
    ctx.closePath()
  } else if (item.symbol === 'triangle') {
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r * 0.87, y + r * 0.5)
    ctx.lineTo(x - r * 0.87, y + r * 0.5)
    ctx.closePath()
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2)
  }
  ctx.fillStyle = item.color
  applyAlpha(ctx, item, 1)
  ctx.fill()
  if (item.stroke || emphasized) {
    ctx.strokeStyle = item.stroke || '#ffffff'
    ctx.lineWidth = emphasized ? 2 : Number.isFinite(item.strokeWidth) ? item.strokeWidth : 1
    ctx.setLineDash([])
    ctx.stroke()
  }
  resetAlpha(ctx)
}

function drawText(ctx, item, theme, emphasized) {
  if (!item.screen) return
  const x = item.screen.x + (item.offset ? item.offset[0] : 0)
  const y = item.screen.y + (item.offset ? item.offset[1] : 0)
  ctx.font = fontString(item, theme)
  ctx.textAlign = item.align || 'center'
  ctx.textBaseline = item.baseline || 'middle'
  ctx.setLineDash([])

  if (item.background) {
    const w = estimateTextWidth(item.text, item.fontSize) + 8
    const h = item.fontSize + 6
    ctx.fillStyle = item.background
    roundRectPath(ctx, x - w / 2, y - h / 2, w, h, 3)
    applyAlpha(ctx, item, 1)
    ctx.fill()
    resetAlpha(ctx)
  }

  ctx.fillStyle = emphasized ? lighten(item.color, 0.25) : item.color
  applyAlpha(ctx, item, 1)
  ctx.fillText(item.text, x, y)
  resetAlpha(ctx)
}

function drawItem(ctx, item, emphasized, theme) {
  if (item.visible === false) return
  if (item.kind === 'face') drawFace(ctx, item, emphasized)
  else if (item.kind === 'line') drawLine(ctx, item, emphasized)
  else if (item.kind === 'point') drawPoint(ctx, item, emphasized)
  else if (item.kind === 'text') drawText(ctx, item, theme, emphasized)
}

/**
 * 绘制整个投影结果
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} projected projectScene 的返回值
 * @param {{hoverKey?:string|null, theme?:object}} options
 */
export function drawScene(ctx, projected, options = {}) {
  const theme = options.theme || {}
  const hoverKey = options.hoverKey || null
  const { back, data, front } = partitionByLayer(projected.items)

  for (const item of back) drawItem(ctx, item, false, theme)
  for (const item of data) {
    const key = item.meta && item.meta.key
    drawItem(ctx, item, !!key && key === hoverKey, theme)
  }
  for (const item of front) drawItem(ctx, item, false, theme)
}

/** 背景清屏 — 画布复用帧间必须显式擦除，否则残影叠在半透明面上 */
export function clearCanvas(ctx, width, height, color) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width, height)
  if (color) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
  }
}

/** 图元填充覆盖率探针 — 测试用：统计有多少非空绘制调用，定位「整图空白」类回归 */
export function countDrawnItems(projected) {
  const { back, data, front } = partitionByLayer(projected.items)
  return { back: back.length, data: data.length, front: front.length, total: back.length + data.length + front.length }
}

export { LAYER_BACK, LAYER_DATA, LAYER_FRONT }
export function alphaColor(color, alpha) {
  return toRgba(color, alpha)
}
