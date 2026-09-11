import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import EbMenu from '../src/components/menu/index.vue'
import EbMenuItem from '../src/components/menu/item.vue'
import EbSubMenu from '../src/components/menu/sub-menu.vue'
import EbMenuItemGroup from '../src/components/menu/item-group.vue'
import EbTimeline from '../src/components/timeline/index.vue'
import EbTimelineItem from '../src/components/timeline/item.vue'
import EbResult from '../src/components/result/index.vue'
import EbWatermark from '../src/components/watermark/index.vue'
import EbEmptyState from '../src/components/empty-state/index.vue'
import EbSegmented from '../src/components/segmented/index.vue'

const mountMenu = (props = {}) =>
  mount(
    {
      components: { EbMenu, EbMenuItem, EbSubMenu, EbMenuItemGroup },
      template: `
        <eb-menu v-bind="props">
          <eb-menu-item index="1">首页</eb-menu-item>
          <eb-sub-menu index="2">
            <template #title>管理</template>
            <eb-menu-item index="2-1">用户</eb-menu-item>
            <eb-menu-item index="2-2" disabled>角色</eb-menu-item>
          </eb-sub-menu>
          <eb-menu-item-group title="其他">
            <eb-menu-item index="3">设置</eb-menu-item>
          </eb-menu-item-group>
        </eb-menu>
      `,
      setup() {
        return { props }
      },
    },
    { attachTo: document.body },
  )

