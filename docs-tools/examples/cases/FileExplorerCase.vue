<template>
  <!-- 案例：文件资源管理器 —— 标题栏 + 工具区 + 目录树停靠 + 文件画布 + 预览/属性停靠 + 状态栏 -->
  <div class="case-file">
    <et-workbench
      v-model:layout="layout"
      :default-layout="DEFAULT_LAYOUT"
      persist-key="case-file-layout"
      @layout-corrupted="onCorrupted"
    >
      <template #titlebar>
        <et-title-bar title="资源管理器" :doc-title="currentFolderNode.name" @window-control="onWindowControl" />
      </template>

      <template #toolbar>
        <et-ribbon-bar
          v-model="activeTab"
          v-model:collapsed="collapsed"
          :schema="RIBBON_SCHEMA"
          :registry="registry"
          :ctx="ctx"
          persist-key="case-file-ribbon"
          @command="onCommand"
        />
        <div class="case-file__aux">
          <div class="case-file__crumbs">
            <template v-for="(seg, i) in crumbs" :key="seg.id">
              <button type="button" class="case-file__crumb" @click="gotoFolder(seg.id)">{{ seg.name }}</button>
              <et-icon v-if="i < crumbs.length - 1" name="arrow-right" :size="11" class="case-file__crumb-sep" />
            </template>
          </div>
          <span class="case-file__spacer" />
          <et-tool-button
            size="small"
            icon="list-unordered"
            label="列表视图"
            :active="viewMode === 'list'"
            :tip="{ title: '列表视图' }"
            @click="onCommand('view-list')"
          />
          <et-tool-button
            size="small"
            icon="layout-grid"
            label="图标视图"
            :active="viewMode === 'grid'"
            :tip="{ title: '图标视图' }"
            @click="onCommand('view-grid')"
          />
          <et-dropdown trigger="click" placement="bottom-end" @command="onSortCommand">
            <template #trigger>
              <et-tool-button
                size="small"
                icon="arrow-down"
                :label="SORT_LABEL[sortKey]"
                :tip="{ title: '排序', desc: SORT_LABEL[sortKey] }"
              />
            </template>
            <template #dropdown>
              <eb-dropdown-menu>
                <eb-dropdown-item command="name" label="按名称" icon="file-text" />
                <eb-dropdown-item command="size" label="按大小" icon="price-tag" />
                <eb-dropdown-item command="time" label="按时间" icon="time" />
              </eb-dropdown-menu>
            </template>
          </et-dropdown>
          <input
            v-model="filterText"
            class="case-file__filter"
            type="text"
            placeholder="筛选当前目录"
            aria-label="筛选当前目录"
          >
        </div>
      </template>

      <template #panel="{ panel }">
        <et-scroll-area v-if="panel.id === 'tree'" direction="vertical" class="case-file__panel">
          <div class="case-file__tree">
            <div class="case-file__tree-row" :class="{ 'is-current': currentFolder === 'root' }">
              <button
                type="button"
                class="case-file__caret"
                :aria-label="isOpen('root') ? '折叠' : '展开'"
                @click="toggleNode('root')"
              >
                <et-icon :name="isOpen('root') ? 'arrow-down' : 'arrow-right'" :size="12" />
              </button>
              <button type="button" class="case-file__tree-name" @click="gotoFolder('root')">
                <et-icon :name="isOpen('root') ? 'folder-open' : 'folder'" :size="14" class="case-file__icon" />
                <span>{{ FOLDERS.root.name }}</span>
              </button>
            </div>
            <ul v-show="isOpen('root')" class="case-file__tree-list">
              <li v-for="f in childrenOf('root')" :key="f.id">
                <div class="case-file__tree-row" :class="{ 'is-current': currentFolder === f.id }">
                  <button
                    type="button"
                    class="case-file__caret"
                    :aria-label="isOpen(f.id) ? '折叠' : '展开'"
                    @click="toggleNode(f.id)"
                  >
                    <et-icon :name="isOpen(f.id) ? 'arrow-down' : 'arrow-right'" :size="12" />
                  </button>
                  <button type="button" class="case-file__tree-name" @click="gotoFolder(f.id)">
                    <et-icon :name="isOpen(f.id) ? 'folder-open' : 'folder'" :size="14" class="case-file__icon" />
                    <span>{{ f.name }}</span>
                    <span class="case-file__tree-count">{{ countOf(f.id) }}</span>
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </et-scroll-area>

        <div v-else-if="panel.id === 'preview'" class="case-file__panel case-file__preview">
          <p v-if="!selected" class="case-file__hint">未选择项目</p>
          <template v-else>
            <et-icon :name="previewIcon" :size="28" class="case-file__preview-icon" />
            <p class="case-file__preview-name">{{ displayName(selected) }}</p>
            <p class="case-file__preview-meta">{{ previewMeta }}</p>
          </template>
        </div>

        <div v-else class="case-file__panel">
          <p v-if="!selected" class="case-file__hint">未选择项目</p>
          <div v-else class="case-file__props">
            <div class="case-file__prop"><span>名称</span><span>{{ displayName(selected) }}</span></div>
            <div class="case-file__prop"><span>类型</span><span>{{ typeLabel(selected) }}</span></div>
            <div class="case-file__prop">
              <span>{{ selected.kind === 'folder' ? '项目数' : '大小' }}</span>
              <span>{{ selected.kind === 'folder' ? `${selected.count} 项` : formatSize(selected.bytes) }}</span>
            </div>
            <div class="case-file__prop"><span>修改时间</span><span>{{ selected.modified ?? '—' }}</span></div>
          </div>
        </div>
      </template>

      <et-context-menu :registry="registry" :schema="CONTEXT_SCHEMA" :ctx="ctx" @command="onCommand">
        <main class="case-file__canvas">
          <et-empty-state
            v-if="!items.length && filterText"
            icon="file-search"
            title="没有匹配的文件"
            desc="换个关键词。"
            action-label="清空筛选"
            @action="clearFilter"
          />
          <et-empty-state
            v-else-if="!items.length"
            icon="upload"
            title="这个文件夹是空的"
            desc="上传文件，或从别处粘贴。"
            action-label="上传"
            @action="onCommand('upload')"
          />
          <et-scroll-area v-else class="case-file__scroll">
            <div class="case-file__items" :class="viewMode === 'grid' ? 'is-grid' : 'is-list'">
              <div
                v-for="it in items"
                :key="it.id"
                class="case-file__row"
                :class="{ 'is-sel': selectedId === it.id }"
                @contextmenu="selectItem(it.id)"
              >
                <et-icon
                  :name="iconFor(it)"
                  :size="viewMode === 'grid' ? 28 : 16"
                  class="case-file__row-icon"
                />
                <input
                  v-if="renamingId === it.id"
                  ref="renameRef"
                  v-model="renameDraft"
                  class="case-file__rename"
                  aria-label="重命名"
                  @keyup.enter="commitRename"
                  @keydown.esc="cancelRename"
                  @blur="commitRename"
                >
                <button
                  v-else
                  type="button"
                  class="case-file__row-btn"
                  @click="selectItem(it.id)"
                  @dblclick="openItem(it)"
                >
                  <span class="case-file__name">{{ displayName(it) }}</span>
                </button>
                <span v-if="viewMode === 'list'" class="case-file__size">
                  {{ it.kind === 'folder' ? `${countOf(it.id)} 项` : formatSize(it.bytes) }}
                </span>
                <span v-if="viewMode === 'list'" class="case-file__time">{{ it.modified ?? '—' }}</span>
              </div>
            </div>
          </et-scroll-area>
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
 * 案例：文件资源管理器（消费方形态）
 *
 * 目录树 / 文件画布 / 预览与属性三块产品内容，chrome 全部走 et-*：
 * 命令表驱动工具区与右键，停靠树持久化，空态接管空目录与无命中。
 * 选中项是一份状态：预览、属性、状态栏与命令 enabled 都从它推演。
 */
