import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EbSelect from '../src/components/select/index.vue'
import EbOption from '../src/components/select/option.vue'

/**
 * Select 数据模式（options）与虚拟滚动（virtual）
 * 注：jsdom 无布局引擎，滚动窗口移动类断言不可测（scrollTop 恒 0），
 * 这里锁定数据面：窗口渲染数量、选择、过滤、键盘、预选中显示。
 */

const big = Array.from({ length: 1000 }, (_, i) => ({ value: i, label: `选项 ${i}` }))

function flush(ms = 30) {
  return new Promise((r) => setTimeout(r, ms))
}

async function openSelect(wrapper) {
  await wrapper.find('.eb-select__wrapper').trigger('click')
  await flush()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EbSelect 数据模式（options）', () => {
  it('下拉按 options 渲染，点选回传 value 与 label', async () => {
    const wrapper = mount(EbSelect, {
      props: {
        options: [
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ],
        modelValue: '',
        'onUpdate:modelValue': (v) => wrapper.setProps({ modelValue: v }),
      },
      attachTo: document.body,
    })
    await openSelect(wrapper)
    const items = document.querySelectorAll('.eb-select-dropdown__item')
    expect(items.length).toBe(2)
    items[1].click()
    await flush()
    expect(wrapper.props('modelValue')).toBe('b')
    expect(wrapper.find('.eb-select__selected-item-text').text()).toBe('Beta')
    wrapper.unmount()
  })

  it('options 缺 label 时回退 String(value)', async () => {
    const wrapper = mount(EbSelect, {
      props: { options: [{ value: 7 }] },
      attachTo: document.body,
    })
    await openSelect(wrapper)
    const items = document.querySelectorAll('.eb-select-dropdown__item')
    expect(items[0].textContent.trim()).toBe('7')
    wrapper.unmount()
  })

  it('filterable 在数据模式按 label 过滤', async () => {
    const wrapper = mount(EbSelect, {
      props: {
        options: [
          { value: 'bj', label: '北京' },
          { value: 'sh', label: '上海' },
          { value: 'gz', label: '广州' },
        ],
        filterable: true,
      },
      attachTo: document.body,
    })
    await openSelect(wrapper)
    const input = wrapper.find('.eb-select__input')
    await input.setValue('京')
    await flush()
    const items = document.querySelectorAll('.eb-select-dropdown__item')
    expect(items.length).toBe(1)
    expect(items[0].textContent.trim()).toBe('北京')
    wrapper.unmount()
  })

  it('disabled 选项不可点选', async () => {
    const onChange = vi.fn()
    const wrapper = mount(EbSelect, {
      props: {
        options: [
          { value: 'a', label: 'A', disabled: true },
          { value: 'b', label: 'B' },
        ],
        onChange,
      },
      attachTo: document.body,
    })
    await openSelect(wrapper)
    document.querySelectorAll('.eb-select-dropdown__item')[0].click()
    await flush()
    expect(onChange).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('EbSelect 虚拟滚动（virtual + options）', () => {
  it('千级选项只渲染可视窗口', async () => {
    const wrapper = mount(EbSelect, {
      props: { options: big, virtual: true },
      attachTo: document.body,
    })
    await openSelect(wrapper)
    const rendered = document.querySelectorAll('.eb-select-dropdown__item').length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(50)
    wrapper.unmount()
  })

  it('窗口内点选回传正确 value', async () => {
    const wrapper = mount(EbSelect, {
      props: {
        options: big,
        virtual: true,
        modelValue: '',
        'onUpdate:modelValue': (v) => wrapper.setProps({ modelValue: v }),
      },
      attachTo: document.body,
    })
    await openSelect(wrapper)
    const items = document.querySelectorAll('.eb-select-dropdown__item')
    items[3].click()
    await flush()
    expect(wrapper.props('modelValue')).toBe(3)
    wrapper.unmount()
  })

  it('键盘 ↓ 移动高亮（activedescendant 指向已挂载选项），Enter 选中', async () => {
    const wrapper = mount(EbSelect, {
      props: {
        options: big,
        virtual: true,
        modelValue: '',
        'onUpdate:modelValue': (v) => wrapper.setProps({ modelValue: v }),
      },
      attachTo: document.body,
    })
    await openSelect(wrapper)
    await wrapper.find('.eb-select__wrapper').trigger('keydown', { key: 'ArrowDown' })
    await wrapper.find('.eb-select__wrapper').trigger('keydown', { key: 'ArrowDown' })
    await flush()
    const desc = wrapper.find('.eb-select__wrapper').attributes('aria-activedescendant')
    expect(desc).toBeTruthy()
    expect(document.getElementById(desc)?.textContent.trim()).toBe('选项 1')
    await wrapper.find('.eb-select__wrapper').trigger('keydown', { key: 'Enter' })
    await flush()
    expect(wrapper.props('modelValue')).toBe(1)
    wrapper.unmount()
  })

  it('预选中：打开后 label 正确显示且窗口内标记 is-selected', async () => {
    const wrapper = mount(EbSelect, {
      props: { options: big, virtual: true, modelValue: 2 },
      attachTo: document.body,
    })
    await openSelect(wrapper)
    expect(wrapper.find('.eb-select__selected-item-text').text()).toBe('选项 2')
    const selected = document.querySelector('.eb-select-dropdown__item.is-selected')
    expect(selected?.textContent.trim()).toBe('选项 2')
    wrapper.unmount()
  })

  it('multiple 虚拟模式多选回传数组', async () => {
    const wrapper = mount(EbSelect, {
      props: {
        options: big,
        virtual: true,
        multiple: true,
        modelValue: [],
        'onUpdate:modelValue': (v) => wrapper.setProps({ modelValue: v }),
      },
      attachTo: document.body,
    })
    await openSelect(wrapper)
    const items = document.querySelectorAll('.eb-select-dropdown__item')
    items[0].click()
    await flush()
    items[1].click()
    await flush()
    expect(wrapper.props('modelValue')).toEqual([0, 1])
    wrapper.unmount()
  })

  it('插槽模式不受影响（无 options 时走注册渲染）', async () => {
    const wrapper = mount(
      {
        components: { EbSelect, EbOption },
        template: `
          <eb-select :model-value="''">
            <eb-option value="x" label="X" />
            <eb-option value="y" label="Y" />
          </eb-select>
        `,
      },
      { attachTo: document.body }
    )
    await openSelect(wrapper)
    expect(document.querySelectorAll('.eb-select-dropdown__item').length).toBe(2)
    wrapper.unmount()
  })
})
