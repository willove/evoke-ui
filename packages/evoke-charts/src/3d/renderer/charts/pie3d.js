/**
 * 三维饼图 / 环形图 — 平放在地面上的厚片圆盘
 *
 * 扇区由五类面构成：顶环面、底环面、外侧弧面、内侧弧面（环形时）、两片径向端面。
 * 所有面的顶点缠绕都已校验为法线朝外，因此整块开启背面剔除。
 * 悬浮扇区整体上浮（z 平移）—— 三维图里「强调」用位移比用变色更可读，
 * 因为面片颜色已被光照调制过，再叠强调色容易失真。
 */
import { addFace, addText, createScene } from '../../core/scene.js'
import { normalizePie } from '../shared.js'

const TAU = Math.PI * 2
const DEG = Math.PI / 180

function clampNum(v, min, max, fallback) {
  return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback
}

/** 圆弧采样点 */
function arcPoints(cx, cy, r, a0, a1, segments, z) {
  const pts = []
  for (let k = 0; k <= segments; k++) {
    const a = a0 + ((a1 - a0) * k) / segments
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z])
  }
  return pts
}

/** 环形面（外圈逆时针 + 内圈顺时针 → 法线 +Z）；innerRadius 为 0 时退化为整圆 */
function annulusTop(cx, cy, rOut, rIn, a0, a1, segments, z) {
  const outer = arcPoints(cx, cy, rOut, a0, a1, segments, z)
  if (rIn <= 1e-6) return [[cx, cy, z], ...outer]
  const inner = arcPoints(cx, cy, rIn, a1, a0, segments, z)
  return [...outer, ...inner]
}

export function buildPie3dScene(rc) {
  const { options, theme, hiddenSeries, progress, hoverKey } = rc
  const scene = createScene()
  const { items, total } = normalizePie(options, theme, hiddenSeries)

  const pie = options.pie && typeof options.pie === 'object' ? options.pie : {}
  const radius = clampNum(pie.radius, 0.12, 0.5, 0.42)
  const innerRadius = clampNum(pie.innerRadius, 0, radius * 0.82, 0)
  const thickness = clampNum(pie.thickness, 0.02, 0.5, 0.18)
  const startAngle = (Number.isFinite(pie.startAngle) ? pie.startAngle : -90) * DEG
  const padAngle = clampNum(pie.padAngle, 0, 0.12, 0.01) * DEG
  const lift = 0.055
  const shadowOn = pie.shadow !== false
  const shadowStrength = Number.isFinite(pie.shadowStrength) ? Math.max(0, Math.min(1, pie.shadowStrength)) : 0.09
  const labelCfg = options.label && typeof options.label === 'object' ? options.label : {}
  const showLabel = !!labelCfg.show
  const i18nPercent = (options.i18n && options.i18n.tooltip && options.i18n.tooltip.percent) || '占比'

  // 进场动画：角度扫入 + 厚度生长，两者节奏错开更有「冲压成型」感
  const sweepProgress = Math.min(1, progress / 0.85)
  const thickProgress = Math.max(0, Math.min(1, (progress - 0.1) / 0.8))
  const h = thickness * thickProgress

  let acc = 0
  for (const d of items) {
    const segAngle = d.percent * TAU * sweepProgress
    const a0 = startAngle + acc
    acc += segAngle
    const a1 = startAngle + acc
    if (a1 - a0 < 1e-4) continue

    const gap = Math.min(padAngle, (a1 - a0) * 0.18)
    const s0 = a0 + gap / 2
    const s1 = a1 - gap / 2
    if (s1 - s0 < 1e-4) continue

    const segments = Math.max(2, Math.ceil((s1 - s0) / (TAU / 72)))
    const isHover = hoverKey === `pie:${d.__index}`
    const zBase = 0.0016 + (isHover ? lift : 0)
    const zTop = zBase + h

    const top = annulusTop(0, 0, radius, innerRadius, s0, s1, segments, zTop)
    const bottom = annulusTop(0, 0, radius, innerRadius, s1, s0, segments, zBase)

    const faceOpts = {
      color: d.color,
      cull: true,
      solid: true,
      doubleSided: false,
      alpha: Math.min(1, 0.4 + progress * 0.6),
      meta: {
        key: `pie:${d.__index}`,
        type: 'pie3d',
        seriesName: d.name,
        seriesIndex: d.__index,
        dataIndex: d.__index,
        name: d.name,
        value: d.value,
        percent: d.percent,
        total,
        color: d.color,
      },
    }

    addFace(scene, top, faceOpts)
    addFace(scene, bottom, faceOpts)

    // 外侧弧面 / 内侧弧面：细分曲面，保留面内渐变但不描细分缝
    const curvedOpts = { ...faceOpts, curved: true }
    const outerA = arcPoints(0, 0, radius, s0, s1, segments, zBase)
    const outerB = arcPoints(0, 0, radius, s0, s1, segments, zTop)
    for (let k = 0; k < segments; k++) {
      addFace(scene, [outerA[k], outerA[k + 1], outerB[k + 1], outerB[k]], curvedOpts)
    }

    // 内侧弧面（环形）
    if (innerRadius > 1e-6) {
      const innerA = arcPoints(0, 0, innerRadius, s0, s1, segments, zBase)
      const innerB = arcPoints(0, 0, innerRadius, s0, s1, segments, zTop)
      for (let k = 0; k < segments; k++) {
        addFace(scene, [innerB[k], innerB[k + 1], innerA[k + 1], innerA[k]], curvedOpts)
      }
    }

    // 两片径向端面
    const capStart = [
      [Math.cos(s0) * innerRadius, Math.sin(s0) * innerRadius, zBase],
      [Math.cos(s0) * radius, Math.sin(s0) * radius, zBase],
      [Math.cos(s0) * radius, Math.sin(s0) * radius, zTop],
      [Math.cos(s0) * innerRadius, Math.sin(s0) * innerRadius, zTop],
    ]
    const capEnd = [
      [Math.cos(s1) * innerRadius, Math.sin(s1) * innerRadius, zTop],
      [Math.cos(s1) * radius, Math.sin(s1) * radius, zTop],
      [Math.cos(s1) * radius, Math.sin(s1) * radius, zBase],
      [Math.cos(s1) * innerRadius, Math.sin(s1) * innerRadius, zBase],
    ]
    addFace(scene, capStart, faceOpts)
    addFace(scene, capEnd, faceOpts)

    // 外部标签（默认关）
    if (showLabel) {
      const mid = (s0 + s1) / 2
      addText(scene, [Math.cos(mid) * radius * 1.24, Math.sin(mid) * radius * 1.24, zTop], `${d.name} ${(d.percent * 100).toFixed(1)}%`, {
        layer: 'front',
        fontSize: 11,
        color: theme.textColorSecondary,
        align: Math.cos(mid) >= 0 ? 'left' : 'right',
        meta: faceOpts.meta,
        pickable: false,
      })
      void i18nPercent
    }
  }

  // 盘底软阴影：一圈略大的黑色扁环，让圆盘「落」在地面上而不是悬浮
  if (shadowOn && shadowStrength > 0 && h > 0.005) {
    const shadowRing = annulusTop(0, 0, radius * 1.05, 0, 0, TAU, 48, 0.0008)
    addFace(scene, shadowRing, {
      color: '#000000',
      alpha: shadowStrength,
      layer: 'back',
      flat: true,
      pickable: false,
    })
  }

  return { scene, frame: null, pie: { radius, innerRadius, thickness: h } }
}
