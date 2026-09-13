import {
  mount, describe, it, expect,
  EvCard, EvNavbar, EvConfigProvider,
  EvModal, EvImagePreview, EvActionSheet, EvTabbar, EvSelect, EvNavBar, EvExecCard,
} from './helpers'
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
    expect(document.documentElement.hasAttribute('data-ev-glass')).toBe(false)
  })
})

describe('弹层/预览/导航家族三态', () => {
  // Teleport 到 body 的弹层：wrapper 内找不到，改查 document.body；断言后卸载防串扰。
  // isolate:false 下 body 跨文件共享，先清掉历史残留，保证查到的必然是本用例挂载的节点
  function teleportedHasClass(component, props, selector, cls) {
    document.querySelectorAll(selector).forEach((el) => el.remove())
    const wrapper = mount(component, { props })
    const has = document.body.querySelector(selector)?.classList.contains(cls) ?? false
    wrapper.unmount()
    return has
  }

  it('modal：玻璃类挂在面板上', () => {
    expect(teleportedHasClass(EvModal, { glass: true, modelValue: true }, '.ev-modal__panel', 'is-glass')).toBe(true)
    expect(teleportedHasClass(EvModal, { glass: false, modelValue: true }, '.ev-modal__panel', 'no-glass')).toBe(true)
    expect(teleportedHasClass(EvModal, { modelValue: true }, '.ev-modal__panel', 'is-glass')).toBe(false)
  })

  it('image-preview：玻璃类挂在遮罩根元素上', () => {
    expect(teleportedHasClass(EvImagePreview, { glass: true, modelValue: true }, '.ev-image-preview', 'is-glass')).toBe(true)
    expect(teleportedHasClass(EvImagePreview, { glass: false, modelValue: true }, '.ev-image-preview', 'no-glass')).toBe(true)
  })

  it('action-sheet：玻璃类挂在面板上', () => {
    const props = { glass: true, modelValue: true, actions: [{ name: 'a' }] }
    expect(teleportedHasClass(EvActionSheet, props, '.ev-action-sheet', 'is-glass')).toBe(true)
  })

  it('tabbar / nav-bar：玻璃类挂在根元素上', () => {
    expect(mount(EvTabbar, { props: { glass: true } }).find('.ev-tabbar').classes()).toContain('is-glass')
    expect(mount(EvNavBar, { props: { glass: false } }).classes()).toContain('no-glass')
  })

  it('select：玻璃类挂在根元素上（作用于下拉面板）', () => {
    const opts = [{ label: 'A', value: 'a' }]
    expect(mount(EvSelect, { props: { glass: true, options: opts } }).classes()).toContain('is-glass')
    expect(mount(EvSelect, { props: { glass: false, options: opts } }).classes()).toContain('no-glass')
  })

  it('exec-card 同样支持三态', () => {
    expect(mount(EvExecCard, { props: { glass: true } }).classes()).toContain('is-glass')
    expect(mount(EvExecCard, { props: { glass: false } }).classes()).toContain('no-glass')
  })
})

describe('blur 磨砂强度 prop', () => {
  it('数字拼 px 内联覆盖 --ev-glass-blur', () => {
    const wrapper = mount(EvCard, { props: { blur: 24 } })
    expect(wrapper.element.style.getPropertyValue('--ev-glass-blur')).toBe('24px')
  })

  it('字符串透传（可直接给带单位值）', () => {
    const wrapper = mount(EvCard, { props: { blur: '8px' } })
    expect(wrapper.element.style.getPropertyValue('--ev-glass-blur')).toBe('8px')
  })

  it('缺省不产出内联样式（跟随令牌）', () => {
    const wrapper = mount(EvCard)
    expect(wrapper.element.getAttribute('style')).toBe(null)
  })

  it('0 显式生效（不能用 truthy 判空）', () => {
    const wrapper = mount(EvCard, { props: { blur: 0 } })
    expect(wrapper.element.style.getPropertyValue('--ev-glass-blur')).toBe('0px')
  })

  it('弹层家族同样支持 blur', () => {
    function teleportedVar(component, props, selector) {
      document.querySelectorAll(selector).forEach((el) => el.remove())
      const wrapper = mount(component, { props })
      const v = document.body.querySelector(selector)?.style.getPropertyValue('--ev-glass-blur')
      wrapper.unmount()
      return v
    }
    expect(teleportedVar(EvModal, { blur: 10, modelValue: true }, '.ev-modal__panel')).toBe('10px')
    expect(teleportedVar(EvImagePreview, { blur: 10, modelValue: true }, '.ev-image-preview')).toBe('10px')
    expect(teleportedVar(EvActionSheet, { blur: 10, modelValue: true }, '.ev-action-sheet')).toBe('10px')
  })
})
