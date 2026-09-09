import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EvSlider from '../src/components/slider/index.vue'
import EvColorPicker from '../src/components/color-picker/index.vue'
import EvColorPickerPanel from '../src/components/color-picker/panel.vue'

// 滑块几何在 jsdom 全为 0，mock runway 矩形
function mockRunwayRect(wrapper, { left = 0, top = 0, width = 100, height = 10 } = {}) {
  const runway = wrapper.find('.ev-slider__runway')
  runway.element.getBoundingClientRect = () => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => {},
  })
  return runway
}

describe('EvSlider', () => {
  beforeEach(() => {
    // window 级监听在测试间残留会互相干扰
    document.body.innerHTML = ''
  })

  it('双 class + runway/bar/button 结构', () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 30 } })
    expect(wrapper.classes()).toContain('ev-slider')
    expect(wrapper.classes()).toContain('ev-slider')
    expect(wrapper.find('.ev-slider__runway').exists()).toBe(true)
    expect(wrapper.find('.ev-slider__bar').exists()).toBe(true)
    expect(wrapper.find('.ev-slider__button-wrapper').exists()).toBe(true)
    expect(wrapper.findAll('.ev-slider__button-wrapper')).toHaveLength(1)
  })

  it('单值：点击轨道提交对应值', async () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 0 }, attachTo: document.body })
    mockRunwayRect(wrapper, { width: 100 })
    await wrapper.find('.ev-slider__runway').trigger('mousedown', { clientX: 50, button: 0 })
    expect(wrapper.emitted('update:modelValue')).toEqual([[50]])
    expect(wrapper.emitted('change')).toEqual([[50]])
    wrapper.unmount()
  })

  it('单值：bar 宽度反映 modelValue', () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 30 } })
    expect(wrapper.find('.ev-slider__bar').attributes('style')).toContain('width: 30%')
  })

  it('步进吸附（step=10 → 点击 55 得 60）', async () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 0, step: 10 }, attachTo: document.body })
    mockRunwayRect(wrapper, { width: 100 })
    await wrapper.find('.ev-slider__runway').trigger('mousedown', { clientX: 55, button: 0 })
    expect(wrapper.emitted('update:modelValue')).toEqual([[60]])
    wrapper.unmount()
  })

  it('区间模式：双按钮 + 点击选择最近手柄', async () => {
    const wrapper = mount(EvSlider, { props: { modelValue: [20, 60], range: true }, attachTo: document.body })
    mockRunwayRect(wrapper, { width: 100 })
    expect(wrapper.findAll('.ev-slider__button-wrapper')).toHaveLength(2)
    // 点击 80：离 second(60) 更近 → second=80
    await wrapper.find('.ev-slider__runway').trigger('mousedown', { clientX: 80, button: 0 })
    expect(wrapper.emitted('update:modelValue')).toEqual([[[20, 80]]])
    wrapper.unmount()
  })

  it('拖拽：mousedown 按钮 → mousemove → mouseup 提交', async () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 10 }, attachTo: document.body })
    mockRunwayRect(wrapper, { width: 100 })
    await wrapper.find('.ev-slider__button-wrapper').trigger('mousedown', { clientX: 10, button: 0 })
    // 拖拽中 input 事件（无 change）
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 70 }))
    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.emitted('change')).toBeUndefined()
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    expect(wrapper.emitted('update:modelValue')).toEqual([[70]])
    expect(wrapper.emitted('change')).toEqual([[70]])
    wrapper.unmount()
  })

  it('键盘方向键步进', async () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 10 } })
    await wrapper.find('.ev-slider__button-wrapper').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[11]])
    await wrapper.find('.ev-slider__button-wrapper').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[11], [10]])
  })

  it('disabled 点击无效', async () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 10, disabled: true }, attachTo: document.body })
    mockRunwayRect(wrapper, { width: 100 })
    await wrapper.find('.ev-slider__runway').trigger('mousedown', { clientX: 50, button: 0 })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('vertical：bar 高度反映值', () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 40, vertical: true, height: '200px' } })
    expect(wrapper.classes()).toContain('is-vertical')
    expect(wrapper.find('.ev-slider__bar').attributes('style')).toContain('height: 40%')
    expect(wrapper.find('.ev-slider__runway').attributes('style')).toContain('height: 200px')
  })

  it('show-stops 渲染挡点', () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 0, step: 25, showStops: true } })
    // 25/50/75 三个内点
    expect(wrapper.findAll('.ev-slider__stop')).toHaveLength(3)
  })

  it('marks 渲染 + 文案', () => {
    const wrapper = mount(EvSlider, {
      props: { modelValue: 0, marks: { 0: '零', 50: { label: '半百', style: { color: 'red' } }, 100: '满' } },
    })
    const marks = wrapper.findAll('.ev-slider__mark-text')
    expect(marks).toHaveLength(3)
    expect(marks[1].text()).toBe('半百')
  })

  it('show-input：单值模式渲染数值输入', () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 30, showInput: true } })
    expect(wrapper.find('.ev-slider__input').exists()).toBe(true)
  })

  it('formatTooltip 拖拽时生效', async () => {
    const wrapper = mount(EvSlider, {
      props: { modelValue: 10, formatTooltip: (v) => `${v}%` },
      attachTo: document.body,
    })
    mockRunwayRect(wrapper, { width: 100 })
    const btn = wrapper.find('.ev-slider__button-wrapper')
    await btn.trigger('mousedown', { clientX: 10, button: 0 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 70 }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-slider__tooltip-text').text()).toBe('70%')
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    wrapper.unmount()
  })

  it('expose focus/blur 可调用', () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 0 } })
    expect(typeof wrapper.vm.focus).toBe('function')
    expect(() => wrapper.vm.blur()).not.toThrow()
  })
})

