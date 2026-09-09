import { mount, describe, it, expect, vi, EwSearchBox, EwIconGrid, EwFeatureGrid, EwPricingCard, EwFaq, EwCodeBlock, EwStatistic, EwAlert, nextTick } from './helpers'

describe('EwSearchBox', () => {
  it('输入派发 v-model 与 search', async () => {
    const wrapper = mount(EwSearchBox, { props: { placeholder: 'Search 3229 icons' } })
    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('Search 3229 icons')
    input.element.value = 'arrow'
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['arrow'])
    expect(wrapper.emitted('search')?.[0]).toEqual(['arrow'])
  })

  it('分类下拉渲染与切换（remixicon 分类位）', async () => {
    const wrapper = mount(EwSearchBox, {
      props: { categories: ['All', 'Arrows', 'System'], category: 'All' },
    })
    // 未展开时菜单不渲染；点触发器展开后选择
    expect(wrapper.find('.ew-select__menu').exists()).toBe(false)
    await wrapper.find('.ew-search-box__category .ew-select__trigger').trigger('click')
    const opts = wrapper.findAll('.ew-select__option')
    expect(opts).toHaveLength(3)
    await opts[1].trigger('click')
    expect(wrapper.emitted('update:category')?.[0]).toEqual(['Arrows'])
  })

  it('suffix 插槽渲染动作位', () => {
    const wrapper = mount(EwSearchBox, {
      slots: { suffix: '<button class="folder-btn">folder</button>' },
    })
    expect(wrapper.find('.folder-btn').exists()).toBe(true)
  })
})

describe('EwIconGrid', () => {
  it('自定义图标集：分类分节 + 计数胶囊 + 过滤', async () => {
    const icons = [
      { name: 'arrow-left', category: 'Arrows', paths: [{ d: 'M0 0h24v24H0z' }] },
      { name: 'arrow-right', category: 'Arrows', paths: [{ d: 'M0 0h24v24H0z' }] },
      { name: 'search-line', category: 'System', paths: [{ d: 'M0 0h24v24H0z' }] },
    ]
    const wrapper = mount(EwIconGrid, { props: { icons } })
    await nextTick()
    const sections = wrapper.findAll('.ew-icon-grid__section')
    expect(sections).toHaveLength(2)
    expect(sections[0].find('.ew-icon-grid__title').text()).toContain('Arrows')
    expect(sections[0].find('.ew-icon-grid__count').text()).toBe('2')
    expect(wrapper.findAll('.ew-icon-grid__cell')).toHaveLength(3)
  })

  it('关键词过滤与空态', async () => {
    const icons = [
      { name: 'arrow-left', category: 'Arrows', paths: [] },
      { name: 'search-line', category: 'System', paths: [] },
    ]
    const wrapper = mount(EwIconGrid, { props: { icons } })
    await nextTick()
    await wrapper.find('input').setValue('search')
    await nextTick()
    expect(wrapper.findAll('.ew-icon-grid__cell')).toHaveLength(1)
    await wrapper.find('input').setValue('zzz')
    await nextTick()
    expect(wrapper.find('.ew-icon-grid__state').text()).toContain('No icons found')
  })

  it('点击单元格派发 select 并复制图标名', async () => {
    const writeText = vi.fn().mockResolvedValue()
    Object.assign(navigator, { clipboard: { writeText } })
    const icons = [{ name: 'brush-line', category: 'Design', paths: [{ d: 'M0 0' }] }]
    const wrapper = mount(EwIconGrid, { props: { icons } })
    await nextTick()
    await wrapper.find('.ew-icon-grid__cell').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['brush-line'])
    expect(writeText).toHaveBeenCalledWith('brush-line')
    expect(wrapper.emitted('copy')?.[0]).toEqual(['brush-line'])
  })

  it('内置展示集动态加载后渲染分类网格', async () => {
    const wrapper = mount(EwIconGrid, { props: {} })
    // 等 onMounted 动态 import 完成
    await vi.waitFor(() => {
      expect(wrapper.findAll('.ew-icon-grid__section').length).toBeGreaterThan(5)
    }, { timeout: 3000 })
    const cells = wrapper.findAll('.ew-icon-grid__cell')
    expect(cells.length).toBeGreaterThan(300)
  })
})

describe('EwFeatureGrid', () => {
  const items = [
    { icon: 'check', title: 'Pixel Perfect', description: '手工对齐网格' },
    { icon: 'star', title: 'Vector' },
  ]

  it('bullets 行内特性条（remixicon hero）', () => {
    const wrapper = mount(EwFeatureGrid, { props: { items, variant: 'bullets' } })
    expect(wrapper.classes()).toContain('is-bullets')
    expect(wrapper.findAll('.ew-feature')).toHaveLength(2)
  })

  it('cards 特性卡与列数', () => {
    const wrapper = mount(EwFeatureGrid, { props: { items, variant: 'cards', columns: 2 } })
    expect(wrapper.classes()).toContain('is-columns-2')
    expect(wrapper.find('.ew-feature__description').exists()).toBe(true)
  })
})

