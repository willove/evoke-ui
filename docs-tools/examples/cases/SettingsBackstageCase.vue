<template>
  <!-- 案例：设置中心（Backstage）—— 标题栏「文件」入口 + 全屏设置页 + 主界面工作台骨架 -->
  <div ref="rootRef" class="case-settings">
    <et-provider :density="settings.density">
      <et-workbench
        v-model:layout="layout"
        :default-layout="DEFAULT_LAYOUT"
        persist-key="case-settings-layout"
        @layout-corrupted="onCorrupted"
      >
        <template #titlebar>
          <et-title-bar title="设置中心" doc-title="偏好设置">
            <template #quick>
              <et-tool-button size="small" icon="file" label="文件" tip="打开全屏设置页" @click="openFile" />
            </template>
          </et-title-bar>
        </template>

        <template #toolbar>
          <div class="case-settings__tools">
            <et-tab-strip v-model="section" :tabs="SECTIONS" />
            <span class="case-settings__spacer" />
            <et-tool-button
              size="small"
              icon="check"
              label="保存"
              tip="保存设置"
              :disabled="!stateOf('save').enabled"
              @click="onCommand('save')"
            />
            <et-tool-button
              size="small"
              icon="refresh"
              label="恢复默认"
              tip="恢复默认设置"
              :disabled="!stateOf('reset').enabled"
              @click="onCommand('reset')"
            />
          </div>
        </template>

        <template #panel="{ panel }">
          <et-scroll-area v-if="panel.id === 'sections'" direction="vertical" class="case-settings__panel">
            <button
              v-for="s in SECTIONS"
              :key="s.id"
              type="button"
              class="case-settings__nav"
              :class="{ 'is-active': s.id === section }"
              @click="section = s.id"
            >
              <et-icon :name="s.icon" :size="14" />
              <span>{{ s.label }}</span>
            </button>
          </et-scroll-area>
        </template>

        <main class="case-settings__canvas">
          <section class="case-settings__summary">
            <h3 class="case-settings__summary-title">{{ current.label }}</h3>
            <div class="case-settings__summary-desc">{{ current.desc }}</div>
            <dl class="case-settings__facts">
              <div v-for="f in facts" :key="f.label" class="case-settings__fact">
                <dt class="case-settings__fact-label">{{ f.label }}</dt>
                <dd class="case-settings__fact-value">{{ f.value }}</dd>
              </div>
            </dl>
            <div class="case-settings__hint">「文件」打开全屏设置页</div>
          </section>
        </main>

        <template #statusbar>
          <et-status-bar :items="statusItems" @item-click="onStatusClick" />
        </template>
      </et-workbench>
    </et-provider>

    <et-backstage v-model="backstageOpen" title="文件" :nav-width="200">
      <template #nav>
        <button
          v-for="s in SECTIONS"
          :key="s.id"
          type="button"
          class="case-settings__nav"
          :class="{ 'is-active': s.id === section }"
          @click="section = s.id"
        >
          <et-icon :name="s.icon" :size="14" />
          <span>{{ s.label }}</span>
        </button>
      </template>

      <div class="case-settings__stage">
        <header class="case-settings__stage-head">
          <h3 class="case-settings__stage-title">{{ current.label }}</h3>
          <div class="case-settings__stage-desc">{{ current.desc }}</div>
        </header>

        <section v-for="(group, gi) in current.groups" :key="group.key" class="case-settings__group">
          <et-divider v-if="gi" direction="horizontal" />
          <h4 class="case-settings__group-title">{{ group.title }}</h4>

          <div v-for="row in group.rows" :key="row.key" class="case-settings__row">
            <div class="case-settings__row-text">
              <span class="case-settings__row-label">{{ row.label }}</span>
              <span v-if="row.desc" class="case-settings__row-desc">{{ row.desc }}</span>
            </div>
            <eb-switch v-if="row.type === 'switch'" v-model="settings[row.key]" size="small" />
            <et-select
              v-else-if="row.type === 'select'"
              v-model="settings[row.key]"
              :options="row.options"
              size="small"
            />
            <eb-segmented
              v-else-if="row.type === 'segment'"
              v-model="settings[row.key]"
              :options="row.options"
              size="small"
            />
            <et-key-hint v-else-if="row.type === 'key'" :combo="row.combo" />
          </div>
        </section>

        <section class="case-settings__group">
          <et-divider direction="horizontal" />
          <button
            type="button"
            class="case-settings__disclosure"
            :aria-expanded="advancedOpen"
            @click="advancedOpen = !advancedOpen"
          >
            <et-icon :name="advancedOpen ? 'arrow-down' : 'arrow-right'" :size="13" />
            <span>高级选项</span>
          </button>

          <template v-if="advancedOpen">
            <div v-for="row in ADVANCED_ROWS" :key="row.key" class="case-settings__row">
              <div class="case-settings__row-text">
                <span class="case-settings__row-label">{{ row.label }}</span>
                <span v-if="row.desc" class="case-settings__row-desc">{{ row.desc }}</span>
              </div>
              <et-select v-model="settings[row.key]" :options="row.options" size="small" />
            </div>
          </template>
        </section>
      </div>
    </et-backstage>

    <et-toast v-model="toast.open" :message="toast.message" type="success" :duration="2200" />
  </div>
