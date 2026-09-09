import { mount, describe, it, expect, EwSection, EwCard, EwNavbar, EwFooter, EwHero, EwQuote } from './helpers'

describe('EwSection', () => {
  it('渲染眉题 + 标题 + 描述（remixdesign WORK 区块语言）', () => {
    const wrapper = mount(EwSection, {
      props: { eyebrow: 'work', title: 'A Selection of Works', description: 'Our recent products.' },
    })
    expect(wrapper.find('.ew-section__eyebrow').text()).toBe('work')
    expect(wrapper.find('.ew-section__title').text()).toBe('A Selection of Works')
    expect(wrapper.find('.ew-section__description').text()).toBe('Our recent products.')
  })

  it('center 对齐', () => {
    const wrapper = mount(EwSection, { props: { title: 'T', align: 'center' } })
    expect(wrapper.classes()).toContain('is-center')
  })
})

describe('EwCard', () => {
  it('粉彩 tone 与贴纸形态', () => {
    const wrapper = mount(EwCard, { props: { tone: 'cream', sticker: true }, slots: { default: 'body' } })
    expect(wrapper.classes()).toContain('is-cream')
    expect(wrapper.classes()).toContain('is-sticker')
  })

  it('featured 深色主推形态优先渲染', () => {
    const wrapper = mount(EwCard, { props: { featured: true } })
    expect(wrapper.classes()).toContain('is-featured')
  })

  it('tag 属性渲染为链接卡', () => {
    const wrapper = mount(EwCard, { props: { tag: 'a' } })
    expect(wrapper.element.tagName).toBe('A')
  })
})

describe('EwNavbar', () => {
  it('渲染 logo 文本与导航项', () => {
    const wrapper = mount(EwNavbar, {
      props: {
        logoText: 'Remix UI',
        items: [
          { label: 'Features', href: '#features' },
          { label: 'Blog', href: '/blog' },
        ],
      },
    })
    expect(wrapper.find('.ew-navbar__logo-text').text()).toBe('Remix UI')
    const links = wrapper.findAll('.ew-navbar__link')
    expect(links).toHaveLength(2)
    expect(links[0].attributes('href')).toBe('#features')
  })

  it('active 高亮当前项', () => {
    const wrapper = mount(EwNavbar, {
      props: { items: [{ label: 'A', href: '#' }, { label: 'B', href: '#' }], active: 'B' },
    })
    expect(wrapper.findAll('.ew-navbar__link')[1].classes()).toContain('is-active')
  })

  it('actions 插槽渲染', () => {
    const wrapper = mount(EwNavbar, {
      props: { items: [] },
      slots: { actions: '<button class="demo-action">★</button>' },
    })
    expect(wrapper.find('.demo-action').exists()).toBe(true)
  })
})

describe('EwFooter', () => {
  it('多栏链接 + 版权条', () => {
    const wrapper = mount(EwFooter, {
      props: {
        columns: [
          { title: 'Product', links: [{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }] },
          { title: 'Company', links: [{ label: 'About', href: '#' }] },
        ],
        copyright: '© 2026 Remix Design',
      },
    })
    const cols = wrapper.findAll('.ew-footer__col')
    expect(cols).toHaveLength(2)
    expect(wrapper.findAll('.ew-footer__link')).toHaveLength(3)
    expect(wrapper.find('.ew-footer__copyright').text()).toBe('© 2026 Remix Design')
  })
})

describe('EwHero', () => {
  it('标题 + 描述 + 渐变底', () => {
    const wrapper = mount(EwHero, {
      props: { title: 'Simply Delightful Icon System', description: 'Open-source neutral-style symbols.' },
    })
    expect(wrapper.classes()).toContain('is-tinted')
    expect(wrapper.find('.ew-hero__title').text()).toBe('Simply Delightful Icon System')
    expect(wrapper.find('.ew-hero__description').exists()).toBe(true)
  })

  it('badge / actions / aside 插槽', () => {
    const wrapper = mount(EwHero, {
      props: { title: 'H' },
      slots: {
        badge: '<span class="hero-badge">v1.0</span>',
        actions: '<button class="hero-cta">Go</button>',
        aside: '<div class="hero-art">art</div>',
      },
    })
    expect(wrapper.find('.hero-badge').exists()).toBe(true)
    expect(wrapper.find('.hero-cta').exists()).toBe(true)
    expect(wrapper.find('.hero-art').exists()).toBe(true)
    expect(wrapper.find('.ew-hero__inner').classes()).toContain('has-aside')
  })
})

describe('EwQuote', () => {
  it('引用 + 作者 + 来源链接', () => {
    const wrapper = mount(EwQuote, {
      props: {
        quote: 'The best Launchpad alternative.',
        author: 'John',
        role: 'YouTuber',
        source: 'MacStories',
        sourceHref: 'https://example.com',
      },
    })
    expect(wrapper.find('.ew-quote__text').text()).toContain('Launchpad')
    expect(wrapper.find('.ew-quote__name').text()).toBe('John')
    expect(wrapper.find('.ew-quote__source').attributes('href')).toBe('https://example.com')
  })
})
