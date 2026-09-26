import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EtToast from '../src/components/toast/index.vue'

/**
 * EtToast 组件契约（tools-ui 计划 05 §四 L4 / 07 M3 交付物 5）
 *
 *   ① 自动关：vi.useFakeTimers 推进 duration 后 emit update:modelValue；
 *   ② duration=0 不自动关（常驻到消费方关闭）；
 *   ③ role=status + aria-live=polite（不抢焦点的礼貌播报）；
 *   ④ action 槽点击 emit action；
 *   ⑤ 卸载清定时器（防泄漏：组件没了回调不该再 fire）。
 */

const flush = (ms = 30) => new Promise((r) => setTimeout(r, ms))

function mountToast(props = {}, slots = {}) {
  return mount(EtToast, { props, slots, attachTo: document.body })
}

const toast = () => document.querySelector('.et-toast')

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('EtToast（M3 交付物 5：瞬时通知）', () => {
  it('自动关：推进 duration 后 emit update:modelValue false', async () => {
    vi.useFakeTimers()
    const wrapper = mountToast({ modelValue: true, message: '已保存', duration: 3000 })

    vi.advanceTimersByTime(2999)
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()

    vi.advanceTimersByTime(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    wrapper.unmount()
  })

  it('duration=0 不自动关（常驻到消费方关闭）', async () => {
    vi.useFakeTimers()
    const wrapper = mountToast({ modelValue: true, duration: 0 })
    vi.advanceTimersByTime(60000)
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(toast()).toBeTruthy()
    wrapper.unmount()
  })

  it('role=status + aria-live=polite；type / position 落类名；message 渲染', async () => {
    const wrapper = mountToast({ modelValue: true, type: 'success', position: 'bottom', message: '已保存草稿' })
    await flush()

    const el = toast()
    expect(el.getAttribute('role')).toBe('status')
    expect(el.getAttribute('aria-live')).toBe('polite')
    expect(el.className).toContain('et-toast--success')
    expect(el.className).toContain('et-toast--bottom')
    expect(el.textContent).toContain('已保存草稿')
    // 类型图标（库内 semantic 名，G2）与 action 位的存在性
    expect(el.querySelector('.et-toast__icon')).toBeTruthy()
    wrapper.unmount()
  })

  it('action 槽：点击操作区 emit action', async () => {
    const wrapper = mountToast(
      { modelValue: true, duration: 0 },
      { action: '<button class="probe-action">重试</button>' },
    )
    await flush()
    expect(toast().querySelector('.et-toast__action')).toBeTruthy()
    toast().querySelector('.probe-action').click()
    expect(wrapper.emitted('action')).toHaveLength(1)
    wrapper.unmount()
  })

  it('卸载即清定时器：卸载后推进 duration 不再 emit（防泄漏）', async () => {
    vi.useFakeTimers()
    const wrapper = mountToast({ modelValue: true, duration: 3000 })
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')

    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()

    vi.advanceTimersByTime(10000)
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })
})