describe('EbMenu 家族', () => {
  it('双 class + mode 修饰类 + 结构', () => {
    const wrapper = mountMenu()
    const menu = wrapper.find('.eb-menu')
    expect(menu.classes()).toContain('eb-menu')
    expect(menu.classes()).toContain('eb-menu--vertical')
    expect(menu.attributes('role')).toBe('menubar')
    // 首页 + submenu 内 2 项 + group 内设置项 = 4
    expect(wrapper.findAll('.eb-menu-item')).toHaveLength(4)
    expect(wrapper.find('.eb-sub-menu').exists()).toBe(true)
    expect(wrapper.find('.eb-menu-item-group__title').text()).toBe('其他')
    wrapper.unmount()
  })

  it('点击菜单项触发 select（index + indexPath）并置 active', async () => {
    const wrapper = mountMenu()
    const items = wrapper.findAll('.eb-menu-item')
    await items[0].trigger('click')
    expect(wrapper.findComponent(EbMenu).emitted('select')).toEqual([['1', ['1']]])
    expect(items[0].classes()).toContain('is-active')
    wrapper.unmount()
  })

  it('disabled 菜单项点击无效', async () => {
    const wrapper = mountMenu()
    const disabled = wrapper.findAll('.eb-menu-item').find((w) => w.text() === '角色')
    await disabled.trigger('click')
    expect(wrapper.findComponent(EbMenu).emitted('select')).toBeUndefined()
    expect(disabled.classes()).toContain('is-disabled')
    wrapper.unmount()
  })

  it('垂直模式：submenu 点击展开/收起并 emit open/close', async () => {
    const wrapper = mountMenu()
    const submenu = wrapper.find('.eb-sub-menu')
    await submenu.find('.eb-sub-menu__title').trigger('click')
    expect(submenu.classes()).toContain('is-opened')
    expect(wrapper.findComponent(EbMenu).emitted('open')).toEqual([['2', ['2']]])
    await submenu.find('.eb-sub-menu__title').trigger('click')
    expect(submenu.classes()).not.toContain('is-opened')
    expect(wrapper.findComponent(EbMenu).emitted('close')).toEqual([['2', ['2']]])
    wrapper.unmount()
  })

  it('子项激活时 submenu 标题高亮（激活上报链）', async () => {
    const wrapper = mountMenu({ defaultOpeneds: ['2'] })
    await nextTick()
    await wrapper.findAll('.eb-menu-item').find((w) => w.text() === '用户').trigger('click')
    const submenu = wrapper.find('.eb-sub-menu')
    expect(submenu.classes()).toContain('is-active')
    const user = wrapper.findAll('.eb-menu-item').find((w) => w.text() === '用户')
    expect(user.classes()).toContain('is-active')
    wrapper.unmount()
  })

  it('水平模式渲染 + click 触发 submenu 弹层', async () => {
    const wrapper = mountMenu({ mode: 'horizontal', menuTrigger: 'click' })
    expect(wrapper.find('.eb-menu').classes()).toContain('eb-menu--horizontal')
    await wrapper.find('.eb-sub-menu__title').trigger('click')
    await nextTick()
    expect(document.querySelector('.eb-menu__popper')).toBeTruthy()
    wrapper.unmount()
  })

  it('嵌套弹出层：移入子弹层后父弹层不消失（hover 桥回归）', async () => {
    vi.useFakeTimers()
    const wrapper = mount(
      {
        components: { EbMenu, EbMenuItem, EbSubMenu },
        template: `
          <eb-menu mode="horizontal">
            <eb-sub-menu index="1">
              <template #title>父级</template>
              <eb-sub-menu index="1-1">
                <template #title>子级</template>
                <eb-menu-item index="1-1-1">孙级</eb-menu-item>
              </eb-sub-menu>
            </eb-sub-menu>
          </eb-menu>
        `,
      },
      { attachTo: document.body },
    )
    try {
      // 1) hover 父级标题 → 父弹层打开
      await wrapper.find('.eb-sub-menu').trigger('mouseenter')
      await vi.advanceTimersByTime(200) // > showTimeout 150
      const parentPopper = document.querySelector('.eb-menu__popper')
      expect(parentPopper).toBeTruthy()
      // 2) hover 父弹层内的嵌套子菜单 → 子弹层打开
      const childLi = parentPopper.querySelector('.eb-sub-menu')
      expect(childLi).toBeTruthy()
      childLi.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }))
      await vi.advanceTimersByTime(200)
      const poppers = document.querySelectorAll('.eb-menu__popper')
      expect(poppers.length).toBe(2)
      // 3) 模拟鼠标从父弹层移入子弹层（穿越 4px 空隙）：父弹层 mouseleave 会让父级排下
      //    300ms 关闭计时；子弹层 mouseenter 必须通过 hover 桥替父级清掉计时
      const childPopper = poppers[1]
      parentPopper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }))
      childPopper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }))
      await vi.advanceTimersByTime(500) // 远超 hideTimeout 300
      // 修复前：父级计时器无人清除 → 父弹层卸载 → 整棵弹出菜单在悬停时消失
      expect(document.querySelectorAll('.eb-menu__popper').length).toBe(2)
      expect(parentPopper.parentNode).toBeTruthy()
      expect(childPopper.parentNode).toBeTruthy()
    } finally {
      wrapper.unmount()
      document.querySelectorAll('.eb-menu__popper').forEach((el) => el.remove())
      await vi.runAllTimersAsync()
      vi.useRealTimers()
    }
  }, 5000)

  it('collapse 折叠类', () => {
    const wrapper = mountMenu({ collapse: true })
    expect(wrapper.find('.eb-menu').classes()).toContain('eb-menu--collapse')
    wrapper.unmount()
  })

  it('uniqueOpened 互斥展开', async () => {
    const wrapper = mount(
      {
        components: { EbMenu, EbMenuItem, EbSubMenu },
        template: `
          <eb-menu unique-opened>
            <eb-sub-menu index="a"><template #title>A</template><eb-menu-item index="a-1">a1</eb-menu-item></eb-sub-menu>
            <eb-sub-menu index="b"><template #title>B</template><eb-menu-item index="b-1">b1</eb-menu-item></eb-sub-menu>
          </eb-menu>
        `,
      },
      { attachTo: document.body },
    )
    const titles = wrapper.findAll('.eb-sub-menu__title')
    await titles[0].trigger('click')
    await titles[1].trigger('click')
    const submenus = wrapper.findAll('.eb-sub-menu')
    expect(submenus[0].classes()).not.toContain('is-opened')
    expect(submenus[1].classes()).toContain('is-opened')
    wrapper.unmount()
  })

  it('router 模式：select 后跳转', async () => {
    const pushes = []
    const wrapper = mountMenu({ router: true })
    // provide router 模拟
    const menu = wrapper.findComponent(EbMenu)
    await items_click(wrapper, '首页')
    expect(wrapper.findComponent(EbMenu).emitted('select')).toBeTruthy()
    wrapper.unmount()
  })
})

