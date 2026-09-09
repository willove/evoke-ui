import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import EvInput from '../src/components/input/index.vue'
import EvTextarea from '../src/components/textarea/index.vue'

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

describe('EvInput 渲染契约', () => {
  it('根节点挂 ev-input/ev-input 双 class', () => {
    const wrapper = mount(EvInput)
    expect(wrapper.classes()).toContain('ev-input')
    expect(wrapper.classes()).toContain('ev-input')
  })

  it('结构（wrapper + inner + 原生 input）', () => {
    const wrapper = mount(EvInput)
    expect(wrapper.find('.ev-input__wrapper').exists()).toBe(true)
    expect(wrapper.find('input.ev-input__inner').exists()).toBe(true)
  })

  it('type=textarea 切换 textarea DOM（.ev-textarea）', () => {
    const wrapper = mount(EvInput, { props: { type: 'textarea', rows: 4 } })
    expect(wrapper.classes()).toContain('ev-textarea')
    expect(wrapper.find('textarea.ev-textarea__inner').exists()).toBe(true)
    expect(wrapper.find('textarea').attributes('rows')).toBe('4')
  })

  it('size 修饰类（form/prop 继承链）', () => {
    expect(mount(EvInput, { props: { size: 'large' } }).classes()).toContain('ev-input--large')
    expect(mount(EvInput, { props: { size: 'small' } }).classes()).toContain('ev-input--small')
  })

  it('clearable 默认 true（evoke-ui 蓝本对齐），有值时显示 clear 图标', () => {
    const wrapper = mount(EvInput, { props: { modelValue: 'abc' } })
    expect(wrapper.find('.ev-input__clear').exists()).toBe(true)
  })

  it('disabled 透传原生属性与 is-disabled 类', () => {
    const wrapper = mount(EvInput, { props: { disabled: true } })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('show-word-limit 渲染计数与超出态', () => {
    const wrapper = mount(EvInput, {
      props: { modelValue: 'abcdef', maxlength: 5, showWordLimit: true },
    })
    expect(wrapper.find('.ev-input__count').text()).toContain('6 / 5')
    expect(wrapper.classes()).toContain('is-exceed')
  })

  it('error/help 提示（evoke-ui 扩展）', () => {
    const err = mount(EvInput, { props: { error: '必填' } })
    expect(err.find('.ev-input-hint .hint-error').text()).toBe('必填')
    const help = mount(EvInput, { props: { help: '帮助' } })
    expect(help.find('.ev-input-hint .hint-help').text()).toBe('帮助')
  })

  it('placeholder / attrs 透传给 input 元素', () => {
    const wrapper = mount(EvInput, {
      props: { placeholder: '请输入' },
      attrs: { 'data-test': 'x' },
    })
    expect(wrapper.find('input').attributes('placeholder')).toBe('请输入')
    expect(wrapper.find('input').attributes('data-test')).toBe('x')
  })
})

describe('EvInput 行为', () => {
  it('输入触发 input + update:modelValue', async () => {
    const wrapper = mount(EvInput, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('input')[0]).toEqual(['hello'])
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['hello'])
  })

  it('blur/focus 事件透传 + is-focus 状态', async () => {
    const wrapper = mount(EvInput)
    await wrapper.find('input').trigger('focus')
    expect(wrapper.find('.ev-input__wrapper').classes()).toContain('is-focus')
    expect(wrapper.emitted('focus')).toHaveLength(1)
    await wrapper.find('input').trigger('blur')
    expect(wrapper.emitted('blur')).toHaveLength(1)
  })

  it('clear 清空并触发 clear + update:modelValue("")', async () => {
    const wrapper = mount(EvInput, { props: { modelValue: 'abc' } })
    await wrapper.find('.ev-input__clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([''])
  })

  it('showPassword 切换 password/text', async () => {
    const wrapper = mount(EvInput, {
      props: { modelValue: 'secret', showPassword: true, type: 'password' },
    })
    expect(wrapper.find('input').attributes('type')).toBe('password')
    await wrapper.find('.ev-input__password').trigger('click')
    expect(wrapper.find('input').attributes('type')).toBe('text')
  })

  it('prefix/suffix 图标渲染', () => {
    const wrapper = mount(EvInput, {
      props: { prefixIcon: 'search', suffixIcon: 'close' },
    })
    expect(wrapper.find('.ev-input__prefix').exists()).toBe(true)
    expect(wrapper.find('.ev-input__suffix').exists()).toBe(true)
  })

  it('expose focus/blur/select', () => {
    const wrapper = mount(EvInput)
    expect(typeof wrapper.vm.focus).toBe('function')
    expect(typeof wrapper.vm.blur).toBe('function')
    expect(typeof wrapper.vm.select).toBe('function')
  })

  it('v-model 双向绑定（Harness 集成）', async () => {
    const wrapper = mount(ModelHarness, {
      props: { initial: 'a', component: EvInput },
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('a')
    await input.setValue('b')
    expect(input.element.value).toBe('b')
  })
})

describe('EvTextarea', () => {
  it('根节点挂 ev-textarea/ev-textarea 双 class', () => {
    const wrapper = mount(EvTextarea)
    expect(wrapper.classes()).toContain('ev-textarea')
    expect(wrapper.classes()).toContain('ev-textarea')
    expect(wrapper.find('textarea.ev-textarea__inner').exists()).toBe(true)
  })

  it('rows 透传', () => {
    expect(mount(EvTextarea, { props: { rows: 5 } }).find('textarea').attributes('rows')).toBe('5')
  })

  it('word-limit 计数', () => {
    const wrapper = mount(EvTextarea, {
      props: { modelValue: 'abc', maxlength: 10, showWordLimit: true },
    })
    expect(wrapper.find('.ev-input__count').text()).toContain('3 / 10')
  })

  it('输入触发 update:modelValue', async () => {
    const wrapper = mount(EvTextarea, { props: { modelValue: '' } })
    await wrapper.find('textarea').setValue('txt')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['txt'])
  })

  it('error 提示（evoke-ui 扩展）', () => {
    expect(mount(EvTextarea, { props: { error: '错' } }).find('.hint-error').text()).toBe('错')
  })
})