</template>

<script setup>
/**
 * 案例：设置中心（Backstage）
 *
 * 主界面是工作台骨架（标题栏「文件」入口 + 分节 tab 条 + 概览 + 状态栏），
 * 全屏设置页走 EtBackstage：左侧分节 nav + 右侧表单区，两处共用同一个 section 与 settings。
 * 开关只改状态、不动布局：状态栏的「画布」读数在开关全屏页时保持不变。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { isImeComposing } from '@wil-works/evoke-business-ui'
import { comboMatchesEvent, createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const START_OPTIONS = [
  { value: 'last', label: '上次打开' },
  { value: 'new', label: '新建文档' },
  { value: 'home', label: '主页' },
]
const DENSITY_OPTIONS = [
  { value: 'compact', label: '紧凑' },
  { value: 'default', label: '默认' },
  { value: 'relaxed', label: '宽松' },
]
const THEME_OPTIONS = [
  { value: 'auto', label: '跟随系统' },
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' },
]
const CACHE_OPTIONS = [
  { value: '256', label: '256 MB' },
  { value: '512', label: '512 MB' },
  { value: '1024', label: '1024 MB' },
]

const KEYS = ['startView', 'restoreLayout', 'autoSave', 'showTips', 'wrap', 'theme', 'density', 'cacheSize']
const DEFAULTS = {
  startView: 'last',
  restoreLayout: true,
  autoSave: true,
  showTips: true,
  wrap: false,
  theme: 'auto',
  density: 'default',
  cacheSize: '512',
}

const SECTIONS = [
  {
    id: 'general',
    label: '常规',
    icon: 'windows',
    desc: '启动、保存与布局',
    groups: [
      {
        key: 'startup',
        title: '启动',
        rows: [
          { key: 'startView', type: 'select', label: '启动时打开', desc: '应用启动落在哪一屏', options: START_OPTIONS },
          { key: 'restoreLayout', type: 'switch', label: '恢复上次布局', desc: '读回停靠与面板尺寸' },
        ],
      },
      {
        key: 'storage',
        title: '保存',
        rows: [{ key: 'autoSave', type: 'switch', label: '自动保存', desc: '每 5 分钟写一次盘' }],
      },
    ],
  },
  {
    id: 'editor',
    label: '编辑器',
    icon: 'edit',
    desc: '编辑与提示',
    groups: [
      {
        key: 'editing',
        title: '编辑',
        rows: [
          { key: 'showTips', type: 'switch', label: '显示快捷键提示', desc: '工具区尾部的键位提示' },
          { key: 'wrap', type: 'switch', label: '长行自动换行', desc: '关闭后横向滚动' },
        ],
      },
    ],
  },
  {
    id: 'appearance',
    label: '外观',
    icon: 'palette',
    desc: '密度与主题',
    groups: [
      {
        key: 'density',
        title: '界面密度',
        rows: [{ key: 'density', type: 'segment', label: '密度档', desc: '写入根属性，三档即时生效', options: DENSITY_OPTIONS }],
      },
      {
        key: 'theme',
        title: '主题',
        rows: [{ key: 'theme', type: 'select', label: '主题', desc: '跟随系统 / 亮色 / 暗色', options: THEME_OPTIONS }],
      },
    ],
  },
  {
    id: 'keys',
    label: '快捷键',
    icon: 'keyboard',
    desc: '键位由命令表声明',
    groups: [
      {
        key: 'common',
        title: '常用',
        rows: [
          { key: 'k-save', type: 'key', label: '保存设置', combo: 'mod+s' },
          { key: 'k-file', type: 'key', label: '打开全屏设置页', combo: 'mod+o' },
          { key: 'k-close', type: 'key', label: '关闭全屏页', combo: 'esc' },
        ],
      },
    ],
  },
]

const ADVANCED_ROWS = [
  { key: 'cacheSize', label: '缓存上限', desc: '超过后自动清理旧缓存', options: CACHE_OPTIONS },
]

const DEFAULT_LAYOUT = {
  docks: [
    {
      id: 'left',
      side: 'left',
      panels: [{ id: 'sections', title: '分节', size: 160, min: 132, max: 220 }],
    },
  ],
  maximized: null,
}

const layout = ref(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))
const settings = reactive({ ...DEFAULTS })
const baseline = reactive({ ...DEFAULTS })
const section = ref(SECTIONS[0].id)
const backstageOpen = ref(false)
const advancedOpen = ref(false)
const toast = reactive({ open: false, message: '' })
const rootRef = ref(null)
const canvasSize = reactive({ w: 0, h: 0 })
let sizeObserver = null

const current = computed(() => SECTIONS.find((s) => s.id === section.value) ?? SECTIONS[0])

const dirty = computed(() => KEYS.some((k) => settings[k] !== baseline[k]))

const facts = computed(() => [
  { label: '启动时打开', value: labelOf(START_OPTIONS, settings.startView) },
  { label: '自动保存', value: settings.autoSave ? '开' : '关' },
  { label: '界面密度', value: labelOf(DENSITY_OPTIONS, settings.density) },
  { label: '恢复上次布局', value: settings.restoreLayout ? '开' : '关' },
])

const statusItems = computed(() => [
  { key: 'section', label: '分节', value: current.value.label },
  { key: 'density', label: '密度', value: labelOf(DENSITY_OPTIONS, settings.density) },
  { key: 'dirty', label: '状态', value: dirty.value ? '未保存' : '已保存' },
  { key: 'canvas', label: '画布', value: `${canvasSize.w}×${canvasSize.h}` },
])

/** 一份 ctx 喂命令表：dirty 决定保存 / 恢复默认是否可点 */
const ctx = computed(() => ({ dirty: dirty.value, section: section.value, backstage: backstageOpen.value }))

