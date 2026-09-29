<template>
  <!-- 案例：数据库查询台 —— 标题栏 + 查询标签 + 工具区 + 对象树/消息停靠 + 编辑器与结果网格 + 状态栏 -->
  <div class="case-sql">
    <et-workbench
      v-model:layout="layout"
      :default-layout="DEFAULT_LAYOUT"
      persist-key="case-sql-layout"
      @layout-corrupted="onCorrupted"
    >
      <template #titlebar>
        <et-title-bar title="查询台" :doc-title="activeQueryTitle" @window-control="onWindowControl">
          <template #quick>
            <et-key-hint combo="mod+s" />
          </template>
        </et-title-bar>
      </template>

      <template #documents>
        <et-document-tabs
          v-model="activeQuery"
          :documents="queries"
          @change="onQueryChange"
          @close="onQueryClose"
        />
      </template>

      <template #toolbar>
        <et-ribbon-bar
          v-model="activeTab"
          v-model:collapsed="collapsed"
          :schema="RIBBON_SCHEMA"
          :registry="registry"
          :ctx="ctx"
          persist-key="case-sql-ribbon"
          @command="onCommand"
        />
        <div class="case-sql__aux">
          <et-dropdown trigger="click" placement="bottom-start" @command="onSourcePick">
            <template #trigger>
              <et-tool-button size="small" icon="database" :label="source" :tip="{ title: '数据源', desc: source }" />
            </template>
            <template #dropdown>
              <eb-dropdown-menu>
                <eb-dropdown-item v-for="s in SOURCES" :key="s" :command="s" :label="s" icon="database" />
              </eb-dropdown-menu>
            </template>
          </et-dropdown>
          <span class="case-sql__spacer" />
          <et-key-hint combo="mod+enter" />
          <span class="case-sql__hint">执行</span>
        </div>
      </template>

      <template #panel="{ panel }">
        <et-scroll-area v-if="panel.id === 'objects'" direction="vertical" class="case-sql__panel">
          <div v-for="node in OBJECTS" :key="node.key" class="case-sql__group">
            <button type="button" class="case-sql__group-head" @click="toggleNode(node.key)">
              <et-icon :name="isOpen(node.key) ? 'arrow-down' : 'arrow-right'" :size="12" class="case-sql__caret" />
              <et-icon :name="node.icon" :size="14" class="case-sql__icon" />
              <span>{{ node.label }}</span>
              <span class="case-sql__count">{{ node.items.length }}</span>
            </button>
            <ul v-show="isOpen(node.key)" class="case-sql__list">
              <li v-for="t in node.items" :key="t.id">
                <button
                  type="button"
                  class="case-sql__object"
                  :class="{ 'is-sel': selectedTable === t.id }"
                  @click="selectTable(t.id)"
                >
                  <et-icon :name="t.icon" :size="13" class="case-sql__icon" />
                  <span class="case-sql__object-name">{{ t.label }}</span>
                  <span class="case-sql__object-note">{{ t.note }}</span>
                </button>
              </li>
            </ul>
          </div>
        </et-scroll-area>

        <et-scroll-area v-else direction="vertical" class="case-sql__panel">
          <p
            v-for="m in messages"
            :key="m.id"
            class="case-sql__msg"
            :class="`case-sql__msg--${m.level}`"
          >
            <span class="case-sql__msg-time">{{ m.time }}</span>
            <span>{{ m.text }}</span>
          </p>
        </et-scroll-area>
      </template>

      <et-context-menu :registry="registry" :schema="CONTEXT_SCHEMA" :ctx="ctx" @command="onCommand">
        <main class="case-sql__canvas">
          <et-splitter layout="vertical" class="case-sql__split">
            <et-splitter-panel :size="96" :min="72" :max="220">
              <textarea
                v-model="sqlText[activeQuery]"
                class="case-sql__code"
                spellcheck="false"
                aria-label="查询编辑器"
                @keydown="onEditorKeydown"
              />
            </et-splitter-panel>
            <et-splitter-panel :default-size="'1fr'">
              <div class="case-sql__result">
                <div class="case-sql__bar">
                  <span class="case-sql__bar-title">
                    {{ result ? `${result.table} · ${filteredRows.length} 行` : '结果' }}
                  </span>
                  <span class="case-sql__spacer" />
                  <input
                    v-model="filterText"
                    class="case-sql__filter"
                    type="text"
                    placeholder="过滤结果"
                    :disabled="!result"
                    aria-label="过滤结果"
                  >
                </div>

                <et-empty-state
                  v-if="!result"
                  icon="play"
                  title="运行查询看结果"
                  desc="运行当前语句。"
                  action-label="执行"
                  @action="onCommand('run')"
                />

                <et-empty-state
                  v-else-if="!filteredRows.length"
                  icon="filter"
                  title="没有匹配的行"
                  desc="换个过滤词。"
                  action-label="清空过滤"
                  @action="clearFilter"
                />

                <et-scroll-area v-else class="case-sql__scroll">
                  <div class="case-sql__grid" :style="gridStyle">
                    <div v-for="c in result.columns" :key="c" class="case-sql__th">{{ c }}</div>
                    <template v-for="(row, ri) in filteredRows" :key="ri">
                      <div
                        v-for="(cell, ci) in row"
                        :key="`${ri}-${ci}`"
                        class="case-sql__td"
                        :class="{ 'is-sel': selectedRow === ri }"
                        @click="selectedRow = ri"
                      >{{ cell }}</div>
                    </template>
                  </div>
                </et-scroll-area>
              </div>
            </et-splitter-panel>
          </et-splitter>
        </main>
      </et-context-menu>

      <template #statusbar>
        <et-status-bar :items="statusItems" @item-click="onStatusClick" />
      </template>
    </et-workbench>

    <et-toast v-model="toast.open" :message="toast.message" type="success" :duration="2200" />
  </div>
