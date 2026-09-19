import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbTooltip from '../src/components/tooltip/index.vue'
import EbPopover from '../src/components/popover/index.vue'
import EbPopconfirm from '../src/components/popconfirm/index.vue'
import EbSelect from '../src/components/select/index.vue'
import EbOption from '../src/components/select/option.vue'
import EbOptionGroup from '../src/components/select/option-group.vue'

describe('EbTooltip', () => {
  it('trigger 容器渲染默认插槽', () => {
    const wrapper = mount(EbTooltip, {
      props: { content: '提示内容' },
      slots: { default: '<button>hover me</button>' },
    })
    expect(wrapper.find('.eb-popper-trigger').exists()).toBe(true)
    expect(wrapper.text()).toContain('hover me')
    wrapper.unmount()
  })

  it('hover 触发显示浮层（.eb-tooltip__popper）', async () => {
    const wrapper = mount(EbTooltip, {
      props: { content: '提示', showAfter: 0, hideAfter: 0 },
      slots: { default: '<span>t</span>' },
      attachTo: document.body,
    })
    await wrapper.find('.eb-popper-trigger').trigger('mouseenter')
    await new Promise((r) => setTimeout(r, 20))
    const popper = document.querySelector('.eb-tooltip__popper')
    expect(popper).toBeTruthy()
    expect(popper.textContent).toContain('提示')
    await wrapper.find('.eb-popper-trigger').trigger('mouseleave')
    await new Promise((r) => setTimeout(r, 20))
    wrapper.unmount()
  })

  it('effect=light 修饰类', async () => {
    const wrapper = mount(EbTooltip, {
      props: { content: 'x', effect: 'light', showAfter: 0, hideAfter: 0 },
      slots: { default: '<span>t</span>' },
      attachTo: document.body,
    })
    await wrapper.find('.eb-popper-trigger').trigger('mouseenter')
    await new Promise((r) => setTimeout(r, 20))
    expect(document.querySelector('.eb-tooltip__popper.is-light')).toBeTruthy()
    wrapper.unmount()
  })

  it('disabled 不触发', async () => {
    const wrapper = mount(EbTooltip, {
      props: { content: 'x', disabled: true, showAfter: 0, hideAfter: 0 },
      slots: { default: '<span>t</span>' },
      attachTo: document.body,
    })
    await wrapper.find('.eb-popper-trigger').trigger('mouseenter')
    await new Promise((r) => setTimeout(r, 20))
    expect(document.querySelector('.eb-tooltip__popper')).toBeNull()
    wrapper.unmount()
  })

  it('实例 show()/hide() 命令式开关浮层', async () => {
    const wrapper = mount(EbTooltip, {
      props: { content: '命令式', showAfter: 0, hideAfter: 0 },
      slots: { default: '<span>t</span>' },
      attachTo: document.body,
    })
    wrapper.vm.show()
    await new Promise((r) => setTimeout(r, 20))
    const popper = document.querySelector('.eb-tooltip__popper')
    expect(popper).toBeTruthy()
    expect(popper.textContent).toContain('命令式')
    wrapper.vm.hide()
    await new Promise((r) => setTimeout(r, 20))
    expect(document.querySelector('.eb-tooltip__popper')).toBeNull()
    wrapper.unmount()
  })
})

describe('EbPopover', () => {
  it('click 触发显示标题与内容', async () => {
    const wrapper = mount(EbPopover, {
      props: { title: '标题', content: '内容', trigger: 'click' },
      slots: { default: '<button>btn</button>' },
      attachTo: document.body,
    })
    await wrapper.find('.eb-popper-trigger').trigger('click')
    await new Promise((r) => setTimeout(r, 20))
    const popper = document.querySelector('.eb-popover')
    expect(popper).toBeTruthy()
    expect(popper.querySelector('.eb-popover__title').textContent).toBe('标题')
    expect(popper.querySelector('.eb-popover__content').textContent).toBe('内容')
    wrapper.unmount()
  })

  it('width 落到内容容器：数字补 px、字符串原样', async () => {
    const wrapper = mount(EbPopover, {
      props: { title: 't', content: 'c', trigger: 'click', width: 300 },
      slots: { default: '<button>btn</button>' },
      attachTo: document.body,
    })
    await wrapper.find('.eb-popper-trigger').trigger('click')
    await new Promise((r) => setTimeout(r, 20))
    let body = document.querySelector('.eb-popover .eb-popover__body')
    expect(body.style.width).toBe('300px')
    wrapper.unmount()

    const wrapper2 = mount(EbPopover, {
      props: { title: 't', content: 'c', trigger: 'click', width: '50%' },
      slots: { default: '<button>btn</button>' },
      attachTo: document.body,
    })
    await wrapper2.find('.eb-popper-trigger').trigger('click')
    await new Promise((r) => setTimeout(r, 20))
    body = document.querySelector('.eb-popover .eb-popover__body')
    expect(body.style.width).toBe('50%')
    wrapper2.unmount()
  })
})

describe('EbPopconfirm', () => {
  it('confirm/cancel 事件与默认按钮文案（locale）', async () => {
    const wrapper = mount(EbPopconfirm, {
      props: { title: '确认删除？' },
      slots: { default: '<button>删除</button>' },
      attachTo: document.body,
    })
    await wrapper.find('.eb-popper-trigger').trigger('click')
    await new Promise((r) => setTimeout(r, 20))
    const popper = document.querySelector('.eb-popconfirm')
    expect(popper).toBeTruthy()
    expect(popper.querySelector('.eb-popconfirm__title').textContent).toBe('确认删除？')
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
        EbSelect,
        {
          modelValue: value.value,
          'onUpdate:modelValue': (v) => (value.value = v),
          multiple: props.multiple,
          filterable: props.filterable,
          clearable: props.clearable,
          collapseTags: props.collapseTags,
        },
        () => [
          h(EbOption, { value: 'a', label: '选项A' }),
          h(EbOption, { value: 'b', label: '选项B' }),
          h(EbOption, { value: 'c', label: '禁用', disabled: true }),
        ]
      )
  },
})

