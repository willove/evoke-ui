import { mount, defineComponent, h, describe, it, expect, vi, nextTick, EvVideo, EvAudio, EvContactForm, EvCarousel, EvArticleCard, EvProfileCard } from './helpers'

describe('EvVideo / EvAudio', () => {
  it('渲染原生 video 与画幅', () => {
    const wrapper = mount(EvVideo, { props: { src: 'a.mp4', poster: 'p.jpg' } })
    expect(wrapper.find('video').exists()).toBe(true)
    expect(wrapper.find('video').attributes('poster')).toBe('p.jpg')
    expect(wrapper.find('.ev-video__frame').attributes('style')).toContain('56.25%')
  })

  it('无 src 且无插槽时渲染占位；caption 生效', () => {
    const wrapper = mount(EvVideo, { props: { caption: '产品演示' } })
    expect(wrapper.find('.ev-video__placeholder').exists()).toBe(true)
    expect(wrapper.find('.ev-video__caption').text()).toBe('产品演示')
  })

  it('Audio 渲染标题与播放控件', () => {
    const wrapper = mount(EvAudio, { props: { src: 'a.mp3', title: '产品语音介绍' } })
    expect(wrapper.find('.ev-audio__title').text()).toBe('产品语音介绍')
    expect(wrapper.find('audio').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})

describe('EvContactForm', () => {
  it('校验失败标红且不派发 submit', async () => {
    const wrapper = mount(EvContactForm)
    await wrapper.find('form').trigger('submit')
    await nextTick()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.findAll('.ev-contact-form__error').length).toBeGreaterThan(0)
  })

  it('合法输入派发 submit 并切成功态', async () => {
    const wrapper = mount(EvContactForm)
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('林一舟')
    await inputs[1].setValue('me@example.com')
    await wrapper.find('textarea').setValue('合作洽谈')
    await wrapper.find('form').trigger('submit')
    await nextTick()
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({ name: '林一舟', email: 'me@example.com', message: '合作洽谈' })
    expect(wrapper.find('.ev-contact-form__done').exists()).toBe(true)
  })

  it('label/input 经 useId 一一关联，同应用多实例不串 id', () => {
    // 同一应用挂两个表单：useId 生成的 id 全部互不相同且能命中控件
    const DualForm = defineComponent({
      setup: () => () => h('div', [h(EvContactForm), h(EvContactForm)]),
    })
    const wrapper = mount(DualForm)
    expect(wrapper.findAll('.ev-contact-form')).toHaveLength(2)
    const forIds = wrapper.findAll('label').map((l) => l.attributes('for'))
    expect(forIds).toHaveLength(6)
    expect(new Set(forIds).size).toBe(6)
    for (const id of forIds) expect(wrapper.find(`#${id}`).exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('EvCarousel', () => {
  const items = ['a', 'b', 'c']

  it('渲染全部 slide，圆点数量一致', () => {
    const wrapper = mount(EvCarousel, { props: { items }, slots: { item: '<i class="s"/>' } })
    expect(wrapper.findAll('.ev-carousel__slide')).toHaveLength(3)
    expect(wrapper.findAll('.ev-carousel__dot')).toHaveLength(3)
  })

  it('箭头切换并循环', async () => {
    const wrapper = mount(EvCarousel, { props: { items } })
    const track = wrapper.find('.ev-carousel__track')
    await wrapper.find('.ev-carousel__arrow.is-next').trigger('click')
    expect(track.attributes('style')).toContain('translateX(-100%)')
    await wrapper.find('.ev-carousel__arrow.is-prev').trigger('click')
    expect(track.attributes('style')).toContain('translateX(-0%)')
    await wrapper.find('.ev-carousel__arrow.is-prev').trigger('click')
    expect(track.attributes('style')).toContain('translateX(-200%)')
  })

  it('圆点跳转', async () => {
    const wrapper = mount(EvCarousel, { props: { items } })
    await wrapper.findAll('.ev-carousel__dot')[2].trigger('click')
    expect(wrapper.find('.ev-carousel__track').attributes('style')).toContain('translateX(-200%)')
  })
})

describe('EvArticleCard / EvProfileCard', () => {
  it('文章卡渲染元信息与摘要，封面缺省走图标占位', () => {
    const wrapper = mount(EvArticleCard, {
      props: { title: '第一篇文章', excerpt: '摘要内容', date: '2026-09-08', tags: ['产品'] },
    })
    expect(wrapper.find('.ev-article-card__title').text()).toBe('第一篇文章')
    expect(wrapper.find('.ev-article-card__date').text()).toBe('2026-09-08')
    expect(wrapper.findAll('.ev-article-card__tag')).toHaveLength(1)
    expect(wrapper.find('.ev-article-card__cover img').exists()).toBe(false)
    expect(wrapper.find('.ev-article-card__cover-icon').exists()).toBe(true)
  })

  it('文章卡可渲染为链接卡', () => {
    const wrapper = mount(EvArticleCard, { props: { title: 'T', tag: 'a', href: '/blog/1' } })
    expect(wrapper.attributes('href')).toBe('/blog/1')
  })

  it('个人名片渲染要素与插槽行', () => {
    const wrapper = mount(EvProfileCard, {
      props: { name: '林一舟', role: '产品设计师', bio: '做让人安心的产品。' },
      slots: {
        social: '<a class="pf-link" href="#">GitHub</a>',
        stats: '<div class="pf-stats">120 篇文章</div>',
      },
    })
    expect(wrapper.find('.ev-profile-card__name').text()).toBe('林一舟')
    expect(wrapper.find('.ev-profile-card__role').text()).toBe('产品设计师')
    expect(wrapper.find('.pf-link').exists()).toBe(true)
    expect(wrapper.find('.pf-stats').exists()).toBe(true)
  })

  it('plain 形态去除卡面', () => {
    const wrapper = mount(EvProfileCard, { props: { name: 'A', plain: true } })
    expect(wrapper.classes()).toContain('is-plain')
  })
})
