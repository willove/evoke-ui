/**
 * 图例与色标 — 二维覆盖层（画在三维场景之上）
 *
 * 三维场景没有「图例」这个三维概念：图例是标注层，永远正向绘制在画布上，
 * 不参与深度排序。布局先行 —— 渲染器需要先知道图例占多高才能划出绘图区，
 * 因此 computeLegendLayout 在建景之前调用，绘制在 drawScene 之后。
 */
import { estimateTextWidth } from './draw.js'
import { normalizePie, normalizeSeries } from './shared.js'
import { gradientAt } from '../core/color.js'

export const LEGEND_ROW_HEIGHT = 22
export const LEGEND_SWATCH = 10
export const LEGEND_ITEM_GAP = 18
export const LEGEND_TEXT_GAP = 6

/** 图例项 — 按图型取名字清单 */
export function computeLegendItems(options, theme, hiddenSeries) {
  const type = options && options.type
  if (type === 'surface3d') return []
  if (type === 'pie3d') {
    const { items } = normalizePie(options, theme, hiddenSeries)
    return items.map((d) => ({ name: d.name, color: d.color, hidden: false }))
  }
  const series = normalizeSeries(options, theme, hiddenSeries)
  // 隐藏系列已被过滤，这里补回完整清单用于渲染「隐藏态」的半透明项
  const all = Array.isArray(options && options.series) ? options.series : []
  const colors = Array.isArray(theme.colors) && theme.colors.length ? theme.colors : ['#888888']
  return all.map((s, i) => {
    const name = s && s.name !== undefined && s.name !== null && String(s.name).length ? String(s.name) : `系列 ${i + 1}`
    return {
      name,
      color: (s && typeof s.color === 'string' && s.color) || colors[i % colors.length],
      hidden: hiddenSeries ? hiddenSeries.has(name) : false,
    }
  })
}

/**
 * 图例布局
 * @returns {{items:Array, rows:number, height:number, y:number}}
 */
export function computeLegendLayout(items, canvasWidth, options, topOffset = 0, bottomOffset = 0) {
  const cfg = options && options.legend && typeof options.legend === 'object' ? options.legend : {}
  if (cfg.show === false || !items.length) {
    return { items: [], rows: 0, height: 0, y: 0 }
  }
  const gap = Number.isFinite(cfg.itemGap) ? cfg.itemGap : LEGEND_ITEM_GAP
  const padding = 12
  const avail = Math.max(80, canvasWidth - padding * 2)

  // 逐项量宽并按行折行
  const measured = items.map((it) => {
    const textWidth = estimateTextWidth(it.name, 12)
    return { ...it, width: LEGEND_SWATCH + LEGEND_TEXT_GAP + textWidth }
  })
  const rows = []
  let row = []
  let rowWidth = 0
  for (const it of measured) {
    const add = row.length ? gap + it.width : it.width
    if (row.length && rowWidth + add > avail) {
      rows.push({ items: row, width: rowWidth })
      row = []
      rowWidth = 0
    }
    const inc = row.length ? gap + it.width : it.width
    row.push(it)
    rowWidth += inc
  }
  if (row.length) rows.push({ items: row, width: rowWidth })

  const align = cfg.align || 'center'
  const height = rows.length * LEGEND_ROW_HEIGHT + (rows.length ? 6 : 0)
  const position = cfg.position === 'bottom' ? 'bottom' : 'top'
  const y = position === 'top'
    ? topOffset + 2
    : Math.max(topOffset + 2, bottomOffset - height - 2)

  let index = 0
  const laid = []
  for (const r of rows) {
    let x = align === 'start'
      ? padding
      : align === 'end'
        ? canvasWidth - padding - r.width
        : (canvasWidth - r.width) / 2
    for (const it of r.items) {
      laid.push({ ...it, x, y: y + index * LEGEND_ROW_HEIGHT, width: it.width, height: LEGEND_ROW_HEIGHT - 6 })
      x += it.width + gap
    }
    index++
  }
  return { items: laid, rows: rows.length, height, y, position }
}

