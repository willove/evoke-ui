import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, ref, defineComponent } from 'vue'
import EbRadio from '../src/components/radio/index.vue'
import EbRadioGroup from '../src/components/radio/group.vue'
import EbRadioButton from '../src/components/radio/button.vue'
import EbCheckbox from '../src/components/checkbox/index.vue'
import EbCheckboxGroup from '../src/components/checkbox/group.vue'
import EbCheckboxButton from '../src/components/checkbox/button.vue'
import EbSwitch from '../src/components/switch-comp/index.vue'
import EbInputNumber from '../src/components/input-number/index.vue'

describe('EbRadio 家族', () => {
  it('双 class + 结构 DOM（input/inner/label）', () => {
    const wrapper = mount(EbRadio, { props: { label: 1 }, slots: { default: '选项' } })
    expect(wrapper.classes()).toContain('eb-radio')
    expect(wrapper.classes()).toContain('eb-radio')
    expect(wrapper.find('input.eb-radio__original').exists()).toBe(true)
    expect(wrapper.find('.eb-radio__inner').exists()).toBe(true)
    expect(wrapper.find('.eb-radio__label').text()).toBe('选项')
  })

  it('独立模式 v-model：checked 状态 + change', async () => {
    const wrapper = mount(EbRadio, {
      props: { modelValue: 2, label: 1 },
    })
    expect(wrapper.classes()).not.toContain('is-checked')
    await wrapper.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([1])
    expect(wrapper.emitted('change')[0]).toEqual([1])
  })

  it('group 模式：inject 共享 modelValue', async () => {
    const wrapper = mount(EbRadioGroup, {
      props: { modelValue: 'b' },
      slots: {
        default: () =>
          h('div', [
            h(EbRadio, { label: 'a' }, () => 'A'),
            h(EbRadio, { label: 'b' }, () => 'B'),
          ]),
      },
    })
    const radios = wrapper.findAllComponents(EbRadio)
    expect(radios[0].classes()).not.toContain('is-checked')
    expect(radios[1].classes()).toContain('is-checked')
    await radios[0].find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['a'])
    expect(wrapper.emitted('change')[0]).toEqual(['a'])
  })

  it('group disabled 继承', () => {
    const wrapper = mount(EbRadioGroup, {
      props: { modelValue: 'a', disabled: true },
      slots: {
        default: () => h('div', [h(EbRadio, { label: 'a' }, () => 'A')]),
      },
    })
    expect(wrapper.findComponent(EbRadio).classes()).toContain('is-disabled')
  })

  it('EbRadioButton：is-active 状态 + 双 class', async () => {
    const wrapper = mount(EbRadioGroup, {
      props: { modelValue: 'x' },
      slots: {
        default: () => h('div', [h(EbRadioButton, { label: 'x' }, () => 'X')]),
      },
    })
    const btn = wrapper.findComponent(EbRadioButton)
    expect(btn.classes()).toContain('eb-radio-button')
    expect(btn.classes()).toContain('eb-radio-button')
    expect(btn.classes()).toContain('is-active')
  })

  it('border 变体', () => {
    expect(mount(EbRadio, { props: { border: true } }).classes()).toContain('is-bordered')
  })
})

describe('EbCheckbox 家族', () => {
  it('双 class + 结构 DOM', () => {
    const wrapper = mount(EbCheckbox, { props: { label: 1 }, slots: { default: '多选' } })
    expect(wrapper.classes()).toContain('eb-checkbox')
    expect(wrapper.classes()).toContain('eb-checkbox')
    expect(wrapper.find('input.eb-checkbox__original').exists()).toBe(true)
    expect(wrapper.find('.eb-checkbox__label').text()).toBe('多选')
  })

  it('独立 boolean v-model', async () => {
    const wrapper = mount(EbCheckbox, { props: { modelValue: false } })
    expect(wrapper.classes()).not.toContain('is-checked')
    await wrapper.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])
  })

  it('true-label/false-label 值语义', async () => {
    const wrapper = mount(EbCheckbox, {
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
            EbCheckboxGroup,
            {
              modelValue: modelValue.value,
              'onUpdate:modelValue': (v) => (modelValue.value = v),
            },
            () => h('div', [h(EbCheckbox, { label: 'a' }, () => 'A'), h(EbCheckbox, { label: 'b' }, () => 'B')])
          )
      },
    })
    const wrapper = mount(GroupHarness)
    const boxes = wrapper.findAllComponents(EbCheckbox)
    expect(boxes[0].classes()).toContain('is-checked')
    expect(boxes[1].classes()).not.toContain('is-checked')
    await boxes[1].find('input').trigger('change')
    await wrapper.vm.$nextTick()
    // v-model 更新后取消勾选 a
    const boxes2 = wrapper.findAllComponents(EbCheckbox)
    await boxes2[0].find('input').trigger('change')
    const events = wrapper.findComponent(EbCheckboxGroup).emitted('update:modelValue')
    expect(events[0]).toEqual([['a', 'b']])
    expect(events[1]).toEqual([['b']])
  })

  it('indeterminate 半选态', () => {
    const wrapper = mount(EbCheckbox, {
      props: { modelValue: false, indeterminate: true },
    })
    expect(wrapper.find('.eb-checkbox__input').classes()).toContain('is-indeterminate')
  })

  it('EbCheckboxButton：group 数组切换 + is-checked', async () => {
    const wrapper = mount(EbCheckboxGroup, {
      props: { modelValue: [] },
      slots: {
        default: () => h('div', [h(EbCheckboxButton, { label: 'x' }, () => 'X')]),
      },
    })
    const btn = wrapper.findComponent(EbCheckboxButton)
    expect(btn.classes()).toContain('eb-checkbox-button')
    await btn.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([['x']])
  })
})

