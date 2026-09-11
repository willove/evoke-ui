import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EbInput from '../src/components/input/index.vue'
import EbTextarea from '../src/components/textarea/index.vue'

const ModelHarness = defineComponent({
  props: ['initial', 'component'],
  setup(props) {
    const value = ref(props.initial)
    return () =>
      h(props.component, {
        modelValue: value.value,
        'onUpdate:modelValue': (v) => (value.value = v),
      })
  },
})

describe('EbInput 渲染契约', () => {
  it('根节点挂 eb-input/eb-input 双 class', () => {
    const wrapper = mount(EbInput)
    expect(wrapper.classes()).toContain('eb-input')
    expect(wrapper.classes()).toContain('eb-input')
  })

  it('结构（wrapper + inner + 原生 input）', () => {
    const wrapper = mount(EbInput)
    expect(wrapper.find('.eb-input__wrapper').exists()).toBe(true)
    expect(wrapper.find('input.eb-input__inner').exists()).toBe(true)
  })

  it('type=textarea 切换 textarea DOM（.eb-textarea）', () => {
    const wrapper = mount(EbInput, { props: { type: 'textarea', rows: 4 } })
    expect(wrapper.classes()).toContain('eb-textarea')
    expect(wrapper.find('textarea.eb-textarea__inner').exists()).toBe(true)
    expect(wrapper.find('textarea').attributes('rows')).toBe('4')
  })

  it('size 修饰类（form/prop 继承链）', () => {
    expect(mount(EbInput, { props: { size: 'large' } }).classes()).toContain('eb-input--large')
    expect(mount(EbInput, { props: { size: 'small' } }).classes()).toContain('eb-input--small')
  })

  it('clearable 默认 true（蓝本对齐），有值时显示 clear 图标', () => {
    const wrapper = mount(EbInput, { props: { modelValue: 'abc' } })
    expect(wrapper.find('.eb-input__clear').exists()).toBe(true)
  })

  it('disabled 透传原生属性与 is-disabled 类', () => {
    const wrapper = mount(EbInput, { props: { disabled: true } })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('show-word-limit 渲染计数与超出态', () => {
    const wrapper = mount(EbInput, {
      props: { modelValue: 'abcdef', maxlength: 5, showWordLimit: true },
    })
    expect(wrapper.find('.eb-input__count').text()).toContain('6 / 5')
    expect(wrapper.classes()).toContain('is-exceed')
  })

  it('error/help 提示（扩展能力）', () => {
    const err = mount(EbInput, { props: { error: '必填' } })
    expect(err.find('.eb-input-hint .hint-error').text()).toBe('必填')
    const help = mount(EbInput, { props: { help: '帮助' } })
    expect(help.find('.eb-input-hint .hint-help').text()).toBe('帮助')
  })

  it('placeholder / attrs 透传给 input 元素', () => {
    const wrapper = mount(EbInput, {
      props: { placeholder: '请输入' },
      attrs: { 'data-test': 'x' },
    })
    expect(wrapper.find('input').attributes('placeholder')).toBe('请输入')
    expect(wrapper.find('input').attributes('data-test')).toBe('x')
  })
})

describe('EbInput 行为', () => {
  it('输入触发 input + update:modelValue', async () => {
    const wrapper = mount(EbInput, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('input')[0]).toEqual(['hello'])
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['hello'])
  })

  it('blur/focus 事件透传 + is-focus 状态', async () => {
    const wrapper = mount(EbInput)
    await wrapper.find('input').trigger('focus')
    expect(wrapper.find('.eb-input__wrapper').classes()).toContain('is-focus')
    expect(wrapper.emitted('focus')).toHaveLength(1)
    await wrapper.find('input').trigger('blur')
    expect(wrapper.emitted('blur')).toHaveLength(1)
  })

  it('clear 清空并触发 clear + update:modelValue("")', async () => {
    const wrapper = mount(EbInput, { props: { modelValue: 'abc' } })
    await wrapper.find('.eb-input__clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([''])
  })

  it('showPassword 切换 password/text', async () => {
    const wrapper = mount(EbInput, {
      props: { modelValue: 'secret', showPassword: true, type: 'password' },
    })
    expect(wrapper.find('input').attributes('type')).toBe('password')
    await wrapper.find('.eb-input__password').trigger('click')
    expect(wrapper.find('input').attributes('type')).toBe('text')
  })

  it('prefix/suffix 图标渲染', () => {
    const wrapper = mount(EbInput, {
      props: { prefixIcon: 'search', suffixIcon: 'close' },
    })
    expect(wrapper.find('.eb-input__prefix').exists()).toBe(true)
    expect(wrapper.find('.eb-input__suffix').exists()).toBe(true)
  })

  it('expose focus/blur/select', () => {
    const wrapper = mount(EbInput)
    expect(typeof wrapper.vm.focus).toBe('function')
    expect(typeof wrapper.vm.blur).toBe('function')
    expect(typeof wrapper.vm.select).toBe('function')
  })

  it('v-model 双向绑定（Harness 集成）', async () => {
    const wrapper = mount(ModelHarness, {
      props: { initial: 'a', component: EbInput },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('a')
    await input.setValue('b')
    expect(input.element.value).toBe('b')
  })
})

describe('EbTextarea', () => {
  it('根节点挂 eb-textarea/eb-textarea 双 class', () => {
    const wrapper = mount(EbTextarea)
    expect(wrapper.classes()).toContain('eb-textarea')
    expect(wrapper.classes()).toContain('eb-textarea')
    expect(wrapper.find('textarea.eb-textarea__inner').exists()).toBe(true)
  })

  it('rows 透传', () => {
    expect(mount(EbTextarea, { props: { rows: 5 } }).find('textarea').attributes('rows')).toBe('5')
  })

  it('word-limit 计数', () => {
    const wrapper = mount(EbTextarea, {
      props: { modelValue: 'abc', maxlength: 10, showWordLimit: true },
    })
    expect(wrapper.find('.eb-input__count').text()).toContain('3 / 10')
  })

  it('输入触发 update:modelValue', async () => {
    const wrapper = mount(EbTextarea, { props: { modelValue: '' } })
    await wrapper.find('textarea').setValue('txt')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['txt'])
  })

  it('error 提示（扩展能力）', () => {
    expect(mount(EbTextarea, { props: { error: '错' } }).find('.hint-error').text()).toBe('错')
  })
})
