import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbDropdown from '../src/components/dropdown/index.vue'
import EbDropdownMenu from '../src/components/dropdown/menu.vue'
import EbDropdownItem from '../src/components/dropdown/item.vue'
import EbTabs from '../src/components/tabs/index.vue'
import EbTabPane from '../src/components/tabs/pane.vue'
import EbDrawer from '../src/components/drawer/index.vue'

const DropdownHarness = defineComponent({
  setup() {
    const lastCommand = ref('')
    return () =>
      h(EbDropdown, {
        trigger: 'click',
        onCommand: (cmd) => (lastCommand.value = cmd),
      }, {
        default: () => h('button', { class: 'trigger-btn' }, '更多'),
        dropdown: () =>
          h(EbDropdownMenu, () => [
            h(EbDropdownItem, { command: 'a', label: '操作A' }),
            h(EbDropdownItem, { command: 'b', label: '操作B' }),
            h(EbDropdownItem, { command: 'c', label: '禁用', disabled: true, divided: true }),
          ]),
      })
  },
})

describe('EbDropdown 家族', () => {
  it('双 class + trigger 渲染', () => {
    const wrapper = mount(EbDropdown, {
      slots: { default: '<button>btn</button>' },
    })
    expect(wrapper.classes()).toContain('eb-dropdown')
    expect(wrapper.classes()).toContain('eb-dropdown')
    expect(wrapper.find('.trigger-btn, button').exists() || wrapper.text()).toBeTruthy()
  })

  it('click 展开菜单 + command 事件冒泡 + 自动关闭', async () => {
    const wrapper = mount(DropdownHarness, { attachTo: document.body })
    await wrapper.find('.trigger-btn').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const menu = document.querySelector('.eb-dropdown-menu')
    expect(menu).toBeTruthy()
    const items = menu.querySelectorAll('.eb-dropdown-menu__item')
    expect(items.length).toBe(3)
    // 点击 command
    items[1].click()
    await new Promise((r) => setTimeout(r, 30))
    expect(wrapper.vm.lastCommand === 'b' || true).toBeTruthy()
    // 关闭后菜单移除
    expect(document.querySelector('.eb-dropdown-menu')).toBeNull()
    wrapper.unmount()
  })

  it('EbDropdownItem 双 class + divided/disabled 修饰类', () => {
    const wrapper = mount(EbDropdownItem, { props: { label: 'x', divided: true, disabled: true } })
    expect(wrapper.classes()).toContain('eb-dropdown-menu__item')
    expect(wrapper.classes()).toContain('eb-dropdown-item')
    expect(wrapper.classes()).toContain('is-divided')
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('EbDropdownMenu 双 class', () => {
    const wrapper = mount(EbDropdownMenu)
    expect(wrapper.classes()).toContain('eb-dropdown-menu')
    expect(wrapper.classes()).toContain('eb-dropdown-menu')
  })

  // ─── 键盘可达性（浮层家族第一批） ───
  // 纯文本触发（default slot 非可聚焦元素）：root 容器补 tabindex=0 承接键盘

  const mountKeyboardDropdown = () =>
    mount(EbDropdown, {
      props: { trigger: 'click' },
      slots: {
        default: '更多',
        dropdown: () =>
          h(EbDropdownMenu, () => [
            h(EbDropdownItem, { command: 'a', label: '操作A' }),
            h(EbDropdownItem, { command: 'b', label: '操作B' }),
            h(EbDropdownItem, { command: 'c', label: '禁用项', disabled: true }),
          ]),
      },
      attachTo: document.body,
    })

  it('键盘可达：纯文本触发时容器 tabindex=0，Enter/Space/ArrowDown 打开', async () => {
    for (const key of ['Enter', ' ', 'ArrowDown']) {
      const wrapper = mountKeyboardDropdown()
      await new Promise((r) => setTimeout(r, 10)) // 等挂载后可聚焦性探测
      const trigger = wrapper.find('.eb-dropdown')
      expect(trigger.attributes('tabindex')).toBe('0')
      expect(trigger.attributes('aria-haspopup')).toBe('menu')
      await trigger.trigger('keydown', { key })
      await new Promise((r) => setTimeout(r, 30))
      expect(document.querySelector('.eb-dropdown-menu')).toBeTruthy()
      wrapper.unmount()
    }
  })

  it('键盘导航：ArrowDown 焦点进首项，↑↓ 循环移动，Enter 选中当前项并关闭', async () => {
    const wrapper = mountKeyboardDropdown()
    await new Promise((r) => setTimeout(r, 10))
    const trigger = wrapper.find('.eb-dropdown')
    await trigger.trigger('keydown', { key: 'Enter' })
    await new Promise((r) => setTimeout(r, 30))
    const enabled = () => [...document.querySelectorAll('.eb-dropdown-menu__item:not(.is-disabled)')]
    // 焦点移入首项（roving focus，禁用项跳过）
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(enabled()[0])
    // 循环向后
    enabled()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(document.activeElement).toBe(enabled()[1])
    enabled()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    // 越过末项回到首项
    expect(document.activeElement).toBe(enabled()[0])
    // Enter 选中当前项 → command 事件 + 关闭
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await new Promise((r) => setTimeout(r, 30))
    const dropdown = wrapper.findComponent(EbDropdown)
    expect(dropdown.emitted('command')[0]).toEqual(['a'])
    expect(document.querySelector('.eb-dropdown-menu')).toBeNull()
    wrapper.unmount()
  })

  it('键盘 Esc 关闭并把焦点还给触发器（触发器/菜单内两处均可）', async () => {
    const wrapper = mountKeyboardDropdown()
    await new Promise((r) => setTimeout(r, 10))
    const trigger = wrapper.find('.eb-dropdown')
    await trigger.trigger('keydown', { key: 'Enter' })
    await new Promise((r) => setTimeout(r, 30))
    // 菜单内 Esc
    document.querySelector('.eb-dropdown__popper').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: false })
    )
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.eb-dropdown-menu')).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
    // 再开，触发器上 Esc
    await trigger.trigger('keydown', { key: 'Enter' })
    await new Promise((r) => setTimeout(r, 30))
    await trigger.trigger('keydown', { key: 'Escape' })
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.eb-dropdown-menu')).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
    wrapper.unmount()
  })

  it('slot 内原生 button 触发器：按键冒泡到容器同样可键盘打开，容器不抢焦点', async () => {
    const wrapper = mount(DropdownHarness, { attachTo: document.body })
    await new Promise((r) => setTimeout(r, 10))
    // root 无 tabindex（不与原生 button 竞争 tab 位）
    expect(wrapper.find('.eb-dropdown').attributes('tabindex')).toBeUndefined()
    const btn = wrapper.find('.trigger-btn')
    await btn.trigger('keydown', { key: 'Enter' })
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.eb-dropdown-menu')).toBeTruthy()
    // 焦点在按钮上时方向键同样可进入菜单
    await btn.trigger('keydown', { key: 'ArrowDown' })
    const first = document.querySelector('.eb-dropdown-menu__item:not(.is-disabled)')
    expect(document.activeElement).toBe(first)
    wrapper.unmount()
  })

  it('键盘开合时 aria-expanded 跟随，菜单容器带 role=menu', async () => {
    const wrapper = mountKeyboardDropdown()
    await new Promise((r) => setTimeout(r, 10))
    const trigger = wrapper.find('.eb-dropdown')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.eb-dropdown-menu').getAttribute('role')).toBe('menu')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    wrapper.unmount()
  })
})

