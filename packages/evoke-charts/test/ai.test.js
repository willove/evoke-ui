import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseDataTable,
  inferColumns,
  parseNumeric,
  looksLikeTime,
  generateChartSpec,
  detectIntent,
  buildChartPrompt,
  lintChartSpec,
  SPEC_EXAMPLES,
} from '../src/ai/index.js'
import { validateOptions } from '../src/schema.js'
import { layoutSunburst, renderSunburstChart } from '../src/renderer/charts-extra.js'
import { renderFunnelChart } from '../src/renderer/charts-advanced.js'

const CSV = `月份,线上商城,线下门店,社群团购
1月,320,280,120
2月,356,302,98
3月,401,346,131
4月,388,331,145
5月,520,352,167
6月,560,428,183`

const CSV_TIME = `日期,访问量
2024-01,1200
2024-02,1350
2024-03,1280`

describe('AI 生成引擎：数据表解析与列推断', () => {
  it('parseNumeric：千分位 / 货币 / 百分号 / 万亿 / 会计负数', () => {
    expect(parseNumeric('1,200')).toBe(1200)
    expect(parseNumeric('￥3.5万')).toBe(35000)
    expect(parseNumeric('12亿')).toBe(1.2e9)
    expect(parseNumeric('35%')).toBe(35)
    expect(parseNumeric('(500)')).toBe(-500)
    expect(parseNumeric('2.5K')).toBe(2500)
    expect(parseNumeric('abc')).toBeNull()
    expect(parseNumeric('')).toBeNull()
    expect(parseNumeric(42)).toBe(42)
  })

  it('looksLikeTime：年月 / 年月日 / ISO / 时点', () => {
    expect(looksLikeTime('2024-01')).toBe(true)
    expect(looksLikeTime('2024/1/5')).toBe(true)
    expect(looksLikeTime('2024年12月')).toBe(true)
    expect(looksLikeTime('2024-01-15T08:30')).toBe(true)
    expect(looksLikeTime('09:30')).toBe(true)
    expect(looksLikeTime('1月')).toBe(false)
    expect(looksLikeTime('华东')).toBe(false)
  })

  it('parseDataTable：CSV 表头 / 分号与制表符 / 对象数组 / 无表头二维数组', () => {
    const t1 = parseDataTable(CSV)
    expect(t1.headers).toEqual(['月份', '线上商城', '线下门店', '社群团购'])
    expect(t1.rows).toHaveLength(6)
    expect(t1.rows[0]['线上商城']).toBe('320')

    const t2 = parseDataTable('a;b\n1;2\n3;4')
    expect(t2.headers).toEqual(['a', 'b'])

    const t3 = parseDataTable([{ d: '1月', v: 1 }, { d: '2月', v: 2, w: 3 }])
    expect(t3.headers).toEqual(['d', 'v', 'w'])

    const t4 = parseDataTable([[10, 20], [30, 40]])
    expect(t4.headers).toEqual(['列1', '列2'])

    expect(parseDataTable('')).toBeNull()
    expect(parseDataTable('只有一行')).toBeNull()
    expect(parseDataTable(123)).toBeNull()
  })

  it('inferColumns：数值 / 时间 / 类目三型', () => {
    const cols = inferColumns(parseDataTable(CSV))
    expect(cols.map((c) => c.type)).toEqual(['category', 'number', 'number', 'number'])
    const cols2 = inferColumns(parseDataTable(CSV_TIME))
    expect(cols2[0].type).toBe('time')
    expect(cols2[0].values).toEqual(['2024-01', '2024-02', '2024-03'])
  })

  it('detectIntent：关键词映射', () => {
    expect(detectIntent('看近半年注册量的趋势')).toBe('trend')
    expect(detectIntent('各渠道销售额占比')).toBe('share')
    expect(detectIntent('门店销量排行')).toBe('rank')
    expect(detectIntent('投放费用与转化的关系')).toBe('relation')
    expect(detectIntent('按季度累计')).toBe('stack')
    expect(detectIntent('随便看看')).toBeNull()
  })
})