</template>

<script setup>
/**
 * 案例：数据库查询台（消费方形态）
 *
 * 全部 chrome 走 et-*：命令表驱动工具区与右键、停靠树持久化、结果网格、状态栏。
 * 产品内容用最小替身：对象树点选决定查询目标，编辑器写语句，执行后出结果网格与消息；
 * 过滤、行选中、数据源切换都进同一份 ctx，命令的 enabled 从它推演。
 */
import { computed, reactive, ref } from 'vue'
import { isImeComposing } from '@wil-works/evoke-business-ui'
import { comboMatchesEvent, createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const SOURCES = ['本地 SQLite', '数仓只读']

const OBJECTS = [
  {
    key: 'tables',
    label: '表',
    icon: 'table',
    items: [
      { id: 'orders', label: 'orders', note: '订单', icon: 'table' },
      { id: 'customers', label: 'customers', note: '客户', icon: 'table' },
      { id: 'products', label: 'products', note: '商品', icon: 'table' },
      { id: 'order_items', label: 'order_items', note: '订单明细', icon: 'table' },
    ],
  },
  {
    key: 'views',
    label: '视图',
    icon: 'grid',
    items: [{ id: 'v_monthly', label: 'v_monthly_sales', note: '月销售', icon: 'grid' }],
  },
]

const DATASETS = {
  orders: {
    columns: ['order_id', 'customer', 'amount', 'status'],
    rows: [
      ['SO-2041', '云图科技', '12800', '已支付'],
      ['SO-2042', '海文物流', '4360', '待发货'],
      ['SO-2043', '北方重工', '28400', '已支付'],
      ['SO-2044', '星野零售', '920', '已取消'],
      ['SO-2045', '云图科技', '7600', '已支付'],
    ],
  },
  customers: {
    columns: ['customer_id', 'name', 'city', 'level'],
    rows: [
      ['C-1001', '云图科技', '上海', 'A'],
      ['C-1002', '海文物流', '宁波', 'B'],
      ['C-1003', '北方重工', '沈阳', 'A'],
      ['C-1004', '星野零售', '成都', 'C'],
    ],
  },
  products: {
    columns: ['sku', 'name', 'price', 'stock'],
    rows: [
      ['P-01', '标准机箱', '320', '184'],
      ['P-02', '散热模组', '96', '420'],
      ['P-03', '电源模块', '158', '260'],
    ],
  },
  order_items: {
    columns: ['order_id', 'sku', 'qty', 'amount'],
    rows: [
      ['SO-2041', 'P-01', '12', '3840'],
      ['SO-2041', 'P-02', '24', '2304'],
      ['SO-2043', 'P-01', '40', '12800'],
      ['SO-2045', 'P-03', '18', '2844'],
    ],
  },
  v_monthly: {
    columns: ['month', 'orders', 'amount'],
    rows: [
      ['2026-07', '182', '426000'],
      ['2026-08', '204', '468000'],
      ['2026-09', '196', '441200'],
    ],
  },
}

const DEFAULT_LAYOUT = {
  docks: [
    {
      id: 'left',
      side: 'left',
      panels: [
        { id: 'objects', title: '对象树', size: 128, min: 96, max: 220 },
        { id: 'messages', title: '消息', size: 96, min: 64, max: 200 },
      ],
    },
  ],
  maximized: null,
}

const CONTEXT_SCHEMA = [
  { key: 'c-copy', type: 'item', command: 'copy' },
  { key: 'c-export', type: 'item', command: 'export' },
  { key: 'c-sep', type: 'separator' },
  { key: 'c-explain', type: 'item', command: 'explain' },
  {
    key: 'c-more',
    type: 'submenu',
    label: '数据源',
    children: [{ key: 'c-refresh', type: 'item', command: 'refresh' }],
  },
]

const layout = ref(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))
const queries = ref([
  { id: 'q1', title: '订单概览.sql', dirty: true },
  { id: 'q2', title: '客户分层.sql' },
  { id: 'conn', title: '连接日志', closable: false },
])
const sqlText = reactive({
  q1: 'select order_id, customer, amount, status\nfrom orders\nwhere amount > 1000\norder by amount desc;',
  q2: 'select city, count(*) as customers\nfrom customers\ngroup by city;',
  conn: '-- 连接日志\n-- 09:28 connect local sqlite ok',
})

