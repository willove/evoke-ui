/**
 * SVG 导出录制器 — 用一个实现 Canvas 2D 接口的代理替换真 ctx，
 * 把绘制调用重放为 SVG 元素，实现三维图的矢量导出。
 *
 * 与 evoke-charts 的 svgRecorder 同思路、同 API 形状（{ ctx, toSvg }），
 * 但按三维管线的实际用量裁剪：无渐变（面着色已折算成纯色）、无裁剪、无位图。
 * 面是凸多边形 → 路径直出；文字按当前 CTM 反推锚点坐标。
 *
 * 注意：禁止使用 RegExp.exec（安全扫描误报），统一用 match。
 */

function applyMatrix(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

function multiply(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ]
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 解析 canvas font 字符串 */
function parseFont(font) {
  const s = typeof font === 'string' ? font : '12px sans-serif'
  const sizeMatch = s.match(/(\d+(?:\.\d+)?)px/)
  const size = sizeMatch ? parseFloat(sizeMatch[1]) : 12
  const weight = /bold/.test(s) ? 'bold' : /[67]00/.test(s) ? '600' : 'normal'
  const familyMatch = s.match(/px\s+(.*)$/)
  const family = (familyMatch ? familyMatch[1] : 'sans-serif').replace(/["']/g, '')
  return { size, weight, family }
}

/** canvas 对齐值 → SVG text-anchor */
const ANCHOR = { left: 'start', start: 'start', center: 'middle', right: 'end', end: 'end' }
/** canvas 基线 → SVG dominant-baseline */
const BASELINE = {
  alphabetic: 'alphabetic',
  middle: 'central',
  middle_alias: 'central',
  top: 'text-before-edge',
  hanging: 'text-before-edge',
  bottom: 'text-after-edge',
  ideographic: 'text-after-edge',
}

function colorToSvg(value) {
  // canvas 接受的颜色 SVG 都接受；拦截非字符串兜底
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && typeof value.toString === 'function') return value.toString()
  return '#000000'
}

/**
 * @param {CanvasRenderingContext2D} real 真实 ctx，仅用于 measureText 等测量能力
 * @returns {{ctx: object, toSvg: (width:number, height:number, backgroundColor?:string) => string}}
 */
export function createSvgRecorder(real) {
  const elements = []
  let matrix = [1, 0, 0, 1, 0, 0]
  const matrixStack = []
  const styleStack = []
  let path = []
  let hasPath = false

  const style = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1,
    font: '12px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    lineDash: [],
    lineCap: 'butt',
    lineJoin: 'miter',
  }

  function pushPath(fill, stroke) {
    if (!hasPath || !path.length) return
    let d = ''
    for (const cmd of path) {
      const pts = []
      for (let i = 0; i < cmd.pts.length; i += 2) {
        const [x, y] = applyMatrix(matrix, cmd.pts[i], cmd.pts[i + 1])
        pts.push(x.toFixed(2), y.toFixed(2))
      }
      if (cmd.op === 'M') d += `M${pts[0]},${pts[1]}`
      else if (cmd.op === 'L') d += `L${pts[0]},${pts[1]}`
      else if (cmd.op === 'Q') d += `Q${pts.join(',')}`
      else if (cmd.op === 'C') d += `C${pts.join(',')}`
      else if (cmd.op === 'A') {
        const cx = cmd.pts[0]
        const cy = cmd.pts[1]
        const r = cmd.pts[2]
        const a0 = cmd.pts[3]
        const a1 = cmd.pts[4]
        const [tsx, tsy] = applyMatrix(matrix, cx + Math.cos(a0) * r, cy + Math.sin(a0) * r)
        const [tex, tey] = applyMatrix(matrix, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r)
        const scale = (Math.hypot(matrix[0], matrix[1]) + Math.hypot(matrix[2], matrix[3])) / 2
        d += `M${tsx.toFixed(2)},${tsy.toFixed(2)}A${(r * scale).toFixed(2)},${(r * scale).toFixed(2)} 0 0 ${cmd.pts[5] ? 0 : 1} ${tex.toFixed(2)},${tey.toFixed(2)}`
      }
      if (cmd.closed) d += 'Z'
    }
    const attrs = {
      d,
      fill: fill ? colorToSvg(style.fillStyle) : 'none',
      'fill-opacity': fill && style.globalAlpha < 1 ? style.globalAlpha.toFixed(3) : undefined,
    }
    if (stroke) {
      attrs.stroke = colorToSvg(style.strokeStyle)
      attrs['stroke-width'] = style.lineWidth
      attrs['stroke-opacity'] = style.globalAlpha < 1 ? style.globalAlpha.toFixed(3) : undefined
      attrs['stroke-linecap'] = style.lineCap
      attrs['stroke-linejoin'] = style.lineJoin
      if (style.lineDash && style.lineDash.length) attrs['stroke-dasharray'] = style.lineDash.join(' ')
    }
    elements.push({ tag: 'path', attrs })
  }

  const proxy = {
    // ── 状态 ──
    save() {
      matrixStack.push(matrix.slice())
      styleStack.push({ ...style, lineDash: style.lineDash.slice() })
    },
    restore() {
      const m = matrixStack.pop()
      const s = styleStack.pop()
      if (m) matrix = m
      if (s) Object.assign(style, s)
    },
    setTransform(a, b, c, d, e, f) {
      matrix = [a, b, c, d, e, f]
    },
    transform(a, b, c, d, e, f) {
      matrix = multiply(matrix, [a, b, c, d, e, f])
    },
    translate(x, y) {
      matrix = multiply(matrix, [1, 0, 0, 1, x, y])
    },
    scale(x, y) {
      matrix = multiply(matrix, [x, 0, 0, y, 0, 0])
    },
    rotate(rad) {
      const c = Math.cos(rad)
      const s = Math.sin(rad)
      matrix = multiply(matrix, [c, s, -s, c, 0, 0])
    },

    // ── 路径 ──
    beginPath() {
      path = []
      hasPath = true
    },
    closePath() {
      if (path.length) path[path.length - 1].closed = true
    },
    moveTo(x, y) {
      path.push({ op: 'M', pts: [x, y] })
    },
    lineTo(x, y) {
      path.push({ op: 'L', pts: [x, y] })
    },
    quadraticCurveTo(cx, cy, x, y) {
      path.push({ op: 'Q', pts: [cx, cy, x, y] })
    },
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
      path.push({ op: 'C', pts: [c1x, c1y, c2x, c2y, x, y] })
    },
    arc(x, y, r, a0, a1, ccw) {
      path.push({ op: 'A', pts: [x, y, r, a0, a1, !!ccw] })
    },
    rect(x, y, w, h) {
      path.push({ op: 'M', pts: [x, y] })
      path.push({ op: 'L', pts: [x + w, y] })
      path.push({ op: 'L', pts: [x + w, y + h] })
      path.push({ op: 'L', pts: [x, y + h] })
      path[path.length - 1].closed = true
    },

    // ── 绘制 ──
    fill() {
      pushPath(true, false)
    },
    stroke() {
      pushPath(false, true)
    },
    fillRect(x, y, w, h) {
      proxy.beginPath()
      proxy.rect(x, y, w, h)
      pushPath(true, false)
      path = []
    },
    strokeRect(x, y, w, h) {
      proxy.beginPath()
      proxy.rect(x, y, w, h)
      pushPath(false, true)
      path = []
    },
    clearRect() {},
    clip() {},
    fillText(text, x, y) {
      const [tx, ty] = applyMatrix(matrix, x, y)
      const f = parseFont(style.font)
      const baselineOffset = style.textBaseline === 'alphabetic' ? 0 : 0
      elements.push({
        tag: 'text',
        attrs: {
          x: (tx + baselineOffset).toFixed(2),
          y: ty.toFixed(2),
          fill: colorToSvg(style.fillStyle),
          'font-size': f.size,
          'font-family': f.family,
          'font-weight': f.weight,
          'text-anchor': ANCHOR[style.textAlign] || 'start',
          'dominant-baseline': BASELINE[style.textBaseline] || 'alphabetic',
          ...(style.globalAlpha < 1 ? { 'fill-opacity': style.globalAlpha.toFixed(3) } : {}),
        },
        text: String(text),
      })
    },
    strokeText() {},
    measureText(text) {
      if (real && typeof real.measureText === 'function') return real.measureText(text)
      return { width: String(text).length * 7 }
    },
    createLinearGradient() {
      return { addColorStop() {} }
    },
    createRadialGradient() {
      return { addColorStop() {} }
    },
    setLineDash(dash) {
      style.lineDash = Array.isArray(dash) ? dash.slice() : []
    },
    getLineDash() {
      return style.lineDash.slice()
    },
    drawImage() {},
    isPointInPath() {
      return false
    },
  }

  // 属性读写走 getter/setter，fillStyle 等状态才会真正进入录制样式
  const ctx = new Proxy(proxy, {
    get(target, prop) {
      if (prop in style) return style[prop]
      if (prop in target) return target[prop]
      return undefined
    },
    set(target, prop, value) {
      if (prop in style) {
        style[prop] = value
        return true
      }
      target[prop] = value
      return true
    },
  })

  function toSvg(width, height, backgroundColor = '#ffffff') {
    const body = elements
      .map((el) => {
        const attrs = Object.entries(el.attrs)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}="${escapeXml(v)}"`)
          .join(' ')
        if (el.tag === 'text') return `<text ${attrs}>${escapeXml(el.text)}</text>`
        return `<${el.tag} ${attrs}/>`
      })
      .join('\n')
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
      + `<rect width="${width}" height="${height}" fill="${colorToSvg(backgroundColor)}"/>`
      + `${body}</svg>`
  }

  return { ctx, toSvg }
}
