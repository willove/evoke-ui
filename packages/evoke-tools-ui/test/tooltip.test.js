import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EtTooltip from '../src/components/tooltip/index.vue'
import EbTooltip from '@wil-works/evoke-business-ui/tooltip'

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

describe('EtTooltip', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('透传：默认插槽（触发内容）与 content 属性', () => {
    const wrapper = mount(EtTooltip, {
      props: { content: '工具提示' },
      slots: { default: '<button class="tt-trigger">悬停我</button>' },
    })
    const base = wrapper.findComponent(EbTooltip)
    expect(base.exists()).toBe(true)
    expect(wrapper.find('.tt-trigger').exists()).toBe(true)
    expect(base.props('content')).toBe('工具提示')
    wrapper.unmount()
  })

  it('默认延迟为工具界面口径：showAfter=400 / hideAfter=200', () => {
    const wrapper = mount(EtTooltip, { props: { content: 'x' } })
    const base = wrapper.findComponent(EbTooltip)
    expect(base.props('showAfter')).toBe(400)
    expect(base.props('hideAfter')).toBe(200)
    wrapper.unmount()
  })

  it('调用方可显式覆盖延迟', () => {
    const wrapper = mount(EtTooltip, {
      props: { content: 'x', showAfter: 0, hideAfter: 0 },
    })
    const base = wrapper.findComponent(EbTooltip)
    expect(base.props('showAfter')).toBe(0)
    expect(base.props('hideAfter')).toBe(0)
    wrapper.unmount()
  })

  it('popper-class 注入 et-tooltip（并保留底座结构类，合并而非覆盖）', async () => {
    const wrapper = mount(EtTooltip, {
      props: { content: '提示', showAfter: 0, hideAfter: 0 },
      slots: { default: '<span>t</span>' },
      attachTo: document.body,
    })
    await wrapper.find('.eb-popper-trigger').trigger('mouseenter')
    await tick()
    const popper = document.querySelector('.eb-tooltip__popper')
    expect(popper).toBeTruthy()
    // 注入的 et-tooltip
    expect(popper.classList.contains('et-tooltip')).toBe(true)
    // 底座结构类未被覆盖（暗色 / 盒模型靠它们）
    expect(popper.classList.contains('eb-tooltip')).toBe(true)
    expect(popper.classList.contains('is-dark')).toBe(true)
    expect(popper.textContent).toContain('提示')
    wrapper.unmount()
  })

  it('effect=light 时保留 is-light、不带 is-dark', async () => {
    const wrapper = mount(EtTooltip, {
      props: { content: 'x', effect: 'light', showAfter: 0, hideAfter: 0 },
      slots: { default: '<span>t</span>' },
      attachTo: document.body,
    })
    await wrapper.find('.eb-popper-trigger').trigger('mouseenter')
    await tick()
    const popper = document.querySelector('.eb-tooltip__popper')
    expect(popper.classList.contains('et-tooltip')).toBe(true)
    expect(popper.classList.contains('is-light')).toBe(true)
    expect(popper.classList.contains('is-dark')).toBe(false)
    wrapper.unmount()
  })

  it('调用方 popper-class 与 et-tooltip 合并（不被丢弃）', async () => {
    const wrapper = mount(EtTooltip, {
      props: { content: 'x', showAfter: 0, hideAfter: 0 },
      attrs: { 'popper-class': 'my-tip' },
      slots: { default: '<span>t</span>' },
      attachTo: document.body,
    })
    await wrapper.find('.eb-popper-trigger').trigger('mouseenter')
    await tick()
    const popper = document.querySelector('.eb-tooltip__popper')
    expect(popper.classList.contains('et-tooltip')).toBe(true)
    expect(popper.classList.contains('my-tip')).toBe(true)
    wrapper.unmount()
  })
})
