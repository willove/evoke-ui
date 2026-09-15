import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import EbTabs from '../src/components/tabs/index.vue'
import EbTabPane from '../src/components/tabs/pane.vue'
import EbSelect from '../src/components/select/index.vue'
import EbOption from '../src/components/select/option.vue'
import EbDropdown from '../src/components/dropdown/index.vue'
import EbDropdownMenu from '../src/components/dropdown/menu.vue'
import EbDropdownItem from '../src/components/dropdown/item.vue'
import EbTable from '../src/components/table/index.vue'
import EbTableColumn from '../src/components/table/column.vue'
import { useFocusTrap } from '../src/composables/useFocusTrap'

const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms))

// ─── EbTabs 键盘导航 ───

const TabsHarness = defineComponent({
  setup() {
    return () =>
      h(EbTabs, { modelValue: 'a' }, () => [
        h(EbTabPane, { label: 'A', name: 'a' }),
        h(EbTabPane, { label: 'B', name: 'b', disabled: true }),
        h(EbTabPane, { label: 'C', name: 'c' }),
      ])
  },
})

const pressKey = (el, key) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))

describe('EbTabs 键盘导航（回归：此前仅 Enter 可用）', () => {
  it('ArrowRight 激活下一可用页签并移动焦点（跳过禁用项）', async () => {
    const wrapper = mount(TabsHarness, { attachTo: document.body })
    await nextTick() // 页签头由 pane 注册后重渲染
    const items = () => document.querySelectorAll('.eb-tabs__item')
    items()[0].focus()
    pressKey(items()[0], 'ArrowRight')
    await nextTick()
    // b 被禁用 → 直接落到 c
    expect(document.activeElement).toBe(items()[2])
    expect(items()[2].classList.contains('is-active')).toBe(true)
    expect(wrapper.findComponent(EbTabs).emitted('update:modelValue')[0]).toEqual(['c'])
    wrapper.unmount()
  })

  it('ArrowLeft 反向 + 循环回绕', async () => {
    const wrapper = mount(TabsHarness, { attachTo: document.body })
    await nextTick()
    const items = () => document.querySelectorAll('.eb-tabs__item')
    // 从 a 向左 → 回绕到末尾可用项 c
    items()[0].focus()
    pressKey(items()[0], 'ArrowLeft')
    await nextTick()
    expect(items()[2].classList.contains('is-active')).toBe(true)
    // 再向左 → 跳过禁用的 b 回到 a
    pressKey(items()[0], 'ArrowLeft')
    await nextTick()
    expect(items()[0].classList.contains('is-active')).toBe(true)
    wrapper.unmount()
  })

  it('Home/End 跳首末可用页签', async () => {
    const wrapper = mount(TabsHarness, { attachTo: document.body })
    await nextTick()
    const items = () => document.querySelectorAll('.eb-tabs__item')
    items()[0].focus()
    pressKey(items()[0], 'End')
    await nextTick()
    expect(items()[2].classList.contains('is-active')).toBe(true)
    pressKey(items()[2], 'Home')
    await nextTick()
    expect(items()[0].classList.contains('is-active')).toBe(true)
    wrapper.unmount()
  })
})

// ─── EbSelect combobox / listbox 语义 ───

// selectedValues 从 modelValue 派生，选中断言须走真实 v-model
const SelectHarness = defineComponent({
  setup() {
    const val = ref('')
    return () =>
      h(EbSelect, {
        modelValue: val.value,
        'onUpdate:modelValue': (v) => (val.value = v),
      }, () => [
        h(EbOption, { value: 'a', label: '选项A' }),
        h(EbOption, { value: 'b', label: '选项B' }),
      ])
  },
})

