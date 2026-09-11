import { mount, describe, it, expect, EvCard, EvNavbar, EvConfigProvider } from './helpers'
import { useThemeConfig } from '../src/composables/useThemeConfig'

describe('glass 三态 prop', () => {
  it('glass=true 渲染 is-glass', () => {
    const wrapper = mount(EvCard, { props: { glass: true } })
    expect(wrapper.classes()).toContain('is-glass')
    expect(wrapper.classes()).not.toContain('no-glass')
  })

  it('glass=false 渲染 no-glass（用于脱离全局开关）', () => {
    const wrapper = mount(EvCard, { props: { glass: false } })
    expect(wrapper.classes()).toContain('no-glass')
    expect(wrapper.classes()).not.toContain('is-glass')
  })

  it('缺省时两个类都不渲染（跟随全局）', () => {
    const wrapper = mount(EvCard)
    expect(wrapper.classes()).not.toContain('is-glass')
    expect(wrapper.classes()).not.toContain('no-glass')
  })

  it('navbar 同样支持三态', () => {
    expect(mount(EvNavbar, { props: { glass: true, items: [] } }).classes()).toContain('is-glass')
    expect(mount(EvNavbar, { props: { glass: false, items: [] } }).classes()).toContain('no-glass')
  })
})

describe('全局磨砂开关', () => {
  it('setGlass(true/false) 写入并移除 html[data-ev-glass]', () => {
    const { setGlass } = useThemeConfig()
    setGlass(true)
    expect(document.documentElement.getAttribute('data-ev-glass')).toBe('on')
    setGlass(false)
    expect(document.documentElement.hasAttribute('data-ev-glass')).toBe(false)
  })

  it('reset 后磨砂关闭', () => {
    const { setGlass, reset } = useThemeConfig()
    setGlass(true)
    reset()
    expect(document.documentElement.hasAttribute('data-ev-glass')).toBe(false)
  })

  it('EvConfigProvider glass prop 联动全局属性', () => {
    const wrapper = mount(EvConfigProvider, {
      props: { glass: true },
      slots: { default: 'x' },
    })
    expect(document.documentElement.getAttribute('data-ev-glass')).toBe('on')
    wrapper.unmount()
  })
})