import { computed, nextTick, reactive, ref } from 'vue'
import { createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const SORT_LABEL = { name: '按名称', size: '按大小', time: '按时间' }

const EXT_ICON = {
  md: 'file-text',
  docx: 'file-word',
  xlsx: 'file-excel',
  pdf: 'file-pdf',
  png: 'file-image',
  svg: 'file-image',
  zip: 'file-zip',
  env: 'file-code',
}

const DEFAULT_LAYOUT = {
  docks: [
    {
      id: 'left',
      side: 'left',
      panels: [{ id: 'tree', title: '目录', size: 168, min: 140, max: 240 }],
    },
    {
      id: 'right',
      side: 'right',
      panels: [
        { id: 'preview', title: '预览', size: 140, min: 110, max: 240 },
        { id: 'props', title: '属性', size: 150, min: 130, max: 240 },
      ],
    },
  ],
  maximized: null,
}

const CONTEXT_SCHEMA = [
  { key: 'c-open', type: 'item', command: 'open' },
  { key: 'c-sep1', type: 'separator' },
  { key: 'c-copy', type: 'item', command: 'copy' },
  { key: 'c-cut', type: 'item', command: 'cut' },
  { key: 'c-paste', type: 'item', command: 'paste' },
  { key: 'c-rename', type: 'item', command: 'rename' },
  { key: 'c-delete', type: 'item', command: 'delete' },
  { key: 'c-sep2', type: 'separator' },
  {
    key: 'c-more',
    type: 'submenu',
    label: '视图',
    children: [
      { key: 'c-list', type: 'item', command: 'view-list' },
      { key: 'c-grid', type: 'item', command: 'view-grid' },
    ],
  },
]

function mkFile(id, name, bytes, modified, ext) {
  return { id, name, kind: 'file', bytes, modified, ext }
}

function mkFolder(id, name) {
  return { id, name, kind: 'folder' }
}

const FOLDERS = reactive({
  root: {
    id: 'root',
    name: '项目资料',
    parent: null,
    items: [
      mkFolder('docs', '文档'),
      mkFolder('images', '图片'),
      mkFolder('archive', '归档'),
      mkFile('readme', 'README.md', 4200, '09-24 10:12', 'md'),
      mkFile('report', '季度报表.xlsx', 128000, '09-25 18:03', 'xlsx'),
      mkFile('spec', '接口规范.pdf', 2400000, '09-20 09:40', 'pdf'),
      mkFile('logo', 'logo.png', 86000, '09-18 14:22', 'png'),
      mkFile('assets', '素材包.zip', 18000000, '09-12 11:05', 'zip'),
      mkFile('config', 'config.env', 300, '09-10 08:30', 'env'),
    ],
  },
  docs: {
    id: 'docs',
    name: '文档',
    parent: 'root',
    items: [
      mkFile('plan', '改造方案.md', 12000, '09-26 09:15', 'md'),
      mkFile('minutes', '评审纪要.docx', 46000, '09-25 16:40', 'docx'),
      mkFile('api', 'API 清单.xlsx', 78000, '09-22 11:20', 'xlsx'),
    ],
  },
  images: {
    id: 'images',
    name: '图片',
    parent: 'root',
    items: [
      mkFile('banner', '首页横幅.png', 320000, '09-21 15:02', 'png'),
      mkFile('avatar', '头像.svg', 5400, '09-19 10:31', 'svg'),
    ],
  },
  archive: { id: 'archive', name: '归档', parent: 'root', items: [] },
})

const layout = ref(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))
const activeTab = ref('home')
const collapsed = ref(false)
const currentFolder = ref('root')
const selectedId = ref('')
const filterText = ref('')
const viewMode = ref('list')
const sortKey = ref('name')
const showExt = ref(false)
const clipboard = ref('')
const renamingId = ref('')
const renameDraft = ref('')
const renameRef = ref([])
const expanded = reactive(new Set(['root']))
const toast = reactive({ open: false, message: '' })
let seq = 0