describe('EbSelect combobox 语义', () => {
  it('触发器 combobox + aria-expanded/haspopup，展开同步', async () => {
    const wrapper = mount(EbSelect, {
      slots: {
        default: () => [
          h(EbOption, { value: 'a', label: '选项A' }),
          h(EbOption, { value: 'b', label: '选项B' }),
        ],
      },
      attachTo: document.body,
    })
    const box = wrapper.find('.eb-select__wrapper')
    expect(box.attributes('role')).toBe('combobox')
    expect(box.attributes('aria-haspopup')).toBe('listbox')
    expect(box.attributes('aria-expanded')).toBe('false')
    await box.trigger('click')
    await wait()
    expect(wrapper.find('.eb-select__wrapper').attributes('aria-expanded')).toBe('true')
    wrapper.unmount()
  })

  it('activedescendant：键盘高亮项 id 同步 + aria-controls + 打开焦点保持', async () => {
    const wrapper = mount(SelectHarness, { attachTo: document.body })
    const box = () => wrapper.find('.eb-select__wrapper')
    expect(box().attributes('tabindex')).toBe('0')
    await box().trigger('click')
    await wait()
    // 非过滤模式焦点保持在 combobox 触发器上
    expect(document.activeElement).toBe(box().element)
    // aria-controls 指向 listbox
    const list = document.querySelector('.eb-select-dropdown__list')
    expect(list.id).toBeTruthy()
    expect(box().attributes('aria-controls')).toBe(list.id)
    // 方向键走 document 全局监听，is-hovering 项 id 同步到 aria-activedescendant
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    await nextTick()
    const first = list.querySelectorAll('.eb-select-dropdown__item')[0]
    expect(first.classList.contains('is-hovering')).toBe(true)
    expect(box().attributes('aria-activedescendant')).toBe(first.id)
    wrapper.unmount()
  })

  it('打开时定位已选项：activedescendant 直接指向已选 option', async () => {
    const wrapper = mount(SelectHarness, { attachTo: document.body })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await wait()
    document.querySelectorAll('.eb-select-dropdown__item')[1].click()
    await wait()
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await wait()
    const second = document.querySelectorAll('.eb-select-dropdown__item')[1]
    expect(second.classList.contains('is-hovering')).toBe(true)
    expect(wrapper.find('.eb-select__wrapper').attributes('aria-activedescendant')).toBe(second.id)
    wrapper.unmount()
  })

  it('选项列表 listbox + 选项 option/aria-selected', async () => {
    const wrapper = mount(SelectHarness, { attachTo: document.body })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await wait()
    const list = document.querySelector('.eb-select-dropdown__list')
    expect(list.getAttribute('role')).toBe('listbox')
    const items = list.querySelectorAll('.eb-select-dropdown__item')
    expect(items[0].getAttribute('role')).toBe('option')
    expect(items[0].getAttribute('aria-selected')).toBe('false')
    items[1].click()
    await wait()
    // 关闭后选项常驻 DOM（回显 label 用），aria-selected 同步已选值
    expect(document.querySelectorAll('.eb-select-dropdown__item')[1].getAttribute('aria-selected')).toBe('true')
    wrapper.unmount()
  })
})

// ─── EbDropdown 触发器 aria ───

describe('EbDropdown 触发器 aria', () => {
  it('fallback 触发器 aria-haspopup=menu，aria-expanded 跟随展开', async () => {
    const wrapper = mount(EbDropdown, {
      props: { trigger: 'click' },
      slots: {
        dropdown: () => h(EbDropdownMenu, () => [h(EbDropdownItem, { command: 'a', label: '操作A' })]),
      },
      attachTo: document.body,
    })
    const trigger = wrapper.find('.eb-dropdown__trigger-inner')
    expect(trigger.attributes('aria-haspopup')).toBe('menu')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('click')
    await wait()
    expect(wrapper.find('.eb-dropdown__trigger-inner').attributes('aria-expanded')).toBe('true')
    wrapper.unmount()
  })
})

// ─── useFocusTrap（dialog/drawer/msgbox/action-sheet 的圈闭核心） ───

const FocusHost = defineComponent({
  emits: ['esc'],
  setup(_, { expose, emit }) {
    const box = ref(null)
    const trap = useFocusTrap(box, { onEscape: () => emit('esc') })
    expose({ box, trap })
    return () =>
      h('div', { ref: box, tabindex: '-1', class: 'trap-box' }, [
        h('button', { class: 'b1', type: 'button' }, '一'),
        h('button', { class: 'b2', type: 'button' }, '二'),
      ])
  },
})

// jsdom 无布局、offsetParent 恒 null，焦点圈闭按可见过滤会拿空列表——桩化可见性
const stubVisible = (wrapper) => {
  for (const b of wrapper.findAll('button')) {
    Object.defineProperty(b.element, 'offsetParent', { get: () => document.body, configurable: true })
  }
}

const raf = () => new Promise((r) => requestAnimationFrame(() => r()))
const tab = (shift = false) =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift }))