describe('EbSwitch', () => {
  it('双 class + 结构 DOM（core/action/input）', () => {
    const wrapper = mount(EbSwitch, { props: { modelValue: true } })
    expect(wrapper.classes()).toContain('eb-switch')
    expect(wrapper.classes()).toContain('eb-switch')
    expect(wrapper.find('.eb-switch__core').exists()).toBe(true)
    expect(wrapper.find('.eb-switch__action').exists()).toBe(true)
    expect(wrapper.find('input.eb-switch__input').exists()).toBe(true)
  })

  it('checked 状态（active-value 语义）', () => {
    const on = mount(EbSwitch, { props: { modelValue: true } })
    expect(on.classes()).toContain('is-checked')
    const off = mount(EbSwitch, { props: { modelValue: false } })
    expect(off.classes()).not.toContain('is-checked')
  })

  it('自定义 active-value/inactive-value', async () => {
    const wrapper = mount(EbSwitch, {
      props: { modelValue: 1, activeValue: 1, inactiveValue: 0 },
    })
    expect(wrapper.classes()).toContain('is-checked')
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([0])
  })

  it('切换触发 change；disabled 阻止', async () => {
    const wrapper = mount(EbSwitch, { props: { modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])
    expect(wrapper.emitted('change')[0]).toEqual([true])

    const disabled = mount(EbSwitch, { props: { modelValue: false, disabled: true } })
    await disabled.trigger('click')
    expect(disabled.emitted('update:modelValue')).toBeUndefined()
  })

  it('active-text/inactive-text 文本渲染', () => {
    const wrapper = mount(EbSwitch, {
      props: { modelValue: false, activeText: '开', inactiveText: '关' },
    })
    // 非 inline-prompt：文案在开关外侧两侧（labels），core 内不渲染文字
    const labels = wrapper.findAll('.eb-switch__label')
    expect(labels.length).toBe(2)
    expect(labels[0].text()).toBe('关')
    expect(labels[1].text()).toBe('开')
  })
})

describe('EbInputNumber', () => {
  it('双 class + 结构 DOM（increase/decrease 按钮）', () => {
    const wrapper = mount(EbInputNumber, { props: { modelValue: 1 } })
    expect(wrapper.classes()).toContain('eb-input-number')
    expect(wrapper.classes()).toContain('eb-input-number')
    expect(wrapper.find('.eb-input-number__increase').exists()).toBe(true)
    expect(wrapper.find('.eb-input-number__decrease').exists()).toBe(true)
  })

  it('步进 increase/decrease 触发 update + change（响应式 v-model）', async () => {
    const NumberHarness = defineComponent({
      setup() {
        const modelValue = ref(5)
        return () =>
          h(EbInputNumber, {
            modelValue: modelValue.value,
            step: 2,
            'onUpdate:modelValue': (v) => (modelValue.value = v),
          })
      },
    })
    const wrapper = mount(NumberHarness)
    const number = wrapper.findComponent(EbInputNumber)
    await wrapper.find('.eb-input-number__increase').trigger('click')
    expect(number.emitted('update:modelValue')[0]).toEqual([7])
    expect(number.emitted('change')[0]).toEqual([7])
    await wrapper.vm.$nextTick()
    await wrapper.find('.eb-input-number__decrease').trigger('click')
    const events = number.emitted('update:modelValue')
    expect(events[events.length - 1]).toEqual([5])
  })

  it('min/max clamp', async () => {
    const wrapper = mount(EbInputNumber, { props: { modelValue: 9, max: 10, step: 2 } })
    await wrapper.find('.eb-input-number__increase').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([10])
  })

  it('precision 格式化', () => {
    const wrapper = mount(EbInputNumber, { props: { modelValue: 3.14159, precision: 2 } })
    expect(wrapper.find('input').element.value).toBe('3.14')
  })

  it('直接输入提交并 clamp', async () => {
    const wrapper = mount(EbInputNumber, { props: { modelValue: 1, max: 10 } })
    await wrapper.find('input').setValue('99')
    await wrapper.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([10])
  })

  it('controls=false 隐藏按钮', () => {
    const wrapper = mount(EbInputNumber, { props: { controls: false } })
    expect(wrapper.find('.eb-input-number__increase').exists()).toBe(false)
  })

  // ─── formatter / parser ───
  const fmt = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  it('无 formatter 时维持 type=number，有则切换 text + decimal', () => {
    expect(mount(EbInputNumber, { props: { modelValue: 1 } }).find('input').attributes('type')).toBe('number')
    const wrapper = mount(EbInputNumber, { props: { modelValue: 1, formatter: fmt } })
    expect(wrapper.find('input').attributes('type')).toBe('text')
    expect(wrapper.find('input').attributes('inputmode')).toBe('decimal')
    wrapper.unmount()
  })

  it('formatter 千分位展示，blur 后回显格式化值', async () => {
    const wrapper = mount(EbInputNumber, { props: { modelValue: 1234567, formatter: fmt } })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('1,234,567')
    await input.trigger('blur')
    expect(input.element.value).toBe('1,234,567')
    wrapper.unmount()
  })

  it('focus 显原始数值串，编辑提交为数值（无 parser 去逗号解析）', async () => {
    // 受控 v-model 环境驱动：提交后绑定值更新，回显才能反映新值的格式化
    const Harness = defineComponent({
      setup() {
        const val = ref(1234567)
        return () =>
          h(EbInputNumber, {
            modelValue: val.value,
            formatter: fmt,
            'onUpdate:modelValue': (v) => (val.value = v),
          })
      },
    })
    const wrapper = mount(Harness)
    const input = wrapper.find('input')
    expect(input.element.value).toBe('1,234,567')
    await input.trigger('focus')
    expect(input.element.value).toBe('1234567')
    await input.setValue('1234569')
    await input.trigger('change')
    // 提交值为数值
    expect(wrapper.findComponent(EbInputNumber).emitted('update:modelValue')[0]).toEqual([1234569])
    // blur 回显格式化值
    await input.trigger('blur')
    expect(input.element.value).toBe('1,234,569')
    wrapper.unmount()
  })

  it('parser 反解：格式化文本编辑后提交数值，聚焦保持格式化展示', async () => {
    const wrapper = mount(EbInputNumber, {
      props: {
        modelValue: 9876543,
        formatter: fmt,
        parser: (t) => Number(String(t).replace(/,/g, '')),
      },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('9,876,543')
    // 有 parser 时聚焦保持格式化展示（antd 同款）
    await input.trigger('focus')
    expect(input.element.value).toBe('9,876,543')
    await input.setValue('9,876,600')
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([9876600])
    wrapper.unmount()
  })

  // ─── addon-before / addon-after ───
  it('addon-before/after 渲染前后缀块并挂根类', () => {
    const wrapper = mount(EbInputNumber, { props: { modelValue: 1, addonBefore: '￥', addonAfter: '元' } })
    expect(wrapper.classes()).toContain('is-with-addon')
    const addons = wrapper.findAll('.eb-input-number__addon')
    expect(addons).toHaveLength(2)
    expect(addons[0].text()).toBe('￥')
    expect(addons[1].text()).toBe('元')
    wrapper.unmount()
  })

  it('addon 插槽优先于 prop，无 addon 不渲染', () => {
    const wrapper = mount({
      components: { EbInputNumber },
      template: `
        <eb-input-number :model-value="1" addon-before="￥" addon-after="元">
          <template #addon-before><b class="my-addon">USD</b></template>
        </eb-input-number>
      `,
    })
    const addons = wrapper.findAll('.eb-input-number__addon')
    expect(addons).toHaveLength(2)
    expect(addons[0].text()).toBe('USD')
    expect(addons[1].text()).toBe('元')
    wrapper.unmount()
    const plain = mount(EbInputNumber, { props: { modelValue: 1 } })
    expect(plain.find('.eb-input-number__addon').exists()).toBe(false)
    expect(plain.classes()).not.toContain('is-with-addon')
    plain.unmount()
  })
})