const currentFolderNode = computed(() => FOLDERS[currentFolder.value])

const crumbs = computed(() => {
  const out = []
  let node = currentFolderNode.value
  while (node) {
    out.unshift({ id: node.id, name: node.name })
    node = node.parent ? FOLDERS[node.parent] : null
  }
  return out
})

const items = computed(() => {
  const list = [...(currentFolderNode.value?.items ?? [])]
  const q = filterText.value.trim().toLowerCase()
  const hit = q ? list.filter((it) => it.name.toLowerCase().includes(q)) : list
  return hit.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
    if (sortKey.value === 'size') return (b.bytes ?? 0) - (a.bytes ?? 0)
    if (sortKey.value === 'time') return String(b.modified ?? '').localeCompare(String(a.modified ?? ''))
    return a.name.localeCompare(b.name, 'zh')
  })
})

const selected = computed(() => {
  if (!selectedId.value) return null
  const folder = FOLDERS[selectedId.value]
  if (folder) return { id: folder.id, name: folder.name, kind: 'folder', count: folder.items.length }
  const item = (currentFolderNode.value?.items ?? []).find((i) => i.id === selectedId.value)
  return item ? { ...item, count: 0 } : null
})

const previewIcon = computed(() => {
  if (!selected.value) return 'file'
  if (selected.value.kind === 'folder') return 'folder-open'
  return EXT_ICON[selected.value.ext] ?? 'file'
})

