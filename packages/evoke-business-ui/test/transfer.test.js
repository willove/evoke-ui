import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EbTransfer from '../src/components/transfer/index.vue'
import EbConfigProvider from '../src/components/config-provider/index.vue'
import { en } from '../src/locale'
import EbCarousel from '../src/components/carousel/index.vue'
import EbCarouselItem from '../src/components/carousel/item.vue'
import EbCascaderPanel from '../src/components/cascader-panel/index.vue'

describe('EbTransfer', () => {
  const DATA = [
    { key: 1, label: '北京' },
    { key: 2, label: '上海' },
    { key: 3, label: '广州', disabled: true },
    { key: 4, label: '深圳' },
  ]

  const mountTransfer = (props = {}) => mount(EbTransfer, { props: { data: DATA, ...props }, attachTo: document.body })

  it('双 class + 双面板 + 中间按钮', () => {
    const wrapper = mountTransfer({ modelValue: [1] })
    expect(wrapper.classes()).toContain('eb-transfer')
    expect(wrapper.classes()).toContain('eb-transfer')
    expect(wrapper.findAll('.eb-transfer-panel')).toHaveLength(2)
    expect(wrapper.findAll('.eb-transfer__btn')).toHaveLength(2)
    // 左 2/3/4，右 1
    expect(wrapper.findAll('.eb-transfer-panel')[0].findAll('.eb-transfer-panel__item')).toHaveLength(3)
    expect(wrapper.findAll('.eb-transfer-panel')[1].findAll('.eb-transfer-panel__item')).toHaveLength(1)
    wrapper.unmount()
  })

  it('标题与计数', () => {
    const wrapper = mountTransfer({ modelValue: [1], titles: ['待选', '已选'] })
    const headers = wrapper.findAll('.eb-transfer-panel__header-title')
    expect(headers[0].text()).toBe('待选')
    expect(headers[1].text()).toBe('已选')
    expect(wrapper.find('.eb-transfer-panel__header-num').text()).toBe('3')
    wrapper.unmount()
  })

  it('勾选后向右移动：update:modelValue + change(direction, movedKeys)', async () => {
    const wrapper = mountTransfer()
    const leftItems = wrapper.findAll('.eb-transfer-panel')[0].findAll('.eb-transfer-panel__item input')
    // 左面板全量顺序：北京1/上海2/广州3(禁)/深圳4
    await leftItems[1].setValue(true) // 上海
    await leftItems[3].setValue(true) // 深圳
    await wrapper.findAll('.eb-transfer__btn')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([2, 4])
    expect(wrapper.emitted('change')[0]).toEqual([[2, 4], 'right', [2, 4]])
    wrapper.unmount()
  })

  it('disabled 项不可勾选不参与移动', async () => {
    const wrapper = mountTransfer({ modelValue: [] })
    const leftPanel = wrapper.findAll('.eb-transfer-panel')[0]
    const disabledItem = leftPanel.findAll('.eb-transfer-panel__item').find((w) => w.text() === '广州')
    expect(disabledItem.classes()).toContain('is-disabled')
    const checkbox = disabledItem.find('input')
    expect(checkbox.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('向左移动移除已选项', async () => {
    const wrapper = mountTransfer({ modelValue: [1, 2] })
    const rightPanel = wrapper.findAll('.eb-transfer-panel')[1]
    await rightPanel.findAll('.eb-transfer-panel__item input')[0].setValue(true) // 1
    await wrapper.findAll('.eb-transfer__btn')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([2])
    expect(wrapper.emitted('change')[0]).toEqual([[2], 'left', [1]])
    wrapper.unmount()
  })

  it('无勾选时按钮禁用', () => {
    const wrapper = mountTransfer()
    expect(wrapper.findAll('.eb-transfer__btn')[0].classes()).toContain('is-disabled')
    wrapper.unmount()
  })

  it('filterable 过滤左右两侧', async () => {
    const wrapper = mountTransfer({ filterable: true, filterPlaceholder: '搜城市' })
    expect(wrapper.findAll('.eb-transfer-panel__filter')).toHaveLength(2)
    const leftInput = wrapper.findAll('.eb-transfer-panel')[0].find('.eb-input__inner')
    await leftInput.setValue('北')
    await nextTick()
    const items = wrapper.findAll('.eb-transfer-panel')[0].findAll('.eb-transfer-panel__item')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('北京')
    wrapper.unmount()
  })

  it('全选勾选（disabled 除外）', async () => {
    const wrapper = mountTransfer()
    const header = wrapper.findAll('.eb-transfer-panel')[0].find('.eb-transfer-panel__header input')
    await header.setValue(true)
    expect(wrapper.findAll('.eb-transfer__btn')[0].classes()).not.toContain('is-disabled')
    // 可移动的是 1/2/4（广州 disabled 被排除）
    await wrapper.findAll('.eb-transfer__btn')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([1, 2, 4])
    wrapper.unmount()
  })

  it('item 作用域插槽：两栏共用，暴露 item 与 direction', () => {
    const wrapper = mount({
      components: { EbTransfer },
      template: `
        <eb-transfer :data="data" :model-value="[1]">
          <template #item="{ item, direction }">
            <em class="slot-item">{{ direction }}:{{ item.label }}</em>
          </template>
        </eb-transfer>
      `,
      setup() {
        return { data: DATA }
      },
    }, { attachTo: document.body })
    // 左面板 2/3/4 + 右面板 1
    const items = wrapper.findAll('.slot-item')
    expect(items).toHaveLength(4)
    expect(items[0].text()).toBe('left:上海')
    expect(items[3].text()).toBe('right:北京')
    wrapper.unmount()
  })

  it('无插槽时回退渲染 label 纯文本', () => {
    const wrapper = mountTransfer({ modelValue: [1] })
    const labels = wrapper.findAll('.eb-transfer-panel__item-label')
    expect(labels).toHaveLength(4)
    expect(labels[0].text()).toBe('上海')
    wrapper.unmount()
  })

  it('disabled 整体禁用：根 class + 按钮/勾选框/搜索框联动', async () => {
    const wrapper = mountTransfer({ disabled: true, filterable: true })
    expect(wrapper.classes()).toContain('is-disabled')
    // 空勾选时按钮本就禁用，勾选框联动是重点：全部勾选框带原生 disabled
    const boxes = wrapper.findAll('.eb-checkbox__original')
    expect(boxes.length).toBeGreaterThan(0)
    for (const box of boxes) {
      expect(box.attributes('disabled')).toBeDefined()
    }
    // 搜索框禁用
    expect(wrapper.find('.eb-input__inner').attributes('disabled')).toBeDefined()
    // 勾选不生效（EbCheckbox 内部对 disabled 短路）→ 无值更新
    await wrapper.findAll('.eb-transfer-panel')[0].findAll('.eb-transfer-panel__item input')[0].setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('disabled 下已勾选的移动按钮也被禁用', () => {
    const wrapper = mountTransfer({ modelValue: [1], disabled: true })
    const btn = wrapper.findAll('.eb-transfer__btn')[1]
    expect(btn.classes()).toContain('is-disabled')
    expect(btn.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('文案经 useLocale 收口：默认中文标题/占位/空态', () => {
    const wrapper = mountTransfer({ filterable: true })
    expect(wrapper.findAll('.eb-transfer-panel__header-title')[0].text()).toBe('列表 1')
    expect(wrapper.findAll('.eb-transfer-panel__header-title')[1].text()).toBe('列表 2')
    expect(wrapper.find('.eb-input__inner').attributes('placeholder')).toBe('请输入搜索内容')
    wrapper.unmount()
    // 空数据空态
    const empty = mountTransfer({ data: [] })
    expect(empty.find('.eb-transfer-panel__empty').text()).toBe('无数据')
    empty.unmount()
  })

  it('en 语言包：默认标题与空态随 locale 翻译', () => {
    const wrapper = mount({
      components: { EbTransfer, EbConfigProvider },
      template: `
        <eb-config-provider :locale="locale">
          <eb-transfer :data="[]" />
        </eb-config-provider>
      `,
      setup() {
        return { locale: en }
      },
    })
    const titles = wrapper.findAll('.eb-transfer-panel__header-title')
    expect(titles[0].text()).toBe('List 1')
    expect(titles[1].text()).toBe('List 2')
    expect(wrapper.find('.eb-transfer-panel__empty').text()).toBe('No data')
    wrapper.unmount()
  })

  it('one-way 默认关闭：双按钮 + 右面板勾选回移可用', async () => {
    const wrapper = mountTransfer({ modelValue: [1] })
    expect(wrapper.findAll('.eb-transfer__btn')).toHaveLength(2)
    const rightPanel = wrapper.findAll('.eb-transfer-panel')[1]
    await rightPanel.findAll('.eb-transfer-panel__item input')[0].setValue(true)
    await wrapper.findAll('.eb-transfer__btn')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([])
    wrapper.unmount()
  })

  it('one-way：隐藏左移按钮与已选区勾选入口，左面板勾选不受影响', () => {
    const wrapper = mountTransfer({ modelValue: [1], oneWay: true })
    expect(wrapper.findAll('.eb-transfer__btn')).toHaveLength(1)
    const rightPanel = wrapper.findAll('.eb-transfer-panel')[1]
    // 已选项仍展示，但行内/表头勾选框均隐藏（移除入口收起）
    expect(rightPanel.findAll('.eb-transfer-panel__item')).toHaveLength(1)
    expect(rightPanel.findAll('input')).toHaveLength(0)
    expect(wrapper.findAll('.eb-transfer-panel')[0].findAll('.eb-transfer-panel__item input')).toHaveLength(3)
    wrapper.unmount()
  })

  it('one-way：向右移动仍可用', async () => {
    const wrapper = mountTransfer({ oneWay: true })
    await wrapper.findAll('.eb-transfer-panel')[0].findAll('.eb-transfer-panel__item input')[0].setValue(true)
    await wrapper.findAll('.eb-transfer__btn')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([1])
    expect(wrapper.emitted('change')[0]).toEqual([[1], 'right', [1]])
    wrapper.unmount()
  })
})

describe('EbCarousel / EbCarouselItem', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const mountCarousel = (props = {}) =>
    mount(
      {
        components: { EbCarousel, EbCarouselItem },
        template: `
          <eb-carousel v-bind="props">
            <eb-carousel-item name="a"><p>第1张</p></eb-carousel-item>
            <eb-carousel-item name="b"><p>第2张</p></eb-carousel-item>
            <eb-carousel-item name="c"><p>第3张</p></eb-carousel-item>
          </eb-carousel>
        `,
        setup() {
          return { props }
        },
      },
      { attachTo: document.body },
    )

  it('双 class + 项注册 + 首项激活', async () => {
    const wrapper = mountCarousel({ autoplay: false })
    await nextTick()
    expect(wrapper.find('.eb-carousel').classes()).toContain('eb-carousel')
    const items = wrapper.findAll('.eb-carousel__item')
    expect(items).toHaveLength(3)
    expect(items[0].classes()).toContain('is-active')
    expect(items[0].text()).toContain('第1张')
    wrapper.unmount()
  })

  it('height 透传到容器', () => {
    const wrapper = mountCarousel({ height: '200px', autoplay: false })
    expect(wrapper.find('.eb-carousel__container').attributes('style')).toContain('height: 200px')
    wrapper.unmount()
  })

  it('指示器渲染 + 点击切换 + change 事件', async () => {
    const wrapper = mountCarousel({ autoplay: false })
    await nextTick()
    const indicators = wrapper.findAll('.eb-carousel__indicator')
    expect(indicators).toHaveLength(3)
    await indicators[2].find('button').trigger('click')
    expect(wrapper.findComponent(EbCarousel).emitted('change')).toEqual([[2, 0]])
    const items = wrapper.findAll('.eb-carousel__item')
    expect(items[2].classes()).toContain('is-active')
    expect(items[0].classes()).not.toContain('is-active')
    wrapper.unmount()
  })

  it('箭头 next/prev + loop 环绕', async () => {
    const wrapper = mountCarousel({ autoplay: false })
    await nextTick()
    await wrapper.find('.eb-carousel__arrow--right').trigger('click')
    expect(wrapper.findAll('.eb-carousel__item')[1].classes()).toContain('is-active')
    // 3 → next 回绕到 0
    await wrapper.find('.eb-carousel__arrow--right').trigger('click')
    await wrapper.find('.eb-carousel__arrow--right').trigger('click')
    expect(wrapper.findAll('.eb-carousel__item')[0].classes()).toContain('is-active')
    // prev 从 0 回绕到 2
    await wrapper.find('.eb-carousel__arrow--left').trigger('click')
    expect(wrapper.findAll('.eb-carousel__item')[2].classes()).toContain('is-active')
    wrapper.unmount()
  })

  it('setActiveItem 按索引与 name 定位 + expose prev/next', async () => {
    const wrapper = mountCarousel({ autoplay: false })
    await nextTick()
    const carousel = wrapper.findComponent(EbCarousel)
    carousel.vm.setActiveItem(1)
    await nextTick()
    expect(wrapper.findAll('.eb-carousel__item')[1].classes()).toContain('is-active')
    carousel.vm.setActiveItem('c')
    await nextTick()
    expect(wrapper.findAll('.eb-carousel__item')[2].classes()).toContain('is-active')
    carousel.vm.prev()
    await nextTick()
    expect(wrapper.findAll('.eb-carousel__item')[1].classes()).toContain('is-active')
    wrapper.unmount()
  })

  it('autoplay 定时切换 + pauseOnHover 暂停', async () => {
    const wrapper = mountCarousel({ interval: 1000 })
    await nextTick()
    await vi.advanceTimersByTimeAsync(1100)
    expect(wrapper.findAll('.eb-carousel__item')[1].classes()).toContain('is-active')
    // hover 暂停
    await wrapper.find('.eb-carousel').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(3000)
    expect(wrapper.findAll('.eb-carousel__item')[1].classes()).toContain('is-active')
    wrapper.unmount()
  })

  it('autoplay=false 不启动定时器', async () => {
    const wrapper = mountCarousel({ autoplay: false })
    await nextTick()
    await vi.advanceTimersByTimeAsync(10000)
    expect(wrapper.findAll('.eb-carousel__item')[0].classes()).toContain('is-active')
    wrapper.unmount()
  })

  it('单项不渲染箭头与指示器', async () => {
    const wrapper = mount(
      {
        components: { EbCarousel, EbCarouselItem },
        template: `
          <eb-carousel :autoplay="false"><eb-carousel-item><p>唯一</p></eb-carousel-item></eb-carousel>
        `,
      },
      { attachTo: document.body },
    )
    await nextTick()
    expect(wrapper.find('.eb-carousel__arrow').exists()).toBe(false)
    expect(wrapper.find('.eb-carousel__indicators').exists()).toBe(false)
    wrapper.unmount()
  })

  it('非相邻项透明隐藏 + 位移方向', async () => {
    const wrapper = mountCarousel({ autoplay: false })
    await nextTick()
    const items = wrapper.findAll('.eb-carousel__item')
    // 第 3 项相对 active(0) diff=2 → 隐藏
    expect(items[2].attributes('style')).toContain('opacity: 0')
    expect(items[1].attributes('style')).toContain('translateX(100%)')
    wrapper.unmount()
  })
})

describe('EbCascaderPanel', () => {
  const OPTIONS = [
    {
      value: 'zhejiang',
      label: '浙江',
      children: [
        { value: 'hangzhou', label: '杭州' },
        { value: 'ningbo', label: '宁波' },
      ],
    },
    { value: 'jiangsu', label: '江苏', disabled: true },
  ]

  it('双 class + 首级菜单渲染 + border', () => {
    const wrapper = mount(EbCascaderPanel, { props: { options: OPTIONS } })
    expect(wrapper.classes()).toContain('eb-cascader-panel')
    expect(wrapper.classes()).toContain('eb-cascader-panel')
    expect(wrapper.classes()).toContain('is-bordered')
    expect(wrapper.findAll('.eb-cascader-menu')).toHaveLength(1)
    const nodes = wrapper.findAll('.eb-cascader-node')
    expect(nodes).toHaveLength(2)
    expect(nodes[1].classes()).toContain('is-disabled')
    wrapper.unmount()
  })

  it('border=false 无边框类', () => {
    expect(mount(EbCascaderPanel, { props: { options: OPTIONS, border: false } }).classes()).not.toContain('is-bordered')
  })

  it('单选：点击叶子 emit 值 + close', async () => {
    const wrapper = mount(EbCascaderPanel, { props: { options: OPTIONS } })
    await wrapper.findAll('.eb-cascader-node')[0].trigger('click') // 展开浙江
    await nextTick()
    expect(wrapper.findAll('.eb-cascader-menu')).toHaveLength(2)
    const leaf = wrapper.findAll('.eb-cascader-menu')[1].findAll('.eb-cascader-node')[0]
    await leaf.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['zhejiang', 'hangzhou'])
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('emitPath=false：值取叶 value', async () => {
    const wrapper = mount(EbCascaderPanel, { props: { options: OPTIONS, props: { emitPath: false } } })
    await wrapper.findAll('.eb-cascader-node')[0].trigger('click')
    await nextTick()
    await wrapper.findAll('.eb-cascader-menu')[1].findAll('.eb-cascader-node')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe('ningbo')
    wrapper.unmount()
  })

  it('checkStrictly 单选：任意层级可选且面板不关', async () => {
    const wrapper = mount(EbCascaderPanel, { props: { options: OPTIONS, props: { checkStrictly: true } } })
    await wrapper.findAll('.eb-cascader-node')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['zhejiang'])
    expect(wrapper.emitted('close')).toBeUndefined()
    wrapper.unmount()
  })

  it('multiple：勾选叶路径 + getCheckedNodes', async () => {
    const wrapper = mount(EbCascaderPanel, {
      props: { options: OPTIONS, props: { multiple: true }, modelValue: [] },
    })
    await wrapper.findAll('.eb-cascader-node')[0].trigger('click')
    await nextTick()
    // 勾选"杭州"（原生 change 不冒泡，需在内部 input 上触发）
    const leaf = wrapper.findAll('.eb-cascader-menu')[1].findAll('.eb-cascader-node')[0]
    await leaf.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([['zhejiang', 'hangzhou']])
    // getCheckedNodes 基于受控值
    await wrapper.setProps({ modelValue: [['zhejiang', 'hangzhou']] })
    const nodes = wrapper.vm.getCheckedNodes()
    expect(nodes).toHaveLength(1)
    expect(nodes[0].label).toBe('杭州')
    expect(nodes[0].path).toEqual(['zhejiang', 'hangzhou'])
    wrapper.unmount()
  })

  it('multiple + 父节点勾选级联全部叶', async () => {
    const wrapper = mount(EbCascaderPanel, {
      props: { options: OPTIONS, props: { multiple: true }, modelValue: [] },
    })
    await wrapper.findAll('.eb-cascader-node')[0].trigger('click')
    await nextTick()
    await wrapper.findAll('.eb-cascader-node')[0].find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([
      ['zhejiang', 'hangzhou'],
      ['zhejiang', 'ningbo'],
    ])
    wrapper.unmount()
  })

  it('expand-change 事件 + clearChecked', async () => {
    const wrapper = mount(EbCascaderPanel, {
      props: { options: OPTIONS, props: { multiple: true }, modelValue: [] },
    })
    await wrapper.findAll('.eb-cascader-node')[0].trigger('click')
    expect(wrapper.emitted('expand-change')).toBeTruthy()
    wrapper.vm.clearChecked()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    wrapper.unmount()
  })

  it('自定义字段名（props.valueKey 等）', async () => {
    const wrapper = mount(EbCascaderPanel, {
      props: {
        options: [{ id: 'a1', name: '节点A', subs: [{ id: 'a2', name: '节点B' }] }],
        props: { value: 'id', label: 'name', children: 'subs' },
      },
    })
    expect(wrapper.find('.eb-cascader-node__label').text()).toBe('节点A')
    wrapper.unmount()
  })
})
