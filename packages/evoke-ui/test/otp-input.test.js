import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import EvOtpInput from '../src/components/otp-input/index.vue'

function mountOtp(props = {}) {
  const wrapper = mount(EvOtpInput, { props })
  return { wrapper, inputs: () => wrapper.findAll('input') }
}

function pasteEvent(text) {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  event.clipboardData = { getData: () => text }
  return event
}

describe('EvOtpInput 基础', () => {
  it('渲染 length 个方框 + 错误/禁用态类', () => {
    const { wrapper, inputs } = mountOtp({ length: 4 })
    expect(inputs().length).toBe(4)
    wrapper.unmount()
    const disabled = mountOtp({ disabled: true, error: true })
    expect(disabled.wrapper.classes()).toContain('is-disabled')
    expect(disabled.wrapper.classes()).toContain('is-error')
    disabled.wrapper.unmount()
  })

  it('外部 modelValue 回显', async () => {
    const { wrapper, inputs } = mountOtp({ modelValue: '42' })
    await nextTick()
    expect(inputs()[0].element.value).toBe('4')
    expect(inputs()[1].element.value).toBe('2')
    wrapper.unmount()
  })
})

describe('EvOtpInput 输入联动', () => {
  it('逐位输入自动前进并 emit；填满 complete', async () => {
    const { wrapper, inputs } = mountOtp({ length: 4 })
    for (let i = 0; i < 4; i++) {
      await inputs()[i].setValue(String(i + 1))
    }
    await flushPromises()
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('1234')
    expect(wrapper.emitted('complete').at(-1)[0]).toBe('1234')
    wrapper.unmount()
  })

  it('粘贴整段自动分配（从任意框起，空框不占位）', async () => {
    const { wrapper, inputs } = mountOtp()
    const advance = vi.spyOn(inputs()[5].element, 'focus')
    inputs()[2].element.dispatchEvent(pasteEvent('8899'))
    await nextTick()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('8899')
    expect(advance).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('Backspace 空框退格清前位', async () => {
    const { wrapper, inputs } = mountOtp({ modelValue: '9' })
    await flushPromises()
    await inputs()[1].trigger('keydown', { key: 'Backspace' })
    await flushPromises()
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('')
    wrapper.unmount()
  })

  it('masked 掩码显示与 text 类型字母', async () => {
    const { wrapper, inputs } = mountOtp({ masked: true })
    await inputs()[0].setValue('7')
    await flushPromises()
    expect(inputs()[0].element.value).toBe('●')
    wrapper.unmount()

    const text = mountOtp({ type: 'text', length: 4 })
    await text.inputs()[0].setValue('aB')
    await flushPromises()
    expect(text.wrapper.emitted('update:modelValue').at(-1)[0]).toBe('aB')
    text.wrapper.unmount()
  })

  it('禁用态输入无效', async () => {
    const { wrapper, inputs } = mountOtp({ disabled: true })
    await inputs()[0].setValue('9')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('已填框内追加单字符覆写当前位并前进，不串位', async () => {
    const { wrapper, inputs } = mountOtp({ length: 4 })
    await inputs()[0].setValue('1')
    await flushPromises()
    const advance = vi.spyOn(inputs()[1].element, 'focus')
    await inputs()[0].setValue('12')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('2')
    expect(inputs()[0].element.value).toBe('2')
    expect(inputs()[1].element.value).toBe('')
    expect(advance).toHaveBeenCalled()
    wrapper.unmount()
  })
})
