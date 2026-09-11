import { mount, describe, it, expect, nextTick, EwWaterfall } from './helpers'

const ratioItems = [
  { src: 'a.jpg', alt: '甲', ratio: 0.75 },
  { src: 'b.jpg', ratio: 1.5 },
  { src: 'c.jpg', ratio: 0.75 },
  { src: 'd.jpg', ratio: 1.5 },
  { src: 'e.jpg', ratio: 0.75 },
]

describe('EwWaterfall', () => {
  it('按最短列优先分发，列数正确', () => {
    const wrapper = mount(EwWaterfall, { props: { items: ratioItems, columns: 2 } })
    const cols = wrapper.findAll('.ew-waterfall__col')
    expect(cols).toHaveLength(2)
    // 载荷 [0.75,1.5] 轮转后：col0 = 甲丙丁，col1 = 乙戊
    expect(cols[0].findAll('.ew-waterfall__cell')).toHaveLength(3)
    expect(cols[1].findAll('.ew-waterfall__cell')).toHaveLength(2)
  })

  it('字符串条目归一化为 { src }，间距与圆角生效', () => {
    const wrapper = mount(EwWaterfall, {
      props: { items: ['a.jpg', 'b.jpg'], columns: 2, gap: 10, radius: 8 },
    })
    const item = wrapper.find('.ew-waterfall__item')
    expect(item.attributes('style')).toContain('--ew-waterfall-radius: 8px')
    expect(wrapper.find('.ew-waterfall').attributes('style')).toContain('gap: 10px')
    expect(item.find('img').attributes('src')).toBe('a.jpg')
  })

  it('caption 渲染蒙层文字', () => {
    const items = [{ src: 'a.jpg', caption: '山脊线', ratio: 0.75 }]
    const wrapper = mount(EwWaterfall, { props: { items } })
    expect(wrapper.find('.ew-waterfall__caption').text()).toBe('山脊线')
  })

  it('点击派发 select 并打开预览灯箱', async () => {
    const wrapper = mount(EwWaterfall, { props: { items: ratioItems, columns: 2 } })
    // DOM 顺序按列排布：第二个按钮是数据下标 2（col0 = 0,2,3）
    await wrapper.findAll('.ew-waterfall__item')[1].trigger('click')
    expect(wrapper.emitted('select')?.[0]?.[1]).toBe(2)
    await nextTick()
    expect(document.body.querySelector('.ew-image-preview')).not.toBeNull()
    wrapper.unmount()
  })

  it('preview 关闭时只派发 select，不开灯箱', async () => {
    const wrapper = mount(EwWaterfall, {
      props: { items: ratioItems, columns: 2, preview: false },
    })
    await wrapper.findAll('.ew-waterfall__item')[0].trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
    await nextTick()
    expect(document.body.querySelector('.ew-image-preview')).toBeNull()
    wrapper.unmount()
  })

  it('#item 插槽接管单元格，不渲染图片卡', () => {
    const wrapper = mount(EwWaterfall, {
      props: { items: ratioItems, columns: 2 },
      slots: { item: '<div class="custom-cell">自定义</div>' },
    })
    expect(wrapper.findAll('.custom-cell')).toHaveLength(5)
    expect(wrapper.find('.ew-waterfall__item').exists()).toBe(false)
  })

  it('columns 变化后重新分列', async () => {
    const wrapper = mount(EwWaterfall, { props: { items: ratioItems, columns: 2 } })
    await wrapper.setProps({ columns: 3 })
    expect(wrapper.findAll('.ew-waterfall__col')).toHaveLength(3)
  })

  it('未声明比例的图片，加载后按真实比例重新归位', async () => {
    const wrapper = mount(EwWaterfall, {
      props: { items: ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg'], columns: 2 },
    })
    const sizes = [
      [100, 400], // a 是长图，比例 4
      [100, 100],
      [100, 100],
      [100, 100],
    ]
    for (const [i, [w, h]] of sizes.entries()) {
      const img = wrapper.findAll('img')[i]
      Object.defineProperty(img.element, 'naturalWidth', { value: w })
      Object.defineProperty(img.element, 'naturalHeight', { value: h })
      await img.trigger('load')
    }
    await nextTick()
    const cols = wrapper.findAll('.ew-waterfall__col')
    // 长图独占一列，其余三张聚到另一列
    expect(cols[0].findAll('.ew-waterfall__cell')).toHaveLength(1)
    expect(cols[1].findAll('.ew-waterfall__cell')).toHaveLength(3)
    expect(cols[0].find('img').attributes('src')).toBe('a.jpg')
  })
})
