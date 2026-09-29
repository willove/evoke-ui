<template>
  <!-- 案例：代码编辑器 —— 脏标记标签 + 左停靠（资源/搜索）+ 编辑器画布 + 底停靠（问题/终端）+ 命令面板 -->
  <div class="case-code">
    <et-workbench
      v-model:layout="layout"
      :default-layout="DEFAULT_LAYOUT"
      persist-key="case-code-layout"
      @layout-corrupted="onCorrupted"
    >
      <template #titlebar>
        <et-title-bar title="代码编辑器" :doc-title="activeDoc?.title ?? ''" @window-control="onWindowControl" />
      </template>

      <template #documents>
        <et-document-tabs v-model="activeId" :documents="documents" @close="onDocClose" @change="onDocChange" />
      </template>

      <template #toolbar>
        <et-ribbon-bar
          v-model="activeTab"
          v-model:collapsed="collapsed"
          :schema="RIBBON_SCHEMA"
          :registry="registry"
          :ctx="ctx"
          persist-key="case-code-ribbon"
          @command="onCommand"
        />
        <div class="case-code__aux">
          <et-key-hint combo="mod+k" />
          <span>命令面板</span>
          <span class="case-code__sep" />
          <span>{{ activeId }} · 第 {{ cursorLine }} 行</span>
          <span class="case-code__spacer" />
          <span class="case-code__tip">Ctrl+F1 折叠功能区</span>
        </div>
      </template>

      <template #panel="{ panel }">
        <et-scroll-area v-if="panel.id === 'files'" direction="vertical" class="case-code__panel">
          <div v-for="group in TREE" :key="group.dir" class="case-code__dir">
            <span class="case-code__dir-name">{{ group.dir }}</span>
            <button
              v-for="f in group.files"
              :key="f"
              type="button"
              class="case-code__file"
              :class="{ 'is-active': f === activeId, 'is-dirty': isDirty(f) }"
              @click="openFile(f)"
            >{{ f }}</button>
          </div>
        </et-scroll-area>

        <div v-else-if="panel.id === 'search'" class="case-code__search">
          <input v-model="keyword" class="case-code__input" placeholder="搜索符号…">
          <ul class="case-code__hits">
            <li v-for="hit in hits" :key="hit.id">
              <button type="button" class="case-code__hit" @click="goto(hit.file, hit.line)">
                <span class="case-code__hit-name">{{ hit.name }}</span>
                <span class="case-code__hit-meta">{{ hit.file }}:{{ hit.line }}</span>
              </button>
            </li>
            <li v-if="!hits.length" class="case-code__none">无匹配符号</li>
          </ul>
        </div>

        <et-scroll-area v-else-if="panel.id === 'problems'" direction="vertical" class="case-code__panel">
          <button
            v-for="p in PROBLEMS"
            :key="p.id"
            type="button"
            class="case-code__problem"
            :class="{ 'is-active': p.id === problemId }"
            @click="openProblem(p)"
          >
            <span class="case-code__level" :class="`case-code__level--${p.level}`">{{ LEVEL_TEXT[p.level] }}</span>
            <span class="case-code__problem-msg">{{ p.message }}</span>
            <span class="case-code__problem-pos">{{ p.file }}:{{ p.line }}</span>
          </button>
        </et-scroll-area>

        <et-scroll-area v-else direction="vertical" class="case-code__panel">
          <p v-for="(line, i) in terminal" :key="i" class="case-code__term">{{ line }}</p>
          <p v-if="!terminal.length" class="case-code__none">终端已清空</p>
        </et-scroll-area>
      </template>

      <et-theme-bridge />
      <et-context-menu :registry="registry" :schema="CONTEXT_SCHEMA" :ctx="ctx" @command="onCommand">
        <main class="case-code__canvas">
          <div class="case-code__breadcrumb">
            <span>{{ activeId }}</span>
            <span class="case-code__lang">{{ lang }}</span>
          </div>
          <div class="case-code__editor">
            <div
              v-for="(line, i) in lines"
              :key="i"
              class="case-code__line"
              :class="{ 'is-cursor': cursorLine === i + 1 }"
              @click="setCursor(i + 1)"
            >
              <span v-if="lineNumbers" class="case-code__ln">{{ i + 1 }}</span>
              <span class="case-code__text">{{ line }}</span>
            </div>
          </div>
        </main>
      </et-context-menu>

      <template #statusbar>
        <et-status-bar :items="statusItems" zoom="" @item-click="onStatusClick" />
      </template>
    </et-workbench>

    <et-command-palette
      v-model="paletteOpen"
      :registry="registry"
      :ctx="ctx"
      recent-key="case-code-recent"
      hotkey="mod+k"
      @command="onCommand"
    />
    <et-toast v-model="toast.open" :message="toast.message" :type="toast.type" :duration="2200" />
  </div>