const registry = createCommandRegistry()
registry.registerAll([
  {
    id: 'save', title: '保存设置', keys: 'mod+s', icon: 'check', group: '设置', surfaces: ['toolbar'],
    enabled: (c) => c.dirty,
    run: () => save(),
  },
  {
    id: 'reset', title: '恢复默认', icon: 'refresh', group: '设置', surfaces: ['toolbar'],
    enabled: (c) => c.dirty,
    run: () => resetDefaults(),
  },
])

/** enabled / active 只有一处实现（registry.state），模板只消费推演结果 */
const stateOf = (id) => registry.state(id, ctx.value)

function labelOf(options, value) {
  return options.find((o) => o.value === value)?.label ?? String(value)
}

function save() {
  KEYS.forEach((k) => {
    baseline[k] = settings[k]
  })
}

function resetDefaults() {
  Object.assign(settings, DEFAULTS)
}

function openFile() {
  backstageOpen.value = true
}

function onCommand(id) {
  if (!registry.run(id, ctx.value)) return
  toast.open = true
  toast.message = id === 'save' ? '设置已保存' : '已恢复默认设置'
}

function onStatusClick(key) {
  toast.open = true
  toast.message = `状态栏条目：${key}`
}

function onCorrupted() {
  toast.open = true
  toast.message = '布局已重置为默认'
}

