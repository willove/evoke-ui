import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EbCountdown from '../src/components/countdown/index.vue'

/**
 * Countdown 倒计时：格式令牌、走秒、finish 单次触发、过期即停、
 * value 变更重走计时、卸载清理定时器。
 */

const BASE = new Date(2026, 8, 15, 12, 0, 0).getTime()

function mountAt(props) {
  return mount(EbCountdown, { props })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('EbCountdown', () => {
  it('HH:mm:ss 基础格式与秒级取整', () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
    const wrapper = mountAt({ value: BASE + 5 * 1000 })
    expect(wrapper.find('.eb-countdown__value').text()).toBe('00:00:05')
    wrapper.unmount()
  })

  it('HH 总小时可超过 24', () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
    const wrapper = mountAt({ value: BASE + 25 * 3600 * 1000 })
    expect(wrapper.find('.eb-countdown__value').text()).toBe('25:00:00')
    wrapper.unmount()
  })

  it('自定义格式 mm:ss（ HH 令牌不出现则不展示小时）', () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
    const wrapper = mountAt({ value: BASE + 90 * 1000, format: 'mm:ss' })
    expect(wrapper.find('.eb-countdown__value').text()).toBe('01:30')
    wrapper.unmount()
  })

  it('title / prefix / suffix 渲染', () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
    const wrapper = mountAt({
      value: BASE + 10 * 1000,
      title: '秒杀开始',
      prefix: '还剩',
      suffix: '抢购',
    })
    expect(wrapper.find('.eb-countdown__title').text()).toBe('秒杀开始')
    expect(wrapper.find('.eb-countdown__prefix').text()).toBe('还剩')
    expect(wrapper.find('.eb-countdown__suffix').text()).toBe('抢购')
    wrapper.unmount()
  })

  it('随时间走秒并触发 change', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
    const onChange = vi.fn()
    const wrapper = mountAt({ value: BASE + 5 * 1000, onChange })
    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.find('.eb-countdown__value').text()).toBe('00:00:03')
    expect(onChange).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('到达目标时刻触发 finish（单次）并停在 00:00:00', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
    const onFinish = vi.fn()
    const wrapper = mountAt({ value: BASE + 2 * 1000, onFinish })
    await vi.advanceTimersByTimeAsync(2100)
    expect(wrapper.find('.eb-countdown__value').text()).toBe('00:00:00')
    expect(onFinish).toHaveBeenCalledTimes(1)
    // 已结束：继续推进不再产生新的触发
    await vi.advanceTimersByTimeAsync(5000)
    expect(onFinish).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('目标时刻已过去：挂载即 finish，不再起定时器', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
    const onFinish = vi.fn()
    const onChange = vi.fn()
    const wrapper = mountAt({ value: BASE - 1000, onFinish, onChange })
    expect(wrapper.find('.eb-countdown__value').text()).toBe('00:00:00')
    expect(onFinish).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(2000)
    expect(onChange).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('value 变更重走计时', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
    const wrapper = mountAt({ value: BASE + 10 * 1000 })
    await wrapper.setProps({ value: BASE + 3600 * 1000 })
    expect(wrapper.find('.eb-countdown__value').text()).toBe('01:00:00')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.find('.eb-countdown__value').text()).toBe('00:59:59')
    wrapper.unmount()
  })

  it('卸载后定时器清理（推进时间不再报错/更新）', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
    const onChange = vi.fn()
    const wrapper = mountAt({ value: BASE + 30 * 1000, onChange })
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(5000)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('无效 value 渲染零值且不触发 finish', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
    const onFinish = vi.fn()
    const wrapper = mountAt({ value: 'not-a-date', onFinish })
    expect(wrapper.find('.eb-countdown__value').text()).toBe('00:00:00')
    await vi.advanceTimersByTimeAsync(1000)
    expect(onFinish).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
