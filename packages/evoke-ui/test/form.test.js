import { mount, describe, it, expect, EvInput, EvTextarea, EvSelect, EvField } from './helpers'

describe('EvInput', () => {
  it('输入派发 v-model', async () => {
    const wrapper = mount(EvInput, { props: { placeholder: '怎么称呼你' } })
    await wrapper.find('input').setValue('林一舟')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['林一舟'])
  })

  it('clearable 清空', async () => {
    const wrapper = mount(EvInput, { props: { modelValue: 'abc', clearable: true } })
    await wrapper.find('.ev-input__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('error / disabled 状态类', () => {
    const wrapper = mount(EvInput, { props: { error: true, disabled: true } })
    expect(wrapper.classes()).toContain('is-error')
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('attrs 透传（maxlength）', () => {
    const wrapper = mount(EvInput, { attrs: { maxlength: 10 } })
    expect(wrapper.find('input').attributes('maxlength')).toBe('10')
  })
})

describe('EvTextarea', () => {
  it('v-model 与计数', async () => {
    const wrapper = mount(EvTextarea, { props: { maxlength: 100, placeholder: '留言' } })
    await wrapper.find('textarea').setValue('hello')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hello'])
    // 计数跟随受控值（父组件 v-model 更新后）
    await wrapper.setProps({ modelValue: 'hello' })
    expect(wrapper.find('.ev-textarea__count').text()).toBe('5 / 100')
  })

  it('error 态', () => {
    const wrapper = mount(EvTextarea, { props: { error: true } })
    expect(wrapper.classes()).toContain('is-error')
  })
})

describe('EvSelect', () => {
  const options = [
    { label: '文章', value: 'post' },
    { label: '模板', value: 'tpl' },
    { label: '帮助', value: 'help', disabled: true },
  ]

  it('点击展开菜单并选择', async () => {
    const wrapper = mount(EvSelect, { props: { options, modelValue: '', placeholder: '请选择' } })
    expect(wrapper.find('.ev-select__label').classes()).toContain('is-placeholder')
    await wrapper.find('.ev-select__trigger').trigger('click')
    const opts = wrapper.findAll('.ev-select__option')
    expect(opts).toHaveLength(3)
    await opts[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['post'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['post'])
    expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([false])
  })

  it('选中项回显标签 + 对勾', async () => {
    const wrapper = mount(EvSelect, { props: { options, modelValue: 'tpl' } })
    expect(wrapper.find('.ev-select__label').text()).toBe('模板')
    await wrapper.find('.ev-select__trigger').trigger('click')
    expect(wrapper.find('.ev-select__option.is-selected .ev-select__option-label').text()).toBe('模板')
    expect(wrapper.find('.ev-select__option-check').exists()).toBe(true)
  })

  it('disabled 选项与禁用态', async () => {
    const wrapper = mount(EvSelect, { props: { options, modelValue: 'post' } })
    await wrapper.find('.ev-select__trigger').trigger('click')
    await wrapper.findAll('.ev-select__option')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    const disabled = mount(EvSelect, { props: { options, modelValue: 'post', disabled: true } })
    await disabled.find('.ev-select__trigger').trigger('click')
    expect(disabled.find('.ev-select__menu').exists()).toBe(false)
  })

  it('bare 嵌入形态', () => {
    const wrapper = mount(EvSelect, { props: { options, modelValue: 'post', bare: true } })
    expect(wrapper.classes()).toContain('is-bare')
  })
})

describe('EvField', () => {
  it('标签 + 错误 + 提示', () => {
    const wrapper = mount(EvField, {
      props: { label: '邮箱', error: '邮箱格式不正确' },
      slots: { default: '<input class="demo-ctl" />' },
    })
    expect(wrapper.find('.ev-field__label').text()).toContain('邮箱')
    expect(wrapper.find('.ev-field__error').text()).toBe('邮箱格式不正确')
    expect(wrapper.find('.ev-field__hint').exists()).toBe(false)
    expect(wrapper.find('.demo-ctl').exists()).toBe(true)
  })

  it('无错误时展示 hint；required 星标', () => {
    const wrapper = mount(EvField, { props: { label: '留言', hint: '不会公开', required: true } })
    expect(wrapper.find('.ev-field__hint').text()).toBe('不会公开')
    expect(wrapper.find('.ev-field__required').exists()).toBe(true)
  })
})
