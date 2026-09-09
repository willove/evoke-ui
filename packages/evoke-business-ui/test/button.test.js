import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvButton from '../src/components/button/index.vue'
import EvButtonGroup from '../src/components/button/group.vue'

describe('EvButton 渲染契约', () => {
  it('根节点挂 ev-button/ev-button 双 class', () => {
    const wrapper = mount(EvButton, { slots: { default: '按钮' } })
    expect(wrapper.classes()).toContain('ev-button')
    expect(wrapper.classes()).toContain('ev-button')
    expect(wrapper.text()).toBe('按钮')
  })

  it('type 修饰类（ev-button--primary）', () => {
    const wrapper = mount(EvButton, { props: { type: 'primary' } })
    expect(wrapper.classes()).toContain('ev-button--primary')
  })

  it('size 修饰类', () => {
    expect(mount(EvButton, { props: { size: 'large' } }).classes()).toContain('ev-button--large')
    expect(mount(EvButton, { props: { size: 'small' } }).classes()).toContain('ev-button--small')
  })

  it('变体状态类（plain/round/circle/text/link/disabled/loading）', () => {
    const wrapper = mount(EvButton, {
      props: { plain: true, round: true, disabled: true },
    })
    expect(wrapper.classes()).toContain('is-plain')
    expect(wrapper.classes()).toContain('is-round')
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('evoke-ui 扩展（ghost/dangerSolid）', () => {
    const ghost = mount(EvButton, { props: { ghost: true } })
    expect(ghost.classes()).toContain('is-ghost')
    const danger = mount(EvButton, { props: { type: 'danger', dangerSolid: true } })
    expect(danger.classes()).toContain('is-danger-solid')
  })

  it('原生 type 属性透传（nativeType）', () => {
    const wrapper = mount(EvButton, { props: { nativeType: 'submit' } })
    expect(wrapper.attributes('type')).toBe('submit')
  })
})

describe('EvButton 行为', () => {
  it('点击触发 click 事件', async () => {
    const wrapper = mount(EvButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('disabled 时不触发 click 且阻止默认行为', async () => {
    const wrapper = mount(EvButton, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('loading 时禁用并渲染转圈图标', () => {
    const wrapper = mount(EvButton, { props: { loading: true } })
    expect(wrapper.classes()).toContain('is-loading')
    expect(wrapper.find('.ev-button__loading-icon').exists()).toBe(true)
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('icon 字符串渲染 EvIcon（SVG 兜底层）', () => {
    const wrapper = mount(EvButton, { props: { icon: 'search' } })
    const icon = wrapper.find('.ev-button__icon')
    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('ev-icon')
  })

  it('expose focus/blur 方法', () => {
    const wrapper = mount(EvButton)
    expect(typeof wrapper.vm.focus).toBe('function')
    expect(typeof wrapper.vm.blur).toBe('function')
  })
})

describe('EvButtonGroup', () => {
  it('渲染 ev-button-group 双 class 并透传子按钮', () => {
    const wrapper = mount(EvButtonGroup, {
      slots: {
        default: [mount(EvButton).html(), mount(EvButton).html()].join(''),
      },
    })
    expect(wrapper.classes()).toContain('ev-button-group')
    expect(wrapper.classes()).toContain('ev-button-group')
  })
})
