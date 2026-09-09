import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import EvStatistic from '../src/components/statistic/index.vue'
import EvBorderBeam from '../src/components/border-beam/index.vue'
import EvConfigProvider from '../src/components/config-provider/index.vue'
import { useConfigProvider } from '../src/composables/useConfigProvider'
import {
  formatNumber,
  formatFileSize,
  formatDate,
  formatRelativeTime,
  formatDuration,
  formatPercent,
} from '../src/utils/format'

/**
 * Statistic 统计数值 / format 工具 / ConfigProvider / BorderBeam
 */

describe('EvStatistic', () => {
  it('千分位与精度格式化', () => {
    const w1 = mount(EvStatistic, { props: { value: 12345678 } })
    expect(w1.find('.ev-statistic__value').text()).toBe('12,345,678')
    w1.unmount()

    const w2 = mount(EvStatistic, { props: { value: 0.98765, precision: 2, separator: '' } })
    expect(w2.find('.ev-statistic__value').text()).toBe('0.99')
    w2.unmount()
  })

  it('字符串数值原样展示，不套千分位', () => {
    const wrapper = mount(EvStatistic, { props: { value: 'ID-2026-0001' } })
    expect(wrapper.find('.ev-statistic__value').text()).toBe('ID-2026-0001')
    wrapper.unmount()
  })

  it('formatter 优先于内建格式化', () => {
    const wrapper = mount(EvStatistic, {
      props: { value: 12345, formatter: (v) => `${v} 人次` },
    })
    expect(wrapper.find('.ev-statistic__value').text()).toBe('12345 人次')
    wrapper.unmount()
  })

  it('title / prefix / suffix 与插槽', () => {
    const wrapper = mount(EvStatistic, {
      props: { value: 42, title: '今日订单', prefix: '¥', suffix: '元' },
    })
    expect(wrapper.find('.ev-statistic__title').text()).toBe('今日订单')
    expect(wrapper.find('.ev-statistic__prefix').text()).toBe('¥')
    expect(wrapper.find('.ev-statistic__suffix').text()).toBe('元')
    wrapper.unmount()
  })

  it('loading 态渲染占位点', () => {
    const wrapper = mount(EvStatistic, { props: { value: 1, loading: true } })
    expect(wrapper.findAll('.ev-statistic__loading-dot').length).toBe(3)
    wrapper.unmount()
  })
})

describe('format 工具', () => {
  it('formatNumber', () => {
    expect(formatNumber(1234567.891, { precision: 2 })).toBe('1,234,567.89')
    expect(formatNumber(1000, { separator: '' })).toBe('1000')
    expect(formatNumber('abc')).toBe('abc')
    expect(formatNumber(NaN)).toBe('NaN')
  })

  it('formatFileSize', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1024 ** 3)).toBe('1.0 GB')
    expect(formatFileSize(-1)).toBe('')
  })

  it('formatDate', () => {
    const d = new Date(2026, 8, 7, 14, 30, 5)
    expect(formatDate(d, 'YYYY-MM-DD')).toBe('2026-09-07')
    expect(formatDate(d, 'HH:mm:ss')).toBe('14:30:05')
    expect(formatDate('not-a-date')).toBe('')
  })

  it('formatRelativeTime', () => {
    const now = new Date(2026, 8, 7, 12, 0, 0).getTime()
    expect(formatRelativeTime(now - 10 * 1000, now)).toBe('刚刚')
    expect(formatRelativeTime(now - 3 * 60 * 1000, now)).toBe('3 分钟前')
    expect(formatRelativeTime(now - 5 * 60 * 60 * 1000, now)).toBe('5 小时前')
    expect(formatRelativeTime('bad', now)).toBe('')
  })

  it('formatDuration / formatPercent', () => {
    expect(formatDuration(205)).toBe('03:25')
    expect(formatDuration(3723)).toBe('01:02:03')
    expect(formatDuration(65, { forceHours: true })).toBe('00:01:05')
    expect(formatPercent(0.1234)).toBe('12.34%')
    expect(formatPercent('x')).toBe('')
  })
})

describe('EvConfigProvider', () => {
  it('向子组件提供 size / platform 全局默认', () => {
    let seen = null
    const Child = {
      setup() {
        const config = useConfigProvider()
        seen = { size: config.size.value, platform: config.platform.value }
        return () => null
      },
    }
    const wrapper = mount(EvConfigProvider, {
      props: { size: 'large', platform: 'desktop' },
      slots: { default: () => h(Child) },
    })
    expect(seen).toEqual({ size: 'large', platform: 'desktop' })
    wrapper.unmount()
  })

  it('无 Provider 时 useConfigProvider 回退默认值', () => {
    const config = useConfigProvider()
    expect(config.size.value).toBe('default')
    expect(config.platform.value).toBe('auto')
  })
})

describe('EvBorderBeam', () => {
  it('挂载即注入流光 CSS 变量', () => {
    const wrapper = mount(EvBorderBeam, {
      props: { color: '#ff5500', size: 3, duration: 4 },
      slots: { default: () => h('div', 'content') },
    })
    const style = wrapper.element.style
    expect(style.getPropertyValue('--ev-bb-color')).toContain('#ff5500')
    expect(style.getPropertyValue('--ev-bb-size')).toBe('3px')
    expect(style.getPropertyValue('--ev-bb-duration')).toBe('4s')
    expect(wrapper.find('.ev-border-beam__inner').text()).toBe('content')
    wrapper.unmount()
  })
})