describe('EbSelect', () => {
  it('双 class + 结构 DOM（wrapper/placeholder/caret）', () => {
    const wrapper = mount(EbSelect)
    expect(wrapper.classes()).toContain('eb-select')
    expect(wrapper.classes()).toContain('eb-select')
    expect(wrapper.find('.eb-select__wrapper').exists()).toBe(true)
    expect(wrapper.find('.eb-select__placeholder').exists()).toBe(true)
    expect(wrapper.find('.eb-select__caret').exists()).toBe(true)
  })

  it('placeholder 默认文案（locale）', () => {
    const wrapper = mount(EbSelect)
    expect(wrapper.find('.eb-select__placeholder').text()).toBe('请选择')
  })

  it('点击展开下拉（visible-change），选项渲染结构类', async () => {
    const wrapper = mount(EbSelect, {
      slots: {
        default: () => h('div', [
          h(EbOption, { value: 'a', label: '选项A' }),
          h(EbOption, { value: 'b', label: '选项B' }),
        ]),
      },
      attachTo: document.body,
    })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    expect(wrapper.emitted('visible-change')[0]).toEqual([true])
    const dropdown = document.querySelector('.eb-select__dropdown')
    expect(dropdown).toBeTruthy()
    const items = dropdown.querySelectorAll('.eb-select-dropdown__item')
    expect(items.length).toBe(2)
    expect(items[0].textContent).toContain('选项A')
    wrapper.unmount()
  })

  it('关闭态触发器键盘 Enter/Space/ArrowDown 打开下拉', async () => {
    for (const key of ['Enter', ' ', 'ArrowDown']) {
      const wrapper = mount(EbSelect, {
        slots: {
          default: () => h(EbOption, { value: 'a', label: '选项A' }),
        },
        attachTo: document.body,
      })
      const trigger = wrapper.find('.eb-select__wrapper')
      await trigger.trigger('keydown', { key })
      await new Promise((r) => setTimeout(r, 30))
      expect(wrapper.emitted('visible-change')[0]).toEqual([true])
      expect(document.querySelector('.eb-select__dropdown')).toBeTruthy()
      wrapper.unmount()
    }
  })

  it('单选：点击选项 emit update/change 并关闭', async () => {
    const wrapper = mount(SelectHarness, { attachTo: document.body })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const items = document.querySelectorAll('.eb-select-dropdown__item')
    items[0].click()
    await new Promise((r) => setTimeout(r, 30))
    const select = wrapper.findComponent(EbSelect)
    expect(select.emitted('update:modelValue')[0]).toEqual(['a'])
    expect(select.emitted('change')[0]).toEqual(['a'])
    // 关闭后下拉隐藏（首次展开后浮层常驻 DOM，以 display:none 隐藏，保留选项注册供回显 label）
    await new Promise((r) => setTimeout(r, 30))
    const closed = document.querySelector('.eb-select__dropdown')
    expect(closed).toBeTruthy()
    expect(closed.style.display).toBe('none')
    wrapper.unmount()
  })

  it('多选：数组切换 + tag 展示', async () => {
    const wrapper = mount(SelectHarness, {
      props: { multiple: true },
      attachTo: document.body,
    })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const items = document.querySelectorAll('.eb-select-dropdown__item')
    items[0].click()
    await new Promise((r) => setTimeout(r, 30))
    document.querySelectorAll('.eb-select-dropdown__item')[1].click()
    await new Promise((r) => setTimeout(r, 30))
    const tags = wrapper.findAll('.eb-select__tag')
    expect(tags.length).toBe(2)
    expect(tags[0].text()).toContain('选项A')
    wrapper.unmount()
  })

  it('filterable：本地过滤', async () => {
    const wrapper = mount(SelectHarness, {
      props: { filterable: true },
      attachTo: document.body,
    })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const input = wrapper.find('.eb-select__input')
    await input.setValue('选项B')
    await new Promise((r) => setTimeout(r, 30))
    const visibleItems = document.querySelectorAll('.eb-select-dropdown__item')
    expect(visibleItems.length).toBe(1)
    expect(visibleItems[0].textContent).toContain('选项B')
    wrapper.unmount()
  })

  it('禁用选项不可选（is-disabled）', async () => {
    const wrapper = mount(SelectHarness, { attachTo: document.body })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const disabled = [...document.querySelectorAll('.eb-select-dropdown__item')].find((el) =>
      el.classList.contains('is-disabled')
    )
    expect(disabled).toBeTruthy()
    disabled.click()
    await new Promise((r) => setTimeout(r, 20))
    const select = wrapper.findComponent(EbSelect)
    expect(select.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('OptionGroup 分组渲染', async () => {
    const wrapper = mount(EbSelect, {
      slots: {
        default: () =>
          h(EbOptionGroup, { label: '分组' }, () => [
            h(EbOption, { value: 1, label: '一' }),
          ]),
      },
      attachTo: document.body,
    })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await new Promise((r) => setTimeout(r, 30))
    const group = document.querySelector('.eb-select-group__title')
    expect(group?.textContent).toBe('分组')
    wrapper.unmount()
  })

  it('expose focus/blur/updateDropdown', () => {
    const wrapper = mount(EbSelect)
    expect(typeof wrapper.vm.focus).toBe('function')
    expect(typeof wrapper.vm.blur).toBe('function')
    expect(typeof wrapper.vm.updateDropdown).toBe('function')
  })
})
