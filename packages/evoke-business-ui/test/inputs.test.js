import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, ref, defineComponent } from 'vue'
import EvRadio from '../src/components/radio/index.vue'
import EvRadioGroup from '../src/components/radio/group.vue'
import EvRadioButton from '../src/components/radio/button.vue'
import EvCheckbox from '../src/components/checkbox/index.vue'
import EvCheckboxGroup from '../src/components/checkbox/group.vue'
import EvCheckboxButton from '../src/components/checkbox/button.vue'
import EvSwitch from '../src/components/switch-comp/index.vue'
import EvInputNumber from '../src/components/input-number/index.vue'

describe('EvRadio 家族', () => {
  it('双 class + 结构 DOM（input/inner/label）', () => {
    const wrapper = mount(EvRadio, { props: { label: 1 }, slots: { default: '选项' } })
    expect(wrapper.classes()).toContain('ev-radio')
    expect(wrapper.classes()).toContain('ev-radio')
    expect(wrapper.find('input.ev-radio__original').exists()).toBe(true)
    expect(wrapper.find('.ev-radio__inner').exists()).toBe(true)
    expect(wrapper.find('.ev-radio__label').text()).toBe('选项')
  })

  it('独立模式 v-model：checked 状态 + change', async () => {
    const wrapper = mount(EvRadio, {
      props: { modelValue: 2, label: 1 },
    })
    expect(wrapper.classes()).not.toContain('is-checked')
    await wrapper.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([1])
    expect(wrapper.emitted('change')[0]).toEqual([1])
  })

  it('group 模式：inject 共享 modelValue', async () => {
    const wrapper = mount(EvRadioGroup, {
      props: { modelValue: 'b' },
      slots: {
        default: () =>
          h('div', [
            h(EvRadio, { label: 'a' }, () => 'A'),
            h(EvRadio, { label: 'b' }, () => 'B'),
          ]),
      },
    })
    const radios = wrapper.findAllComponents(EvRadio)
    expect(radios[0].classes()).not.toContain('is-checked')
    expect(radios[1].classes()).toContain('is-checked')
    await radios[0].find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['a'])
    expect(wrapper.emitted('change')[0]).toEqual(['a'])
  })

  it('group disabled 继承', () => {
    const wrapper = mount(EvRadioGroup, {
      props: { modelValue: 'a', disabled: true },
      slots: {
        default: () => h('div', [h(EvRadio, { label: 'a' }, () => 'A')]),
      },
    })
    expect(wrapper.findComponent(EvRadio).classes()).toContain('is-disabled')
  })

  it('EvRadioButton：is-active 状态 + 双 class', async () => {
    const wrapper = mount(EvRadioGroup, {
      props: { modelValue: 'x' },
      slots: {
        default: () => h('div', [h(EvRadioButton, { label: 'x' }, () => 'X')]),
      },
    })
    const btn = wrapper.findComponent(EvRadioButton)
    expect(btn.classes()).toContain('ev-radio-button')
    expect(btn.classes()).toContain('ev-radio-button')
    expect(btn.classes()).toContain('is-active')
  })

  it('border 变体', () => {
    expect(mount(EvRadio, { props: { border: true } }).classes()).toContain('is-bordered')
  })
})

describe('EvCheckbox 家族', () => {
  it('双 class + 结构 DOM', () => {
    const wrapper = mount(EvCheckbox, { props: { label: 1 }, slots: { default: '多选' } })
    expect(wrapper.classes()).toContain('ev-checkbox')
    expect(wrapper.classes()).toContain('ev-checkbox')
    expect(wrapper.find('input.ev-checkbox__original').exists()).toBe(true)
    expect(wrapper.find('.ev-checkbox__label').text()).toBe('多选')
  })

  it('独立 boolean v-model', async () => {
    const wrapper = mount(EvCheckbox, { props: { modelValue: false } })
    expect(wrapper.classes()).not.toContain('is-checked')
    await wrapper.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])
  })

  it('true-label/false-label 值语义', async () => {
    const wrapper = mount(EvCheckbox, {
      props: { modelValue: 'yes', trueLabel: 'yes', falseLabel: 'no' },
    })
    expect(wrapper.classes()).toContain('is-checked')
    await wrapper.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['no'])
  })

  it('group 模式：数组切换（响应式 v-model）', async () => {
    const GroupHarness = defineComponent({
      setup() {
        const modelValue = ref(['a'])
        return () =>
          h(
            EvCheckboxGroup,
            {
              modelValue: modelValue.value,
              'onUpdate:modelValue': (v) => (modelValue.value = v),
            },
            () => h('div', [h(EvCheckbox, { label: 'a' }, () => 'A'), h(EvCheckbox, { label: 'b' }, () => 'B')])
          )
      },
    })
    const wrapper = mount(GroupHarness)
    const boxes = wrapper.findAllComponents(EvCheckbox)
    expect(boxes[0].classes()).toContain('is-checked')
    expect(boxes[1].classes()).not.toContain('is-checked')
    await boxes[1].find('input').trigger('change')
    await wrapper.vm.$nextTick()
    // v-model 更新后取消勾选 a
    const boxes2 = wrapper.findAllComponents(EvCheckbox)
    await boxes2[0].find('input').trigger('change')
    const events = wrapper.findComponent(EvCheckboxGroup).emitted('update:modelValue')
    expect(events[0]).toEqual([['a', 'b']])
    expect(events[1]).toEqual([['b']])
  })

  it('indeterminate 半选态', () => {
    const wrapper = mount(EvCheckbox, {
      props: { modelValue: false, indeterminate: true },
    })
    expect(wrapper.find('.ev-checkbox__input').classes()).toContain('is-indeterminate')
  })

  it('EvCheckboxButton：group 数组切换 + is-checked', async () => {
    const wrapper = mount(EvCheckboxGroup, {
      props: { modelValue: [] },
      slots: {
        default: () => h('div', [h(EvCheckboxButton, { label: 'x' }, () => 'X')]),
      },
    })
    const btn = wrapper.findComponent(EvCheckboxButton)
    expect(btn.classes()).toContain('ev-checkbox-button')
    await btn.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([['x']])
  })
})

