import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EtEmptyState from '../src/components/empty-state/index.vue'

/**
 * EtEmptyState 组件契约（tools-ui 计划 05 §四 / 06 §三：空态即首屏）
 *
 * 一句引导 + 一个主按钮：图标 lg 档 + 标题一行 + desc 可选一行 + 唯一主操作；
 * desc 空串不渲染（0 档不写）；actionLabel 点击 emit action；action slot 可整体替换。
 */

describe('EtEmptyState 渲染', () => {
  it('标题一行 + 默认 search 图标（lg 档）+ role=status', () => {
    const wrapper = mount(EtEmptyState, { props: { title: '拖入文件' } })
    expect(wrapper.find('.et-emptystate__title').text()).toBe('拖入文件')
    expect(wrapper.attributes('role')).toBe('status')
    const icon = wrapper.findComponent({ name: 'EtIcon' })
    expect(icon.props('name')).toBe('search')
    expect(icon.props('size')).toBe('var(--et-icon-lg)')
    wrapper.unmount()
  })

  it('desc 非空渲染一行；空串不渲染（0 档不写）', () => {
    const withDesc = mount(EtEmptyState, { props: { title: '无结果', desc: '换个关键词试试' } })
    const desc = withDesc.find('.et-emptystate__desc')
    expect(desc.exists()).toBe(true)
    expect(desc.text()).toBe('换个关键词试试')
    withDesc.unmount()

    const withoutDesc = mount(EtEmptyState, { props: { title: '无结果' } })
    expect(withoutDesc.find('.et-emptystate__desc').exists()).toBe(false)
    withoutDesc.unmount()
  })

  it('图标名可覆盖（语义名透传 EtIcon）', () => {
    const wrapper = mount(EtEmptyState, { props: { title: '空空如也', icon: 'inbox' } })
    expect(wrapper.findComponent({ name: 'EtIcon' }).props('name')).toBe('inbox')
    wrapper.unmount()
  })
})

describe('EtEmptyState 主操作', () => {
  it('actionLabel 渲染基础主钮，点击 emit action', async () => {
    const wrapper = mount(EtEmptyState, { props: { title: '拖入文件', actionLabel: '打开' } })
    const button = wrapper.find('.et-emptystate__action')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('打开')
    await button.trigger('click')
    expect(wrapper.emitted('action')).toHaveLength(1)
    wrapper.unmount()
  })

  it('无 actionLabel 不渲染按钮（空态不堆操作）', () => {
    const wrapper = mount(EtEmptyState, { props: { title: '拖入文件' } })
    expect(wrapper.find('.et-emptystate__action').exists()).toBe(false)
    wrapper.unmount()
  })

  it('action slot 整体替换默认按钮位', () => {
    const wrapper = mount(EtEmptyState, {
      props: { title: '拖入文件', actionLabel: '打开' },
      slots: { action: '<button class="product-action">去首页</button>' },
    })
    expect(wrapper.find('.et-emptystate__action').exists()).toBe(false)
    expect(wrapper.find('.product-action').text()).toBe('去首页')
    wrapper.unmount()
  })
})
