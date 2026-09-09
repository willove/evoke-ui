import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvSplitter from '../src/components/splitter/index.vue'
import EvSplitterPanel from '../src/components/splitter/panel.vue'
import EvUpload from '../src/components/upload/index.vue'
import EvCalendar from '../src/components/calendar/index.vue'

describe('EvSplitter / EvSplitterPanel', () => {
  beforeEach(() => {
    // jsdom 无布局：给容器 mock 尺寸
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  const mountSplitter = (props = {}, panelProps = `default-size="30%"`) =>
    mount(
      {
        components: { EvSplitter, EvSplitterPanel },
        template: `
          <ev-splitter v-bind="props" style="width: 1000px; height: 500px;">
            <ev-splitter-panel ${panelProps}>A</ev-splitter-panel>
            <ev-splitter-panel>B</ev-splitter-panel>
          </ev-splitter>
        `,
        setup() {
          return { props }
        },
      },
      { attachTo: document.body },
    )

  it('双 class + 面板渲染 + 拖拽条', async () => {
    const wrapper = mountSplitter({}, '')
    await nextTick()
    expect(wrapper.find('.ev-splitter').classes()).toContain('is-horizontal')
    expect(wrapper.findAll('.ev-splitter-panel')).toHaveLength(2)
    expect(wrapper.find('.ev-splitter__bar').exists()).toBe(true)
    wrapper.unmount()
  })

  it('defaultSize 百分比分摊 + 未指定面板均分剩余', async () => {
    const wrapper = mountSplitter()
    await nextTick()
    const panels = wrapper.findAll('.ev-splitter-panel')
    expect(panels[0].attributes('style')).toContain('width: 300px')
    // 剩余 700 均分给 1 个未指定面板
    expect(panels[1].attributes('style')).toContain('width: 700px')
    wrapper.unmount()
  })

  it('resize 事件回传百分比', async () => {
    const wrapper = mountSplitter()
    await nextTick()
    const emitted = wrapper.findComponent(EvSplitter).emitted('resize')
    expect(emitted).toBeTruthy()
    const sizes = emitted[emitted.length - 1][0]
    expect(sizes).toEqual(['30.00%', '70.00%'])
    wrapper.unmount()
  })

  it('拖拽：mousedown bar → mousemove → 尺寸变化且 min/max 受限', async () => {
    const wrapper = mountSplitter({}, `default-size="30%" min="20%" max="50%"`)
    await nextTick()
    const bar = wrapper.find('.ev-splitter__bar')
    expect(bar.classes()).toContain('is-draggable')
    await bar.trigger('mousedown', { clientX: 300 })
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 450 }))
    document.dispatchEvent(new MouseEvent('mouseup', {}))
    await nextTick()
    const panels = wrapper.findAll('.ev-splitter-panel')
    // 300+150=450 → 45%（max 50% 内）
    expect(panels[0].attributes('style')).toContain('width: 450px')
    wrapper.unmount()
  })

  it('collapsible：点击折叠按钮把面板收进相邻面板', async () => {
    const wrapper = mountSplitter({}, `default-size="30%" collapsible`)
    await nextTick()
    // 第一面板的 bar：index 0 无"向前折叠"，仅"向后折叠"一个按钮
    const btns = wrapper.findAll('.ev-splitter__bar-btn')
    expect(btns).toHaveLength(1)
    await btns[0].trigger('click') // 向后折叠
    const panels = wrapper.findAll('.ev-splitter-panel')
    expect(panels[0].attributes('style')).toContain('width: 0px')
    expect(panels[1].attributes('style')).toContain('width: 1000px')
    wrapper.unmount()
  })

  it('vertical 布局类', async () => {
    const wrapper = mountSplitter({ layout: 'vertical' })
    await nextTick()
    expect(wrapper.find('.ev-splitter').classes()).toContain('is-vertical')
    wrapper.unmount()
  })

  it('resizable=false 时拖拽条禁用', async () => {
    const wrapper = mount(
      {
        components: { EvSplitter, EvSplitterPanel },
        template: `
          <ev-splitter style="width: 1000px; height: 500px;">
            <ev-splitter-panel default-size="30%">A</ev-splitter-panel>
            <ev-splitter-panel :resizable="false">B</ev-splitter-panel>
          </ev-splitter>
        `,
      },
      { attachTo: document.body },
    )
    await nextTick()
    expect(wrapper.find('.ev-splitter__bar').classes()).toContain('is-disabled')
    wrapper.unmount()
  })
})

