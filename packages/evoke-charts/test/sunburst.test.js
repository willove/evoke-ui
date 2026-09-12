import { describe, it, expect } from 'vitest'
import {
  computeSunburstDepth,
  computeSunburstGeometry,
  renderSunburstChart,
  sunburstValue,
} from '../src/renderer/charts-extra.js'
import { getContrastText, isLightColor, mixColor } from '../src/renderer/core.js'
import { drawCalloutLabels } from '../src/renderer/calloutLabels.js'

const THEME = {
  colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  backgroundColor: '#ffffff',
  textColor: '#111827',
  textColorSecondary: '#6b7280',
}
const DARK_THEME = { ...THEME, backgroundColor: '#111827', textColor: '#f3f4f6' }

// 三层预算树：三条一级分支，叶子取值刻意不整齐
const THREE_LEVEL = () => [
  {
    name: '平台研发',
    children: [
      { name: '基础架构', children: [{ name: '容器化', value: 180 }, { name: '可观测', value: 140 }] },
      { name: '数据平台', value: 210 },
      { name: '安全', value: 120 },
    ],
  },
  {
    name: '业务研发',
    children: [
      { name: '交易中台', value: 260 },
      { name: '用户增长', children: [{ name: '增长实验', value: 100 }, { name: '活动系统', value: 80 }] },
      { name: '开放平台', value: 90 },
    ],
  },
  { name: '前沿探索', children: [{ name: 'AI 实验室', value: 150 }, { name: '创新孵化', value: 60 }] },
]

const PLOT = { x: 0, y: 0, width: 800, height: 600 }

function geometry(data = THREE_LEVEL(), options = {}, theme = THEME) {
  return computeSunburstGeometry(PLOT, { sunburstData: data, ...options }, theme, (v) => String(v))
}

// 画布录制代理：收集绘制调用与赋值（jsdom 无 2d context）
function recorder() {
  const calls = []
  const target = { measureText: () => ({ width: 10 }) }
  const proxy = new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop]
      if (typeof prop !== 'string') return undefined
      return (...args) => calls.push({ name: prop, args })
    },
    set(obj, prop, value) {
      calls.push({ name: `set:${String(prop)}`, args: [value] })
      return true
    },
  })
  return { proxy, calls }
}

describe('旭日图几何（环厚 / 扇区收敛 / 不外延）', () => {
  it('同层环厚完全一致，最外圈就是可用半径（不出现按数值外延的花瓣）', () => {
    const geo = geometry()
    expect(geo.depthCount).toBe(3)
    geo.segments.forEach((seg) => {
      expect(seg.r1 - seg.r0).toBeCloseTo(geo.ringWidth, 6)
    })
    const outermost = geo.segments.filter((s) => s.depth === geo.depthCount - 1)
    expect(outermost.length).toBeGreaterThan(0)
    outermost.forEach((seg) => expect(seg.r1).toBeCloseTo(geo.maxR, 6))
  })

  it('中心留白取半径 22%', () => {
    const geo = geometry()
    expect(geo.innerHole).toBeCloseTo(geo.maxR * 0.22, 6)
  })

  it('每个子扇区都收敛在父扇区内，且兄弟扇区严丝合缝铺满父扇区', () => {
    const geo = geometry()
    geo.segments.forEach((seg) => {
      if (seg.depth === 0) return
      const parent = geo.segments.find(
        (p) => p.depth === seg.depth - 1 && p.r1 === seg.r0 && p.startAngle <= seg.startAngle + 1e-9 && p.endAngle >= seg.endAngle - 1e-9,
      )
      expect(parent, `段「${seg.node.name}」越出父扇区`).toBeTruthy()
    })
    // 兄弟扇区首尾相接：同一父节点下总扫角等于父扇区扫角
    const byDepth = geo.segments.filter((s) => s.depth === 1)
    const parent = geo.segments.find((s) => s.depth === 0 && s.node.name === '业务研发')
    const kids = byDepth.filter((s) => s.node.name === '交易中台' || s.node.name === '用户增长' || s.node.name === '开放平台')
    const total = kids.reduce((sum, s) => sum + (s.endAngle - s.startAngle), 0)
    expect(total).toBeCloseTo(parent.endAngle - parent.startAngle, 6)
    const sorted = [...kids].sort((a, b) => a.startAngle - b.startAngle)
    expect(sorted[0].startAngle).toBeCloseTo(parent.startAngle, 6)
    expect(sorted[sorted.length - 1].endAngle).toBeCloseTo(parent.endAngle, 6)
    sorted.slice(1).forEach((s, i) => expect(s.startAngle).toBeCloseTo(sorted[i].endAngle, 6))
  })

  it('单子节点不铺满整圆：子扇区角度等于父扇区角度', () => {
    const geo = geometry([
      { name: '唯一', children: [{ name: '甲', value: 3 }, { name: '乙', value: 7 }] },
      { name: '另外', children: [{ name: '丙', value: 5 }] },
    ])
    const parent = geo.segments.find((s) => s.node.name === '另外')
    const child = geo.segments.find((s) => s.node.name === '丙')
    expect(child.endAngle - child.startAngle).toBeCloseTo(parent.endAngle - parent.startAngle, 6)
  })

  it('父节点省略 value 时按子孙汇总（避免 NaN 让兄弟分支角度失效）', () => {
    const data = THREE_LEVEL()
    expect(sunburstValue(data[0])).toBe(650)
    expect(computeSunburstDepth(data)).toBe(3)
    const geo = geometry()
    expect(geo.segments.find((s) => s.node.name === '平台研发').value).toBe(650)
  })
})

