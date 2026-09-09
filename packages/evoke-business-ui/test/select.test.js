import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EvTooltip from '../src/components/tooltip/index.vue'
import EvPopover from '../src/components/popover/index.vue'
import EvPopconfirm from '../src/components/popconfirm/index.vue'
import EvSelect from '../src/components/select/index.vue'
import EvOption from '../src/components/select/option.vue'
import EvOptionGroup from '../src/components/select/option-group.vue'

describe('EvTooltip', () => {
  it('trigger 容器渲染默认插槽', () => {
    const wrapper = mount(EvTooltip, {
      props: { content: '提示内容' },
      slots: { default: '<button>hover me</button>' },
    })
    expect(wrapper.find('.ev-popper-trigger').exists()).toBe(true)
    expect(wrapper.text()).toContain('hover me')
    wrapper.unmount()
  })

  it('hover 触发显示浮层（.ev-tooltip__popper）', async () => {
    const wrapper = mount(EvTooltip, {
      props: { content: '提示', showAfter: 0, hideAfter: 0 },
      slots: { default: '<span>t</span>' },
      attachTo: document.body,
    })
    await wrapper.find('.ev-popper-trigger').trigger('mouseenter')
    await new Promise((r) => setTimeout(r, 20))
    const popper = document.querySelector('.ev-tooltip__popper')
    expect(popper).toBeTruthy()
    expect(popper.textContent).toContain('提示')
    await wrapper.find('.ev-popper-trigger').trigger('mouseleave')
    await new Promise((r) => setTimeout(r, 20))
    wrapper.unmount()
  })

  it('effect=light 修饰类', async () => {
    const wrapper = mount(EvTooltip, {
      props: { content: 'x', effect: 'light', showAfter: 0, hideAfter: 0 },
      slots: { default: '<span>t</span>' },
      attachTo: document.body,
    })
    await wrapper.find('.ev-popper-trigger').trigger('mouseenter')
    await new Promise((r) => setTimeout(r, 20))
    expect(document.querySelector('.ev-tooltip__popper.is-light')).toBeTruthy()
    wrapper.unmount()
  })

  it('disabled 不触发', async () => {
    const wrapper = mount(EvTooltip, {
      props: { content: 'x', disabled: true, showAfter: 0, hideAfter: 0 },
      slots: { default: '<span>t</span>' },
      attachTo: document.body,
    })
    await wrapper.find('.ev-popper-trigger').trigger('mouseenter')
    await new Promise((r) => setTimeout(r, 20))
    expect(document.querySelector('.ev-tooltip__popper')).toBeNull()
    wrapper.unmount()
  })
})

describe('EvPopover', () => {
  it('click 触发显示标题与内容', async () => {
    const wrapper = mount(EvPopover, {
      props: { title: '标题', content: '内容', trigger: 'click' },
      slots: { default: '<button>btn</button>' },
      attachTo: document.body,
    })
    await wrapper.find('.ev-popper-trigger').trigger('click')
    await new Promise((r) => setTimeout(r, 20))
    const popper = document.querySelector('.ev-popover')
    expect(popper).toBeTruthy()
    expect(popper.querySelector('.ev-popover__title').textContent).toBe('标题')
    expect(popper.querySelector('.ev-popover__content').textContent).toBe('内容')
    wrapper.unmount()
  })
})

describe('EvPopconfirm', () => {
  it('confirm/cancel 事件与默认按钮文案（locale）', async () => {
    const wrapper = mount(EvPopconfirm, {
      props: { title: '确认删除？' },
      slots: { default: '<button>删除</button>' },
      attachTo: document.body,
    })
    await wrapper.find('.ev-popper-trigger').trigger('click')
    await new Promise((r) => setTimeout(r, 20))
    const popper = document.querySelector('.ev-popconfirm')
    expect(popper).toBeTruthy()
    expect(popper.querySelector('.ev-popconfirm__title').textContent).toBe('确认删除？')
    const btns = popper.querySelectorAll('button')
    expect(btns[0].textContent.trim()).toBe('取消')
    expect(btns[1].textContent.trim()).toBe('确定')
    // confirm 事件
    btns[1].click()
    await new Promise((r) => setTimeout(r, 20))
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    wrapper.unmount()
  })
})

const SelectHarness = defineComponent({
  props: ['multiple', 'filterable', 'clearable', 'collapseTags'],
  setup(props, { slots }) {
    const value = ref(props.multiple ? [] : '')
    return () =>
      h(
        EvSelect,
        {
          modelValue: value.value,
          'onUpdate:modelValue': (v) => (value.value = v),
          multiple: props.multiple,
          filterable: props.filterable,
          clearable: props.clearable,
          collapseTags: props.collapseTags,
        },
        () => [
          h(EvOption, { value: 'a', label: '选项A' }),
          h(EvOption, { value: 'b', label: '选项B' }),
          h(EvOption, { value: 'c', label: '禁用', disabled: true }),
        ]
      )
  },
})