describe('EvUpload', () => {
  it('双 class + 隐藏 input（绝对定位 opacity 0）', () => {
    const wrapper = mount(EvUpload, { props: { action: '/upload' }, slots: { default: '' } })
    expect(wrapper.find('.ev-upload--text').exists()).toBe(true)
    const input = wrapper.find('input[type="file"]')
    expect(input.exists()).toBe(true)
    expect(input.classes()).toContain('ev-upload__input')
    expect(input.attributes('style') || wrapper.find('.ev-upload__input').attributes('style') || '').toBe('')
    // 样式约束在 CSS 层（position:absolute; opacity:0），DOM 断言 class 存在
  })

  it('change 选择文件后入列表并 emit', async () => {
    const wrapper = mount(EvUpload, { props: { action: '/upload', autoUpload: false }, attachTo: document.body })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'a.txt', { type: 'text/plain' })],
      configurable: true,
    })
    await input.trigger('change')
    expect(wrapper.emitted('change')).toHaveLength(1)
    expect(wrapper.emitted('change')[0][0].name).toBe('a.txt')
    expect(wrapper.emitted('change')[0][0].status).toBe('ready')
    expect(wrapper.find('.ev-upload-list__item').text()).toContain('a.txt')
    wrapper.unmount()
  })

  it('multiple + limit 超限发 exceed', async () => {
    const wrapper = mount(EvUpload, { props: { action: '/upload', limit: 1, autoUpload: false }, attachTo: document.body })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'a.txt'), new File(['y'], 'b.txt')],
      configurable: true,
    })
    await input.trigger('change')
    expect(wrapper.emitted('exceed')).toHaveLength(1)
    expect(wrapper.emitted('exceed')[0][0]).toHaveLength(2)
    wrapper.unmount()
  })

  it('拖拽模式渲染 dragger', () => {
    const wrapper = mount(EvUpload, { props: { action: '/upload', drag: true } })
    expect(wrapper.find('.ev-upload-dragger').exists()).toBe(true)
    expect(wrapper.find('.ev-upload__text').exists()).toBe(true)
  })

  it('手动提交（autoUpload=false + submit expose）', async () => {
    const wrapper = mount(EvUpload, { props: { action: '/upload', autoUpload: false }, attachTo: document.body })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'a.txt')],
      configurable: true,
    })
    await input.trigger('change')
    expect(wrapper.emitted('change')).toHaveLength(1)
    // 无 XHR 触发（jsdom XHR 到无效地址会静默失败，不 mock 也无妨）；submit 可调用
    expect(() => wrapper.vm.submit()).not.toThrow()
    wrapper.unmount()
  })

  it('remove：点击关闭按钮移除文件', async () => {
    const wrapper = mount(EvUpload, { props: { action: '/upload', autoUpload: false }, attachTo: document.body })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'a.txt')],
      configurable: true,
    })
    await input.trigger('change')
    await wrapper.find('.ev-upload-list__item-close').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
    expect(wrapper.find('.ev-upload-list__item').exists()).toBe(false)
    wrapper.unmount()
  })

  it('clearFiles expose', async () => {
    const wrapper = mount(EvUpload, { props: { action: '/upload', autoUpload: false }, attachTo: document.body })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'a.txt')],
      configurable: true,
    })
    await input.trigger('change')
    wrapper.vm.clearFiles()
    await nextTick()
    expect(wrapper.find('.ev-upload-list').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('EvCalendar', () => {
  it('双 class + 月视图 42 格 + 周标签', () => {
    const wrapper = mount(EvCalendar, { props: { modelValue: new Date(2026, 8, 5) } })
    expect(wrapper.find('.ev-calendar').exists()).toBe(true)
    expect(wrapper.findAll('.ev-calendar__cell')).toHaveLength(42)
    expect(wrapper.findAll('.ev-calendar__weekday')).toHaveLength(7)
    // firstDayOfWeek=1 默认：周一在首位
    expect(wrapper.find('.ev-calendar__weekday').text()).toBe('一')
  })

  it('today 与选中标记', () => {
    const wrapper = mount(EvCalendar, { props: { modelValue: new Date(2026, 8, 5) } })
    expect(wrapper.find('.ev-calendar__cell.is-today').exists()).toBe(true)
    expect(wrapper.find('.ev-calendar__cell.is-selected').exists()).toBe(true)
  })

  it('firstDayOfWeek=0 周日开头', () => {
    const wrapper = mount(EvCalendar, { props: { firstDayOfWeek: 0 } })
    expect(wrapper.find('.ev-calendar__weekday').text()).toBe('日')
  })

  it('事件渲染 + event-click', async () => {
    const wrapper = mount(EvCalendar, {
      props: {
        modelValue: new Date(2026, 8, 5),
        events: [{ date: '2026-09-05', content: '评审', type: 'danger', id: 'e1' }],
      },
    })
    const evt = wrapper.find('.ev-calendar__cell-event.is-type-danger')
    expect(evt.exists()).toBe(true)
    expect(evt.text()).toBe('评审')
    await evt.trigger('click')
    expect(wrapper.emitted('event-click')).toHaveLength(1)
    expect(wrapper.emitted('event-click')[0][0].content).toBe('评审')
  })

  it('cell 点击更新 modelValue + select', async () => {
    const wrapper = mount(EvCalendar, { props: { modelValue: new Date(2026, 8, 5) } })
    const cells = wrapper.findAll('.ev-calendar__cell')
    await cells[10].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('select')[0][1]).toEqual({ source: 'cell' })
  })

  it('disabledDate 拦截点击', async () => {
    const wrapper = mount(EvCalendar, {
      props: { modelValue: new Date(2026, 8, 5), disabledDate: () => true },
    })
    await wrapper.findAll('.ev-calendar__cell')[10].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.findAll('.ev-calendar__cell')[10].classes()).toContain('is-disabled')
  })

  it('prev/next 导航 + panel-change + 标题切换', async () => {
    const wrapper = mount(EvCalendar, { props: { modelValue: new Date(2026, 8, 5) } })
    expect(wrapper.find('.ev-calendar__title').text()).toBe('2026年9月')
    await wrapper.findAll('.ev-calendar__nav-btn')[0].trigger('click')
    expect(wrapper.find('.ev-calendar__title').text()).toBe('2026年8月')
    expect(wrapper.emitted('panel-change')).toEqual([[{ year: 2026, month: 8 }]])
  })

  it('年视图切换 + 点击月份回到月视图', async () => {
    const wrapper = mount(EvCalendar, { props: { modelValue: new Date(2026, 8, 5) } })
    wrapper.vm.setMode('year')
    await nextTick()
    expect(wrapper.find('.ev-calendar--year').exists()).toBe(true)
    expect(wrapper.findAll('.ev-calendar__year-month')).toHaveLength(12)
    await wrapper.findAll('.ev-calendar__year-month')[0].trigger('click')
    await nextTick()
    expect(wrapper.find('.ev-calendar__grid').exists()).toBe(true)
  })

  it('range 高亮', () => {
    const wrapper = mount(EvCalendar, {
      props: { modelValue: new Date(2026, 8, 5), range: [new Date(2026, 8, 1), new Date(2026, 8, 7)] },
    })
    expect(wrapper.findAll('.ev-calendar__cell.is-in-range').length).toBeGreaterThanOrEqual(7)
  })

  it('date-cell 插槽覆盖默认事件渲染', () => {
    const wrapper = mount(EvCalendar, {
      props: {
        modelValue: new Date(2026, 8, 5),
        events: [{ date: '2026-09-05', content: '评审' }],
      },
      slots: {
        'date-cell': `<template #date-cell="{data}"><i class="custom-cell">{{data.date}}</i></template>`,
      },
    })
    expect(wrapper.find('.custom-cell').exists()).toBe(true)
  })
})