/** 命中图例项 */
export function hitLegend(layout, x, y) {
  if (!layout || !Array.isArray(layout.items)) return null
  for (const it of layout.items) {
    if (x >= it.x && x <= it.x + it.width && y >= it.y && y <= it.y + it.height + 6) return it
  }
  return null
}

/** 绘制图例（swatch + 文本；隐藏项半透明） */
export function drawLegend(ctx, layout, theme) {
  if (!layout || !layout.items.length) return
  ctx.save()
  ctx.font = `400 12px ${theme.fontFamily || 'sans-serif'}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  for (const it of layout.items) {
    ctx.globalAlpha = it.hidden ? 0.35 : 1
    ctx.fillStyle = it.color
    const sy = it.y + it.height / 2 - LEGEND_SWATCH / 2
    ctx.beginPath()
    const r = 2
    const sx = it.x
    ctx.moveTo(sx + r, sy)
    ctx.lineTo(sx + LEGEND_SWATCH - r, sy)
    ctx.quadraticCurveTo(sx + LEGEND_SWATCH, sy, sx + LEGEND_SWATCH, sy + r)
    ctx.lineTo(sx + LEGEND_SWATCH, sy + LEGEND_SWATCH - r)
    ctx.quadraticCurveTo(sx + LEGEND_SWATCH, sy + LEGEND_SWATCH, sx + LEGEND_SWATCH - r, sy + LEGEND_SWATCH)
    ctx.lineTo(sx + r, sy + LEGEND_SWATCH)
    ctx.quadraticCurveTo(sx, sy + LEGEND_SWATCH, sx, sy + LEGEND_SWATCH - r)
    ctx.lineTo(sx, sy + r)
    ctx.quadraticCurveTo(sx, sy, sx + r, sy)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = theme.textColor
    ctx.fillText(it.name, it.x + LEGEND_SWATCH + LEGEND_TEXT_GAP, it.y + it.height / 2 + 1)
  }
  ctx.restore()
}

/**
 * 连续色标（surface / scatter colorScale 用）
 * 离散色阶取样而非 canvas 渐变 —— 录制 SVG 时纯色矩形可以无损还原
 */
export function drawColorScale(ctx, spec, theme, canvasWidth, viewport) {
  if (!spec || !Array.isArray(spec.colors) || spec.colors.length < 2) return
  const height = Math.max(60, Math.min(150, viewport.height * 0.44))
  const width = 10
  // 色标条 + min/max/名称文字共约 40px，画在右侧 padding 带内（computeChrome 已预留 48px）
  const x = canvasWidth - 52
  const y = viewport.y + Math.max(0, (viewport.height - height) / 2)
  const steps = spec.colors.length * 4
  const fmt = (v) => {
    const abs = Math.abs(v)
    if (abs >= 1000) return `${Math.round(v / 100) / 10}k`
    if (abs >= 10) return String(Math.round(v))
    return String(Math.round(v * 100) / 100)
  }
  ctx.save()
  ctx.globalAlpha = 0.92
  for (let i = 0; i < steps; i++) {
    // 自上而下从高值色渐入低值色
    const t = 1 - i / (steps - 1)
    ctx.fillStyle = gradientAt(spec.colors, t)
    ctx.fillRect(x, y + (i * height) / steps, width, height / steps + 0.6)
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = theme.borderColor
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, width, height)
  ctx.font = `400 10.5px ${theme.fontFamily || 'sans-serif'}`
  ctx.fillStyle = theme.textColorSecondary
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(fmt(spec.max), x + width + 6, y + 5)
  ctx.fillText(fmt(spec.min), x + width + 6, y + height - 4)
  if (spec.label) {
    ctx.fillText(spec.label, x + width + 6, y + height / 2)
  }
  ctx.restore()
  return { x, y, width, height }
}
