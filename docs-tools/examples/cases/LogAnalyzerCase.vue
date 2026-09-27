<template>
  <!-- 案例：日志分析器 —— 命令面板 + 过滤/查询停靠 + 结果停靠 + 空态 + 右键，chrome 全复用 -->
  <div class="case-log">
    <et-workbench
      v-model:layout="layout"
      :default-layout="DEFAULT_LAYOUT"
      persist-key="case-log-layout"
      @layout-corrupted="onCorrupted"
    >
      <template #titlebar>
        <et-title-bar title="日志分析器" doc-title="app.log" @window-control="onWindowControl" />
      </template>

      <template #documents>
        <et-document-tabs v-model="activeDoc" :documents="documents" />
      </template>

      <template #toolbar>
        <et-ribbon-bar
          v-model="activeTab"
          v-model:collapsed="collapsed"
          :schema="RIBBON_SCHEMA"
          :registry="registry"
          :ctx="ctx"
          persist-key="case-log-ribbon"
          @command="onCommand"
        />
        <div class="case-log__aux">
          <span class="case-log__spacer" />
          <et-key-hint combo="mod+k" />
          <span class="case-log__tip">打开命令面板</span>
        </div>
      </template>

      <template #panel="{ panel }">
        <et-scroll-area v-if="panel.id === 'filters'" direction="vertical" class="case-log__panel">
          <label v-for="lv in LEVELS" :key="lv" class="case-log__filter">
            <input type="checkbox" :checked="store.levels.includes(lv)" @change="toggleLevel(lv)">
            <span :class="`case-log__level case-log__level--${lv}`">{{ lv }}</span>
          </label>
        </et-scroll-area>

        <div v-else-if="panel.id === 'query'" class="case-log__query">
          <et-select v-model="store.field" :options="FIELD_OPTIONS" size="small" />
          <input v-model="store.keyword" class="case-log__input" placeholder="message 包含…" @keyup.enter="onCommand('run-query')">
          <et-tool-button size="small" icon="search" label="运行" tip="运行查询" @click="onCommand('run-query')" />
        </div>

        <ul v-else class="case-log__rows">
          <li
            v-for="r in rows"
            :key="r.id"
            class="case-log__row"
            :class="{ 'is-sel': store.selectedId === r.id }"
            @click="store.selectedId = r.id"
          >
            <span class="case-log__time">{{ r.time }}</span>
            <span :class="`case-log__level case-log__level--${r.level}`">{{ r.level }}</span>
            <span class="case-log__msg">{{ r.message }}</span>
          </li>
        </ul>
      </template>

      <et-theme-bridge />
      <et-context-menu :registry="registry" :schema="CONTEXT_SCHEMA" :ctx="ctx">
        <main class="case-log__canvas">
          <et-banner v-if="hint" type="info" :title="hint" @close="hint = ''" />
          <et-empty-state
            v-if="!rows.length"
            icon="search"
            title="没有命中的日志"
            desc="放宽级别过滤，或清空关键词。"
            action-label="清空过滤器"
            @action="onCommand('clear-filters')"
          />
          <template v-else>
            <p class="case-log__summary">命中 {{ rows.length }} 条 · 右侧结果面板可点选</p>
            <div v-if="selected" class="case-log__detail">
              <span class="case-log__time">{{ selected.time }}</span>
              <span :class="`case-log__level case-log__level--${selected.level}`">{{ selected.level }}</span>
              <span class="case-log__msg">{{ selected.message }}</span>
            </div>
          </template>
        </main>
      </et-context-menu>

      <template #statusbar>
        <et-status-bar :items="statusItems" zoom="—" @item-click="onStatusClick" />
      </template>
    </et-workbench>

    <et-command-palette
      v-model="paletteOpen"
      :registry="registry"
      :ctx="ctx"
      recent-key="case-log-recent"
      @command="onCommand"
    />
    <et-toast v-model="toast.open" :message="toast.message" type="success" :duration="2200" />
  </div>
</template>