const activeQuery = ref('q1')
const activeTab = ref('home')
const collapsed = ref(false)
const source = ref(SOURCES[0])
const selectedTable = ref('orders')
const result = ref(null)
const selectedRow = ref(-1)
const filterText = ref('')
const elapsed = ref(0)
const expanded = reactive(new Set(['tables', 'views']))
const toast = reactive({ open: false, message: '' })
const messages = ref([
  { id: 1, time: '00:28', level: 'info', text: '已连接 本地 SQLite' },
  { id: 2, time: '00:29', level: 'info', text: '对象树已载入 · 5 个对象' },
])
let msgSeq = 2

const activeQueryTitle = computed(
  () => queries.value.find((q) => q.id === activeQuery.value)?.title ?? '',
)

/** 查询上下文：喂给 registry.state —— enabled 全从这一份推演 */
const ctx = computed(() => ({
  hasTable: Boolean(selectedTable.value),
  hasResult: Boolean(result.value),
  hasRow: selectedRow.value >= 0,
  filtered: Boolean(filterText.value.trim()),
}))

const filteredRows = computed(() => {
  const rows = result.value?.rows ?? []
  const q = filterText.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) => row.some((cell) => String(cell).toLowerCase().includes(q)))
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${result.value?.columns.length ?? 1}, minmax(96px, 1fr))`,
}))

const statusItems = computed(() => [
  { key: 'source', label: '连接', value: source.value },
  { key: 'table', label: '表', value: selectedTable.value },
  { key: 'row', label: '选中', value: selectedRow.value >= 0 ? `#${selectedRow.value + 1}` : '—' },
  { key: 'rows', label: '行', value: result.value ? String(filteredRows.value.length) : '—' },
])

const registry = createCommandRegistry()
registry.registerAll([
  {
    id: 'run',
    title: '执行查询',
    desc: '运行当前语句',
    keys: 'mod+enter',
    icon: 'play',
    group: '查询',
    surfaces: ['toolbar', 'palette'],
    enabled: (c) => c.hasTable,
    run: () => runQuery(),
  },
  {
    id: 'stop',
    title: '停止',
    desc: '中断当前执行',
    icon: 'stop',
    group: '查询',
    surfaces: ['toolbar', 'palette'],
    enabled: (c) => c.hasResult,
    run: () => log('warn', '已中断当前执行'),
  },
  {
    id: 'format',
    title: '格式化',
    desc: '规整当前语句',
    icon: 'edit',
    group: '编辑',
    surfaces: ['toolbar', 'palette'],
    run: () => formatSql(),
  },
  {
    id: 'copy',
    title: '复制结果',
    keys: 'mod+c',
    icon: 'copy',
    group: '编辑',
    surfaces: ['toolbar', 'context', 'palette'],
    enabled: (c) => c.hasRow,
    run: () => log('info', `已复制第 ${selectedRow.value + 1} 行`),
  },
  {
    id: 'export',
    title: '导出 CSV',
    icon: 'download',
    group: '导出',
    surfaces: ['toolbar', 'context', 'palette'],
    enabled: (c) => c.hasResult,
    run: () => log('success', `已导出 ${filteredRows.value.length} 行`),
  },
  {
    id: 'explain',
    title: '执行计划',
    desc: '查看访问路径',
    icon: 'question-answer',
    group: '结果',
    surfaces: ['toolbar', 'context', 'palette'],
    enabled: (c) => c.hasResult,
    run: () => log('info', `执行计划：Seq Scan on ${selectedTable.value}`),
  },
  {
    id: 'refresh',
    title: '刷新对象树',
    icon: 'refresh',
    group: '数据源',
    surfaces: ['toolbar', 'context', 'palette'],
    run: () => {
      log('info', `对象树已刷新 · ${source.value}`)
    },
  },
])

