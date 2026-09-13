import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useLockScroll } from '../src/composables/useLockScroll'

function createHarness() {
  const harness = mount(
    defineComponent({
      setup(_, { expose }) {
        const { lock, unlock } = useLockScroll()
        expose({ lock, unlock })
        return () => h('div')
      },
    })
  )
  return harness
}

describe('useLockScroll / body 滚动锁定', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    document.documentElement.style.removeProperty('scrollbar-gutter')
    document.body.classList.remove('eb-scroll-locked')
  })

  afterEach(() => {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    document.documentElement.style.removeProperty('scrollbar-gutter')
    document.body.classList.remove('eb-scroll-locked')
    delete globalThis.CSS
  })

  it('锁定时 overflow=hidden + eb-scroll-locked，解锁后恢复', () => {
    const harness = createHarness()
    harness.vm.lock()
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.classList.contains('eb-scroll-locked')).toBe(true)
    harness.vm.unlock()
    expect(document.body.style.overflow).toBe('')
    expect(document.body.classList.contains('eb-scroll-locked')).toBe(false)
    harness.unmount()
  })

  it('引用计数：多弹层叠加，最后一个解锁才恢复', () => {
    const a = createHarness()
    const b = createHarness()
    a.vm.lock()
    b.vm.lock()
    expect(document.body.style.overflow).toBe('hidden')
    a.vm.unlock()
    expect(document.body.style.overflow).toBe('hidden')
    b.vm.unlock()
    expect(document.body.style.overflow).toBe('')
    a.unmount()
    b.unmount()
  })

  it('现代浏览器：锁定上 scrollbar-gutter: stable，不做 padding 补偿', () => {
    globalThis.CSS = { supports: () => true }
    const harness = createHarness()
    harness.vm.lock()
    expect(document.documentElement.style.scrollbarGutter).toBe('stable')
    expect(document.body.style.paddingRight).toBe('')
    harness.vm.unlock()
    expect(document.documentElement.style.getPropertyValue('scrollbar-gutter')).toBe('')
    harness.unmount()
  })

  it('老浏览器回退：补偿 padding-right 并出 --eb-scrollbar-width', () => {
    globalThis.CSS = { supports: () => false }
    const original = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true })
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1425,
      configurable: true,
    })
    const harness = createHarness()
    harness.vm.lock()
    expect(document.body.style.paddingRight).toBe('15px')
    expect(document.body.style.getPropertyValue('--eb-scrollbar-width')).toBe('15px')
    harness.vm.unlock()
    expect(document.body.style.paddingRight).toBe('')
    expect(document.body.style.getPropertyValue('--eb-scrollbar-width')).toBe('')
    Object.defineProperty(window, 'innerWidth', { value: original, configurable: true })
    harness.unmount()
  })
})
