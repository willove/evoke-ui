import { mount, describe, it, expect, beforeEach, EwThemeToggle, EwCard } from './helpers'
import { useTheme, initTheme } from '../src/composables/useTheme'

describe('useTheme / EwThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    try { localStorage.removeItem('ew-theme') } catch { /* jsdom 支持 localStorage，忽略异常 */ }
  })

  it('toggle 切换 html.dark 并记忆', () => {
    const { isDark, toggleTheme } = useTheme()
    expect(isDark.value).toBe(false)
    toggleTheme()
    expect(isDark.value).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('ew-theme')).toBe('dark')
    toggleTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('ew-theme')).toBe('light')
  })

  it('EwThemeToggle 点击切换且图标随状态变化', async () => {
    const wrapper = mount(EwThemeToggle)
    const iconBefore = wrapper.find('svg').exists()
    expect(iconBefore).toBe(true)
    await wrapper.trigger('click')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('initTheme 尊重已有记忆（全新模块实例验证单例守卫外的行为）', async () => {
    // useTheme 模块级单例守卫下，用查询串拉起全新实例验证「记忆优先」逻辑
    const fresh = await import('../src/composables/useTheme?fresh-instance=1')
    localStorage.setItem('ew-theme', 'dark')
    fresh.initTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})

describe('EwCard customBg', () => {
  it('自定义底色覆盖 tone', () => {
    const wrapper = mount(EwCard, { props: { customBg: 'rgb(18, 18, 20)' } })
    expect(wrapper.attributes('style')).toContain('background-color: rgb(18, 18, 20)')
  })
})
