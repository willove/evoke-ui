import { mount, describe, it, expect, EwTabs, EwSwitch, EwAvatar, EwAvatarGroup, EwTimeline, EwComparisonTable, EwCta, EwNewsletter, EwLogoCloud, EwContainer } from './helpers'

describe('EwTabs', () => {
  const items = [
    { label: '月付', value: 'm' },
    { label: '年付', value: 'y' },
    { label: '买断', value: 'b', disabled: true },
  ]

  it('点击切换 v-model 并派发 change', async () => {
    const wrapper = mount(EwTabs, { props: { items, modelValue: 'm' } })
    const btns = wrapper.findAll('.ew-tabs__item')
    expect(btns[0].classes()).toContain('is-active')
    await btns[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['y'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['y'])
  })

  it('disabled 项不派发事件', async () => {
    const wrapper = mount(EwTabs, { props: { items, modelValue: 'm' } })
    await wrapper.findAll('.ew-tabs__item')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('underline 变体渲染', () => {
    const wrapper = mount(EwTabs, { props: { items, modelValue: 'm', variant: 'underline' } })
    expect(wrapper.classes()).toContain('is-underline')
  })
})

describe('EwSwitch', () => {
  it('点击切换并派发 change', async () => {
    const wrapper = mount(EwSwitch, { props: { modelValue: false } })
    expect(wrapper.attributes('role')).toBe('switch')
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('change')?.[0]).toEqual([true])
  })

  it('aria-checked 跟随状态；disabled 阻止切换', async () => {
    const wrapper = mount(EwSwitch, { props: { modelValue: true, disabled: true } })
    expect(wrapper.attributes('aria-checked')).toBe('true')
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('EwAvatar / EwAvatarGroup', () => {
  it('无图时回退姓名首字', () => {
    const wrapper = mount(EwAvatar, { props: { name: '林一舟' } })
    expect(wrapper.text()).toBe('林一'.slice(0, 2))
  })

  it('中英文名取首字母', () => {
    const wrapper = mount(EwAvatar, { props: { name: 'Ada Lovelace' } })
    expect(wrapper.text()).toBe('AL')
  })

  it('square 形态', () => {
    const wrapper = mount(EwAvatar, { props: { name: 'A', shape: 'square' } })
    expect(wrapper.classes()).toContain('is-square')
  })

  it('group 溢出折叠为 +N', () => {
    const wrapper = mount(EwAvatarGroup, {
      props: {
        items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
        max: 3,
      },
    })
    expect(wrapper.findAll('.ew-avatar')).toHaveLength(3)
    expect(wrapper.find('.ew-avatar-group__more').text()).toBe('+1')
  })
})

describe('EwTimeline', () => {
  it('渲染条目与最新高亮', () => {
    const wrapper = mount(EwTimeline, {
      props: {
        items: [
          { date: '2026-09-01', tag: '新功能', title: '团队空间上线', description: '支持共享与评论。' },
          { date: '2026-08-15', tag: '优化', title: '同步提速', description: '增量同步。' },
        ],
      },
    })
    const list = wrapper.findAll('.ew-timeline__item')
    expect(list).toHaveLength(2)
    expect(list[0].classes()).toContain('is-latest')
    expect(list[0].find('.ew-timeline__title').text()).toBe('团队空间上线')
    expect(wrapper.find('.ew-timeline__date').text()).toBe('2026-09-01')
  })
})

describe('EwComparisonTable', () => {
  it('true 渲染勾、false 渲染破折号、字符串直出', () => {
    const wrapper = mount(EwComparisonTable, {
      props: {
        columns: [{ label: '免费版' }, { label: '专业版', featured: true }],
        rows: [
          { label: '无限空间', values: [false, true] },
          { label: '存储', values: ['2 GB', '100 GB'] },
        ],
      },
    })
    expect(wrapper.find('.ew-comparison-table__check').exists()).toBe(true)
    expect(wrapper.find('.ew-comparison-table__dash').text()).toBe('—')
    expect(wrapper.find('.ew-comparison-table__text').text()).toBe('2 GB')
    expect(wrapper.find('th.is-featured').exists()).toBe(true)
  })
})

describe('EwCta / EwNewsletter / EwLogoCloud / EwContainer', () => {
  it('Cta 渲染标题动作位', () => {
    const wrapper = mount(EwCta, {
      props: { title: '准备好开始了吗', description: '免费创建你的第一个空间。' },
      slots: { actions: '<button class="cta-go">开始</button>' },
    })
    expect(wrapper.find('.ew-cta__title').text()).toBe('准备好开始了吗')
    expect(wrapper.find('.cta-go').exists()).toBe(true)
  })

  it('Newsletter 提交后切成功态并派发 subscribe', async () => {
    const wrapper = mount(EwNewsletter)
    await wrapper.find('input').setValue('me@example.com')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('subscribe')?.[0]).toEqual(['me@example.com'])
    expect(wrapper.classes()).toContain('is-subscribed')
  })

  it('LogoCloud 字标网格', () => {
    const wrapper = mount(EwLogoCloud, { props: { items: ['Acme', { label: 'Glob', icon: 'star' }], title: '他们都在用' } })
    expect(wrapper.findAll('.ew-logo-cloud__item')).toHaveLength(2)
    expect(wrapper.find('.ew-logo-cloud__title').text()).toBe('他们都在用')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('Container 宽度档', () => {
    const wrapper = mount(EwContainer, { props: { width: 'narrow' }, slots: { default: 'x' } })
    expect(wrapper.classes()).toContain('is-narrow')
    expect(wrapper.text()).toBe('x')
  })
})