</template>

<script setup>
/**
 * 案例：代码编辑器（IDE 形态）
 *
 * chrome 全部走 et-*：命令表驱动工具区/右键/命令面板，停靠树持久化，脏标记走文档标签。
 * 资源、搜索、问题、终端是产品内容的最小替身；编辑动作（插入日志）会真的改文档并置脏。
 * ⌘K 开面板、⌘S 存当前文件——组字期不抢键。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { isImeComposing } from '@wil-works/evoke-business-ui'
import { comboMatchesEvent, createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const TREE = [
  { dir: 'src', files: ['commands.ts', 'workbench.ts'] },
  { dir: 'docs', files: ['README.md'] },
]
const SOURCES = {
  'commands.ts': [
    "import { createCommandRegistry } from './runtime'",
    '',
    'export const registry = createCommandRegistry()',
    '',
    'registry.register({',
    "  id: 'save',",
    "  title: '保存',",
    "  keys: 'mod+s',",
    '  enabled: (ctx) => ctx.dirty,',
    '  run: () => save(),',
    '})',
    '',
    'export function dispatch(id, ctx) {',
    '  return registry.run(id, ctx)',
    '}',
  ],
  'workbench.ts': [
    'export const DEFAULT_LAYOUT = {',
    '  docks: [',
    "    { id: 'left', side: 'left', panels: [] },",
    "    { id: 'bottom', side: 'bottom', panels: [] },",
    '  ],',
    '  maximized: null,',
    '}',
    '',
    'export function loadLayout(key) {',
    '  return read(key) ?? DEFAULT_LAYOUT',
    '}',
  ],
  'README.md': [
    '# 示例工程',
    '',
    '内部工具集合，命令表驱动。',
    '',
    '- src/commands.ts —— 命令注册',
    '- src/workbench.ts —— 工作台布局',
    '',
    '构建：pnpm build',
  ],
}
const LANGS = { 'commands.ts': 'TypeScript', 'workbench.ts': 'TypeScript', 'README.md': 'Markdown' }
const SYMBOLS = [
  { id: 's1', name: 'createCommandRegistry', file: 'commands.ts', line: 1 },
  { id: 's2', name: 'registry', file: 'commands.ts', line: 3 },
  { id: 's3', name: 'dispatch', file: 'commands.ts', line: 13 },
  { id: 's4', name: 'DEFAULT_LAYOUT', file: 'workbench.ts', line: 1 },
  { id: 's5', name: 'loadLayout', file: 'workbench.ts', line: 9 },
  { id: 's6', name: '示例工程', file: 'README.md', line: 1 },
]
const PROBLEMS = [
  { id: 'p1', file: 'commands.ts', line: 9, level: 'error', message: 'enabled 返回值缺少类型标注' },
  { id: 'p2', file: 'commands.ts', line: 12, level: 'warn', message: 'ctx 已声明但未使用' },
  { id: 'p3', file: 'workbench.ts', line: 3, level: 'error', message: 'panels 为空数组，停靠区无内容' },
  { id: 'p4', file: 'README.md', line: 5, level: 'warn', message: '列表项前缺少空行' },
]
const LEVEL_TEXT = { error: '错误', warn: '警告' }
const DEFAULT_LAYOUT = {
  docks: [
    {
      id: 'left',
      side: 'left',
      presentation: 'tabs',
      panels: [
        { id: 'files', title: '资源', size: 180, min: 140, max: 260 },
        { id: 'search', title: '搜索', size: 180, min: 140, max: 260 },
      ],
    },
    {
      id: 'bottom',
      side: 'bottom',
      presentation: 'tabs',
      panels: [
        { id: 'problems', title: '问题', size: 140, min: 100, max: 260 },
        { id: 'terminal', title: '终端', size: 140, min: 100, max: 260 },
      ],
    },
  ],
  maximized: null,
}

const layout = ref(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))
const documents = ref([
  { id: 'commands.ts', title: 'commands.ts', dirty: true },
  { id: 'workbench.ts', title: 'workbench.ts' },
  { id: 'README.md', title: 'README.md', closable: false },
])
const activeId = ref('commands.ts')
const cursors = reactive({ 'commands.ts': 9, 'workbench.ts': 1, 'README.md': 1 })
const cursorLine = ref(9)
const inserts = reactive({})
const lineNumbers = ref(true)
const keyword = ref('')
const problemId = ref('')
const terminal = ref(['#01 › 打开 commands.ts'])
const activeTab = ref('edit')
const collapsed = ref(false)
const paletteOpen = ref(false)
const toast = reactive({ open: false, message: '', type: 'success' })
let seq = 1

const activeDoc = computed(() => documents.value.find((d) => d.id === activeId.value) ?? null)
const lang = computed(() => LANGS[activeId.value] ?? '')
const lines = computed(() => [...(SOURCES[activeId.value] ?? []), ...(inserts[activeId.value] ?? [])])
const hits = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return SYMBOLS
  return SYMBOLS.filter((s) => s.name.toLowerCase().includes(kw) || s.file.includes(kw))
})

/** 编辑器上下文：喂给 registry.state —— enabled/active 全从这一份推演 */
const ctx = computed(() => ({
  file: activeId.value,
  dirty: Boolean(activeDoc.value?.dirty),
  lineNumbers: lineNumbers.value,
  hasProblem: PROBLEMS.length > 0,
  terminalLines: terminal.value.length,
}))

