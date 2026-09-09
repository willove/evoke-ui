import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvContainer from '../src/components/container/index.vue'
import EvHeader from '../src/components/header/index.vue'
import EvAside from '../src/components/aside/index.vue'
import EvMain from '../src/components/main/index.vue'
import EvFooter from '../src/components/footer/index.vue'
import EvRow from '../src/components/row/index.vue'
import EvCol from '../src/components/col/index.vue'
import EvSpace from '../src/components/space/index.vue'
import EvScrollbar from '../src/components/scrollbar/index.vue'
import EvStack from '../src/components/stack/index.vue'

const LAYOUT = { components: { EvContainer, EvHeader, EvAside, EvMain, EvFooter } }

describe('布局五件（Container/Header/Aside/Main/Footer）', () => {
  it('Container 双 class + 默认 horizontal', () => {
    const wrapper = mount(EvContainer, { slots: { default: 'x' } })
    expect(wrapper.classes()).toContain('ev-container')
    expect(wrapper.classes()).toContain('ev-container')
    expect(wrapper.classes()).not.toContain('is-vertical')
  })

  it('direction 显式指定', () => {
    expect(mount(EvContainer, { props: { direction: 'vertical' } }).classes()).toContain('is-vertical')
    expect(mount(EvContainer, { props: { direction: 'horizontal' } }).classes()).not.toContain('is-vertical')
  })

  it('自动检测：子级含 EvHeader → vertical', () => {
    const wrapper = mount(
      {
        ...LAYOUT,
        template: `<ev-container><ev-header>top</ev-header><ev-main>content</ev-main></ev-container>`,
      },
      { slots: {} },
    )
    expect(wrapper.find('.ev-container').classes()).toContain('is-vertical')
  })

  it('自动检测：仅 EvAside/Main → horizontal', () => {
    const wrapper = mount({
      ...LAYOUT,
      template: `<ev-container><ev-aside/><ev-main/></ev-container>`,
    })
    expect(wrapper.find('.ev-container').classes()).not.toContain('is-vertical')
  })

  it('Header/Footer 高度、Aside 宽度透传 + 原生标签', () => {
    const header = mount(EvHeader, { props: { height: '80px' } })
    expect(header.element.tagName).toBe('HEADER')
    expect(header.attributes('style')).toContain('height: 80px')
    const aside = mount(EvAside, { props: { width: '240px' } })
    expect(aside.element.tagName).toBe('ASIDE')
    expect(aside.attributes('style')).toContain('width: 240px')
    const footer = mount(EvFooter)
    expect(footer.element.tagName).toBe('FOOTER')
    const main = mount(EvMain)
    expect(main.element.tagName).toBe('MAIN')
  })
})

describe('EvRow / EvCol', () => {
  it('Row 双 class + justify/align 修饰类', () => {
    const wrapper = mount(EvRow, { props: { justify: 'center', align: 'middle' }, slots: { default: 'x' } })
    expect(wrapper.classes()).toContain('ev-row')
    expect(wrapper.classes()).toContain('ev-row')
    expect(wrapper.classes()).toContain('is-justify-center')
    expect(wrapper.classes()).toContain('is-align-middle')
  })

  it('gutter 负 margin + 列 padding', () => {
    const wrapper = mount(
      {
        components: { EvRow, EvCol },
        template: `<ev-row :gutter="20"><ev-col :span="12">a</ev-col></ev-row>`,
      },
    )
    expect(wrapper.find('.ev-row').attributes('style')).toContain('margin-left: -10px')
    const col = wrapper.find('.ev-col')
    expect(col.attributes('style')).toContain('padding-left: 10px')
    expect(col.classes()).toContain('ev-col-12')
  })

  it('Col span/offset/push/pull 类', () => {
    const wrapper = mount(EvCol, { props: { span: 8, offset: 2, push: 1, pull: 0 } })
    expect(wrapper.classes()).toContain('ev-col-8')
    expect(wrapper.classes()).toContain('ev-col-offset-2')
    expect(wrapper.classes()).toContain('ev-col-push-1')
  })

  it('Col 响应式对象（md: {span, offset}）', () => {
    const wrapper = mount(EvCol, { props: { md: { span: 12, offset: 3 } } })
    expect(wrapper.classes()).toContain('ev-col-md-12')
    expect(wrapper.classes()).toContain('ev-col-md-offset-3')
  })

  it('Col 响应式数字（lg: 6）', () => {
    expect(mount(EvCol, { props: { lg: 6 } }).classes()).toContain('ev-col-lg-6')
  })

  it('自定义 tag', () => {
    expect(mount(EvRow, { props: { tag: 'ul' } }).element.tagName).toBe('UL')
    expect(mount(EvCol, { props: { tag: 'li' } }).element.tagName).toBe('LI')
  })
})