const previewMeta = computed(() => {
  if (!selected.value) return ''
  if (selected.value.kind === 'folder') return `${selected.value.count} 个项目`
  return `${formatSize(selected.value.bytes)} · ${(selected.value.ext ?? '').toUpperCase()}`
})

/** 资源管理器上下文：喂给 registry.state —— enabled / active 全从这一份推演 */
const ctx = computed(() => ({
  hasSelection: Boolean(selected.value),
  selectedKind: selected.value?.kind ?? '',
  hasClipboard: Boolean(clipboard.value),
  view: viewMode.value,
  showExt: showExt.value,
}))

const statusItems = computed(() => [
  { key: 'folder', label: '位置', value: currentFolderNode.value.name },
  { key: 'count', label: '项目', value: String(items.value.length) },
  { key: 'sel', label: '选中', value: selected.value ? displayName(selected.value) : '—' },
  { key: 'view', label: '视图', value: viewMode.value === 'grid' ? '图标' : '列表' },
])

const registry = createCommandRegistry()
registry.registerAll([
  {
    id: 'open',
    title: '打开',
    icon: 'folder-open',
    group: '打开',
    surfaces: ['context', 'palette'],
    enabled: (c) => c.hasSelection,
    run: () => openItem(selected.value),
  },
  {
    id: 'new-folder',
    title: '新建文件夹',
    icon: 'folder',
    group: '新建',
    surfaces: ['toolbar', 'palette'],
    run: () => createFolder(),
  },
  {
    id: 'upload',
    title: '上传文件',
    icon: 'upload',
    group: '新建',
    surfaces: ['toolbar', 'palette'],
    run: () => uploadFile(),
  },
  {
    id: 'copy',
    title: '复制',
    keys: 'mod+c',
    icon: 'copy',
    group: '剪贴板',
    surfaces: ['toolbar', 'context', 'palette'],
    enabled: (c) => c.hasSelection,
    run: () => note(`已复制 ${selected.value?.name ?? ''}`),
  },
  {
    id: 'cut',
    title: '剪切',
    keys: 'mod+x',
    icon: 'scissors',
    group: '剪贴板',
    surfaces: ['toolbar', 'context', 'palette'],
    enabled: (c) => c.hasSelection && c.selectedKind === 'file',
    run: () => cutItem(),
  },
  {
    id: 'paste',
    title: '粘贴',
    keys: 'mod+v',
    icon: 'file-copy',
    group: '剪贴板',
    surfaces: ['toolbar', 'context', 'palette'],
    enabled: (c) => c.hasClipboard,
    run: () => pasteItem(),
  },
  {
    id: 'rename',
    title: '重命名',
    keys: 'f2',
    icon: 'edit',
    group: '组织',
    surfaces: ['toolbar', 'context', 'palette'],
    enabled: (c) => c.hasSelection,
    run: () => startRename(),
  },
  {
    id: 'delete',
    title: '删除',
    keys: 'delete',
    icon: 'delete',
    group: '组织',
    surfaces: ['toolbar', 'context', 'palette'],
    enabled: (c) => c.hasSelection,
    run: () => deleteItem(),
  },
  {
    id: 'refresh',
    title: '刷新',
    icon: 'refresh',
    group: '组织',
    surfaces: ['toolbar', 'context', 'palette'],
    run: () => note('已刷新当前目录'),
  },
  {
    id: 'view-list',
    title: '列表视图',
    icon: 'list-unordered',
    group: '视图',
    surfaces: ['toolbar', 'palette'],
    active: (c) => c.view === 'list',
    run: () => {
      viewMode.value = 'list'
    },
  },
  {
    id: 'view-grid',
    title: '图标视图',
    icon: 'layout-grid',
    group: '视图',
    surfaces: ['toolbar', 'palette'],
    active: (c) => c.view === 'grid',
    run: () => {
      viewMode.value = 'grid'
    },
  },
  {
    id: 'toggle-ext',
    title: '显示扩展名',
    icon: 'file-text',
    group: '视图',
    surfaces: ['toolbar', 'palette'],
    active: (c) => c.showExt,
    run: () => {
      showExt.value = !showExt.value
      note(showExt.value ? '已显示扩展名' : '已隐藏扩展名')
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
        key: 'g-new',
        type: 'group',
        label: '新建',
        children: [
          { key: 'i-new', type: 'item', command: 'new-folder', grid: { rowSpan: 2 } },
          { key: 'i-upload', type: 'item', command: 'upload', grid: { rowSpan: 2 } },
        ],
      },
      {
        key: 'g-clip',
        type: 'group',
        label: '剪贴板',
        children: [
          { key: 'i-copy', type: 'item', command: 'copy', grid: { rowSpan: 2 } },
          { key: 'i-cut', type: 'item', command: 'cut', grid: { rowSpan: 2 } },
          { key: 'i-paste', type: 'item', command: 'paste', grid: { rowSpan: 2 } },
        ],
      },
      {
        key: 'g-org',
        type: 'group',
        label: '组织',
        children: [
          { key: 'i-rename', type: 'item', command: 'rename', grid: { rowSpan: 2 } },
          { key: 'i-delete', type: 'item', command: 'delete', grid: { rowSpan: 2 } },
        ],
      },
    ],
  },
  {
    key: 'view',
    type: 'tab',
    label: '查看',
    children: [
      {
        key: 'g-view',
        type: 'group',
        label: '视图',
        children: [
          { key: 'i-list', type: 'item', command: 'view-list', grid: { rowSpan: 2 } },
          { key: 'i-grid', type: 'item', command: 'view-grid', grid: { rowSpan: 2 } },
        ],
      },
      {
        key: 'g-show',
        type: 'group',
        label: '显示',
        children: [
          { key: 'i-ext', type: 'item', command: 'toggle-ext', grid: { rowSpan: 2 } },
          { key: 'i-refresh', type: 'item', command: 'refresh', grid: { rowSpan: 2 } },
        ],
      },
    ],
  },
]

