import { mount, describe, it, expect, EvButton, EvIconButton, EvTag, EvBadge, EvKeycap } from './helpers'

describe('EvButton', () => {
  it('默认渲染 primary 变体与中等尺寸', () => {
    const wrapper = mount(EvButton, { slots: { default: 'Get Started' } })
    expect(wrapper.classes()).toContain('ev-button')
    expect(wrapper.classes()).toContain('is-primary')
    expect(wrapper.classes()).toContain('ev-button--md')
    expect(wrapper.text()).toBe('Get Started')
  })

  it('pill 胶囊形态（launchos CTA）', () => {
    const wrapper = mount(EvButton, { props: { variant: 'dark', pill: true }, slots: { default: 'DOWNLOAD' } })
    expect(wrapper.classes()).toContain('is-pill')
    expect(wrapper.classes()).toContain('is-dark')
  })

  it('disabled 阻止 click 事件', async () => {
    const wrapper = mount(EvButton, { props: { disabled: true }, slots: { default: 'x' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('loading 渲染旋转图标并禁点', async () => {
    const wrapper = mount(EvButton, { props: { loading: true }, slots: { default: 'Go' } })
    expect(wrapper.find('.is-rotating').exists()).toBe(true)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('icon / iconRight 图标位', () => {
    const wrapper = mount(EvButton, {
      props: { icon: 'download', iconRight: 'arrow-right' },
      slots: { default: 'Install' },
    })
    expect(wrapper.findAll('.ev-button__icon').length).toBe(2)
  })

  it('无默认插槽且有图标时进入 icon-only 形态', () => {
    const wrapper = mount(EvButton, { props: { icon: 'search' } })
    expect(wrapper.classes()).toContain('is-icon-only')
  })

  it('slot 触发 click', async () => {
    const wrapper = mount(EvButton, { slots: { default: 'OK' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('href 传入时渲染为 <a> 链接按钮', () => {
    const wrapper = mount(EvButton, {
      props: { href: 'https://example.com' },
      slots: { default: '访问文档' },
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('https://example.com')
    expect(wrapper.attributes('type')).toBeUndefined()
  })

  it('href + target=_blank 自动补 noopener', () => {
    const wrapper = mount(EvButton, {
      props: { href: 'https://example.com', target: '_blank' },
      slots: { default: '外链' },
    })
    expect(wrapper.attributes('target')).toBe('_blank')
    expect(wrapper.attributes('rel')).toBe('noopener')
  })

  it('disabled 链接按钮阻止默认跳转且不派发 click', async () => {
    const wrapper = mount(EvButton, {
      props: { href: '/next', disabled: true },
      slots: { default: '禁用链接' },
    })
    expect(wrapper.classes()).toContain('is-disabled')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    const evt = new Event('click', { bubbles: true, cancelable: true })
    wrapper.element.dispatchEvent(evt)
    expect(evt.defaultPrevented).toBe(true)
  })
})

describe('EvIconButton', () => {
  it('渲染图标与 aria-label（缺省取 icon 名）', () => {
    const wrapper = mount(EvIconButton, { props: { icon: 'moon' } })
    expect(wrapper.classes()).toContain('ev-icon-button')
    expect(wrapper.attributes('aria-label')).toBe('moon')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('round 正圆形态', () => {
    const wrapper = mount(EvIconButton, { props: { icon: 'sun', round: true } })
    expect(wrapper.classes()).toContain('is-round')
  })
})

describe('EvTag', () => {
  it('默认 neutral soft 胶囊', () => {
    const wrapper = mount(EvTag, { slots: { default: 'Open Source' } })
    expect(wrapper.classes()).toContain('ev-tag')
    expect(wrapper.classes()).toContain('is-neutral')
    expect(wrapper.classes()).toContain('is-soft')
  })

  it('lime 促销徽章 tone（launchos SAVE 50%）', () => {
    const wrapper = mount(EvTag, { props: { tone: 'lime' }, slots: { default: 'SAVE 50%' } })
    expect(wrapper.classes()).toContain('is-lime')
  })

  it('closable 渲染关闭钮并派发 close', async () => {
    const wrapper = mount(EvTag, { props: { closable: true }, slots: { default: 'x' } })
    await wrapper.find('.ev-tag__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

describe('EvBadge', () => {
  it('渲染计数值', () => {
    const wrapper = mount(EvBadge, { props: { value: 7 } })
    expect(wrapper.text()).toBe('7')
  })

  it('超过 max 显示 max+', () => {
    const wrapper = mount(EvBadge, { props: { value: 150, max: 99 } })
    expect(wrapper.text()).toBe('99+')
  })

  it('dot 圆点模式', () => {
    const wrapper = mount(EvBadge, { props: { dot: true } })
    expect(wrapper.classes()).toContain('is-dot')
    expect(wrapper.text()).toBe('')
  })
})

describe('EvKeycap', () => {
  it('字符串拆成单键', () => {
    const wrapper = mount(EvKeycap, { props: { keys: 'c' } })
    expect(wrapper.findAll('kbd')).toHaveLength(1)
    expect(wrapper.text()).toBe('c')
  })

  it('数组渲染组合键', () => {
    const wrapper = mount(EvKeycap, { props: { keys: ['Cmd', 'K'] } })
    expect(wrapper.findAll('kbd')).toHaveLength(2)
  })
})