const RIBBON_SCHEMA = [
  {
    key: 'home',
    type: 'tab',
    label: '开始',
    children: [
      {
        key: 'g-run',
        type: 'group',
        label: '查询',
        children: [
          { key: 'i-run', type: 'item', command: 'run', grid: { rowSpan: 2 } },
          { key: 'i-stop', type: 'item', command: 'stop', grid: { rowSpan: 2 } },
        ],
      },
      {
        key: 'g-edit',
        type: 'group',
        label: '编辑',
        children: [
          { key: 'i-format', type: 'item', command: 'format', grid: { rowSpan: 2 } },
          { key: 'i-copy', type: 'item', command: 'copy', grid: { rowSpan: 2 } },
        ],
      },
      {
        key: 'g-export',
        type: 'group',
        label: '导出',
        children: [{ key: 'i-export', type: 'item', command: 'export', grid: { rowSpan: 2 } }],
      },
    ],
  },
  {
    key: 'data',
    type: 'tab',
    label: '数据',
    children: [
      {
        key: 'g-source',
        type: 'group',
        label: '数据源',
        children: [{ key: 'i-refresh', type: 'item', command: 'refresh', grid: { rowSpan: 2 } }],
      },
      {
        key: 'g-result',
        type: 'group',
        label: '结果',
        children: [{ key: 'i-explain', type: 'item', command: 'explain', grid: { rowSpan: 2 } }],
      },
    ],
  },
]

function isOpen(key) {
  return expanded.has(key)
}

function toggleNode(key) {
  if (expanded.has(key)) expanded.delete(key)
  else expanded.add(key)
}

function selectTable(id) {
  selectedTable.value = id
  log('info', `已选中 ${id}`)
}

function log(level, text) {
  msgSeq += 1
  messages.value.unshift({ id: msgSeq, time: `00:${28 + msgSeq}`, level, text })
}

function runQuery() {
  const table = selectedTable.value
  const ds = DATASETS[table]
  if (!ds) {
    log('warn', `${table} 无可用数据`)
    return
  }
  result.value = { table, columns: ds.columns, rows: ds.rows }
  filterText.value = ''
  selectedRow.value = -1
  elapsed.value = 9 + ds.rows.length * 4
  log('success', `执行完成 · ${table} · ${ds.rows.length} 行 · ${elapsed.value} ms`)
}

function clearFilter() {
  filterText.value = ''
}

function formatSql() {
  const KEYWORDS = ['select', 'from', 'where', 'order by', 'group by', 'limit', 'and', 'or']
  let text = sqlText[activeQuery.value] ?? ''
  for (const kw of KEYWORDS) {
    text = text.replace(new RegExp(`\\b${kw}\\b`, 'gi'), kw.toUpperCase())
  }
  text = text
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\s+(FROM|WHERE|ORDER BY|GROUP BY|LIMIT)\b/g, '\n$1')
    .trim()
  sqlText[activeQuery.value] = text
  log('info', '已格式化当前语句')
}

function onEditorKeydown(e) {
  if (isImeComposing(e)) return
  if (comboMatchesEvent('mod+enter', e)) {
    e.preventDefault()
    onCommand('run')
  }
}

function onSourcePick(value) {
  source.value = value
  log('info', `数据源切换为 ${value}`)
  note(`数据源：${value}`)
}

function onQueryChange(id) {
  const title = queries.value.find((q) => q.id === id)?.title ?? id
  note(`切换到 ${title}`)
}

function onQueryClose(id) {
  queries.value = queries.value.filter((q) => q.id !== id)
  if (activeQuery.value === id) activeQuery.value = queries.value[0]?.id ?? ''
  note('已关闭查询标签')
}

function onWindowControl(name) {
  note(`窗口控制：${name}`)
}

function onCorrupted() {
  note('布局已重置为默认')
}

function onStatusClick(key) {
  note(`状态栏：${key}`)
}

