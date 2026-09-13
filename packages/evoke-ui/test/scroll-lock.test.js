import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { lockBodyScroll, unlockBodyScroll } from '../src/composables/useScrollLock'

describe('useScrollLock / body 滚动锁定', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    document.documentElement.style.removeProperty('scrollbar-gutter')
    document.body.innerHTML = '<div id="app"></div>'
  })

  afterEach(() => {
    // 兜底复位，避免用例间串扰
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    document.documentElement.style.removeProperty('scrollbar-gutter')
    delete globalThis.CSS
  })

  it('锁定时 overflow=hidden，解锁后恢复原值', () => {
    document.body.style.overflow = 'auto'
    lockBodyScroll()
    expect(document.body.style.overflow).toBe('hidden')
    unlockBodyScroll()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('引用计数：多弹层叠加，最后一个解锁才恢复', () => {
    lockBodyScroll()
    lockBodyScroll()
    expect(document.body.style.overflow).toBe('hidden')
    unlockBodyScroll()
    expect(document.body.style.overflow).toBe('hidden')
    unlockBodyScroll()
    expect(document.body.style.overflow).toBe('')
  })

  it('多余解锁为安全空操作', () => {
    unlockBodyScroll()
    expect(document.body.style.overflow).toBe('')
    lockBodyScroll()
    unlockBodyScroll()
    unlockBodyScroll()
    expect(document.body.style.overflow).toBe('')
  })

  it('锁定前已有内边距时解锁后还原', () => {
    document.body.style.paddingRight = '8px'
    lockBodyScroll()
    unlockBodyScroll()
    expect(document.body.style.paddingRight).toBe('8px')
  })

  it('现代浏览器：锁定上 scrollbar-gutter: stable，不做 body padding 补偿', () => {
    globalThis.CSS = { supports: () => true }
    lockBodyScroll()
    expect(document.documentElement.style.scrollbarGutter).toBe('stable')
    expect(document.body.style.paddingRight).toBe('')
    unlockBodyScroll()
    expect(document.documentElement.style.getPropertyValue('scrollbar-gutter')).toBe('')
  })

  it('gutter 路径：锁定前 html 已有 gutter 值时解锁后还原', () => {
    globalThis.CSS = { supports: () => true }
    document.documentElement.style.scrollbarGutter = 'auto'
    lockBodyScroll()
    expect(document.documentElement.style.scrollbarGutter).toBe('stable')
    unlockBodyScroll()
    expect(document.documentElement.style.scrollbarGutter).toBe('auto')
  })

  it('老浏览器回退：有滚动条宽度时锁定期间补偿 padding-right 并出变量', () => {
    globalThis.CSS = { supports: () => false }
    const original = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true })
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1425,
      configurable: true,
    })
    lockBodyScroll()
    // jsdom 无真实布局：补偿值来自 innerWidth - clientWidth（15px）
    expect(document.body.style.paddingRight).toContain('15px')
    expect(document.body.style.getPropertyValue('--ev-scrollbar-width')).toBe('15px')
    unlockBodyScroll()
    expect(document.body.style.paddingRight).toBe('')
    expect(document.body.style.getPropertyValue('--ev-scrollbar-width')).toBe('')
    Object.defineProperty(window, 'innerWidth', { value: original, configurable: true })
  })
})
