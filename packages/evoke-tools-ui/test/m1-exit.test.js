import { describe, it, expect } from 'vitest'
import {
  DEMO_COMMANDS,
  DEMO_RIBBON_SCHEMA,
  DEMO_CONTEXT_SCHEMA,
  demoRegistry,
} from '../../../examples/tools-workbench/src/commands'
import {
  buildReachabilityReport,
  checkVisibleBudget,
  findDanglingCommandRefs,
  detectKeyConflicts,
} from '../src/runtime/index'

/**
 * M1 出口条件的契约层核对（07-里程碑 M1：
 * 「一次操作四处可达且状态一致（自动检查，覆盖率 100%）」。
 * 用演示命令表当样本：注册的每条命令都必须至少出现在一个可达面。
 */
describe('M1 出口：一次操作四处可达（演示命令表样本）', () => {
  it('每条注册命令都可达（unreachable 为空）', () => {
    const report = buildReachabilityReport({
      registry: demoRegistry,
      schemas: { toolbar: DEMO_RIBBON_SCHEMA, menu: DEMO_RIBBON_SCHEMA, context: DEMO_CONTEXT_SCHEMA },
      paletteAdapter: true,
    })
    expect(report.total).toBe(DEMO_COMMANDS.length)
    expect(report.reachable).toBe(report.total)
    expect(report.unreachable).toEqual([])
  })

  it('schema 无悬空引用（G3 ①）', () => {
    expect(findDanglingCommandRefs(DEMO_RIBBON_SCHEMA, demoRegistry)).toEqual([])
    expect(findDanglingCommandRefs(DEMO_CONTEXT_SCHEMA, demoRegistry)).toEqual([])
  })

  it('可见量守约：整条 ≤70 / 每组 ≤7 / 每 tab 组 ≤6', () => {
    expect(checkVisibleBudget(DEMO_RIBBON_SCHEMA).ok).toBe(true)
  })

  it('命令表无键位冲突（登记期就该发现）', () => {
    expect(detectKeyConflicts(demoRegistry)).toEqual([])
  })

  it('带快捷键的命令其 keys 已规范化', () => {
    for (const cmd of demoRegistry.list()) {
      if (cmd.keys) expect(cmd.keys).toMatch(/^mod\+|^[a-z0-9]/)
    }
  })
})
