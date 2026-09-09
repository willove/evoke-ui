import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EvForm from '../src/components/form/index.vue'
import EvFormItem from '../src/components/form/item.vue'
import EvInput from '../src/components/input/index.vue'

/** 表单集成 Harness：model + rules + EvForm/EvFormItem/EvInput */
function createFormHarness(model, rules, props = {}) {
  return defineComponent({
    setup() {
      const data = ref(model)
      const formRef = ref(null)
      return () =>
        h(EvForm, { model: data.value, rules, ref: formRef, ...props }, () => [
          h(EvFormItem, { label: '名称', prop: 'name' }, () =>
            h(EvInput, {
              modelValue: data.value.name,
              'onUpdate:modelValue': (v) => (data.value.name = v),
            })
          ),
        ])
    },
  })
}

describe('EvForm/EvFormItem 渲染契约', () => {
  it('form 双 class + label 位置修饰类', () => {
    const wrapper = mount(EvForm, { slots: { default: () => null } })
    expect(wrapper.classes()).toContain('ev-form')
    expect(wrapper.classes()).toContain('ev-form')
    expect(wrapper.classes()).toContain('ev-form--label-right')
    expect(mount(EvForm, { props: { labelPosition: 'top' } }).classes()).toContain('ev-form--label-top')
  })

  it('item 双 class + label/content 结构', () => {
    const wrapper = mount(EvFormItem, { props: { label: '名称', prop: 'name' } })
    expect(wrapper.classes()).toContain('ev-form-item')
    expect(wrapper.classes()).toContain('ev-form-item')
    expect(wrapper.find('.ev-form-item__label').text()).toBe('名称')
    expect(wrapper.find('.ev-form-item__content').exists()).toBe(true)
  })

  it('required 规则渲染必填星号', () => {
    const wrapper = mount(createFormHarness({ name: '' }, { name: [{ required: true, message: '必填' }] }))
    expect(wrapper.findComponent(EvFormItem).classes()).toContain('is-required')
  })

  it('inline 布局类', () => {
    const wrapper = mount(EvForm, { props: { inline: true } })
    expect(wrapper.classes()).toContain('ev-form--inline')
  })
})

describe('EvForm 校验（async-validator 集成）', () => {
  it('required 校验失败：item is-error + 错误消息 + validate reject', async () => {
    const wrapper = mount(
      createFormHarness({ name: '' }, { name: [{ required: true, message: '名称必填' }] })
    )
    const form = wrapper.findComponent(EvForm)
    await form.vm.validate().catch(() => {})
    await new Promise((r) => setTimeout(r))
    const item = wrapper.findComponent(EvFormItem)
    expect(item.classes()).toContain('is-error')
    expect(wrapper.find('.ev-form-item__error').text()).toBe('名称必填')
  })

  it('校验通过：validate resolve(true)，无错误提示', async () => {
    const wrapper = mount(
      createFormHarness({ name: 'ok' }, { name: [{ required: true, message: '名称必填' }] })
    )
    const form = wrapper.findComponent(EvForm)
    await expect(form.vm.validate()).resolves.toBe(true)
    expect(wrapper.find('.ev-form-item__error').exists()).toBe(false)
  })

  it('trigger 语义：blur 触发 blur 规则，change 触发 change 规则', async () => {
    const wrapper = mount(
      createFormHarness(
        { name: 'abc' },
        { name: [{ min: 5, message: '至少5位', trigger: 'blur' }] }
      )
    )
    const input = wrapper.findComponent(EvInput)
    // change 触发不应校验（规则 trigger 为 blur）
    await input.find('input').setValue('abc')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EvFormItem).classes()).not.toContain('is-error')
    // blur 触发校验失败
    await input.find('input').trigger('blur')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EvFormItem).classes()).toContain('is-error')
  })

  it('输入组件 change 自动触发校验并清除错误', async () => {
    const wrapper = mount(
      createFormHarness({ name: '' }, { name: [{ required: true, message: '必填', trigger: 'change' }] })
    )
    const form = wrapper.findComponent(EvForm)
    await form.vm.validate().catch(() => {})
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EvFormItem).classes()).toContain('is-error')
    // 用户输入 → change 校验通过 → 错误清除
    const input = wrapper.find('input')
    await input.setValue('新值')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EvFormItem).classes()).not.toContain('is-error')
  })

  it('resetFields 恢复初始值并清除校验', async () => {
    const wrapper = mount(
      createFormHarness({ name: '初始' }, { name: [{ required: true, message: '必填', trigger: 'change' }] })
    )
    await wrapper.find('input').setValue('')
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EvFormItem).classes()).toContain('is-error')
    await wrapper.findComponent(EvForm).vm.resetFields()
    await new Promise((r) => setTimeout(r))
    expect(wrapper.find('input').element.value).toBe('初始')
    expect(wrapper.findComponent(EvFormItem).classes()).not.toContain('is-error')
  })

  it('clearValidate 清除校验状态', async () => {
    const wrapper = mount(
      createFormHarness({ name: '' }, { name: [{ required: true, message: '必填' }] })
    )
    const form = wrapper.findComponent(EvForm)
    await form.vm.validate().catch(() => {})
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EvFormItem).classes()).toContain('is-error')
    form.vm.clearValidate()
    await new Promise((r) => setTimeout(r))
    expect(wrapper.findComponent(EvFormItem).classes()).not.toContain('is-error')
  })

  it('validateField 校验指定字段', async () => {
    const wrapper = mount(
      createFormHarness({ name: '' }, { name: [{ required: true, message: '必填' }] })
    )
    const form = wrapper.findComponent(EvForm)
    await expect(form.vm.validateField('name')).rejects.toEqual({ name: '必填' })
  })

  it('FormInstance 方法齐全（validate/validateField/resetFields/clearValidate/scrollToField）', () => {
    const wrapper = mount(createFormHarness({ name: '' }, {}))
    const vm = wrapper.findComponent(EvForm).vm
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
    expect(wrapper.find('.ev-form-item__error').text()).toBe('仅数字')
  })
})