function isOpen(id) {
  return expanded.has(id)
}

function toggleNode(id) {
  if (expanded.has(id)) expanded.delete(id)
  else expanded.add(id)
}

function childrenOf(id) {
  return Object.values(FOLDERS).filter((f) => f.parent === id)
}

function countOf(id) {
  return FOLDERS[id]?.items.length ?? 0
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return '—'
  if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`
  if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`
  return `${bytes} B`
}

function typeLabel(item) {
  if (item.kind === 'folder') return '文件夹'
  return `${(item.ext ?? '').toUpperCase()} 文件`
}

function displayName(item) {
  if (!item) return ''
  if (item.kind === 'file' && !showExt.value && item.ext) {
    return item.name.replace(/\.[^.]+$/, '')
  }
  return item.name
}

function iconFor(item) {
  if (item.kind === 'folder') return isOpen(item.id) ? 'folder-open' : 'folder'
  return EXT_ICON[item.ext] ?? 'file'
}

function gotoFolder(id) {
  currentFolder.value = id
  selectedId.value = ''
  filterText.value = ''
  expanded.add(id)
}

function selectItem(id) {
  selectedId.value = id
}

function clearFilter() {
  filterText.value = ''
}

function openItem(item) {
  if (!item) return
  if (item.kind === 'folder') {
    gotoFolder(item.id)
    return
  }
  note(`已打开 ${item.name}`)
}