describe('AI 生成引擎：generateChartSpec', () => {
  it('时间列 + 多数值列 → 折线（趋势），series 与 labels 对齐', () => {
    const { spec, report } = generateChartSpec(CSV, { hint: '看走势' })
    expect(spec.type).toBe('line')
    expect(spec.labels).toEqual(['1月', '2月', '3月', '4月', '5月', '6月'])
    expect(spec.series.map((s) => s.name)).toEqual(['线上商城', '线下门店', '社群团购'])
    expect(spec.series[0].data).toEqual([320, 356, 401, 388, 520, 560])
    expect(spec.legend.show).toBe(true)
    expect(report.some((r) => r.level === 'error')).toBe(false)
    expect(validateOptions(spec).ok).toBe(true)
  })

  it('时间格式列同样走趋势', () => {
    const { spec } = generateChartSpec(CSV_TIME)
    expect(spec.type).toBe('line')
    expect(spec.labels).toEqual(['2024-01', '2024-02', '2024-03'])
  })

  it('占比意图：单度量按类目切饼，多度量按列合计切饼', () => {
    const csv = `渠道,销售额\n线上,520\n线下,428\n社群,183`
    const { spec } = generateChartSpec(csv, { hint: '渠道销售额占比' })
    expect(spec.type).toBe('pie')
    expect(spec.pieData).toEqual([
      { name: '线上', value: 520 },
      { name: '线下', value: 428 },
      { name: '社群', value: 183 },
    ])
    expect(validateOptions(spec).ok).toBe(true)

    const { spec: multi } = generateChartSpec(CSV, { hint: '各渠道销售额占比' })
    expect(multi.type).toBe('pie')
    // 各度量列求和：线上 2545 / 线下 2039 / 社群 844
    expect(multi.pieData).toEqual([
      { name: '线上商城', value: 2545 },
      { name: '线下门店', value: 2039 },
      { name: '社群团购', value: 844 },
    ])
    expect(validateOptions(multi).ok).toBe(true)
  })

  it('排行意图 / 长类目名单度量 → 横向条形', () => {
    const csv = `门店,销量\n线下体验店,120\n线上旗舰店,98\n社群团购点,80\n仓储会员店,60\n社区便利店,52`
    const { spec } = generateChartSpec(csv, { hint: '门店销量排行' })
    expect(spec.type).toBe('horizontal-bar')
  })

  it('双数值列无类目 + 关系意图 → 散点', () => {
    const csv = `投放,转化\n100,12\n200,26\n300,31\n150,18`
    const { spec } = generateChartSpec(csv, { hint: '投放与转化的关系' })
    expect(spec.type).toBe('scatter')
    expect(spec.scatterData[0]).toEqual({ x: 100, y: 12, label: '1' })
    expect(validateOptions(spec).ok).toBe(true)
  })

  it('堆叠意图 → stacked-bar', () => {
    const { spec } = generateChartSpec(CSV, { hint: '按月累计构成' })
    expect(spec.type).toBe('stacked-bar')
  })

  it('narrative: true 注入峰值 callout 与末点环比 delta（≤3 处）', () => {
    const { spec } = generateChartSpec(CSV, { narrative: true })
    expect(Array.isArray(spec.annotations)).toBe(true)
    expect(spec.annotations.length).toBeLessThanOrEqual(3)
    const callout = spec.annotations.find((a) => a.type === 'callout')
    expect(callout.label).toContain('峰值')
    expect(callout.y).toBe(560)
    const delta = spec.annotations.find((a) => a.type === 'delta')
    expect(delta.direction).toBe('up')
    expect(delta.text).toContain('环比')
    expect(validateOptions(spec).ok).toBe(true)
  })

  it('非数值数据给出 error report 而非抛错', () => {
    const { spec, report } = generateChartSpec('名称,备注\n甲,你好\n乙,再见')
    expect(spec).toBeNull()
    expect(report[0].level).toBe('error')
  })

  it('数值列超过 8 个截取并告警', () => {
    const header = ['类目', ...Array.from({ length: 10 }, (_, i) => `指标${i + 1}`)].join(',')
    const row = ['甲', ...Array.from({ length: 10 }, (_, i) => String(i + 1))].join(',')
    const { spec, report } = generateChartSpec(`${header}\n${row}`)
    expect(spec.series).toHaveLength(8)
    expect(report.some((r) => r.level === 'warn')).toBe(true)
  })
})

