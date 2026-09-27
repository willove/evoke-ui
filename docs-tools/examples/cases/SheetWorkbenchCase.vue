<template>
  <!-- 案例：电子表格工作台 —— 标题栏 + 文档标签 + 功能区 + 双停靠 + 网格画布 + 状态栏 -->
  <div class="case-sheet">
    <et-workbench
      v-model:layout="layout"
      :default-layout="DEFAULT_LAYOUT"
      persist-key="case-sheet-layout"
      @layout-corrupted="onCorrupted"
    >
      <template #titlebar>
        <et-title-bar title="表格工作台" doc-title="季度报表.xlsx" @window-control="onWindowControl" />
      </template>

      <template #documents>
        <et-document-tabs v-model="activeDoc" :documents="documents" @close="onDocClose" @change="onDocChange" />
      </template>

      <template #toolbar>
        <et-ribbon-bar
          v-model="activeTab"
          v-model:collapsed="collapsed"
          :schema="RIBBON_SCHEMA"
          :registry="registry"
          :ctx="ctx"
          persist-key="case-sheet-ribbon"
          @command="onCommand"
        />
        <et-formula-bar
          v-model="formulaText"
          :reference="reference"
          placeholder="输入内容或公式"
          @submit="onFormulaSubmit"
        >
          <template #actions>
            <span class="case-sheet__tip">Ctrl+F1 折叠功能区</span>
            <et-tool-button size="small" icon="function-line" label="插入函数" @click="onInsertFunction" />
          </template>
        </et-formula-bar>
      </template>

      <template #panel="{ panel }">
        <et-scroll-area direction="vertical" class="case-sheet__panel">
          <template v-if="panel.id === 'sheets'">
            <button
              v-for="s in SHEETS"
              :key="s"
              type="button"
              class="case-sheet__sheet"
              :class="{ 'is-active': s === activeSheet }"
              @click="activeSheet = s"
            >{{ s }}</button>
          </template>
          <ul v-else class="case-sheet__list">
            <li v-for="line in PANEL_NOTE[panel.id] ?? []" :key="line">{{ line }}</li>
          </ul>
        </et-scroll-area>
      </template>

      <et-theme-bridge />
      <et-context-menu :registry="registry" :schema="CONTEXT_SCHEMA" :ctx="ctx">
        <et-sheet-canvas-host
          class="case-sheet__host"
              label="工作表"
              :content-width="0"
              :content-height="0"
              @scroll="onCanvasScroll"
            >
              <div ref="gridRef" class="case-sheet__grid" tabindex="0" @keydown="onGridKeydown">
            <div class="case-sheet__corner" />
            <div v-for="c in COLS" :key="`h${c}`" class="case-sheet__colhead" :class="{ 'is-sel': sel.c === c }">{{ c }}</div>
            <template v-for="r in ROWS" :key="`r${r}`">
              <div class="case-sheet__rowhead" :class="{ 'is-sel': sel.r === r }">{{ r }}</div>
              <div
                v-for="c in COLS"
                :key="`${r}${c}`"
                class="case-sheet__cell"
                :class="{
                  'is-sel': sel.r === r && sel.c === c,
                  'is-bold': isBold(r, c),
                  'is-italic': isItalic(r, c),
                  'is-frozen': frozen && r === 1,
                }"
                @click="selectCell(r, c)"
              >{{ CELLS[r]?.[c] ?? '' }}</div>
                </template>
              </div>
              <template #overlay>
                <span v-if="frozen" class="case-sheet__frozen-chip">已冻结首行</span>
              </template>
            </et-sheet-canvas-host>
      </et-context-menu>

      <!-- 内容页签带：Workbench 的 #tabbar 槽（与顶部 #documents 对称） -->
      <template #tabbar>
        <et-sheet-tabs v-model="activeSheet" :tabs="sheetTabs" @add="onAddSheet" />
      </template>

      <template #statusbar>
        <et-status-bar :items="statusItems" zoom="100%" @item-click="onStatusClick" />
      </template>
    </et-workbench>

    <et-toast v-model="toast.open" :message="toast.message" type="success" :duration="2200" />
  </div>
