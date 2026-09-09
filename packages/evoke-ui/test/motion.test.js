import { mount, describe, it, expect, vi, nextTick, EwMarquee, EwStatistic, EwHero, EwNavbar, EwTabs } from './helpers'

describe('EwMarquee', () => {
  it('插槽内容渲染两份实现无缝循环', () => {
    const wrapper = mount(EwMarquee, { slots: { default: '<span class="m-item">A</span><span class="m-item">B</span>' } })
    expect(wrapper.findAll('.ew-marquee__group')).toHaveLength(2)
    expect(wrapper.findAll('.m-item')).toHaveLength(4)
    // 第二份对读屏隐藏
    expect(wrapper.findAll('.ew-marquee__group')[1].attributes('aria-hidden')).toBe('true')
  })

  it('duration / reverse 生效', () => {
    const wrapper = mount(EwMarquee, { props: { duration: 12000, reverse: true } })
    expect(wrapper.attributes('style')).toContain('12000ms')
    expect(wrapper.classes()).toContain('is-reverse')
  })

  it('pauseOnHover 默认开启', () => {
    const wrapper = mount(EwMarquee)
    expect(wrapper.classes()).toContain('is-pausable')
  })
})

describe('EwStatistic 数字滚动', () => {
  it('非 animated 直接显示目标值', () => {
    const wrapper = mount(EwStatistic, { props: { value: '7.7K', label: 'Stars' } })
    expect(wrapper.find('.ew-statistic__value').text()).toBe('7.7K')
  })

  it('animated 滚动结束后停在目标值并保留前后缀', async () => {
    vi.useFakeTimers()
    const wrapper = mount(EwStatistic, {
      props: { value: '1,200+', label: '用户', animated: true, duration: 60 },
    })
    // rAF 缺失时走 setTimeout 兜底
    await vi.advanceTimersByTimeAsync(300)
    // 定宽占位（sizer）与数字同渲染，可见数字只看 __num
    expect(wrapper.find('.ew-statistic__num').text()).toBe('1,200+')
    vi.useRealTimers()
  })

  it('非数值文案不参与滚动', () => {
    const wrapper = mount(EwStatistic, { props: { value: '开源免费', animated: true } })
    expect(wrapper.find('.ew-statistic__value').text()).toBe('开源免费')
  })
})

describe('EwHero 入场动效', () => {
  it('reveal 开启后各区块带入场类并直接呈现（无 IO 环境）', async () => {
    const wrapper = mount(EwHero, {
      props: { title: 'T', description: 'D', reveal: true },
      slots: { badge: '<span>b</span>', actions: '<button>a</button>' },
      attachTo: document.body,
    })
    await nextTick()
    const items = wrapper.findAll('[data-ew-hero-item]')
    expect(items.length).toBeGreaterThanOrEqual(4)
    for (const el of items) {
      expect(el.classes()).toContain('ew-reveal')
      expect(el.classes()).toContain('is-revealed')
    }
    wrapper.unmount()
  })

  it('默认不开启动效', () => {
    const wrapper = mount(EwHero, { props: { title: 'T' } })
    expect(wrapper.find('[data-ew-hero-item]').classes()).not.toContain('ew-reveal')
  })
})

describe('EwNavbar 滚动隐藏', () => {
  function setScrollY(y) {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
    window.dispatchEvent(new Event('scroll'))
  }

  it('默认不隐藏', () => {
    const wrapper = mount(EwNavbar, { props: { sticky: false } })
    expect(wrapper.classes()).not.toContain('is-hidden')
  })

  it('hideOnScroll：下滑隐藏、上滑浮现', async () => {
    const wrapper = mount(EwNavbar, { props: { hideOnScroll: true } })
    setScrollY(300)
    await nextTick()
    expect(wrapper.classes()).toContain('is-hidden')
    setScrollY(200)
    await nextTick()
    expect(wrapper.classes()).not.toContain('is-hidden')
    setScrollY(50)
    await nextTick()
    expect(wrapper.classes()).not.toContain('is-hidden')
  })
})

describe('EwTabs 胶囊滑块', () => {
  it('滑块在无布局环境（jsdom）下安全降级', async () => {
    const wrapper = mount(EwTabs, {
      props: { items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }], modelValue: 'a' },
    })
    await nextTick()
    // jsdom 无布局：thumb 隐藏不渲染；条目与交互不受影响
    expect(wrapper.find('.ew-tabs__thumb').exists()).toBe(false)
    await wrapper.findAll('.ew-tabs__item')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })
})