describe('AI 生成引擎：提示词契约与渲染自检', () => {
  it('buildChartPrompt：含 schema、数据预览、需求与硬性规则', () => {
    const prompt = buildChartPrompt({ data: CSV, requirement: '近半年各渠道走势' })
    expect(prompt).toContain('"EvChart Options"')
    expect(prompt).toContain('月份 | 线上商城 | 线下门店 | 社群团购')
    expect(prompt).toContain('近半年各渠道走势')
    expect(prompt).toContain('硬性规则')
    expect(prompt).toContain('annotations 单图不超过 3 处')
  })

  it('buildChartPrompt：无数据时明示虚构', () => {
    const prompt = buildChartPrompt({ requirement: '画个示例' })
    expect(prompt).toContain('虚构合理示例数据')
  })

  it('示例库自一致：每条示例 spec 都过 schema 校验与 lint 无 error', () => {
    expect(SPEC_EXAMPLES.length).toBeGreaterThanOrEqual(3)
    SPEC_EXAMPLES.forEach(({ requirement, spec }) => {
      expect(validateOptions(spec).ok, `示例不合格：${requirement}`).toBe(true)
      const { issues } = lintChartSpec(spec)
      expect(issues.filter((i) => i.level === 'error'), `示例 lint 报错：${requirement}`).toEqual([])
    })
  })

  it('buildChartPrompt 默认携带示例，examples: false 可关闭', () => {
    const withExamples = buildChartPrompt({ data: CSV, requirement: '看走势' })
    expect(withExamples).toContain('## 示例')
    expect(withExamples).toContain('需求：看上半年各渠道销售额走势')
    const without = buildChartPrompt({ data: CSV, requirement: '看走势', examples: false })
    expect(without).not.toContain('## 示例')
  })

  it('lintChartSpec：schema 错误定位 + 注解预算裁剪', () => {
    const bad = lintChartSpec({ type: 'nope' })
    expect(bad.issues.some((i) => i.level === 'error' && i.path === 'options.type')).toBe(true)

    const ann = Array.from({ length: 5 }, (_, i) => ({ type: 'text', x: `k${i}`, y: 1, text: String(i) }))
    const { issues, spec } = lintChartSpec({ type: 'line', labels: ['k0', 'k1', 'k2', 'k3', 'k4'], series: [{ name: 'a', data: [1, 2, 3, 4, 5] }], annotations: ann })
    expect(spec.annotations).toHaveLength(3)
    expect(issues.some((i) => i.rule === 'annotation-budget')).toBe(true)
  })

  it('lintChartSpec：类目拥挤的单系列柱状自动转横向', () => {
    const labels = ['线下体验旗舰店门店', '线上官方旗舰直营店', '社群团购自提服务站', '仓储式会员制卖场', '社区便利连锁超市', '跨境电商保税直购', '直播电商带货渠道']
    const { spec, issues } = lintChartSpec({
      type: 'bar',
      labels,
      series: [{ name: '销量', data: labels.map((_, i) => i + 1) }],
    })
    expect(spec.type).toBe('horizontal-bar')
    expect(issues.some((i) => i.rule === 'bar-to-horizontal')).toBe(true)
  })

  it('lintChartSpec：饼图扇区过多给出建议', () => {
    const pieData = Array.from({ length: 10 }, (_, i) => ({ name: `项${i}`, value: i + 1 }))
    const { issues } = lintChartSpec({ type: 'pie', pieData })
    expect(issues.some((i) => i.rule === 'pie-slices')).toBe(true)
  })

  // 无头渲染需要容忍任意 ctx 方法的 Proxy（普通对象会让 renderChart 抛错、
  // lint 静默跳过几何检查，导致检查形同虚设）
  const proxyCtx = () => new Proxy(
    { measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop: () => {} }), createRadialGradient: () => ({ addColorStop: () => {} }) },
    { get(obj, prop) { return prop in obj ? obj[prop] : () => {} } },
  )
  const withCtx = () => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
    return proxyCtx()
  })

  it('lintChartSpec：无头渲染跑通并返回 issues 数组', () => {
    withCtx()
    const { issues } = lintChartSpec({ type: 'line', labels: ['一', '二'], series: [{ name: 'a', data: [1, 2] }] })
    expect(Array.isArray(issues)).toBe(true)
    expect(issues.some((i) => i.rule === 'headless-skipped')).toBe(false)
    vi.restoreAllMocks()
  })

  it('lintChartSpec：同点双注解文本重叠被检出', () => {
    withCtx()
    const ann = { type: 'callout', x: '二', y: 2, label: '同点旁注重叠', anchor: 'top-right' }
    const { issues } = lintChartSpec({
      type: 'line',
      labels: ['一', '二', '三'],
      series: [{ name: 'A', data: [1, 2, 3] }],
      annotations: [ann, { ...ann }],
    })
    expect(issues.some((i) => i.rule === 'text-overlap')).toBe(true)
    vi.restoreAllMocks()
  })

  it('lintChartSpec：自定义色板对比度不足被检出（明暗两模式）', () => {
    const { issues } = lintChartSpec({
      type: 'line',
      labels: ['一', '二'],
      series: [{ name: 'a', data: [1, 2] }],
      theme: { colors: ['#ffffff', '#f0f0f0'] },
    })
    const low = issues.filter((i) => i.rule === 'low-contrast')
    expect(low.length).toBeGreaterThanOrEqual(2) // 白/浅灰在浅色背景下双双不达标
    expect(low.some((i) => i.message.includes('浅色'))).toBe(true)
  })
})