onMounted(() => {
  if (!rootRef.value || typeof ResizeObserver === 'undefined') return
  const apply = () => {
    const rect = rootRef.value.getBoundingClientRect()
    canvasSize.w = Math.round(rect.width)
    canvasSize.h = Math.round(rect.height)
  }
  apply()
  sizeObserver = new ResizeObserver(apply)
  sizeObserver.observe(rootRef.value)
})

onBeforeUnmount(() => {
  sizeObserver?.disconnect()
  sizeObserver = null
  document.removeEventListener('keydown', onGlobalKeydown)
})

// 命令表里声明的键位要真响应：⌘S 保存（组字守卫与键位解析走运行时）
function onGlobalKeydown(e) {
  if (isImeComposing(e)) return
  if (!comboMatchesEvent('mod+s', e)) return
  e.preventDefault()
  if (ctx.value.dirty) onCommand('save')
}
onMounted(() => document.addEventListener('keydown', onGlobalKeydown))
</script>

<style scoped>
.case-settings {
  height: 460px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  overflow: hidden;
}
.case-settings :deep(.et-provider),
.case-settings :deep(.et-workbench) {
  height: 100%;
}

.case-settings__tools {
  display: flex;
  align-items: center;
  gap: var(--et-space-block);
  min-height: var(--et-chrome-tabstrip-height);
  padding: 3px var(--et-space-band-inline);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  background: var(--et-chrome-bg);
}
.case-settings__spacer {
  flex: 1;
}

.case-settings__canvas {
  height: 100%;
  padding: 14px var(--et-space-band-inline);
  overflow: auto;
  background: var(--eb-bg-color);
}
.case-settings__panel {
  display: block;
  height: 100%;
  padding: var(--et-space-inline) var(--et-space-block);
}
.case-settings__summary-title {
  margin: 0 0 4px;
  font-size: 15px;
  color: var(--eb-text-color-primary);
}
.case-settings__summary-desc {
  margin: 0 0 14px;
  font-size: 12.5px;
  color: var(--eb-text-color-secondary);
}
.case-settings__facts {
  margin: 0;
}
.case-settings__fact {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid var(--eb-border-color-lighter);
}
.case-settings__fact-label {
  min-width: 96px;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-regular);
}
.case-settings__fact-value {
  margin: 0;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
}
.case-settings__hint {
  margin: 14px 0 0;
  font-size: 12px;
  color: var(--eb-text-color-placeholder);
}

/* 全屏页（Teleport 到 body，样式只挂类名，不依赖 .case-settings 祖先） */
.case-settings__nav {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  text-align: left;
  font-size: 13.5px;
  color: var(--eb-text-color-regular);
  cursor: pointer;
}
.case-settings__nav:hover {
  background: var(--eb-fill-color-light);
}
.case-settings__nav.is-active {
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}
.case-settings__stage {
  max-width: 560px;
  padding: 4px 0 24px;
}
.case-settings__stage-title {
  margin: 0 0 4px;
  font-size: 18px;
  color: var(--eb-text-color-primary);
}
.case-settings__stage-desc {
  margin: 0 0 18px;
  font-size: 12.5px;
  color: var(--eb-text-color-secondary);
}
.case-settings__group-title {
  margin: 12px 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--eb-text-color-primary);
}
.case-settings__row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 9px 0;
}
/* 控件列定宽并右对齐：标签列拿剩余宽度（否则 select 的固有宽度会把标签挤成竖排单字） */
.case-settings__row > :last-child {
  flex: 0 0 200px;
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}
.case-settings__row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.case-settings__row-label {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
}
.case-settings__row-desc {
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}
.case-settings__disclosure {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0 2px;
  padding: 4px 0;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--eb-text-color-regular);
  cursor: pointer;
}
.case-settings__disclosure:hover {
  color: var(--eb-color-primary);
}
</style>