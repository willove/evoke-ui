import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import EbOtpInput from '../src/components/otp-input/index.vue'

function mountOtp(props = {}) {
  const wrapper = mount(EbOtpInput, { props })
  return { wrapper, inputs: () => wrapper.findAll('input') }
}

function pasteEvent(text) {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  event.clipboardData = { getData: () => text }
  return event
}

/** jsdom 29 的 focus() 不改 activeElement：以 focus 调用契约断言自动前进/回退 */
function spyFocus(inputs, index) {
  return vi.spyOn(inputs()[index].element, 'focus')
}

describe('EbOtpInput 基础渲染', () => {
  it('默认渲染 6 个方框，aria 标签带位次', () => {
    const { wrapper, inputs } = mountOtp()
    expect(inputs().length).toBe(6)
    expect(inputs()[0].attributes('aria-label')).toContain('1')
    expect(wrapper.find('[role="group"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('length 控制框数，首框 number 类型带 one-time-code', () => {
    const { wrapper, inputs } = mountOtp({ length: 4 })
    expect(inputs().length).toBe(4)
    expect(inputs()[0].attributes('autocomplete')).toBe('one-time-code')
    expect(inputs()[0].attributes('inputmode')).toBe('numeric')
    wrapper.unmount()
  })

  it('size 三档类名与禁用态', () => {
    const { wrapper } = mountOtp({ size: 'large', disabled: true })
    expect(wrapper.classes()).toContain('eb-otp-input--large')
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.findAll('input')[0].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('外部 modelValue 回显到对应方框', async () => {
    const { wrapper, inputs } = mountOtp({ modelValue: '12' })
    await nextTick()
    expect(inputs()[0].element.value).toBe('1')
    expect(inputs()[1].element.value).toBe('2')
    expect(inputs()[2].element.value).toBe('')
    wrapper.unmount()
  })
})

describe('EbOtpInput 输入与联动', () => {
  it('逐位输入自动前进，emit update/change', async () => {
    const { wrapper, inputs } = mountOtp()
    const advance = spyFocus(inputs, 1)
    await inputs()[0].setValue('1')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([['1']])
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(advance).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('填满触发 complete', async () => {
    const { wrapper, inputs } = mountOtp({ length: 4 })
    for (let i = 0; i < 4; i++) {
      await inputs()[i].setValue(String(i + 1))
    }
    await flushPromises()
    const complete = wrapper.emitted('complete')
    expect(complete).toBeTruthy()
    expect(complete.at(-1)[0]).toBe('1234')
    wrapper.unmount()
  })

  it('粘贴整段验证码自动分配并聚焦末位', async () => {
    const { wrapper, inputs } = mountOtp()
    const advance = spyFocus(inputs, 5)
    inputs()[1].element.dispatchEvent(pasteEvent('2345'))
    await nextTick()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('2345')
    expect(advance).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('首框粘贴整段填满触发 complete', async () => {
    const { wrapper, inputs } = mountOtp()
    inputs()[0].element.dispatchEvent(pasteEvent('135790'))
    await nextTick()
    await flushPromises()
    expect(wrapper.emitted('complete').at(-1)[0]).toBe('135790')
    expect(inputs()[0].element.value).toBe('1')
    wrapper.unmount()
  })

  it('Backspace：当前位有值清当前，无值退格清前位并回退', async () => {
    const { wrapper, inputs } = mountOtp({ modelValue: '12' })
    await flushPromises()
    const retreat = spyFocus(inputs, 1)
    // 第 3 位（空）退格 → 清第 2 位并回退
    await inputs()[2].trigger('keydown', { key: 'Backspace' })
    await flushPromises()
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('1')
    expect(retreat).toHaveBeenCalled()
    // 第 2 位（有值 1）退格 → 清当前
    await inputs()[1].trigger('keydown', { key: 'Backspace' })
    await flushPromises()
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('')
    wrapper.unmount()
  })

  it('方向键移动焦点', async () => {
    const { wrapper, inputs } = mountOtp()
    const left = spyFocus(inputs, 1)
    await inputs()[2].trigger('keydown', { key: 'ArrowLeft' })
    expect(left).toHaveBeenCalled()
    const right = spyFocus(inputs, 2)
    await inputs()[1].trigger('keydown', { key: 'ArrowRight' })
    expect(right).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('number 类型过滤非数字；text 类型收字母', async () => {
    const { wrapper, inputs } = mountOtp()
    await inputs()[0].setValue('abc')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue') ?? []).toEqual([])
    wrapper.unmount()

    const text = mountOtp({ type: 'text', length: 4 })
    await text.inputs()[0].setValue('a7b')
    await flushPromises()
    expect(text.wrapper.emitted('update:modelValue').at(-1)[0]).toBe('a7b')
    text.wrapper.unmount()
  })

  it('masked 掩码显示', async () => {
    const { wrapper, inputs } = mountOtp({ modelValue: '12', masked: true })
    await nextTick()
    expect(inputs()[0].element.value).toBe('●')
    expect(inputs()[1].element.value).toBe('●')
    expect(inputs()[2].element.value).toBe('')
    wrapper.unmount()
  })

  it('禁用态输入无效', async () => {
    const { wrapper, inputs } = mountOtp({ disabled: true })
    await inputs()[0].setValue('9')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('外部重置 modelValue 清空方框', async () => {
    const wrapper = mount(EbOtpInput, { props: { modelValue: '12' } })
    await flushPromises()
    await wrapper.setProps({ modelValue: '' })
    await flushPromises()
    expect(wrapper.findAll('input')[0].element.value).toBe('')
    wrapper.unmount()
  })

  it('expose clear 清空', async () => {
    const wrapper = mount(EbOtpInput, { props: { modelValue: '123' } })
    await flushPromises()
    wrapper.vm.clear()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('')
    wrapper.unmount()
  })
})
