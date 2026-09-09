import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EvBorderBeam from '../src/components/border-beam/index.vue'
import EvCreditsProgress from '../src/components/credits-progress/index.vue'
import EvGanttProgress from '../src/components/gantt-progress/index.vue'
import EvJsonViewer from '../src/components/json-viewer/index.vue'

describe('EvBorderBeam', () => {
  it('双 class + 默认激活', () => {
    const wrapper = mount(EvBorderBeam, { slots: { default: '<p>内容</p>' } })
    expect(wrapper.classes()).toContain('ev-border-beam')
    expect(wrapper.classes()).toContain('is-active')
    expect(wrapper.find('.ev-border-beam__inner p').text()).toBe('内容')
  })

  it('active=false 关闭流光', () => {
    expect(mount(EvBorderBeam, { props: { active: false } }).classes()).not.toContain('is-active')
  })

  it('CSS 变量透传（color/size/duration/delay/padding）', () => {
    const wrapper = mount(EvBorderBeam, {
      props: { color: '#ff0000', size: 4, radius: 12, duration: 3, delay: 1, padding: 8, background: '#fff' },
    })
    const style = wrapper.attributes('style')
    expect(style).toContain('--ev-bb-color: #ff0000')
    expect(style).toContain('--ev-bb-size: 4px')
    expect(style).toContain('--ev-bb-radius: 12px')
    expect(style).toContain('--ev-bb-duration: 3s')
    expect(style).toContain('--ev-bb-delay: 1s')
    expect(style).toContain('--ev-bb-padding: 8px')
    expect(style).toContain('--ev-bb-bg: #fff')
  })

  it('colorTo 缺省派生 color-mix', () => {
    const wrapper = mount(EvBorderBeam, { props: { color: '#175DFF' } })
    expect(wrapper.attributes('style')).toContain('color-mix(in srgb, #175DFF 0%, transparent)')
  })

  it('colorTo 显式覆盖', () => {
    const wrapper = mount(EvBorderBeam, { props: { colorTo: 'rgba(0,0,0,.2)' } })
    expect(wrapper.attributes('style')).toContain('--ev-bb-color-to: rgba(0,0,0,.2)')
  })
})

