import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbForm from '../src/components/form/index.vue'
import EbFormItem from '../src/components/form/item.vue'
import EbInput from '../src/components/input/index.vue'

/** 表单集成 Harness：model + rules + EbForm/EbFormItem/EbInput */
function createFormHarness(model, rules, props = {}) {
  return defineComponent({
    setup() {
      const data = ref(model)
      const formRef = ref(null)
      return () =>
        h(EbForm, { model: data.value, rules, ref: formRef, ...props }, () => [
          h(EbFormItem, { label: '名称', prop: 'name' }, () =>
            h(EbInput, {
              modelValue: data.value.name,
              'onUpdate:modelValue': (v) => (data.value.name = v),
            })
          ),
        ])
    },
  })
}

describe('EbForm/EbFormItem 渲染契约', () => {
  it('form 双 class + label 位置修饰类', () => {
    const wrapper = mount(EbForm, { slots: { default: () => null } })
    expect(wrapper.classes()).toContain('eb-form')
    expect(wrapper.classes()).toContain('eb-form')
    expect(wrapper.classes()).toContain('eb-form--label-right')
    expect(mount(EbForm, { props: { labelPosition: 'top' } }).classes()).toContain('eb-form--label-top')
  })

  it('item 双 class + label/content 结构', () => {
    const wrapper = mount(EbFormItem, { props: { label: '名称', prop: 'name' } })
    expect(wrapper.classes()).toContain('eb-form-item')
    expect(wrapper.classes()).toContain('eb-form-item')
    expect(wrapper.find('.eb-form-item__label').text()).toBe('名称')
    expect(wrapper.find('.eb-form-item__content').exists()).toBe(true)
  })

  it('required 规则渲染必填星号', () => {
    const wrapper = mount(createFormHarness({ name: '' }, { name: [{ required: true, message: '必填' }] }))
    expect(wrapper.findComponent(EbFormItem).classes()).toContain('is-required')
  })

  it('inline 布局类', () => {
    const wrapper = mount(EbForm, { props: { inline: true } })
    expect(wrapper.classes()).toContain('eb-form--inline')
  })
})

describe('EbForm 校验（async-validator 集成）', () => {
  it('required 校验失败：item is-error + 错误消息 + validate reject', async () => {
    const wrapper = mount(
      createFormHarness({ name: '' }, { name: [{ required: true, message: '名称必填' }] })
    )
    const form = wrapper.findComponent(EbForm)
    await form.vm.validate().catch(() => {})
    await new Promise((r) => setTimeout(r))
    const item = wrapper.findComponent(EbFormItem)
    expect(item.classes()).toContain('is-error')
    expect(wrapper.find('.eb-form-item__error').text()).toBe('名称必填')
  })

  it('校验通过：validate resolve(true)，无错误提示', async () => {
    const wrapper = mount(
      createFormHarness({ name: 'ok' }, { name: [{ required: true, message: '名称必填' }] })
    )
    const form = wrapper.findComponent(EbForm)
    await expect(form.vm.validate()).resolves.toBe(true)
    expect(wrapper.find('.eb-form-item__error').exists()).toBe(false)
  })

  it('trigger 语义：blur 触发 blur 规则，change 触发 change 规则', async () => {
    const wrapper = mount(
      createFormHarness(
        { name: 'abc' },
        { name: [{ min: 5, message: '至少5位', trigger: 'blur' }] }
      )
    )
    const input = wrapper.findComponent(EbInput)
    // change 触发不应校验（规则 trigger 为 blur）
    await input.find('input').setValue('abc')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EbFormItem).classes()).not.toContain('is-error')
    // blur 触发校验失败
    await input.find('input').trigger('blur')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EbFormItem).classes()).toContain('is-error')
  })

  it('输入组件 change 自动触发校验并清除错误', async () => {
    const wrapper = mount(
      createFormHarness({ name: '' }, { name: [{ required: true, message: '必填', trigger: 'change' }] })
    )
    const form = wrapper.findComponent(EbForm)
    await form.vm.validate().catch(() => {})
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EbFormItem).classes()).toContain('is-error')
    // 用户输入 → change 校验通过 → 错误清除
    const input = wrapper.find('input')
    await input.setValue('新值')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EbFormItem).classes()).not.toContain('is-error')
  })

  it('resetFields 恢复初始值并清除校验', async () => {
    const wrapper = mount(
      createFormHarness({ name: '初始' }, { name: [{ required: true, message: '必填', trigger: 'change' }] })
    )
    await wrapper.find('input').setValue('')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EbFormItem).classes()).toContain('is-error')
    await wrapper.findComponent(EbForm).vm.resetFields()
    await new Promise((r) => setTimeout(r))
    expect(wrapper.find('input').element.value).toBe('初始')
    expect(wrapper.findComponent(EbFormItem).classes()).not.toContain('is-error')
  })

  it('clearValidate 清除校验状态', async () => {
    const wrapper = mount(
      createFormHarness({ name: '' }, { name: [{ required: true, message: '必填' }] })
    )
    const form = wrapper.findComponent(EbForm)
    await form.vm.validate().catch(() => {})
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EbFormItem).classes()).toContain('is-error')
    form.vm.clearValidate()
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EbFormItem).classes()).not.toContain('is-error')
  })

  it('validateField 校验指定字段', async () => {
    const wrapper = mount(
      createFormHarness({ name: '' }, { name: [{ required: true, message: '必填' }] })
    )
    const form = wrapper.findComponent(EbForm)
    await expect(form.vm.validateField('name')).rejects.toEqual({ name: '必填' })
  })

  it('FormInstance 方法齐全（validate/validateField/resetFields/clearValidate/scrollToField）', () => {
    const wrapper = mount(createFormHarness({ name: '' }, {}))
    const vm = wrapper.findComponent(EbForm).vm
    expect(typeof vm.validate).toBe('function')
    expect(typeof vm.validateField).toBe('function')
    expect(typeof vm.resetFields).toBe('function')
    expect(typeof vm.clearValidate).toBe('function')
    expect(typeof vm.scrollToField).toBe('function')
  })

  it('pattern / validator 规则格式兼容', async () => {
    const wrapper = mount(
      createFormHarness(
        { name: 'abc' },
        {
          name: [
            { pattern: /^\d+$/, message: '仅数字', trigger: 'blur' },
          ],
        }
      )
    )
    await wrapper.find('input').trigger('blur')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.find('.eb-form-item__error').text()).toBe('仅数字')
  })
})