describe('EwPricingCard', () => {
  it('完整定价要素（launchos 语言）', () => {
    const wrapper = mount(EwPricingCard, {
      props: {
        title: '5 Devices',
        price: '¥115.0',
        originalPrice: '¥241.41',
        offerNote: 'macOS 27 Public Beta Offer',
        badge: 'SAVE 50%',
        features: ['5 Mac Licenses', 'Lifetime Updates'],
        actionText: 'Lifetime License',
        featured: true,
      },
    })
    expect(wrapper.find('.ew-pricing-card__badge').text()).toBe('SAVE 50%')
    expect(wrapper.find('.ew-pricing-card__original').text()).toBe('¥241.41')
    expect(wrapper.find('.ew-pricing-card__note').text()).toContain('Beta Offer')
    expect(wrapper.findAll('.ew-pricing-card__feature')).toHaveLength(2)
    expect(wrapper.classes()).toContain('is-featured')
    expect(wrapper.find('.ew-pricing-card__footer button').text()).toContain('Lifetime License')
  })

  it('点击动作按钮派发 action', async () => {
    const wrapper = mount(EwPricingCard, { props: { actionText: 'Buy' } })
    await wrapper.find('.ew-pricing-card__footer button').trigger('click')
    expect(wrapper.emitted('action')).toHaveLength(1)
  })
})

describe('EwFaq', () => {
  const items = [
    { question: 'Q1?', answer: 'A1' },
    { question: 'Q2?', answer: 'A2' },
  ]

  it('默认收起，点击展开（单开模式）', async () => {
    const wrapper = mount(EwFaq, { props: { items } })
    expect(wrapper.findAll('.ew-faq__item.is-open')).toHaveLength(0)
    await wrapper.findAll('.ew-faq__question')[0].trigger('click')
    expect(wrapper.findAll('.ew-faq__item.is-open')).toHaveLength(1)
    await wrapper.findAll('.ew-faq__question')[1].trigger('click')
    expect(wrapper.findAll('.ew-faq__item.is-open')).toHaveLength(1)
    expect(wrapper.findAll('.ew-faq__item.is-open')[0].find('.ew-faq__question-text').text()).toBe('Q2?')
  })

  it('multiple 允许多开，再点收起', async () => {
    const wrapper = mount(EwFaq, { props: { items, multiple: true, defaultOpen: 0 } })
    await wrapper.findAll('.ew-faq__question')[1].trigger('click')
    expect(wrapper.findAll('.ew-faq__item.is-open')).toHaveLength(2)
    await wrapper.findAll('.ew-faq__question')[0].trigger('click')
    expect(wrapper.findAll('.ew-faq__item.is-open')).toHaveLength(1)
  })
})

describe('EwCodeBlock', () => {
  it('渲染命令与提示符', () => {
    const wrapper = mount(EwCodeBlock, { props: { code: 'brew install --cask launchos', prefix: '$' } })
    expect(wrapper.find('.ew-code-block__prefix').text()).toBe('$')
    expect(wrapper.find('.ew-code-block__code').text()).toBe('brew install --cask launchos')
    expect(wrapper.find('.ew-code-block__copy').exists()).toBe(true)
  })

  it('点击复制并反馈', async () => {
    const writeText = vi.fn().mockResolvedValue()
    Object.assign(navigator, { clipboard: { writeText } })
    const wrapper = mount(EwCodeBlock, { props: { code: 'npm i ew-ui', showCopyText: true } })
    await wrapper.find('.ew-code-block__copy').trigger('click')
    expect(writeText).toHaveBeenCalledWith('npm i ew-ui')
    await nextTick()
    expect(wrapper.emitted('copy')?.[0]?.[0]).toBe('npm i ew-ui')
  })
})

describe('EwStatistic', () => {
  it('数值 + 标签', () => {
    const wrapper = mount(EwStatistic, { props: { value: '7.7K', label: 'GitHub Stars' }, })
    expect(wrapper.find('.ew-statistic__value').text()).toBe('7.7K')
    expect(wrapper.find('.ew-statistic__label').text()).toBe('GitHub Stars')
  })
})

describe('EwAlert', () => {
  it('pill 公告横幅形态 + 动作位', () => {
    const wrapper = mount(EwAlert, {
      props: { pill: true },
      slots: { default: 'Access 300,000 More Icons', action: '<a class="demo-link">→</a>' },
    })
    expect(wrapper.classes()).toContain('is-pill')
    expect(wrapper.find('.demo-link').exists()).toBe(true)
  })

  it('closable 关闭后隐藏', async () => {
    const wrapper = mount(EwAlert, { props: { closable: true }, slots: { default: 'hi' } })
    await wrapper.find('.ew-alert__close').trigger('click')
    expect(wrapper.classes()).toContain('is-hidden')
  })
})
