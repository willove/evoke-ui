import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import EbInput from '../src/components/input/index.vue'
import EbTextarea from '../src/components/textarea/index.vue'
import EbSelect from '../src/components/select/index.vue'
import EbOption from '../src/components/select/option.vue'
import EbCascader from '../src/components/cascader/index.vue'
import EbDatePicker from '../src/components/date-picker/index.vue'
import EbTimePicker from '../src/components/time-picker/index.vue'
import EbTimeSelect from '../src/components/time-select/index.vue'
import EbInputNumber from '../src/components/input-number/index.vue'
import EbTreeSelect from '../src/components/tree-select/index.vue'
import EbAutoComplete from '../src/components/auto-complete/index.vue'
import EbForm from '../src/components/form/index.vue'
import EbFormItem from '../src/components/form/item.vue'
import { setRipple, getRipple } from '../src/utils/theme'

/**
 * 激活涟漪开关三档：组件级 :ripple="false" / Form 级批量 / 全局 setRipple
 * 注意：EbInputNumber 不做激活动效（无 ripple prop、无 eb-ripple-off 类），不在此列
 */

describe('组件级 ripple 开关', () => {
  const CASES = [
    ['EbInput', EbInput, {}, '.eb-input'],
    ['EbTextarea', EbTextarea, {}, '.eb-textarea'],
    ['EbSelect', EbSelect, { options: [{ value: 1, label: 'a' }] }, '.eb-select'],
    ['EbCascader', EbCascader, {}, '.eb-cascader'],
    ['EbDatePicker', EbDatePicker, {}, '.eb-date-editor'],
    ['EbTimePicker', EbTimePicker, {}, '.eb-time-picker'],
    ['EbTimeSelect', EbTimeSelect, {}, '.eb-time-select'],
    ['EbTreeSelect', EbTreeSelect, { data: [] }, '.eb-tree-select'],
  ]

  for (const [name, comp, props, rootSel] of CASES) {
    it(`${name}：默认无关闭类，ripple=false 时根节点带 eb-ripple-off`, async () => {
      const on = mount(comp, { props })
      expect(on.find(rootSel).classes()).not.toContain('eb-ripple-off')
      on.unmount()

      const off = mount(comp, { props: { ...props, ripple: false } })
      expect(off.find(rootSel).classes()).toContain('eb-ripple-off')
      off.unmount()
    })
  }

  it('EbInput type=textarea 分支同样生效', () => {
    const wrapper = mount(EbInput, { props: { type: 'textarea', ripple: false } })
    expect(wrapper.find('.eb-textarea').classes()).toContain('eb-ripple-off')
    wrapper.unmount()
  })

  it('EbAutoComplete 透传到内部输入框', () => {
    const wrapper = mount(EbAutoComplete, { props: { ripple: false } })
    expect(wrapper.find('.eb-input').classes()).toContain('eb-ripple-off')
    wrapper.unmount()
  })

  it('EbInputNumber 不做激活动效：无 ripple prop、无 eb-ripple-off 类', () => {
    const on = mount(EbInputNumber, { props: {} })
    expect(on.find('.eb-input-number').classes()).not.toContain('eb-ripple-off')
    on.unmount()

    // 移除 prop 后传入只落到 attrs，不应再产生关闭类
    const off = mount(EbInputNumber, { props: { ripple: false } })
    expect(off.find('.eb-input-number').classes()).not.toContain('eb-ripple-off')
    off.unmount()
  })
})

describe('Form 级批量关闭', () => {
  it('ripple=false 时表单根节点带 eb-form--ripple-off', () => {
    const off = mount(EbForm, { props: { ripple: false } })
    expect(off.classes()).toContain('eb-form--ripple-off')
    off.unmount()

    const on = mount(EbForm, { props: {} })
    expect(on.classes()).not.toContain('eb-form--ripple-off')
    on.unmount()
  })

  it('关闭态表单内的输入组件照常渲染', () => {
    const form = mount(EbForm, {
      props: { ripple: false },
      slots: { default: () => h(EbFormItem, () => h(EbInput)) },
    })
    const wrapper = form.find('.eb-input__wrapper')
    expect(wrapper.exists()).toBe(true)
    // 祖先带 eb-form--ripple-off 时，CSS 门控选择器命中其 ::before
    expect(form.classes()).toContain('eb-form--ripple-off')
    form.unmount()
  })
})

describe('全局 setRipple / getRipple', () => {
  it('关闭/开启切换 html[data-eb-ripple]', () => {
    const original = getRipple()
    setRipple(false)
    expect(getRipple()).toBe(false)
    expect(document.documentElement.getAttribute('data-eb-ripple')).toBe('off')
    setRipple(true)
    expect(getRipple()).toBe(true)
    expect(document.documentElement.getAttribute('data-eb-ripple')).toBeNull()
    // 还原进入测试前的状态
    setRipple(original)
  })
})