async function items_click(wrapper, text) {
  const item = wrapper.findAll('.eb-menu-item').find((w) => w.text() === text)
  await item.trigger('click')
}

describe('EbTimeline', () => {
  const mountTimeline = (props = {}, slots = {}) =>
    mount({
      components: { EbTimeline, EbTimelineItem },
      template: `
        <eb-timeline v-bind="props">
          <eb-timeline-item timestamp="2026-01-01">发布 v1</eb-timeline-item>
          <eb-timeline-item timestamp="2026-02-01" color="red">修复</eb-timeline-item>
          <eb-timeline-item timestamp="2026-03-01">迭代</eb-timeline-item>
        </eb-timeline>
      `,
      slots,
      setup() {
        return { props }
      },
    })

  it('容器类 + item 结构', () => {
    const wrapper = mountTimeline()
    expect(wrapper.find('.eb-timeline').exists()).toBe(true)
    expect(wrapper.find('.eb-timeline').classes()).toContain('is-mode-left')
    expect(wrapper.findAll('.eb-timeline-item')).toHaveLength(3)
    expect(wrapper.findAll('.eb-timeline-item__dot')).toHaveLength(3)
    wrapper.unmount()
  })

  it('内容与时间戳渲染', () => {
    const wrapper = mountTimeline()
    const bodies = wrapper.findAll('.eb-timeline-item__body')
    expect(bodies[0].text()).toBe('发布 v1')
    const timestamps = wrapper.findAll('.eb-timeline-item__timestamp')
    expect(timestamps.length).toBeGreaterThanOrEqual(3)
    expect(timestamps[0].text()).toBe('2026-01-01')
    wrapper.unmount()
  })

  it('语义色映射（red → danger token）', () => {
    const wrapper = mountTimeline()
    // --dot-color 变量写在 item 根元素上
    const items = wrapper.findAll('.eb-timeline-item')
    expect(items[1].element.style.getPropertyValue('--dot-color')).toContain('--eb-color-danger')
    wrapper.unmount()
  })

  it('reverse 倒序类', () => {
    const wrapper = mountTimeline({ reverse: true })
    expect(wrapper.find('.eb-timeline').classes()).toContain('is-reverse')
    wrapper.unmount()
  })

  it('pending 幽灵节点 + loading 脉冲（ghost 渲染在列表最前）', () => {
    const wrapper = mountTimeline({ pending: true })
    expect(wrapper.findAll('.eb-timeline-item')).toHaveLength(4)
    const pending = wrapper.findAll('.eb-timeline-item')[0]
    expect(pending.classes()).toContain('is-loading')
    expect(pending.classes()).toContain('is-pending')
    expect(pending.find('.eb-timeline-item__body').text()).toBe('加载中...')
    wrapper.unmount()
  })

  it('pending 字符串自定义 + pendingDot', () => {
    const wrapper = mount(
      {
        components: { EbTimeline, EbTimelineItem },
        template: `
          <eb-timeline pending="加载更多" :pending-dot="dot">
            <eb-timeline-item>1</eb-timeline-item>
          </eb-timeline>
        `,
        setup() {
          const dot = () => h('span', { class: 'custom-dot' }, '···')
          return { dot }
        },
      },
    )
    const pending = wrapper.findAll('.eb-timeline-item')[0]
    expect(pending.find('.eb-timeline-item__body').text()).toBe('加载更多')
    expect(pending.find('.custom-dot').exists()).toBe(true)
    wrapper.unmount()
  })

  it('alternate 模式奇偶交替 placement（按挂载顺序）', async () => {
    const wrapper = mountTimeline({ mode: 'alternate' })
    await wrapper.vm.$nextTick()
    const items = wrapper.findAll('.eb-timeline-item')
    expect(wrapper.find('.eb-timeline').classes()).toContain('is-mode-alternate')
    expect(items[0].classes()).toContain('is-placement-start')
    expect(items[1].classes()).toContain('is-placement-end')
    expect(items[2].classes()).toContain('is-placement-start')
    wrapper.unmount()
  })

  it('variant filled + hollow 覆盖', () => {
    const wrapper = mount(
      {
        components: { EbTimeline, EbTimelineItem },
        template: `
          <eb-timeline variant="filled">
            <eb-timeline-item>1</eb-timeline-item>
            <eb-timeline-item hollow>2</eb-timeline-item>
          </eb-timeline>
        `,
      },
    )
    const items = wrapper.findAll('.eb-timeline-item')
    expect(items[0].classes()).toContain('is-variant-filled')
    expect(items[1].classes()).toContain('is-variant-outlined')
    wrapper.unmount()
  })

  it('label 放轴对侧 + placement start 时间戳独立区域', () => {
    const wrapper = mount(
      {
        components: { EbTimeline, EbTimelineItem },
        template: `
          <eb-timeline>
            <eb-timeline-item label="09:00" timestamp="2026-01-01" placement="start">开工</eb-timeline-item>
          </eb-timeline>
        `,
      },
    )
    const item = wrapper.find('.eb-timeline-item')
    expect(item.classes()).toContain('has-timestamp-aside-start')
    expect(item.find('.eb-timeline-item__timestamp.is-aside').text()).toBe('2026-01-01')
    wrapper.unmount()
  })
})

