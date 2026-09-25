import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EtKeyHint from '../src/components/key-hint/index.vue'
import EtDivider from '../src/components/divider/index.vue'
import EtToolSpacer from '../src/components/tool-spacer/index.vue'

describe('EtKeyHint — 快捷键文本（平台符号化）', () => {
  it('macOS：⌘⇧Z 无分隔符', () => {
    const wrapper = mount(EtKeyHint, { props: { combo: 'mod+shift+z', platform: 'mac' } })
    expect(wrapper.text()).toBe('⌘⇧Z')
    expect(wrapper.classes()).toContain('et-keyhint--mac')
  })

  it('Windows：Ctrl+Shift+Z', () => {
    const wrapper = mount(EtKeyHint, { props: { combo: 'mod+shift+z', platform: 'win' } })
    expect(wrapper.text()).toBe('Ctrl+Shift+Z')
  })

  it('combo 为空不渲染文本（调用方按需显隐）', () => {
    const wrapper = mount(EtKeyHint, { props: { combo: '', platform: 'mac' } })
    expect(wrapper.text()).toBe('')
  })

  it('同义词归一：Cmd+Alt+F → ⌘⌥F', () => {
    const wrapper = mount(EtKeyHint, { props: { combo: 'cmd+alt+f', platform: 'mac' } })
    expect(wrapper.text()).toBe('⌘⌥F')
  })
})

describe('EtDivider — 工具区分隔', () => {
  it('默认竖线 + large 长度档', () => {
    const wrapper = mount(EtDivider)
    expect(wrapper.classes()).toContain('et-divider--vertical')
    expect(wrapper.classes()).toContain('et-divider--large')
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
    expect(wrapper.attributes('role')).toBe('separator')
  })

  it('长度档可切：small / row / horizontal', () => {
    expect(mount(EtDivider, { props: { length: 'small' } }).classes()).toContain('et-divider--small')
    expect(mount(EtDivider, { props: { length: 'row' } }).classes()).toContain('et-divider--row')
    const h = mount(EtDivider, { props: { direction: 'horizontal' } })
    expect(h.classes()).toContain('et-divider--horizontal')
    expect(h.attributes('aria-orientation')).toBe('horizontal')
  })
})

describe('EtToolSpacer — 弹性占位', () => {
  it('对读屏隐藏，方向可切', () => {
    const wrapper = mount(EtToolSpacer)
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(mount(EtToolSpacer, { props: { direction: 'vertical' } }).classes()).toContain(
      'et-toolspacer--vertical',
    )
  })
})
