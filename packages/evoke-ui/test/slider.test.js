import { mount, describe, it, expect, EvSlider } from './helpers'

describe('EvSlider', () => {
  it('拖动派发 update:modelValue / change（Number 类型）', async () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 10, min: 0, max: 40 } })
    const input = wrapper.find('input[type="range"]')
    await input.setValue('20')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([20])
    expect(wrapper.emitted('change')?.[0]).toEqual([20])
  })

  it('导轨填充比例跟随值（--ev-slider-fill）', () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 10, min: 0, max: 40 } })
    expect(wrapper.find('input').attributes('style')).toContain('25%')
  })

  it('非受控：不传 modelValue 自持状态，defaultValue 定初值', async () => {
    const wrapper = mount(EvSlider, { props: { defaultValue: 5, min: 0, max: 100 } })
    const input = wrapper.find('input[type="range"]')
    expect(input.element.value).toBe('5')
    await input.setValue('9')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([9])
    expect(input.element.value).toBe('9')
  })

  it('disabled 阻止派发', async () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 10, disabled: true } })
    const input = wrapper.find('input[type="range"]')
    expect(input.attributes('disabled')).toBeDefined()
    await input.setValue('30')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('值越界时填充比例收敛到 0–100%', () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 999, min: 0, max: 100 } })
    expect(wrapper.find('input').attributes('style')).toContain('100%')
  })

  it('尺寸 class', () => {
    expect(mount(EvSlider, { props: { size: 'small' } }).classes()).toContain('is-small')
    expect(mount(EvSlider, { props: { size: 'large' } }).classes()).toContain('is-large')
  })
})
