import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EbAutoComplete from '../src/components/auto-complete/index.vue'

/**
 * EbAutoComplete — default-active-first-option / 候选字段兼容 / 空态 / 卸载清 timer / a11y
 * 弹层 Teleport 到 body，须 attachTo 并从 document 查询
 */

const mountAC = (props = {}) =>
  mount(EbAutoComplete, { props: { debounce: 0, ...props }, attachTo: document.body })

const type = async (wrapper, text) => {
  await wrapper.find('input').setValue(text)
  await new Promise((r) => setTimeout(r, 10))
  await nextTick()
}

const menuOptions = () => document.querySelectorAll('.eb-autocomplete__option')

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EbAutoComplete default-active-first-option', () => {
  const SUGGESTIONS = ['Apple', 'Banana', 'Cherry']

  it('默认关闭：结果不自动高亮，Enter 不选中', async () => {
    const wrapper = mountAC({ modelValue: '', suggestions: SUGGESTIONS })
    await type(wrapper, 'a')
    const options = menuOptions()
    expect(options.length).toBeGreaterThan(0)
    for (const o of options) expect(o.classList.contains('is-highlight')).toBe(false)
    // 输入本身会经 v-model 链回填一次，记录基线后再验证 Enter 无新增
    const updatesBefore = wrapper.emitted('update:modelValue')?.length ?? 0
    await wrapper.find('input').trigger('keydown.enter')
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toHaveLength(updatesBefore)
    wrapper.unmount()
  })

  it('开启后结果更新自动高亮第一条，Enter 直接选中', async () => {
    const wrapper = mountAC({ modelValue: '', suggestions: SUGGESTIONS, defaultActiveFirstOption: true })
    await type(wrapper, 'a')
    const options = menuOptions()
    expect(options[0].classList.contains('is-highlight')).toBe(true)
    expect(options[0].getAttribute('aria-selected')).toBe('true')
    await wrapper.find('input').trigger('keydown.enter')
    expect(wrapper.emitted('select')[0][0]).toEqual({ value: 'Apple' })
    expect(wrapper.emitted('select')[0][1]).toBe(0)
    // 最后一次回填来自 Enter 选中（输入链路先回填过 'a'）
    const updates = wrapper.emitted('update:modelValue')
    expect(updates[updates.length - 1][0]).toBe('Apple')
    wrapper.unmount()
  })
})

describe('EbAutoComplete 候选字段兼容', () => {
  it('对象候选显示 label 回退 value，字符串/数字原样', async () => {
    const wrapper = mountAC({
      modelValue: '',
      filterable: false,
      suggestions: [{ value: 'zh', label: '中文' }, { value: 'en' }, 'plain', 42],
    })
    await type(wrapper, 'x')
    const texts = [...menuOptions()].map((o) => o.textContent.trim())
    expect(texts).toEqual(['中文', 'en', 'plain', '42'])
    wrapper.unmount()
  })

  it('选中对象候选回填 value；数字候选回填数字', async () => {
    const wrapper = mountAC({
      modelValue: '',
      filterable: false,
      suggestions: [{ value: 'zh', label: '中文' }, 42],
    })
    await type(wrapper, 'x')
    ;[...menuOptions()][0].dispatchEvent(new MouseEvent('mousedown'))
    await nextTick()
    let updates = wrapper.emitted('update:modelValue')
    expect(updates[updates.length - 1][0]).toBe('zh') // 最后一次回填来自选中
    expect(wrapper.emitted('select')[0][0]).toEqual({ value: 'zh', label: '中文' })
    wrapper.unmount()

    const wrapper2 = mountAC({ modelValue: '', filterable: false, suggestions: [42] })
    await type(wrapper2, 'x')
    ;[...menuOptions()][0].dispatchEvent(new MouseEvent('mousedown'))
    await nextTick()
    updates = wrapper2.emitted('update:modelValue')
    expect(updates[updates.length - 1][0]).toBe(42)
    wrapper2.unmount()
  })

  it('value 过滤不受 label 影响', async () => {
    const wrapper = mountAC({
      modelValue: '',
      suggestions: [{ value: 'apple', label: '苹果' }, { value: 'banana', label: '芭' }],
    })
    await type(wrapper, 'ba')
    expect(menuOptions()).toHaveLength(1)
    expect(menuOptions()[0].textContent).toContain('芭')
    wrapper.unmount()
  })
})

describe('EbAutoComplete 空态与卸载清理', () => {
  it('有输入且无结果显示「无匹配数据」空态行', async () => {
    const wrapper = mountAC({ modelValue: '', suggestions: ['Apple'] })
    await type(wrapper, 'zz')
    const empty = document.querySelector('.eb-autocomplete__empty')
    expect(empty).not.toBeNull()
    expect(empty.textContent.trim()).toBe('无匹配数据')
    expect(menuOptions()).toHaveLength(0)
    // 空态下 Enter 不选中
    await wrapper.find('input').trigger('keydown.enter')
    expect(wrapper.emitted('select')).toBeUndefined()
    // 改回有结果：空态消失
    await type(wrapper, 'App')
    expect(document.querySelector('.eb-autocomplete__empty')).toBeNull()
    expect(menuOptions()).toHaveLength(1)
    wrapper.unmount()
  })

  it('空输入且无结果不弹面板', async () => {
    const wrapper = mountAC({ modelValue: '', suggestions: [] })
    await type(wrapper, '')
    await wrapper.find('input').trigger('focus')
    await new Promise((r) => setTimeout(r, 10))
    expect(document.querySelector('.eb-autocomplete__menu')).toBeNull()
    wrapper.unmount()
  })

  it('卸载清 debounce timer：挂起回调被清理', async () => {
    vi.useFakeTimers()
    const clearSpy = vi.spyOn(window, 'clearTimeout')
    const wrapper = mountAC({ modelValue: '', suggestions: ['Apple'], debounce: 100 })
    await wrapper.find('input').setValue('a')
    // 防抖挂起中卸载
    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
    vi.useRealTimers()
  })
})

describe('EbAutoComplete a11y', () => {
  it('输入框 combobox 语义 + 选项 id + aria-activedescendant 联动', async () => {
    const wrapper = mountAC({ modelValue: '', suggestions: ['Apple', 'Banana'] })
    const input = wrapper.find('input')
    expect(input.attributes('role')).toBe('combobox')
    await type(wrapper, 'a')
    const options = [...menuOptions()]
    const panelId = options[0].id.replace(/-option-\d+$/, '')
    expect(input.attributes('aria-controls')).toBe(panelId)
    expect(options[0].id).toMatch(/-option-0$/)
    expect(options[1].id).toMatch(/-option-1$/)
    expect(options[0].getAttribute('role')).toBe('option')
    // 高亮未激活时无 aria-activedescendant
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
    await input.trigger('keydown.down')
    await nextTick()
    expect(input.attributes('aria-activedescendant')).toBe(options[0].id)
    expect(options[0].classList.contains('is-highlight')).toBe(true)
    wrapper.unmount()
  })
})
