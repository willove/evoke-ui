/**
 * 演示命令表（tools-ui 计划 M1 的"单一来源"示范）
 *
 * 职能 = 产品层声明：命令定义 + tab/组/条目 schema + 上下文 tab 条件。
 * 框架只提供运行时（注册表 / merge / 剪枝 / 状态机），不认识任何具体命令——
 * "加一个功能 = 加一行数据"（计划 01 §二）。
 *
 * 本文件同时是 G3 命令面门的登记处（scripts/check-command-surface.mjs 读这里的 id）。
 */
import { createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

/** 命令定义（enabled/active 由选区与焦点上下文推演，组件不各自实现） */
export const DEMO_COMMANDS = [
  {
    id: 'copy',
    title: '复制',
    desc: '复制选区到剪贴板',
    keys: 'mod+c',
    icon: 'copy',
    group: '剪贴板',
    surfaces: ['toolbar', 'menu', 'context', 'palette'],
    enabled: (ctx) => !!ctx.hasSelection,
    run: () => {},
  },
  {
    id: 'format-painter',
    title: '格式刷',
    desc: '复制格式并刷到目标',
    icon: 'brush',
    group: '剪贴板',
    surfaces: ['toolbar', 'menu', 'palette'],
    run: () => {},
  },
  {
    id: 'clear',
    title: '清除',
    icon: 'close',
    group: '剪贴板',
    surfaces: ['toolbar'],
    enabled: (ctx) => !!ctx.hasSelection,
    run: () => {},
  },
  {
    id: 'bold',
    title: '加粗',
    keys: 'mod+b',
    icon: 'bold',
    group: '字体',
    surfaces: ['toolbar', 'menu', 'context', 'palette'],
    active: (ctx) => !!ctx.format?.bold,
    run: () => {},
  },
  {
    id: 'italic',
    title: '倾斜',
    keys: 'mod+i',
    icon: 'italic',
    group: '字体',
    surfaces: ['toolbar', 'menu', 'context', 'palette'],
    active: (ctx) => !!ctx.format?.italic,
    run: () => {},
  },
  {
    id: 'underline',
    title: '下划线',
    keys: 'mod+u',
    icon: 'underline',
    group: '字体',
    surfaces: ['toolbar', 'menu', 'palette'],
    run: () => {},
  },
  {
    id: 'font-size',
    title: '字号',
    desc: '设置选区字号',
    group: '字体',
    surfaces: ['toolbar', 'menu', 'palette'],
    run: () => {},
  },
  {
    id: 'search',
    title: '查找',
    keys: 'mod+f',
    icon: 'search',
    group: '编辑',
    surfaces: ['toolbar', 'menu', 'palette'],
    run: () => {},
  },
  {
    id: 'filter',
    title: '筛选',
    icon: 'filter',
    group: '编辑',
    surfaces: ['toolbar', 'menu', 'palette'],
    run: () => {},
  },
  {
    id: 'insert-table',
    title: '插入表格',
    icon: 'table',
    group: '插入',
    surfaces: ['toolbar', 'menu', 'palette'],
    run: () => {},
  },
  {
    id: 'zoom-in',
    title: '放大',
    keys: 'mod+plus',
    icon: 'zoom-in',
    group: '视图',
    surfaces: ['toolbar', 'menu', 'palette'],
    run: () => {},
  },
  {
    id: 'more',
    title: '更多命令',
    icon: 'more',
    group: '视图',
    surfaces: ['palette'],
    run: () => {},
  },
]

/** 演示用注册表（产品侧通常放在 store/composable 里） */
export const demoRegistry = createCommandRegistry()
demoRegistry.registerAll(DEMO_COMMANDS)

/** 工具区 schema：tab → 组 → 条目（gridLayout：rowSpan=2 大钮 / width 输入类控件） */
export const DEMO_RIBBON_SCHEMA = [
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
          { key: 'i-copy', type: 'item', command: 'copy', grid: { rowSpan: 2 } },
          { key: 'i-painter', type: 'item', command: 'format-painter', grid: { rowSpan: 2 } },
          { key: 'i-clear', type: 'item', command: 'clear', grid: { rowSpan: 2 } },
        ],
      },
      {
        key: 'g-font',
        type: 'group',
        label: '字体',
        children: [
          { key: 'i-bold', type: 'item', command: 'bold', grid: { rowSpan: 2 } },
          { key: 'i-italic', type: 'item', command: 'italic', grid: { rowSpan: 2 } },
          { key: 'i-underline', type: 'item', command: 'underline', grid: { rowSpan: 2 } },
          { key: 'i-font-size', type: 'select', command: 'font-size', width: 96 },
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
        children: [{ key: 'i-table', type: 'item', command: 'insert-table', grid: { rowSpan: 2 } }],
      },
      {
        key: 'g-view',
        type: 'group',
        label: '视图',
        children: [
          { key: 'i-zoom', type: 'item', command: 'zoom-in', grid: { rowSpan: 2 } },
          { key: 'i-search', type: 'item', command: 'search', grid: { rowSpan: 2 } },
        ],
      },
    ],
  },
]

/** 右键菜单 schema（分区 = separator 节点） */
export const DEMO_CONTEXT_SCHEMA = [
  { key: 'c-copy', type: 'item', command: 'copy' },
  { key: 'c-painter', type: 'item', command: 'format-painter' },
  { key: 'c-sep', type: 'separator' },
  { key: 'c-bold', type: 'item', command: 'bold' },
  { key: 'c-italic', type: 'item', command: 'italic' },
]

/** 上下文 tab：选到图/表时才唤出（声明式，条件消失即退场） */
export const DEMO_CONTEXT_TABS = [
  { id: 'pic-format', label: '图片格式', when: (ctx) => ctx.selection === 'picture' },
  { id: 'table-design', label: '表设计', when: (ctx) => ctx.selection === 'table' },
]
