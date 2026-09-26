# 配方：日志分析器

用 tools-ui 搭一个日志分析器，不需要为它改任何办公逻辑。

M2 复用检验的落地页：命令表、停靠、折叠、快捷键、焦点陷阱全部原样复用，框架侧零分支、零改动。下面是一份完整可跑的装配，引擎与数据是产品的，chrome 全是 `Et*`。

## 目标形态

| 区 | 内容 | 载体 |
| --- | --- | --- |
| 左停靠 | 过滤器（级别多选）+ 查询（字段 + 关键词） | `presentation: 'tabs'` |
| 顶带 | 标题栏 + 工具区三 tab | `EtTitleBar` / `EtRibbonBar` |
| 中列 | 查询概览 + 选中行详情 + 空态 | `EtEmptyState` / `EtContextMenu` |
| 底停靠 | 结果列表 | 单面板 dock |
| 浮层 | ⌘K 面板 + Toast 反馈 | `EtCommandPalette` / `EtToast` |

## 命令表与 schema

```js
// src/log-store.js
import { computed, reactive } from 'vue'
import { createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

/** 查询状态：产品侧单一事实源，命令的 enabled/active 从它推演 */
export const store = reactive({
  levels: ['error', 'warn'],
  field: 'message',
  keyword: '',
  selectedId: null,
})

export const ctx = computed(() => ({
  levels: store.levels,
  hasRow: store.selectedId !== null,
}))

export const ROWS = [
  { id: 1, time: '12:01:03', level: 'info', message: 'server started on :8080' },
  { id: 2, time: '12:01:07', level: 'warn', message: 'slow query 820ms' },
  { id: 3, time: '12:02:11', level: 'error', message: 'db connection refused' },
  { id: 4, time: '12:02:44', level: 'info', message: 'retry succeeded' },
  { id: 5, time: '12:03:20', level: 'warn', message: 'cache miss ratio 0.42' },
]

export const rows = computed(() => {
  const kw = store.keyword.trim().toLowerCase()
  return ROWS.filter(
    (r) => store.levels.includes(r.level) && (!kw || r.message.toLowerCase().includes(kw)),
  )
})

export const LEVELS = ['error', 'warn', 'info']
export const FIELD_OPTIONS = [
  { value: 'message', label: 'message' },
  { value: 'time', label: 'time' },
  { value: 'level', label: 'level' },
]

function toggleLevel(level) {
  store.levels = store.levels.includes(level)
    ? store.levels.filter((l) => l !== level)
    : [...store.levels, level]
}
export { toggleLevel }

export const registry = createCommandRegistry()
registry.registerAll([
  { id: 'run-query', title: '运行查询', keys: 'mod+enter', icon: 'search', group: '查询',
    surfaces: ['toolbar', 'menu', 'context', 'palette'], run: () => {} },
  { id: 'clear-filters', title: '清空过滤器', icon: 'close', group: '查询',
    surfaces: ['toolbar', 'menu', 'palette'], run: () => { store.keyword = ''; store.levels = ['error', 'warn', 'info'] } },
  { id: 'filter-error', title: '错误', icon: 'close-circle', group: '过滤',
    surfaces: ['toolbar', 'menu', 'palette'], active: (c) => c.levels.includes('error'),
    run: () => toggleLevel('error') },
  { id: 'filter-warn', title: '警告', icon: 'alert', group: '过滤',
    surfaces: ['toolbar', 'menu', 'palette'], active: (c) => c.levels.includes('warn'),
    run: () => toggleLevel('warn') },
  { id: 'filter-info', title: '信息', icon: 'info', group: '过滤',
    surfaces: ['toolbar', 'menu', 'palette'], active: (c) => c.levels.includes('info'),
    run: () => toggleLevel('info') },
  { id: 'copy-line', title: '复制该行', keys: 'mod+c', icon: 'copy', group: '编辑',
    surfaces: ['toolbar', 'menu', 'context', 'palette'], enabled: (c) => c.hasRow, run: () => {} },
  { id: 'export-json', title: '导出 JSON', icon: 'download', group: '导出',
    surfaces: ['toolbar', 'menu', 'palette'], run: () => {} },
])

export const RIBBON_SCHEMA = [
  {
    key: 'query',
    type: 'tab',
    label: '查询',
    children: [
      { key: 'g-run', type: 'group', label: '运行', children: [
        { key: 'i-run', type: 'item', command: 'run-query', grid: { rowSpan: 2 } },
        { key: 'i-clear', type: 'item', command: 'clear-filters', grid: { rowSpan: 2 } },
      ]},
      { key: 'g-level', type: 'group', label: '过滤', children: [
        { key: 'i-error', type: 'item', command: 'filter-error', grid: { rowSpan: 2 } },
        { key: 'i-warn', type: 'item', command: 'filter-warn', grid: { rowSpan: 2 } },
        { key: 'i-info', type: 'item', command: 'filter-info', grid: { rowSpan: 2 } },
      ]},
    ],
  },
  {
    key: 'export',
    type: 'tab',
    label: '导出',
    children: [
      { key: 'g-export', type: 'group', label: '导出', children: [
        { key: 'i-export', type: 'item', command: 'export-json', grid: { rowSpan: 2 } },
      ]},
    ],
  },
]

export const CONTEXT_SCHEMA = [
  { key: 'c-copy', type: 'item', command: 'copy-line' },
  { key: 'c-sep', type: 'separator' },
  { key: 'c-error', type: 'item', command: 'filter-error' },
]

export const DEFAULT_LAYOUT = {
  docks: [
    { id: 'left', side: 'left', presentation: 'tabs', panels: [
      { id: 'filters', title: '过滤器', size: 260, min: 200, max: 360 },
      { id: 'query', title: '查询', size: 260, min: 200, max: 360 },
    ]},
    { id: 'bottom', side: 'bottom', panels: [
      { id: 'results', title: '结果', size: 180, min: 120, max: 320 },
    ]},
  ],
  maximized: null,
}
```