function onCommand(id) {
  registry.run(id, ctx.value)
  note(`${registry.get(id)?.title ?? id} 已执行`)
}

function note(message) {
  toast.open = true
  toast.message = message
}
</script>

<style scoped>
.case-sql {
  --case-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  height: 460px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.case-sql :deep(.et-workbench) {
  height: 100%;
}
.case-sql__aux {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 28px;
  padding: 0 var(--et-space-band-inline);
  border-top: 1px solid var(--eb-border-color-lighter);
  background: var(--eb-bg-color);
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}
.case-sql__hint {
  color: var(--eb-text-color-placeholder);
}
.case-sql__spacer {
  flex: 1;
}
.case-sql__canvas {
  height: 100%;
  background: var(--eb-bg-color);
}
.case-sql__split {
  height: 100%;
}
.case-sql__code {
  display: block;
  width: 100%;
  height: 100%;
  padding: 8px var(--et-space-band-inline);
  border: none;
  outline: none;
  resize: none;
  background: var(--eb-bg-color);
  color: var(--eb-text-color-primary);
  font-family: var(--case-mono);
  font-size: var(--eb-font-size-sm);
  line-height: 1.75;
}
.case-sql__result {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* 空态高于分栏时滚动而不是被裁掉（网格态由内层滚动区接管，不会双滚动条） */
  overflow: auto;
  border-top: 1px solid var(--eb-border-color-lighter);
  background: var(--eb-bg-color);
}
.case-sql__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 var(--et-space-band-inline);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  background: var(--eb-fill-color-light);
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}
.case-sql__bar-title {
  font-family: var(--case-mono);
}
.case-sql__filter {
  width: 128px;
  height: 20px;
  padding: 0 6px;
  border: 1px solid var(--eb-border-color);
  border-radius: var(--eb-border-radius-base, 4px);
  background: var(--eb-bg-color);
  color: var(--eb-text-color-primary);
  font-size: 12px;
  outline: none;
}
.case-sql__filter:focus {
  border-color: var(--eb-border-color-dark);
}
.case-sql__filter:disabled {
  background: var(--eb-fill-color-light);
  color: var(--eb-text-color-disabled);
}
.case-sql__scroll {
  flex: 1;
  min-height: 0;
}
.case-sql__grid {
  display: grid;
}
.case-sql__th {
  padding: 4px 8px;
  border-right: 1px solid var(--eb-border-color-lighter);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  background: var(--eb-fill-color-light);
  font-family: var(--case-mono);
  font-size: 11.5px;
  color: var(--eb-text-color-secondary);
  white-space: nowrap;
}
.case-sql__td {
  padding: 4px 8px;
  border-right: 1px solid var(--eb-border-color-lighter);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  font-family: var(--case-mono);
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}
.case-sql__td.is-sel {
  background: var(--et-state-content-selected-bg);
  color: var(--et-state-content-selected-fg);
}
.case-sql__panel {
  display: block;
  height: 100%;
  padding: var(--et-space-inline) var(--et-space-block);
}
.case-sql__group + .case-sql__group {
  margin-top: calc(var(--et-space-inline) * 2);
}
.case-sql__group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 6px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.case-sql__group-head:hover {
  background: var(--eb-fill-color-light);
}
.case-sql__caret {
  color: var(--eb-text-color-placeholder);
}
.case-sql__icon {
  color: var(--eb-text-color-secondary);
}
.case-sql__count {
  margin-left: auto;
  font-size: 11px;
  color: var(--eb-text-color-placeholder);
}
.case-sql__list {
  margin: 0;
  padding: 2px 0 0 16px;
  list-style: none;
}
.case-sql__object {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 3px 6px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.case-sql__object:hover {
  background: var(--eb-fill-color-light);
}
.case-sql__object.is-sel {
  color: var(--et-state-selected-fg);
  background: var(--et-state-selected-bg);
}
.case-sql__object-name {
  font-family: var(--case-mono);
}
.case-sql__object-note {
  margin-left: auto;
  font-size: 11px;
  color: var(--eb-text-color-placeholder);
}
.case-sql__msg {
  display: flex;
  gap: 6px;
  margin: 0;
  padding: 3px 6px;
  font-family: var(--case-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--eb-text-color-regular);
}
.case-sql__msg > span:last-child {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.case-sql__msg-time {
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
}
.case-sql__msg--success {
  color: var(--eb-color-success);
}
.case-sql__msg--warn {
  color: var(--eb-color-warning);
}
</style>