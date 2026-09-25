import { describe, it, expect } from 'vitest'
import { buildShortcutTable, detectKeyConflicts, findCommandByCombo } from '../src/runtime/shortcuts/index'
import { createCommandRegistry } from '../src/runtime/command/registry'

const registry = () => {
  const r = createCommandRegistry()
  r.registerAll([
    { id: 'bold', title: '加粗', keys: 'mod+b', group: '字体', run: () => {} },
    { id: 'italic', title: '倾斜', keys: 'mod+i', group: '字体', run: () => {} },
    { id: 'save', title: '保存', keys: 'mod+s', group: '文件', run: () => {} },
    { id: 'paste', title: '粘贴', run: () => {} }, // 无快捷键
  ])
  return r
}

describe('buildShortcutTable — 从命令表生成键位表（单一来源）', () => {
  it('按域分组、跳过无快捷键的命令', () => {
    const table = buildShortcutTable(registry(), 'mac')
    expect(table.map((g) => g.group)).toEqual(['字体', '文件'])
    expect(table[0].items).toEqual([
      { id: 'bold', title: '加粗', combo: 'mod+b', display: '⌘B' },
      { id: 'italic', title: '倾斜', combo: 'mod+i', display: '⌘I' },
    ])
    expect(table.flatMap((g) => g.items).map((i) => i.id)).not.toContain('paste')
  })

  it('平台符号化：win 用 Ctrl+', () => {
    const table = buildShortcutTable(registry(), 'win')
    expect(table[0].items[0].display).toBe('Ctrl+B')
  })
})

describe('detectKeyConflicts — 登记期红', () => {
  it('无冲突返回空', () => {
    expect(detectKeyConflicts(registry())).toEqual([])
  })

  it('同组合键两条命令 = 冲突', () => {
    const r = createCommandRegistry()
    r.registerAll([
      { id: 'bold', keys: 'mod+b', run: () => {} },
      { id: 'fake-bold', keys: 'cmd+b', run: () => {} },
    ])
    expect(detectKeyConflicts(r)).toEqual([{ combo: 'mod+b', ids: ['bold', 'fake-bold'] }])
  })
})

describe('findCommandByCombo — 键位绑定的运行时匹配', () => {
  it('规范化后匹配', () => {
    expect(findCommandByCombo(registry(), 'Cmd+B').id).toBe('bold')
    expect(findCommandByCombo(registry(), 'mod+q')).toBeNull()
  })
})
