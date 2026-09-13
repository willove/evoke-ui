import { mount, describe, it, expect, EvBento } from './helpers'

const items = [
  { eyebrow: '影像', title: '一亿像素主摄', desc: '夜景也可以很清楚', image: '/a.jpg' },
  { title: '全场最薄', desc: '6.9mm 机身', tone: 'dark', span: 2 },
  { title: '续航', desc: '两天一充', image: '/b.jpg', imagePos: 'fill', rows: 2 },
  { title: '新款配色', href: '#colors' },
]

describe('EvBento', () => {
  it('渲染卡片：标题/描述/图/色调/跨行 class', () => {
    const wrapper = mount(EvBento, { props: { items, columns: 3 } })
    const cards = wrapper.findAll('.ev-bento__card')
    expect(cards).toHaveLength(4)
    expect(wrapper.find('.ev-bento__eyebrow').text()).toBe('影像')
    expect(wrapper.find('.ev-bento__title').text()).toBe('一亿像素主摄')
    expect(wrapper.findAll('.ev-bento__image')).toHaveLength(2)
    expect(cards[1].classes()).toContain('is-dark')
    expect(cards[2].classes()).toContain('is-fill')
    expect(cards[2].classes()).toContain('is-rows-2')
    expect(cards[3].element.tagName).toBe('A')
    expect(cards[3].attributes('href')).toBe('#colors')
  })

  it('span 钳制到列数：跨列 var 与整行回落', () => {
    const wrapper = mount(EvBento, {
      props: { items: [{ title: '宽卡', span: 2 }, { title: '超宽卡', span: 9 }], columns: 3 },
    })
    const cards = wrapper.findAll('.ev-bento__card')
    expect(cards[0].attributes('style')).toContain('--bento-span: 2')
    // span 9 超出 3 列 → 钳为 3（整行）
    expect(cards[1].attributes('style')).toContain('--bento-span: 3')
  })

  it('bordered / dense / gap 与列数变量', () => {
    const wrapper = mount(EvBento, {
      props: { items: [{ title: 'A' }], columns: 4, bordered: true, dense: true, gap: 24 },
    })
    expect(wrapper.classes()).toContain('is-bordered')
    expect(wrapper.classes()).toContain('is-dense')
    expect(wrapper.attributes('style')).toContain('--ev-bento-columns: 4')
    expect(wrapper.attributes('style')).toContain('--ev-bento-gap: 24px')
  })

  it('item 插槽可接管卡片内容', () => {
    const wrapper = mount(EvBento, {
      props: { items: [{ title: '默认内容' }] },
      slots: {
        item: `<template #item="{ item }"><div class="custom">{{ item.title }}!</div></template>`,
      },
    })
    expect(wrapper.find('.custom').text()).toBe('默认内容!')
    expect(wrapper.find('.ev-bento__title').exists()).toBe(false)
  })
})
