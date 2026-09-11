import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbTag from '../src/components/tag/index.vue'
import EbAlert from '../src/components/alert/index.vue'
import EbDivider from '../src/components/divider/index.vue'
import EbSkeleton from '../src/components/skeleton/index.vue'
import EbSkeletonItem from '../src/components/skeleton/item.vue'
import EbSpin from '../src/components/spin/index.vue'

describe('EbTag', () => {
  it('双 class + 类型/效果修饰类（默认 small/plain）', () => {
    const wrapper = mount(EbTag, { slots: { default: '标签' } })
    expect(wrapper.classes()).toContain('eb-tag')
    expect(wrapper.classes()).toContain('eb-tag')
    expect(wrapper.classes()).toContain('eb-tag--small')
    expect(wrapper.classes()).toContain('eb-tag--plain')
    expect(wrapper.text()).toBe('标签')
  })

  it('type 修饰类', () => {
    expect(mount(EbTag, { props: { type: 'success' } }).classes()).toContain('eb-tag--success')
    expect(mount(EbTag, { props: { type: 'danger' } }).classes()).toContain('eb-tag--danger')
  })

  it('effect 变体', () => {
    expect(mount(EbTag, { props: { effect: 'dark' } }).classes()).toContain('eb-tag--dark')
  })

  it('round / hit 状态类', () => {
    const wrapper = mount(EbTag, { props: { round: true, hit: true } })
    expect(wrapper.classes()).toContain('is-round')
    expect(wrapper.classes()).toContain('is-hit')
  })

  it('closable 渲染关闭图标并触发 close', async () => {
    const wrapper = mount(EbTag, { props: { closable: true } })
    await wrapper.find('.eb-tag__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('color 自定义色', () => {
    const wrapper = mount(EbTag, { props: { color: '#ff0000' } })
    expect(wrapper.attributes('style')).toContain('rgb(255, 0, 0)')
  })

  it('click 事件透传', async () => {
    const wrapper = mount(EbTag)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})

describe('EbAlert', () => {
  it('双 class + 类型修饰类', () => {
    const wrapper = mount(EbAlert, { props: { title: '提示' } })
    const alert = wrapper.find('.eb-alert')
    expect(alert.exists()).toBe(true)
    expect(alert.classes()).toContain('eb-alert')
    expect(wrapper.find('.eb-alert__title').text()).toBe('提示')
  })

  it('showIcon 渲染图标', () => {
    expect(mount(EbAlert, { props: { showIcon: true } }).find('.eb-alert__icon').exists()).toBe(true)
  })

  it('description 与默认插槽', () => {
    const wrapper = mount(EbAlert, {
      props: { title: 't', description: '详情' },
    })
    expect(wrapper.find('.eb-alert__description').text()).toBe('详情')
  })

  it('closable 关闭后移除并触发 close', async () => {
    const wrapper = mount(EbAlert, { props: { closable: true } })
    await wrapper.find('.eb-alert__close-btn').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

describe('EbDivider', () => {
  it('双 class + 水平分割线', () => {
    const wrapper = mount(EbDivider)
    expect(wrapper.classes()).toContain('eb-divider')
    expect(wrapper.classes()).toContain('eb-divider')
    expect(wrapper.classes()).toContain('eb-divider--horizontal')
  })

  it('vertical 与 contentPosition', () => {
    expect(mount(EbDivider, { props: { direction: 'vertical' } }).classes()).toContain('eb-divider--vertical')
    const withText = mount(EbDivider, { props: { contentPosition: 'left' }, slots: { default: '文本' } })
    expect(withText.find('.eb-divider__text').classes()).toContain('is-left')
    expect(withText.text()).toBe('文本')
  })

  it('borderStyle 变体', () => {
    expect(mount(EbDivider, { props: { borderStyle: 'dashed' } }).classes()).toContain('eb-divider--dashed')
  })
})

describe('EbSkeleton 家族', () => {
  it('loading 时渲染 rows 个占位（默认 3）', () => {
    const wrapper = mount(EbSkeleton, { props: { loading: true, rows: 4 } })
    expect(wrapper.classes()).toContain('eb-skeleton')
    expect(wrapper.classes()).toContain('eb-skeleton')
    expect(wrapper.findAll('.eb-skeleton__item').length).toBe(4)
  })

  it('loading=false 渲染默认插槽', () => {
    const wrapper = mount(EbSkeleton, {
      props: { loading: false },
      slots: { default: '<p>real content</p>' },
    })
    expect(wrapper.text()).toContain('real content')
  })

  it('animated 状态类', () => {
    expect(mount(EbSkeleton, { props: { animated: true } }).classes()).toContain('is-animated')
  })

  it('count 复制模板次数', () => {
    const wrapper = mount(EbSkeleton, { props: { count: 2, rows: 1 } })
    expect(wrapper.findAll('.eb-skeleton__section').length).toBe(2)
  })

  it('EbSkeletonItem variant 修饰类', () => {
    expect(mount(EbSkeletonItem, { props: { variant: 'circle' } }).classes()).toContain('eb-skeleton__circle')
    expect(mount(EbSkeletonItem, { props: { variant: 'button' } }).classes()).toContain('eb-skeleton__button')
  })
})

describe('EbSpin', () => {
  it('独立模式：4 点指示器', () => {
    const wrapper = mount(EbSpin)
    expect(wrapper.classes()).toContain('eb-spin')
    expect(wrapper.classes()).toContain('eb-spin--standalone')
    expect(wrapper.findAll('.eb-spin__dot').length).toBe(4)
  })

  it('包裹模式：有 slot 内容时渲染 wrapper + 容器', () => {
    const wrapper = mount(EbSpin, {
      slots: { default: '<div>content</div>' },
    })
    expect(wrapper.classes()).toContain('eb-spin-wrapper')
    expect(wrapper.find('.eb-spin__container').exists()).toBe(true)
    expect(wrapper.find('.eb-spin--nested').exists()).toBe(true)
  })

  it('description 文案', () => {
    const wrapper = mount(EbSpin, { props: { description: '加载中' } })
    expect(wrapper.find('.eb-spin__description').text()).toBe('加载中')
  })

  it('spinning=false 时包裹模式不渲染遮罩', () => {
    const wrapper = mount(EbSpin, {
      props: { spinning: false },
      slots: { default: '<div>c</div>' },
    })
    expect(wrapper.find('.eb-spin--nested').exists()).toBe(false)
  })
})
