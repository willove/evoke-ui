import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvIcon from '../src/components/icon/index.vue'
import { registerIcons, getIconByName, getIconNames, hasIcon, defineComponent, h } from './helpers'

describe('EvIcon / 图标注册表', () => {
  it('核心集渲染内置 SVG', () => {
    const wrapper = mount(EvIcon, { props: { name: 'search', size: 20 } })
    expect(wrapper.classes()).toContain('ev-icon')
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(wrapper.attributes('style')).toContain('font-size: 20px')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })

  it('语义名检索：核心集常用图标存在', () => {
    for (const name of ['close', 'check', 'plus', 'menu', 'sun', 'moon', 'github', 'copy', 'download']) {
      expect(hasIcon(name), `核心集应含 ${name}`).toBe(true)
    }
  })

  it('size 支持字符串', () => {
    const wrapper = mount(EvIcon, { props: { name: 'search', size: '1.5em' } })
    expect(wrapper.attributes('style')).toContain('font-size: 1.5em')
  })

  it('color 覆写', () => {
    const wrapper = mount(EvIcon, { props: { name: 'search', color: 'red' } })
    expect(wrapper.attributes('style')).toContain('color: red')
  })

  it('未知名称回退到插槽', () => {
    const wrapper = mount(EvIcon, {
      props: { name: 'not-exist-icon' },
      slots: { default: h('b', 'fallback') },
    })
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.text()).toBe('fallback')
  })

  it('registerIcons 注册自定义组件并可解析', () => {
    const Custom = defineComponent({ render: () => h('i', 'custom') })
    registerIcons({ 'my-custom-icon': Custom })
    expect(getIconByName('my-custom-icon')).toBe(Custom)
    expect(getIconNames()).toContain('my-custom-icon')

    const wrapper = mount(EvIcon, { props: { name: 'my-custom-icon' } })
    expect(wrapper.text()).toBe('custom')
  })

  it('loadShowcaseIcons 加载展示集后可按 Remix 原生名渲染', async () => {
    const { loadShowcaseIcons } = await import('../src/components/icon/iconRegistry')
    await loadShowcaseIcons()
    expect(hasIcon('brush-line')).toBe(true)
    const wrapper = mount(EvIcon, { props: { name: 'brush-line' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
