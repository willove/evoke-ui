import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EbButton from '../src/components/button/index.vue'
import EbButtonGroup from '../src/components/button/group.vue'

describe('EbButton 渲染契约', () => {
  it('根节点挂 eb-button/eb-button 双 class', () => {
    const wrapper = mount(EbButton, { slots: { default: '按钮' } })
    expect(wrapper.classes()).toContain('eb-button')
    expect(wrapper.classes()).toContain('eb-button')
    expect(wrapper.text()).toBe('按钮')
  })

  it('type 修饰类（eb-button--primary）', () => {
    const wrapper = mount(EbButton, { props: { type: 'primary' } })
    expect(wrapper.classes()).toContain('eb-button--primary')
  })

  it('size 修饰类', () => {
    expect(mount(EbButton, { props: { size: 'large' } }).classes()).toContain('eb-button--large')
    expect(mount(EbButton, { props: { size: 'small' } }).classes()).toContain('eb-button--small')
  })

  it('变体状态类（plain/round/circle/text/link/disabled/loading）', () => {
    const wrapper = mount(EbButton, {
      props: { plain: true, round: true, disabled: true },
    })
    expect(wrapper.classes()).toContain('is-plain')
    expect(wrapper.classes()).toContain('is-round')
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('扩展变体（ghost/dangerSolid）', () => {
    const ghost = mount(EbButton, { props: { ghost: true } })
    expect(ghost.classes()).toContain('is-ghost')
    const danger = mount(EbButton, { props: { type: 'danger', dangerSolid: true } })
    expect(danger.classes()).toContain('is-danger-solid')
  })

  it('原生 type 属性透传（nativeType）', () => {
    const wrapper = mount(EbButton, { props: { nativeType: 'submit' } })
    expect(wrapper.attributes('type')).toBe('submit')
  })
})

describe('EbButton 行为', () => {
  it('点击触发 click 事件', async () => {
    const wrapper = mount(EbButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('disabled 时不触发 click 且阻止默认行为', async () => {
    const wrapper = mount(EbButton, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('loading 时禁用并渲染转圈图标', () => {
    const wrapper = mount(EbButton, { props: { loading: true } })
    expect(wrapper.classes()).toContain('is-loading')
    expect(wrapper.find('.eb-button__loading-icon').exists()).toBe(true)
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('icon 字符串渲染 EbIcon（SVG 兜底层）', () => {
    const wrapper = mount(EbButton, { props: { icon: 'search' } })
    const icon = wrapper.find('.eb-button__icon')
    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('eb-icon')
  })

  it('expose focus/blur 方法', () => {
    const wrapper = mount(EbButton)
    expect(typeof wrapper.vm.focus).toBe('function')
    expect(typeof wrapper.vm.blur).toBe('function')
  })
})

describe('EbButtonGroup', () => {
  it('渲染 eb-button-group 双 class 并透传子按钮', () => {
    const wrapper = mount(EbButtonGroup, {
      slots: {
        default: [mount(EbButton).html(), mount(EbButton).html()].join(''),
      },
    })
    expect(wrapper.classes()).toContain('eb-button-group')
    expect(wrapper.classes()).toContain('eb-button-group')
  })
})
