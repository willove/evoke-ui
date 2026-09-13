import { mount, describe, it, expect, EvCompare } from './helpers'

const products = [
  { name: 'Air 13', tagline: '轻装上阵', price: '¥6,999', priceNote: '起', colors: ['#d8dde6', '#2c3b55'] },
  { name: 'Pro 14', tagline: '主力之选', price: '¥8,999', priceNote: '起', badge: '新款', href: '#pro' },
  { name: 'Ultra 16', tagline: '性能天花板', price: '¥12,999', priceNote: '起' },
]

const groups = [
  {
    title: '显示屏',
    rows: [
      { label: '尺寸', values: ['13.6 英寸', '14.2 英寸', '16.2 英寸'] },
      { label: '高刷新率', values: [false, true, true] },
    ],
  },
  {
    title: '续航',
    rows: [
      { label: '视频播放', values: [['15 小时', '（节能模式 18 小时）'], '17 小时', '21 小时'], note: '实验室数据' },
    ],
  },
]

describe('EvCompare', () => {
  it('渲染产品列头：名称/标语/价格/徽标/色卡/链接', () => {
    const wrapper = mount(EvCompare, { props: { products, groups } })
    const heads = wrapper.findAll('.ev-compare__product')
    expect(heads).toHaveLength(3)
    expect(wrapper.find('.ev-compare__name').text()).toBe('Air 13')
    expect(wrapper.find('.ev-compare__tagline').text()).toBe('轻装上阵')
    expect(wrapper.find('.ev-compare__price-num').text()).toBe('¥6,999')
    expect(wrapper.find('.ev-compare__badge').text()).toBe('新款')
    expect(wrapper.find('.ev-compare__colors i').attributes('style')).toContain('#d8dde6')
    expect(wrapper.find('.ev-compare__name a').attributes('href')).toBe('#pro')
  })

  it('分组标题与单元格语义：字符串直出 / 勾 / 破折号 / 数组多行', () => {
    const wrapper = mount(EvCompare, { props: { products, groups } })
    const groupTitles = wrapper.findAll('.ev-compare__group')
    expect(groupTitles.map((g) => g.text())).toEqual(['显示屏', '续航'])
    expect(groupTitles[0].attributes('colspan')).toBe('4')

    const cells = wrapper.findAll('.ev-compare__cell')
    expect(cells[0].find('.ev-compare__text').text()).toBe('13.6 英寸')
    // 高刷新率行：false → 破折号，true → 勾
    expect(cells[3].find('.ev-compare__dash').exists()).toBe(true)
    expect(cells[4].find('.ev-compare__check').exists()).toBe(true)
    expect(cells[5].find('.ev-compare__check').exists()).toBe(true)
    // 数组值渲染为多行
    const multi = cells[6].findAll('.ev-compare__text')
    expect(multi).toHaveLength(2)
  })

  it('无边框为默认，bordered 加网格边框；表格随产品数撑最小宽', () => {
    const plain = mount(EvCompare, { props: { products, groups } })
    expect(plain.classes()).not.toContain('is-bordered')

    const bordered = mount(EvCompare, { props: { products, groups, bordered: true } })
    expect(bordered.classes()).toContain('is-bordered')

    // (产品数 + 1) 列 × 200px，下限 640px：2 产品 → max(600, 640) = 640
    const withMin = mount(EvCompare, { props: { products: products.slice(0, 2), groups } })
    expect(withMin.find('.ev-compare__table').attributes('style')).toContain('640px')
  })

  it('行级 note 落在标签下方', () => {
    const wrapper = mount(EvCompare, { props: { products, groups } })
    expect(wrapper.find('.ev-compare__label-note').text()).toBe('实验室数据')
  })
})