describe('EvSelect', () => {
  it('双 class + 结构 DOM（wrapper/placeholder/caret）', () => {
    const wrapper = mount(EvSelect)
    expect(wrapper.classes()).toContain('ev-select')
    expect(wrapper.classes()).toContain('ev-select')
    expect(wrapper.find('.ev-select__wrapper').exists()).toBe(true)
    expect(wrapper.find('.ev-select__placeholder').exists()).toBe(true)
    expect(wrapper.find('.ev-select__caret').exists()).toBe(true)
  })

  it('placeholder 默认文案（locale）', () => {
    const wrapper = mount(EvSelect)
    expect(wrapper.find('.ev-select__placeholder').text()).toBe('请选择')
  })

  it('点击展开下拉（visible-change），选项渲染结构类', async () => {
    const wrapper = mount(EvSelect, {
      slots: {
        default: () => h('div', [
          h(EvOption, { value: 'a', label: '选项A' }),
          h(EvOption, { value: 'b', label: '选项B' }),
        ]),
      },
      attachTo: document.body,
    })
    await wrapper.find('.ev-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    expect(wrapper.emitted('visible-change')[0]).toEqual([true])
    const dropdown = document.querySelector('.ev-select__dropdown')
    expect(dropdown).toBeTruthy()
    const items = dropdown.querySelectorAll('.ev-select-dropdown__item')
    expect(items.length).toBe(2)
    expect(items[0].textContent).toContain('选项A')
    wrapper.unmount()
  })

  it('单选：点击选项 emit update/change 并关闭', async () => {
    const wrapper = mount(SelectHarness, { attachTo: document.body })
    await wrapper.find('.ev-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const items = document.querySelectorAll('.ev-select-dropdown__item')
    items[0].click()
    await new Promise((r) => setTimeout(r, 30))
    const select = wrapper.findComponent(EvSelect)
    expect(select.emitted('update:modelValue')[0]).toEqual(['a'])
    expect(select.emitted('change')[0]).toEqual(['a'])
    // 关闭后下拉隐藏（首次展开后浮层常驻 DOM，以 display:none 隐藏，保留选项注册供回显 label）
    await new Promise((r) => setTimeout(r, 30))
    const closed = document.querySelector('.ev-select__dropdown')
    expect(closed).toBeTruthy()
    expect(closed.style.display).toBe('none')
    wrapper.unmount()
  })

  it('多选：数组切换 + tag 展示', async () => {
    const wrapper = mount(SelectHarness, {
      props: { multiple: true },
      attachTo: document.body,
    })
    await wrapper.find('.ev-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const items = document.querySelectorAll('.ev-select-dropdown__item')
    items[0].click()
    await new Promise((r) => setTimeout(r, 30))
    document.querySelectorAll('.ev-select-dropdown__item')[1].click()
    await new Promise((r) => setTimeout(r, 30))
    const tags = wrapper.findAll('.ev-select__tag')
    expect(tags.length).toBe(2)
    expect(tags[0].text()).toContain('选项A')
    wrapper.unmount()
  })

  it('filterable：本地过滤', async () => {
    const wrapper = mount(SelectHarness, {
      props: { filterable: true },
      attachTo: document.body,
    })
    await wrapper.find('.ev-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const input = wrapper.find('.ev-select__input')
    await input.setValue('选项B')
    await new Promise((r) => setTimeout(r, 30))
    const visibleItems = document.querySelectorAll('.ev-select-dropdown__item')
    expect(visibleItems.length).toBe(1)
    expect(visibleItems[0].textContent).toContain('选项B')
    wrapper.unmount()
  })

  it('禁用选项不可选（is-disabled）', async () => {
    const wrapper = mount(SelectHarness, { attachTo: document.body })
    await wrapper.find('.ev-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const disabled = [...document.querySelectorAll('.ev-select-dropdown__item')].find((el) =>
      el.classList.contains('is-disabled')
    )
    expect(disabled).toBeTruthy()
    disabled.click()
    await new Promise((r) => setTimeout(r, 20))
    const select = wrapper.findComponent(EvSelect)
    expect(select.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('OptionGroup 分组渲染', async () => {
    const wrapper = mount(EvSelect, {
      slots: {
        default: () =>
          h(EvOptionGroup, { label: '分组' }, () => [
            h(EvOption, { value: 1, label: '一' }),
          ]),
      },
      attachTo: document.body,
    })
    await wrapper.find('.ev-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const group = document.querySelector('.ev-select-group__title')
    expect(group?.textContent).toBe('分组')
    wrapper.unmount()
  })

  it('expose focus/blur/updateDropdown', () => {
    const wrapper = mount(EvSelect)
    expect(typeof wrapper.vm.focus).toBe('function')
    expect(typeof wrapper.vm.blur).toBe('function')
    expect(typeof wrapper.vm.updateDropdown).toBe('function')
  })
})