describe('useFocusTrap', () => {
  it('activate 后初始焦点落到首个可聚焦元素', async () => {
    const wrapper = mount(FocusHost, { attachTo: document.body })
    stubVisible(wrapper)
    wrapper.vm.trap.activate()
    await raf()
    expect(document.activeElement.classList.contains('b1')).toBe(true)
    wrapper.vm.trap.deactivate()
    wrapper.unmount()
  })

  it('Tab 在容器内循环圈禁（末尾回首个）', async () => {
    const wrapper = mount(FocusHost, { attachTo: document.body })
    stubVisible(wrapper)
    wrapper.vm.trap.activate()
    await raf()
    wrapper.find('.b2').element.focus()
    tab()
    expect(document.activeElement.classList.contains('b1')).toBe(true)
    wrapper.vm.trap.deactivate()
    wrapper.unmount()
  })

  it('Shift+Tab 从首元素回绕到末元素', async () => {
    const wrapper = mount(FocusHost, { attachTo: document.body })
    stubVisible(wrapper)
    wrapper.vm.trap.activate()
    await raf()
    wrapper.find('.b1').element.focus()
    tab(true)
    expect(document.activeElement.classList.contains('b2')).toBe(true)
    wrapper.vm.trap.deactivate()
    wrapper.unmount()
  })

  it('焦点在容器外时 Tab 拉回圈禁首元素', async () => {
    const wrapper = mount(FocusHost, { attachTo: document.body })
    stubVisible(wrapper)
    wrapper.vm.trap.activate()
    await raf()
    document.body.focus()
    tab()
    expect(document.activeElement.classList.contains('b1')).toBe(true)
    wrapper.vm.trap.deactivate()
    wrapper.unmount()
  })

  it('deactivate 归还焦点到激活前元素', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()
    const wrapper = mount(FocusHost, { attachTo: document.body })
    stubVisible(wrapper)
    wrapper.vm.trap.activate()
    await raf()
    expect(document.activeElement).not.toBe(outside)
    wrapper.vm.trap.deactivate()
    expect(document.activeElement).toBe(outside)
    outside.remove()
    wrapper.unmount()
  })

  it('Esc 触发 onEscape 回调（escapeDeactivates 默认 true）', async () => {
    const wrapper = mount(FocusHost, { attachTo: document.body })
    stubVisible(wrapper)
    wrapper.vm.trap.activate()
    await raf()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('esc')).toHaveLength(1)
    wrapper.vm.trap.deactivate()
    wrapper.unmount()
  })
})

// ─── EbTable 行级键盘导航 ───

const tableRows = [
  { id: 1, name: '苹果' },
  { id: 2, name: '香蕉' },
  { id: 3, name: '橙子' },
]

const mountKeyboardTable = () =>
  mount(EbTable, {
    props: { data: tableRows },
    slots: {
      default: () => h('div', [h(EbTableColumn, { prop: 'name', label: '名称' })]),
    },
    attachTo: document.body,
  })

describe('EbTable 行级键盘导航', () => {
  const flush = () => new Promise((r) => setTimeout(r, 10))
  const dataRows = (w) => w.findAll('tbody tr[data-row-index]')

  it('roving tabindex：首行 0 其余 -1，focusin 同步焦点位', async () => {
    const wrapper = mountKeyboardTable()
    await flush()
    const rows = dataRows(wrapper)
    expect(rows.length).toBe(3)
    expect(rows[0].attributes('tabindex')).toBe('0')
    expect(rows[1].attributes('tabindex')).toBe('-1')
    rows[2].element.focus()
    await nextTick()
    expect(rows[0].attributes('tabindex')).toBe('-1')
    expect(rows[2].attributes('tabindex')).toBe('0')
    wrapper.unmount()
  })

  it('ArrowDown/ArrowUp 移动行焦点', async () => {
    const wrapper = mountKeyboardTable()
    await flush()
    const rows = dataRows(wrapper)
    rows[0].element.focus()
    rows[0].element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(rows[1].element)
    rows[1].element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(rows[0].element)
    wrapper.unmount()
  })

  it('Home/End 跳首末行', async () => {
    const wrapper = mountKeyboardTable()
    await flush()
    const rows = dataRows(wrapper)
    rows[0].element.focus()
    rows[0].element.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(rows[2].element)
    rows[2].element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    await nextTick()
    expect(document.activeElement).toBe(rows[0].element)
    wrapper.unmount()
  })

  it('Enter/Space 等价点击：emit row-click 同载荷', async () => {
    const wrapper = mountKeyboardTable()
    await flush()
    const rows = dataRows(wrapper)
    rows[1].element.focus()
    rows[1].element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    rows[1].element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    await nextTick()
    const emitted = wrapper.findComponent(EbTable).emitted('row-click')
    expect(emitted.length).toBe(2)
    expect(emitted[0][0]).toEqual(tableRows[1])
    expect(emitted[0][1]).toBe(1)
    wrapper.unmount()
  })

  it('数据缩减后焦点位回钳到首行', async () => {
    const wrapper = mountKeyboardTable()
    await flush()
    dataRows(wrapper)[2].element.focus()
    await nextTick()
    await wrapper.setProps({ data: tableRows.slice(0, 1) })
    await flush()
    const rows = dataRows(wrapper)
    expect(rows.length).toBe(1)
    expect(rows[0].attributes('tabindex')).toBe('0')
    wrapper.unmount()
  })
})
