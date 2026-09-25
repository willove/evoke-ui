import { describe, it, expect } from 'vitest'
import {
  assertSchemaNode,
  mergeSchema,
  pruneSchema,
  collectCommandRefs,
  findDanglingCommandRefs,
  flattenSchema,
  checkVisibleBudget,
} from '../src/runtime/menu/schema'
import { createCommandRegistry } from '../src/runtime/command/registry'

const baseSchema = [
  {
    key: 'home',
    type: 'tab',
    label: '开始',
    children: [
      {
        key: 'g-clipboard',
        type: 'group',
        label: '剪贴板',
        children: [
          { key: 'paste', type: 'item', command: 'paste' },
          { key: 'copy', type: 'item', command: 'copy' },
        ],
      },
      {
        key: 'g-font',
        type: 'group',
        label: '字体',
        children: [
          { key: 'bold', type: 'item', command: 'bold', grid: { rowSpan: 2 } },
          { key: 'italic', type: 'item', command: 'italic' },
          { key: 'font-size', type: 'select', command: 'font-size', width: 96 },
        ],
      },
    ],
  },
  {
    key: 'insert',
    type: 'tab',
    label: '插入',
    children: [
      {
        key: 'g-table',
        type: 'group',
        label: '表格',
        children: [{ key: 'table', type: 'item', command: 'table' }],
      },
    ],
  },
]

const registryWith = (ids) => {
  const r = createCommandRegistry()
  for (const id of ids) r.register({ id, run: () => {} })
  return r
}

describe('schema 节点校验', () => {
  it('type 越界抛错', () => {
    expect(() => assertSchemaNode({ key: 'x', type: 'button' })).toThrow(RangeError)
  })

  it('item 必须绑 command', () => {
    expect(() => assertSchemaNode({ key: 'x', type: 'item' })).toThrow(TypeError)
  })

  it('select 的 width 必须数字', () => {
    expect(() => assertSchemaNode({ key: 'x', type: 'select', command: 'c', width: '96' })).toThrow(TypeError)
  })
})

describe('mergeSchema — 按 key 路径 merge', () => {
  it('同 key 递归合并、标量覆盖、新 key 追加到层尾', () => {
    const merged = mergeSchema(baseSchema, [
      {
        key: 'home',
        type: 'tab',
        label: '主页',
        children: [
          { key: 'g-clipboard', type: 'group', children: [{ key: 'cut', type: 'item', command: 'cut' }] },
          { key: 'g-view', type: 'group', label: '视图', children: [{ key: 'zoom', type: 'item', command: 'zoom' }] },
        ],
      },
    ])
    const home = merged.find((t) => t.key === 'home')
    expect(home.label).toBe('主页')
    const groups = home.children.map((g) => g.key)
    expect(groups).toEqual(['g-clipboard', 'g-font', 'g-view'])
    expect(home.children[0].children.map((c) => c.key)).toEqual(['paste', 'copy', 'cut'])
  })

  it('remove: true 删子树', () => {
    const merged = mergeSchema(baseSchema, [{ key: 'insert', type: 'tab', remove: true }])
    expect(merged.map((t) => t.key)).toEqual(['home'])
  })

  it('输入不被修改（merge 返回新树）', () => {
    const snapshot = JSON.stringify(baseSchema)
    mergeSchema(baseSchema, [{ key: 'home', type: 'tab', label: '改' }])
    expect(JSON.stringify(baseSchema)).toBe(snapshot)
  })

  it('同层重复 key 抛错', () => {
    expect(() =>
      mergeSchema(baseSchema, [
        { key: 'home', type: 'tab', children: [{ key: 'a', type: 'item', command: 'x' }, { key: 'a', type: 'item', command: 'y' }] },
      ]),
    ).toThrow(/重复 key/)
  })

  it('单节点（非数组）merge 也成立', () => {
    const merged = mergeSchema(baseSchema[0], { key: 'home', type: 'tab', label: 'H' })
    expect(merged.label).toBe('H')
  })
})

describe('pruneSchema — 空节点剪枝与悬空登记', () => {
  const registry = registryWith(['paste', 'copy', 'bold'])

  it('剪掉 children 耗空的组与 tab', () => {
    const patch = mergeSchema(baseSchema, [
      {
        key: 'insert',
        type: 'tab',
        children: [{ key: 'g-table', type: 'group', children: [{ key: 'table', type: 'item', command: 'table', remove: true }] }],
      },
    ])
    const { schema, removed } = pruneSchema(patch, { registry })
    expect(removed).toContain('g-table')
    expect(removed).toContain('insert')
    expect(schema.map((t) => t.key)).toEqual(['home'])
  })

  it('悬空引用被登记；dropUnregistered 时连同悬空 item 一起剪', () => {
    const { dangling } = pruneSchema(baseSchema, { registry })
    expect(dangling).toEqual(['italic → italic', 'font-size → font-size', 'table → table'])
    const dropped = pruneSchema(baseSchema, { registry, dropUnregistered: true })
    const font = dropped.schema[0].children[1]
    expect(font.children.map((c) => c.key)).toEqual(['bold'])
  })
})

describe('查询类函数', () => {
  it('collectCommandRefs 给出路径', () => {
    const refs = collectCommandRefs(baseSchema)
    expect(refs[0]).toEqual({ path: '/home/g-clipboard/paste', commandId: 'paste' })
  })

  it('findDanglingCommandRefs 只报未注册的', () => {
    const registry = registryWith(['paste', 'copy', 'bold', 'italic', 'font-size', 'table'])
    expect(findDanglingCommandRefs(baseSchema, registry)).toEqual([])
    const partial = registryWith(['paste'])
    expect(findDanglingCommandRefs(baseSchema, partial)).toHaveLength(5)
  })

  it('flattenSchema 拍平成「tab × 组」', () => {
    const groups = flattenSchema(baseSchema)
    expect(groups.map((g) => `${g.tab}/${g.group.key}`)).toEqual(['home/g-clipboard', 'home/g-font', 'insert/g-table'])
  })

  it('checkVisibleBudget：每组 ≤7 / 整条 ≤70 / 每 tab 组 ≤6', () => {
    expect(checkVisibleBudget(baseSchema).ok).toBe(true)
    const fat = [
      {
        key: 't',
        type: 'tab',
        children: [
          {
            key: 'g',
            type: 'group',
            children: Array.from({ length: 8 }, (_, i) => ({ key: `i${i}`, type: 'item', command: `c${i}` })),
          },
        ],
      },
    ]
    const r = checkVisibleBudget(fat)
    expect(r.ok).toBe(false)
    expect(r.violations[0]).toMatch(/组 g 可见条目 8 > 7/)
  })
})