describe('EvSwitch', () => {
  it('双 class + 结构 DOM（core/action/input）', () => {
    const wrapper = mount(EvSwitch, { props: { modelValue: true } })
    expect(wrapper.classes()).toContain('ev-switch')
    expect(wrapper.classes()).toContain('ev-switch')
    expect(wrapper.find('.ev-switch__core').exists()).toBe(true)
    expect(wrapper.find('.ev-switch__action').exists()).toBe(true)
    expect(wrapper.find('input.ev-switch__input').exists()).toBe(true)
  })

  it('checked 状态（active-value 语义）', () => {
    const on = mount(EvSwitch, { props: { modelValue: true } })
    expect(on.classes()).toContain('is-checked')
    const off = mount(EvSwitch, { props: { modelValue: false } })
    expect(off.classes()).not.toContain('is-checked')
  })

  it('自定义 active-value/inactive-value', async () => {
    const wrapper = mount(EvSwitch, {
      props: { modelValue: 1, activeValue: 1, inactiveValue: 0 },
    })
    expect(wrapper.classes()).toContain('is-checked')
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([0])
  })

  it('切换触发 change；disabled 阻止', async () => {
    const wrapper = mount(EvSwitch, { props: { modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])
    expect(wrapper.emitted('change')[0]).toEqual([true])

    const disabled = mount(EvSwitch, { props: { modelValue: false, disabled: true } })
    await disabled.trigger('click')
    expect(disabled.emitted('update:modelValue')).toBeUndefined()
  })

  it('active-text/inactive-text 文本渲染', () => {
    const wrapper = mount(EvSwitch, {
      props: { modelValue: false, activeText: '开', inactiveText: '关' },
    })
    // 非 inline-prompt：文案在开关外侧两侧（labels），core 内不渲染文字
    const labels = wrapper.findAll('.ev-switch__label')
    expect(labels.length).toBe(2)
    expect(labels[0].text()).toBe('关')
    expect(labels[1].text()).toBe('开')
  })
})

describe('EvInputNumber', () => {
  it('双 class + 结构 DOM（increase/decrease 按钮）', () => {
    const wrapper = mount(EvInputNumber, { props: { modelValue: 1 } })
    expect(wrapper.classes()).toContain('ev-input-number')
    expect(wrapper.classes()).toContain('ev-input-number')
    expect(wrapper.find('.ev-input-number__increase').exists()).toBe(true)
    expect(wrapper.find('.ev-input-number__decrease').exists()).toBe(true)
  })

  it('步进 increase/decrease 触发 update + change（响应式 v-model）', async () => {
    const NumberHarness = defineComponent({
      setup() {
        const modelValue = ref(5)
        return () =>
          h(EvInputNumber, {
            modelValue: modelValue.value,
            step: 2,
            'onUpdate:modelValue': (v) => (modelValue.value = v),
          })
      },
    })
    const wrapper = mount(NumberHarness)
    const number = wrapper.findComponent(EvInputNumber)
    await wrapper.find('.ev-input-number__increase').trigger('click')
    expect(number.emitted('update:modelValue')[0]).toEqual([7])
    expect(number.emitted('change')[0]).toEqual([7])
    await wrapper.vm.$nextTick()
    await wrapper.find('.ev-input-number__decrease').trigger('click')
    const events = number.emitted('update:modelValue')
    expect(events[events.length - 1]).toEqual([5])
  })

  it('min/max clamp', async () => {
    const wrapper = mount(EvInputNumber, { props: { modelValue: 9, max: 10, step: 2 } })
    await wrapper.find('.ev-input-number__increase').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([10])
  })

  it('precision 格式化', () => {
    const wrapper = mount(EvInputNumber, { props: { modelValue: 3.14159, precision: 2 } })
    expect(wrapper.find('input').element.value).toBe('3.14')
  })

  it('直接输入提交并 clamp', async () => {
    const wrapper = mount(EvInputNumber, { props: { modelValue: 1, max: 10 } })
    await wrapper.find('input').setValue('99')
    await wrapper.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([10])
  })

  it('controls=false 隐藏按钮', () => {
    const wrapper = mount(EvInputNumber, { props: { controls: false } })
    expect(wrapper.find('.ev-input-number__increase').exists()).toBe(false)
  })
})