describe('EvColorPickerPanel', () => {
  it('双 class + SV/色相条结构', () => {
    const wrapper = mount(EvColorPickerPanel, { props: { modelValue: '#ff0000' } })
    expect(wrapper.classes()).toContain('ev-color-dropdown')
    expect(wrapper.classes()).toContain('ev-color-dropdown')
    expect(wrapper.find('.ev-color-svpanel').exists()).toBe(true)
    expect(wrapper.find('.ev-color-hue-slider').exists()).toBe(true)
    expect(wrapper.find('.ev-color-alpha-slider').exists()).toBe(false)
  })

  it('showAlpha 渲染透明度条', () => {
    const wrapper = mount(EvColorPickerPanel, { props: { modelValue: '#ff0000', showAlpha: true } })
    expect(wrapper.find('.ev-color-alpha-slider').exists()).toBe(true)
  })

  it('预定义色渲染 + 点击提交', async () => {
    const wrapper = mount(EvColorPickerPanel, {
      props: { modelValue: '', predefine: ['#00aa00', '#0000aa'] },
    })
    const swatches = wrapper.findAll('.ev-color-predefine__color-selector')
    expect(swatches).toHaveLength(2)
    await swatches[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['#00aa00']])
    expect(wrapper.emitted('change')).toEqual([['#00aa00']])
  })

  it('输入非法色值不提交', async () => {
    const wrapper = mount(EvColorPickerPanel, { props: { modelValue: '#ff0000' } })
    const input = wrapper.find('.ev-color-dropdown__value-input')
    input.element.value = 'not-a-color'
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('输入合法色值提交（rgba 解析 → 默认 hex 输出）', async () => {
    const wrapper = mount(EvColorPickerPanel, { props: { modelValue: '#ff0000' } })
    const input = wrapper.find('.ev-color-dropdown__value-input')
    input.element.value = 'rgb(0, 170, 0)'
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toEqual([['#00aa00']])
  })

  it('确定按钮提交当前值', async () => {
    const wrapper = mount(EvColorPickerPanel, { props: { modelValue: '#0000aa' } })
    await wrapper.find('.ev-color-dropdown__link-btn').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['#0000aa']])
  })

  it('SV 面板拖拽触发 active-change', () => {
    const wrapper = mount(EvColorPickerPanel, { props: { modelValue: '#ff0000' }, attachTo: document.body })
    const sv = wrapper.find('.ev-color-svpanel')
    sv.element.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => {},
    })
    sv.trigger('mousedown', { clientX: 50, clientY: 50, button: 0 })
    expect(wrapper.emitted('active-change')).toBeTruthy()
    window.dispatchEvent(new MouseEvent('mouseup', {}))
    wrapper.unmount()
  })
})

describe('EvColorPicker', () => {
  it('双 class + trigger 结构 + 空值图标', () => {
    const wrapper = mount(EvColorPicker)
    expect(wrapper.classes()).toContain('ev-color-picker')
    expect(wrapper.classes()).toContain('ev-color-picker')
    expect(wrapper.find('.ev-color-picker__trigger').exists()).toBe(true)
    expect(wrapper.find('.ev-color-picker__icon').exists()).toBe(true)
  })

  it('有值时背景色写入 trigger，无遮罩图标', () => {
    const wrapper = mount(EvColorPicker, { props: { modelValue: '#00aa00' } })
    expect(wrapper.find('.ev-color-picker__color').attributes('style')).toContain('rgb(0, 170, 0)')
    expect(wrapper.find('.ev-color-picker__icon').exists()).toBe(false)
  })

  it('size 修饰类', () => {
    expect(mount(EvColorPicker, { props: { size: 'large' } }).classes()).toContain('ev-color-picker--large')
  })

  it('点击 trigger 打开面板（Teleport 到 body）', async () => {
    const wrapper = mount(EvColorPicker, { props: { modelValue: '' }, attachTo: document.body })
    await wrapper.find('.ev-color-picker__trigger').trigger('click')
    expect(document.querySelector('.ev-color-picker__panel')).toBeTruthy()
    expect(document.querySelector('.ev-color-dropdown')).toBeTruthy()
    wrapper.unmount()
  })

  it('面板确认后 emit change/update:modelValue', async () => {
    const wrapper = mount(EvColorPicker, { props: { modelValue: '#0000aa' }, attachTo: document.body })
    await wrapper.find('.ev-color-picker__trigger').trigger('click')
    const confirmBtn = document.querySelector('.ev-color-dropdown__link-btn')
    expect(confirmBtn).toBeTruthy()
    confirmBtn.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([['#0000aa']])
    expect(wrapper.emitted('change')).toEqual([['#0000aa']])
    wrapper.unmount()
  })

  it('expose show/hide/focus/blur', async () => {
    const wrapper = mount(EvColorPicker, { attachTo: document.body })
    wrapper.vm.show()
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.ev-color-picker__panel')).toBeTruthy()
    wrapper.vm.hide()
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.ev-color-picker__panel')).toBeFalsy()
    expect(() => wrapper.vm.blur()).not.toThrow()
    wrapper.unmount()
  })

  it('disabled 不打开面板', async () => {
    const wrapper = mount(EvColorPicker, { props: { disabled: true }, attachTo: document.body })
    await wrapper.find('.ev-color-picker__trigger').trigger('click')
    expect(document.querySelector('.ev-color-picker__panel')).toBeFalsy()
    wrapper.unmount()
  })
})