</template>

<script setup>
/**
 * 案例：电子表格工作台（消费方形态）
 *
 * 全部 chrome 走 et-*：命令表驱动工具区、停靠树持久化、文档标签、右键与状态栏。
 * 网格是产品内容（这里用最小实现替身）：点选单元格 → 选区/求和进状态栏，
 * 方向键移动选区，加粗/倾斜落在单元格上，冻结首行由工具区命令开关。
 */
import { computed, reactive, ref } from 'vue'
import { createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const COLS = ['A', 'B', 'C', 'D', 'E', 'F']
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8]
/** 单元格数据：reactive（清除命令直接删键，视图要跟着变） */
const CELLS = reactive({
  1: { A: '区域', B: '一月', C: '二月', D: '三月', E: '合计', F: '达成率' },
  2: { A: '华东', B: '128', C: '146', D: '152', E: '426', F: '106%' },
  3: { A: '华南', B: '96', C: '104', D: '118', E: '318', F: '98%' },
  4: { A: '华北', B: '88', C: '92', D: '110', E: '290', F: '94%' },
  5: { A: '西南', B: '64', C: '78', D: '86', E: '228', F: '91%' },
  6: { A: '合计', B: '376', C: '420', D: '466', E: '1262', F: '100%' },
})
const SHEETS = ['报表数据', '透视源', '口径说明']
const PANEL_NOTE = {
  sheets: ['点击上方工作表切换（演示）'],
  outline: ['A1:F6 数据区', '第 1 行：表头', '第 6 行：合计行'],
}
const DEFAULT_LAYOUT = {
  docks: [
    {
      id: 'left',
      side: 'left',
      presentation: 'tabs',
      panels: [
        { id: 'sheets', title: '工作表', size: 180, min: 140, max: 260 },
        { id: 'outline', title: '大纲', size: 180, min: 140, max: 260 },
      ],
    },
  ],
  maximized: null,
}

const layout = ref(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))
const activeDoc = ref('q1')
const documents = ref([
  { id: 'q1', title: '季度报表.xlsx', dirty: true },
  { id: 'budget', title: '预算表.xlsx' },
  { id: 'readme', title: '口径说明.md', closable: false },
])
const activeTab = ref('home')
const collapsed = ref(false)
const activeSheet = ref(SHEETS[0])
const frozen = ref(false)
const sel = reactive({ r: 2, c: 'B' })
const formats = reactive({ bold: new Set(), italic: new Set() })
const toast = reactive({ open: false, message: '' })

const cellKey = (r, c) => `${r}${c}`

/** 公式栏：引用位读选区、编辑区可写（提交后进状态栏回执） */
const reference = computed(() => `${sel.c}${sel.r}`)
const formulaText = ref('=SUM(B2:B7)')
function onFormulaSubmit(value) {
  toast.message = `已录入 ${reference.value}：${value}`
  toast.open = true
}
function onInsertFunction() {
  formulaText.value = `=SUM(${sel.c}2:${sel.c}7)`
}

/** 底带表页签（办公形态）：id 与面板里的表名同源 */
const sheetTabs = computed(() => SHEETS.map((label) => ({ id: label, label })))
function onAddSheet() {
  toast.message = '已请求新增工作表'
  toast.open = true
}

/** 画布宿主：滚动量只用于状态栏回执（真实产品按它算可见区） */
const canvasScroll = reactive({ left: 0, top: 0 })
function onCanvasScroll({ scrollLeft, scrollTop }) {
  canvasScroll.left = scrollLeft
  canvasScroll.top = scrollTop
}
const isBold = (r, c) => formats.bold.has(cellKey(r, c))
const isItalic = (r, c) => formats.italic.has(cellKey(r, c))