<script setup>
/**
 * 案例：日志分析器（配方页的可跑版）
 *
 * 产品状态（查询条件 / 选中行）是单一事实源，命令的 enabled/active 从 ctx 推演；
 * 工具区、右键、命令面板三处共用同一张命令表——加一个过滤动作 = 加一行数据。
 * ⌘K 打开命令面板（组字期不抢键）。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { isImeComposing } from '@wil-works/evoke-business-ui'
import { comboMatchesEvent, createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const LEVELS = ['error', 'warn', 'info']
const FIELD_OPTIONS = [
  { value: 'message', label: 'message' },
  { value: 'time', label: 'time' },
  { value: 'level', label: 'level' },
]
const ROWS = [
  { id: 1, time: '12:01:03', level: 'info', message: 'server started on :8080' },
  { id: 2, time: '12:01:07', level: 'warn', message: 'slow query 820ms' },
  { id: 3, time: '12:02:11', level: 'error', message: 'db connection refused' },
  { id: 4, time: '12:02:44', level: 'info', message: 'retry succeeded' },
  { id: 5, time: '12:03:20', level: 'warn', message: 'cache miss ratio 0.42' },
  { id: 6, time: '12:04:02', level: 'error', message: 'upstream timeout 504' },
]

const store = reactive({ levels: ['error', 'warn', 'info'], field: 'message', keyword: '', selectedId: null })
const activeDoc = ref('app')
const documents = [
  { id: 'app', title: 'app.log', dirty: true },
  { id: 'gateway', title: 'gateway.log' },
]
const activeTab = ref('query')
const collapsed = ref(false)
const paletteOpen = ref(false)
const hint = ref('')
const toast = reactive({ open: false, message: '' })

const DEFAULT_LAYOUT = {
  docks: [
    {
      id: 'left',
      side: 'left',
      presentation: 'tabs',
      panels: [
        { id: 'filters', title: '过滤器', size: 200, min: 160, max: 280 },
        { id: 'query', title: '查询', size: 200, min: 160, max: 280 },
      ],
    },
    {
      id: 'right',
      side: 'right',
      panels: [{ id: 'results', title: '结果', size: 300, min: 220, max: 420 }],
    },
  ],
  maximized: null,
}
const layout = ref(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))

const ctx = computed(() => ({
  levels: store.levels,
  hasRow: store.selectedId !== null,
}))

const rows = computed(() => {
  const kw = store.keyword.trim().toLowerCase()
  return ROWS.filter(
    (r) => store.levels.includes(r.level) && (!kw || r.message.toLowerCase().includes(kw)),
  )
})
const selected = computed(() => rows.value.find((r) => r.id === store.selectedId) ?? null)

const statusItems = computed(() => [
  { key: 'rows', label: '命中', value: String(rows.value.length) },
  { key: 'levels', label: '级别', value: store.levels.join(' / ') || '无' },
  { key: 'field', label: '字段', value: store.field },
])

const registry = createCommandRegistry()
registry.registerAll([
  { id: 'run-query', title: '运行查询', keys: 'mod+enter', icon: 'search', group: '查询',
    surfaces: ['toolbar', 'menu', 'context', 'palette'], run: () => {} },
  { id: 'clear-filters', title: '清空过滤器', icon: 'close', group: '查询',
    surfaces: ['toolbar', 'menu', 'palette'], run: () => { store.keyword = ''; store.levels = [...LEVELS] } },
  { id: 'filter-error', title: '错误', icon: 'alert', group: '过滤',
    surfaces: ['toolbar', 'menu', 'context', 'palette'], active: (c) => c.levels.includes('error'),
    run: () => toggleLevel('error') },
  { id: 'filter-warn', title: '警告', icon: 'warning', group: '过滤',
    surfaces: ['toolbar', 'menu', 'palette'], active: (c) => c.levels.includes('warn'),
    run: () => toggleLevel('warn') },
  { id: 'filter-info', title: '信息', icon: 'message', group: '过滤',
    surfaces: ['toolbar', 'menu', 'palette'], active: (c) => c.levels.includes('info'),
    run: () => toggleLevel('info') },
  { id: 'copy-line', title: '复制该行', keys: 'mod+c', icon: 'copy', group: '编辑',
    surfaces: ['toolbar', 'menu', 'context', 'palette'], enabled: (c) => c.hasRow, run: () => {} },
  { id: 'export-json', title: '导出 JSON', icon: 'download', group: '导出',
    surfaces: ['toolbar', 'menu', 'palette'], run: () => {} },
])

const RIBBON_SCHEMA = [
  {
    key: 'query',
    type: 'tab',
    label: '查询',
    children: [
      { key: 'g-run', type: 'group', label: '运行', children: [
        { key: 'i-run', type: 'item', command: 'run-query', grid: { rowSpan: 2 } },
        { key: 'i-clear', type: 'item', command: 'clear-filters', grid: { rowSpan: 2 } },
      ] },
      { key: 'g-level', type: 'group', label: '过滤', children: [
        { key: 'i-error', type: 'item', command: 'filter-error', grid: { rowSpan: 2 } },
        { key: 'i-warn', type: 'item', command: 'filter-warn', grid: { rowSpan: 2 } },
        { key: 'i-info', type: 'item', command: 'filter-info', grid: { rowSpan: 2 } },
      ] },
    ],
  },
  {
    key: 'export',
    type: 'tab',
    label: '导出',
    children: [
      { key: 'g-export', type: 'group', label: '导出', children: [
        { key: 'i-export', type: 'item', command: 'export-json', grid: { rowSpan: 2 } },
      ] },
    ],
  },
]

const CONTEXT_SCHEMA = [
  { key: 'c-copy', type: 'item', command: 'copy-line' },
  { key: 'c-sep', type: 'separator' },
  { key: 'c-error', type: 'item', command: 'filter-error' },
]

function toggleLevel(level) {
  store.levels = store.levels.includes(level)
    ? store.levels.filter((l) => l !== level)
    : [...store.levels, level]
}

function onCommand(id) {
  registry.run(id, ctx.value)
  toast.open = true
  toast.message = `执行命令：${id}`
}

function onStatusClick(key) {
  hint.value = `状态栏条目：${key}`
}

function onWindowControl(name) {
  toast.open = true
  toast.message = `窗口控制：${name}`
}

function onCorrupted() {
  hint.value = '布局已重置为默认'
}

function onGlobalKeydown(e) {
  if (isImeComposing(e)) return
  if (comboMatchesEvent('mod+k', e)) {
    e.preventDefault()
    paletteOpen.value = !paletteOpen.value
  } else if (comboMatchesEvent('mod+enter', e)) {
    e.preventDefault()
    onCommand('run-query')
  }
}
onMounted(() => document.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onGlobalKeydown))
</script>

<style scoped>
.case-log {
  height: 460px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.case-log :deep(.et-workbench) {
  height: 100%;
}
.case-log__aux {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 var(--et-space-band-inline);
  border-top: 1px solid var(--eb-border-color-lighter);
  background: var(--eb-bg-color);
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}
.case-log__spacer {
  flex: 1;
}
.case-log__tip {
  color: var(--eb-text-color-placeholder);
}
.case-log__panel {
  display: block;
  padding: var(--et-space-inline) var(--et-space-block);
  height: 100%;
}
.case-log__filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  font-size: 13px;
  color: var(--eb-text-color-regular);
  cursor: pointer;
}
.case-log__query {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--et-space-block);
}
.case-log__input {
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--eb-border-color);
  border-radius: var(--eb-border-radius-base, 4px);
  background: var(--eb-bg-color);
  font-size: 12.5px;
  color: var(--eb-text-color-primary);
  outline: none;
}
.case-log__input:focus {
  border-color: var(--eb-color-primary);
}
.case-log__canvas {
  height: 100%;
  padding: 14px 16px;
  overflow: auto;
  background: var(--eb-bg-color);
}
.case-log__summary {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--eb-text-color-secondary);
}
.case-log__detail {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  background: var(--eb-fill-color-light);
  font-size: 13px;
}
.case-log__rows {
  margin: 0;
  padding: 0;
  list-style: none;
  height: 100%;
  overflow: auto;
}
.case-log__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--eb-border-color-lighter);
  font-size: 12.5px;
  color: var(--eb-text-color-regular);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
}
.case-log__row:hover {
  background: var(--eb-fill-color-light);
}
.case-log__row.is-sel {
  background: var(--eb-color-primary-light-9);
  color: var(--eb-color-primary);
}
.case-log__time {
  font-family: var(--eb-font-family-code, monospace);
  color: var(--eb-text-color-secondary);
  flex-shrink: 0;
}
.case-log__level {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 11px;
  text-transform: uppercase;
}
.case-log__level--error {
  color: var(--eb-color-danger);
  background: var(--eb-color-danger-light-9);
}
.case-log__level--warn {
  color: var(--eb-color-warning);
  background: var(--eb-color-warning-light-9);
}
.case-log__level--info {
  color: var(--eb-text-color-secondary);
  background: var(--eb-fill-color);
}
.case-log__msg {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>