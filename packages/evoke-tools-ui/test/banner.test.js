import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EtBanner from '../src/components/banner/index.vue'

/**
 * EtBanner 组件契约（tools-ui 计划 05 §四 L4 / 07 M3 交付物 5）
 *
 *   ① closable 默认 true：关闭钮带 aria-label（G4），点击只 emit close
 *      （去留由消费方 v-if 决定，组件不自毁）；
 *   ② type 三档 info / warn / error 落类名；
 *   ③ title + 默认槽 + action 槽；title 空 = 只有正文的紧凑形态。
 */

const flush = (ms = 20) => new Promise((r) => setTimeout(r, ms))

const banner = () => document.querySelector('.et-banner')

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EtBanner（M3 交付物 5：内联横条通知）', () => {
  it('closable 默认 true：点关闭 emit close；false 时不渲染关闭钮', async () => {
    const wrapper = mount(EtBanner, {
      slots: { default: '正文内容' },
      attachTo: document.body,
    })
    await flush()

    const closeBtn = banner().querySelector('.et-banner__close')
    expect(closeBtn).toBeTruthy()
    expect(closeBtn.getAttribute('aria-label')).toBe('关闭')
    closeBtn.click()
    expect(wrapper.emitted('close')).toHaveLength(1)
    // 关闭只冒事件：组件自身不卸载（消费方决定去留）
    expect(banner()).toBeTruthy()
    wrapper.unmount()

    const noClose = mount(EtBanner, {
      props: { closable: false },
      slots: { default: '正文内容' },
      attachTo: document.body,
    })
    await flush()
    expect(noClose.find('.et-banner__close').exists()).toBe(false)
    noClose.unmount()
  })

  it('type 三档落类名：info / warn / error', async () => {
    for (const type of ['info', 'warn', 'error']) {
      const wrapper = mount(EtBanner, { props: { type }, slots: { default: '正文' } })
      await flush()
      expect(wrapper.classes()).toContain(`et-banner--${type}`)
      expect(wrapper.classes()).toContain('et-banner')
      wrapper.unmount()
    }
  })

  it('slots：title + 默认正文 + action；无 title 时只有正文', async () => {
    const wrapper = mount(EtBanner, {
      props: { title: '无法同步' },
      slots: {
        default: '<span class="probe-text">网络连接已断开</span>',
        action: '<button class="probe-action">重试</button>',
      },
    })
    await flush()

    expect(wrapper.find('.et-banner__title').text()).toBe('无法同步')
    expect(wrapper.find('.probe-text').exists()).toBe(true)
    expect(wrapper.find('.probe-action').exists()).toBe(true)

    const bare = mount(EtBanner, { slots: { default: '只有正文' } })
    await flush()
    expect(bare.find('.et-banner__title').exists()).toBe(false)
    expect(bare.text()).toBe('只有正文')
    bare.unmount()
    wrapper.unmount()
  })
})
