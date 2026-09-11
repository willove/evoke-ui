import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EvCard from '../src/components/card/index.vue'
import EvSectionCard from '../src/components/section-card/index.vue'
import EvDialog from '../src/components/dialog/index.vue'
import EvConfigProvider from '../src/components/config-provider/index.vue'
import { setGlass } from '../src/utils/theme'

beforeEach(() => {
  document.documentElement.removeAttribute('data-ev-glass')
})

describe('EvCard glass 三态 prop', () => {
  it('glass=true 渲染 is-glass', () => {
    const wrapper = mount(EvCard, { props: { glass: true }, slots: { default: 'x' } })
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

  it('section-card 同样支持三态', () => {
    expect(mount(EvSectionCard, { props: { glass: true, title: 'T' } }).classes()).toContain('is-glass')
    expect(mount(EvSectionCard, { props: { glass: false, title: 'T' } }).classes()).toContain('no-glass')
  })
})

describe('全局磨砂开关', () => {
  it('setGlass(true/false) 写入并移除 html[data-ev-glass]', () => {
    expect(setGlass(true)).toBe(true)
    expect(document.documentElement.getAttribute('data-ev-glass')).toBe('on')
    expect(setGlass(false)).toBe(true)
    expect(document.documentElement.hasAttribute('data-ev-glass')).toBe(false)
  })

  it('EvConfigProvider glass 联动全局属性，卸载后恢复', () => {
    const wrapper = mount(EvConfigProvider, {
      props: { glass: true },
      slots: { default: 'x' },
    })
    expect(document.documentElement.getAttribute('data-ev-glass')).toBe('on')
    wrapper.unmount()
    expect(document.documentElement.hasAttribute('data-ev-glass')).toBe(false)
  })

  it('dialog 支持 glass prop（挂载于 Teleport）', async () => {
    const wrapper = mount(EvDialog, { props: { modelValue: true, glass: true, title: 'T' } })
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.ev-dialog')?.classList.contains('is-glass')).toBe(true)
    wrapper.unmount()
  })
})