describe('旭日图布局：父节点省略 value 由子孙汇总', () => {
  it('layoutSunburst：无 value 父节点正确聚合，两分支都进布局', () => {
    const segments = layoutSunburst(
      [
        { name: '自有', children: [{ name: 'App', value: 540 }, { name: '官网', value: 260 }] },
        { name: '付费', children: [{ name: '信息流', value: 380 }, { name: '搜索', value: 220 }] },
      ],
      20, 40, 0, -Math.PI / 2, 0, [],
    )
    // 2 父 + 4 叶 = 6 段
    expect(segments).toHaveLength(6)
    const tops = segments.filter((s) => s.depth === 0)
    expect(tops.map((s) => s.node.name)).toEqual(['自有', '付费'])
    // 角度守恒：顶层弧合起来是整圆，且第二分支不再缺失
    const sweep = tops.reduce((s, t) => s + (t.endAngle - t.startAngle), 0)
    expect(sweep).toBeCloseTo(Math.PI * 2)
    expect(tops[0].endAngle - tops[0].startAngle).toBeCloseTo((Math.PI * 2) * (800 / 1400))
    // 父段 value 为子级汇总，供 showValues 标注
    expect(tops[0].value).toBe(800)
    expect(tops[1].value).toBe(600)
  })

  it('layoutSunburst：显式 value 的父节点行为不变', () => {
    const segments = layoutSunburst(
      [
        { name: '甲', value: 100, children: [{ name: '甲1', value: 60 }, { name: '甲2', value: 40 }] },
        { name: '乙', value: 100, children: [{ name: '乙1', value: 100 }] },
      ],
      20, 40, 0, -Math.PI / 2, 0, [],
    )
    const tops = segments.filter((s) => s.depth === 0)
    expect(tops[0].endAngle - tops[0].startAngle).toBeCloseTo(Math.PI)
    expect(tops[1].endAngle - tops[1].startAngle).toBeCloseTo(Math.PI)
  })
})