## 装配

```vue
<!-- src/App.vue -->
<template>
  <et-provider :density="density">
    <et-workbench
      v-model:layout="layout"
      :default-layout="DEFAULT_LAYOUT"
      persist-key="log-analyzer"
      @layout-corrupted="onCorrupted"
    >
      <template #titlebar>
        <et-title-bar title="日志分析器" doc-title="app.log" @window-control="onWinCtl" />
      </template>

      <template #toolbar>
        <et-ribbon-bar
          v-model="activeTab"
          v-model:collapsed="collapsed"
          :schema="RIBBON_SCHEMA"
          :registry="registry"
          :ctx="ctx"
          persist-key="log-analyzer-ribbon"
          @command="onCommand"
        />
      </template>

      <!-- 左停靠两个面板按 id 映射内容 -->
      <template #panel="{ panel }">
        <et-scroll-area v-if="panel.id === 'filters'" direction="vertical">
          <label v-for="level in LEVELS" :key="level" class="la__filter">
            <input
              type="checkbox"
              :checked="store.levels.includes(level)"
              @change="toggleLevel(level)"
            />
            <span>{{ level }}</span>
          </label>
        </et-scroll-area>

        <div v-else-if="panel.id === 'query'" class="la__query">
          <et-select v-model="store.field" :options="FIELD_OPTIONS" size="small" />
          <input
            v-model="store.keyword"
            class="la__input"
            placeholder="message contains…"
            @keyup.enter="onCommand('run-query')"
          />
          <et-tool-button size="small" icon="search" label="运行" tip="运行查询" @click="onCommand('run-query')" />
        </div>
      </template>

      <!-- 中列画布：概览 + 选中行详情 + 空态；右键与工具区同源 -->
      <et-theme-bridge />
      <et-context-menu :registry="registry" :schema="CONTEXT_SCHEMA" :ctx="ctx">
        <main class="la__canvas">
          <et-banner v-if="hint" type="info" :title="hint" @close="hint = ''" />
          <et-empty-state
            v-if="!rows.length"
            icon="search"
            title="没有命中的日志"
            desc="调宽级别过滤或清空关键词。"
            action-label="清空过滤器"
            @action="onCommand('clear-filters')"
          />
          <template v-else>
            <p class="la__summary">命中 {{ rows.length }} 条</p>
            <p v-if="selected" class="la__detail">
              <span class="la__time">{{ selected.time }}</span>
              <span :class="`la__level la__level--${selected.level}`">{{ selected.level }}</span>
              {{ selected.message }}
            </p>
          </template>
        </main>
      </et-context-menu>

      <template #statusbar>
        <et-status-bar :items="statusItems" zoom="100%" @item-click="onStatusClick" />
      </template>
    </et-workbench>

    <et-toast v-model="toast.open" :message="toast.message" type="success" :duration="2400" />
    <et-command-palette
      v-model="paletteOpen"
      :registry="registry"
      :ctx="ctx"
      recent-key="log-recent"
      @command="onCommand"
    />
  </et-provider>
</template>
```