describe('EvSpace', () => {
  it('双 class + item 包装', () => {
    const wrapper = mount(EvSpace, { slots: { default: '<a>1</a><b>2</b>' } })
    expect(wrapper.classes()).toContain('ev-space')
    expect(wrapper.classes()).toContain('ev-space')
    expect(wrapper.classes()).toContain('ev-space--horizontal')
    expect(wrapper.findAll('.ev-space__item')).toHaveLength(2)
  })

  it('direction/wrap/alignment', () => {
    const wrapper = mount(EvSpace, {
      props: { direction: 'vertical', wrap: true, alignment: 'center' },
      slots: { default: '<a>1</a>' },
    })
    expect(wrapper.classes()).toContain('ev-space--vertical')
    expect(wrapper.classes()).toContain('is-wrap')
    expect(wrapper.attributes('style')).toContain('align-items: center')
  })

  it('size 枚举与数字映射为 gap 变量', () => {
    const s = mount(EvSpace, { props: { size: 'large' }, slots: { default: 'x' } })
    expect(s.attributes('style')).toContain('--ev-space-gap-x: 16px')
    const n = mount(EvSpace, { props: { size: 24 }, slots: { default: 'x' } })
    expect(n.attributes('style')).toContain('--ev-space-gap-x: 24px')
  })

  it('size 数组 [x, y]', () => {
    const wrapper = mount(EvSpace, { props: { size: [10, 20] }, slots: { default: 'x' } })
    expect(wrapper.attributes('style')).toContain('--ev-space-gap-x: 10px')
    expect(wrapper.attributes('style')).toContain('--ev-space-gap-y: 20px')
  })

  it('fill 撑满', () => {
    const wrapper = mount(EvSpace, { props: { fill: true }, slots: { default: 'x' } })
    expect(wrapper.classes()).toContain('is-fill')
  })
})

describe('EvScrollbar', () => {
  it('双 class + wrap/view 结构', () => {
    const wrapper = mount(EvScrollbar, { props: { height: '200px' }, slots: { default: '内容' } })
    expect(wrapper.classes()).toContain('ev-scrollbar')
    expect(wrapper.classes()).toContain('ev-scrollbar')
    expect(wrapper.find('.ev-scrollbar__wrap').exists()).toBe(true)
    expect(wrapper.find('.ev-scrollbar__view').text()).toBe('内容')
    expect(wrapper.find('.ev-scrollbar__wrap').attributes('style')).toContain('height: 200px')
    expect(wrapper.find('.ev-scrollbar__bar.is-horizontal').exists()).toBe(true)
    expect(wrapper.find('.ev-scrollbar__bar.is-vertical').exists()).toBe(true)
  })

  it('maxHeight 透传', () => {
    const wrapper = mount(EvScrollbar, { props: { maxHeight: '100px' } })
    expect(wrapper.find('.ev-scrollbar__wrap').attributes('style')).toContain('max-height: 100px')
  })

  it('native 模式隐藏自绘 bar', () => {
    const wrapper = mount(EvScrollbar, { props: { native: true } })
    expect(wrapper.find('.ev-scrollbar__bar').exists()).toBe(false)
  })

  it('scroll 事件 + thumb 几何换算', async () => {
    const wrapper = mount(EvScrollbar, { props: { height: '100px' }, slots: { default: 'x' }, attachTo: document.body })
    const wrap = wrapper.find('.ev-scrollbar__wrap')
    // jsdom 无真实布局：手动设置 scroll 状态
    Object.defineProperty(wrap.element, 'scrollTop', { value: 50, configurable: true })
    Object.defineProperty(wrap.element, 'scrollHeight', { value: 300, configurable: true })
    Object.defineProperty(wrap.element, 'clientHeight', { value: 100, configurable: true })
    await wrap.trigger('scroll')
    expect(wrapper.emitted('scroll')[0][0].scrollTop).toBe(50)
    const thumb = wrapper.find('.ev-scrollbar__bar.is-vertical .ev-scrollbar__thumb')
    // thumb 高 = 100/300*100 ≈ 33.33px；translateY = 50/200*(100-33.3) ≈ 16.67px
    expect(thumb.attributes('style')).toContain('height: 33.33')
    expect(thumb.attributes('style')).toContain('translateY(16.66')
    wrapper.unmount()
  })

  it('expose setScrollTop/scrollTo/update', () => {
    const wrapper = mount(EvScrollbar, { attachTo: document.body })
    expect(typeof wrapper.vm.setScrollTop).toBe('function')
    expect(() => wrapper.vm.update()).not.toThrow()
    expect(() => wrapper.vm.scrollTo({ top: 10 })).not.toThrow()
    wrapper.unmount()
  })
})

