import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EtShortcutPanel from '../src/components/shortcut-panel/index.vue'
import EtShortcutHint from '../src/components/shortcut-hint/index.vue'
import { createCommandRegistry } from '../src/runtime/command/registry'

const registry = () => {
  const r = createCommandRegistry()
  r.registerAll([
    { id: 'bold', title: '加粗', keys: 'mod+b', group: '字体', run: () => {} },
    { id: 'italic', title: '倾斜', keys: 'mod+i', group: '字体', run: () => {} },
    { id: 'save', title: '保存', keys: 'mod+s', group: '文件', run: () => {} },
    { id: 'paste', title: '粘贴', group: '剪贴板', run: () => {} },
  ])
  return r
}

describe('EtShortcutPanel — 快捷键一览（单一来源 = 命令表）', () => {
  it('按域分组渲染，跳过无快捷键的命令', () => {
    const wrapper = mount(EtShortcutPanel, { props: { registry: registry(), platform: 'mac' } })
    expect(wrapper.findAll('.et-shortcutpanel__group')).toHaveLength(2)
    expect(wrapper.text()).toContain('加粗')
    expect(wrapper.text()).not.toContain('粘贴')
    // 平台符号化走 EtKeyHint：macOS 的 ⌘B
    expect(wrapper.text()).toContain('⌘B')
  })

  it('win 平台渲染 Ctrl+B', () => {
    const wrapper = mount(EtShortcutPanel, { props: { registry: registry(), platform: 'win' } })
    expect(wrapper.text()).toContain('Ctrl+B')
  })

  it('冲突在面板内展示（登记期可见）', () => {
    const r = createCommandRegistry()
    r.registerAll([
      { id: 'bold', title: '加粗', keys: 'mod+b', run: () => {} },
      { id: 'fake', title: '仿粗', keys: 'cmd+b', run: () => {} },
    ])
    const wrapper = mount(EtShortcutPanel, { props: { registry: r, platform: 'mac' } })
    expect(wrapper.find('.et-shortcutpanel__conflicts').exists()).toBe(true)
    expect(wrapper.text()).toContain('bold / fake')
  })

  it('无快捷键也无冲突时不渲染（空态不留空块）', () => {
    const r = createCommandRegistry()
    r.register({ id: 'paste', title: '粘贴', run: () => {} })
    const wrapper = mount(EtShortcutPanel, { props: { registry: r } })
    expect(wrapper.find('.et-shortcutpanel').exists()).toBe(false)
  })

  it('role=region + aria-label（可被读屏与快捷键面板引用）', () => {
    const wrapper = mount(EtShortcutPanel, { props: { registry: registry() } })
    expect(wrapper.attributes('role')).toBe('region')
    expect(wrapper.attributes('aria-label')).toBe('快捷键一览')
  })
})

describe('EtShortcutHint — 助记键内联提示', () => {
  it('keys + label 都渲染', () => {
    const wrapper = mount(EtShortcutHint, { props: { keys: 'mod+b', label: '加粗', platform: 'mac' } })
    expect(wrapper.text()).toContain('加粗')
    expect(wrapper.text()).toContain('⌘B')
  })

  it('只有 keys 时只渲染键帽', () => {
    const wrapper = mount(EtShortcutHint, { props: { keys: 'esc', platform: 'mac' } })
    expect(wrapper.find('.et-shortcuthint__label').exists()).toBe(false)
    expect(wrapper.text()).toContain('esc')
  })

  it('keys 与 label 都空时整体不渲染', () => {
    const wrapper = mount(EtShortcutHint, { props: { keys: '', label: '' } })
    expect(wrapper.find('.et-shortcuthint').exists()).toBe(false)
  })
})
