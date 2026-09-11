import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EbStatCard from '../src/components/stat-card/index.vue'
import EbStatRow from '../src/components/stat-row/index.vue'
import EbPageHeader from '../src/components/page-header/index.vue'
import EbSectionCard from '../src/components/section-card/index.vue'
import EbAppToolbar from '../src/components/app-toolbar/index.vue'
import EbAppLayout from '../src/components/app-layout/index.vue'

describe('EbStatCard', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      // 立即完成一帧并到终值：模拟 progress=1
      cb(performance.now() + 99999)
      return 1
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('结构：icon/label/value（countUp 完成后千分位）', async () => {
    const wrapper = mount(EbStatCard, { props: { label: '用户数', value: 1234, icon: 'user' } })
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('.eb-stat-card').exists()).toBe(true)
    expect(wrapper.find('.eb-stat-card__icon').classes()).toContain('eb-stat-card__icon--primary')
    expect(wrapper.find('.eb-stat-card__label').text()).toBe('用户数')
    expect(wrapper.find('.eb-stat-card__value').text()).toContain('1,234')
  })

  it('type 语义色', () => {
    const wrapper = mount(EbStatCard, { props: { label: 'x', value: 1, type: 'danger', icon: 'user' } })
    expect(wrapper.find('.eb-stat-card__icon').classes()).toContain('eb-stat-card__icon--danger')
  })

  it('无 icon 时不渲染图标块', () => {
    const wrapper = mount(EbStatCard, { props: { label: 'x', value: 1 } })
    expect(wrapper.find('.eb-stat-card__icon').exists()).toBe(false)
  })

  it('countUp 结束后显示 toLocaleString 终值', async () => {
    const wrapper = mount(EbStatCard, { props: { label: 'x', value: 9876 } })
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))
    expect(wrapper.find('.eb-stat-card__value').text()).toContain('9,876')
  })

  it('countUp=false 直接显示原始值（蓝本语义：初始不格式化）', () => {
    const wrapper = mount(EbStatCard, { props: { label: 'x', value: 5000, countUp: false } })
    expect(wrapper.find('.eb-stat-card__value').text()).toContain('5000')
  })

  it('非数字 value 原样显示', () => {
    const wrapper = mount(EbStatCard, { props: { label: 'x', value: 'N/A', countUp: false } })
    expect(wrapper.find('.eb-stat-card__value').text()).toContain('N/A')
  })

  it('trend 上/下行类 + 百分比', () => {
    const up = mount(EbStatCard, { props: { label: 'x', value: 1, trend: 12.5 } })
    expect(up.find('.eb-stat-card__trend').classes()).toContain('eb-stat-card__trend--up')
    expect(up.find('.eb-stat-card__trend').text()).toContain('12.5%')
    const down = mount(EbStatCard, { props: { label: 'x', value: 1, trend: -3 } })
    expect(down.find('.eb-stat-card__trend').classes()).toContain('eb-stat-card__trend--down')
  })

  it('suffix 后缀', () => {
    const wrapper = mount(EbStatCard, { props: { label: 'x', value: 60, suffix: '%', countUp: false } })
    expect(wrapper.find('.eb-stat-card__suffix').text()).toBe('%')
  })
})

describe('EbStatRow', () => {
  it('批量渲染 stat-card + cols 类', () => {
    const wrapper = mount(EbStatRow, {
      props: {
        cols: 3,
        items: [
          { label: 'A', value: 1, icon: 'user', type: 'success', trend: 2 },
          { label: 'B', value: 2 },
          { label: 'C', value: 3 },
        ],
      },
    })
    expect(wrapper.find('.eb-stat-row').classes()).toContain('eb-stat-row--cols-3')
    expect(wrapper.findAll('.eb-stat-card')).toHaveLength(3)
    const icons = wrapper.findAll('.eb-stat-card__icon')
    expect(icons[0].classes()).toContain('eb-stat-card__icon--success')
  })

  it('默认 4 列', () => {
    expect(mount(EbStatRow, { props: { items: [] } }).classes()).toContain('eb-stat-row--cols-4')
  })
})

describe('EbPageHeader', () => {
  it('标题/副标题 + actions 插槽', () => {
    const wrapper = mount(EbPageHeader, {
      props: { title: '订单管理', subtitle: '共 128 条' },
      slots: { actions: '<button class="act">新建</button>' },
    })
    expect(wrapper.find('h2').text()).toBe('订单管理')
    expect(wrapper.find('p').text()).toBe('共 128 条')
    expect(wrapper.find('.act').text()).toBe('新建')
  })

  it('无 actions 插槽不渲染操作区', () => {
    expect(mount(EbPageHeader, { props: { title: 't' } }).find('.eb-page-header__actions').exists()).toBe(false)
  })
})

