import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EbCard from '../src/components/card/index.vue'
import EbImage from '../src/components/image/index.vue'
import EbImageViewer from '../src/components/image-viewer/index.vue'
import EbBacktop from '../src/components/backtop/index.vue'
import EbAffix from '../src/components/affix/index.vue'
import EbRate from '../src/components/rate/index.vue'

describe('EbCard', () => {
  it('双 class + body 结构', () => {
    const wrapper = mount(EbCard, { slots: { default: '内容' } })
    expect(wrapper.classes()).toContain('eb-card')
    expect(wrapper.classes()).toContain('eb-card')
    expect(wrapper.find('.eb-card__body').text()).toBe('内容')
  })

  it('blur prop 内联覆盖 --eb-glass-blur；缺省不产出内联样式', () => {
    const numberBlur = mount(EbCard, { props: { glass: true, blur: 24 } })
    expect(numberBlur.attributes('style')).toContain('--eb-glass-blur')
    expect(numberBlur.attributes('style')).toContain('24px')
    numberBlur.unmount()

    const stringBlur = mount(EbCard, { props: { blur: '8px' } })
    expect(stringBlur.attributes('style')).toContain('--eb-glass-blur')
    stringBlur.unmount()

    const noBlur = mount(EbCard, { slots: { default: 'x' } })
    expect(noBlur.attributes('style') || '').not.toContain('--eb-glass-blur')
    noBlur.unmount()
  })

  it('header/footer 插槽与字符串 header', () => {
    const wrapper = mount(EbCard, {
      props: { header: '标题' },
      slots: { default: 'x', footer: '底部' },
    })
    expect(wrapper.find('.eb-card__header').text()).toBe('标题')
    expect(wrapper.find('.eb-card__footer').text()).toBe('底部')
  })

  it('shadow 变体类（默认 never）', () => {
    expect(mount(EbCard).classes()).toContain('is-never-shadow')
    expect(mount(EbCard, { props: { shadow: 'always' } }).classes()).toContain('is-always-shadow')
    expect(mount(EbCard, { props: { shadow: 'hover' } }).classes()).toContain('is-hover-shadow')
  })

  it('bodyStyle 对象与字符串双支持', () => {
    const obj = mount(EbCard, { props: { bodyStyle: { padding: '0' } } })
    expect(obj.find('.eb-card__body').attributes('style')).toContain('padding: 0')
    const str = mount(EbCard, { props: { bodyStyle: 'color: red' } })
    expect(str.find('.eb-card__body').attributes('style')).toContain('color: red')
  })
})

