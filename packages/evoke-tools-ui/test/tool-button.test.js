import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EtToolButton from '../src/components/tool-button/index.vue'

describe('EtToolButton 渲染契约', () => {
  it('large（默认）挂 et-toolbtn 双 class 与形态类，渲染图标盒 + caption 行', () => {
    const wrapper = mount(EtToolButton, { props: { icon: 'bold', label: '加粗' } })
    expect(wrapper.classes()).toContain('et-toolbtn')
    expect(wrapper.classes()).toContain('et-toolbtn--large')
    expect(wrapper.classes()).not.toContain('et-toolbtn--small')
    // 双 class 特异性（与底座 SFC 范式一致；classList 会去重，故查原始属性串）
    const cls = wrapper.element.getAttribute('class') || ''
    expect(cls.split(/\s+/).filter((t) => t === 'et-toolbtn')).toHaveLength(2)
    expect(wrapper.find('.et-toolbtn__icon').exists()).toBe(true)
    expect(wrapper.find('.et-toolbtn__caption').exists()).toBe(true)
    expect(wrapper.find('.et-toolbtn__text').text()).toBe('加粗')
  })

  it('small 只渲染图标，不渲染图标盒与 caption', () => {
    const wrapper = mount(EtToolButton, { props: { size: 'small', icon: 'bold', label: '加粗' } })
    expect(wrapper.classes()).toContain('et-toolbtn--small')
    expect(wrapper.find('.et-toolbtn__icon').exists()).toBe(false)
    expect(wrapper.find('.et-toolbtn__caption').exists()).toBe(false)
    expect(wrapper.find('.et-icon').exists()).toBe(true)
  })

  it('已注册图标名经 EtIcon 渲染出图标元素', () => {
    const wrapper = mount(EtToolButton, { props: { icon: 'bold' } })
    expect(wrapper.find('.et-toolbtn__icon .et-icon').exists()).toBe(true)
  })

  it('icon 为空字符串时不渲染图标盒（兜底判定归 EtIcon）', () => {
    const wrapper = mount(EtToolButton, { props: { label: '插入' } })
    expect(wrapper.find('.et-toolbtn__icon').exists()).toBe(false)
    expect(wrapper.find('.et-icon').exists()).toBe(false)
  })

  it('caret 渲染 caption 行右侧的下拉指示', () => {
    const wrapper = mount(EtToolButton, { props: { icon: 'bold', label: '插入', caret: true } })
    const caret = wrapper.find('.et-toolbtn__caret')
    expect(caret.exists()).toBe(true)
    expect(caret.find('.et-icon').exists()).toBe(true)
  })

  it('无 label 时 large 不渲染 caption 行（不占行高）', () => {
    const wrapper = mount(EtToolButton, { props: { icon: 'bold', label: '' } })
    expect(wrapper.find('.et-toolbtn__caption').exists()).toBe(false)
  })
})

describe('EtToolButton 状态与可访问名', () => {
  it('aria-label 来自 label（G4 可访问名）', () => {
    const wrapper = mount(EtToolButton, { props: { icon: 'bold', label: '加粗' } })
    expect(wrapper.attributes('aria-label')).toBe('加粗')
  })

  it('label 为空时不输出 aria-label 属性', () => {
    const wrapper = mount(EtToolButton, { props: { icon: 'bold', label: '' } })
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('active 时输出 aria-pressed=true，否则不输出该属性', () => {
    const active = mount(EtToolButton, { props: { icon: 'bold', label: '加粗', active: true } })
    expect(active.attributes('aria-pressed')).toBe('true')
    expect(active.classes()).toContain('is-active')
    const inactive = mount(EtToolButton, { props: { icon: 'bold', label: '加粗' } })
    expect(inactive.attributes('aria-pressed')).toBeUndefined()
    expect(inactive.classes()).not.toContain('is-active')
  })

  it('disabled 时带 disabled 属性与状态类，且点击不触发 click', async () => {
    const wrapper = mount(EtToolButton, {
      props: { icon: 'bold', label: '加粗', disabled: true },
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('is-disabled')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('可点击时触发 click 并冒泡 MouseEvent', async () => {
    const wrapper = mount(EtToolButton, { props: { icon: 'bold', label: '加粗' } })
    await wrapper.trigger('click')
    const events = wrapper.emitted('click')
    expect(events).toHaveLength(1)
    expect(events[0][0]).toBeInstanceOf(MouseEvent)
  })
})

describe('EtToolButton ScreenTip 包裹', () => {
  it('small 提供 tip 时用 EtScreenTip 包裹按钮，并透传提示内容', async () => {
    const { default: EtScreenTip } = await import('../src/components/screen-tip/index.vue')
    const wrapper = mount(EtToolButton, {
      props: { size: 'small', icon: 'bold', label: '加粗', tip: '加粗' },
    })
    const tip = wrapper.findComponent(EtScreenTip)
    expect(tip.exists()).toBe(true)
    expect(tip.props('title')).toBe('加粗')
    // 包裹不吞按钮本体：仍带 class、可访问名与禁用态
    const button = wrapper.find('button.et-toolbtn')
    expect(button.exists()).toBe(true)
    expect(button.attributes('aria-label')).toBe('加粗')
  })

  it('tip 为对象（title/desc/combo）时分别透传三个 prop', async () => {
    const { default: EtScreenTip } = await import('../src/components/screen-tip/index.vue')
    const wrapper = mount(EtToolButton, {
      props: {
        size: 'small',
        icon: 'bold',
        label: '加粗',
        tip: { title: '加粗', desc: '设为粗体', combo: 'mod+b' },
      },
    })
    const tip = wrapper.findComponent(EtScreenTip)
    expect(tip.exists()).toBe(true)
    expect(tip.props('title')).toBe('加粗')
    expect(tip.props('desc')).toBe('设为粗体')
    expect(tip.props('combo')).toBe('mod+b')
  })

  it('不提供 tip 时根节点即按钮（无多余包裹层）', () => {
    const wrapper = mount(EtToolButton, { props: { icon: 'bold', label: '加粗' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
  })
})