describe('EbSectionCard', () => {
  it('标题头 + body', () => {
    const wrapper = mount(EbSectionCard, { props: { title: '销售概览' }, slots: { default: '<p>内容</p>' } })
    expect(wrapper.find('h3').text()).toBe('销售概览')
    expect(wrapper.find('.eb-section-card__body p').text()).toBe('内容')
  })

  it('header/extra 插槽', () => {
    const wrapper = mount(EbSectionCard, {
      slots: { header: '<b class="h">头部</b>', extra: '<span class="e">更多</span>', default: 'x' },
    })
    expect(wrapper.find('.h').text()).toBe('头部')
    expect(wrapper.find('.e').text()).toBe('更多')
  })

  it('padding=false 无内边距类', () => {
    const wrapper = mount(EbSectionCard, { props: { title: 't', padding: false } })
    expect(wrapper.find('.eb-section-card__body').classes()).toContain('eb-section-card__body--no-padding')
  })

  it('无 title/header/extra 不渲染头部', () => {
    const wrapper = mount(EbSectionCard, { slots: { default: 'x' } })
    expect(wrapper.find('.eb-section-card__header').exists()).toBe(false)
  })
})

describe('EbAppToolbar', () => {
  it('搜索框渲染 + v-model 同步', async () => {
    const wrapper = mount(EbAppToolbar, { props: { modelValue: '' } })
    const input = wrapper.find('.eb-app-toolbar__search input')
    expect(input.exists()).toBe(true)
    await input.setValue('订单')
    expect(wrapper.emitted('update:modelValue')[0][0]).toBe('订单')
  })

  it('searchable=false 隐藏搜索框', () => {
    const wrapper = mount(EbAppToolbar, { props: { searchable: false } })
    expect(wrapper.find('.eb-app-toolbar__search').exists()).toBe(false)
  })

  it('filters/actions 插槽', () => {
    const wrapper = mount(EbAppToolbar, {
      props: { searchable: false },
      slots: {
        filters: '<select class="f"><option>全部</option></select>',
        actions: '<button class="a">导出</button>',
      },
    })
    expect(wrapper.find('.f').exists()).toBe(true)
    expect(wrapper.find('.a').text()).toBe('导出')
  })
})

describe('EbAppLayout', () => {
  const mountLayout = (props = {}) =>
    mount(
      {
        components: { EbAppLayout },
        template: `
          <eb-app-layout v-bind="props">
            <template #menu><div class="menu-slot">菜单</div></template>
            <p class="page">页面内容</p>
          </eb-app-layout>
        `,
        setup() {
          return { props }
        },
      },
      { attachTo: document.body },
    )

  it('结构：侧边栏/顶栏/内容区', () => {
    const wrapper = mountLayout()
    expect(wrapper.find('.eb-layout__sidebar').exists()).toBe(true)
    expect(wrapper.find('.eb-layout__topbar').exists()).toBe(true)
    expect(wrapper.find('.eb-layout__content .page').text()).toBe('页面内容')
    expect(wrapper.find('.eb-layout__logo-mark').text()).toBe('E')
    expect(wrapper.find('.eb-layout__logo-label').text()).toBe('Elements')
    expect(wrapper.find('.eb-layout__sidebar .menu-slot').exists()).toBe(true)
    wrapper.unmount()
  })

  it('折叠：collapsed 收窄 + logo 文字隐藏 + 折叠按钮触发 update:collapsed', async () => {
    const wrapper = mountLayout({ collapsed: true })
    expect(wrapper.find('.eb-layout__sidebar').classes()).toContain('eb-layout__sidebar--collapsed')
    expect(wrapper.find('.eb-layout__logo-label').isVisible()).toBe(false)
    await wrapper.find('.eb-layout__collapse-btn').trigger('click')
    // 事件发自内层 EbAppLayout
    expect(wrapper.findComponent(EbAppLayout).emitted('update:collapsed')).toEqual([[false]])
    wrapper.unmount()
  })

  it('默认面包屑（首页 / activeTitle）', () => {
    const wrapper = mountLayout({ activeTitle: '订单' })
    const items = wrapper.findAll('.eb-breadcrumb__inner')
    expect(items[0].text()).toContain('首页')
    expect(items[1].text()).toContain('订单')
    wrapper.unmount()
  })

  it('主题切换：顶栏图标按钮 + toggle 事件（侧栏 footer 不再有开关）', async () => {
    const wrapper = mountLayout({ isDark: true })
    const btn = wrapper.find('.eb-layout__topbar .eb-layout__theme-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toBe('切换为浅色模式')
    expect(wrapper.find('.eb-layout__sidebar-footer .eb-switch').exists()).toBe(false)
    await btn.trigger('click')
    expect(wrapper.findComponent(EbAppLayout).emitted('toggle')).toHaveLength(1)
    wrapper.unmount()
  })

  it('topbar-left/topbar-right 插槽覆盖', () => {
    const wrapper = mount(
      {
        components: { EbAppLayout },
        template: `
          <eb-app-layout>
            <template #topbar-left><span class="tl">自定义左</span></template>
            <template #topbar-right><span class="tr">自定义右</span></template>
            <template #theme-toggle><span class="tt">自定义切换</span></template>
          </eb-app-layout>
        `,
      },
      { attachTo: document.body },
    )
    expect(wrapper.find('.tl').text()).toBe('自定义左')
    expect(wrapper.find('.tr').text()).toBe('自定义右')
    expect(wrapper.find('.eb-layout__topbar .tt').text()).toBe('自定义切换')
    expect(wrapper.find('.eb-layout__theme-btn').exists()).toBe(false)
    wrapper.unmount()
  })
})
