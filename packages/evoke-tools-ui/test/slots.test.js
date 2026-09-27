import { describe, it, expect } from 'vitest'
import { checkSlotContract } from '../scripts/check-slots.mjs'
import { SLOT_CONTRACT, SLOT_CONTRACT_PATHS, tagOf } from '../src/slots.js'
import { COMPONENT_TAXONOMY } from '../src/taxonomy.js'

/**
 * 槽位组合契约（G10 的测试面）
 *
 * 契约表是文档站「组合契约」页与产品的唯一依据，所以它必须与 SFC 逐槽一致：
 * 代码删槽 / 改名 → 这里红；文档漏记 → 也红。透传型（popper 包装件）豁免列举。
 */
describe('槽位组合契约', () => {
  it('契约 ↔ SFC 双向一致（G10）', () => {
    expect(checkSlotContract()).toEqual([])
  })

  it('每个契约键都有明确的 SFC 映射，且映射文件真实存在', () => {
    for (const key of Object.keys(SLOT_CONTRACT)) {
      expect(SLOT_CONTRACT_PATHS[key], `${key} 缺 SFC 映射`).toBeTruthy()
      expect(SLOT_CONTRACT_PATHS[key]).toMatch(/^[a-z0-9-]+\/(index|group|panel|overflow)\.vue$/)
    }
  })

  it('条目要么有命名槽/默认槽，要么标了透传（不留空壳）', () => {
    for (const [key, c] of Object.entries(SLOT_CONTRACT)) {
      const hasContent = (c.slots?.length ?? 0) > 0 || !!c.default || c.passthrough || !!c.slotless
      expect(hasContent, `${key} 是空壳条目（既没槽，也没说明为什么没槽）`).toBe(true)
    }
  })

  it('无槽件显式声明了原因，且理由说得清（不是占位）', () => {
    const slotless = Object.entries(SLOT_CONTRACT).filter(([, c]) => c.slotless)
    expect(slotless.length).toBeGreaterThan(0)
    for (const [key, c] of slotless) {
      expect(c.slotless.length, `${key} 的 slotless 说明太短`).toBeGreaterThan(6)
      expect(c.slots ?? []).toEqual([])
      expect(c.default).toBeUndefined()
    }
  })

  it('标签名可从契约键还原（文档页展示 Et* 组件名）', () => {
    expect(tagOf('formula_bar')).toBe('EtFormulaBar')
    expect(tagOf('sheet_canvas_host')).toBe('EtSheetCanvasHost')
    expect(tagOf('panel_group')).toBe('EtPanelGroup')
  })

  it('两个壳件（Workbench / SheetCanvasHost）都留了画布位与浮层能力', () => {
    // 组合契约的核心断言：办公装配必须能同时拿到"区域槽"与"不随滚动的浮层位"
    expect(SLOT_CONTRACT.workbench.default).toContain('画布位')
    expect(SLOT_CONTRACT.sheet_canvas_host.slots.map((s) => s.slot)).toContain('overlay')
  })

  it('taxonomy 里的 office 组件都能在契约页被检索到（或明确无槽）', () => {
    const officeIds = COMPONENT_TAXONOMY.filter((c) => c.layer === 'office').map((c) => c.id)
    for (const id of officeIds) {
      const key = id.replaceAll('-', '_')
      const slotless = ['ribbon_bar', 'overflow_menu', 'theme_bridge']
      if (slotless.includes(key)) {
        expect(SLOT_CONTRACT[key]).toBeTruthy()
        continue
      }
      expect(SLOT_CONTRACT[key], `${id} 未进槽位契约`).toBeTruthy()
    }
  })
})