function entityById(id) {
  if (FOLDERS[id]) return FOLDERS[id]
  for (const folder of Object.values(FOLDERS)) {
    const hit = folder.items.find((i) => i.id === id)
    if (hit) return hit
  }
  return null
}

async function startRename() {
  if (!selected.value) return
  renamingId.value = selected.value.id
  renameDraft.value = selected.value.name
  await nextTick()
  renameRef.value?.[0]?.focus()
  renameRef.value?.[0]?.select()
}

function commitRename() {
  const entity = entityById(renamingId.value)
  const next = renameDraft.value.trim()
  if (entity && next) entity.name = next
  renamingId.value = ''
}

function cancelRename() {
  renamingId.value = ''
}

function createFolder() {
  seq += 1
  const folder = mkFolder(`folder-${seq}`, `新建文件夹 ${seq}`)
  currentFolderNode.value.items.unshift(folder)
  selectedId.value = folder.id
  note(`已新建 ${folder.name}`)
}

function uploadFile() {
  seq += 1
  const file = mkFile(`upload-${seq}`, `上传素材 ${seq}.png`, 240000, '刚刚', 'png')
  currentFolderNode.value.items.unshift(file)
  selectedId.value = file.id
  note(`已上传 ${file.name}`)
}

function cutItem() {
  if (!selected.value) return
  clipboard.value = selected.value.id
  note(`已剪切 ${selected.value.name}`)
}

function pasteItem() {
  if (!clipboard.value) return
  const target = currentFolderNode.value
  const from = Object.values(FOLDERS).find((f) => f.items.some((i) => i.id === clipboard.value))
  if (!from || from.id === target.id) return
  const index = from.items.findIndex((i) => i.id === clipboard.value)
  const [moved] = from.items.splice(index, 1)
  target.items.unshift(moved)
  clipboard.value = ''
  selectedId.value = ''
  note(`已粘贴到 ${target.name}`)
}

function deleteItem() {
  if (!selected.value) return
  const id = selected.value.id
  const name = selected.value.name
  const index = currentFolderNode.value.items.findIndex((i) => i.id === id)
  if (index >= 0) currentFolderNode.value.items.splice(index, 1)
  if (FOLDERS[id]) delete FOLDERS[id]
  selectedId.value = ''
  note(`已删除 ${name}`)
}

function onSortCommand(value) {
  sortKey.value = value
  note(`排序：${SORT_LABEL[value]}`)
}

function onCommand(id) {
  // 反馈由各命令的 run 自己给（选中、剪贴、删除、视图切换都有各自的可见结果）
  registry.run(id, ctx.value)
}

function onStatusClick(key) {
  note(`状态栏：${key}`)
}

function onWindowControl(name) {
  note(`窗口控制：${name}`)
}

function onCorrupted() {
  note('布局已重置为默认')
}

function note(message) {
  toast.open = true
  toast.message = message
}
</script>