describe('旭日图同色系配色', () => {
  it('子孙继承一级分支色相，只按深度向白混合（浅色主题）', () => {
    const geo = geometry()
    const blue = THEME.colors[0]
    const mid = geo.segments.find((s) => s.node.name === '基础架构')
    const leaf = geo.segments.find((s) => s.node.name === '容器化')
    expect(mid.color).toBe(mixColor(blue, 0.26, '#ffffff'))
    expect(leaf.color).toBe(mixColor(blue, 0.52, '#ffffff'))
    // 换到绿分支同样继承绿，不再错位成别的色相
    expect(geo.segments.find((s) => s.node.name === '交易中台').color).toBe(mixColor(THEME.colors[1], 0.26, '#ffffff'))
  })

  it('一级分支各占一个色相槽', () => {
    const geo = geometry()
    const tops = geo.segments.filter((s) => s.depth === 0)
    expect(tops.map((s) => s.color)).toEqual([THEME.colors[0], THEME.colors[1], THEME.colors[2]])
  })

  it('深色主题改为向黑混合，外圈不会亮到刺眼', () => {
    const geo = geometry(THREE_LEVEL(), {}, DARK_THEME)
    expect(geo.segments.find((s) => s.node.name === '基础架构').color).toBe(mixColor(THEME.colors[0], 0.14, '#000000'))
    expect(geo.segments.find((s) => s.node.name === '容器化').color).toBe(mixColor(THEME.colors[0], 0.28, '#000000'))
  })
})

describe('颜色工具（取反色 / 混合）', () => {
  it('getContrastText 认得 #rgb、#rrggbb、rgb()、rgba()', () => {
    expect(getContrastText('#175DFF')).toBe('#ffffff')
    expect(getContrastText('#fff')).toBe('#111827')
    expect(getContrastText('#F6BD16')).toBe('#111827')
    // 混合后是 rgb() 写法：旧实现只认 hex，会把浅底判成深底、文字刷成白色
    expect(getContrastText('rgb(248,206,83)')).toBe('#111827')
    expect(getContrastText('rgb(23, 93, 255)')).toBe('#ffffff')
    expect(getContrastText('rgba(17,24,39,0.9)')).toBe('#ffffff')
    expect(isLightColor('#111827')).toBe(false)
  })

  it('mixColor 混合到目标色并输出 hex，非法输入原样返回', () => {
    expect(mixColor('#000000', 0.5, '#ffffff')).toBe('#808080')
    expect(mixColor('rgb(0,0,0)', 1, '#ffffff')).toBe('#ffffff')
    expect(mixColor('#175DFF', 0, '#ffffff')).toBe('#175dff')
    expect(mixColor('var(--x)', 0.5, '#ffffff')).toBe('var(--x)')
  })
})