describe('EvStack', () => {
  it('双 class + variant/direction 修饰类 + item 渲染', () => {
    const wrapper = mount(EvStack, {
      props: { items: ['a', 'b', 'c'], direction: 'top' },
    })
    expect(wrapper.classes()).toContain('ev-stack')
    expect(wrapper.classes()).toContain('ev-stack--card')
    expect(wrapper.classes()).toContain('ev-stack--dir-top')
    expect(wrapper.findAll('.ev-stack__item')).toHaveLength(3)
    expect(wrapper.findAll('.ev-stack__card')).toHaveLength(3)
  })

  it('circular 变体渲染圆形 + img', () => {
    const wrapper = mount(EvStack, {
      props: { items: [{ src: 'x.png' }, 'b'], variant: 'circular' },
    })
    expect(wrapper.findAll('.ev-stack__circle')).toHaveLength(2)
    expect(wrapper.find('.ev-stack__circle img').attributes('src')).toBe('x.png')
    expect(wrapper.findAll('.ev-stack__text')).toHaveLength(1)
  })

  it('顶卡点击 cycle：emit cycle + 动画后重排', async () => {
    const wrapper = mount(EvStack, { props: { items: [1, 2, 3], duration: 30 }, attachTo: document.body })
    await wrapper.findAll('.ev-stack__item')[0].trigger('click')
    const emitted = wrapper.findComponent(EvStack).emitted('cycle')
    expect(emitted).toHaveLength(1)
    expect(emitted[0][0]).toBe(1)
    expect(emitted[0][1]).toBe(2)
    // 等 leave(0.6*30=18ms) + enter(0.7*30=21ms)
    await new Promise((r) => setTimeout(r, 80))
    const items = wrapper.vm.items
    expect(items.map((i) => i.data)).toEqual([2, 3, 1])
    wrapper.unmount()
  })

  it('clickMode=remove：emit remove + 移除顶卡', async () => {
    const wrapper = mount(EvStack, { props: { items: [1, 2], clickMode: 'remove', duration: 30 }, attachTo: document.body })
    await wrapper.findAll('.ev-stack__item')[0].trigger('click')
    expect(wrapper.findComponent(EvStack).emitted('remove')).toHaveLength(1)
    await new Promise((r) => setTimeout(r, 60))
    expect(wrapper.vm.items.map((i) => i.data)).toEqual([2])
    wrapper.unmount()
  })

  it('hoverPeel：非顶卡点击提升到顶（promote）', async () => {
    const wrapper = mount(EvStack, { props: { items: [1, 2, 3], hoverPeel: true, duration: 20 }, attachTo: document.body })
    await wrapper.findAll('.ev-stack__item')[2].trigger('click')
    const emitted = wrapper.findComponent(EvStack).emitted('promote')
    expect(emitted).toHaveLength(1)
    expect(emitted[0][0]).toBe(3)
    await nextTick()
    expect(wrapper.vm.items.map((i) => i.data)).toEqual([3, 1, 2])
    wrapper.unmount()
  })

  it('expose cycle/remove 直接调用', async () => {
    const wrapper = mount(EvStack, { props: { items: [1, 2], duration: 20 }, attachTo: document.body })
    expect(typeof wrapper.vm.cycle).toBe('function')
    wrapper.vm.remove()
    expect(wrapper.findComponent(EvStack).emitted('remove')).toHaveLength(1)
    await new Promise((r) => setTimeout(r, 60))
    expect(wrapper.vm.items).toHaveLength(1)
    wrapper.unmount()
  })

  it('item 插槽自定义渲染', () => {
    const wrapper = mount(EvStack, {
      props: { items: ['x'] },
      slots: { item: '<template #item="{item}"><b class="custom">{{item}}</b></template>' },
    })
    expect(wrapper.find('.custom').text()).toBe('x')
  })
})