describe('EbImage', () => {
  it('双 class + inner/fit 修饰类', () => {
    const wrapper = mount(EbImage, { props: { src: 'a.png', fit: 'contain', width: 100, height: '50%' } })
    expect(wrapper.classes()).toContain('eb-image')
    expect(wrapper.classes()).toContain('eb-image')
    const img = wrapper.find('.eb-image__inner')
    expect(img.exists()).toBe(true)
    expect(img.classes()).toContain('eb-image__inner--contain')
    expect(wrapper.attributes('style')).toContain('width: 100px')
    expect(wrapper.attributes('style')).toContain('height: 50%')
  })

  it('load/error 事件与 error 兜底', async () => {
    const wrapper = mount(EbImage, { props: { src: 'x.png' } })
    await wrapper.find('img').trigger('load')
    expect(wrapper.emitted('load')).toHaveLength(1)
    await wrapper.find('img').trigger('error')
    expect(wrapper.emitted('error')).toHaveLength(1)
    expect(wrapper.find('.eb-image__error').exists()).toBe(true)
  })

  it('error 插槽', async () => {
    const wrapper = mount(EbImage, {
      props: { src: 'x.png' },
      slots: { error: '<b class="custom-err">挂了</b>' },
    })
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('.custom-err').text()).toBe('挂了')
  })

  it('round 变体类', () => {
    expect(mount(EbImage, { props: { src: 'x.png', round: true } }).classes()).toContain('is-round')
  })

  it('lazy：jsdom 无 IntersectionObserver 时降级立即加载', async () => {
    const wrapper = mount(EbImage, { props: { src: 'lazy.png', lazy: true } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.eb-image__inner').attributes('src')).toBe('lazy.png')
    expect(wrapper.find('img').attributes('loading')).toBe('lazy')
  })

  it('无 src 时不渲染 img', () => {
    expect(mount(EbImage).find('img').exists()).toBe(false)
  })

  it('preview：点击打开 viewer（modelValue 置 true）', async () => {
    const wrapper = mount(EbImage, {
      props: { src: 'a.png', previewSrcList: ['a.png', 'b.png'], initialIndex: 1 },
      attachTo: document.body,
    })
    expect(wrapper.findComponent(EbImageViewer).props('initialIndex')).toBe(1)
    await wrapper.find('img').trigger('click')
    expect(wrapper.findComponent(EbImageViewer).props('modelValue')).toBe(true)
    wrapper.unmount()
  })

  it('无 preview 列表时点击不开 viewer', async () => {
    const wrapper = mount(EbImage, { props: { src: 'a.png' } })
    await wrapper.find('img').trigger('click')
    expect(wrapper.findComponent(EbImageViewer).exists()).toBe(false)
  })
})

describe('EbBacktop', () => {
  it('双 class + 位置样式', () => {
    const wrapper = mount(EbBacktop, { props: { visibilityHeight: 0, right: 30, bottom: 50 } })
    const btn = wrapper.find('.eb-backtop')
    expect(btn.classes()).toContain('eb-backtop')
    expect(btn.classes()).toContain('eb-backtop')
    expect(btn.attributes('style')).toContain('right: 30px')
    expect(btn.attributes('style')).toContain('bottom: 50px')
  })

  it('visibilityHeight 0 时立即可见', async () => {
    const wrapper = mount(EbBacktop, { props: { visibilityHeight: 0 } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.eb-backtop').isVisible()).toBe(true)
  })

  it('click 事件', async () => {
    const wrapper = mount(EbBacktop, { props: { visibilityHeight: 0 } })
    await wrapper.find('.eb-backtop').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('默认插槽内容', () => {
    const wrapper = mount(EbBacktop, {
      props: { visibilityHeight: 0 },
      slots: { default: '<span class="up">↑</span>' },
    })
    expect(wrapper.find('.up').text()).toBe('↑')
  })

  it('默认隐藏（滚动量 < visibilityHeight）', () => {
    // jsdom 初始 scrollY=0，visibilityHeight 默认 200
    expect(mount(EbBacktop).find('.eb-backtop').isVisible()).toBe(false)
  })
})

describe('EbAffix', () => {
  it('双 class；position top 时初始即 fixed（rect.top=0 <= offset）', async () => {
    const wrapper = mount(EbAffix, { slots: { default: '固定内容' } })
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).toContain('eb-affix')
    expect(wrapper.classes()).toContain('eb-affix')
    expect(wrapper.find('.eb-affix__affix').exists()).toBe(true)
    expect(wrapper.find('.eb-affix__affix').text()).toBe('固定内容')
    expect(wrapper.findComponent(EbAffix).emitted('change')).toBeTruthy()
  })

  it('position bottom 且未滚动到底时不固定', async () => {
    const wrapper = mount(EbAffix, { props: { position: 'bottom' } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.eb-affix__affix').exists()).toBe(false)
  })

  it('fixed 时占位尺寸写入根元素', async () => {
    const wrapper = mount(EbAffix, { props: { offset: 0 } })
    await wrapper.vm.$nextTick()
    // jsdom getBoundingClientRect 全 0 → 占位 0x0
    expect(wrapper.attributes('style')).toContain('width: 0px')
    expect(wrapper.attributes('style')).toContain('height: 0px')
  })
})

describe('EbRate', () => {
  it('双 class + slider 角色 + 星数', () => {
    const wrapper = mount(EbRate, { props: { modelValue: 3 } })
    expect(wrapper.classes()).toContain('eb-rate')
    expect(wrapper.classes()).toContain('eb-rate')
    expect(wrapper.attributes('role')).toBe('slider')
    expect(wrapper.attributes('aria-valuemax')).toBe('5')
    expect(wrapper.attributes('aria-valuenow')).toBe('3')
    expect(wrapper.findAll('.eb-rate__item')).toHaveLength(5)
  })

  it('modelValue=3 时第 4/5 星无激活图标', () => {
    const wrapper = mount(EbRate, { props: { modelValue: 3 } })
    const actives = wrapper.findAll('.eb-rate__icon--active')
    expect(actives).toHaveLength(3)
  })

  it('点击提交 update:modelValue/change', async () => {
    const wrapper = mount(EbRate, { props: { modelValue: 0 } })
    await wrapper.findAll('.eb-rate__item')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[3]])
    expect(wrapper.emitted('change')).toEqual([[3]])
  })

  it('allowHalf：mousemove 左半为半星', async () => {
    const wrapper = mount(EbRate, { props: { modelValue: 0, allowHalf: true } })
    const items = wrapper.findAll('.eb-rate__item')
    // clientX=0 → 落在左半 → 2.5
    await items[2].trigger('mousemove', { clientX: 0 })
    await items[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[2.5]])
  })

  it('allowHalf 半星渲染 half 类', async () => {
    const wrapper = mount(EbRate, { props: { modelValue: 2.5, allowHalf: true } })
    const halves = wrapper.findAll('.eb-rate__icon--half')
    expect(halves).toHaveLength(1)
    expect(wrapper.findAll('.eb-rate__icon--active')).toHaveLength(3)
  })

  it('键盘左右键步进（allowHalf 时 0.5）', async () => {
    const wrapper = mount(EbRate, { props: { modelValue: 2, allowHalf: true } })
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[2.5]])
    await wrapper.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[2.5], [1.5]])
  })

  it('disabled 不响应点击', async () => {
    const wrapper = mount(EbRate, { props: { modelValue: 1, disabled: true } })
    expect(wrapper.classes()).toContain('is-disabled')
    await wrapper.findAll('.eb-rate__item')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('readonly 不响应', async () => {
    const wrapper = mount(EbRate, { props: { modelValue: 1, readonly: true } })
    await wrapper.findAll('.eb-rate__item')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('clearable 同值再点清零', async () => {
    const wrapper = mount(EbRate, { props: { modelValue: 3, clearable: true } })
    await wrapper.findAll('.eb-rate__item')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[0]])
  })

  it('colors 数组按阈值取色（jsdom 将合法 hex 归一化为 rgb）', () => {
    const low = mount(EbRate, {
      props: { modelValue: 1, colors: ['#aa0000', '#00aa00', '#0000aa'] },
    })
    expect(low.find('.eb-rate__icon--active').attributes('style')).toContain('rgb(170, 0, 0)')
    const high = mount(EbRate, {
      props: { modelValue: 5, colors: ['#aa0000', '#00aa00', '#0000aa'] },
    })
    expect(high.find('.eb-rate__icon--active').attributes('style')).toContain('rgb(0, 0, 170)')
  })

  it('colors 对象按阈值键取色', () => {
    const wrapper = mount(EbRate, {
      props: { modelValue: 3, colors: { 2: '#aa0000', 4: '#0000aa' } },
    })
    expect(wrapper.find('.eb-rate__icon--active').attributes('style')).toContain('rgb(0, 0, 170)')
  })

  it('showScore 分数模板 / showText 文案', () => {
    const score = mount(EbRate, { props: { modelValue: 4.5, showScore: true, scoreTemplate: '{value} 分' } })
    expect(score.find('.eb-rate__text').text()).toBe('4.5 分')
    const text = mount(EbRate, {
      props: { modelValue: 2, showText: true, texts: ['很差', '较差', '一般', '好', '很好'] },
    })
    expect(text.find('.eb-rate__text').text()).toBe('较差')
  })

  it('size 修饰类', () => {
    expect(mount(EbRate, { props: { size: 'large' } }).classes()).toContain('eb-rate--large')
  })
})