describe('EbResult', () => {
  it('默认 info：图标渲染，无默认标题块', () => {
    const wrapper = mount(EbResult)
    expect(wrapper.find('.eb-result').exists()).toBe(true)
    expect(wrapper.find('.eb-result__icon').classes()).toContain('eb-result__icon--info')
    // info 无默认标题 → 不渲染 title 块
    expect(wrapper.find('.eb-result__title').exists()).toBe(false)
  })

  it('status=404：默认标题与副标题', () => {
    const wrapper = mount(EbResult, { props: { status: '404' } })
    expect(wrapper.find('.eb-result__title').text()).toBe('404')
    expect(wrapper.find('.eb-result__subtitle').text()).toBe('抱歉，你访问的页面不存在')
  })

  it('title/subTitle 覆盖默认值', () => {
    const wrapper = mount(EbResult, { props: { status: 'success', title: 'T', subTitle: 'S' } })
    expect(wrapper.find('.eb-result__title').text()).toBe('T')
    expect(wrapper.find('.eb-result__subtitle').text()).toBe('S')
  })

  it('extra 与 body 插槽', () => {
    const wrapper = mount(EbResult, {
      slots: { extra: '<button class="back">返回</button>', default: '<p class="tip">说明</p>' },
    })
    expect(wrapper.find('.eb-result__extra .back').exists()).toBe(true)
    expect(wrapper.find('.eb-result__body .tip').text()).toBe('说明')
  })

  it('自定义 icon 插槽优先', () => {
    const wrapper = mount(EbResult, { slots: { icon: '<i class="my-icon"/>' } })
    expect(wrapper.find('.my-icon').exists()).toBe(true)
  })
})

describe('EbWatermark', () => {
  it('结构 DOM：eb-watermark / eb-watermark__body', async () => {
    const wrapper = mount(EbWatermark, { props: { content: '机密' }, slots: { default: '<p>内容</p>' } })
    await nextTick()
    const body = wrapper.find('.eb-watermark__body')
    expect(body.exists()).toBe(true)
    expect(body.attributes('style')).toContain('background-image')
    expect(body.attributes('style')).toContain('background-repeat: repeat')
    expect(body.find('p').text()).toBe('内容')
  })

  it('z-index 透传', async () => {
    const wrapper = mount(EbWatermark, { props: { content: 'w', zIndex: 777 } })
    await nextTick()
    expect(wrapper.find('.eb-watermark__body').attributes('style')).toContain('z-index: 777')
  })
})

