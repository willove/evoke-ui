import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EvTag from '../src/components/tag/index.vue'
import EvAlert from '../src/components/alert/index.vue'
import EvDivider from '../src/components/divider/index.vue'
import EvSkeleton from '../src/components/skeleton/index.vue'
import EvSkeletonItem from '../src/components/skeleton/item.vue'
import EvSpin from '../src/components/spin/index.vue'

describe('EvTag', () => {
  it('双 class + 类型/效果修饰类（evoke-ui 默认 small/plain）', () => {
    const wrapper = mount(EvTag, { slots: { default: '标签' } })
    expect(wrapper.classes()).toContain('ev-tag')
    expect(wrapper.classes()).toContain('ev-tag')
    expect(wrapper.classes()).toContain('ev-tag--small')
    expect(wrapper.classes()).toContain('ev-tag--plain')
    expect(wrapper.text()).toBe('标签')
  })

  it('type 修饰类', () => {
    expect(mount(EvTag, { props: { type: 'success' } }).classes()).toContain('ev-tag--success')
    expect(mount(EvTag, { props: { type: 'danger' } }).classes()).toContain('ev-tag--danger')
  })

  it('effect 变体', () => {
    expect(mount(EvTag, { props: { effect: 'dark' } }).classes()).toContain('ev-tag--dark')
  })

  it('round / hit 状态类', () => {
    const wrapper = mount(EvTag, { props: { round: true, hit: true } })
    expect(wrapper.classes()).toContain('is-round')
    expect(wrapper.classes()).toContain('is-hit')
  })

  it('closable 渲染关闭图标并触发 close', async () => {
    const wrapper = mount(EvTag, { props: { closable: true } })
    await wrapper.find('.ev-tag__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('color 自定义色', () => {
    const wrapper = mount(EvTag, { props: { color: '#ff0000' } })
    expect(wrapper.attributes('style')).toContain('rgb(255, 0, 0)')
  })

  it('click 事件透传', async () => {
    const wrapper = mount(EvTag)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})

describe('EvAlert', () => {
  it('双 class + 类型修饰类', () => {
    const wrapper = mount(EvAlert, { props: { title: '提示' } })
    const alert = wrapper.find('.ev-alert')
    expect(alert.exists()).toBe(true)
    expect(alert.classes()).toContain('ev-alert')
    expect(wrapper.find('.ev-alert__title').text()).toBe('提示')
  })

  it('showIcon 渲染图标', () => {
    expect(mount(EvAlert, { props: { showIcon: true } }).find('.ev-alert__icon').exists()).toBe(true)
  })

  it('description 与默认插槽', () => {
    const wrapper = mount(EvAlert, {
      props: { title: 't', description: '详情' },
    })
    expect(wrapper.find('.ev-alert__description').text()).toBe('详情')
  })

  it('closable 关闭后移除并触发 close', async () => {
    const wrapper = mount(EvAlert, { props: { closable: true } })
    await wrapper.find('.ev-alert__close-btn').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

describe('EvDivider', () => {
  it('双 class + 水平分割线', () => {
    const wrapper = mount(EvDivider)
    expect(wrapper.classes()).toContain('ev-divider')
    expect(wrapper.classes()).toContain('ev-divider')
    expect(wrapper.classes()).toContain('ev-divider--horizontal')
  })

  it('vertical 与 contentPosition', () => {
    expect(mount(EvDivider, { props: { direction: 'vertical' } }).classes()).toContain('ev-divider--vertical')
    const withText = mount(EvDivider, { props: { contentPosition: 'left' }, slots: { default: '文本' } })
    expect(withText.find('.ev-divider__text').classes()).toContain('is-left')
    expect(withText.text()).toBe('文本')
  })

  it('borderStyle 变体', () => {
    expect(mount(EvDivider, { props: { borderStyle: 'dashed' } }).classes()).toContain('ev-divider--dashed')
  })
})

describe('EvSkeleton 家族', () => {
  it('loading 时渲染 rows 个占位（默认 3）', () => {
    const wrapper = mount(EvSkeleton, { props: { loading: true, rows: 4 } })
    expect(wrapper.classes()).toContain('ev-skeleton')
    expect(wrapper.classes()).toContain('ev-skeleton')
    expect(wrapper.findAll('.ev-skeleton__item').length).toBe(4)
  })

  it('loading=false 渲染默认插槽', () => {
    const wrapper = mount(EvSkeleton, {
      props: { loading: false },
      slots: { default: '<p>real content</p>' },
    })
    expect(wrapper.text()).toContain('real content')
  })

  it('animated 状态类', () => {
    expect(mount(EvSkeleton, { props: { animated: true } }).classes()).toContain('is-animated')
  })

  it('count 复制模板次数', () => {
    const wrapper = mount(EvSkeleton, { props: { count: 2, rows: 1 } })
    expect(wrapper.findAll('.ev-skeleton__section').length).toBe(2)
  })

  it('EvSkeletonItem variant 修饰类', () => {
    expect(mount(EvSkeletonItem, { props: { variant: 'circle' } }).classes()).toContain('ev-skeleton__circle')
    expect(mount(EvSkeletonItem, { props: { variant: 'button' } }).classes()).toContain('ev-skeleton__button')
  })
})

describe('EvSpin', () => {
  it('独立模式：4 点指示器', () => {
    const wrapper = mount(EvSpin)
    expect(wrapper.classes()).toContain('ev-spin')
    expect(wrapper.classes()).toContain('ev-spin--standalone')
    expect(wrapper.findAll('.ev-spin__dot').length).toBe(4)
  })

  it('包裹模式：有 slot 内容时渲染 wrapper + 容器', () => {
    const wrapper = mount(EvSpin, {
      slots: { default: '<div>content</div>' },
    })
    expect(wrapper.classes()).toContain('ev-spin-wrapper')
    expect(wrapper.find('.ev-spin__container').exists()).toBe(true)
    expect(wrapper.find('.ev-spin--nested').exists()).toBe(true)
  })

  it('description 文案', () => {
    const wrapper = mount(EvSpin, { props: { description: '加载中' } })
    expect(wrapper.find('.ev-spin__description').text()).toBe('加载中')
  })

  it('spinning=false 时包裹模式不渲染遮罩', () => {
    const wrapper = mount(EvSpin, {
      props: { spinning: false },
      slots: { default: '<div>c</div>' },
    })
    expect(wrapper.find('.ev-spin--nested').exists()).toBe(false)
  })
})