const statusItems = computed(() => [
  { key: 'file', label: '文件', value: activeId.value },
  { key: 'pos', label: '光标', value: `第 ${cursorLine.value} 行` },
  { key: 'problems', label: '问题', value: String(PROBLEMS.length) },
  { key: 'lang', label: '语言', value: lang.value },
  { key: 'terminal', label: '终端', value: `${terminal.value.length} 条` },
])

const registry = createCommandRegistry()
registry.registerAll([
  { id: 'save', title: '保存', keys: 'mod+s', icon: 'check', group: '文件',
    surfaces: ['toolbar', 'context', 'palette'], enabled: (c) => c.dirty, run: () => saveFile() },
  { id: 'insert-log', title: '插入日志', icon: 'code', group: '编辑',
    surfaces: ['toolbar', 'context', 'palette'], run: () => insertLog() },
  { id: 'format', title: '格式化文档', icon: 'magic', group: '编辑',
    surfaces: ['toolbar', 'context', 'palette'], run: () => log(`格式化 ${activeId.value}`) },
  { id: 'toggle-lines', title: '显示行号', icon: 'list-unordered', group: '视图',
    surfaces: ['toolbar', 'palette'], active: (c) => c.lineNumbers, run: () => { lineNumbers.value = !lineNumbers.value } },
  { id: 'goto-problem', title: '跳到问题', icon: 'warning', group: '诊断',
    surfaces: ['toolbar', 'context', 'palette'], enabled: (c) => c.hasProblem, run: () => openProblem(PROBLEMS[0]) },
  { id: 'clear-terminal', title: '清空终端', icon: 'eraser', group: '诊断',
    surfaces: ['toolbar', 'palette'], enabled: (c) => c.terminalLines > 0, run: () => { terminal.value = [] } },
])