describe('旭日图标签排布', () => {
  // 数据里只有 4 个节点真正落在最外层环（其余在中间环就已收口），
  // 标签按「环」分层：最外环外置，内环留在环带里
  const OUTER_RING = ['容器化', '可观测', '增长实验', '活动系统']
  const INNER_RING = ['基础架构', '数据平台', '安全', '用户增长', '交易中台', '开放平台', 'AI 实验室', '创新孵化']

  function render(options = {}) {
    const { proxy, calls } = recorder()
    renderSunburstChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { sunburstData: THREE_LEVEL(), ...options },
      progress: 1,
      hoverIndex: -1,
      valueFormatter: (v) => String(v),
    })
    return { calls, texts: calls.filter((c) => c.name === 'fillText').map((c) => ({ text: c.args[0], x: c.args[1], y: c.args[2] })) }
  }

  it('最外层环标签外置到圆盘之外，每条引线两次 lineTo', () => {
    const geo = geometry()
    const { calls, texts } = render()
    OUTER_RING.forEach((name) => {
      const item = texts.find((t) => t.text === name)
      expect(item, `最外环「${name}」缺标签`).toBeTruthy()
      const distance = Math.hypot(item.x - geo.centerX, item.y - geo.centerY)
      expect(distance, `最外环「${name}」标签落在盘内`).toBeGreaterThan(geo.maxR)
    })
    // 段内标签走 translate+rotate，不产生引线
    const lineTos = calls.filter((c) => c.name === 'lineTo').length
    expect(lineTos).toBe(OUTER_RING.length * 2)
  })

  it('中间环标签沿半径排布（局部坐标落字），不额外画引线', () => {
    const { calls, texts } = render()
    INNER_RING.forEach((name) => {
      expect(texts.some((t) => t.text === name), `中间环「${name}」缺标签`).toBe(true)
    })
    const radialText = texts.find((t) => t.text === '基础架构')
    expect(radialText.x).toBe(0)
    expect(radialText.y).toBe(0)
    const rotations = calls.filter((c) => c.name === 'rotate').length
    expect(rotations).toBeGreaterThanOrEqual(INNER_RING.length)
  })

  it('showValues 打开时外置标签带数值', () => {
    const { texts } = render({ showValues: true })
    expect(texts.map((t) => t.text)).toContain('容器化 180')
  })

  it('单层数据（环形图形态）标签同样外置，不会往环带里塞字', () => {
    const { proxy, calls } = recorder()
    const geo = computeSunburstGeometry(PLOT, { sunburstData: [{ name: '自有', value: 800 }, { name: '付费', value: 600 }] }, THEME, (v) => String(v))
    renderSunburstChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { sunburstData: [{ name: '自有', value: 800 }, { name: '付费', value: 600 }] },
      progress: 1,
      hoverIndex: -1,
      valueFormatter: (v) => String(v),
    })
    const texts = calls.filter((c) => c.name === 'fillText').map((c) => ({ text: c.args[0], x: c.args[1], y: c.args[2] }))
    ;['自有', '付费'].forEach((name) => {
      const item = texts.find((t) => t.text === name)
      expect(Math.hypot(item.x - geo.centerX, item.y - geo.centerY)).toBeGreaterThan(geo.maxR)
    })
  })

  it('标签只在动画收尾后出现（progress 0.5 不画字）', () => {
    const { proxy, calls } = recorder()
    renderSunburstChart({
      ctx: proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { sunburstData: THREE_LEVEL() },
      progress: 0.5,
      hoverIndex: -1,
      valueFormatter: (v) => String(v),
    })
    expect(calls.filter((c) => c.name === 'fillText')).toHaveLength(0)
  })

  it('悬浮段加深同色一档，不引入位移或强调色描边', () => {
    const { calls } = render()
    const idleFills = calls.filter((c) => c.name === 'set:fillStyle').map((c) => c.args[0])
    const hovered = recorder()
    renderSunburstChart({
      ctx: hovered.proxy,
      theme: THEME,
      plotArea: PLOT,
      options: { sunburstData: THREE_LEVEL() },
      progress: 1,
      hoverIndex: 1,
      valueFormatter: (v) => String(v),
    })
    const hoverFills = hovered.calls.filter((c) => c.name === 'set:fillStyle').map((c) => c.args[0])
    expect(hoverFills).not.toEqual(idleFills)
    expect(hoverFills).toContain(THEME.colors[0]) // 其余段保持原色
  })
})

describe('外置引线标签（饼图与旭日图共用）', () => {
  const base = { centerX: 400, centerY: 300, plotArea: PLOT, theme: THEME }

  it('引线为径向 + 横向折线：每条两次 lineTo，文本落在锚点外侧', () => {
    const { proxy, calls } = recorder()
    drawCalloutLabels([{ angle: 0, r: 200, text: '甲' }], { canvasCtx: proxy, ...base })
    const lineTos = calls.filter((c) => c.name === 'lineTo')
    expect(lineTos).toHaveLength(2)
    const text = calls.find((c) => c.name === 'fillText')
    expect(text.args[0]).toBe('甲')
    expect(text.args[1]).toBeGreaterThan(base.centerX + 200)
  })

  it('纵向拥挤时逐条让位，让位超过上限即隐藏（不硬塞）', () => {
    const { proxy, calls } = recorder()
    const crowded = [0, 0.005, 0.01, 0.015, 0.02].map((d, i) => ({ angle: d, r: 200, text: `项${i}` }))
    drawCalloutLabels(crowded, { canvasCtx: proxy, ...base })
    const texts = calls.filter((c) => c.name === 'fillText').map((c) => c.args[0])
    expect(texts.length).toBeLessThan(crowded.length)

    const loose = recorder()
    drawCalloutLabels([{ angle: 0, r: 200, text: '甲' }], { canvasCtx: loose.proxy, ...base })
    expect(loose.calls.some((c) => c.name === 'fillText')).toBe(true)
  })

  it('空列表不产生任何绘制', () => {
    const { proxy, calls } = recorder()
    drawCalloutLabels([], { canvasCtx: proxy, ...base })
    expect(calls).toHaveLength(0)
  })
})
