import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EvConfigProvider from '../src/components/config-provider/index.vue'
import { resetTheme, loadThemeConfig, clearThemeConfig } from '../src/utils/theme'

afterEach(() => {
  resetTheme()
  clearThemeConfig()
})

describe('EvConfigProvider 主题动态配置', () => {
  it('themeColor + semantic 注入运行时令牌', () => {
    mount(EvConfigProvider, {
      props: {
        themeColor: '#7b2ff2',
        semantic: { success: '#16a34a' },
      },
      slots: { default: 'x' },
    })
    const html = document.documentElement
    expect(html.style.getPropertyValue('--ev-color-primary')).toBe('#7b2ff2')
    expect(html.style.getPropertyValue('--ev-color-success')).toBe('#16a34a')
  })

  it('卸载后移除注入的内联令牌', () => {
    const wrapper = mount(EvConfigProvider, {
      props: { themeColor: '#7b2ff2' },
      slots: { default: 'x' },
    })
    wrapper.unmount()
    expect(
      document.documentElement.style.getPropertyValue('--ev-color-primary'),
    ).toBe('')
  })

  it('persistTheme：变更自动保存到 localStorage，卸载不清除存档', async () => {
    const wrapper = mount(EvConfigProvider, {
      props: { themeColor: '#7b2ff2', persistTheme: true },
      slots: { default: 'x' },
    })
    await wrapper.vm.$nextTick()
    const saved = loadThemeConfig()
    expect(saved?.primary).toBe('#7b2ff2')
    wrapper.unmount()
    expect(loadThemeConfig()?.primary).toBe('#7b2ff2')
  })

  it('persistTheme + 存档存在时：存档优先于声明式 themeColor', () => {
    saveThemeConfigDirect({ primary: '#0fa968' })
    mount(EvConfigProvider, {
      props: { themeColor: '#7b2ff2', persistTheme: true },
      slots: { default: 'x' },
    })
    expect(
      document.documentElement.style.getPropertyValue('--ev-color-primary'),
    ).toBe('#0fa968')
  })
})

// 直接经 localStorage 写入存档（模拟上一个会话保存的主题）
function saveThemeConfigDirect(config) {
  localStorage.setItem('ev-theme-config', JSON.stringify(config))
}
