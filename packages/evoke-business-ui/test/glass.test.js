import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EbCard from '../src/components/card/index.vue'
import EbSectionCard from '../src/components/section-card/index.vue'
import EbDialog from '../src/components/dialog/index.vue'
import EbConfigProvider from '../src/components/config-provider/index.vue'
import { setGlass } from '../src/utils/theme'

beforeEach(() => {
  document.documentElement.removeAttribute('data-eb-glass')
})

describe('EbCard glass 三态 prop', () => {
  it('glass=true 渲染 is-glass', () => {
    const wrapper = mount(EbCard, { props: { glass: true }, slots: { default: 'x' } })
    expect(wrapper.classes()).toContain('is-glass')
    expect(wrapper.classes()).not.toContain('no-glass')
  })

  it('glass=false 渲染 no-glass（用于脱离全局开关）', () => {
    const wrapper = mount(EbCard, { props: { glass: false } })
    expect(wrapper.classes()).toContain('no-glass')
    expect(wrapper.classes()).not.toContain('is-glass')
  })

  it('缺省时两个类都不渲染（跟随全局）', () => {
    const wrapper = mount(EbCard)
    expect(wrapper.classes()).not.toContain('is-glass')
    expect(wrapper.classes()).not.toContain('no-glass')
  })

  it('section-card 同样支持三态', () => {
    expect(mount(EbSectionCard, { props: { glass: true, title: 'T' } }).classes()).toContain('is-glass')
    expect(mount(EbSectionCard, { props: { glass: false, title: 'T' } }).classes()).toContain('no-glass')
  })
})

describe('全局磨砂开关', () => {
  it('setGlass(true/false) 写入并移除 html[data-eb-glass]', () => {
    expect(setGlass(true)).toBe(true)
    expect(document.documentElement.getAttribute('data-eb-glass')).toBe('on')
    expect(setGlass(false)).toBe(true)
    expect(document.documentElement.hasAttribute('data-eb-glass')).toBe(false)
  })

  it('EbConfigProvider glass 联动全局属性，卸载后恢复', () => {
    const wrapper = mount(EbConfigProvider, {
      props: { glass: true },
      slots: { default: 'x' },
    })
    expect(document.documentElement.getAttribute('data-eb-glass')).toBe('on')
    wrapper.unmount()
    expect(document.documentElement.hasAttribute('data-eb-glass')).toBe(false)
  })

  it('dialog 支持 glass prop（挂载于 Teleport）', async () => {
    const wrapper = mount(EbDialog, { props: { modelValue: true, glass: true, title: 'T' } })
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.eb-dialog')?.classList.contains('is-glass')).toBe(true)
    wrapper.unmount()
  })
})
