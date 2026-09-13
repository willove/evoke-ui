import { mount, describe, it, expect, EvTabs, EvSwitch, EvAvatar, EvAvatarGroup, EvTimeline, EvComparisonTable, EvCta, EvNewsletter, EvLogoCloud, EvContainer } from './helpers'

describe('EvTabs', () => {
  const items = [
    { label: '月付', value: 'm' },
    { label: '年付', value: 'y' },
    { label: '买断', value: 'b', disabled: true },
  ]

  it('点击切换 v-model 并派发 change', async () => {
    const wrapper = mount(EvTabs, { props: { items, modelValue: 'm' } })
    const btns = wrapper.findAll('.ev-tabs__item')
    expect(btns[0].classes()).toContain('is-active')
    await btns[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['y'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['y'])
  })

  it('disabled 项不派发事件', async () => {
    const wrapper = mount(EvTabs, { props: { items, modelValue: 'm' } })
    await wrapper.findAll('.ev-tabs__item')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('underline 变体渲染', () => {
    const wrapper = mount(EvTabs, { props: { items, modelValue: 'm', variant: 'underline' } })
    expect(wrapper.classes()).toContain('is-underline')
  })
})

describe('EvSwitch', () => {
  it('点击切换并派发 change', async () => {
    const wrapper = mount(EvSwitch, { props: { modelValue: false } })
    expect(wrapper.attributes('role')).toBe('switch')
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('change')?.[0]).toEqual([true])
  })

  it('aria-checked 跟随状态；disabled 阻止切换', async () => {
    const wrapper = mount(EvSwitch, { props: { modelValue: true, disabled: true } })
    expect(wrapper.attributes('aria-checked')).toBe('true')
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('EvAvatar / EvAvatarGroup', () => {
  it('无图时回退姓名首字', () => {
    const wrapper = mount(EvAvatar, { props: { name: '林一舟' } })
    expect(wrapper.text()).toBe('林一'.slice(0, 2))
  })

  it('中英文名取首字母', () => {
    const wrapper = mount(EvAvatar, { props: { name: 'Ada Lovelace' } })
    expect(wrapper.text()).toBe('AL')
  })

  it('square 形态', () => {
    const wrapper = mount(EvAvatar, { props: { name: 'A', shape: 'square' } })
    expect(wrapper.classes()).toContain('is-square')
  })

  it('group 溢出折叠为 +N', () => {
    const wrapper = mount(EvAvatarGroup, {
      props: {
        items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
        max: 3,
      },
    })
    expect(wrapper.findAll('.ev-avatar')).toHaveLength(3)
    expect(wrapper.find('.ev-avatar-group__more').text()).toBe('+1')
  })
})

describe('EvTimeline', () => {
  it('渲染条目与最新高亮', () => {
    const wrapper = mount(EvTimeline, {
      props: {
        items: [
          { date: '2026-09-01', tag: '新功能', title: '团队空间上线', description: '支持共享与评论。' },
          { date: '2026-08-15', tag: '优化', title: '同步提速', description: '增量同步。' },
        ],
      },
    })
    const list = wrapper.findAll('.ev-timeline__item')
    expect(list).toHaveLength(2)
    expect(list[0].classes()).toContain('is-latest')
    expect(list[0].find('.ev-timeline__title').text()).toBe('团队空间上线')
    expect(wrapper.find('.ev-timeline__date').text()).toBe('2026-09-01')
  })

  it('description 插槽渲染块级内容（无需 description 字段）', () => {
    const wrapper = mount(EvTimeline, {
      props: {
        items: [
          { tag: 'v1.0', title: '版本一', bullets: ['A', 'B'] },
          { tag: 'v0.9', title: '版本零', description: '普通文本。' },
        ],
      },
      slots: {
        description: `<template #description="{ item }"><ul class="cl"><li v-for="b in item.bullets" :key="b">{{ b }}</li></ul></template>`,
      },
    })
    expect(wrapper.findAll('.cl li')).toHaveLength(2)
    // 插槽提供后对所有条目生效（按 item 数据自行分支），description 容器都在
    expect(wrapper.findAll('.ev-timeline__item')[1].find('.ev-timeline__description').exists()).toBe(true)
  })
})

describe('EvComparisonTable', () => {
  it('true 渲染勾、false 渲染破折号、字符串直出', () => {
    const wrapper = mount(EvComparisonTable, {
      props: {
        columns: [{ label: '免费版' }, { label: '专业版', featured: true }],
        rows: [
          { label: '无限空间', values: [false, true] },
          { label: '存储', values: ['2 GB', '100 GB'] },
        ],
      },
    })
    expect(wrapper.find('.ev-comparison-table__check').exists()).toBe(true)
    expect(wrapper.find('.ev-comparison-table__dash').text()).toBe('—')
    expect(wrapper.find('.ev-comparison-table__text').text()).toBe('2 GB')
    expect(wrapper.find('.is-featured').exists()).toBe(true)
  })

  it('compare 列头：图/色点/徽标/标语/价格/链接', () => {
    const wrapper = mount(EvComparisonTable, {
      props: {
        columns: [
          { label: 'Air 13', price: '¥6,999', priceNote: '起', colors: ['#d8dde6', '#2c3b55'] },
          { label: 'Pro 14', tagline: '主力之选', badge: '新款', href: '#pro' },
        ],
        rows: [{ label: '尺寸', values: ['13.6 英寸', '14.2 英寸'] }],
      },
    })
    expect(wrapper.find('.ev-comparison-table__col-image').exists()).toBe(false)
    expect(wrapper.find('.ev-comparison-table__col-colors i').attributes('style')).toContain('#d8dde6')
    expect(wrapper.find('.ev-comparison-table__col-badge').text()).toBe('新款')
    expect(wrapper.find('.ev-comparison-table__col-tagline').text()).toBe('主力之选')
    expect(wrapper.find('.ev-comparison-table__col-price b').text()).toBe('¥6,999')
    expect(wrapper.find('.ev-comparison-table__col-label a').attributes('href')).toBe('#pro')
  })

  it('groups 分组陈列，标题行跨全表', () => {
    const wrapper = mount(EvComparisonTable, {
      props: {
        columns: [{ label: 'A' }, { label: 'B' }],
        groups: [
          { title: '显示屏', rows: [{ label: '尺寸', values: ['13 英寸', '14 英寸'] }] },
          { title: '续航', rows: [{ label: '视频播放', values: [true, true] }] },
        ],
      },
    })
    const titles = wrapper.findAll('.ev-comparison-table__group')
    expect(titles.map((g) => g.text())).toEqual(['显示屏', '续航'])
  })

  it('数组值渲染多行文本；bordered 切网格边框；空值破折号', () => {
    const wrapper = mount(EvComparisonTable, {
      props: {
        columns: [{ label: 'A' }, { label: 'B' }],
        bordered: true,
        rows: [
          { label: '视频播放', values: [['15 小时', '节能模式 18 小时'], '17 小时'] },
          { label: '离线模式', values: [false, true] },
        ],
      },
    })
    expect(wrapper.classes()).toContain('is-bordered')
    const lines = wrapper.findAll('.ev-comparison-table__text.is-line')
    expect(lines).toHaveLength(2)
    expect(wrapper.findAll('.ev-comparison-table__dash')).toHaveLength(1)
  })
})

describe('EvCta / EvNewsletter / EvLogoCloud / EvContainer', () => {
  it('Cta 渲染标题动作位', () => {
    const wrapper = mount(EvCta, {
      props: { title: '准备好开始了吗', description: '免费创建你的第一个空间。' },
      slots: { actions: '<button class="cta-go">开始</button>' },
    })
    expect(wrapper.find('.ev-cta__title').text()).toBe('准备好开始了吗')
    expect(wrapper.find('.cta-go').exists()).toBe(true)
  })

  it('Newsletter 提交后切成功态并派发 subscribe', async () => {
    const wrapper = mount(EvNewsletter)
    await wrapper.find('input').setValue('me@example.com')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('subscribe')?.[0]).toEqual(['me@example.com'])
    expect(wrapper.classes()).toContain('is-subscribed')
  })

  it('LogoCloud 字标网格', () => {
    const wrapper = mount(EvLogoCloud, { props: { items: ['Acme', { label: 'Glob', icon: 'star' }], title: '他们都在用' } })
    expect(wrapper.findAll('.ev-logo-cloud__item')).toHaveLength(2)
    expect(wrapper.find('.ev-logo-cloud__title').text()).toBe('他们都在用')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('Container 宽度档', () => {
    const wrapper = mount(EvContainer, { props: { width: 'narrow' }, slots: { default: 'x' } })
    expect(wrapper.classes()).toContain('is-narrow')
    expect(wrapper.text()).toBe('x')
  })
})