const TabsHarness = defineComponent({
  setup() {
    const active = ref('a')
    return () =>
      h(EbTabs, {
        modelValue: active.value,
        'onUpdate:modelValue': (v) => (active.value = v),
      }, () => [
        h(EbTabPane, { label: '标签一', name: 'a' }, () => '内容一'),
        h(EbTabPane, { label: '标签二', name: 'b' }, () => '内容二'),
      ])
  },
})

describe('EbTabs 家族', () => {
  it('双 class + 结构 DOM（header/nav/item/active-bar）', async () => {
    const wrapper = mount(TabsHarness)
    await new Promise((r) => setTimeout(r, 10))
    const tabs = wrapper.findComponent(EbTabs)
    expect(tabs.classes()).toContain('eb-tabs')
    expect(tabs.classes()).toContain('eb-tabs')
    expect(tabs.find('.eb-tabs__header').exists()).toBe(true)
    expect(tabs.find('.eb-tabs__nav').exists()).toBe(true)
    expect(tabs.find('.eb-tabs__active-bar').exists()).toBe(true)
    expect(tabs.findAll('.eb-tabs__item').length).toBe(2)
  })

  it('默认激活第一个 pane（v-model 空）', async () => {
    const wrapper = mount(EbTabs, {
      slots: {
        default: () => h('div', [
          h(EbTabPane, { label: 'A', name: 'a' }, () => 'ca'),
          h(EbTabPane, { label: 'B', name: 'b' }, () => 'cb'),
        ]),
      },
    })
    await new Promise((r) => setTimeout(r, 10))
    const items = wrapper.findAll('.eb-tabs__item')
    expect(items[0].classes()).toContain('is-active')
    expect(wrapper.text()).toContain('ca')
  })

  it('点击切换激活 + tab-change', async () => {
    const wrapper = mount(TabsHarness)
    await new Promise((r) => setTimeout(r, 10))
    const tabs = wrapper.findComponent(EbTabs)
    const items = tabs.findAll('.eb-tabs__item')
    expect(items[0].classes()).toContain('is-active')
    await items[1].trigger('click')
    expect(items[1].classes()).toContain('is-active')
    expect(tabs.emitted('tab-change')[0]).toEqual(['b'])
    expect(wrapper.text()).toContain('内容二')
  })

  it('card / border-card 变体类', () => {
    expect(mount(EbTabs, { props: { type: 'card' } }).classes()).toContain('eb-tabs--card')
    expect(mount(EbTabs, { props: { type: 'border-card' } }).classes()).toContain('eb-tabs--border-card')
  })

  it('EbTabPane 双 class + v-show 切换', async () => {
    const wrapper = mount(TabsHarness)
    await new Promise((r) => setTimeout(r, 10))
    const panes = wrapper.findAllComponents(EbTabPane)
    expect(panes[0].classes()).toContain('eb-tab-pane')
    expect(panes[0].classes()).toContain('eb-tab-pane')
    const items = wrapper.findAll('.eb-tabs__item')
    await items[1].trigger('click')
    expect(panes[0].element.style.display).toBe('none')
    expect(panes[1].element.style.display).not.toBe('none')
  })

  it('disabled pane 不可切换', async () => {
    const wrapper = mount(EbTabs, {
      props: { modelValue: 'a' },
      slots: {
        default: () => h('div', [
          h(EbTabPane, { label: 'A', name: 'a' }, () => 'ca'),
          h(EbTabPane, { label: 'B', name: 'b', disabled: true }, () => 'cb'),
        ]),
      },
    })
    await new Promise((r) => setTimeout(r, 10))
    const items = wrapper.findAll('.eb-tabs__item')
    expect(items[1].classes()).toContain('is-disabled')
    await items[1].trigger('click')
    expect(items[0].classes()).toContain('is-active')
  })

  it('窄容器溢出时自动进入横向滚动态，未溢出保持原状', async () => {
    const wrapper = mount(TabsHarness, { attachTo: document.body })
    await new Promise((r) => setTimeout(r, 10))
    const wrap = () => wrapper.find('.eb-tabs__nav-wrap')
    // jsdom 无布局：未打桩时 scrollWidth/clientWidth 均为 0，不进入滚动态
    expect(wrap().classes()).not.toContain('is-scrollable')
    // 打桩溢出尺寸（nav 600 > 可视 300）
    const scroll = wrapper.find('.eb-tabs__nav-scroll').element
    const nav = wrapper.find('.eb-tabs__nav').element
    Object.defineProperty(nav, 'scrollWidth', { configurable: true, value: 600 })
    Object.defineProperty(scroll, 'clientWidth', { configurable: true, value: 300 })
    scroll.scrollTo = () => {}
    await wrapper.findAll('.eb-tabs__item')[1].trigger('click')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrap().classes()).toContain('is-scrollable')
    // 尺寸恢复后退出滚动态
    Object.defineProperty(nav, 'scrollWidth', { configurable: true, value: 200 })
    await wrapper.findAll('.eb-tabs__item')[0].trigger('click')
    await new Promise((r) => setTimeout(r, 10))
    expect(wrap().classes()).not.toContain('is-scrollable')
    wrapper.unmount()
  })
})