/** 选区上下文：喂给 registry.state —— enabled/active 全从这一份推演 */
const ctx = computed(() => ({
  hasCell: Boolean(CELLS[sel.r]?.[sel.c]),
  bold: isBold(sel.r, sel.c),
  italic: isItalic(sel.r, sel.c),
  frozen: frozen.value,
}))

const colSum = computed(() => {
  let sum = 0
  for (const r of ROWS) {
    const v = Number(CELLS[r]?.[sel.c])
    if (Number.isFinite(v) && r !== ROWS[0]) sum += v
  }
  return sum
})


const statusItems = computed(() => [
  { key: 'sel', label: '选区', value: `${sel.c}${sel.r}` },
  { key: 'value', label: '值', value: CELLS[sel.r]?.[sel.c] ?? '空' },
  { key: 'sum', label: '求和', value: String(colSum.value) },
  { key: 'sheet', label: '工作表', value: activeSheet.value },
  { key: 'scroll', label: '滚动', value: `${Math.round(canvasScroll.left)}, ${Math.round(canvasScroll.top)}` },
])

const registry = createCommandRegistry()
registry.registerAll([
  { id: 'copy', title: '复制', keys: 'mod+c', icon: 'copy', group: '剪贴板',
    surfaces: ['toolbar', 'context', 'palette'], enabled: (c) => c.hasCell, run: () => {} },
  { id: 'clear', title: '清除内容', icon: 'eraser', group: '剪贴板',
    surfaces: ['toolbar', 'context', 'palette'], enabled: (c) => c.hasCell, run: () => { delete CELLS[sel.r][sel.c] } },
  { id: 'bold', title: '加粗', keys: 'mod+b', icon: 'bold', group: '字体',
    surfaces: ['toolbar', 'palette'], active: (c) => c.bold, run: () => toggleFormat('bold') },
  { id: 'italic', title: '倾斜', keys: 'mod+i', icon: 'italic', group: '字体',
    surfaces: ['toolbar', 'palette'], active: (c) => c.italic, run: () => toggleFormat('italic') },
  { id: 'freeze', title: '冻结首行', icon: 'lock', group: '视图',
    surfaces: ['toolbar', 'palette'], active: (c) => c.frozen, run: () => { frozen.value = !frozen.value } },
  { id: 'export', title: '导出 CSV', icon: 'download', group: '导出',
    surfaces: ['toolbar', 'palette'], run: () => {} },
])

const RIBBON_SCHEMA = [
  {
    key: 'home',
    type: 'tab',
    label: '开始',
    children: [
      { key: 'g-clip', type: 'group', label: '剪贴板', children: [
        { key: 'i-copy', type: 'item', command: 'copy', grid: { rowSpan: 2 } },
        { key: 'i-clear', type: 'item', command: 'clear', grid: { rowSpan: 2 } },
      ] },
      { key: 'g-font', type: 'group', label: '字体', children: [
        { key: 'i-bold', type: 'item', command: 'bold', grid: { rowSpan: 2 } },
        { key: 'i-italic', type: 'item', command: 'italic', grid: { rowSpan: 2 } },
      ] },
    ],
  },
  {
    key: 'view',
    type: 'tab',
    label: '视图',
    children: [
      { key: 'g-view', type: 'group', label: '窗口', children: [
        { key: 'i-freeze', type: 'item', command: 'freeze', grid: { rowSpan: 2 } },
      ] },
      { key: 'g-export', type: 'group', label: '导出', children: [
        { key: 'i-export', type: 'item', command: 'export', grid: { rowSpan: 2 } },
      ] },
    ],
  },
]

const CONTEXT_SCHEMA = [
  { key: 'c-copy', type: 'item', command: 'copy' },
  { key: 'c-clear', type: 'item', command: 'clear' },
  { key: 'c-sep', type: 'separator' },
  { key: 'c-bold', type: 'item', command: 'bold' },
]

