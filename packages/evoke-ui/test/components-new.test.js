import {
  mount, describe, it, expect, nextTick,
  EvBorderBeam, EvExecCard, EvArticle, EvImageWall, EvImagePreview, EvModal, EvSearchBox,
} from './helpers'

describe('EvBorderBeam', () => {
  it('渲染 slot 内容并注入光带令牌', () => {
    const wrapper = mount(EvBorderBeam, {
      props: { width: 3, duration: 3000, colorTo: '#16a34a' },
      slots: { default: '内容' },
    })
    expect(wrapper.text()).toContain('内容')
    expect(wrapper.attributes('style')).toContain('--ev-beam-width: 3px')
    expect(wrapper.attributes('style')).toContain('--ev-beam-duration: 3000ms')
    expect(wrapper.attributes('style')).toContain('--ev-beam-to: #16a34a')
  })

  it('reverse 注入方向令牌', () => {
    const wrapper = mount(EvBorderBeam, { props: { reverse: true } })
    expect(wrapper.attributes('style')).toContain('--ev-beam-direction: reverse')
  })
})

describe('EvExecCard', () => {
  it('无 image 时渲染内置剪影占位与文本层级', () => {
    const wrapper = mount(EvExecCard, {
      props: { name: '林一舟', role: '创始人 / CEO', description: '负责产品方向。' },
    })
    expect(wrapper.find('.ev-exec-card__portrait').exists()).toBe(true)
    expect(wrapper.find('.ev-exec-card__name').text()).toBe('林一舟')
    expect(wrapper.find('.ev-exec-card__role').text()).toBe('创始人 / CEO')
  })

  it('image 传入时渲染人物图', () => {
    const wrapper = mount(EvExecCard, {
      props: { name: 'A', image: 'data:image/png;base64,x' },
    })
    expect(wrapper.find('img.ev-exec-card__portrait').exists()).toBe(true)
  })
})

describe('EvArticle', () => {
  it('页头元信息与正文插槽', () => {
    const wrapper = mount(EvArticle, {
      props: { title: 'T', description: 'D', author: '陈山月', date: '2026-09-11', tags: ['组件设计'] },
      slots: { default: '<p>正文</p>' },
    })
    expect(wrapper.find('.ev-article__title').text()).toBe('T')
    expect(wrapper.find('.ev-article__author').text()).toBe('陈山月')
    expect(wrapper.find('.ev-article__tag').exists()).toBe(true)
    expect(wrapper.find('.ev-article__body').text()).toContain('正文')
  })
})

describe('EvImageWall / EvImagePreview', () => {
  const images = ['a.jpg', { src: 'b.jpg', alt: 'B 图' }]

  it('图片墙渲染 + 点击默认打开预览', async () => {
    const wrapper = mount(EvImageWall, { props: { images } })
    expect(wrapper.findAll('.ev-image-wall__item')).toHaveLength(2)
    await wrapper.findAll('.ev-image-wall__item')[1].trigger('click')
    expect(wrapper.emitted('select')[0][0]).toEqual({ src: 'b.jpg', alt: 'B 图' })
    expect(wrapper.emitted('select')[0][1]).toBe(1)
  })

  it('preview=false 时点击不开灯箱', async () => {
    const wrapper = mount(EvImageWall, { props: { images, preview: false } })
    await wrapper.findAll('.ev-image-wall__item')[0].trigger('click')
    expect(wrapper.findComponent(EvImagePreview).exists()).toBe(false)
  })

  it('ImagePreview 受控显隐 + 字符串图片归一（Teleport 到 body）', async () => {
    const wrapper = mount(EvImagePreview, {
      props: { modelValue: true, images, index: 1 },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.querySelector('.ev-image-preview__img').getAttribute('src')).toBe('b.jpg')
    expect(document.querySelector('.ev-image-preview__caption').textContent).toContain('2 / 2')
    wrapper.unmount()
  })
})

describe('EvModal', () => {
  it('v-model 打开关闭 + 锁定滚动', async () => {
    const wrapper = mount(EvModal, {
      props: { modelValue: false, title: 'T' },
      attachTo: document.body,
    })
    await wrapper.setProps({ modelValue: true })
    await nextTick()
    expect(document.querySelector('.ev-modal')).toBeTruthy()
    expect(document.body.style.overflow).toBe('hidden')
    await wrapper.setProps({ modelValue: false })
    await nextTick()
    expect(document.body.style.overflow).toBe('')
    wrapper.unmount()
  })

  it('标题与关闭按钮（Teleport 到 body）', async () => {
    const wrapper = mount(EvModal, {
      props: { modelValue: true, title: '验证邮箱' },
      slots: { default: 'body' },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.querySelector('.ev-modal__title').textContent).toBe('验证邮箱')
    expect(document.querySelector('.ev-modal__close')).toBeTruthy()
    wrapper.unmount()
  })
})

describe('EvSearchBox 远程搜索', () => {
  it('remote 输入经防抖后拉取结果，select 事件回填', async () => {
    vi.useFakeTimers()
    const remote = vi.fn(async (kw) => [{ title: kw, description: 'desc' }])
    const wrapper = mount(EvSearchBox, {
      props: { remote, debounce: 100 },
      attachTo: document.body,
    })
    const input = wrapper.find('.ev-search-box__input')
    await input.trigger('focus') // 下拉面板仅在聚焦态展示
    await input.setValue('杭')
    expect(remote).not.toHaveBeenCalled() // 防抖中
    vi.advanceTimersByTime(150)
    await vi.runAllTimersAsync()
    expect(remote).toHaveBeenCalledWith('杭')
    // 结果下拉出现
    expect(wrapper.find('.ev-search-box__dropdown').exists()).toBe(true)
    expect(wrapper.findAll('.ev-search-box__option').length).toBeGreaterThan(0)
    vi.useRealTimers()
    wrapper.unmount()
  })
})
