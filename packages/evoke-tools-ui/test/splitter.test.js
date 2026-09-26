import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EtSplitter from '../src/components/splitter/index.vue'
import EtSplitterPanel from '../src/components/splitter/panel.vue'

const mountSplitter = (splitProps = {}, panelProps = 'default-size="30%"') =>
  mount(
    {
      components: { EtSplitter, EtSplitterPanel },
      template: `
        <et-splitter v-bind="splitProps" style="width: 1000px; height: 500px;">
          <et-splitter-panel ${panelProps}>A</et-splitter-panel>
          <et-splitter-panel>B</et-splitter-panel>
        </et-splitter>
      `,
      setup() {
        return { splitProps }
      },
    },
    { attachTo: document.body }
  )

describe('EtSplitter / EtSplitterPanel', () => {
  beforeEach(() => {
    // jsdom 无布局：给容器 mock 尺寸（与底座 splitter.test.js 同法）
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('作用域类 et-splitter + 底座双 class + 默认 horizontal', async () => {
    const wrapper = mountSplitter()
    await nextTick()
    expect(wrapper.find('.et-splitter').exists()).toBe(true)
    expect(wrapper.find('.eb-splitter').classes()).toContain('is-horizontal')
    wrapper.unmount()
  })

  it('子面板渲染 + 拖拽条 + 插槽内容透传', async () => {
    const wrapper = mountSplitter({}, '')
    await nextTick()
    expect(wrapper.findAll('.eb-splitter-panel')).toHaveLength(2)
    expect(wrapper.find('.eb-splitter__bar').exists()).toBe(true)
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('B')
    wrapper.unmount()
  })

  it('布局透传：vertical', async () => {
    const wrapper = mountSplitter({ layout: 'vertical' })
    await nextTick()
    expect(wrapper.find('.eb-splitter').classes()).toContain('is-vertical')
    wrapper.unmount()
  })

  it('defaultSize 分摊 + resize 事件转发', async () => {
    const wrapper = mountSplitter()
    await nextTick()
    const panels = wrapper.findAll('.eb-splitter-panel')
    expect(panels[0].attributes('style')).toContain('width: 300px')
    expect(panels[1].attributes('style')).toContain('width: 700px')
    const emitted = wrapper.findComponent(EtSplitter).emitted('resize')
    expect(emitted).toBeTruthy()
    const sizes = emitted[emitted.length - 1][0]
    expect(sizes).toEqual(['30.00%', '70.00%'])
    wrapper.unmount()
  })

  it('面板 props 透传：collapsible 折叠按钮可把面板收进相邻面板', async () => {
    const wrapper = mountSplitter({}, 'default-size="30%" collapsible')
    await nextTick()
    const btns = wrapper.findAll('.eb-splitter__bar-btn')
    expect(btns.length).toBe(1)
    await btns[0].trigger('click')
    const panels = wrapper.findAll('.eb-splitter-panel')
    expect(panels[0].attributes('style')).toContain('width: 0px')
    expect(panels[1].attributes('style')).toContain('width: 1000px')
    wrapper.unmount()
  })
})

describe('EtSplitter 键盘 resize（1.2.0 还清 M0 欠账）', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  const mountSplitter = (panelProps = '') =>
    mount(
      {
        components: { EtSplitter, EtSplitterPanel },
        template: `
          <et-splitter layout="horizontal" style="width: 1000px">
            <et-splitter-panel ${panelProps}>A</et-splitter-panel>
            <et-splitter-panel>B</et-splitter-panel>
          </et-splitter>`,
      },
      { attachTo: document.body },
    )

  it('分隔器语义与方向键（本族直通底座键盘 resize）', async () => {
    const wrapper = mountSplitter('default-size="200px" min="50" max="350"')
    await nextTick()
    const bar = wrapper.find('[role="separator"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('tabindex')).toBe('0')
    const widths = () => wrapper.findAll('.et-splitter-panel, .eb-splitter-panel').map((el) => el.attributes('style'))
    const before = widths()
    await bar.trigger('keydown', { key: 'ArrowRight' })
    expect(widths()).not.toEqual(before)
    expect(widths()[0]).toContain('208px')
    wrapper.unmount()
  })

  it('keyboardStep 透传（24px 步长一次到位）', async () => {
    const wrapper = mountSplitter('default-size="200px" :keyboard-step="24"')
    await nextTick()
    await wrapper.find('[role="separator"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.findAll('.eb-splitter-panel')[0].attributes('style')).toContain('224px')
    wrapper.unmount()
  })

  it('组字中的方向键不动尺寸（与 G5 同口径）', async () => {
    const wrapper = mountSplitter('')
    await nextTick()
    const bar = wrapper.find('[role="separator"]')
    const before = wrapper.findAll('.eb-splitter-panel').map((el) => el.attributes('style'))
    await bar.trigger('keydown', { key: 'ArrowRight', isComposing: true })
    expect(wrapper.findAll('.eb-splitter-panel').map((el) => el.attributes('style'))).toEqual(before)
    wrapper.unmount()
  })
})