function selectCell(r, c) {
  sel.r = r
  sel.c = c
}

function toggleFormat(kind) {
  const key = cellKey(sel.r, sel.c)
  const set = formats[kind]
  if (set.has(key)) set.delete(key)
  else set.add(key)
}

function onCommand(id) {
  registry.run(id, ctx.value)
  toast.open = true
  toast.message = `执行命令：${id}`
}

function onStatusClick(key) {
  toast.open = true
  toast.message = `状态栏条目：${key}`
}

function onDocClose(id) {
  documents.value = documents.value.filter((d) => d.id !== id)
  if (activeDoc.value === id) activeDoc.value = documents.value[0]?.id ?? ''
}

function onDocChange(id) {
  toast.open = true
  toast.message = `切换到文档：${id}`
}

function onWindowControl(name) {
  toast.open = true
  toast.message = `窗口控制：${name}`
}

function onCorrupted() {
  toast.open = true
  toast.message = '布局已重置为默认'
}

function onGridKeydown(e) {
  const map = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  }
  const move = map[e.key]
  if (!move) return
  e.preventDefault()
  const ci = COLS.indexOf(sel.c) + move[1]
  const ri = ROWS.indexOf(sel.r) + move[0]
  if (ci >= 0 && ci < COLS.length && ri >= 0 && ri < ROWS.length) selectCell(ROWS[ri], COLS[ci])
}
</script>

<style scoped>
.case-sheet {
  height: 460px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.case-sheet :deep(.et-workbench) {
  height: 100%;
}
/* 画布宿主占满画布位；页签带与状态栏由 Workbench 的 #tabbar / #statusbar 槽给 */
.case-sheet :deep(.et-workbench__canvas) {
  display: flex;
}
.case-sheet__host {
  width: 100%;
}
.case-sheet__tip {
  font-size: 12px;
  color: var(--eb-text-color-placeholder);
}
/* 浮层位内容：冻结提示固定于视口，不随网格滚动 */
.case-sheet__frozen-chip {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 12px;
  padding: 3px 8px;
  border: 1px solid var(--et-state-selected-fg);
  border-radius: var(--et-radius-sm);
  background: var(--eb-bg-color);
  font-size: 11px;
  color: var(--et-state-selected-fg);
}
.case-sheet__grid {
  padding: 10px;
  display: grid;
  grid-template-columns: 40px repeat(6, minmax(72px, 1fr));
  outline: none;
}
.case-sheet__corner,
.case-sheet__colhead,
.case-sheet__rowhead {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  border-right: 1px solid var(--eb-border-color-lighter);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  background: var(--eb-fill-color-light);
  font-size: 11.5px;
  color: var(--eb-text-color-secondary);
}
.case-sheet__colhead.is-sel,
.case-sheet__rowhead.is-sel {
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}
.case-sheet__cell {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 26px;
  border-right: 1px solid var(--eb-border-color-lighter);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
  cursor: cell;
  white-space: nowrap;
  overflow: hidden;
}
.case-sheet__cell.is-sel {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
  background: var(--eb-color-primary-light-9);
}
.case-sheet__cell.is-bold {
  font-weight: 700;
}
.case-sheet__cell.is-italic {
  font-style: italic;
}
.case-sheet__cell.is-frozen {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--eb-bg-color);
}
.case-sheet__panel {
  display: block;
  padding: var(--et-space-inline) var(--et-space-block);
  height: 100%;
}
.case-sheet__sheet {
  display: block;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  text-align: left;
  font-size: 13px;
  color: var(--eb-text-color-regular);
  cursor: pointer;
}
.case-sheet__sheet:hover {
  background: var(--eb-fill-color-light);
}
.case-sheet__sheet.is-active {
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}
.case-sheet__list {
  margin: 0;
  padding: 4px 8px;
  list-style: none;
  font-size: 13px;
  color: var(--eb-text-color-regular);
}
.case-sheet__list li {
  padding: 4px 0;
}
</style>