import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EtScrollArea from '../src/components/scroll-area/index.vue'

/**
 * EtScrollArea 组件契约（tools-ui 计划 05 §四 L3 / M2）
 *
 * overflow 容器三件事：方向类（auto / vertical / horizontal）、slot 渲染、
 * 不引入第二套滚动条样式（本件只发类，滚动皮肤由消费方定）。
 */
describe('EtScrollArea', () => {
  it('默认 direction=auto：slot 渲染 + 方向类', () => {
    const wrapper = mount(EtScrollArea, {
      slots: { default: '<p class="row">内容行</p>' },
    })
    const root = wrapper.find('.et-scroll-area')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('et-scroll-area--auto')
    expect(root.find('.row').text()).toBe('内容行')
  })

  it('direction 切方向类：vertical / horizontal', () => {
    const vertical = mount(EtScrollArea, { props: { direction: 'vertical' } })
    expect(vertical.find('.et-scroll-area').classes()).toContain('et-scroll-area--vertical')

    const horizontal = mount(EtScrollArea, { props: { direction: 'horizontal' } })
    expect(horizontal.find('.et-scroll-area').classes()).toContain('et-scroll-area--horizontal')
  })

  it('多个 slot 内容同容器渲染（滚动区不裁内容）', () => {
    const wrapper = mount(EtScrollArea, {
      slots: { default: ['<span class="a">A</span>', '<span class="b">B</span>'] },
    })
    expect(wrapper.findAll('span')).toHaveLength(2)
    expect(wrapper.text()).toBe('AB')
  })
})
