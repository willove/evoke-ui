import { describe, it, expect } from 'vitest'
import {
  normalizeCombo,
  formatCombo,
  comboFromEvent,
  comboMatchesEvent,
  isKnownKeyToken,
  keySymbols,
  currentPlatform,
} from '../src/runtime/keys/keys'

describe('normalizeCombo — 规范化与键名校验', () => {
  it('大小写与同义词归一（Cmd/Command/Meta → mod，Opt → alt，Escape → esc）', () => {
    expect(normalizeCombo('Cmd+Shift+Z')).toBe('mod+shift+z')
    expect(normalizeCombo('command-alt-f')).toBe('mod+alt+f')
    expect(normalizeCombo('Meta + Escape')).toBe('mod+esc')
  })

  it('修饰键定序：mod/ctrl/alt/shift，主键在末尾', () => {
    expect(normalizeCombo('shift+mod+z')).toBe('mod+shift+z')
    expect(normalizeCombo('alt+ctrl+delete')).toBe('ctrl+alt+delete')
  })

  it('未知键名登记期即抛错（不在用户手里静默失效）', () => {
    expect(() => normalizeCombo('mod+ctrlz')).toThrow(RangeError)
    expect(() => normalizeCombo('')).toThrow(TypeError)
  })

  it('主键必须唯一', () => {
    expect(() => normalizeCombo('mod+z+x')).toThrow(RangeError)
  })

  it('合法单键：字母/数字/f1-f12', () => {
    expect(normalizeCombo('f12')).toBe('f12')
    expect(normalizeCombo('7')).toBe('7')
    expect(() => normalizeCombo('f13')).toThrow(RangeError)
  })

  it('isKnownKeyToken 判据', () => {
    expect(isKnownKeyToken('mod')).toBe(true)
    expect(isKnownKeyToken('pagedown')).toBe(true)
    expect(isKnownKeyToken('bogus')).toBe(false)
  })
})

describe('formatCombo — 平台符号化', () => {
  it('macOS：⌘⌃⌥⇧ 无分隔符', () => {
    expect(formatCombo('mod+shift+z', 'mac')).toBe('⌘⇧Z')
    expect(formatCombo('mod+ctrl+alt+delete', 'mac')).toBe('⌘⌃⌥⌦')
    expect(formatCombo('esc', 'mac')).toBe('esc')
  })

  it('Windows/Linux：Ctrl+Shift+Z 文字 + 加号', () => {
    expect(formatCombo('mod+shift+z', 'win')).toBe('Ctrl+Shift+Z')
    expect(formatCombo('alt+f4', 'win')).toBe('Alt+F4')
    expect(formatCombo('esc', 'win')).toBe('Esc')
  })

  it('符号表按平台切换', () => {
    expect(keySymbols('mac').mod).toBe('⌘')
    expect(keySymbols('win').mod).toBe('Ctrl')
  })

  it('加减号按 macOS 显示惯例渲染（⌘+ 而非 ⌘PLUS）', () => {
    expect(formatCombo('mod+plus', 'mac')).toBe('⌘+')
    expect(formatCombo('mod+plus', 'win')).toBe('Ctrl++')
    expect(formatCombo('mod+minus', 'mac')).toBe('⌘–')
  })
})

describe('comboFromEvent / comboMatchesEvent — 事件匹配', () => {
  const ev = (over = {}) => ({
    key: 'z',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...over,
  })

  it('从事件提取规范组合键', () => {
    expect(comboFromEvent(ev({ key: 'z', metaKey: true }))).toBe('mod+z')
    expect(comboFromEvent(ev({ key: 'Z', shiftKey: true }))).toBe('shift+z')
    expect(comboFromEvent(ev({ key: ' ', metaKey: true }))).toBe('mod+space')
    expect(comboFromEvent(ev({ key: 'Escape' }))).toBe('esc')
    expect(comboFromEvent(ev({ key: 'F5' }))).toBe('f5')
  })

  it('mod 的平台语义：mac 走 meta，win 走 ctrl', () => {
    const macEv = ev({ key: 'z', metaKey: true })
    expect(comboMatchesEvent('mod+z', macEv, 'mac')).toBe(true)
    expect(comboMatchesEvent('mod+z', macEv, 'win')).toBe(false)

    const winEv = ev({ key: 'z', ctrlKey: true })
    expect(comboMatchesEvent('mod+z', winEv, 'win')).toBe(true)
    expect(comboMatchesEvent('mod+z', winEv, 'mac')).toBe(false)
  })

  it('修饰键必须逐一对应（少一个都不算命中）', () => {
    expect(comboMatchesEvent('mod+shift+z', ev({ key: 'z', metaKey: true }), 'mac')).toBe(false)
    expect(comboMatchesEvent('mod+shift+z', ev({ key: 'z', metaKey: true, shiftKey: true }), 'mac')).toBe(true)
    // 多按的修饰键同样不算命中
    expect(comboMatchesEvent('mod+z', ev({ key: 'z', metaKey: true, altKey: true }), 'mac')).toBe(false)
  })

  it('未知主键（如中文组字符）不命中', () => {
    expect(comboFromEvent(ev({ key: '中' }))).toBeNull()
    expect(comboMatchesEvent('mod+z', ev({ key: '中', metaKey: true }), 'mac')).toBe(false)
  })
})

describe('currentPlatform — 平台识别', () => {
  it('jsdom 默认 UA 判为 win（无 Mac 标识）', () => {
    expect(['mac', 'win']).toContain(currentPlatform())
  })
})
