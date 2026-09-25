/**
 * 演示默认布局（M2：工作台装配样本）
 *
 * 树形态见 runtime/layout 契约：dock（left/right/bottom）+ 面板
 * （size/min/max/collapsed/hidden/closable）。persistence 由 EtWorkbench 负责，
 * 这里只给"产品默认布局"——损坏的持久化数据会降级到它（不白屏）。
 */
export const DEMO_DEFAULT_LAYOUT = {
  docks: [
    {
      id: 'left',
      side: 'left',
      panels: [
        { id: 'files', title: '文件', size: 300, min: 220, max: 480, closable: false },
        { id: 'search', title: '搜索', size: 260 },
      ],
    },
    {
      id: 'right',
      side: 'right',
      panels: [{ id: 'props', title: '属性', size: 280, min: 200, max: 420 }],
    },
    {
      id: 'bottom',
      side: 'bottom',
      panels: [{ id: 'log', title: '日志', size: 180, min: 120, max: 360 }],
    },
  ],
  maximized: null,
}

/** 演示文档（EtDocumentTabs 的 documents） */
export const DEMO_DOCUMENTS = [
  { id: 'sheet-1', title: '一季度', dirty: true },
  { id: 'sheet-2', title: '二季度' },
  { id: 'notes', title: '备注', closable: false },
]

/** 面板 id → 演示内容（消费方按 panel.id 映射自己的组件；这里用最简列表） */
export const DEMO_PANEL_CONTENT = {
  files: ['季度报表.xlsx', '预算表.xlsx', '复盘.md'],
  search: ['按名称搜索', '按内容搜索'],
  props: ['字体：苹方', '字号：12', '行高：24'],
  log: ['12:01 打开文档', '12:02 自动保存'],
}