const RIBBON_SCHEMA = [
  {
    key: 'edit',
    type: 'tab',
    label: '开始',
    children: [
      { key: 'g-file', type: 'group', label: '文件', children: [
        { key: 'i-save', type: 'item', command: 'save', grid: { rowSpan: 2 } },
      ] },
      { key: 'g-edit', type: 'group', label: '编辑', children: [
        { key: 'i-insert', type: 'item', command: 'insert-log', grid: { rowSpan: 2 } },
        { key: 'i-format', type: 'item', command: 'format', grid: { rowSpan: 2 } },
      ] },
      { key: 'g-view', type: 'group', label: '视图', children: [
        { key: 'i-lines', type: 'item', command: 'toggle-lines', grid: { rowSpan: 2 } },
      ] },
    ],
  },
  {
    key: 'diagnose',
    type: 'tab',
    label: '诊断',
    children: [
      { key: 'g-diag', type: 'group', label: '问题', children: [
        { key: 'i-goto', type: 'item', command: 'goto-problem', grid: { rowSpan: 2 } },
        { key: 'i-clear', type: 'item', command: 'clear-terminal', grid: { rowSpan: 2 } },
      ] },
    ],
  },
]

const CONTEXT_SCHEMA = [
  { key: 'c-save', type: 'item', command: 'save' },
  { key: 'c-insert', type: 'item', command: 'insert-log' },
  { key: 'c-format', type: 'item', command: 'format' },
  { key: 'c-sep', type: 'separator' },
  { key: 'c-goto', type: 'item', command: 'goto-problem' },
]

function log(text) {
  seq += 1
  terminal.value = [...terminal.value, `#${String(seq).padStart(2, '0')} › ${text}`]
}

function isDirty(file) {
  return Boolean(documents.value.find((d) => d.id === file)?.dirty)
}

function markDirty(file) {
  const doc = documents.value.find((d) => d.id === file)
  if (doc) doc.dirty = true
}

function setCursor(line) {
  cursorLine.value = line
}

function openFile(file, line) {
  cursors[activeId.value] = cursorLine.value
  if (!documents.value.some((d) => d.id === file)) {
    documents.value = [...documents.value, { id: file, title: file }]
  }
  activeId.value = file
  cursorLine.value = line ?? cursors[file] ?? 1
}

function goto(file, line) {
  openFile(file, line)
  log(`跳转 ${file}:${line}`)
}

function openProblem(p) {
  problemId.value = p.id
  goto(p.file, p.line)
}

function insertLog() {
  const file = activeId.value
  if (!inserts[file]) inserts[file] = []
  inserts[file].push(`console.log('debug', ${inserts[file].length + 1})`)
  markDirty(file)
  cursorLine.value = lines.value.length
  log(`插入日志 · ${file}`)
}

function saveFile() {
  const doc = documents.value.find((d) => d.id === activeId.value)
  if (!doc) return
  doc.dirty = false
  log(`保存 ${doc.title}`)
}

function onCommand(id) {
  registry.run(id, ctx.value)
  toast.type = 'success'
  toast.message = `执行命令：${id}`
  toast.open = true
}

function onStatusClick(key) {
  toast.type = 'info'
  toast.message = `状态栏条目：${key}`
  toast.open = true
}

function onDocChange(id) {
  toast.type = 'info'
  toast.message = `切换到 ${id}`
  toast.open = true
}

function onDocClose(id) {
  documents.value = documents.value.filter((d) => d.id !== id)
  if (activeId.value === id) openFile(documents.value[0]?.id ?? 'README.md')
}

function onWindowControl(name) {
  toast.type = 'info'
  toast.message = `窗口控制：${name}`
  toast.open = true
}

function onCorrupted() {
  toast.type = 'warn'
  toast.message = '布局已重置为默认'
  toast.open = true
}

// 产品级键位：⌘K 面板、⌘S 保存；键位解析与组字守卫都走运行时（与配方页同口径）
function onGlobalKeydown(e) {
  if (isImeComposing(e)) return
  if (comboMatchesEvent('mod+k', e)) {
    e.preventDefault()
    paletteOpen.value = !paletteOpen.value
  } else if (comboMatchesEvent('mod+s', e)) {
    e.preventDefault()
    if (ctx.value.dirty) onCommand('save')
  }
}
onMounted(() => document.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onGlobalKeydown))
</script>

