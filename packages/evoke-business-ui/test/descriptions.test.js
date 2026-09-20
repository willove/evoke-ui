import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EbDescriptions from '../src/components/descriptions/index.vue'
import EbDescriptionsItem from '../src/components/descriptions/item.vue'

/**
 * EbDescriptions — colon / column 响应式对象 / label-style·content-style
 */

const ITEMS = [
  { label: '客户', content: '张三' },
  { label: '手机号', content: '13800000000' },
  { label: '支付方式', content: '微信支付' },
  { label: '状态', content: '已支付' },
]

const DescHost = {
  components: { EbDescriptions, EbDescriptionsItem },
  props: ['descProps', 'items'],
  template: `
    <eb-descriptions v-bind="descProps">
      <eb-descriptions-item
        v-for="(it, i) in items"
        :key="i"
        :label="it.label"
        v-bind="it.itemProps"
      >{{ it.content }}</eb-descriptions-item>
    </eb-descriptions>
  `,
}

const mountDesc = (descProps = {}, items = ITEMS) =>
  mount(DescHost, {
    props: { descProps, items },
    attachTo: document.body,
  })

afterEach(() => {
  // 还原测试内对 matchMedia 的临时 stub
  if (window.__originalMatchMedia) {
    window.matchMedia = window.__originalMatchMedia
    delete window.__originalMatchMedia
  }
})

describe('EbDescriptions colon', () => {
  it('默认不渲染冒号', () => {
    const wrapper = mountDesc({ title: '订单' })
    expect(wrapper.find('.eb-descriptions__colon').exists()).toBe(false)
    wrapper.unmount()
  })

  it('colon=true 每个标签后渲染冒号', () => {
    const wrapper = mountDesc({ title: '订单', colon: true })
    const colons = wrapper.findAll('.eb-descriptions__colon')
    expect(colons).toHaveLength(4)
    for (const c of colons) expect(c.text()).toBe(':')
    wrapper.unmount()
  })

  it('vertical 方向同样渲染冒号', () => {
    const wrapper = mountDesc({ colon: true, direction: 'vertical' })
    expect(wrapper.findAll('.eb-descriptions__colon')).toHaveLength(4)
    wrapper.unmount()
  })
})

describe('EbDescriptions column', () => {
  it('数字形态行为不变：column=2 → 2 行，column=1 → 4 行', () => {
    const two = mountDesc({ column: 2 })
    expect(two.findAll('tr')).toHaveLength(2)
    two.unmount()
    const one = mountDesc({ column: 1 })
    expect(one.findAll('tr')).toHaveLength(4)
    one.unmount()
  })

  it('对象形态默认档：matchMedia 全不命中时取最小已声明档（xs）', async () => {
    // test/setup.js 的全局 stub matches 恒为 false
    const wrapper = mountDesc({ column: { xs: 1, md: 3 } })
    await nextTick()
    expect(wrapper.findAll('tr')).toHaveLength(4) // 等效 column=1
    wrapper.unmount()
  })

  it('对象形态命中 md 档：{ xs: 1, md: 3 } 在 md 断点等效 column=3', async () => {
    window.__originalMatchMedia = window.matchMedia
    window.matchMedia = (query) => ({
      matches: /768/.test(query),
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false
      },
    })
    const wrapper = mountDesc({ column: { xs: 1, md: 3 } })
    await nextTick()
    expect(wrapper.findAll('tr')).toHaveLength(2) // 等效 column=3
    // 卸载清监听器不报错
    expect(() => wrapper.unmount()).not.toThrow()
  })
})

describe('EbDescriptions label-style / content-style', () => {
  it('容器级样式应用到全部标签与内容单元格', () => {
    const wrapper = mountDesc({
      column: 2,
      labelStyle: { color: 'red' },
      contentStyle: { fontWeight: 600 },
    })
    for (const th of wrapper.findAll('th')) {
      expect(th.element.style.color).toBe('red')
    }
    for (const td of wrapper.findAll('td')) {
      expect(td.element.style.fontWeight).toBe('600')
    }
    wrapper.unmount()
  })

  it('item 级同名 prop 覆盖容器级', () => {
    const items = ITEMS.map((it, i) =>
      i === 0 ? { ...it, itemProps: { labelStyle: { color: 'blue' } } } : it,
    )
    const wrapper = mountDesc({ column: 2, labelStyle: { color: 'red' } }, items)
    const ths = wrapper.findAll('th')
    expect(ths[0].element.style.color).toBe('blue') // item 覆盖
    expect(ths[1].element.style.color).toBe('red') // 容器兜底
    wrapper.unmount()
  })

  it('item 级 content-style 与 width 共存（width 保持 px 契约）', () => {
    const items = [{ ...ITEMS[0], itemProps: { contentStyle: { color: 'green' }, width: 120 } }, ...ITEMS.slice(1)]
    const wrapper = mountDesc({ column: 2 }, items)
    const td = wrapper.find('td')
    expect(td.element.style.color).toBe('green')
    expect(td.element.style.width).toBe('120px')
    wrapper.unmount()
  })
})
