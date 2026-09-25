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