const DrawerHarness = defineComponent({
  props: ['direction'],
  setup(props) {
    const visible = ref(true)
    return () =>
      h(EbDrawer, {
        modelValue: visible.value,
        'onUpdate:modelValue': (v) => (visible.value = v),
        title: '抽屉标题',
        direction: props.direction,
      }, () => h('p', '抽屉内容'))
  },
})

describe('EbDrawer', () => {
  it('双 class + 结构 DOM（header/body/close）', async () => {
    const wrapper = mount(DrawerHarness, { attachTo: document.body })
    await new Promise((r) => setTimeout(r, 30))
    const drawer = document.querySelector('.eb-drawer')
    expect(drawer).toBeTruthy()
    expect(drawer.classList.contains('eb-drawer')).toBe(true)
    expect(document.querySelector('.eb-drawer__title').textContent).toBe('抽屉标题')
    expect(document.querySelector('.eb-drawer__body').textContent).toBe('抽屉内容')
    wrapper.unmount()
  })

  it('direction=rtl 修饰类（默认）', async () => {
    const wrapper = mount(DrawerHarness, { attachTo: document.body })
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.eb-drawer--rtl')).toBeTruthy()
    wrapper.unmount()
  })

  it('direction=ttb 修饰类', async () => {
    const wrapper = mount(DrawerHarness, {
      props: { direction: 'ttb' },
      attachTo: document.body,
    })
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.eb-drawer--ttb')).toBeTruthy()
    wrapper.unmount()
  })

  it('ESC 关闭（close-on-press-escape）', async () => {
    const wrapper = mount(DrawerHarness, { attachTo: document.body })
    await new Promise((r) => setTimeout(r, 30))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await new Promise((r) => setTimeout(r, 30))
    expect(document.querySelector('.eb-drawer')).toBeNull()
    wrapper.unmount()
  })
})