<style scoped>
.case-file {
  height: 460px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.case-file :deep(.et-workbench) {
  height: 100%;
}
.case-file__aux {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: calc(var(--et-size-toolbtn-small) + 6px);
  padding: 0 var(--et-space-band-inline);
  border-top: 1px solid var(--eb-border-color-lighter);
  background: var(--eb-bg-color);
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}
.case-file__crumbs {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  overflow: hidden;
}
.case-file__crumb {
  padding: 2px 6px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.case-file__crumb:hover {
  background: var(--eb-fill-color-light);
}
.case-file__crumb-sep {
  color: var(--eb-text-color-placeholder);
}
.case-file__spacer {
  flex: 1;
}
.case-file__filter {
  width: 132px;
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--eb-border-color);
  border-radius: var(--eb-border-radius-base, 4px);
  background: var(--eb-bg-color);
  color: var(--eb-text-color-primary);
  font-size: 12px;
  outline: none;
}
.case-file__filter:focus {
  border-color: var(--eb-border-color-dark);
}
.case-file__canvas {
  height: 100%;
  background: var(--et-surface-stage);
}
.case-file__scroll {
  height: 100%;
}
.case-file__items {
  padding: var(--et-space-inline) var(--et-space-block);
}
.case-file__items.is-list {
  display: flex;
  flex-direction: column;
}
.case-file__items.is-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--et-space-block);
}
.case-file__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 4px 6px;
  border-radius: var(--eb-border-radius-base, 4px);
  color: var(--eb-text-color-regular);
}
.case-file__items.is-grid .case-file__row {
  flex-direction: column;
  gap: 6px;
  padding: 10px 6px;
  text-align: center;
}
.case-file__row:hover {
  background: var(--eb-fill-color-light);
}
.case-file__row.is-sel {
  background: var(--et-state-content-selected-bg);
  color: var(--et-state-content-selected-fg);
}
.case-file__row-icon {
  flex-shrink: 0;
  color: var(--eb-text-color-secondary);
}
.case-file__row.is-sel .case-file__row-icon {
  color: var(--et-state-content-selected-fg);
}
.case-file__row-btn {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.case-file__items.is-grid .case-file__row-btn {
  text-align: center;
}
.case-file__name {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.case-file__rename {
  flex: 1;
  min-width: 0;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--eb-color-primary);
  border-radius: var(--eb-border-radius-base, 4px);
  background: var(--eb-bg-color);
  color: var(--eb-text-color-primary);
  font-size: 13px;
  outline: none;
}
.case-file__size,
.case-file__time {
  flex-shrink: 0;
  font-size: 11.5px;
  color: var(--eb-text-color-placeholder);
}
.case-file__size {
  width: 64px;
  text-align: right;
}
.case-file__time {
  width: 84px;
  text-align: right;
}
.case-file__panel {
  display: block;
  height: 100%;
  padding: var(--et-space-inline) var(--et-space-block);
}
.case-file__tree-row {
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: var(--eb-border-radius-base, 4px);
}
.case-file__tree-row:hover {
  background: var(--eb-fill-color-light);
}
.case-file__tree-row.is-current {
  background: var(--et-state-selected-bg);
}
.case-file__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--eb-text-color-placeholder);
  cursor: pointer;
  flex-shrink: 0;
}
.case-file__tree-name {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  height: 24px;
  padding: 0 6px 0 0;
  border: none;
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.case-file__tree-row.is-current .case-file__tree-name {
  color: var(--et-state-selected-fg);
}
.case-file__tree-list {
  margin: 0;
  padding-left: 14px;
  list-style: none;
}
.case-file__tree-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--eb-text-color-placeholder);
}
.case-file__icon {
  color: var(--eb-text-color-secondary);
  flex-shrink: 0;
}
.case-file__tree-row.is-current .case-file__icon {
  color: var(--et-state-selected-fg);
}
.case-file__preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}
.case-file__preview-icon {
  color: var(--eb-color-primary);
}
.case-file__preview-name {
  margin: 0;
  font-size: 13px;
  color: var(--eb-text-color-primary);
  word-break: break-all;
}
.case-file__preview-meta {
  margin: 0;
  font-size: 12px;
  color: var(--eb-text-color-placeholder);
}
.case-file__hint {
  margin: 0;
  padding: 8px 6px;
  font-size: 13px;
  color: var(--eb-text-color-placeholder);
}
.case-file__props {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 2px;
}
.case-file__prop {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
  color: var(--eb-text-color-primary);
}
.case-file__prop > span:first-child {
  width: 52px;
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
}
.case-file__prop > span:last-child {
  min-width: 0;
  /* 只在放不下时断行，且优先在空白处断——break-all 会把「2.4 MB」拆成「2.4 M / B」 */
  overflow-wrap: anywhere;
}
</style>