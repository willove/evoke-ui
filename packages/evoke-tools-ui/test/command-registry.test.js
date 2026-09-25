import { describe, it, expect } from 'vitest'
import {
  COMMAND_SURFACES,
  assertCommand,
  resolveCommandState,
  createCommandRegistry,
  buildReachabilityReport,
  collectSchemaCommandIds,
} from '../src/runtime/command/registry'

const sample = () => ({
  id: 'bold',
  title: '加粗',
  keys: 'mod+b',
  surfaces: ['toolbar', 'menu', 'context', 'palette'],
  run: () => {},
})

describe('命令定义校验（登记期即炸）', () => {
  it('合法命令登记并补全 keys', () => {
    expect(assertCommand(sample())).toBe('mod+b')
  })

  it('id 必须 kebab-case', () => {
    expect(() => assertCommand({ ...sample(), id: 'Bold' })).toThrow(TypeError)
    expect(() => assertCommand({ ...sample(), id: '' })).toThrow(TypeError)
  })

  it('缺 run 抛错（"加一个功能 = 加一行数据"）', () => {
    const bad = { ...sample() }
    delete bad.run
    expect(() => assertCommand(bad)).toThrow(TypeError)
  })

  it('surfaces 越界抛错', () => {
    expect(() => assertCommand({ ...sample(), surfaces: ['hovercard'] })).toThrow(RangeError)
    expect(COMMAND_SURFACES).toEqual(['toolbar', 'menu', 'context', 'palette'])
  })

  it('快捷键拼写错误登记期抛（键位表同套规范化）', () => {
    expect(() => assertCommand({ ...sample(), keys: 'mod+bogus' })).toThrow(RangeError)
    expect(assertCommand({ ...sample(), keys: 'Cmd+B' })).toBe('mod+b')
  })
})

describe('注册表', () => {
  it('重复注册抛错（一个命令一处定义）', () => {
    const r = createCommandRegistry()
    r.register(sample())
    expect(() => r.register(sample())).toThrow(/重复注册/)
  })

  it('未注册命令 state 返回 known=false 且不可用', () => {
    const r = createCommandRegistry()
    expect(r.state('nope')).toEqual({ known: false, enabled: false, active: false })
    expect(r.run('nope')).toBe(false)
  })

  it('enabled/active 由命令自身推演，寄存器只做唯一转发', () => {
    const r = createCommandRegistry()
    r.register({ ...sample(), enabled: (ctx) => ctx.hasSelection, active: (ctx) => ctx.isBold })
    expect(r.state('bold', { hasSelection: false }).enabled).toBe(false)
    expect(r.state('bold', { hasSelection: true, isBold: true }).active).toBe(true)
  })

  it('run 受 enabled 约束', () => {
    const r = createCommandRegistry()
    let ran = 0
    r.register({ ...sample(), enabled: () => false, run: () => ran++ })
    expect(r.run('bold')).toBe(false)
    expect(ran).toBe(0)
    const r2 = createCommandRegistry()
    r2.register({ ...sample(), run: () => ran++ })
    expect(r2.run('bold')).toBe(true)
    expect(ran).toBe(1)
  })

  it('resolveCommandState 缺省 enabled=true / active=false', () => {
    expect(resolveCommandState(sample())).toEqual({ enabled: true, active: false })
  })
})

describe('可达面报告（M1 出口：一次操作四处可达）', () => {
  const registryWith = (cmds) => {
    const r = createCommandRegistry()
    r.registerAll(cmds)
    return r
  }

  it('schema 引用 + palette 适配即判可达', () => {
    const r = registryWith([
      sample(),
      { ...sample(), id: 'italic', keys: 'mod+i', surfaces: ['toolbar'] },
      { ...sample(), id: 'undo', keys: 'mod+z', surfaces: ['menu'] },
    ])
    const report = buildReachabilityReport({
      registry: r,
      schemas: { toolbar: [{ key: 'g', type: 'group', children: [{ key: 'b', type: 'item', command: 'bold' }] }] },
    })
    expect(report.unreachable).toEqual([])
    expect(report.reachable).toBe(3)
  })

  it('没有任何引用的命令进 unreachable', () => {
    const r = registryWith([sample(), { ...sample(), id: 'orphan' }])
    const report = buildReachabilityReport({ registry: r, schemas: { toolbar: [] }, paletteAdapter: false })
    expect(report.unreachable.map((u) => u.id)).toEqual(['bold', 'orphan'])
  })

  it('关掉 palette 适配时只信 schema 引用', () => {
    const r = registryWith([sample()])
    const report = buildReachabilityReport({ registry: r, schemas: {}, paletteAdapter: false })
    expect(report.unreachable.map((u) => u.id)).toEqual(['bold'])
  })

  it('collectSchemaCommandIds 递归去重保序', () => {
    const ids = collectSchemaCommandIds([
      {
        key: 'home',
        type: 'tab',
        children: [
          { key: 'g1', type: 'group', children: [{ key: 'b', type: 'item', command: 'bold' }] },
          { key: 'g2', type: 'group', children: [{ key: 'i', type: 'item', command: 'italic' }, { key: 'b2', type: 'item', command: 'bold' }] },
        ],
      },
    ])
    expect(ids).toEqual(['bold', 'italic'])
  })
})
