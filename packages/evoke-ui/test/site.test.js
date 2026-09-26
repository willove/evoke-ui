import { mount, describe, it, expect, EvSection, EvCard, EvNavbar, EvFooter, EvHero, EvQuote } from './helpers'

describe('EvSection', () => {
  it('渲染眉题 + 标题 + 描述（remixdesign WORK 区块语言）', () => {
    const wrapper = mount(EvSection, {
      props: { eyebrow: 'work', title: 'A Selection of Works', description: 'Our recent products.' },
    })
    expect(wrapper.find('.ev-section__eyebrow').text()).toBe('work')
    expect(wrapper.find('.ev-section__title').text()).toBe('A Selection of Works')
    expect(wrapper.find('.ev-section__description').text()).toBe('Our recent products.')
  })

  it('center 对齐', () => {
    const wrapper = mount(EvSection, { props: { title: 'T', align: 'center' } })
    expect(wrapper.classes()).toContain('is-center')
  })

  it('width 定宽档：默认 default 档（定宽居中），显式 full 不带档位类', () => {
    const def = mount(EvSection, { props: { title: 'T' } })
    expect(def.classes()).toContain('is-width-default')

    const full = mount(EvSection, { props: { title: 'T', width: 'full' } })
    expect(full.classes()).not.toContain('is-width-full')

    const narrow = mount(EvSection, { props: { title: 'T', width: 'narrow' } })
    expect(narrow.classes()).toContain('is-width-narrow')

    const wide = mount(EvSection, { props: { title: 'T', width: 'wide' } })
    expect(wide.classes()).toContain('is-width-wide')
  })

  it('width 定宽不影响 align / snap 等既有类', () => {
    const wrapper = mount(EvSection, { props: { title: 'T', width: 'default', align: 'center', snap: true } })
    expect(wrapper.classes()).toContain('is-width-default')
    expect(wrapper.classes()).toContain('is-center')
    expect(wrapper.classes()).toContain('is-snap')
  })
})

describe('EvCard', () => {
  it('粉彩 tone 与贴纸形态', () => {
    const wrapper = mount(EvCard, { props: { tone: 'cream', sticker: true }, slots: { default: 'body' } })
    expect(wrapper.classes()).toContain('is-cream')
    expect(wrapper.classes()).toContain('is-sticker')
  })

  it('featured 深色主推形态优先渲染', () => {
    const wrapper = mount(EvCard, { props: { featured: true } })
    expect(wrapper.classes()).toContain('is-featured')
  })

  it('tag 属性渲染为链接卡', () => {
    const wrapper = mount(EvCard, { props: { tag: 'a' } })
    expect(wrapper.element.tagName).toBe('A')
  })
})

describe('EvNavbar', () => {
  it('渲染 logo 文本与导航项', () => {
    const wrapper = mount(EvNavbar, {
      props: {
        logoText: 'Remix UI',
        items: [
          { label: 'Features', href: '#features' },
          { label: 'Blog', href: '/blog' },
        ],
      },
    })
    expect(wrapper.find('.ev-navbar__logo-text').text()).toBe('Remix UI')
    const links = wrapper.findAll('.ev-navbar__link')
    expect(links).toHaveLength(2)
    expect(links[0].attributes('href')).toBe('#features')
  })

  it('active 高亮当前项', () => {
    const wrapper = mount(EvNavbar, {
      props: { items: [{ label: 'A', href: '#' }, { label: 'B', href: '#' }], active: 'B' },
    })
    expect(wrapper.findAll('.ev-navbar__link')[1].classes()).toContain('is-active')
  })

  it('actions 插槽渲染', () => {
    const wrapper = mount(EvNavbar, {
      props: { items: [] },
      slots: { actions: '<button class="demo-action">★</button>' },
    })
    expect(wrapper.find('.demo-action').exists()).toBe(true)
  })

  it('安全回归：target="_blank" 自动补 rel="noopener noreferrer"（宿主显式 rel 优先）', () => {
    const wrapper = mount(EvNavbar, {
      props: {
        items: [
          { label: '外链', href: 'https://a.com', target: '_blank' },
          { label: '自定义', href: 'https://b.com', target: '_blank', rel: 'external' },
          { label: '本站', href: '/docs' },
        ],
      },
    })
    const links = wrapper.findAll('.ev-navbar__link')
    expect(links[0].attributes('rel')).toBe('noopener noreferrer')
    expect(links[1].attributes('rel')).toBe('external')
    expect(links[2].attributes('rel')).toBeUndefined()
  })
})

describe('EvFooter', () => {
  it('多栏链接 + 版权条', () => {
    const wrapper = mount(EvFooter, {
      props: {
        columns: [
          { title: 'Product', links: [{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }] },
          { title: 'Company', links: [{ label: 'About', href: '#' }] },
        ],
        copyright: '© 2026 Remix Design',
      },
    })
    const cols = wrapper.findAll('.ev-footer__col')
    expect(cols).toHaveLength(2)
    expect(wrapper.findAll('.ev-footer__link')).toHaveLength(3)
    expect(wrapper.find('.ev-footer__copyright').text()).toBe('© 2026 Remix Design')
  })

  it('安全回归：target="_blank" 自动补 rel="noopener noreferrer"（宿主显式 rel 优先）', () => {
    const wrapper = mount(EvFooter, {
      props: {
        columns: [
          {
            title: 'Out',
            links: [
              { label: 'GitHub', href: 'https://github.com', target: '_blank' },
              { label: 'Docs', href: 'https://docs', target: '_blank', rel: 'nofollow' },
            ],
          },
        ],
      },
    })
    const links = wrapper.findAll('.ev-footer__link')
    expect(links[0].attributes('rel')).toBe('noopener noreferrer')
    expect(links[1].attributes('rel')).toBe('nofollow')
  })
})

describe('EvHero', () => {
  it('标题 + 描述 + 渐变底', () => {
    const wrapper = mount(EvHero, {
      props: { title: 'Simply Delightful Icon System', description: 'Open-source neutral-style symbols.' },
    })
    expect(wrapper.classes()).toContain('is-tinted')
    expect(wrapper.find('.ev-hero__title').text()).toBe('Simply Delightful Icon System')
    expect(wrapper.find('.ev-hero__description').exists()).toBe(true)
  })

  it('badge / actions / aside 插槽', () => {
    const wrapper = mount(EvHero, {
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
    expect(wrapper.find('.ev-hero__inner').classes()).toContain('has-aside')
  })
})

describe('EvQuote', () => {
  it('引用 + 作者 + 来源链接', () => {
    const wrapper = mount(EvQuote, {
      props: {
        quote: 'The best Launchpad alternative.',
        author: 'John',
        role: 'YouTuber',
        source: 'MacStories',
        sourceHref: 'https://example.com',
      },
    })
    expect(wrapper.find('.ev-quote__text').text()).toContain('Launchpad')
    expect(wrapper.find('.ev-quote__name').text()).toBe('John')
    expect(wrapper.find('.ev-quote__source').attributes('href')).toBe('https://example.com')
  })
})