<style scoped>
.case-code {
  height: 460px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.case-code :deep(.et-workbench) {
  height: 100%;
}
.case-code__aux {
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
.case-code__sep {
  width: 1px;
  height: 12px;
  background: var(--eb-border-color);
}
.case-code__spacer {
  flex: 1;
}
.case-code__tip {
  color: var(--eb-text-color-placeholder);
}
.case-code__panel {
  display: block;
  height: 100%;
  padding: var(--et-space-inline) var(--et-space-block);
}
.case-code__dir {
  margin-bottom: var(--et-space-block);
}
.case-code__dir-name {
  display: block;
  padding: 2px 6px;
  font-size: 11.5px;
  color: var(--eb-text-color-placeholder);
}
.case-code__file {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 5px 8px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  text-align: left;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-regular);
  cursor: pointer;
}
.case-code__file:hover {
  background: var(--eb-fill-color-light);
}
.case-code__file.is-active {
  color: var(--et-state-selected-fg);
  background: var(--et-state-selected-bg);
}
.case-code__file.is-dirty::after {
  content: '';
  width: 6px;
  height: 6px;
  margin-left: auto;
  border-radius: 50%;
  background: var(--eb-color-primary);
}
.case-code__search {
  display: flex;
  flex-direction: column;
  gap: var(--et-space-block);
  height: 100%;
  padding: var(--et-space-block);
}
.case-code__input {
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--eb-border-color);
  border-radius: var(--eb-border-radius-base, 4px);
  background: var(--eb-bg-color);
  font-size: 12.5px;
  color: var(--eb-text-color-primary);
  outline: none;
}
.case-code__input:focus {
  border-color: var(--eb-border-color-dark);
}
.case-code__hits {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: auto;
}
.case-code__hit {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 5px 8px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  text-align: left;
  font-size: 12.5px;
  color: var(--eb-text-color-regular);
  cursor: pointer;
}
.case-code__hit:hover {
  background: var(--eb-fill-color-light);
}
.case-code__hit-name {
  font-family: var(--eb-font-family-code, monospace);
}
.case-code__hit-meta {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--eb-text-color-placeholder);
}
.case-code__problem {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 5px 8px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  text-align: left;
  font-size: 12.5px;
  color: var(--eb-text-color-regular);
  cursor: pointer;
}
.case-code__problem:hover {
  background: var(--eb-fill-color-light);
}
.case-code__problem.is-active {
  background: var(--et-state-selected-bg);
}
.case-code__problem.is-active .case-code__problem-msg {
  color: var(--et-state-selected-fg);
}
.case-code__level {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 11px;
}
.case-code__level--error {
  color: var(--eb-color-danger);
  background: var(--eb-color-danger-light-9);
}
.case-code__level--warn {
  color: var(--eb-color-warning);
  background: var(--eb-color-warning-light-9);
}
.case-code__problem-msg {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.case-code__problem-pos,
.case-code__none {
  font-size: 11px;
  color: var(--eb-text-color-placeholder);
}
.case-code__none {
  padding: 6px var(--et-space-band-inline);
}
.case-code__term {
  margin: 0;
  padding: 3px var(--et-space-band-inline);
  font-family: var(--eb-font-family-code, monospace);
  font-size: 12px;
  color: var(--eb-text-color-regular);
}
.case-code__canvas {
  height: 100%;
  overflow: auto;
  background: var(--et-surface-stage);
}
.case-code__breadcrumb {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 26px;
  padding: 0 var(--et-space-band-inline);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  background: var(--et-surface-stage);
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}
.case-code__lang {
  margin-left: auto;
  color: var(--eb-text-color-placeholder);
}
.case-code__editor {
  padding: 8px 0 20px;
  font-family: var(--eb-font-family-code, monospace);
  font-size: 12.5px;
  line-height: 1.8;
}
.case-code__line {
  display: flex;
  gap: 12px;
  padding: 0 var(--et-space-band-inline);
  white-space: pre;
  color: var(--eb-text-color-primary);
  cursor: text;
}
.case-code__line.is-cursor {
  background: var(--et-state-selected-bg);
  box-shadow: inset 2px 0 0 var(--et-state-selected-fg);
}
.case-code__ln {
  width: 24px;
  flex-shrink: 0;
  text-align: right;
  color: var(--eb-text-color-placeholder);
  user-select: none;
}
</style>