describe('EvCreditsProgress', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('结构：header/fence/footer + 用量脚注', async () => {
    const wrapper = mount(EvCreditsProgress, {
      props: { used: 300, total: 1000, refreshDate: '2026-10-01' },
      attachTo: document.body,
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-credits-progress').exists()).toBe(true)
    expect(wrapper.find('.ev-credits-progress__header').text()).toContain('2026-10-01')
    expect(wrapper.find('.ev-credits-progress__used strong').text()).toBe('300')
    expect(wrapper.find('.ev-credits-progress__total').text()).toContain('1,000')
    expect(wrapper.find('.ev-credits-progress__pct').text()).toContain('30%')
    expect(wrapper.find('.ev-credits-progress__remain strong').text()).toBe('700')
    wrapper.unmount()
  })

  it('无 refreshDate 不渲染 header', () => {
    const wrapper = mount(EvCreditsProgress, { props: { used: 1, total: 10 } })
    expect(wrapper.find('.ev-credits-progress__header').exists()).toBe(false)
  })

  it('条形墙按容器宽计算根数（200px / (3+1.5) ≈ 44）', async () => {
    const wrapper = mount(EvCreditsProgress, { props: { used: 500, total: 1000 }, attachTo: document.body })
    await wrapper.vm.$nextTick()
    const bars = wrapper.findAll('.ev-credits-progress__bar')
    expect(bars.length).toBeGreaterThanOrEqual(40)
    expect(bars.length).toBeLessThanOrEqual(45)
    // 50% 填充
    const filled = wrapper.findAll('.ev-credits-progress__bar--filled')
    expect(filled.length).toBeCloseTo(bars.length / 2, -1)
    wrapper.unmount()
  })

  it('超额转 danger 类', async () => {
    const wrapper = mount(EvCreditsProgress, { props: { used: 1200, total: 1000 }, attachTo: document.body })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-credits-progress__fence').classes()).toContain('ev-credits-progress__fence--over')
    wrapper.unmount()
  })

  it('剩余 <20% 转 warn 类', () => {
    const wrapper = mount(EvCreditsProgress, { props: { used: 850, total: 1000 } })
    expect(wrapper.find('.ev-credits-progress__remain--warn').exists()).toBe(true)
  })

  it('size 修饰类', () => {
    const wrapper = mount(EvCreditsProgress, { props: { used: 1, total: 10, size: 'small' } })
    expect(wrapper.classes()).toContain('ev-credits-progress--small')
  })

  it('自定义颜色变量', () => {
    const wrapper = mount(EvCreditsProgress, {
      props: { used: 1, total: 10, filledColor: '#0a0', emptyColor: '#eee', barHeight: 20 },
    })
    const style = wrapper.find('.ev-credits-progress__fence').attributes('style')
    expect(style).toContain('--bar-filled: #0a0')
    expect(style).toContain('--bar-empty: #eee')
    expect(style).toContain('height: 20px')
  })
})

describe('EvGanttProgress', () => {
  const stages = [
    { name: '需求', status: 'completed', date: '01-01' },
    { name: '开发', status: 'active', date: '01-15' },
    { name: '上线', status: 'pending' },
  ]

  it('结构：连接线 + 阶段柱 + 标签', () => {
    const wrapper = mount(EvGanttProgress, { props: { stages } })
    expect(wrapper.find('.ev-gantt-progress__connector').exists()).toBe(true)
    const bars = wrapper.findAll('.ev-gantt-progress__bar')
    expect(bars).toHaveLength(3)
    expect(bars[0].classes()).toContain('ev-gantt-progress__bar--completed')
    expect(bars[1].classes()).toContain('ev-gantt-progress__bar--active')
    expect(bars[2].classes()).toContain('ev-gantt-progress__bar--pending')
    const names = wrapper.findAll('.ev-gantt-progress__label-name')
    expect(names[0].text()).toBe('需求')
    expect(wrapper.find('.ev-gantt-progress__label-date').text()).toBe('01-01')
  })

  it('active 阶段渲染脉冲', () => {
    const wrapper = mount(EvGanttProgress, { props: { stages } })
    expect(wrapper.find('.ev-gantt-progress__pulse').exists()).toBe(true)
  })

  it('连接线进度：active 在中间 → (1+0.5)/3 ≈ 50%', () => {
    const wrapper = mount(EvGanttProgress, { props: { stages } })
    expect(wrapper.find('.ev-gantt-progress__connector-fill').attributes('style')).toContain('width: 50%')
  })

  it('无 active：按 completed 比例', () => {
    const wrapper = mount(EvGanttProgress, {
      props: { stages: [{ name: 'a', status: 'completed' }, { name: 'b', status: 'completed' }, { name: 'c', status: 'pending' }] },
    })
    expect(wrapper.find('.ev-gantt-progress__connector-fill').attributes('style')).toContain('width: 66.66666666666666%')
    expect(wrapper.find('.ev-gantt-progress__pulse').exists()).toBe(false)
  })

  it('自定义高度与颜色变量', () => {
    const wrapper = mount(EvGanttProgress, {
      props: {
        stages: [{ name: 'a', status: 'active', height: 0.5 }],
        activeColor: '#f00',
      },
    })
    const bar = wrapper.find('.ev-gantt-progress__bar')
    expect(bar.attributes('style')).toContain('height: 50%')
    // jsdom 将 hex 归一化为 rgb
    expect(bar.attributes('style')).toContain('rgb(255, 0, 0)')
  })
})

describe('EvJsonViewer', () => {
  it('工具条：类型标注 + 复制按钮', async () => {
    const writeText = vi.fn().mockResolvedValue()
    Object.assign(navigator, { clipboard: { writeText } })
    const wrapper = mount(EvJsonViewer, { props: { data: { a: 1 } } })
    expect(wrapper.find('.ev-json-viewer__type').text()).toBe('object(1)')
    await wrapper.find('.ev-json-viewer__btn').trigger('click')
    expect(writeText).toHaveBeenCalledWith('{\n  "a": 1\n}')
    expect(wrapper.find('.ev-json-viewer__btn').text()).toBe('已复制')
  })

  it('数组根类型标注', () => {
    const wrapper = mount(EvJsonViewer, { props: { data: [1, 2, 3] } })
    expect(wrapper.find('.ev-json-viewer__type').text()).toBe('array(3)')
  })

  it('expandedDepth=0：根折叠显示项数预览，点击展开', async () => {
    const wrapper = mount(EvJsonViewer, { props: { data: { a: 1, b: 2 }, expandedDepth: 0 } })
    expect(wrapper.find('.ev-json-viewer__preview').text()).toBe('{2 项}')
    expect(wrapper.find('.ev-json-viewer__children').exists()).toBe(false)
    await wrapper.find('.ev-json-viewer__line--head').trigger('click')
    expect(wrapper.find('.ev-json-viewer__children').exists()).toBe(true)
    // text() 会修剪元素文本两端空白 → 'a:' 而非 'a: '
    expect(wrapper.findAll('.ev-json-viewer__key').map((k) => k.text())).toEqual(['a:', 'b:'])
  })

  it('expandedDepth=2 默认展开到二层', () => {
    const wrapper = mount(EvJsonViewer, {
      props: { data: { a: { b: { c: 1 } } } },
    })
    // depth0 根展开、depth1 a 展开、depth2 b 折叠（<2 判断：depth<defaultDepth）
    expect(wrapper.findAll('.ev-json-viewer__children').length).toBeGreaterThanOrEqual(1)
    expect(wrapper.find('.ev-json-viewer__preview').exists()).toBe(true)
  })

  it('值着色类与标量渲染', () => {
    const wrapper = mount(EvJsonViewer, {
      props: { data: { s: '文本', n: 3.14, bo: true, nu: null }, toolbar: false, expandedDepth: 3 },
    })
    const content = wrapper.find('.ev-json-viewer__content').text()
    expect(content).toContain('"文本"')
    expect(content).toContain('3.14')
    expect(content).toContain('true')
    expect(content).toContain('null')
  })

  it('长字符串截断 + 展开按钮', async () => {
    const long = 'x'.repeat(150)
    const wrapper = mount(EvJsonViewer, { props: { data: { s: long }, expandedDepth: 3 } })
    // 字符串节点也持有 expanded 状态；expandedDepth=3 → depth1 已展开 → 长串初始不截断
    const inline = wrapper.find('.ev-json-viewer__toggle-inline')
    expect(inline.exists()).toBe(true)
    expect(inline.text()).toBe('收起')
    expect(wrapper.find('.ev-json-viewer__value span').text().length).toBeGreaterThan(140)
    await inline.trigger('click')
    // 收起后截断为 120 字符 + 省略号
    expect(wrapper.find('.ev-json-viewer__value span').text().length).toBeLessThan(130)
    expect(inline.text()).toBe('展开 150 字符')
  })

  it('数组项渲染 + 嵌套数组', () => {
    // 数组项默认展开需 expandedDepth 覆盖到 depth2（数组 depth1 → 对象 depth2）
    const wrapper = mount(EvJsonViewer, { props: { data: [{ id: 1 }, { id: 2 }], expandedDepth: 3 } })
    const content = wrapper.find('.ev-json-viewer__content').text()
    expect((content.match(/id:/g) || []).length).toBe(2)
  })

  it('toolbar=false 不渲染工具条', () => {
    const wrapper = mount(EvJsonViewer, { props: { data: 1, toolbar: false } })
    expect(wrapper.find('.ev-json-viewer__toolbar').exists()).toBe(false)
    expect(wrapper.find('.ev-json-viewer__content').text()).toBe('1')
  })
})