```js
// src/App.vue（续）
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { isImeComposing } from '@wil-works/evoke-business-ui'
import { comboMatchesEvent } from '@wil-works/evoke-tools-ui/runtime'
import {
  CONTEXT_SCHEMA,
  DEFAULT_LAYOUT,
  FIELD_OPTIONS,
  LEVELS,
  RIBBON_SCHEMA,
  ctx,
  registry,
  rows,
  store,
  toggleLevel,
} from './log-store'
import { createLayoutTree } from '@wil-works/evoke-tools-ui/runtime'

const density = ref('default')
const layout = ref(createLayoutTree(DEFAULT_LAYOUT))
const activeTab = ref('query')
const collapsed = ref(false)
const hint = ref('')
const paletteOpen = ref(false)
const toast = ref({ open: false, message: '' })

const selected = computed(() => rows.value.find((r) => r.id === store.selectedId) ?? null)

const statusItems = computed(() => [
  { key: 'rows', label: '命中', value: String(rows.value.length) },
  { key: 'level', label: '级别', value: store.levels.join(' / ') || '无' },
])

function onCommand(id) {
  registry.run(id, ctx.value)
  toast.value = { open: true, message: `执行命令：${id}` }
}

function onStatusClick(key) {
  hint.value = `状态栏条目：${key}`
}

function onCorrupted() {
  hint.value = '布局已重置为默认'
}

function onWinCtl(name) {
  toast.value = { open: true, message: `窗口控制：${name}` }
}

// ⌘K 与 mod+enter 是产品级全局键位；组字期不抢
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
```

入口与样式沿用[快速开始](getting-started.md)的 `main.js`：`createApp(App).use(EvokeToolsUI).mount('#app')`，两个样式入口都别漏。

## 复用了什么，改了什么

| 能力 | 来源 | 改动 |
| --- | --- | --- |
| 命令表与状态推演 | `createCommandRegistry` | 无 |
| 工具区（tab/组/折叠/溢出） | `EtRibbonBar` | 无 |
| 停靠、stack/tabs、持久化 | `EtWorkbench` / `EtDock` / `EtPanel` | 无 |
| 右键与命令面板 | `EtContextMenu` / `EtCommandPalette` | 无 |
| 键盘（roving/键位/焦点陷阱） | `runtime/focus` / `runtime/keys` | 无 |
| 主题桥 | `EtThemeBridge` | 无 |
| 空态 / 通知 / 状态栏 | `EtEmptyState` / `EtToast` / `EtStatusBar` | 无 |

需要改办公逻辑才能搭起来的假设不成立：这个工具从头到尾没有碰过 `--ot-*` 与任何表单语义。

## 相关页

- [工作台布局](workbench.md)：布局树与区域槽的完整契约。
- [命令驱动](commands.md)：命令表字段与可达性核对。
- [键盘优先](keyboard.md)：全局键位与组字守卫。
- 示例工程：`examples/tools-workbench`（`pnpm example:tools-workbench`）。