describe('旭日图渲染：各环标签沿半径旋转', () => {
  it('内环与外环标签都在环带内以「平移 + 旋转」落字，不牵外置引线', () => {
    const texts = []
    const arcs = []
    const proxy = new Proxy(
      { measureText: () => ({ width: 10 }) },
      {
        get(obj, prop) {
          return prop in obj ? obj[prop] : (...args) => { texts.push([String(prop), args]) }
        },
      },
    )
    void arcs
    renderSunburstChart(
      {
        ctx: proxy,
        theme: {
          colors: ['#175DFF', '#5AD8A6'],
          textColorSecondary: '#6b7280',
          backgroundColor: '#ffffff',
        },
        plotArea: { x: 40, y: 10, width: 400, height: 300 },
        options: {
          type: 'sunburst',
          sunburstData: [
            { name: '自有', children: [{ name: 'App 启动', value: 540 }, { name: '官网', value: 260 }] },
            { name: '付费', children: [{ name: '信息流', value: 380 }, { name: '搜索', value: 220 }] },
          ],
        },
        width: 480,
        height: 320,
        progress: 1,
        hoverIndex: -1,
      },
    )
    const fills = texts.filter((t) => t[0] === 'fillText').map((t) => t[1])
    // 外层叶子与内环标签都在局部原点落字（靠 translate + rotate 定位到各自环带）
    ;['App 启动', '自有'].forEach((name) => {
      const item = fills.find((f) => f[0] === name)
      expect(item, `${name} 缺标签`).toBeTruthy()
      expect(item[1]).toBe(0)
      expect(item[2]).toBe(0)
    })
    // 不再有外置引线：绘制调用里没有 lineTo
    expect(texts.some((t) => t[0] === 'lineTo')).toBe(false)
    // 每个标签各自旋转一次
    expect(texts.filter((t) => t[0] === 'rotate')).toHaveLength(fills.length)
  })
})

describe('漏斗图标签布局', () => {
  it('窄层转外侧引线标签，纵向步进 ≥ 34px 防重叠', () => {
    const fills = []
    const proxy = new Proxy(
      { measureText: () => ({ width: 10 }) },
      {
        get(obj, prop) {
          return prop in obj ? obj[prop] : (...args) => { fills.push([String(prop), args]) }
        },
      },
    )
    renderFunnelChart(
      {
        ctx: proxy,
        theme: {
          colors: ['#175DFF', '#5AD8A6', '#f5a623', '#7fd3ed', '#f87171'],
          textColorSecondary: '#6b7280',
          backgroundColor: '#ffffff',
          textColor: '#111827',
        },
        plotArea: { x: 40, y: 10, width: 400, height: 120 },
        options: {
          type: 'funnel',
          funnelData: [
            { label: '收到简历', value: 4860 },
            { label: '笔试通过', value: 400 },
            { label: '初面通过', value: 60 },
            { label: '终面通过', value: 20 },
            { label: '接受 Offer', value: 10 },
          ],
        },
        width: 480,
        height: 140,
        progress: 1,
        hoverIndex: -1,
        hiddenSeries: new Set(),
      },
    )
    // 外侧 value 行（右对齐 x = plotArea 右缘 - 4 = 436）纵向步进 ≥ 34
    const ys = fills
      .filter((f) => f[0] === 'fillText' && /\(\d/.test(String(f[1][0])) && f[1][1] === 436)
      .map((f) => f[1][2])
      .sort((a, b) => a - b)
    expect(ys.length).toBeGreaterThanOrEqual(3)
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(34)
    }
  })
})