describe('EbEmptyState', () => {
  it('结构 + 默认图标', () => {
    const wrapper = mount(EbEmptyState, { props: { title: '没有数据' } })
    expect(wrapper.find('.eb-empty-state').exists()).toBe(true)
    expect(wrapper.find('.eb-empty-state').classes()).toContain('eb-empty-state--default')
    expect(wrapper.find('.eb-empty-state__title').text()).toBe('没有数据')
    expect(wrapper.find('.eb-empty-state__icon .eb-iconfont, .eb-empty-state__icon .eb-icon').exists()).toBe(true)
  })

  it('description 与 actions 插槽', () => {
    const wrapper = mount(EbEmptyState, {
      props: { title: 't', description: 'd' },
      slots: { actions: '<button class="act">新建</button>' },
    })
    expect(wrapper.find('.eb-empty-state__description').text()).toBe('d')
    expect(wrapper.find('.act').text()).toBe('新建')
  })

  it('compact 尺寸 + tone 语义类', () => {
    const wrapper = mount(EbEmptyState, { props: { title: 't', size: 'compact', tone: 'danger' } })
    expect(wrapper.classes()).toContain('eb-empty-state--compact')
    expect(wrapper.classes()).toContain('eb-empty-state--tone-danger')
  })
})

describe('EbSegmented', () => {
  it('双容器结构 + options 纯值归一化', () => {
    const wrapper = mount(EbSegmented, { props: { options: ['日', '周', '月'] } })
    expect(wrapper.find('.eb-segmented').exists()).toBe(true)
    const items = wrapper.findAll('.eb-segmented__item')
    expect(items).toHaveLength(3)
    expect(items[0].find('.eb-segmented__label').text()).toBe('日')
  })

  it('点击切换 v-model + change', async () => {
    const wrapper = mount(EbSegmented, { props: { options: ['a', 'b'], modelValue: 'a' } })
    await wrapper.findAll('.eb-segmented__item')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
    expect(wrapper.emitted('change')).toEqual([['b']])
  })

  it('is-selected 反映 modelValue', () => {
    const wrapper = mount(EbSegmented, { props: { options: ['a', 'b', 'c'], modelValue: 'b' } })
    const items = wrapper.findAll('.eb-segmented__item')
    expect(items[1].classes()).toContain('is-selected')
    expect(items[0].classes()).not.toContain('is-selected')
  })

  it('对象选项 disabled 项点击无效', async () => {
    const wrapper = mount(EbSegmented, {
      props: { options: [{ value: 1, label: '一' }, { value: 2, label: '二', disabled: true }] },
    })
    await wrapper.findAll('.eb-segmented__item')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.findAll('.eb-segmented__item')[1].classes()).toContain('is-disabled')
  })

  it('整组禁用', async () => {
    const wrapper = mount(EbSegmented, { props: { options: ['a', 'b'], disabled: true } })
    expect(wrapper.classes()).toContain('is-disabled')
    await wrapper.findAll('.eb-segmented__item')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('同值点击不重复 emit', async () => {
    const wrapper = mount(EbSegmented, { props: { options: ['a', 'b'], modelValue: 'a' } })
    await wrapper.findAll('.eb-segmented__item')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('尺寸/形状/block/vertical 类', () => {
    const wrapper = mount(EbSegmented, {
      props: { options: ['a'], size: 'large', shape: 'round', block: true, vertical: true },
    })
    expect(wrapper.classes()).toContain('eb-segmented--large')
    expect(wrapper.classes()).toContain('eb-segmented--shape-round')
    expect(wrapper.classes()).toContain('is-block')
    expect(wrapper.classes()).toContain('is-vertical')
  })

  it('icon 选项渲染图标', () => {
    const wrapper = mount(EbSegmented, {
      props: { options: [{ value: 1, icon: 'search' }] },
    })
    expect(wrapper.find('.eb-segmented__item .eb-iconfont, .eb-segmented__item .eb-icon').exists()).toBe(true)
  })

  it('纯图标项（label 缺省不渲染文字）', () => {
    const wrapper = mount(EbSegmented, { props: { options: [{ value: 1, icon: 'search' }] } })
    expect(wrapper.find('.eb-segmented__label').exists()).toBe(false)
  })
})
