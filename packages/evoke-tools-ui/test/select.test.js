import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, computed, provide } from 'vue'
import EtSelect, { mapDensityToSelectSize } from '../src/components/select/index.vue'
import EbSelect from '@wil-works/evoke-business-ui/select'
import EbOption from '../../evoke-business-ui/src/components/select/option.vue'
import { ET_DENSITY_KEY } from '../src/composables/useDensity'

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

/** 在指定密度档下挂载 EtSelect；以 computed ref 模拟 EtProvider 的注入形态 */
function mountAtDensity(density, selectProps = {}, slots = { default: () => [h(EbOption, { value: 'a', label: 'A' })] }) {
  const Wrap = defineComponent({
    setup(_, { slots: s }) {
      provide(ET_DENSITY_KEY, computed(() => density))
      return () => h(EtSelect, selectProps, s.default)
    },
  })
  return mount(Wrap, { slots, attachTo: document.body })
}

describe('mapDensityToSelectSize（纯函数）', () => {
  it('三档映射到底座合法 size', () => {
    expect(mapDensityToSelectSize('compact')).toBe('small')
    expect(mapDensityToSelectSize('default')).toBe('')
    expect(mapDensityToSelectSize('relaxed')).toBe('large')
  })
  it('未识别档位回落默认空串', () => {
    expect(mapDensityToSelectSize('whatever')).toBe('')
    expect(mapDensityToSelectSize(undefined)).toBe('')
  })
})

describe('EtSelect', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('作用域类 et-select + 底座结构', () => {
    const wrapper = mount(EtSelect)
    expect(wrapper.find('.et-select').exists()).toBe(true)
    expect(wrapper.find('.eb-select__wrapper').exists()).toBe(true)
    expect(wrapper.find('.eb-select__placeholder').exists()).toBe(true)
    wrapper.unmount()
  })

  it('默认档（无 provider）：不加 size 修饰类', () => {
    const wrapper = mount(EtSelect, {
      slots: { default: () => h(EbOption, { value: 'a', label: 'A' }) },
    })
    const root = wrapper.find('.eb-select').classes()
    expect(root).not.toContain('eb-select--small')
    expect(root).not.toContain('eb-select--large')
    wrapper.unmount()
  })

  it('密度 compact → 底座 eb-select--small', () => {
    const wrapper = mountAtDensity('compact')
    expect(wrapper.find('.eb-select').classes()).toContain('eb-select--small')
    wrapper.unmount()
  })

  it('密度 relaxed → 底座 eb-select--large', () => {
    const wrapper = mountAtDensity('relaxed')
    expect(wrapper.find('.eb-select').classes()).toContain('eb-select--large')
    wrapper.unmount()
  })

  it('显式 size 优先于密度档', () => {
    const wrapper = mountAtDensity('compact', { size: 'large' })
    const cls = wrapper.find('.eb-select').classes()
    expect(cls).toContain('eb-select--large')
    expect(cls).not.toContain('eb-select--small')
    wrapper.unmount()
  })

  it('v-model + change：点击选项 emit update/change', async () => {
    const Harness = defineComponent({
      setup() {
        const value = ref('')
        return () =>
          h(EtSelect, {
            modelValue: value.value,
            'onUpdate:modelValue': (v) => (value.value = v),
          }, () => [
            h(EbOption, { value: 'a', label: '选项A' }),
            h(EbOption, { value: 'b', label: '选项B' }),
          ])
      },
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await tick()
    document.querySelectorAll('.eb-select-dropdown__item')[0].click()
    await tick()
    const sel = wrapper.findComponent(EtSelect)
    expect(sel.emitted('update:modelValue')[0]).toEqual(['a'])
    expect(sel.emitted('change')[0]).toEqual(['a'])
    wrapper.unmount()
  })

  it('change/visible-change/clear 事件转发', async () => {
    const Harness = defineComponent({
      setup() {
        const value = ref([])
        return () =>
          h(EtSelect, {
            modelValue: value.value,
            'onUpdate:modelValue': (v) => (value.value = v),
            multiple: true,
            clearable: true,
          }, () => [
            h(EbOption, { value: 'a', label: '选项A' }),
            h(EbOption, { value: 'b', label: '选项B' }),
          ])
      },
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    // 展开 → visible-change
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await tick()
    const sel = wrapper.findComponent(EtSelect)
    expect(sel.emitted('visible-change')[0]).toEqual([true])
    // 选中两个 → change
    document.querySelectorAll('.eb-select-dropdown__item')[0].click()
    document.querySelectorAll('.eb-select-dropdown__item')[1].click()
    await tick()
    expect(sel.emitted('change').length).toBe(2)
    // 清空 → clear + update:modelValue 回落 []
    await wrapper.find('.eb-select__clear').trigger('click')
    await tick()
    expect(sel.emitted('clear')).toBeTruthy()
    const last = sel.emitted('update:modelValue')
    expect(last[last.length - 1][0]).toEqual([])
    wrapper.unmount()
  })

  it('数据模式 options 透传：下拉渲染选项', async () => {
    const wrapper = mount(EtSelect, {
      props: { options: [{ value: 1, label: '甲' }, { value: 2, label: '乙' }] },
      attachTo: document.body,
    })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await tick()
    const items = [...document.querySelectorAll('.eb-select-dropdown__item')]
    expect(items.length).toBe(2)
    expect(items[0].textContent).toContain('甲')
    wrapper.unmount()
  })

  it('插槽模式透传 + popup-render 具名插槽转发', async () => {
    const wrapper = mount(EtSelect, {
      slots: {
        default: () => h(EbOption, { value: 'a', label: '选项A' }),
        'popup-render': () => h('button', { class: 'popup-add' }, '+ 新增'),
      },
      attachTo: document.body,
    })
    await wrapper.find('.eb-select__wrapper').trigger('click')
    await tick()
    const footer = document.querySelector('.eb-select-dropdown__footer')
    expect(footer).toBeTruthy()
    expect(footer.querySelector('.popup-add')).toBeTruthy()
    wrapper.unmount()
  })

  it('命令式转发底座 focus / updateDropdown', () => {
    const wrapper = mount(EtSelect)
    expect(typeof wrapper.vm.focus).toBe('function')
    expect(typeof wrapper.vm.updateDropdown).toBe('function')
    wrapper.unmount()
  })
})
